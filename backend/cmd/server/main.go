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
	db.Exec("DELETE FROM listings")
	log.Println("[DB] Cleared all old listings. Fresh data will be scraped automatically.")

	// Repositories
	listingRepo := repository.NewListingRepository(db)
	savedRepo := repository.NewSavedSearchRepository(db)
	alertRepo := repository.NewAlertRepository(db)
	telegramRepo := repository.NewTelegramSettingRepository(db)

	// Scraper & Notifier
	fbScraper := scraper.NewFacebookScraper(true)
	telegramNotifier := notifier.NewTelegramNotifier(cfg.TelegramBotToken)

	// Services
	searchService := service.NewSearchService(listingRepo, alertRepo, telegramRepo, fbScraper, telegramNotifier)

	// Background Alert Watcher (Automatically scans Facebook Marketplace every 2 minutes)
	alertWatcher := service.NewAlertWatcher(alertRepo, listingRepo, telegramRepo, fbScraper, telegramNotifier, 2*time.Minute)
	alertWatcher.Start(context.Background())

	// Handlers
	searchHandler := handler.NewSearchHandler(searchService)
	listingHandler := handler.NewListingHandler(listingRepo)
	savedHandler := handler.NewSavedHandler(savedRepo)
	alertHandler := handler.NewAlertHandler(alertRepo, alertWatcher)
	telegramHandler := handler.NewTelegramHandler(telegramRepo, telegramNotifier)

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
	api.Get("/alerts/:id/listings", alertHandler.GetAlertListings)

	// Telegram Settings & Test
	api.Get("/telegram/status", telegramHandler.GetStatus)
	api.Post("/telegram/connect", telegramHandler.Connect)
	api.Post("/telegram/test", telegramHandler.TestMessage)

	port := fmt.Sprintf(":%s", cfg.AppPort)
	log.Printf("DealHunter server starting on port %s", port)
	if err := app.Listen(port); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}
