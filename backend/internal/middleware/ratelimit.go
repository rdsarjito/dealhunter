package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

// RateLimitPublic: 120 request/menit per IP untuk endpoint GET public
func RateLimitPublic() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        120,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"status":  false,
				"message": "Terlalu banyak request. Coba lagi dalam 1 menit.",
			})
		},
	})
}

// RateLimitWrite: 20 request/menit per IP untuk endpoint write (POST/PUT/DELETE)
func RateLimitWrite() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        20,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"status":  false,
				"message": "Terlalu banyak request. Coba lagi dalam 1 menit.",
			})
		},
	})
}

// RateLimitScan: 5 request/menit khusus endpoint scan (scraping FB Marketplace)
func RateLimitScan() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        5,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"status":  false,
				"message": "Scan dibatasi 5x per menit untuk mencegah overload scraper.",
			})
		},
	})
}
