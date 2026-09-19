package middleware

import (
	"crypto/subtle"
	"os"

	"github.com/gofiber/fiber/v2"
)

// RequireAPIKey melindungi endpoint write (POST/PUT/DELETE) dan admin.
// Cek header: X-API-Key: <nilai dari env API_KEY>
//
// Endpoint GET tetap public (search, notifications, alerts list).
// Jika API_KEY env tidak di-set, middleware di-skip (development mode).
func RequireAPIKey() fiber.Handler {
	apiKey := os.Getenv("API_KEY")

	return func(c *fiber.Ctx) error {
		// Jika API_KEY belum di-set di env, skip (dev mode)
		if apiKey == "" {
			return c.Next()
		}

		key := c.Get("X-API-Key")
		if key == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"status":  false,
				"message": "API key diperlukan. Sertakan header X-API-Key.",
			})
		}

		// Constant-time compare untuk mencegah timing attack
		if subtle.ConstantTimeCompare([]byte(key), []byte(apiKey)) != 1 {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"status":  false,
				"message": "API key tidak valid.",
			})
		}

		return c.Next()
	}
}
