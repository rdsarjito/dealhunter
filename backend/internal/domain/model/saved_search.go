package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SavedSearch struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name      string         `gorm:"type:varchar(255)" json:"name"`
	Keyword   string         `gorm:"type:varchar(255);not null" json:"keyword"`
	MinPrice  *float64       `gorm:"type:decimal(15,2)" json:"min_price"`
	MaxPrice  *float64       `gorm:"type:decimal(15,2)" json:"max_price"`
	Location  string         `gorm:"type:varchar(255)" json:"location"`
	RadiusKM  int            `gorm:"default:50" json:"radius_km"`
	Category  string         `gorm:"type:varchar(100)" json:"category"`
	Condition string         `gorm:"type:varchar(50)" json:"condition"`
	SortBy    string         `gorm:"type:varchar(50);default:'deal_score'" json:"sort_by"`
	LastRunAt *time.Time     `json:"last_run_at"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
