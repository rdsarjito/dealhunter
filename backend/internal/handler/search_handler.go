package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/rdsarjito/dealhunter-backend/internal/domain/dto"
	"github.com/rdsarjito/dealhunter-backend/internal/service"
)

type SearchHandler struct {
	searchService *service.SearchService
}

func NewSearchHandler(searchService *service.SearchService) *SearchHandler {
	return &SearchHandler{searchService: searchService}
}

func (h *SearchHandler) Search(c *fiber.Ctx) error {
	var req dto.SearchRequest
	if err := c.QueryParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid query parameters",
		})
	}

	if live := c.Query("live"); live == "true" || live == "1" {
		req.LiveScrape = true
	}

	if p := c.Query("min_price"); p != "" {
		if val, err := strconv.ParseFloat(p, 64); err == nil {
			req.MinPrice = &val
		}
	}
	if p := c.Query("max_price"); p != "" {
		if val, err := strconv.ParseFloat(p, 64); err == nil {
			req.MaxPrice = &val
		}
	}

	resp, err := h.searchService.Search(c.Context(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  false,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": true,
		"data":   resp,
	})
}
