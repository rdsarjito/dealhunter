package service

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/rdsarjito/dealhunter-backend/internal/domain/dto"
	"github.com/rdsarjito/dealhunter-backend/internal/domain/model"
	"github.com/rdsarjito/dealhunter-backend/internal/notifier"
	"github.com/rdsarjito/dealhunter-backend/internal/repository"
	"github.com/rdsarjito/dealhunter-backend/internal/scraper"
)

type SearchService struct {
	listingRepo  *repository.ListingRepository
	alertRepo    *repository.AlertRepository
	telegramRepo *repository.TelegramSettingRepository
	scraper      scraper.MarketplaceScraper
	notifier     *notifier.TelegramNotifier
}

func NewSearchService(
	listingRepo *repository.ListingRepository,
	alertRepo *repository.AlertRepository,
	telegramRepo *repository.TelegramSettingRepository,
	scraper scraper.MarketplaceScraper,
	notifier *notifier.TelegramNotifier,
) *SearchService {
	return &SearchService{
		listingRepo:  listingRepo,
		alertRepo:    alertRepo,
		telegramRepo: telegramRepo,
		scraper:      scraper,
		notifier:     notifier,
	}
}

func (s *SearchService) Search(ctx context.Context, req dto.SearchRequest) (*dto.SearchResponse, error) {
	if req.Keyword == "" {
		req.Keyword = "iPhone"
	}
	if req.Location == "" {
		req.Location = "Jakarta"
	}

	scrapedLive := false

	// First query DB
	listings, total, avg, min, max, err := s.listingRepo.Search(req)

	// If no results or user requested live scrape, trigger scraper
	if err != nil || total == 0 || req.LiveScrape {
		log.Printf("[SearchService] Triggering scraper for keyword='%s', location='%s'", req.Keyword, req.Location)
		items, err := s.scraper.Search(ctx, req.Keyword, req.Location, req.RadiusKM, req.MinPrice, req.MaxPrice)
		if err == nil && len(items) > 0 {
			scrapedLive = true
			_, _ = s.listingRepo.UpsertScrapedItems(items, req.Keyword)

			// Re-query with fresh database data
			listings, total, avg, min, max, _ = s.listingRepo.Search(req)

			// Check and trigger price alerts in background
			go s.checkPriceAlerts(req.Keyword, listings)
		}
	} else if len(listings) > 0 {
		// Also check alerts against existing fresh listings
		go s.checkPriceAlerts(req.Keyword, listings)
	}

	return &dto.SearchResponse{
		Query:          req.Keyword,
		Location:       req.Location,
		RadiusKM:       req.RadiusKM,
		TotalResults:   int(total),
		Page:           req.Page,
		Limit:          req.Limit,
		MarketAvgPrice: avg,
		MarketMinPrice: min,
		MarketMaxPrice: max,
		Listings:       listings,
		ScrapedLive:    scrapedLive,
	}, nil
}

func (s *SearchService) checkPriceAlerts(keyword string, listings []model.Listing) {
	alerts, err := s.alertRepo.GetActive()
	if err != nil || len(alerts) == 0 {
		return
	}

	// Fetch active global telegram chat IDs
	var defaultChatIDs []string
	if s.telegramRepo != nil {
		if settings, err := s.telegramRepo.GetActive(); err == nil {
			for _, st := range settings {
				if st.ChatID != "" {
					defaultChatIDs = append(defaultChatIDs, st.ChatID)
				}
			}
		}
	}

	for _, alert := range alerts {
		if !strings.Contains(strings.ToLower(keyword), strings.ToLower(alert.Keyword)) &&
			!strings.Contains(strings.ToLower(alert.Keyword), strings.ToLower(keyword)) {
			continue
		}

		// Find best matching listing that satisfies max price
		for _, item := range listings {
			if item.Price > 0 && item.Price <= alert.MaxPrice {
				// Avoid spamming if triggered recently on same item
				if alert.LastMatchedItem == item.Title && alert.LastTriggeredAt != nil &&
					time.Since(*alert.LastTriggeredAt) < 2*time.Hour {
					continue
				}

				log.Printf("[Alert] Matched alert '%s' with listing '%s' (Rp %.0f <= Rp %.0f)",
					alert.Keyword, item.Title, item.Price, alert.MaxPrice)

				// Determine targets
				var targetChats []string
				if alert.TelegramChatID != "" {
					targetChats = append(targetChats, alert.TelegramChatID)
				} else {
					targetChats = defaultChatIDs
				}

				for _, cid := range targetChats {
					_ = s.notifier.SendDealAlert(cid, &alert, &item)
				}

				_ = s.alertRepo.RecordTrigger(alert.ID, item.Title)
				break
			}
		}
	}
}
