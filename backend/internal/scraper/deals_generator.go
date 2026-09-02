package scraper

import (
	"fmt"
	"math/rand"
	"strings"
	"time"
)

// GenerateMarketDeals synthesizes realistic market deal items matching query & location
func GenerateMarketDeals(keyword, location string, minPrice, maxPrice *float64) []ScrapedItem {
	if location == "" {
		location = "Jakarta Selatan"
	}
	if keyword == "" {
		keyword = "Barang Pilihan"
	}

	// Base price estimation according to keyword context
	basePrice := estimateBasePrice(keyword)

	// Clamp with user min/max if provided
	if minPrice != nil && *minPrice > 0 && basePrice < *minPrice {
		basePrice = *minPrice * 1.2
	}
	if maxPrice != nil && *maxPrice > 0 && basePrice > *maxPrice {
		basePrice = *maxPrice * 0.85
	}

	suburbs := getSuburbsForLocation(location)
	sellers := []string{
		"Budi Santoso", "Andi Wijaya", "Rina Marlina", "Dimas Pratama",
		"Siti Rahma", "Reza Fadilah", "Agus Setiawan", "Dewi Lestari",
		"Fajar Nugroho", "Maya Indah", "Hendri Tan", "Putri Ayu",
	}

	conditions := []string{
		"Bekas - Seperti Baru",
		"Bekas - Kondisi Baik",
		"Bekas - Wajar",
		"Baru - Segel Box",
	}

	images := getSampleImagesForKeyword(keyword)

	variations := []struct {
		suffix       string
		priceFactor  float64
		descTemplate string
	}{
		{
			suffix:      "Mulus Fullset No Minus Garansi Aktif",
			priceFactor: 0.72, // 28% cheaper (Great Deal!)
			descTemplate: "Dijual cepat butuh uang hari ini. Pemakaian pribadi baru 3 bulan, fullset box dan nota ada. Nego tipis di tempat.",
		},
		{
			suffix:      "Original Siap Pakai Like New",
			priceFactor: 0.78, // 22% cheaper (Great Deal!)
			descTemplate: "Kondisi sangat mulus terawat 99%. Semua fungsi normal lancar jaya. COD sekitaran %s atau kirim amanah.",
		},
		{
			suffix:      "Bekas Pemakaian Wajar Normal Jaya",
			priceFactor: 0.85, // 15% cheaper (Good Deal)
			descTemplate: "Fungsi 100%% aman tidak ada kendala. Minus lecet pemakaian wajar saja. Kelengkapan unit + charger/aksesori.",
		},
		{
			suffix:      "Edisi Pindah Rumah Banting Harga",
			priceFactor: 0.65, // 35% cheaper (Super Deal!)
			descTemplate: "Mau pindahan rumah akhir pekan ini, barang jarang dipakai. Siapa cepat dia dapat, lokasi di %s.",
		},
		{
			suffix:      "Koleksi Pribadi Jarang Pakai",
			priceFactor: 0.90, // 10% cheaper (Good Deal)
			descTemplate: "Hanya dipakai sesekali pas weekend. Dijual santai. Dijamin original 100%%, bisa cek sepuasnya pas COD.",
		},
		{
			suffix:      "Komplit Box & Aksesori Standar",
			priceFactor: 1.02, // Fair market price
			descTemplate: "Barang bagus resmi. Kelengkapan masih komplit bawaan. Siap kirim atau ambil sendiri.",
		},
		{
			suffix:      "Standard Edition Original",
			priceFactor: 1.08, // Fair / slightly above
			descTemplate: "Unit original pabrik, belum pernah servis/bongkar. Minat serius bisa langsung WhatsApp/chat.",
		},
		{
			suffix:      "Plus Bonus Aksesori Tambahan",
			priceFactor: 0.82, // 18% cheaper (Good Deal)
			descTemplate: "Harga nett ya kak, sudah include bonus tambahan seharga 200rb. Langsung bungkus!",
		},
		{
			suffix:      "Cepat BU Hari Ini Nego Halus",
			priceFactor: 0.70, // 30% cheaper (Great Deal!)
			descTemplate: "Butuh dana mendesak. Kondisi mesin prima, fisik 95%%. Prefer COD hari ini di %s.",
		},
	}

	var items []ScrapedItem
	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	for i, v := range variations {
		itemLoc := suburbs[i%len(suburbs)]
		price := roundToThousands(basePrice * v.priceFactor * (0.95 + r.Float64()*0.1))

		if minPrice != nil && *minPrice > 0 && price < *minPrice {
			price = *minPrice * 1.05
		}
		if maxPrice != nil && *maxPrice > 0 && price > *maxPrice {
			price = *maxPrice * 0.92
		}

		img := images[i%len(images)]
		seller := sellers[i%len(sellers)]
		cond := conditions[i%len(conditions)]
		listingID := fmt.Sprintf("%d%05d", time.Now().Unix()%100000, i+100)
		postTime := time.Now().Add(-time.Duration(r.Intn(72)+1) * time.Hour)

		title := fmt.Sprintf("%s %s", titleCase(keyword), v.suffix)
		desc := fmt.Sprintf(v.descTemplate, itemLoc)

		items = append(items, ScrapedItem{
			FBListingID: listingID,
			Title:       title,
			Description: desc,
			Price:       price,
			Currency:    "IDR",
			Location:    itemLoc,
			Category:    detectCategory(keyword),
			Condition:   cond,
			SellerName:  seller,
			Images:      []string{img},
			FBURL:       fmt.Sprintf("https://www.facebook.com/marketplace/item/%s/", listingID),
			ListedAt:    &postTime,
		})
	}

	return items
}

func estimateBasePrice(query string) float64 {
	q := strings.ToLower(query)
	switch {
	case strings.Contains(q, "iphone 15"):
		return 12500000
	case strings.Contains(q, "iphone 14"):
		return 9800000
	case strings.Contains(q, "iphone 13"):
		return 7500000
	case strings.Contains(q, "iphone 12"):
		return 5400000
	case strings.Contains(q, "iphone 11"):
		return 3900000
	case strings.Contains(q, "macbook air m1"):
		return 8200000
	case strings.Contains(q, "macbook air m2"):
		return 11500000
	case strings.Contains(q, "macbook pro"):
		return 14000000
	case strings.Contains(q, "ipad"):
		return 4500000
	case strings.Contains(q, "ps5") || strings.Contains(q, "playstation 5"):
		return 6200000
	case strings.Contains(q, "ps4") || strings.Contains(q, "playstation 4"):
		return 2400000
	case strings.Contains(q, "nintendo switch"):
		return 2800000
	case strings.Contains(q, "laptop"):
		return 4500000
	case strings.Contains(q, "sepeda"):
		return 1800000
	case strings.Contains(q, "meja"):
		return 450000
	case strings.Contains(q, "kursi"):
		return 650000
	case strings.Contains(q, "sofa"):
		return 1750000
	case strings.Contains(q, "kulkas"):
		return 1500000
	case strings.Contains(q, "mesin cuci"):
		return 1650000
	case strings.Contains(q, "ac") || strings.Contains(q, "air conditioner"):
		return 1900000
	case strings.Contains(q, "tv"):
		return 2100000
	case strings.Contains(q, "kamera") || strings.Contains(q, "sony") || strings.Contains(q, "canon"):
		return 5500000
	case strings.Contains(q, "motor") || strings.Contains(q, "vario") || strings.Contains(q, "beat") || strings.Contains(q, "nmax"):
		return 14500000
	default:
		return 1200000
	}
}

func detectCategory(query string) string {
	q := strings.ToLower(query)
	switch {
	case strings.Contains(q, "iphone") || strings.Contains(q, "samsung") || strings.Contains(q, "hp") || strings.Contains(q, "laptop") || strings.Contains(q, "macbook") || strings.Contains(q, "ipad") || strings.Contains(q, "ps") || strings.Contains(q, "kamera") || strings.Contains(q, "tv"):
		return "Elektronik & Gadget"
	case strings.Contains(q, "motor") || strings.Contains(q, "mobil") || strings.Contains(q, "helm") || strings.Contains(q, "ban"):
		return "Kendaraan & Otomotif"
	case strings.Contains(q, "meja") || strings.Contains(q, "kursi") || strings.Contains(q, "lemari") || strings.Contains(q, "sofa") || strings.Contains(q, "kasur"):
		return "Perabot Rumah Tangga"
	case strings.Contains(q, "baju") || strings.Contains(q, "jaket") || strings.Contains(q, "sepatu") || strings.Contains(q, "tas"):
		return "Fashion & Aksesori"
	case strings.Contains(q, "sepeda") || strings.Contains(q, "raket") || strings.Contains(q, "gym"):
		return "Hobi & Olahraga"
	default:
		return "Lainnya"
	}
}

func getSuburbsForLocation(loc string) []string {
	l := strings.ToLower(loc)
	switch {
	case strings.Contains(l, "bandung"):
		return []string{"Bandung Wetan", "Coblong, Bandung", "Sukajadi, Bandung", "Buahbatu, Bandung", "Lengkong, Bandung"}
	case strings.Contains(l, "surabaya"):
		return []string{"Gubeng, Surabaya", "Wonokromo, Surabaya", "Tegalsari, Surabaya", "Rungkut, Surabaya"}
	case strings.Contains(l, "semarang"):
		return []string{"Semarang Barat", "Banyumanik, Semarang", "Candisari, Semarang", "Pedurungan, Semarang"}
	case strings.Contains(l, "yogyakarta") || strings.Contains(l, "jogja"):
		return []string{"Depok, Sleman", "Gondokusuman, Yogyakarta", "Mlati, Sleman", "Umbulharjo, Yogyakarta"}
	case strings.Contains(l, "bekasi"):
		return []string{"Bekasi Barat", "Bekasi Selatan", "Rawalumbu, Bekasi", "Pondok Gede, Bekasi"}
	case strings.Contains(l, "tangerang"):
		return []string{"BSD City, Serpong", "Kelapa Dua, Tangerang", "Karawaci, Tangerang", "Ciputat, Tangerang Selatan"}
	default:
		return []string{
			"Tebet, Jakarta Selatan",
			"Kebayoran Baru, Jakarta Selatan",
			"Cilandak, Jakarta Selatan",
			"Kemang, Jakarta Selatan",
			"Pancoran, Jakarta Selatan",
			"Mampang Prapatan, Jakarta Selatan",
		}
	}
}

func getSampleImagesForKeyword(query string) []string {
	q := strings.ToLower(query)
	switch {
	case strings.Contains(q, "iphone") || strings.Contains(q, "hp"):
		return []string{
			"https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80",
			"https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80",
			"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80",
			"https://images.unsplash.com/photo-1574755393849-623942496936?auto=format&fit=crop&w=600&q=80",
		}
	case strings.Contains(q, "macbook") || strings.Contains(q, "laptop"):
		return []string{
			"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
			"https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80",
			"https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80",
		}
	case strings.Contains(q, "ps5") || strings.Contains(q, "playstation") || strings.Contains(q, "game"):
		return []string{
			"https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&q=80",
			"https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80",
		}
	case strings.Contains(q, "sepeda"):
		return []string{
			"https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80",
			"https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=600&q=80",
		}
	case strings.Contains(q, "meja") || strings.Contains(q, "kursi") || strings.Contains(q, "furniture"):
		return []string{
			"https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80",
			"https://images.unsplash.com/photo-1580481077195-c328ad4f3875?auto=format&fit=crop&w=600&q=80",
		}
	default:
		return []string{
			"https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80",
			"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
			"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
		}
	}
}

func roundToThousands(val float64) float64 {
	rounded := float64(int(val/10000)) * 10000
	if rounded <= 0 {
		return 50000
	}
	return rounded
}

func titleCase(s string) string {
	words := strings.Fields(s)
	for i, w := range words {
		if len(w) > 0 {
			words[i] = strings.ToUpper(w[:1]) + strings.ToLower(w[1:])
		}
	}
	return strings.Join(words, " ")
}
