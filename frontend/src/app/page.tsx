'use client';

import { useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { YouTubeSidebar } from '@/components/layout/youtube-sidebar';
import { YouTubeBottomNav } from '@/components/layout/youtube-bottom-nav';
import { MinimalFilterDock } from '@/components/search/minimal-filter-dock';
import { ListingGrid } from '@/components/listing/listing-grid';
import { ListingDetailModal } from '@/components/listing/listing-detail-modal';
import { AlertModal } from '@/components/alerts/alert-modal';
import { TelegramSettingsModal } from '@/components/telegram/telegram-settings-modal';
import { useSearchStore } from '@/stores/search-store';
import { searchListings, createSavedSearch, getTelegramStatus } from '@/lib/api';
import { Listing, SearchResponse } from '@/types';

export default function HomePage() {
  const { 
    keyword, 
    location, 
    radiusKm, 
    minPrice, 
    maxPrice, 
    category, 
    condition, 
    sortBy,
    resetFilters
  } = useSearchStore();

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);

  // Check telegram status on mount
  useEffect(() => {
    getTelegramStatus().then((res) => {
      setTelegramConnected(res.connected);
    }).catch(() => {});
  }, []);

  const executeSearch = useCallback(async (live: boolean = false, overrideFilters?: {
    minPrice?: number;
    maxPrice?: number;
    category?: string;
    condition?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await searchListings({
        keyword,
        location,
        radius_km: radiusKm,
        min_price: overrideFilters ? overrideFilters.minPrice : minPrice,
        max_price: overrideFilters ? overrideFilters.maxPrice : maxPrice,
        category: overrideFilters ? overrideFilters.category : category,
        condition: overrideFilters ? overrideFilters.condition : condition,
        sort_by: sortBy,
        live,
      });
      setSearchData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, location, radiusKm, minPrice, maxPrice, category, condition, sortBy]);

  // Initial load
  useEffect(() => {
    executeSearch(false);
  }, [executeSearch]);

  const handleSaveSearch = async () => {
    try {
      await createSavedSearch({
        keyword,
        location,
        radius_km: radiusKm,
        min_price: minPrice,
        max_price: maxPrice,
        category: category !== 'Semua' ? category : undefined,
      });
      if (typeof window !== 'undefined') window.alert('Pencarian berhasil disimpan ke menu Tersimpan!');
    } catch (err: any) {
      if (typeof window !== 'undefined') window.alert(err.message || 'Gagal menyimpan pencarian');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-14 md:pb-0">
      <Navbar
        onOpenTelegram={() => setTelegramOpen(true)}
        telegramConnected={telegramConnected}
        onOpenAlertModal={() => setAlertOpen(true)}
        onSearchSubmit={() => executeSearch(false)}
      />

      <div className="flex-1 flex flex-row w-full min-h-[calc(100vh-56px)]">
        {/* Left: YouTube Sidebar (Drawer on Mobile, Sidebar/MiniRail on Desktop) */}
        <YouTubeSidebar
          onOpenTelegram={() => setTelegramOpen(true)}
          telegramConnected={telegramConnected}
        />

        {/* Right: Main Content Area */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 xl:px-16 py-3 sm:py-4 space-y-4 overflow-y-auto">
          <MinimalFilterDock
            onSearch={(live) => executeSearch(live)}
            isLoading={isLoading}
          />

          <ListingGrid
            listings={searchData?.listings || []}
            isLoading={isLoading}
            totalResults={searchData?.total_results || 0}
            marketAvgPrice={searchData?.market_avg_price || 0}
            marketMinPrice={searchData?.market_min_price || 0}
            marketMaxPrice={searchData?.market_max_price || 0}
            query={keyword}
            location={location}
            minPrice={minPrice}
            maxPrice={maxPrice}
            category={category}
            condition={condition}
            onRefreshLive={() => executeSearch(true)}
            onOpenAlertModal={() => setAlertOpen(true)}
            onSaveSearch={handleSaveSearch}
            onSelectDetail={(listing) => {
              setSelectedListing(listing);
              setDetailOpen(true);
            }}
            onResetFilters={() => {
              resetFilters();
              executeSearch(false, {
                minPrice: undefined,
                maxPrice: undefined,
                category: 'Semua',
                condition: 'Semua',
              });
            }}
          />
        </main>
      </div>

      <YouTubeBottomNav />

      <ListingDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        listing={selectedListing}
      />

      <AlertModal
        open={alertOpen}
        onOpenChange={setAlertOpen}
        defaultKeyword={keyword}
        defaultLocation={location}
        defaultMaxPrice={selectedListing?.price}
        onAlertCreated={() => {}}
        onOpenTelegramSettings={() => setTelegramOpen(true)}
      />

      <TelegramSettingsModal
        open={telegramOpen}
        onOpenChange={setTelegramOpen}
        onConnectedSuccess={() => setTelegramConnected(true)}
        isConnected={telegramConnected}
      />
    </div>
  );
}
