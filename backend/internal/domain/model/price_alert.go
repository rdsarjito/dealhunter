package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PriceAlert struct {
	ID                uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Keyword           string         `gorm:"type:varchar(255);not null" json:"keyword"`
	MaxPrice          float64        `gorm:"type:decimal(15,2);not null" json:"max_price"`
	Location          string         `gorm:"type:varchar(255)" json:"location"`
	RadiusKM          int            `gorm:"default:50" json:"radius_km"`
	Category          string         `gorm:"type:varchar(100)" json:"category"`
	IsActive          bool           `gorm:"default:true" json:"is_active"`
	TelegramChatID    string         `gorm:"type:varchar(100)" json:"telegram_chat_id"`
	TriggerCount      int            `gorm:"default:0" json:"trigger_count"`
	MatchCount        int            `gorm:"-" json:"match_count"`
	LastTriggeredAt   *time.Time     `json:"last_triggered_at"`
	LastMatchedItem   string         `gorm:"type:text" json:"last_matched_item"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`
}

type TelegramSetting struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ChatID    string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"chat_id"`
	BotToken  string    `gorm:"type:text" json:"bot_token"`
	Username  string    `gorm:"type:varchar(100)" json:"username"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type FacebookSetting struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	CUser       string    `gorm:"type:varchar(100)" json:"c_user"`
	XSToken     string    `gorm:"type:text" json:"xs_token"`
	RawCookie   string    `gorm:"type:text" json:"raw_cookie"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	AccountName string    `gorm:"type:varchar(255)" json:"account_name"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type AlertMatchedListing struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	AlertID   uuid.UUID `gorm:"type:uuid;index;not null" json:"alert_id"`
	ListingID uuid.UUID `gorm:"type:uuid;index;not null" json:"listing_id"`
	Listing   Listing   `gorm:"foreignKey:ListingID" json:"listing"`
	CreatedAt time.Time `json:"created_at"`
}
