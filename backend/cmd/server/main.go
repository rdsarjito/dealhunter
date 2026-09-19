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
	"github.com/rdsarjito/dealhunter-backend/internal/middleware"
	"github.com/rdsarjito/dealhunter-backend/internal/notifier"
	"github.com/rdsarjito/dealhunter-backend/internal/repository"
	"github.com/rdsarjito/dealhunter-backend/internal/scraper"
	"github.com/rdsarjito/dealhunter-backend/internal/service"
	"github.com/rdsarjito/dealhunter-backend/internal/storage"
)

func main() {
	cfg := config.LoadConfig()
	db := config.InitDatabase(cfg)

	// Clean up any dirty/foreign listings from previous scrapes
	db.Exec("DELETE FROM listings WHERE price < 10000 OR location ILIKE '%CA%' OR location ILIKE '%NY%' OR location ILIKE '%TX%' OR location ILIKE '%FL%' OR location ILIKE '%San Francisco%' OR location ILIKE '%Los Angeles%' OR location ILIKE '%Daly City%' OR location ILIKE '%Monterey%' OR location ILIKE '%Carmel%' OR location ILIKE '%Walnut Creek%' OR location ILIKE '%Pacifica%' OR location ILIKE '%United States%' OR location ILIKE '%USA%'")
	db.Exec("UPDATE telegram_settings SET is_active = false WHERE chat_id = '999999999'")
	log.Println("[DB] Cleaned up foreign/invalid listings and dummy telegram records from database.")

	// MinIO Storage Service
	storageSvc, err := storage.New(
		cfg.MinioEndpoint,
		cfg.MinioAccessKey,
		cfg.MinioSecretKey,
		cfg.MinioBucket,
		cfg.MinioPublicURL,
		cfg.MinioUseSSL,
	)
	if err != nil {
		// Storage tidak fatal — log warning dan lanjut tanpa MinIO
		log.Printf("[Storage] WARNING: MinIO unavailable (%v) — thumbnail upload disabled", err)
		storageSvc = nil
	}

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
	alertHandler := handler.NewAlertHandler(alertRepo, alertWatcher, storageSvc)
	telegramHandler := handler.NewTelegramHandler(telegramRepo, telegramNotifier)
	fbHandler := handler.NewFacebookHandler(fbSettingRepo, fbScraper)

	// Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "DealHunter API v1.0",
		ErrorHandler: middleware.GlobalErrorHandler, // sanitize error — tidak expose internal error ke client
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

	// ── Public (read-only) — tidak perlu API key ────────────────────────────
	api.Use(middleware.RateLimitPublic())
	api.Get("/search", searchHandler.Search)
	api.Get("/listings/:id", listingHandler.GetByID)
	api.Get("/watchlist", listingHandler.GetWatchlist)
	api.Get("/saved-searches", savedHandler.GetAll)
	api.Get("/alerts", alertHandler.GetAll)
	api.Get("/alerts/watcher/status", alertHandler.GetWatcherStatus)
	api.Get("/alerts/:id/listings", alertHandler.GetAlertListings)
	api.Get("/notifications", alertHandler.GetNotifications)
	api.Get("/telegram/status", telegramHandler.GetStatus)
	api.Get("/facebook/status", fbHandler.GetStatus)

	// ── Protected (write) — wajib X-API-Key header ──────────────────────────
	protected := api.Group("", middleware.RequireAPIKey(), middleware.RateLimitWrite())

	// Watchlist
	protected.Post("/watchlist", listingHandler.AddToWatchlist)
	protected.Delete("/watchlist/:id", listingHandler.RemoveFromWatchlist)

	// Saved Searches
	protected.Post("/saved-searches", savedHandler.Create)
	protected.Delete("/saved-searches/:id", savedHandler.Delete)

	// Price Alerts
	protected.Post("/alerts", alertHandler.Create)
	protected.Put("/alerts/:id", alertHandler.Update)
	protected.Put("/alerts/:id/toggle", alertHandler.Toggle)
	protected.Delete("/alerts/:id", alertHandler.Delete)
	protected.Post("/alerts/scan-now", middleware.RateLimitScan(), alertHandler.ScanNow)
	protected.Post("/alerts/:id/scan", middleware.RateLimitScan(), alertHandler.ScanSingle)

	// Telegram Settings
	protected.Post("/telegram/connect", telegramHandler.Connect)
	protected.Post("/telegram/disconnect", telegramHandler.Disconnect)
	protected.Post("/telegram/test", telegramHandler.TestMessage)

	// Facebook Session
	protected.Post("/facebook/connect", fbHandler.Connect)
	protected.Post("/facebook/disconnect", fbHandler.Disconnect)

	// Admin / Maintenance API — wajib X-API-Key
	protected.Post("/admin/purge-foreign", func(c *fiber.Ctx) error {
		res := db.Exec("DELETE FROM listings WHERE price < 10000 OR location ILIKE '%, CA%' OR location ILIKE '%, NY%' OR location ILIKE '%, TX%' OR location ILIKE '%, FL%' OR location ILIKE '%California%' OR location ILIKE '%Los Angeles%' OR location ILIKE '%San Francisco%' OR location ILIKE '%Berkeley%' OR location ILIKE '%Sacramento%' OR location ILIKE '%Downey%' OR location ILIKE '%Azusa%' OR location ILIKE '%Los Banos%' OR location ILIKE '%Olivehurst%' OR location ILIKE '%USA%' OR location ILIKE '%United States%'")
		return c.JSON(fiber.Map{
			"status":       true,
			"deleted_rows": res.RowsAffected,
			"message":      "Pembersihan listing asing dan harga abnormal berhasil dijalankan.",
		})
	})
	protected.Post("/admin/clear-all", func(c *fiber.Ctx) error {
		db.Exec("TRUNCATE listings, price_histories CASCADE; DELETE FROM price_alerts;")
		return c.JSON(fiber.Map{
			"status":  true,
			"message": "Semua data listings, riwayat harga, dan alerts berhasil dibersihkan total.",
		})
	})

	// One-shot migration: pindahkan thumbnail base64 lama dari DB ke MinIO
	// Panggil sekali via: POST /api/v1/admin/migrate-thumbnails
	protected.Post("/admin/migrate-thumbnails", func(c *fiber.Ctx) error {
		if storageSvc == nil {
			return c.Status(503).JSON(fiber.Map{
				"status":  false,
				"message": "MinIO tidak tersedia. Periksa konfigurasi MINIO_* env vars.",
			})
		}

		type AlertRow struct {
			ID           string `gorm:"column:id"`
			ThumbnailURL string `gorm:"column:thumbnail_url"`
		}
		var alerts []AlertRow
		db.Raw("SELECT id, thumbnail_url FROM price_alerts WHERE thumbnail_url LIKE 'data:%'").Scan(&alerts)

		if len(alerts) == 0 {
			return c.JSON(fiber.Map{
				"status":  true,
				"message": "Tidak ada thumbnail base64 yang perlu dimigrate.",
				"migrated": 0,
			})
		}

		ctx := c.Context()
		success, failed := 0, 0
		results := make([]fiber.Map, 0, len(alerts))

		for _, a := range alerts {
			ext := "png"
			preview := a.ThumbnailURL
			if len(preview) > 40 {
				preview = preview[:40]
			}
			if len(a.ThumbnailURL) > 0 {
				if len(a.ThumbnailURL) > 20 && (a.ThumbnailURL[11:15] == "jpeg" || a.ThumbnailURL[11:15] == "jpg/") {
					ext = "jpg"
				}
			}
			objectName := fmt.Sprintf("thumbnails/alert-%s.%s", a.ID, ext)

			url, err := storageSvc.UploadBase64(ctx, objectName, a.ThumbnailURL)
			if err != nil {
				results = append(results, fiber.Map{"id": a.ID, "status": "failed", "error": err.Error()})
				failed++
				continue
			}

			if err := db.Exec("UPDATE price_alerts SET thumbnail_url = ? WHERE id = ?", url, a.ID).Error; err != nil {
				results = append(results, fiber.Map{"id": a.ID, "status": "db_error", "error": err.Error()})
				failed++
				continue
			}

			results = append(results, fiber.Map{"id": a.ID, "status": "ok", "url": url})
			success++
		}

		return c.JSON(fiber.Map{
			"status":   true,
			"total":    len(alerts),
			"migrated": success,
			"failed":   failed,
			"results":  results,
		})
	})

	port := fmt.Sprintf(":%s", cfg.AppPort)
	log.Printf("DealHunter server starting on port %s", port)
	if err := app.Listen(port); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}
