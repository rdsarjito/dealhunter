package repository

import (
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
	if err != nil {
		return alerts, err
	}
	for i := range alerts {
		if listings, err := r.GetMatchingListings(&alerts[i]); err == nil {
			alerts[i].MatchCount = len(listings)
		}
	}
	return alerts, nil
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

func (r *AlertRepository) HasMatch(alertID, listingID uuid.UUID) bool {
	var count int64
	r.db.Model(&model.AlertMatchedListing{}).
		Where("alert_id = ? AND listing_id = ?", alertID, listingID).
		Count(&count)
	return count > 0
}

func (r *AlertRepository) AddMatchedListing(alertID, listingID uuid.UUID) error {
	match := model.AlertMatchedListing{
		AlertID:   alertID,
		ListingID: listingID,
	}
	return r.db.Create(&match).Error
}

func (r *AlertRepository) GetMatchingListings(alert *model.PriceAlert) ([]model.Listing, error) {
	var listings []model.Listing
	// Query listings specifically captured by this alert radar
	err := r.db.Table("listings").
		Select("listings.*").
		Joins("JOIN alert_matched_listings ON alert_matched_listings.listing_id = listings.id").
		Where("alert_matched_listings.alert_id = ?", alert.ID).
		Order("alert_matched_listings.created_at DESC").
		Find(&listings).Error
	return listings, err
}

func (r *AlertRepository) Toggle(id uuid.UUID, active bool) error {
	return r.db.Model(&model.PriceAlert{}).Where("id = ?", id).Update("is_active", active).Error
}

func (r *AlertRepository) Delete(id uuid.UUID) error {
	// Clean up matched listings for this alert
	_ = r.db.Where("alert_id = ?", id).Delete(&model.AlertMatchedListing{}).Error
	return r.db.Unscoped().Delete(&model.PriceAlert{}, "id = ?", id).Error
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

func (r *TelegramSettingRepository) Save(chatID, username, botToken string) (*model.TelegramSetting, error) {
	return r.Upsert(chatID, username, botToken)
}

func (r *TelegramSettingRepository) Upsert(chatID, username, botToken string) (*model.TelegramSetting, error) {
	var setting model.TelegramSetting
	err := r.db.Where("chat_id = ?", chatID).First(&setting).Error
	if err == nil {
		setting.Username = username
		if botToken != "" {
			setting.BotToken = botToken
		}
		setting.IsActive = true
		r.db.Save(&setting)
		return &setting, nil
	}

	setting = model.TelegramSetting{
		ChatID:   chatID,
		Username: username,
		BotToken: botToken,
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

func (r *TelegramSettingRepository) DeactivateAll() error {
	return r.db.Model(&model.TelegramSetting{}).Where("1=1").Update("is_active", false).Error
}
