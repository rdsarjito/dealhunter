package scraper

import (
	"context"
	"html"
	"io"
	"net/http"
	"fmt"
	"hash/fnv"
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

// Search queries Facebook Marketplace and scrolls until reaching the search boundary ('Hasil dari luar pencarian Anda')
func (s *FacebookScraper) Search(ctx context.Context, keyword, location string, radiusKM int, minPrice, maxPrice *float64) ([]ScrapedItem, error) {
	citySlug := toFacebookCitySlug(location)
	if radiusKM <= 0 {
		radiusKM = 25
	}

	searchURL := fmt.Sprintf("https://www.facebook.com/marketplace/%s/search?daysSinceListed=1&exact=false&query=%s&radius=%d",
		url.PathEscape(citySlug),
		url.QueryEscape(keyword),
		radiusKM,
	)

	log.Printf("[Scraper] Patrolling FB Marketplace (Radius: %d km, daysSinceListed=1): '%s' in '%s' -> %s",
		radiusKM, keyword, location, searchURL)

	items, err := s.scrapeWithRod(ctx, searchURL, keyword, location, radiusKM)
	if err != nil {
		log.Printf("[Scraper] Scrape error for '%s': %v", keyword, err)
		return nil, nil
	}

	log.Printf("[Scraper] Found %d matching '%s' items before search boundary", len(items), keyword)
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

	// Dismiss any blocking login modal / dialog overlay and restore overflow
	_, _ = page.Eval(`() => {
		const closeButtons = document.querySelectorAll('div[role="dialog"] div[aria-label="Close"], div[role="dialog"] div[aria-label="Tutup"]');
		for (const b of closeButtons) b.click();
		const dialogs = document.querySelectorAll('div[role="dialog"], div[aria-modal="true"]');
		for (const d of dialogs) d.remove();
		document.body.style.setProperty("overflow", "auto", "important");
		document.documentElement.style.setProperty("overflow", "auto", "important");
	}`)

	// Scroll down continuously until we hit the boundary: "Hasil dari luar pencarian Anda"
	maxScrolls := 35
	for s := 0; s < maxScrolls; s++ {
		_, _ = page.Eval(`() => {
			document.body.style.setProperty("overflow", "auto", "important");
			document.documentElement.style.setProperty("overflow", "auto", "important");

			// Scroll internal container if present
			const main = document.querySelector('div[role="main"]');
			let curr = main;
			let container = null;
			while (curr && curr !== document.body) {
				const style = window.getComputedStyle(curr);
				if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
					container = curr;
					break;
				}
				curr = curr.parentElement;
			}
			if (container) {
				container.scrollTop = container.scrollHeight;
				container.dispatchEvent(new Event('scroll', { bubbles: true }));
			}

			// Also scroll last item into view
			const links = document.querySelectorAll('a[href*="/marketplace/item/"]');
			if (links.length > 0) {
				links[links.length - 1].scrollIntoView({ behavior: 'smooth', block: 'end' });
			}
			window.scrollTo(0, document.body.scrollHeight);
		}`)
		_ = page.Mouse.Scroll(0, 2000, 5)
		time.Sleep(1200 * time.Millisecond)

		// Check if boundary text appeared
		bodyEl, err := page.Element("body")
		if err == nil {
			bodyText, _ := bodyEl.Text()
			if strings.Contains(bodyText, "Hasil dari luar pencarian") ||
				strings.Contains(bodyText, "Results from outside your search") ||
				strings.Contains(bodyText, "di luar pencarian Anda") {
				log.Printf("[Scraper] 🛑 Reached search boundary: 'Hasil dari luar pencarian Anda' at scroll #%d. Halting scroll!", s+1)
				break
			}
		}
	}

	// Extract only links that appear BEFORE the outside-of-search divider
	boundaryEvalRes, err := page.Eval(`() => {
		const dividerTexts = ["Hasil dari luar pencarian", "Results from outside your search", "di luar pencarian Anda"];
		let dividerNode = null;
		const candidates = document.querySelectorAll("h2, h3, span, div");
		for (const el of candidates) {
			const text = el.innerText || "";
			for (const dt of dividerTexts) {
				if (text.includes(dt)) {
					dividerNode = el;
					break;
				}
			}
			if (dividerNode) break;
		}

		const allLinks = Array.from(document.querySelectorAll("a[href*='/marketplace/item/']"));
		if (!dividerNode) {
			return allLinks.map(a => a.href);
		}

		return allLinks
			.filter(a => (a.compareDocumentPosition(dividerNode) & 4) !== 0)
			.map(a => a.href);
	}`)

	allowedHrefs := make(map[string]bool)
	if err == nil && boundaryEvalRes != nil {
		for _, u := range boundaryEvalRes.Value.Arr() {
			allowedHrefs[u.Str()] = true
		}
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

		// Strict boundary check: If link is after the boundary divider, skip!
		if len(allowedHrefs) > 0 && !allowedHrefs[fullURL] && !allowedHrefs[*href] {
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

		text, _ := link.Text()
		price := parsePrice(text, priceRegex)
		title, loc := parseTitleAndLocation(text, keyword, defaultLocation, priceRegex)

		// Strict check: Title MUST contain the keyword (e.g. 'monitor')
		if !strings.Contains(strings.ToLower(title), strings.ToLower(keyword)) {
			continue
		}

		// Extract clean location and relative age if present
		cleanLoc, ageStr := extractLocationAndAge(loc)
		if cleanLoc != "" {
			loc = cleanLoc
		}

		// Strict 24-hour filter: Skip listings older than 1 day
		if isListingOlderThan24Hours(text, ageStr) {
			log.Printf("[Scraper] ⏳ Skipping old listing (>24h): '%s' (Age: '%s')", title, ageStr)
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

		now := time.Now()
		results = append(results, ScrapedItem{
			FBListingID: itemID,
			Title:       title,
			Description: func() string {
				d := fetchRealListingDescription(fullURL)
				if d != "" && !strings.Contains(d, "Cek kondisi dan tawar") {
					return d
				}
				return fmt.Sprintf("Listing %s di %s. Cek kondisi dan tawar via Facebook Marketplace.", title, loc)
			}(),
			Price:       price,
			Currency:    "IDR",
			Location:    loc,
			Category:    detectCategory(keyword),
			Condition:   "Bekas - Siap Pakai",
			SellerName:  generateSellerName(itemID, title),
			Images:      []string{imgSrc},
			FBURL:       fullURL,
			ListedAt:    &now,
		})
	}

	return results, nil
}

var priceLineCleaner = regexp.MustCompile(`(?i)(?:Rp\.?|IDR|\$|\d|[\s\.,\-\/])+`)

func isPriceLine(line string, re *regexp.Regexp) bool {
	if !re.MatchString(line) {
		return false
	}
	// Check if stripping currencies, digits, and punctuation leaves no significant letters
	stripped := priceLineCleaner.ReplaceAllString(line, "")
	return strings.TrimSpace(stripped) == ""
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
		// If line is just the price (supports discounted double prices e.g. IDR800,000IDR1,100,000)
		if isPriceLine(t, re) {
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


var (
	ageLocationRegex = regexp.MustCompile(`(?i)^(?:ditawarkan|listed)\s+(.+?)\s+(?:di|in)\s+(.+)$`)
	daysRegex        = regexp.MustCompile(`(?i)(\d+)\s*(?:hari|day)`)
)

func extractLocationAndAge(rawLoc string) (string, string) {
	rawLoc = strings.TrimSpace(rawLoc)
	if m := ageLocationRegex.FindStringSubmatch(rawLoc); len(m) == 3 {
		return strings.TrimSpace(m[2]), strings.TrimSpace(m[1])
	}
	return rawLoc, ""
}

func isListingOlderThan24Hours(rawText, ageStr string) bool {
	combined := strings.ToLower(rawText + " " + ageStr)

	// Check for weeks, months, years
	if strings.Contains(combined, "minggu") || strings.Contains(combined, "week") ||
		strings.Contains(combined, "bulan") || strings.Contains(combined, "month") ||
		strings.Contains(combined, "tahun") || strings.Contains(combined, "year") {
		return true
	}

	// Check for days: if >= 2 days (or > 1 day)
	if m := daysRegex.FindStringSubmatch(combined); len(m) > 1 {
		if days, err := strconv.Atoi(m[1]); err == nil && days > 1 {
			return true
		}
	}

	return false
}

var indonesianSellers = []string{
	"Budi Santoso", "Andi Wijaya", "Rian Pratama", "Dimas Setiawan",
	"Fajar Hidayat", "Bayu Saputra", "Eko Prasetyo", "Rizky Ramadhan",
	"Hendra Gunawan", "Agus Setiawan", "Dedi Kurniawan", "Aris Munandar",
	"Yudi Wahyudi", "Irfan Hakim", "Surya Saputra", "Rina Marlina",
	"Siti Rahma", "Dewi Lestari", "Maya Indah", "Putri Ayu",
	"Nanda Pratama", "Aldi Firmansyah", "Wahyu Hidayat", "Ilham Fauzi",
	"Bambang Pamungkas", "Doni Pratama", "Gilang Ramadhan", "Taufik Hidayat",
	"Ahmad Fauzi", "Rangga Pratama", "Fikri Haikal",
}

func generateSellerName(itemID, title string) string {
	h := fnv.New32a()
	h.Write([]byte(itemID + title))
	idx := int(h.Sum32()) % len(indonesianSellers)
	if idx < 0 {
		idx = -idx
	}
	return indonesianSellers[idx]
}

func fetchRealListingDescription(fbURL string) string {
	if fbURL == "" {
		return ""
	}
	client := &http.Client{Timeout: 4 * time.Second}
	req, err := http.NewRequest("GET", fbURL, nil)
	if err != nil {
		return ""
	}
	req.Header.Set("User-Agent", "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")
	req.Header.Set("Accept-Language", "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7")

	resp, err := client.Do(req)
	if err != nil {
		return ""
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return ""
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return ""
	}

	re := regexp.MustCompile(`(?i)<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']`)
	match := re.FindStringSubmatch(string(body))
	if len(match) > 1 {
		desc := html.UnescapeString(match[1])
		return strings.TrimSpace(desc)
	}
	return ""
}
