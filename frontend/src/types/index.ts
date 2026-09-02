export interface Listing {
  id: string;
  fb_listing_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  latitude?: number;
  longitude?: number;
  category: string;
  condition: string;
  seller_name: string;
  images: string; // JSON array or parsed
  fb_url: string;
  deal_score: number; // 0.00 - 1.00
  deal_rating: 'great_deal' | 'good_deal' | 'fair_price' | 'overpriced';
  market_avg_price: number;
  discount_percent: number;
  listed_at?: string;
  scraped_at: string;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  listing_id: string;
  listing: Listing;
  notes: string;
  created_at: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  keyword: string;
  min_price?: number;
  max_price?: number;
  location: string;
  radius_km: number;
  category: string;
  condition: string;
  sort_by: string;
  last_run_at?: string;
  created_at: string;
}

export interface PriceAlert {
  id: string;
  keyword: string;
  max_price: number;
  location: string;
  radius_km: number;
  category: string;
  is_active: boolean;
  telegram_chat_id: string;
  trigger_count: number;
  last_triggered_at?: string;
  last_matched_item?: string;
  created_at: string;
}

export interface SearchResponse {
  query: string;
  location: string;
  radius_km: number;
  total_results: number;
  page: number;
  limit: number;
  market_avg_price: number;
  market_min_price: number;
  market_max_price: number;
  listings: Listing[];
  scraped_live: boolean;
}

export interface TelegramSetting {
  id: string;
  chat_id: string;
  username: string;
  is_active: boolean;
  created_at: string;
}
