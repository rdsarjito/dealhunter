package handler

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/rdsarjito/dealhunter-backend/internal/repository"
	"github.com/rdsarjito/dealhunter-backend/internal/scraper"
)

type FacebookHandler struct {
	repo    *repository.FacebookSettingRepository
	scraper *scraper.FacebookScraper
}

func NewFacebookHandler(repo *repository.FacebookSettingRepository, scraper *scraper.FacebookScraper) *FacebookHandler {
	return &FacebookHandler{
		repo:    repo,
		scraper: scraper,
	}
}

func (h *FacebookHandler) GetStatus(c *fiber.Ctx) error {
	setting, err := h.repo.GetActive()
	if err != nil || setting == nil {
		return c.JSON(fiber.Map{
			"status":       true,
			"is_connected": false,
			"message":      "Belum terhubung ke akun Facebook (mode tamu anonim)",
		})
	}

	return c.JSON(fiber.Map{
		"status":       true,
		"is_connected": true,
		"account_name": setting.AccountName,
		"c_user":       setting.CUser,
		"updated_at":   setting.UpdatedAt,
	})
}

func (h *FacebookHandler) Connect(c *fiber.Ctx) error {
	var req struct {
		RawCookie string `json:"raw_cookie"`
		CUser     string `json:"c_user"`
		XSToken   string `json:"xs_token"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Format request tidak valid",
		})
	}

	cUser := strings.TrimSpace(req.CUser)
	xsToken := strings.TrimSpace(req.XSToken)
	rawCookie := strings.TrimSpace(req.RawCookie)

	// If raw cookie is provided, extract c_user and xs if not already given
	if rawCookie != "" {
		parts := strings.Split(rawCookie, ";")
		for _, p := range parts {
			kv := strings.SplitN(strings.TrimSpace(p), "=", 2)
			if len(kv) == 2 {
				k := strings.TrimSpace(kv[0])
				v := strings.TrimSpace(kv[1])
				if k == "c_user" && cUser == "" {
					cUser = v
				}
				if k == "xs" && xsToken == "" {
					xsToken = v
				}
			}
		}
	}

	if rawCookie == "" && (cUser == "" || xsToken == "") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Mohon masukkan raw cookie atau pasangan c_user dan xs token Facebook Anda",
		})
	}

	accountName := "Akun Facebook Aktif"
	if cUser != "" {
		accountName = "FB User " + cUser
	}

	setting, err := h.repo.Save(cUser, xsToken, rawCookie, accountName)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  false,
			"message": "Gagal menyimpan cookie ke database: " + err.Error(),
		})
	}

	// Update active scraper session in memory immediately
	h.scraper.SetSession(cUser, xsToken, rawCookie)

	return c.JSON(fiber.Map{
		"status":       true,
		"is_connected": true,
		"account_name": accountName,
		"c_user":       cUser,
		"message":      "Akun Facebook berhasil terhubung! Scraper sekarang beroperasi dengan sesi asli Anda.",
		"data":         setting,
	})
}

func (h *FacebookHandler) Disconnect(c *fiber.Ctx) error {
	_ = h.repo.Deactivate()
	h.scraper.SetSession("", "", "")

	return c.JSON(fiber.Map{
		"status":       true,
		"is_connected": false,
		"message":      "Sesi akun Facebook berhasil diputus. Scraper kembali ke mode tamu anonim.",
	})
}
