package handler

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rdsarjito/dealhunter-backend/internal/domain/model"
	"github.com/rdsarjito/dealhunter-backend/internal/repository"
	"github.com/rdsarjito/dealhunter-backend/internal/service"
	"github.com/rdsarjito/dealhunter-backend/internal/storage"
)

type AlertHandler struct {
	repo    *repository.AlertRepository
	watcher *service.AlertWatcher
	storage *storage.Service // nil jika MinIO tidak tersedia
}

func NewAlertHandler(repo *repository.AlertRepository, watcher *service.AlertWatcher, storageSvc *storage.Service) *AlertHandler {
	return &AlertHandler{repo: repo, watcher: watcher, storage: storageSvc}
}

// uploadThumbnailIfNeeded mengecek apakah thumbnail berupa base64 data URL.
// Jika ya, upload ke MinIO dan kembalikan URL publik-nya.
// Jika bukan (sudah URL biasa) atau MinIO tidak tersedia, kembalikan nilai aslinya.
func (h *AlertHandler) uploadThumbnailIfNeeded(ctx context.Context, alertID, base64OrURL string) string {
	if base64OrURL == "" || !storage.IsBase64(base64OrURL) {
		return base64OrURL // sudah URL atau kosong, tidak perlu diapa-apakan
	}
	if h.storage == nil {
		return base64OrURL // MinIO tidak tersedia, fallback ke base64
	}

	ext := "png"
	if strings.Contains(base64OrURL[:50], "jpeg") || strings.Contains(base64OrURL[:50], "jpg") {
		ext = "jpg"
	} else if strings.Contains(base64OrURL[:50], "webp") {
		ext = "webp"
	}
	objectName := fmt.Sprintf("thumbnails/alert-%s-%d.%s", alertID, time.Now().UnixMilli(), ext)

	url, err := h.storage.UploadBase64(ctx, objectName, base64OrURL)
	if err != nil {
		// Gagal upload: fallback ke base64 agar tidak break UI
		return base64OrURL
	}
	return url
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

	if a.Location == "" {
		a.Location = "Kebayoran Lama, Jakarta Selatan"
	}
	if a.RadiusKM <= 0 {
		a.RadiusKM = 25
	}

	defaultLat := -6.2464309
	defaultLon := 106.7707263
	if a.Latitude == nil || *a.Latitude == 0 {
		a.Latitude = &defaultLat
	}
	if a.Longitude == nil || *a.Longitude == 0 {
		a.Longitude = &defaultLon
	}

	if a.IntervalMinutes <= 0 {
		a.IntervalMinutes = 5
	}

	a.IsActive = true

	// Simpan dulu ke DB untuk dapat ID, kemudian upload thumbnail
	if err := h.repo.Create(&a); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  false,
			"message": err.Error(),
		})
	}

	// Upload thumbnail ke MinIO jika berupa base64
	if a.ThumbnailURL != "" {
		uploaded := h.uploadThumbnailIfNeeded(c.Context(), a.ID.String(), a.ThumbnailURL)
		if uploaded != a.ThumbnailURL {
			// URL berubah (base64 → MinIO URL), simpan URL ke DB
			a.ThumbnailURL = uploaded
			_ = h.repo.Update(a.ID, &a)
		}
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

func (h *AlertHandler) Update(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid alert ID",
		})
	}

	var req model.PriceAlert
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid request body",
		})
	}

	if req.Keyword == "" || req.MaxPrice <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Keyword dan harga maksimal wajib diisi",
		})
	}

	if req.IntervalMinutes <= 0 {
		req.IntervalMinutes = 5
	}
	if req.RadiusKM <= 0 {
		req.RadiusKM = 25
	}

	existing, err := h.repo.GetByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  false,
			"message": "Alert tidak ditemukan",
		})
	}

	existing.Keyword = req.Keyword
	existing.MinPrice = req.MinPrice
	existing.MaxPrice = req.MaxPrice
	existing.Location = req.Location
	existing.RadiusKM = req.RadiusKM
	existing.IntervalMinutes = req.IntervalMinutes
	if req.Latitude != nil && *req.Latitude != 0 {
		existing.Latitude = req.Latitude
	}
	if req.Longitude != nil && *req.Longitude != 0 {
		existing.Longitude = req.Longitude
	}

	// Upload thumbnail baru ke MinIO jika berupa base64
	if req.ThumbnailURL != "" {
		existing.ThumbnailURL = h.uploadThumbnailIfNeeded(c.Context(), id.String(), req.ThumbnailURL)
	}

	if err := h.repo.Update(id, existing); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  false,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  true,
		"message": "Price Alert berhasil diperbarui",
		"data":    existing,
	})
}

func (h *AlertHandler) ScanSingle(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  false,
			"message": "Invalid alert ID",
		})
	}

	if h.watcher != nil {
		go func() {
			_, _ = h.watcher.ScanSingleAlert(context.Background(), id)
		}()
	}

	return c.JSON(fiber.Map{
		"status":  true,
		"message": "Pemindaian Facebook Marketplace untuk alert ini sedang dijalankan.",
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

	// Filter strictly by geographic Haversine distance radius from alert anchor
	var validListings []model.Listing
	for _, it := range listings {
		if strings.Contains(strings.ToLower(it.Title), "benq dl2020b") {
			continue
		}
		if service.MatchesAlertLocation(alert, it.Location) {
			it.DistanceKM = service.ComputeDistance(alert, it.Location, it.Latitude, it.Longitude)
			validListings = append(validListings, it)
		}
	}

	return c.JSON(fiber.Map{
		"status": true,
		"alert":  alert,
		"count":  len(validListings),
		"data":   validListings,
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

func (h *AlertHandler) GetNotifications(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	list, err := h.repo.GetRecentNotifications(limit)
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
