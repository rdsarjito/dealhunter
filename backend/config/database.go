package config

import (
	"fmt"
	"log"

	"github.com/rdsarjito/dealhunter-backend/internal/domain/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func InitDatabase(cfg *Config) *gorm.DB {
	var dsn string
	if cfg.DBPassword != "" {
		dsn = fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Jakarta",
			cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort, cfg.DBSSLMode)
	} else {
		dsn = fmt.Sprintf("host=%s user=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Jakarta",
			cfg.DBHost, cfg.DBUser, cfg.DBName, cfg.DBPort, cfg.DBSSLMode)
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("[DB] Failed to connect to database: %v", err)
	}

	log.Println("[DB] Successfully connected to PostgreSQL")

	// AutoMigrate models
	err = db.AutoMigrate(
		&model.Listing{},
		&model.SavedSearch{},
		&model.Watchlist{},
		&model.PriceAlert{},
		&model.PriceHistory{},
		&model.SearchHistory{},
		&model.TelegramSetting{},
		&model.FacebookSetting{},
		&model.AlertMatchedListing{},
	)
	if err != nil {
		log.Fatalf("[DB] Failed to run auto migration: %v", err)
	}

	log.Println("[DB] Auto-migration completed successfully")

	// Ensure columns and default values for interval_minutes & last_scanned_at
	_ = db.Exec("ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS interval_minutes INTEGER DEFAULT 5").Error
	_ = db.Exec("ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMPTZ").Error
	_ = db.Exec("UPDATE price_alerts SET interval_minutes = 5 WHERE interval_minutes IS NULL OR interval_minutes <= 0").Error

	return db
}
