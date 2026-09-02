package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rdsarjito/dealhunter-backend/internal/domain/model"
	"github.com/rdsarjito/dealhunter-backend/internal/repository"
)

type SavedHandler struct {
	repo *repository.SavedSearchRepository
}

func NewSavedHandler(repo *repository.SavedSearchRepository) *SavedHandler {
	return &SavedHandler{repo: repo}
}

func (h *SavedHandler) GetAll(c *fiber.Ctx) error {
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

func (h *SavedHandler) Create(c *fiber.Ctx) error {
	var s model.SavedSearch
	if err := c.BodyParser(&s); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid request body",
		})
	}

	if s.Keyword == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Keyword harus diisi",
		})
	}

	if err := h.repo.Create(&s); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  false,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  true,
		"message": "Pencarian berhasil disimpan",
		"data":    s,
	})
}

func (h *SavedHandler) Delete(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid ID",
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
		"message": "Pencarian tersimpan berhasil dihapus",
	})
}
