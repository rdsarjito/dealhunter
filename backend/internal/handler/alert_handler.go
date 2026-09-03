package handler

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rdsarjito/dealhunter-backend/internal/domain/model"
	"github.com/rdsarjito/dealhunter-backend/internal/repository"
	"github.com/rdsarjito/dealhunter-backend/internal/service"
)

type AlertHandler struct {
	repo    *repository.AlertRepository
	watcher *service.AlertWatcher
}

func NewAlertHandler(repo *repository.AlertRepository, watcher *service.AlertWatcher) *AlertHandler {
	return &AlertHandler{repo: repo, watcher: watcher}
}

func (h *AlertHandler) GetAll(c *fiber.Ctx) error {
	list, err := h.repo.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  false,
			"message": err.Error(),
		})
	}
	return c.JSON(fiber.Map{
		"status": true,
		"data":   list,
	})
}

func (h *AlertHandler) Create(c *fiber.Ctx) error {
	var a model.PriceAlert
	if err := c.BodyParser(&a); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid request body",
		})
	}

	if a.Keyword == "" || a.MaxPrice <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Keyword dan harga maksimal wajib diisi",
		})
	}

	a.IsActive = true
	if err := h.repo.Create(&a); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  false,
			"message": err.Error(),
		})
	}

	// Trigger immediate scan in background so new alert is evaluated right away
	if h.watcher != nil {
		go h.watcher.ScanAll(context.Background())
	}

	return c.JSON(fiber.Map{
		"status":  true,
		"message": "Price Alert berhasil dibuat & background scanner langsung dijalankan",
		"data":    a,
	})
}

func (h *AlertHandler) Toggle(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid alert ID",
		})
	}

	var req struct {
		IsActive bool `json:"is_active"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid request body",
		})
	}

	if err := h.repo.Toggle(id, req.IsActive); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  false,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  true,
		"message": "Status alert berhasil diperbarui",
	})
}

func (h *AlertHandler) Delete(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid alert ID",
		})
	}

	if err := h.repo.Delete(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  false,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  true,
		"message": "Price alert berhasil dihapus",
	})
}

func (h *AlertHandler) ScanNow(c *fiber.Ctx) error {
	if h.watcher != nil {
		go h.watcher.ScanAll(context.Background())
	}
	return c.JSON(fiber.Map{
		"status":  true,
		"message": "Pemindaian background FB Marketplace untuk semua alert aktif telah dimulai.",
	})
}

// GetAlertListings returns all listings matching this specific alert
func (h *AlertHandler) GetAlertListings(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid alert ID",
		})
	}

	alert, err := h.repo.GetByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  false,
			"message": "Alert tidak ditemukan",
		})
	}

	listings, err := h.repo.GetMatchingListings(alert)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  false,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": true,
		"alert":  alert,
		"count":  len(listings),
		"data":   listings,
	})
}

func (h *AlertHandler) GetWatcherStatus(c *fiber.Ctx) error {
	if h.watcher == nil {
		return c.JSON(fiber.Map{
			"status": true,
			"data": fiber.Map{
				"is_scanning": false,
			},
		})
	}
	return c.JSON(fiber.Map{
		"status": true,
		"data":   h.watcher.GetStatus(),
	})
}
