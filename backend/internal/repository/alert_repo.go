package repository

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rdsarjito/dealhunter-backend/internal/domain/model"
	"gorm.io/gorm"
)

type AlertRepository struct {
	db *gorm.DB
}

func NewAlertRepository(db *gorm.DB) *AlertRepository {
	return &AlertRepository{db: db}
}

func (r *AlertRepository) Create(a *model.PriceAlert) error {
	return r.db.Create(a).Error
}

func (r *AlertRepository) GetAll() ([]model.PriceAlert, error) {
	var alerts []model.PriceAlert
	err := r.db.Order("created_at DESC").Find(&alerts).Error
	return alerts, err
}

func (r *AlertRepository) GetActive() ([]model.PriceAlert, error) {
	var alerts []model.PriceAlert
	err := r.db.Where("is_active = ?", true).Find(&alerts).Error
	return alerts, err
}

func (r *AlertRepository) GetByID(id uuid.UUID) (*model.PriceAlert, error) {
	var alert model.PriceAlert
	err := r.db.First(&alert, "id = ?", id).Error
	return &alert, err
}

func (r *AlertRepository) GetMatchingListings(alert *model.PriceAlert) ([]model.Listing, error) {
	var listings []model.Listing
	query := r.db.Model(&model.Listing{}).Where("price > 0 AND price <= ?", alert.MaxPrice)

	if alert.Keyword != "" {
		terms := strings.Fields(strings.ToLower(alert.Keyword))
		for _, term := range terms {
			query = query.Where("LOWER(title) LIKE ? OR LOWER(description) LIKE ?", "%"+term+"%", "%"+term+"%")
		}
	}

	if alert.Location != "" {
		query = query.Where("LOWER(location) LIKE ?", "%"+strings.ToLower(alert.Location)+"%")
	}

	err := query.Order("deal_score DESC, created_at DESC").Limit(100).Find(&listings).Error
	if err == nil && len(listings) > 0 {
		return listings, nil
	}

	// Fallback to broader search if location-specific yielded no rows
	var fallbackListings []model.Listing
	fbQuery := r.db.Model(&model.Listing{}).Where("price > 0 AND price <= ?", alert.MaxPrice)
	if alert.Keyword != "" {
		terms := strings.Fields(strings.ToLower(alert.Keyword))
		for _, term := range terms {
			fbQuery = fbQuery.Where("LOWER(title) LIKE ? OR LOWER(description) LIKE ?", "%"+term+"%", "%"+term+"%")
		}
	}
	err = fbQuery.Order("deal_score DESC, created_at DESC").Limit(100).Find(&fallbackListings).Error
	return fallbackListings, err
}

func (r *AlertRepository) Toggle(id uuid.UUID, active bool) error {
	return r.db.Model(&model.PriceAlert{}).Where("id = ?", id).Update("is_active", active).Error
}

func (r *AlertRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.PriceAlert{}, "id = ?", id).Error
}

func (r *AlertRepository) RecordTrigger(id uuid.UUID, matchedTitle string) error {
	now := time.Now()
	return r.db.Model(&model.PriceAlert{}).Where("id = ?", id).Updates(map[string]interface{}{
		"last_triggered_at":  &now,
		"last_matched_item": matchedTitle,
		"trigger_count":     gorm.Expr("trigger_count + 1"),
	}).Error
}

// TelegramSettingRepository manages bot chat registration
type TelegramSettingRepository struct {
	db *gorm.DB
}

func NewTelegramSettingRepository(db *gorm.DB) *TelegramSettingRepository {
	return &TelegramSettingRepository{db: db}
}

func (r *TelegramSettingRepository) Save(chatID, username string) (*model.TelegramSetting, error) {
	return r.Upsert(chatID, username)
}

func (r *TelegramSettingRepository) Upsert(chatID, username string) (*model.TelegramSetting, error) {
	var setting model.TelegramSetting
	err := r.db.Where("chat_id = ?", chatID).First(&setting).Error
	if err == nil {
		setting.Username = username
		setting.IsActive = true
		r.db.Save(&setting)
		return &setting, nil
	}

	setting = model.TelegramSetting{
		ChatID:   chatID,
		Username: username,
		IsActive: true,
	}
	err = r.db.Create(&setting).Error
	return &setting, err
}

func (r *TelegramSettingRepository) GetActive() ([]model.TelegramSetting, error) {
	var settings []model.TelegramSetting
	err := r.db.Where("is_active = ?", true).Find(&settings).Error
	return settings, err
}
