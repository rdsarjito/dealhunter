package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort          string
	AppHost          string
	DBHost           string
	DBPort           string
	DBUser           string
	DBPassword       string
	DBName           string
	DBSSLMode        string
	TelegramBotToken string

	// MinIO / S3 object storage
	MinioEndpoint  string
	MinioAccessKey string
	MinioSecretKey string
	MinioBucket    string
	MinioPublicURL string // public base URL for serving files
	MinioUseSSL    bool
}

func LoadConfig() *Config {
	_ = godotenv.Load()

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	host := os.Getenv("APP_HOST")
	if host == "" {
		host = "0.0.0.0"
	}

	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}

	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}

	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "rama"
	}

	dbPassword := os.Getenv("DB_PASSWORD")

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "dealhunter"
	}

	dbSSLMode := os.Getenv("DB_SSLMODE")
	if dbSSLMode == "" {
		dbSSLMode = "disable"
	}

	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")

	// MinIO config
	minioEndpoint := os.Getenv("MINIO_ENDPOINT")
	if minioEndpoint == "" {
		minioEndpoint = "localhost:9000"
	}
	minioAccessKey := os.Getenv("MINIO_ACCESS_KEY")
	if minioAccessKey == "" {
		minioAccessKey = "dealhunter"
	}
	minioSecretKey := os.Getenv("MINIO_SECRET_KEY")
	if minioSecretKey == "" {
		minioSecretKey = "dealhunter_minio_secret"
	}
	minioBucket := os.Getenv("MINIO_BUCKET")
	if minioBucket == "" {
		minioBucket = "dealhunter"
	}
	minioPublicURL := os.Getenv("MINIO_PUBLIC_URL")
	if minioPublicURL == "" {
		minioPublicURL = "http://localhost:9000/dealhunter"
	}
	minioUseSSL := os.Getenv("MINIO_USE_SSL") == "true"

	log.Printf("[Config] Loaded: port=%s DB=%s@%s:%s/%s MinIO=%s bucket=%s",
		port, dbUser, dbHost, dbPort, dbName, minioEndpoint, minioBucket)

	return &Config{
		AppPort:          port,
		AppHost:          host,
		DBHost:           dbHost,
		DBPort:           dbPort,
		DBUser:           dbUser,
		DBPassword:       dbPassword,
		DBName:           dbName,
		DBSSLMode:        dbSSLMode,
		TelegramBotToken: botToken,
		MinioEndpoint:    minioEndpoint,
		MinioAccessKey:   minioAccessKey,
		MinioSecretKey:   minioSecretKey,
		MinioBucket:      minioBucket,
		MinioPublicURL:   minioPublicURL,
		MinioUseSSL:      minioUseSSL,
	}
}
