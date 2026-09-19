package middleware

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

// ValidateStruct memvalidasi struct request.
// Return error message yang user-friendly jika ada field yang tidak valid.
func ValidateStruct(s interface{}) error {
	if err := validate.Struct(s); err != nil {
		var errs []string
		for _, e := range err.(validator.ValidationErrors) {
			errs = append(errs, formatValidationError(e))
		}
		return fmt.Errorf("%s", strings.Join(errs, "; "))
	}
	return nil
}

func formatValidationError(e validator.FieldError) string {
	field := strings.ToLower(e.Field())
	switch e.Tag() {
	case "required":
		return fmt.Sprintf("field '%s' wajib diisi", field)
	case "min":
		return fmt.Sprintf("field '%s' minimal %s karakter/nilai", field, e.Param())
	case "max":
		return fmt.Sprintf("field '%s' maksimal %s karakter/nilai", field, e.Param())
	case "gt":
		return fmt.Sprintf("field '%s' harus lebih besar dari %s", field, e.Param())
	case "gte":
		return fmt.Sprintf("field '%s' harus lebih besar atau sama dengan %s", field, e.Param())
	case "lte":
		return fmt.Sprintf("field '%s' harus lebih kecil atau sama dengan %s", field, e.Param())
	case "email":
		return fmt.Sprintf("field '%s' harus berupa email yang valid", field)
	default:
		return fmt.Sprintf("field '%s' tidak valid (%s)", field, e.Tag())
	}
}
