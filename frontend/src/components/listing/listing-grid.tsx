'use client';

import { useState } from 'react';
import { Listing } from '@/types';
import { ListingCard } from './listing-card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRupiah } from '@/lib/format';
import { 
  Bell, 
  Bookmark, 
  RefreshCw,
  SearchX,
  ArrowUpDown
} from 'lucide-react';
import { useSearchStore } from '@/stores/search-store';

interface ListingGridProps {
  listings: Listing[];
  isLoading: boolean;
  totalResults: number;
  marketAvgPrice: number;
  marketMinPrice: number;
  marketMaxPrice: number;
  query: string;
  location: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  condition?: string;
  onRefreshLive: () => void;
  onOpenAlertModal: () => void;
  onSaveSearch: () => void;
  onSelectDetail: (listing: Listing) => void;
  onResetFilters?: () => void;
}

export function ListingGrid({
  listings,
  isLoading,
  totalResults,
  marketAvgPrice,
  marketMinPrice,
  marketMaxPrice,
  query,
  location,
  minPrice,
  maxPrice,
  category,
  condition,
  onRefreshLive,
  onOpenAlertModal,
  onSaveSearch,
  onSelectDetail,
  onResetFilters,
}: ListingGridProps) {
  const [savedSuccess, setSavedSuccess] = useState(false);
  const { sortBy, setSortBy } = useSearchStore();

  const hasActiveFilters = 
    minPrice !== undefined || 
    maxPrice !== undefined || 
    (category && category !== 'Semua') || 
    (condition && condition !== 'Semua');

  const handleSaveSearchClick = () => {
    onSaveSearch();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar: Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pt-2">
        <div className="space-y-0.5">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            {query ? `Hasil untuk “${query}”` : 'Iklan Pilihan Marketplace'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {totalResults} iklan tersedia di <span className="font-medium text-foreground">{location}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Minimalist Sort Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-xl bg-card border border-border text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-foreground cursor-pointer appearance-none"
            >
              <option value="deal_score">Urutkan: Deal Terbaik</option>
              <option value="price_asc">Harga: Terendah</option>
              <option value="price_desc">Harga: Tertinggi</option>
              <option value="date_desc">Listing: Terbaru</option>
            </select>
            <ArrowUpDown className="absolute right-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={handleSaveSearchClick}
            className="h-9 px-3.5 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>{savedSuccess ? 'Tersimpan' : 'Simpan'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAlertModal}
            className="h-9 px-3.5 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Pasang Alert</span>
          </button>
        </div>
      </div>

      {/* Market Statistics Strip (Minimalist) */}
      {!isLoading && listings.length > 0 && marketAvgPrice > 0 && (
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl border border-border bg-secondary/30 text-center">
          <div>
            <span className="text-[11px] text-muted-foreground block">Termurah</span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-price">
              {formatRupiah(marketMinPrice)}
            </span>
          </div>
          <div className="border-x border-border/70">
            <span className="text-[11px] text-muted-foreground block">Rata-Rata Pasaran</span>
            <span className="text-sm font-semibold text-foreground tabular-price">
              {formatRupiah(marketAvgPrice)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block">Tertinggi</span>
            <span className="text-sm font-semibold text-foreground tabular-price">
              {formatRupiah(marketMaxPrice)}
            </span>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden p-3 space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && listings.length === 0 && (
        <div className="py-20 px-4 text-center rounded-2xl border border-dashed border-border bg-card/40 max-w-md mx-auto space-y-3.5">
          <div className="h-10 w-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
            <SearchX className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-foreground">Tidak ada iklan yang cocok</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {hasActiveFilters
                ? 'Filter yang aktif menyaring semua barang. Coba reset filter untuk melihat semua hasil.'
                : `Belum ada iklan untuk “${query}” di ${location}. Coba tombol Live Scrape untuk menarik iklan langsung dari Facebook.`}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="px-4 h-9 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium"
              >
                Reset Filter
              </button>
            )}
            <button
              onClick={onRefreshLive}
              className="px-4 h-9 rounded-xl bg-foreground text-background text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Live Scrape FB</span>
            </button>
          </div>
        </div>
      )}

      {/* Listing Cards Grid */}
      {!isLoading && listings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
          {listings.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              onSelectDetail={onSelectDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
