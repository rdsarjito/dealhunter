package dto

// CreateAlertRequest adalah DTO untuk POST /api/v1/alerts
type CreateAlertRequest struct {
	Keyword         string   `json:"keyword"          validate:"required,min=1,max=255"`
	MinPrice        float64  `json:"min_price"        validate:"gte=0"`
	MaxPrice        float64  `json:"max_price"        validate:"required,gt=0"`
	Location        string   `json:"location"         validate:"max=255"`
	Latitude        *float64 `json:"latitude"`
	Longitude       *float64 `json:"longitude"`
	RadiusKM        int      `json:"radius_km"        validate:"gte=0,lte=500"`
	Category        string   `json:"category"         validate:"max=100"`
	IntervalMinutes int      `json:"interval_minutes" validate:"gte=0,lte=1440"` // max 24 jam
	TelegramChatID  string   `json:"telegram_chat_id" validate:"max=100"`
	ThumbnailURL    string   `json:"thumbnail_url"`
}

// UpdateAlertRequest adalah DTO untuk PUT /api/v1/alerts/:id
type UpdateAlertRequest struct {
	Keyword         string   `json:"keyword"          validate:"required,min=1,max=255"`
	MinPrice        float64  `json:"min_price"        validate:"gte=0"`
	MaxPrice        float64  `json:"max_price"        validate:"required,gt=0"`
	Location        string   `json:"location"         validate:"max=255"`
	Latitude        *float64 `json:"latitude"`
	Longitude       *float64 `json:"longitude"`
	RadiusKM        int      `json:"radius_km"        validate:"gte=0,lte=500"`
	Category        string   `json:"category"         validate:"max=100"`
	IntervalMinutes int      `json:"interval_minutes" validate:"gte=0,lte=1440"`
	ThumbnailURL    string   `json:"thumbnail_url"`
}
