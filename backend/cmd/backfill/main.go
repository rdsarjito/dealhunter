package main

import (
	"fmt"
	"html"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/rdsarjito/dealhunter-backend/config"
	"github.com/rdsarjito/dealhunter-backend/internal/domain/model"
)

func fetchRealDesc(fbURL string) string {
	if fbURL == "" {
		return ""
	}
	client := &http.Client{Timeout: 6 * time.Second}
	req, err := http.NewRequest("GET", fbURL, nil)
	if err != nil {
		return ""
	}
	req.Header.Set("User-Agent", "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")
	req.Header.Set("Accept-Language", "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7")

	resp, err := client.Do(req)
	if err != nil {
		return ""
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return ""
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return ""
	}

	re := regexp.MustCompile(`(?i)<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']`)
	match := re.FindStringSubmatch(string(body))
	if len(match) > 1 {
		desc := html.UnescapeString(match[1])
		return strings.TrimSpace(desc)
	}
	return ""
}

func main() {
	cfg := config.LoadConfig()
	db := config.InitDatabase(cfg)

	var listings []model.Listing
	err := db.Where("description LIKE ?", "%Cek kondisi dan tawar via Facebook Marketplace%").Find(&listings).Error
	if err != nil {
		log.Fatalf("Error finding listings: %v", err)
	}

	fmt.Printf("Found %d listings with placeholder descriptions to update!\n", len(listings))

	updated := 0
	for i, it := range listings {
		fmt.Printf("[%d/%d] Fetching real desc for: %s (ID: %s)...\n", i+1, len(listings), it.Title, it.FBListingID)
		realDesc := fetchRealDesc(it.FBURL)
		if realDesc != "" && !strings.Contains(realDesc, "Cek kondisi dan tawar") {
			err := db.Model(&model.Listing{}).Where("id = ?", it.ID).Update("description", realDesc).Error
			if err != nil {
				fmt.Printf("Failed to update ID %s: %v\n", it.ID, err)
			} else {
				fmt.Printf("--> Updated! Real Desc:\n%s\n\n", realDesc)
				updated++
			}
		} else {
			fmt.Printf("--> Could not extract or empty\n")
		}
		time.Sleep(200 * time.Millisecond)
	}

	fmt.Printf("Finished updating %d/%d listings with real descriptions!\n", updated, len(listings))
}
