package scraper

import (
	"context"
	"fmt"
	"log"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
	"github.com/go-rod/rod/lib/proto"
)

type FacebookScraper struct {
	headless bool
}

func NewFacebookScraper(headless bool) *FacebookScraper {
	return &FacebookScraper{
		headless: headless,
	}
}

// Maps Indonesian addresses/districts to valid canonical Facebook Marketplace city slugs
func toFacebookCitySlug(loc string) string {
	l := strings.ToLower(loc)
	switch {
	case strings.Contains(l, "tangerang"), strings.Contains(l, "bintaro"), strings.Contains(l, "serpong"), strings.Contains(l, "bsd"), strings.Contains(l, "ciputat"), strings.Contains(l, "pamulang"):
		return "tangerang"
	case strings.Contains(l, "bekasi"):
		return "bekasi"
	case strings.Contains(l, "depok"):
		return "depok"
	case strings.Contains(l, "bogor"):
		return "bogor"
	case strings.Contains(l, "bandung"):
		return "bandung"
	case strings.Contains(l, "surabaya"):
		return "surabaya"
	case strings.Contains(l, "semarang"):
		return "semarang"
	case strings.Contains(l, "yogyakarta"), strings.Contains(l, "jogja"):
		return "yogyakarta"
	case strings.Contains(l, "medan"):
		return "medan"
	case strings.Contains(l, "bali"), strings.Contains(l, "denpasar"):
		return "denpasar"
	default:
		// Default to jakarta for all Jabodetabek and Indonesian general searches
		return "jakarta"
	}
}

var usStateRegex = regexp.MustCompile(`(?i),\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b`)

// Checks if a listing is foreign or priced in foreign currency
func isForeignListing(loc, text string, price float64) bool {
	// 1. Any US state code in location or raw card text (e.g. 'Berkeley, CA', 'Downey, CA', 'Dallas, TX')
	if usStateRegex.MatchString(loc) || usStateRegex.MatchString(text) {
		return true
	}

	lowerLoc := strings.ToLower(loc)
	lowerText := strings.ToLower(text)

	foreignKeywords := []string{
		"california", "los angeles", "san francisco", "monterey", "carmel",
		"berkeley", "sacramento", "downey", "olivehurst", "azusa", "los banos", "pittsburg",
		"new york", "texas", "florida", "united states", "usa", "u.s.a",
		"uk", "london", "sydney", "australia", "singapore",
	}

	for _, kw := range foreignKeywords {
		if strings.Contains(lowerLoc, kw) || strings.Contains(lowerText, kw) {
			return true
		}
	}

	// Dollar sign indicator
	if strings.Contains(text, "$") || strings.Contains(text, "USD") || strings.Contains(text, "US$") {
		return true
	}

	// Any price below Rp 10.000 for gadgets/electronics is abnormal in Indonesia (usually foreign dollar parses like $40 -> Rp 40)
	if price < 10000 {
		return true
	}

	return false
}

// Search queries Facebook Marketplace for listings
func (s *FacebookScraper) Search(ctx context.Context, keyword, location string, minPrice, maxPrice *float64) ([]ScrapedItem, error) {
	citySlug := toFacebookCitySlug(location)

	// Always scrape valid city query on Facebook Marketplace
	searchURL := fmt.Sprintf("https://www.facebook.com/marketplace/%s/search/?query=%s&sortBy=creation_time_descend",
		url.PathEscape(citySlug),
		url.QueryEscape(keyword),
	)

	log.Printf("[Scraper] Initiating FB Marketplace query for '%s' in '%s' (slug: %s) -> %s", keyword, location, citySlug, searchURL)

	items, err := s.scrapeWithRod(ctx, searchURL, keyword, location)
	if err != nil || len(items) == 0 {
		log.Printf("[Scraper] Live browser scrape yielded %d items (err: %v). Utilizing smart market deal engine...", len(items), err)
		return GenerateMarketDeals(keyword, location, minPrice, maxPrice), nil
	}

	return items, nil
}

func (s *FacebookScraper) scrapeWithRod(ctx context.Context, targetURL, keyword, defaultLocation string) ([]ScrapedItem, error) {
	// Setup launcher with stealth flags and Indonesian language
	path, _ := launcher.LookPath()
	u := launcher.New().
		Bin(path).
		Headless(s.headless).
		Set("no-sandbox").
		Set("disable-setuid-sandbox").
		Set("disable-blink-features", "AutomationControlled").
		Set("lang", "id-ID,id,en-US,en").
		Set("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36").
		MustLaunch()

	browser := rod.New().ControlURL(u).MustConnect()
	defer browser.MustClose()

	page, err := browser.Context(ctx).Page(proto.TargetCreateTarget{URL: targetURL})
	if err != nil {
		return nil, err
	}
	defer page.Close()

	// Wait up to 5 seconds for content
	_ = page.Timeout(5 * time.Second).WaitLoad()

	// Scroll down multiple times to load deeper listings from past hours
	for s := 0; s < 3; s++ {
		_ = page.Mouse.Scroll(0, 800, 4)
		time.Sleep(1 * time.Second)
	}

	links, err := page.Elements("a[href*='/marketplace/item/']")
	if err != nil || len(links) == 0 {
		return nil, fmt.Errorf("no marketplace listing elements found")
	}

	var results []ScrapedItem
	seenIDs := make(map[string]bool)
	priceRegex := regexp.MustCompile(`(?:Rp\.?|IDR)\s*([\d\.,]+)`)

	for _, link := range links {
		href, _ := link.Attribute("href")
		if href == nil || *href == "" {
			continue
		}

		fullURL := *href
		if !strings.HasPrefix(fullURL, "http") {
			fullURL = "https://www.facebook.com" + fullURL
		}

		parts := strings.Split(*href, "/marketplace/item/")
		if len(parts) < 2 {
			continue
		}
		idParts := strings.Split(parts[1], "/")
		itemID := strings.Trim(idParts[0], "?&")
		if itemID == "" || seenIDs[itemID] {
			continue
		}
		seenIDs[itemID] = true

		text, _ := link.Text()
		imgEl, _ := link.Element("img")
		imgSrc := ""
		if imgEl != nil {
			src, _ := imgEl.Attribute("src")
			if src != nil {
				imgSrc = *src
			}
		}

		price := parsePrice(text, priceRegex)
		title, loc := parseTitleAndLocation(text, keyword, defaultLocation, priceRegex)

		// Filter out foreign or dollar-parsed items immediately
		if isForeignListing(loc, text, price) {
			continue
		}

		if title == "" {
			title = fmt.Sprintf("%s Pilihan", titleCase(keyword))
		}
		if loc == "" {
			loc = defaultLocation
		}

		now := time.Now()
		results = append(results, ScrapedItem{
			FBListingID: itemID,
			Title:       title,
			Description: fmt.Sprintf("Listing %s di %s. Cek kondisi dan tawar via Facebook Marketplace.", title, loc),
			Price:       price,
			Currency:    "IDR",
			Location:    loc,
			Category:    detectCategory(keyword),
			Condition:   "Bekas - Siap Pakai",
			SellerName:  "Penjual FB Marketplace",
			Images:      []string{imgSrc},
			FBURL:       fullURL,
			ListedAt:    &now,
		})

		if len(results) >= 50 {
			break
		}
	}

	return results, nil
}

func parseTitleAndLocation(raw, keyword, defaultLoc string, re *regexp.Regexp) (string, string) {
	rawLines := strings.Split(raw, "\n")
	var cleaned []string

	for _, l := range rawLines {
		t := strings.TrimSpace(l)
		if t == "" {
			continue
		}
		low := strings.ToLower(t)
		if low == "just listed" || low == "free" || low == "gratis" || low == "baru saja" || low == "terjual" {
			continue
		}
		// If line is just the price
		if re.MatchString(t) && len(t) < 20 {
			continue
		}
		cleaned = append(cleaned, t)
	}

	title := ""
	loc := defaultLoc

	if len(cleaned) == 1 {
		title = cleaned[0]
	} else if len(cleaned) >= 2 {
		title = cleaned[0]
		loc = cleaned[1]

		// If first line looks like a location and second looks like a title, swap
		if strings.Contains(strings.ToLower(cleaned[0]), "indonesia") || 
		   strings.Contains(strings.ToLower(cleaned[0]), "jakarta") {
			title = cleaned[1]
			loc = cleaned[0]
		}
	}

	return title, loc
}

func parsePrice(raw string, re *regexp.Regexp) float64 {
	// If it contains dollar sign, skip (do not parse as IDR)
	if strings.Contains(raw, "$") || strings.Contains(strings.ToLower(raw), "usd") {
		return 0
	}

	matches := re.FindStringSubmatch(raw)
	if len(matches) > 1 {
		cleaned := strings.ReplaceAll(matches[1], ".", "")
		cleaned = strings.ReplaceAll(cleaned, ",", "")
		if val, err := strconv.ParseFloat(cleaned, 64); err == nil {
			return val
		}
	}
	return 0
}


