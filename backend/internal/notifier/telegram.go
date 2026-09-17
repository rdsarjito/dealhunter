package notifier

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/rdsarjito/dealhunter-backend/internal/domain/model"
)

type TelegramNotifier struct {
	botToken string
	client   *http.Client
}

func NewTelegramNotifier(botToken string) *TelegramNotifier {
	return &TelegramNotifier{
		botToken: botToken,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (t *TelegramNotifier) SetBotToken(token string) {
	t.botToken = token
}

// SendDealAlert formats and sends a clean, direct Telegram notification for a matched deal
func (t *TelegramNotifier) SendDealAlert(chatID string, alert *model.PriceAlert, listing *model.Listing) error {
	if t.botToken == "" || chatID == "" {
		log.Printf("[Telegram] Bot token or chat ID is empty. Skipping notification.")
		return nil
	}

	var lines []string

	// Keyword alert tag
	if alert != nil && alert.Keyword != "" {
		lines = append(lines, fmt.Sprintf("<b>[Alert: %s]</b>", html.EscapeString(alert.Keyword)))
	}

	// Title & Price
	lines = append(lines, fmt.Sprintf("<b>%s</b>", html.EscapeString(listing.Title)))
	lines = append(lines, fmt.Sprintf("<b>Rp %s</b>", formatRupiah(listing.Price)))
	lines = append(lines, "")

	// Location
	if listing.Location != "" {
		locStr := html.EscapeString(listing.Location)
		if listing.DistanceKM != nil && *listing.DistanceKM > 0 {
			locStr = fmt.Sprintf("%s (%.1f km)", locStr, *listing.DistanceKM)
		}
		lines = append(lines, fmt.Sprintf("Lokasi: %s", locStr))
	}

	// Seller
	if listing.SellerName != "" {
		lines = append(lines, fmt.Sprintf("Penjual: %s", html.EscapeString(listing.SellerName)))
	}

	// Direct link
	lines = append(lines, "")
	lines = append(lines, fmt.Sprintf("<a href=\"%s\">Buka di Facebook Marketplace</a>", html.EscapeString(listing.FBURL)))

	msgText := strings.Join(lines, "\n")
	return t.sendMessage(chatID, msgText)
}

// SendTestMessage sends a clean test ping to verify Telegram connection
func (t *TelegramNotifier) SendTestMessage(chatID, username string) error {
	if t.botToken == "" {
		return fmt.Errorf("TELEGRAM_BOT_TOKEN is not configured in .env")
	}

	userLabel := username
	if userLabel == "" {
		userLabel = chatID
	}

	msg := fmt.Sprintf(
		"<b>Koneksi DealHunter Berhasil</b>\n\n"+
			"Akun Telegram Anda (%s) sudah terhubung.\n"+
			"Notifikasi akan dikirimkan otomatis ke sini saat radar menemukan barang yang sesuai kriteria alert Anda.",
		html.EscapeString(userLabel),
	)

	return t.sendMessage(chatID, msg)
}

func (t *TelegramNotifier) sendMessage(chatID, text string) error {
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", t.botToken)

	payload := map[string]interface{}{
		"chat_id":                  chatID,
		"text":                     text,
		"parse_mode":               "HTML",
		"disable_web_page_preview": false,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := t.client.Post(apiURL, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to send telegram request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("telegram API returned status: %d", resp.StatusCode)
	}

	log.Printf("[Telegram] Successfully sent alert message to chat_id: %s", chatID)
	return nil
}

func formatRupiah(amount float64) string {
	str := fmt.Sprintf("%.0f", amount)
	n := len(str)
	if n <= 3 {
		return str
	}

	var res []byte
	rem := n % 3
	if rem > 0 {
		res = append(res, str[:rem]...)
		if n > rem {
			res = append(res, '.')
		}
	}

	for i := rem; i < n; i += 3 {
		res = append(res, str[i:i+3]...)
		if i+3 < n {
			res = append(res, '.')
		}
	}

	return string(res)
}
