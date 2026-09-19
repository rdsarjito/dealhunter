//go:build ignore

// migrate_thumbnails.go — one-shot script untuk migrasi alert_thumbnail dari base64 ke MinIO URL
// Jalankan: go run scripts/migrate_thumbnails.go
//
// Script ini membaca semua price_alerts yang thumbnail_url-nya masih base64,
// upload ke MinIO, lalu update URL di database.

package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/rdsarjito/dealhunter-backend/internal/storage"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

type PriceAlertRow struct {
	ID           string `gorm:"column:id"`
	ThumbnailURL string `gorm:"column:thumbnail_url"`
}

func main() {
	_ = godotenv.Load()

	// DB
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta",
		getenv("DB_HOST", "localhost"),
		getenv("DB_USER", "rama"),
		getenv("DB_PASSWORD", ""),
		getenv("DB_NAME", "dealhunter"),
		getenv("DB_PORT", "5432"),
	)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: gormlogger.Default.LogMode(gormlogger.Silent)})
	if err != nil {
		log.Fatalf("DB connect failed: %v", err)
	}

	// MinIO
	storageSvc, err := storage.New(
		getenv("MINIO_ENDPOINT", "localhost:9000"),
		getenv("MINIO_ACCESS_KEY", "dealhunter"),
		getenv("MINIO_SECRET_KEY", "dealhunter_minio_secret"),
		getenv("MINIO_BUCKET", "dealhunter"),
		getenv("MINIO_PUBLIC_URL", "http://localhost:9000/dealhunter"),
		os.Getenv("MINIO_USE_SSL") == "true",
	)
	if err != nil {
		log.Fatalf("MinIO connect failed: %v", err)
	}

	// Fetch semua alert yang thumbnail masih base64
	var alerts []PriceAlertRow
	db.Raw("SELECT id, thumbnail_url FROM price_alerts WHERE thumbnail_url LIKE 'data:%'").Scan(&alerts)

	if len(alerts) == 0 {
		log.Println("Tidak ada thumbnail base64 yang perlu dimigrate.")
		return
	}

	log.Printf("Ditemukan %d alert dengan thumbnail base64, mulai migrasi...", len(alerts))

	ctx := context.Background()
	success, failed := 0, 0

	for _, a := range alerts {
		ext := "png"
		if strings.Contains(a.ThumbnailURL[:min(50, len(a.ThumbnailURL))], "jpeg") {
			ext = "jpg"
		}
		objectName := fmt.Sprintf("thumbnails/alert-%s-%d.%s", a.ID, time.Now().UnixMilli(), ext)

		url, err := storageSvc.UploadBase64(ctx, objectName, a.ThumbnailURL)
		if err != nil {
			log.Printf("  [GAGAL] alert %s: %v", a.ID, err)
			failed++
			continue
		}

		if err := db.Exec("UPDATE price_alerts SET thumbnail_url = ? WHERE id = ?", url, a.ID).Error; err != nil {
			log.Printf("  [GAGAL UPDATE DB] alert %s: %v", a.ID, err)
			failed++
			continue
		}

		log.Printf("  [OK] alert %s → %s", a.ID, url)
		success++
	}

	log.Printf("\nSelesai: %d berhasil, %d gagal dari %d total.", success, failed, len(alerts))
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
