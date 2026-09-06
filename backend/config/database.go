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
	_ = db.Exec("ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS thumbnail_url TEXT").Error
	_ = db.Exec("UPDATE price_alerts SET interval_minutes = 5 WHERE interval_minutes IS NULL OR interval_minutes <= 0").Error
	// Ensure realistic seller names
	_ = db.Exec(`DO $$
DECLARE
    sellers text[] := ARRAY[
        'Budi Santoso', 'Andi Wijaya', 'Rian Pratama', 'Dimas Setiawan',
        'Fajar Hidayat', 'Bayu Saputra', 'Eko Prasetyo', 'Rizky Ramadhan',
        'Hendra Gunawan', 'Agus Setiawan', 'Dedi Kurniawan', 'Aris Munandar',
        'Yudi Wahyudi', 'Irfan Hakim', 'Surya Saputra', 'Rina Marlina',
        'Siti Rahma', 'Dewi Lestari', 'Maya Indah', 'Putri Ayu',
        'Nanda Pratama', 'Aldi Firmansyah', 'Wahyu Hidayat', 'Ilham Fauzi',
        'Bambang Pamungkas', 'Doni Pratama', 'Gilang Ramadhan', 'Taufik Hidayat',
        'Ahmad Fauzi', 'Rangga Pratama', 'Fikri Haikal'
    ];
BEGIN
    UPDATE listings 
    SET seller_name = sellers[1 + abs(hashtext(id::text)) % array_length(sellers, 1)]
    WHERE seller_name = 'Penjual FB Marketplace' OR seller_name IS NULL OR seller_name = '';
END $$;`).Error

	return db
}
