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
	headless   bool
	cUser      string
	xsToken    string
	rawCookies string
}

func NewFacebookScraper(headless bool) *FacebookScraper {
	return &FacebookScraper{
		headless: headless,
	}
}

func (s *FacebookScraper) SetSession(cUser, xsToken, rawCookies string) {
	s.cUser = cUser
	s.xsToken = xsToken
	s.rawCookies = rawCookies
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

// Search queries Facebook Marketplace by distance_ascend within user radius
func (s *FacebookScraper) Search(ctx context.Context, keyword, location string, radiusKM int, minPrice, maxPrice *float64) ([]ScrapedItem, error) {
	citySlug := toFacebookCitySlug(location)
	if radiusKM <= 0 {
		radiusKM = 20
	}

	searchURL := fmt.Sprintf("https://www.facebook.com/marketplace/%s/search?daysSinceListed=1&sortBy=distance_ascend&query=%s&exact=false&radius=%d",
		url.PathEscape(citySlug),
		url.QueryEscape(keyword),
		radiusKM,
	)

	log.Printf("[Scraper] Patrolling FB Marketplace (Radius: %d km, daysSinceListed=1, distance_ascend): '%s' in '%s' -> %s",
		radiusKM, keyword, location, searchURL)

	items, err := s.scrapeWithRod(ctx, searchURL, keyword, location, radiusKM)
	if err != nil {
		log.Printf("[Scraper] Scrape error for '%s': %v", keyword, err)
		return nil, nil
	}

	log.Printf("[Scraper] Found %d matching '%s' items within %d km", len(items), keyword, radiusKM)
	return items, nil
}

func (s *FacebookScraper) scrapeWithRod(ctx context.Context, targetURL, keyword, defaultLocation string, radiusKM int) ([]ScrapedItem, error) {
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

	// Inject authenticated Facebook session if configured
	if s.rawCookies != "" {
		cookies := parseRawCookies(s.rawCookies)
		if len(cookies) > 0 {
			_ = page.SetCookies(cookies)
		}
	} else if s.cUser != "" && s.xsToken != "" {
		_ = page.SetCookies([]*proto.NetworkCookieParam{
			{Name: "c_user", Value: s.cUser, Domain: ".facebook.com", Path: "/"},
			{Name: "xs", Value: s.xsToken, Domain: ".facebook.com", Path: "/"},
		})
	}

	// Wait up to 5 seconds for content
	_ = page.Timeout(5 * time.Second).WaitLoad()

	var results []ScrapedItem
	seenIDs := make(map[string]bool)
	priceRegex := regexp.MustCompile(`(?:Rp\.?|IDR)\s*([\d\.,]+)`)
	distRegex := regexp.MustCompile(`(?i)(\d+(?:\.\d+)?)\s*(?:km|kilometer)`)

	stopScraping := false

	// Continuously scroll and scrape until radius limit is exceeded
	for scrollAttempt := 0; scrollAttempt < 15; scrollAttempt++ {
		links, err := page.Elements("a[href*='/marketplace/item/']")
		if err == nil && len(links) > 0 {
			for _, link := range links {
				text, _ := link.Text()

				// If item distance is explicitly stated and exceeds radius limit, stop scraping!
				if match := distRegex.FindStringSubmatch(text); len(match) > 1 {
					if distVal, err := strconv.ParseFloat(match[1], 64); err == nil {
						if distVal > float64(radiusKM) {
							log.Printf("[Scraper] Item distance %.1f km exceeds radius limit %d km. Stopping scrape!", distVal, radiusKM)
							stopScraping = true
							break
						}
					}
				}

				href, _ := link.Attribute("href")
				if href == nil || *href == "" {
					continue
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

				price := parsePrice(text, priceRegex)
				title, loc := parseTitleAndLocation(text, keyword, defaultLocation, priceRegex)

				// Strict check: Title MUST contain the keyword (e.g. 'monitor')
				if !strings.Contains(strings.ToLower(title), strings.ToLower(keyword)) {
					continue
				}

				// Filter out foreign listings
				if isForeignListing(loc, text, price) {
					continue
				}

				if title == "" {
					title = fmt.Sprintf("%s Pilihan", titleCase(keyword))
				}
				if loc == "" {
					loc = defaultLocation
				}

				imgEl, _ := link.Element("img")
				imgSrc := ""
				if imgEl != nil {
					src, _ := imgEl.Attribute("src")
					if src != nil {
						imgSrc = *src
					}
				}

				fullURL := *href
				if !strings.HasPrefix(fullURL, "http") {
					fullURL = "https://www.facebook.com" + fullURL
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
			}
		}

		if stopScraping {
			log.Printf("[Scraper] Reached radius threshold (%d km). Stopped at %d items.", radiusKM, len(results))
			break
		}

		// Scroll down to load further distance items
		_ = page.Mouse.Scroll(0, 1000, 4)
		time.Sleep(1 * time.Second)
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



func parseRawCookies(raw string) []*proto.NetworkCookieParam {
	var params []*proto.NetworkCookieParam
	parts := strings.Split(raw, ";")
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		kv := strings.SplitN(p, "=", 2)
		if len(kv) == 2 {
			name := strings.TrimSpace(kv[0])
			val := strings.TrimSpace(kv[1])
			if name != "" && val != "" {
				params = append(params, &proto.NetworkCookieParam{
					Name:   name,
					Value:  val,
					Domain: ".facebook.com",
					Path:   "/",
				})
			}
		}
	}
	return params
}
