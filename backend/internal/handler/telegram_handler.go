package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/rdsarjito/dealhunter-backend/internal/domain/dto"
	"github.com/rdsarjito/dealhunter-backend/internal/notifier"
	"github.com/rdsarjito/dealhunter-backend/internal/repository"
)

type TelegramHandler struct {
	repo     *repository.TelegramSettingRepository
	notifier *notifier.TelegramNotifier
}

func NewTelegramHandler(repo *repository.TelegramSettingRepository, notifier *notifier.TelegramNotifier) *TelegramHandler {
	return &TelegramHandler{
		repo:     repo,
		notifier: notifier,
	}
}

func (h *TelegramHandler) Connect(c *fiber.Ctx) error {
	var req dto.ConnectTelegramRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid request body",
		})
	}

	if req.ChatID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Chat ID Telegram wajib diisi",
		})
	}

	if req.BotToken != "" {
		h.notifier.SetBotToken(req.BotToken)
	}

	setting, err := h.repo.Save(req.ChatID, req.Username, req.BotToken)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  false,
			"message": err.Error(),
		})
	}

	// Send confirmation message to Telegram
	_ = h.notifier.SendTestMessage(req.ChatID, req.Username)

	return c.JSON(fiber.Map{
		"status":  true,
		"message": "Telegram berhasil terhubung! Pesan konfirmasi telah dikirim ke bot.",
		"data":    setting,
	})
}

func (h *TelegramHandler) GetStatus(c *fiber.Ctx) error {
	settings, err := h.repo.GetActive()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  false,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":    true,
		"connected": len(settings) > 0,
		"settings":  settings,
	})
}

func (h *TelegramHandler) TestMessage(c *fiber.Ctx) error {
	var req dto.TestTelegramRequest
	_ = c.BodyParser(&req)

	if req.ChatID == "" {
		settings, _ := h.repo.GetActive()
		if len(settings) > 0 {
			req.ChatID = settings[0].ChatID
		}
	}

	if req.ChatID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Belum ada Telegram Chat ID yang terhubung",
		})
	}

	err := h.notifier.SendTestMessage(req.ChatID, "Pengguna DealHunter")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  false,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  true,
		"message": "Pesan tes berhasil dikirim ke Telegram!",
	})
}

func (h *TelegramHandler) Disconnect(c *fiber.Ctx) error {
	_ = h.repo.DeactivateAll()
	h.notifier.SetBotToken("")
	return c.JSON(fiber.Map{
		"status":    true,
		"connected": false,
		"message":   "Sesi Telegram berhasil diputus.",
	})
}
