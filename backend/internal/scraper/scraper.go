package scraper

import (
	"context"
	"time"
)

type ScrapedItem struct {
	FBListingID string
	Title       string
	Description string
	Price       float64
	Currency    string
	Location    string
	Category    string
	Condition   string
	SellerName  string
	Images      []string
	FBURL       string
	ListedAt    *time.Time
}

type MarketplaceScraper interface {
	Search(ctx context.Context, keyword, location string, radiusKM int, minPrice, maxPrice *float64) ([]ScrapedItem, error)
}
