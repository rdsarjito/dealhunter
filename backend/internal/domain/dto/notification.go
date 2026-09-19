package dto

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rdsarjito/dealhunter-backend/internal/domain/model"
)

type NotificationItem struct {
	ID             uuid.UUID     `json:"id"`
	CreatedAt      time.Time     `json:"created_at"`
	AlertID        uuid.UUID     `json:"alert_id"`
	AlertKeyword   string        `json:"alert_keyword"`
	// AlertThumbnail: hanya kirim URL publik (bukan base64).
	// Jika masih base64 (data lama belum dimigrate), kirim string kosong
	// agar payload tidak bengkak 1.3 MB per item.
	AlertThumbnail string        `json:"alert_thumbnail"`
	Listing        model.Listing `json:"listing"`
}

// SanitizeThumbnail memastikan AlertThumbnail tidak berisi raw base64.
// Dipanggil sebelum response dikirim ke client.
func (n *NotificationItem) SanitizeThumbnail() {
	if strings.HasPrefix(n.AlertThumbnail, "data:") {
		n.AlertThumbnail = "" // kosongkan — frontend akan pakai placeholder
	}
}
