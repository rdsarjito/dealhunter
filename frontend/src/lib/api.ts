import { Listing, WatchlistItem, SavedSearch, PriceAlert, SearchResponse, TelegramSetting } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export interface SearchParams {
  keyword?: string;
  location?: string;
  radius_km?: number;
  min_price?: number;
  max_price?: number;
  category?: string;
  condition?: string;
  sort_by?: string;
  page?: number;
  limit?: number;
  live?: boolean;
}

export async function searchListings(params: SearchParams): Promise<SearchResponse> {
  const query = new URLSearchParams();
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.location) query.set('location', params.location);
  if (params.radius_km) query.set('radius_km', params.radius_km.toString());
  if (params.min_price) query.set('min_price', params.min_price.toString());
  if (params.max_price) query.set('max_price', params.max_price.toString());
  if (params.category && params.category !== 'Semua') query.set('category', params.category);
  if (params.condition && params.condition !== 'Semua') query.set('condition', params.condition);
  if (params.sort_by) query.set('sort_by', params.sort_by);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.live) query.set('live', 'true');

  const res = await fetch(`${API_BASE}/search?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Gagal memuat hasil pencarian');
  const json = await res.json();
  return json.data;
}


export async function getListingDetail(id: string): Promise<{ listing: Listing; similar: Listing[] }> {
  const res = await fetch(`${API_BASE}/listings/${id}`);
  if (!res.ok) throw new Error('Gagal mengambil detail listing');
  const json = await res.json();
  return {
    listing: json.data,
    similar: json.similar || [],
  };
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const res = await fetch(`${API_BASE}/watchlist`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal mengambil watchlist');
  const json = await res.json();
  return json.data || [];
}

export async function addToWatchlist(listingId: string, notes: string = ''): Promise<WatchlistItem> {
  const res = await fetch(`${API_BASE}/watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listing_id: listingId, notes }),
  });
  if (!res.ok) throw new Error('Gagal menyimpan ke watchlist');
  const json = await res.json();
  return json.data;
}

export async function removeFromWatchlist(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/watchlist/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Gagal menghapus dari watchlist');
}

export async function getSavedSearches(): Promise<SavedSearch[]> {
  const res = await fetch(`${API_BASE}/saved-searches`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal mengambil pencarian tersimpan');
  const json = await res.json();
  return json.data || [];
}

export async function saveSearch(data: Partial<SavedSearch>): Promise<SavedSearch> {
  const res = await fetch(`${API_BASE}/saved-searches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal menyimpan pencarian');
  const json = await res.json();
  return json.data;
}

export const createSavedSearch = saveSearch;

export async function deleteSavedSearch(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/saved-searches/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Gagal menghapus pencarian tersimpan');
}

export async function getAlerts(): Promise<PriceAlert[]> {
  const res = await fetch(`${API_BASE}/alerts`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal mengambil daftar alert');
  const json = await res.json();
  return json.data || [];
}

export async function createAlert(data: Partial<PriceAlert>): Promise<PriceAlert> {
  const res = await fetch(`${API_BASE}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal membuat Price Alert');
  const json = await res.json();
  return json.data;
}

export async function toggleAlert(id: string, isActive: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/alerts/${id}/toggle`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!res.ok) throw new Error('Gagal memperbarui status alert');
}

export async function deleteAlert(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/alerts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Gagal menghapus alert');
}

export async function getAlertListings(alertId: string): Promise<{ alert: PriceAlert; count: number; data: Listing[] }> {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/listings`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal mengambil daftar iklan untuk alert ini');
  const json = await res.json();
  return {
    alert: json.alert,
    count: json.count || (json.data ? json.data.length : 0),
    data: json.data || [],
  };
}

export async function connectTelegram(chatId: string, username: string = '', botToken: string = ''): Promise<TelegramSetting> {
  const res = await fetch(`${API_BASE}/telegram/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, username, bot_token: botToken }),
  });
  if (!res.ok) throw new Error('Gagal menghubungkan Telegram');
  const json = await res.json();
  return json.data;
}

export async function getTelegramStatus(): Promise<{ connected: boolean; settings: TelegramSetting[] }> {
  const res = await fetch(`${API_BASE}/telegram/status`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal memeriksa status Telegram');
  const json = await res.json();
  return { connected: json.connected, settings: json.settings || [] };
}

export async function sendTestTelegram(chatId?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/telegram/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || 'Gagal mengirim pesan tes');
  }
}

export async function getFacebookStatus(): Promise<{ is_connected: boolean; account_name?: string; c_user?: string }> {
  const res = await fetch(`${API_BASE}/facebook/status`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal memeriksa status Facebook');
  return res.json();
}

export async function connectFacebook(rawCookie: string, cUser: string = '', xsToken: string = ''): Promise<any> {
  const res = await fetch(`${API_BASE}/facebook/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_cookie: rawCookie, c_user: cUser, xs_token: xsToken }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Gagal menghubungkan akun Facebook');
  return json;
}

export async function disconnectFacebook(): Promise<any> {
  const res = await fetch(`${API_BASE}/facebook/disconnect`, {
    method: 'POST',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Gagal memutus akun Facebook');
  return json;
}

export async function disconnectTelegram(): Promise<void> {
  const res = await fetch(`${API_BASE}/telegram/disconnect`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Gagal memutuskan koneksi Telegram');
}
