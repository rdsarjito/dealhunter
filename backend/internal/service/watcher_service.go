package service

import (
	"context"
	"math"
	"sort"
	"strings"
	"log"
	"sync"
	"time"

	"github.com/rdsarjito/dealhunter-backend/internal/domain/model"
	"github.com/rdsarjito/dealhunter-backend/internal/notifier"
	"github.com/rdsarjito/dealhunter-backend/internal/repository"
	"github.com/rdsarjito/dealhunter-backend/internal/scraper"
)

type WatcherStatus struct {
	IsScanning         bool       `json:"is_scanning"`
	CurrentKeyword     string     `json:"current_keyword"`
	LastScanAt         *time.Time `json:"last_scan_at"`
	LastScanDurationMs int64      `json:"last_scan_duration_ms"`
	LastItemsFound     int        `json:"last_items_found"`
	IntervalMinutes    int        `json:"interval_minutes"`
	NextScanAt         *time.Time `json:"next_scan_at"`
}

type AlertWatcher struct {
	alertRepo        *repository.AlertRepository
	listingRepo      *repository.ListingRepository
	telegramRepo     *repository.TelegramSettingRepository
	scraper          scraper.MarketplaceScraper
	notifier         *notifier.TelegramNotifier
	interval         time.Duration
	mu               sync.Mutex
	isScanning       bool
	currentKeyword   string
	lastScanAt       *time.Time
	lastScanDuration time.Duration
	lastItemsFound   int
	nextScanAt       *time.Time
}

func NewAlertWatcher(
	alertRepo *repository.AlertRepository,
	listingRepo *repository.ListingRepository,
	telegramRepo *repository.TelegramSettingRepository,
	scraper scraper.MarketplaceScraper,
	notifier *notifier.TelegramNotifier,
	interval time.Duration,
) *AlertWatcher {
	if interval < 1*time.Minute {
		interval = 2 * time.Minute
	}
	return &AlertWatcher{
		alertRepo:    alertRepo,
		listingRepo:  listingRepo,
		telegramRepo: telegramRepo,
		scraper:      scraper,
		notifier:     notifier,
		interval:     interval,
	}
}

// Start begins background polling loop
func (w *AlertWatcher) Start(ctx context.Context) {
	log.Printf("[AlertWatcher] Background alert poller started. Scanning every %v", w.interval)

	// Run initial scan in background after 5 seconds
	go func() {
		time.Sleep(5 * time.Second)
		w.ScanAll(ctx)
	}()

	ticker := time.NewTicker(w.interval)
	go func() {
		for {
			select {
			case <-ctx.Done():
				ticker.Stop()
				log.Println("[AlertWatcher] Background alert poller stopped.")
				return
			case <-ticker.C:
				w.ScanAll(ctx)
			}
		}
	}()
}

// ScanAll scans Facebook Marketplace for all active alerts
func (w *AlertWatcher) ScanAll(ctx context.Context) int {
	w.mu.Lock()
	if w.isScanning {
		w.mu.Unlock()
		log.Println("[AlertWatcher] Previous scan still in progress, skipping tick...")
		return 0
	}
	w.isScanning = true
	w.currentKeyword = "Menyiapkan browser..."
	start := time.Now()
	w.mu.Unlock()

	totalItemsScraped := 0
	defer func() {
		w.mu.Lock()
		w.isScanning = false
		w.currentKeyword = ""
		now := time.Now()
		w.lastScanAt = &now
		w.lastScanDuration = time.Since(start)
		w.lastItemsFound = totalItemsScraped
		next := now.Add(w.interval)
		w.nextScanAt = &next
		w.mu.Unlock()
	}()

	alerts, err := w.alertRepo.GetActive()
	if err != nil || len(alerts) == 0 {
		return 0
	}

	// Fetch default telegram chat IDs
	var defaultChatIDs []string
	if w.telegramRepo != nil {
		if settings, err := w.telegramRepo.GetActive(); err == nil {
			for _, st := range settings {
				if st.ChatID != "" {
					defaultChatIDs = append(defaultChatIDs, st.ChatID)
				}
			}
		}
	}

	log.Printf("[AlertWatcher] 🔄 Background scanning Facebook Marketplace for %d active alerts...", len(alerts))
	totalTriggered := 0

	for _, alert := range alerts {
		select {
		case <-ctx.Done():
			return totalTriggered
		default:
		}

		w.mu.Lock()
		w.currentKeyword = alert.Keyword
		w.mu.Unlock()

		log.Printf("[AlertWatcher] Checking alert: '%s' in '%s' (Target <= Rp %.0f)",
			alert.Keyword, alert.Location, alert.MaxPrice)

		// Search Facebook Marketplace
		items, err := w.scraper.Search(ctx, alert.Keyword, alert.Location, alert.RadiusKM, nil, nil)
		if err != nil || len(items) == 0 {
			continue
		}
		totalItemsScraped += len(items)

		// Save new listings to DB
		savedListings, _ := w.listingRepo.UpsertScrapedItems(items, alert.Keyword)

		// Check for price and location matches
		for _, item := range savedListings {
			if item.Price > 0 && item.Price <= alert.MaxPrice {
				// Don't re-match if this listing was already captured by this alert
				if w.alertRepo.HasMatch(alert.ID, item.ID) {
					continue
				}

				// Check location if alert specified location
				if alert.Location != "" && !MatchesAlertLocation(&alert, item.Location) {
					continue
				}

				log.Printf("[AlertWatcher] 🚨 NEW DEAL DETECTED! '%s' Rp %.0f <= Rp %.0f (Alert: %s)",
					item.Title, item.Price, alert.MaxPrice, alert.Keyword)

				// Capture this listing into this alert
				_ = w.alertRepo.AddMatchedListing(alert.ID, item.ID)
				_ = w.alertRepo.RecordTrigger(alert.ID, item.Title)

				// Determine targets
				var targetChats []string
				if alert.TelegramChatID != "" {
					targetChats = append(targetChats, alert.TelegramChatID)
				} else {
					targetChats = defaultChatIDs
				}

				for _, cid := range targetChats {
					_ = w.notifier.SendDealAlert(cid, &alert, &item)
				}

				totalTriggered++
			}
		}

		// Also link any valid existing database listings matching alert keyword, price, & location
		var existingListings []model.Listing
		kw := "%" + strings.ToLower(alert.Keyword) + "%"
		if err := w.listingRepo.DB().Where("LOWER(title) LIKE ? AND price >= 10000 AND price <= ?", kw, alert.MaxPrice).Find(&existingListings).Error; err == nil {
			for _, exItem := range existingListings {
				if time.Since(exItem.ScrapedAt) > 24*time.Hour {
					continue
				}
				if !w.alertRepo.HasMatch(alert.ID, exItem.ID) && MatchesAlertLocation(&alert, exItem.Location) {
					_ = w.alertRepo.AddMatchedListing(alert.ID, exItem.ID)
					log.Printf("[AlertWatcher] Linked existing match '%s' to alert %s", exItem.Title, alert.ID)
				}
			}
		}

		// Gentle throttle between alert searches
		time.Sleep(2 * time.Second)
	}

	log.Printf("[AlertWatcher] Scan finished. %d alerts triggered.", totalTriggered)
	return totalTriggered
}

type GeoCoord struct {
	Lat float64
	Lon float64
}

var knownLocations = map[string]GeoCoord{
	// User home area (Kebayoran Lama, Jakarta Selatan)
	"kebayoran lama":    {-6.2464, 106.7707},
	"kebayoran baru":    {-6.2393, 106.7972},
	"kebayoran":         {-6.2464, 106.7707},
	"blok m":            {-6.2435, 106.7979},
	"gandaria":          {-6.2486, 106.7865},
	"pondok indah":      {-6.2736, 106.7836},
	"cilandak":          {-6.2942, 106.8044},
	"mampang":           {-6.2520, 106.8285},
	"tebet":             {-6.2312, 106.8530},
	"pasar minggu":      {-6.2863, 106.8406},
	"jagakarsa":         {-6.3315, 106.8248},
	"jakarta selatan":   {-6.2615, 106.8106},

	// Jakarta Pusat & General Jakarta
	"jakarta pusat":     {-6.1805, 106.8284},
	"jakarta":           {-6.1754, 106.8272},
	"tanah abang":       {-6.1950, 106.8142},
	"menteng":           {-6.1966, 106.8378},

	// Jakarta Barat
	"jakarta barat":     {-6.1683, 106.7588},
	"palmerah":          {-6.1965, 106.7960},
	"kebon jeruk":       {-6.1884, 106.7694},
	"kembangan":         {-6.1873, 106.7380},
	"cengkareng":        {-6.1472, 106.7262},
	"grogol":            {-6.1672, 106.7876},

	// Jakarta Timur
	"jakarta timur":     {-6.2250, 106.9004},
	"matraman":          {-6.2023, 106.8601},
	"jatinegara":        {-6.2294, 106.8682},
	"duren sawit":       {-6.2335, 106.9174},
	"ciracas":           {-6.3323, 106.8770},

	// Jakarta Utara
	"jakarta utara":     {-6.1214, 106.7741},
	"kelapa gading":     {-6.1581, 106.9098},
	"pluit":             {-6.1205, 106.7892},
	"tanjung priok":     {-6.1215, 106.8797},

	// Tangerang & Tangerang Selatan
	"ciledug":           {-6.2245, 106.7088},
	"larangan":          {-6.2372, 106.7258},
	"bintaro":           {-6.2818, 106.7289},
	"ciputat":           {-6.3117, 106.7460},
	"pamulang":          {-6.3427, 106.7381},
	"pondok aren":       {-6.2736, 106.7029},
	"serpong":           {-6.3015, 106.6800},
	"bsd":               {-6.3015, 106.6800},
	"bumi serpong":      {-6.3015, 106.6800},
	"jombang":           {-6.2950, 106.7050},
	"tangerang selatan": {-6.2888, 106.7179},
	"tangsel":           {-6.2888, 106.7179},
	"tangerang":         {-6.1783, 106.6319},
	"karawaci":          {-6.2167, 106.6083},

	// Depok
	"cinere":            {-6.3340, 106.7865},
	"sawangan":          {-6.3980, 106.7620},
	"beji":              {-6.3725, 106.8220},
	"margonda":          {-6.3725, 106.8320},
	"depok":             {-6.4025, 106.7942},
	"citayam":           {-6.4480, 106.7990},

	// Bekasi
	"pondok gede":       {-6.2880, 106.9110},
	"bekasi barat":      {-6.2383, 106.9756},
	"bekasi":            {-6.2383, 106.9756},
	"bekasi timur":      {-6.2550, 107.0180},
	"tambun":            {-6.2615, 107.0650},
	"cikarang":          {-6.3110, 107.1520},
	"pebayuran":         {-6.1368, 107.2185},

	// Bogor & Outlying Southern areas
	"cibinong":          {-6.4817, 106.8536},
	"karanggan":         {-6.4422, 106.8970},
	"gunung putri":      {-6.4422, 106.8970},
	"citeureup":         {-6.4890, 106.8820},
	"bojonggede":        {-6.4950, 106.7950},
	"parung":            {-6.4250, 106.7280},
	"bogor kota":        {-6.5971, 106.8060},
	"bogor":             {-6.5971, 106.8060},
	"ciomas":            {-6.6022, 106.7645},
}

func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371.0
	dLat := (lat2 - lat1) * math.Pi / 180.0
	dLon := (lon2 - lon1) * math.Pi / 180.0
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180.0)*math.Cos(lat2*math.Pi/180.0)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func resolveLocation(loc string) (GeoCoord, bool) {
	lower := strings.ToLower(loc)
	var keys []string
	for k := range knownLocations {
		keys = append(keys, k)
	}
	sort.Slice(keys, func(i, j int) bool {
		return len(keys[i]) > len(keys[j])
	})

	for _, k := range keys {
		if strings.Contains(lower, k) {
			return knownLocations[k], true
		}
	}
	return GeoCoord{}, false
}

func MatchesAlertLocation(alert *model.PriceAlert, itemLoc string) bool {
	if alert.Location == "" || itemLoc == "" {
		return true
	}

	// 1. Resolve Alert anchor coordinate
	var alertCoord GeoCoord
	if alert.Latitude != nil && alert.Longitude != nil && *alert.Latitude != 0 && *alert.Longitude != 0 {
		alertCoord = GeoCoord{Lat: *alert.Latitude, Lon: *alert.Longitude}
	} else if c, ok := resolveLocation(alert.Location); ok {
		alertCoord = c
	} else {
		// Default to Kebayoran Lama coordinates
		alertCoord = knownLocations["kebayoran lama"]
	}

	// 2. Resolve Item location coordinate
	itemCoord, ok := resolveLocation(itemLoc)
	if !ok {
		// Fallback: If location string is generic or unknown, check direct substring
		al := strings.ToLower(alert.Location)
		il := strings.ToLower(itemLoc)
		return strings.Contains(il, al) || strings.Contains(al, il)
	}

	// 3. Compute precise Haversine distance
	distKM := haversineDistance(alertCoord.Lat, alertCoord.Lon, itemCoord.Lat, itemCoord.Lon)
	targetRadius := float64(alert.RadiusKM)
	if targetRadius <= 0 {
		targetRadius = 25.0
	}

	if distKM > targetRadius {
		log.Printf("[AlertWatcher] 🚫 Filtered out item in '%s': physical distance %.1f km exceeds alert radius %d km", itemLoc, distKM, alert.RadiusKM)
		return false
	}

	return true
}

func (w *AlertWatcher) GetStatus() WatcherStatus {
	w.mu.Lock()
	defer w.mu.Unlock()

	var nextScan *time.Time
	if w.nextScanAt != nil {
		nextScan = w.nextScanAt
	} else if w.lastScanAt != nil {
		t := w.lastScanAt.Add(w.interval)
		nextScan = &t
	}

	return WatcherStatus{
		IsScanning:         w.isScanning,
		CurrentKeyword:     w.currentKeyword,
		LastScanAt:         w.lastScanAt,
		LastScanDurationMs: w.lastScanDuration.Milliseconds(),
		LastItemsFound:     w.lastItemsFound,
		IntervalMinutes:    int(w.interval.Minutes()),
		NextScanAt:         nextScan,
	}
}
