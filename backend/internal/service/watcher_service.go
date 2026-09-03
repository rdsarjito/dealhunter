package service

import (
	"context"
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
				if alert.Location != "" && !matchesAlertLocation(alert.Location, alert.RadiusKM, item.Location) {
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
				if !w.alertRepo.HasMatch(alert.ID, exItem.ID) && matchesAlertLocation(alert.Location, alert.RadiusKM, exItem.Location) {
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

func matchesAlertLocation(alertLoc string, radiusKM int, itemLoc string) bool {
	if alertLoc == "" || itemLoc == "" {
		return true
	}
	al := strings.ToLower(alertLoc)
	il := strings.ToLower(itemLoc)

	if (strings.Contains(al, "jakarta") || strings.Contains(al, "kebayoran")) && radiusKM >= 15 {
		return strings.Contains(il, "jakarta") || strings.Contains(il, "tangerang") || strings.Contains(il, "depok") || strings.Contains(il, "bekasi") || strings.Contains(il, "bogor") || strings.Contains(il, "jawa barat")
	}

	return strings.Contains(il, al) || strings.Contains(al, il)
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
