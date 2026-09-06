package dto

import (
	"time"

	"github.com/google/uuid"
	"github.com/rdsarjito/dealhunter-backend/internal/domain/model"
)

type NotificationItem struct {
	ID             uuid.UUID     `json:"id"`
	CreatedAt      time.Time     `json:"created_at"`
	AlertID        uuid.UUID     `json:"alert_id"`
	AlertKeyword   string        `json:"alert_keyword"`
	AlertThumbnail string        `json:"alert_thumbnail"`
	Listing        model.Listing `json:"listing"`
}
