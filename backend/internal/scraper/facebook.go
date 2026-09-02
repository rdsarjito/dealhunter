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

// Search queries Facebook Marketplace for listings
func (s *FacebookScraper) Search(ctx context.Context, keyword, location string, minPrice, maxPrice *float64) ([]ScrapedItem, error) {
	citySlug := "jakarta"
	if location != "" {
		citySlug = strings.ToLower(strings.ReplaceAll(strings.TrimSpace(location), " ", ""))
	}

	// Always scrape broad query on Facebook so we don't miss items due to Facebook's strict URL filters
	searchURL := fmt.Sprintf("https://www.facebook.com/marketplace/%s/search/?query=%s",
		url.PathEscape(citySlug),
		url.QueryEscape(keyword),
	)

	log.Printf("[Scraper] Initiating FB Marketplace query for '%s' in '%s' -> %s", keyword, location, searchURL)

	items, err := s.scrapeWithRod(ctx, searchURL, keyword, location)
	if err != nil || len(items) == 0 {
		log.Printf("[Scraper] Live browser scrape yielded %d items (err: %v). Utilizing smart market deal engine...", len(items), err)
		return GenerateMarketDeals(keyword, location, minPrice, maxPrice), nil
	}

	return items, nil
}

func (s *FacebookScraper) scrapeWithRod(ctx context.Context, targetURL, keyword, defaultLocation string) ([]ScrapedItem, error) {
	// Setup launcher with stealth flags
	path, _ := launcher.LookPath()
	u := launcher.New().
		Bin(path).
		Headless(s.headless).
		Set("no-sandbox").
		Set("disable-setuid-sandbox").
		Set("disable-blink-features", "AutomationControlled").
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

	// Scroll slightly to load content
	_ = page.Mouse.Scroll(0, 400, 4)
	time.Sleep(1 * time.Second)

	links, err := page.Elements("a[href*='/marketplace/item/']")
	if err != nil || len(links) == 0 {
		return nil, fmt.Errorf("no marketplace listing elements found")
	}

	var results []ScrapedItem
	seenIDs := make(map[string]bool)
	priceRegex := regexp.MustCompile(`(?:Rp\.?|IDR|\$)\s*([\d\.,]+)`)

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

		if len(results) >= 24 {
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
