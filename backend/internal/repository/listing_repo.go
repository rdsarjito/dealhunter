package repository

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rdsarjito/dealhunter-backend/internal/domain/dto"
	"github.com/rdsarjito/dealhunter-backend/internal/domain/model"
	"github.com/rdsarjito/dealhunter-backend/internal/scraper"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Comprehensive list of US/foreign location indicators
var foreignLocationIndicators = []string{
	", CA", " CA ", "California", "Los Angeles", "San Francisco", "Monterey", "Carmel",
	"Daly City", "Walnut Creek", "Pacifica", "Oakland", "San Jose", "San Diego",
	"Sacramento", "Fremont", "Berkeley", "Palo Alto", "Santa Clara", "Sunnyvale",
	", NY", " NY ", "New York", "Brooklyn", "Manhattan", "Queens",
	", TX", " TX ", "Texas", "Houston", "Dallas", "Austin",
	", FL", " FL ", "Florida", "Miami", "Orlando", "Tampa",
	", WA", " WA ", "Seattle", "Portland",
	", IL", " IL ", "Chicago",
	"United States", "USA", "U.S.A",
}

// isForeignLocation checks if a location string indicates a foreign (non-Indonesian) listing
func isForeignLocation(loc string) bool {
	upper := strings.ToUpper(loc)
	for _, indicator := range foreignLocationIndicators {
		if strings.Contains(upper, strings.ToUpper(indicator)) {
			return true
		}
	}
	return false
}

// foreignLocationSQL returns SQL WHERE clause to exclude foreign locations
func foreignLocationSQL() string {
	clauses := []string{}
	for _, ind := range foreignLocationIndicators {
		clauses = append(clauses, "location NOT ILIKE '%"+strings.ReplaceAll(ind, "'", "''") +"%'")
	}
	return "(" + strings.Join(clauses, " AND ") + ")"
}

type ListingRepository struct {
	db *gorm.DB
}

func NewListingRepository(db *gorm.DB) *ListingRepository {
	return &ListingRepository{db: db}
}

func (r *ListingRepository) UpsertScrapedItems(items []scraper.ScrapedItem, keyword string) ([]model.Listing, error) {
	if len(items) == 0 {
		return nil, nil
	}

	// Calculate market statistics
	var sumPrice float64
	var count float64
	minP := items[0].Price
	maxP := items[0].Price

	for _, it := range items {
		if it.Price > 0 {
			sumPrice += it.Price
			count++
			if it.Price < minP {
				minP = it.Price
			}
			if it.Price > maxP {
				maxP = it.Price
			}
		}
	}

	avgPrice := sumPrice / count
	if avgPrice <= 0 {
		avgPrice = 1000000
	}

	var listings []model.Listing
	for _, it := range items {
		// Reject any listing that is clearly foreign (US/international) or has corrupt price
		if it.Price < 10000 || isForeignLocation(it.Location) {
			continue
		}
		imgJSON, _ := json.Marshal(it.Images)

		// Calculate deal score: 1.0 = super cheap (>30% below avg), 0.5 = fair, <0.4 = expensive
		discount := 0.0
		dealScore := 0.50
		rating := "fair_price"

		if it.Price > 0 && avgPrice > 0 {
			diff := avgPrice - it.Price
			discount = (diff / avgPrice) * 100
			if discount > 35 {
				dealScore = 0.95
				rating = "great_deal"
			} else if discount > 20 {
				dealScore = 0.85
				rating = "great_deal"
			} else if discount > 10 {
				dealScore = 0.75
				rating = "good_deal"
			} else if discount >= -5 {
				dealScore = 0.60
				rating = "fair_price"
			} else {
				dealScore = 0.35
				rating = "overpriced"
			}
		}

		l := model.Listing{
			FBListingID:     it.FBListingID,
			Title:           it.Title,
			Description:     it.Description,
			Price:           it.Price,
			Currency:        "IDR",
			Location:        it.Location,
			Category:        it.Category,
			Condition:       it.Condition,
			SellerName:      it.SellerName,
			Images:          string(imgJSON),
			FBURL:           it.FBURL,
			DealScore:       dealScore,
			DealRating:      rating,
			MarketAvgPrice:  avgPrice,
			DiscountPercent: discount,
			ListedAt:        it.ListedAt,
			ScrapedAt:       time.Now(),
		}

		// Upsert based on FBListingID
		err := r.db.Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "fb_listing_id"}},
			DoUpdates: clause.AssignmentColumns([]string{
				"title", "description", "price", "location", "category",
				"condition", "images", "fb_url", "deal_score", "deal_rating",
				"market_avg_price", "discount_percent", "scraped_at",
			}),
		}).Create(&l).Error

		if err == nil {
			listings = append(listings, l)
		}
	}

	// Record price history
	if len(items) > 0 {
		_ = r.db.Create(&model.PriceHistory{
			Keyword:      keyword,
			Location:     items[0].Location,
			AvgPrice:     avgPrice,
			MinPrice:     minP,
			MaxPrice:     maxP,
			ListingCount: len(items),
			RecordedAt:   time.Now(),
		})
	}

	return listings, nil
}

func (r *ListingRepository) Search(req dto.SearchRequest) ([]model.Listing, int64, float64, float64, float64, error) {
	query := r.db.Model(&model.Listing{}).Where("price >= 10000 AND " + foreignLocationSQL())

	if req.Keyword != "" {
		terms := strings.Fields(strings.ToLower(req.Keyword))
		for _, term := range terms {
			query = query.Where("LOWER(title) LIKE ? OR LOWER(description) LIKE ?", "%"+term+"%", "%"+term+"%")
		}
	}

	if req.Location != "" {
		query = query.Where("LOWER(location) LIKE ?", "%"+strings.ToLower(req.Location)+"%")
	}

	if req.MinPrice != nil && *req.MinPrice > 0 {
		query = query.Where("price >= ?", *req.MinPrice)
	}

	if req.MaxPrice != nil && *req.MaxPrice > 0 {
		query = query.Where("price <= ?", *req.MaxPrice)
	}

	if req.Category != "" && req.Category != "Semua" {
		query = query.Where("LOWER(category) = ?", strings.ToLower(req.Category))
	}

	if req.Condition != "" && req.Condition != "Semua" {
		query = query.Where("LOWER(condition) LIKE ?", "%"+strings.ToLower(req.Condition)+"%")
	}

	var total int64
	query.Count(&total)

	// Calculate stats
	type Stats struct {
		Avg float64
		Min float64
		Max float64
	}
	var stats Stats
	r.db.Model(&model.Listing{}).
		Select("COALESCE(AVG(price), 0) as avg, COALESCE(MIN(price), 0) as min, COALESCE(MAX(price), 0) as max").
		Where("LOWER(title) LIKE ?", "%"+strings.ToLower(req.Keyword)+"%").
		Scan(&stats)

	// Sorting
	switch req.SortBy {
	case "price_asc":
		query = query.Order("price ASC")
	case "price_desc":
		query = query.Order("price DESC")
	case "date_desc":
		query = query.Order("created_at DESC")
	case "deal_score":
		fallthrough
	default:
		query = query.Order("deal_score DESC, price ASC")
	}

	limit := req.Limit
	if limit <= 0 {
		limit = 20
	}
	page := req.Page
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	var listings []model.Listing
	err := query.Limit(limit).Offset(offset).Find(&listings).Error

	return listings, total, stats.Avg, stats.Min, stats.Max, err
}

func (r *ListingRepository) GetByID(id uuid.UUID) (*model.Listing, error) {
	var l model.Listing
	err := r.db.First(&l, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &l, nil
}

func (r *ListingRepository) GetSimilar(l *model.Listing) ([]model.Listing, error) {
	var similar []model.Listing
	words := strings.Fields(l.Title)
	firstWord := l.Category
	if len(words) > 0 {
		firstWord = words[0]
	}

	err := r.db.Where("id != ? AND (LOWER(title) LIKE ? OR category = ?)", l.ID, "%"+strings.ToLower(firstWord)+"%", l.Category).
		Order("deal_score DESC").
		Limit(4).
		Find(&similar).Error

	return similar, err
}

func (r *ListingRepository) AddToWatchlist(listingID uuid.UUID, notes string) (*model.Watchlist, error) {
	w := model.Watchlist{
		ListingID: listingID,
		Notes:     notes,
	}
	err := r.db.Create(&w).Error
	if err != nil {
		return nil, err
	}
	_ = r.db.Preload("Listing").First(&w, "id = ?", w.ID)
	return &w, nil
}

func (r *ListingRepository) GetWatchlist() ([]model.Watchlist, error) {
	var list []model.Watchlist
	err := r.db.Preload("Listing").Order("created_at DESC").Find(&list).Error
	return list, err
}

func (r *ListingRepository) RemoveFromWatchlist(id uuid.UUID) error {
	return r.db.Delete(&model.Watchlist{}, "id = ? OR listing_id = ?", id, id).Error
}
