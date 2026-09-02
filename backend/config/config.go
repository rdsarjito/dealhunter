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

	log.Printf("[Config] Loaded environment for port: %s, DB: %s@%s:%s/%s", port, dbUser, dbHost, dbPort, dbName)

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
	}
}
