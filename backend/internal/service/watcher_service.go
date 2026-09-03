package service

import (
	"context"
	"strings"
	"log"
	"sync"
	"time"

	"github.com/rdsarjito/dealhunter-backend/internal/notifier"
	"github.com/rdsarjito/dealhunter-backend/internal/repository"
	"github.com/rdsarjito/dealhunter-backend/internal/scraper"
)

type AlertWatcher struct {
	alertRepo    *repository.AlertRepository
	listingRepo  *repository.ListingRepository
	telegramRepo *repository.TelegramSettingRepository
	scraper      scraper.MarketplaceScraper
	notifier     *notifier.TelegramNotifier
	interval     time.Duration
	mu           sync.Mutex
	isScanning   bool
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
	w.mu.Unlock()

	defer func() {
		w.mu.Lock()
		w.isScanning = false
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

		log.Printf("[AlertWatcher] Checking alert: '%s' in '%s' (Target <= Rp %.0f)",
			alert.Keyword, alert.Location, alert.MaxPrice)

		// Search Facebook Marketplace
		items, err := w.scraper.Search(ctx, alert.Keyword, alert.Location, nil, nil)
		if err != nil || len(items) == 0 {
			continue
		}

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
