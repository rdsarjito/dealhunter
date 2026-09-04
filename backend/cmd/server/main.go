package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"github.com/rdsarjito/dealhunter-backend/config"
	"github.com/rdsarjito/dealhunter-backend/internal/handler"
	"github.com/rdsarjito/dealhunter-backend/internal/notifier"
	"github.com/rdsarjito/dealhunter-backend/internal/repository"
	"github.com/rdsarjito/dealhunter-backend/internal/scraper"
	"github.com/rdsarjito/dealhunter-backend/internal/service"
)

func main() {
	cfg := config.LoadConfig()
	db := config.InitDatabase(cfg)

	// Clean up any dirty/foreign listings from previous scrapes
	db.Exec("DELETE FROM listings WHERE price < 10000 OR location ILIKE '%CA%' OR location ILIKE '%NY%' OR location ILIKE '%TX%' OR location ILIKE '%FL%' OR location ILIKE '%San Francisco%' OR location ILIKE '%Los Angeles%' OR location ILIKE '%Daly City%' OR location ILIKE '%Monterey%' OR location ILIKE '%Carmel%' OR location ILIKE '%Walnut Creek%' OR location ILIKE '%Pacifica%' OR location ILIKE '%United States%' OR location ILIKE '%USA%'")
	db.Exec("UPDATE telegram_settings SET is_active = false WHERE chat_id = '999999999'")
	log.Println("[DB] Cleaned up foreign/invalid listings and dummy telegram records from database.")

	// Repositories
	listingRepo := repository.NewListingRepository(db)
	savedRepo := repository.NewSavedSearchRepository(db)
	alertRepo := repository.NewAlertRepository(db)
	telegramRepo := repository.NewTelegramSettingRepository(db)
	fbSettingRepo := repository.NewFacebookSettingRepository(db)

	// Scraper & Notifier
	fbScraper := scraper.NewFacebookScraper(true)
	if fbSetting, err := fbSettingRepo.GetActive(); err == nil && fbSetting != nil {
		fbScraper.SetSession(fbSetting.CUser, fbSetting.XSToken, fbSetting.RawCookie)
		log.Printf("[FB] Restored active session for %s (c_user: %s)", fbSetting.AccountName, fbSetting.CUser)
	}
	telegramNotifier := notifier.NewTelegramNotifier(cfg.TelegramBotToken)
	if tgSettings, err := telegramRepo.GetActive(); err == nil && len(tgSettings) > 0 {
		for _, s := range tgSettings {
			if s.BotToken != "" {
				telegramNotifier.SetBotToken(s.BotToken)
				log.Printf("[Telegram] Restored bot token from database for chat %s", s.ChatID)
				break
			}
		}
	}

	// Clean up stale listings captured prior to 24-hour filter enforcement
	_ = db.Exec("DELETE FROM alert_matched_listings WHERE listing_id IN (SELECT id FROM listings WHERE LOWER(title) LIKE '%benq dl2020b%')").Error
	_ = db.Exec("DELETE FROM listings WHERE LOWER(title) LIKE '%benq dl2020b%'").Error
	_ = db.Exec("UPDATE price_alerts SET last_matched_item = 'Monitor 27\" Philips ada speaker' WHERE last_matched_item LIKE '%benq dl2020b%'").Error

	// Services
	searchService := service.NewSearchService(listingRepo, alertRepo, telegramRepo, fbScraper, telegramNotifier)

	// Background Alert Watcher (Automatically scans Facebook Marketplace every 15 minutes)
	alertWatcher := service.NewAlertWatcher(alertRepo, listingRepo, telegramRepo, fbScraper, telegramNotifier, 15*time.Minute)
	alertWatcher.Start(context.Background())

	// Handlers
	searchHandler := handler.NewSearchHandler(searchService)
	listingHandler := handler.NewListingHandler(listingRepo)
	savedHandler := handler.NewSavedHandler(savedRepo)
	alertHandler := handler.NewAlertHandler(alertRepo, alertWatcher)
	telegramHandler := handler.NewTelegramHandler(telegramRepo, telegramNotifier)
	fbHandler := handler.NewFacebookHandler(fbSettingRepo, fbScraper)

	// Fiber app
	app := fiber.New(fiber.Config{
		AppName: "DealHunter API v1.0",
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"status":  false,
				"message": err.Error(),
			})
		},
	})

	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  true,
			"message": "DealHunter Backend is active",
			"app":     "DealHunter - Facebook Marketplace Deal Finder",
		})
	})

	api := app.Group("/api/v1")

	// Search
	api.Get("/search", searchHandler.Search)

	// Listings & Watchlist
	api.Get("/listings/:id", listingHandler.GetByID)
	api.Get("/watchlist", listingHandler.GetWatchlist)
	api.Post("/watchlist", listingHandler.AddToWatchlist)
	api.Delete("/watchlist/:id", listingHandler.RemoveFromWatchlist)

	// Saved Searches
	api.Get("/saved-searches", savedHandler.GetAll)
	api.Post("/saved-searches", savedHandler.Create)
	api.Delete("/saved-searches/:id", savedHandler.Delete)

	// Price Alerts
	api.Get("/alerts", alertHandler.GetAll)
	api.Post("/alerts", alertHandler.Create)
	api.Put("/alerts/:id/toggle", alertHandler.Toggle)
	api.Delete("/alerts/:id", alertHandler.Delete)
	api.Post("/alerts/scan-now", alertHandler.ScanNow)
	api.Get("/alerts/watcher/status", alertHandler.GetWatcherStatus)
	api.Get("/alerts/:id/listings", alertHandler.GetAlertListings)

	// Telegram Settings & Test
	api.Get("/telegram/status", telegramHandler.GetStatus)
	api.Post("/telegram/connect", telegramHandler.Connect)
	api.Post("/telegram/disconnect", telegramHandler.Disconnect)
	api.Post("/telegram/test", telegramHandler.TestMessage)

	// Facebook Session Settings
	api.Get("/facebook/status", fbHandler.GetStatus)
	api.Post("/facebook/connect", fbHandler.Connect)
	api.Post("/facebook/disconnect", fbHandler.Disconnect)

	// Admin / Maintenance API
	api.Post("/admin/purge-foreign", func(c *fiber.Ctx) error {
		res := db.Exec("DELETE FROM listings WHERE price < 10000 OR location ILIKE '%, CA%' OR location ILIKE '%, NY%' OR location ILIKE '%, TX%' OR location ILIKE '%, FL%' OR location ILIKE '%California%' OR location ILIKE '%Los Angeles%' OR location ILIKE '%San Francisco%' OR location ILIKE '%Berkeley%' OR location ILIKE '%Sacramento%' OR location ILIKE '%Downey%' OR location ILIKE '%Azusa%' OR location ILIKE '%Los Banos%' OR location ILIKE '%Olivehurst%' OR location ILIKE '%USA%' OR location ILIKE '%United States%'")
		return c.JSON(fiber.Map{
			"status":       true,
			"deleted_rows": res.RowsAffected,
			"message":      "Pembersihan listing asing dan harga abnormal berhasil dijalankan.",
		})
	})
	api.Post("/admin/clear-all", func(c *fiber.Ctx) error {
		db.Exec("TRUNCATE listings, price_histories CASCADE; DELETE FROM price_alerts;")
		return c.JSON(fiber.Map{
			"status":  true,
			"message": "Semua data listings, riwayat harga, dan alerts berhasil dibersihkan total.",
		})
	})

	port := fmt.Sprintf(":%s", cfg.AppPort)
	log.Printf("DealHunter server starting on port %s", port)
	if err := app.Listen(port); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}
