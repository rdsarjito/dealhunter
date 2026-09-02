'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { YouTubeSidebar } from '@/components/layout/youtube-sidebar';
import { YouTubeBottomNav } from '@/components/layout/youtube-bottom-nav';
import { ListingCard } from '@/components/listing/listing-card';
import { ListingDetailModal } from '@/components/listing/listing-detail-modal';
import { TelegramSettingsModal } from '@/components/telegram/telegram-settings-modal';
import { getWatchlist, getTelegramStatus } from '@/lib/api';
import { WatchlistItem, Listing } from '@/types';
import { Bookmark, BookmarkX } from 'lucide-react';
import Link from 'next/link';

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);

  useEffect(() => {
    loadWatchlist();
    getTelegramStatus().then((res) => setTelegramConnected(res.connected)).catch(() => {});
  }, []);

  const loadWatchlist = async () => {
    setIsLoading(true);
    try {
      const data = await getWatchlist();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-14 md:pb-0">
      <Navbar
        onOpenTelegram={() => setTelegramOpen(true)}
        telegramConnected={telegramConnected}
      />

      <div className="flex-1 flex flex-row w-full min-h-[calc(100vh-56px)]">
        <YouTubeSidebar
          onOpenTelegram={() => setTelegramOpen(true)}
          telegramConnected={telegramConnected}
        />

        <main className="flex-1 min-w-0 w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-6 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <div className="h-6 w-8 rounded-lg bg-[#FF0000] text-white flex items-center justify-center shadow-xs">
                <Bookmark className="h-3.5 w-3.5" />
              </div>
              <span>Watchlist Saya</span>
            </h1>
            <p className="text-xs text-[#606060] dark:text-[#AAAAAA]">
              {items.length} iklan tersimpan untuk dipantau
            </p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-[#F2F2F2] dark:bg-[#272727] animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && items.length === 0 && (
            <div className="py-24 text-center rounded-2xl border border-dashed border-[#E5E5E5] dark:border-[#303030] bg-card/40 max-w-md mx-auto space-y-3">
              <div className="h-12 w-12 rounded-full bg-[#F2F2F2] dark:bg-[#272727] text-[#606060] flex items-center justify-center mx-auto">
                <BookmarkX className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground">Watchlist Masih Kosong</h3>
                <p className="text-xs text-[#606060] dark:text-[#AAAAAA]">
                  Klik ikon bookmark pada kartu listing di beranda untuk menyimpan barang yang ingin dipantau.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center px-4 h-9 rounded-full bg-[#FF0000] text-white text-xs font-bold hover:bg-[#CC0000] transition-colors"
              >
                Jelajahi Beranda
              </Link>
            </div>
          )}

          {/* Items Grid (YouTube Style) */}
          {!isLoading && items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
              {items.map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item.listing}
                  isBookmarked={true}
                  onBookmarkChange={(saved) => {
                    if (!saved) {
                      setItems((prev) => prev.filter((i) => i.id !== item.id));
                    }
                  }}
                  onSelectDetail={(listing) => {
                    setSelectedListing(listing);
                    setDetailOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <YouTubeBottomNav />

      <ListingDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        listing={selectedListing}
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
