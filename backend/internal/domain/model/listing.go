package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Listing struct {
	ID              uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	FBListingID     string         `gorm:"type:varchar(255);uniqueIndex" json:"fb_listing_id"`
	Title           string         `gorm:"type:varchar(500);not null" json:"title"`
	Description     string         `gorm:"type:text" json:"description"`
	Price           float64        `gorm:"type:decimal(15,2);index" json:"price"`
	Currency        string         `gorm:"type:varchar(10);default:'IDR'" json:"currency"`
	Location        string         `gorm:"type:varchar(255);index" json:"location"`
	Latitude        *float64       `gorm:"type:decimal(10,7)" json:"latitude"`
	Longitude       *float64       `gorm:"type:decimal(10,7)" json:"longitude"`
	Category        string         `gorm:"type:varchar(100);index" json:"category"`
	Condition       string         `gorm:"type:varchar(50)" json:"condition"`
	SellerName      string         `gorm:"type:varchar(255)" json:"seller_name"`
	Images          string         `gorm:"type:jsonb;default:'[]'" json:"images"` // JSON array string
	FBURL           string         `gorm:"type:text;not null" json:"fb_url"`
	DealScore       float64        `gorm:"type:decimal(4,2);index" json:"deal_score"` // 0.00 - 1.00
	DealRating      string         `gorm:"type:varchar(50)" json:"deal_rating"` // great_deal, good_deal, fair_price, overpriced
	MarketAvgPrice  float64        `gorm:"type:decimal(15,2)" json:"market_avg_price"`
	DiscountPercent float64        `gorm:"type:decimal(5,2)" json:"discount_percent"`
	ListedAt        *time.Time     `json:"listed_at"`
	ScrapedAt       time.Time      `json:"scraped_at"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

type Watchlist struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ListingID uuid.UUID      `gorm:"type:uuid;not null;index" json:"listing_id"`
	Listing   Listing        `gorm:"foreignKey:ListingID" json:"listing"`
	Notes     string         `gorm:"type:text" json:"notes"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type PriceHistory struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Keyword      string    `gorm:"type:varchar(255);index" json:"keyword"`
	Location     string    `gorm:"type:varchar(255);index" json:"location"`
	AvgPrice     float64   `gorm:"type:decimal(15,2)" json:"avg_price"`
	MinPrice     float64   `gorm:"type:decimal(15,2)" json:"min_price"`
	MaxPrice     float64   `gorm:"type:decimal(15,2)" json:"max_price"`
	ListingCount int       `json:"listing_count"`
	RecordedAt   time.Time `gorm:"index" json:"recorded_at"`
}

type SearchHistory struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Keyword     string    `gorm:"type:varchar(255);index" json:"keyword"`
	Location    string    `gorm:"type:varchar(255)" json:"location"`
	RadiusKM    int       `json:"radius_km"`
	ResultCount int       `json:"result_count"`
	SearchedAt  time.Time `json:"searched_at"`
}
