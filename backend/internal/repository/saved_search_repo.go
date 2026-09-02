package repository

import (
	"time"

	"github.com/google/uuid"
	"github.com/rdsarjito/dealhunter-backend/internal/domain/model"
	"gorm.io/gorm"
)

type SavedSearchRepository struct {
	db *gorm.DB
}

func NewSavedSearchRepository(db *gorm.DB) *SavedSearchRepository {
	return &SavedSearchRepository{db: db}
}

func (r *SavedSearchRepository) Create(s *model.SavedSearch) error {
	return r.db.Create(s).Error
}

func (r *SavedSearchRepository) GetAll() ([]model.SavedSearch, error) {
	var searches []model.SavedSearch
	err := r.db.Order("created_at DESC").Find(&searches).Error
	return searches, err
}

func (r *SavedSearchRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.SavedSearch{}, "id = ?", id).Error
}

func (r *SavedSearchRepository) UpdateLastRun(id uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&model.SavedSearch{}).Where("id = ?", id).Update("last_run_at", &now).Error
}
