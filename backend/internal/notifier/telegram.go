package notifier

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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

// SendDealAlert formats and sends a Telegram notification for a matched deal
func (t *TelegramNotifier) SendDealAlert(chatID string, alert *model.PriceAlert, listing *model.Listing) error {
	if t.botToken == "" || chatID == "" {
		log.Printf("[Telegram] Bot token or chat ID is empty. Skipping notification.")
		return nil
	}

	dealBadge := "🟢 MURAH BANGET"
	if listing.DealScore < 0.75 {
		dealBadge = "🟡 HARGA BAGUS"
	}

	msgText := fmt.Sprintf(
		"🎯 <b>DEAL DITEMUKAN: %s</b>\n\n"+
			"🏷️ <b>Barang:</b> %s\n"+
			"💰 <b>Harga:</b> Rp %s (%s)\n"+
			"📊 <b>Pasaran:</b> Rp %s (Hemat %.0f%%)\n"+
			"📍 <b>Lokasi:</b> %s\n"+
			"👤 <b>Penjual:</b> %s\n\n"+
			"🔗 <a href=\"%s\">Lihat di Facebook Marketplace</a>\n\n"+
			"<i>Ditemukan oleh DealHunter Bot</i>",
		alert.Keyword,
		listing.Title,
		formatRupiah(listing.Price),
		dealBadge,
		formatRupiah(listing.MarketAvgPrice),
		listing.DiscountPercent,
		listing.Location,
		listing.SellerName,
		listing.FBURL,
	)

	return t.sendMessage(chatID, msgText)
}

// SendTestMessage sends a test ping to verify Telegram connection
func (t *TelegramNotifier) SendTestMessage(chatID, username string) error {
	if t.botToken == "" {
		return fmt.Errorf("TELEGRAM_BOT_TOKEN is not configured in .env")
	}

	msg := fmt.Sprintf(
		"👋 <b>Halo %s!</b>\n\n"+
			"✅ <b>Koneksi DealHunter Bot Berhasil!</b>\n\n"+
			"Anda akan menerima notifikasi otomatis ketika ada barang murah yang sesuai dengan kriteria Price Alert Anda.\n\n"+
			"Selamat berburu deal murah! 🎯",
		username,
	)

	return t.sendMessage(chatID, msg)
}

func (t *TelegramNotifier) sendMessage(chatID, text string) error {
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", t.botToken)

	payload := map[string]interface{}{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "HTML",
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
