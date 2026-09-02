package dto

import "github.com/rdsarjito/dealhunter-backend/internal/domain/model"

type SearchRequest struct {
	Keyword   string   `query:"keyword"`
	Location  string   `query:"location"`
	RadiusKM  int      `query:"radius_km"`
	MinPrice  *float64 `query:"min_price"`
	MaxPrice  *float64 `query:"max_price"`
	Category  string   `query:"category"`
	Condition string   `query:"condition"`
	SortBy    string   `query:"sort_by"` // deal_score, price_asc, price_desc, date_desc
	Page      int      `query:"page"`
	Limit     int      `query:"limit"`
	LiveScrape bool    `query:"live"`
}

type SearchResponse struct {
	Query          string          `json:"query"`
	Location       string          `json:"location"`
	RadiusKM       int             `json:"radius_km"`
	TotalResults   int             `json:"total_results"`
	Page           int             `json:"page"`
	Limit          int             `json:"limit"`
	MarketAvgPrice float64         `json:"market_avg_price"`
	MarketMinPrice float64         `json:"market_min_price"`
	MarketMaxPrice float64         `json:"market_max_price"`
	Listings       []model.Listing `json:"listings"`
	ScrapedLive    bool            `json:"scraped_live"`
}

type ConnectTelegramRequest struct {
	ChatID   string `json:"chat_id"`
	Username string `json:"username"`
}

type TestTelegramRequest struct {
	ChatID  string `json:"chat_id"`
	Message string `json:"message"`
}
