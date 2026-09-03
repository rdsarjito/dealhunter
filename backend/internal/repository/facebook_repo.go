package repository

import (
	"github.com/rdsarjito/dealhunter-backend/internal/domain/model"
	"gorm.io/gorm"
)

type FacebookSettingRepository struct {
	db *gorm.DB
}

func NewFacebookSettingRepository(db *gorm.DB) *FacebookSettingRepository {
	return &FacebookSettingRepository{db: db}
}

func (r *FacebookSettingRepository) GetActive() (*model.FacebookSetting, error) {
	var setting model.FacebookSetting
	err := r.db.Where("is_active = ?", true).Order("updated_at DESC").First(&setting).Error
	if err != nil {
		return nil, err
	}
	return &setting, nil
}

func (r *FacebookSettingRepository) Save(cUser, xsToken, rawCookie, accountName string) (*model.FacebookSetting, error) {
	// Deactivate all previous settings first
	_ = r.db.Model(&model.FacebookSetting{}).Where("is_active = ?", true).Update("is_active", false)

	setting := model.FacebookSetting{
		CUser:       cUser,
		XSToken:     xsToken,
		RawCookie:   rawCookie,
		IsActive:    true,
		AccountName: accountName,
	}
	err := r.db.Create(&setting).Error
	return &setting, err
}

func (r *FacebookSettingRepository) Deactivate() error {
	return r.db.Model(&model.FacebookSetting{}).Where("is_active = ?", true).Update("is_active", false).Error
}
