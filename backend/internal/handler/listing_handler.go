package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rdsarjito/dealhunter-backend/internal/repository"
)

type ListingHandler struct {
	repo *repository.ListingRepository
}

func NewListingHandler(repo *repository.ListingRepository) *ListingHandler {
	return &ListingHandler{repo: repo}
}

func (h *ListingHandler) GetByID(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid listing ID format",
		})
	}

	listing, err := h.repo.GetByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  false,
			"message": "Listing not found",
		})
	}

	similar, _ := h.repo.GetSimilar(listing)

	return c.JSON(fiber.Map{
		"status":  true,
		"data":    listing,
		"similar": similar,
	})
}

func (h *ListingHandler) GetWatchlist(c *fiber.Ctx) error {
	list, err := h.repo.GetWatchlist()
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

func (h *ListingHandler) AddToWatchlist(c *fiber.Ctx) error {
	type Req struct {
		ListingID string `json:"listing_id"`
		Notes     string `json:"notes"`
	}
	var req Req
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid body",
		})
	}

	id, err := uuid.Parse(req.ListingID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid listing ID",
		})
	}

	w, err := h.repo.AddToWatchlist(id, req.Notes)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  false,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  true,
		"message": "Item ditambahkan ke watchlist",
		"data":    w,
	})
}

func (h *ListingHandler) RemoveFromWatchlist(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid ID",
		})
	}

	if err := h.repo.RemoveFromWatchlist(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  false,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  true,
		"message": "Item dihapus dari watchlist",
	})
}
