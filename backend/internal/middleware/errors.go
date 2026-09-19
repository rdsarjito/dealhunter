package middleware

import (
	"log/slog"

	"github.com/gofiber/fiber/v2"
)

// AppError adalah error terstruktur yang membedakan pesan untuk user vs log internal.
type AppError struct {
	Code       int    // HTTP status code
	Message    string // pesan aman untuk dikembalikan ke client
	InternalErr error  // error asli — hanya di-log, tidak dikirim ke client
}

func (e *AppError) Error() string {
	if e.InternalErr != nil {
		return e.InternalErr.Error()
	}
	return e.Message
}

// New membuat AppError baru
func NewAppError(code int, message string, internal error) *AppError {
	return &AppError{Code: code, Message: message, InternalErr: internal}
}

// Shorthand errors yang sering dipakai
func ErrBadRequest(msg string) *AppError {
	return &AppError{Code: fiber.StatusBadRequest, Message: msg}
}
func ErrNotFound(msg string) *AppError {
	return &AppError{Code: fiber.StatusNotFound, Message: msg}
}
func ErrInternal(internal error) *AppError {
	return &AppError{
		Code:        fiber.StatusInternalServerError,
		Message:     "Terjadi kesalahan pada server. Silakan coba lagi.",
		InternalErr: internal,
	}
}

// GlobalErrorHandler menggantikan default Fiber error handler.
// Internal errors di-log server-side, client hanya dapat pesan generik.
func GlobalErrorHandler(c *fiber.Ctx, err error) error {
	// Jika AppError, gunakan code dan message yang sudah disiapkan
	if appErr, ok := err.(*AppError); ok {
		if appErr.InternalErr != nil {
			slog.Error("app error",
				"path", c.Path(),
				"method", c.Method(),
				"error", appErr.InternalErr.Error(),
			)
		}
		return c.Status(appErr.Code).JSON(fiber.Map{
			"status":  false,
			"message": appErr.Message,
		})
	}

	// Fiber built-in error (e.g. 404 route not found)
	if fiberErr, ok := err.(*fiber.Error); ok {
		return c.Status(fiberErr.Code).JSON(fiber.Map{
			"status":  false,
			"message": fiberErr.Message,
		})
	}

	// Unexpected error — log detail, kembalikan pesan generik
	slog.Error("unhandled error",
		"path", c.Path(),
		"method", c.Method(),
		"error", err.Error(),
	)
	return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
		"status":  false,
		"message": "Terjadi kesalahan pada server. Silakan coba lagi.",
	})
}
