'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { YouTubeSidebar } from '@/components/layout/youtube-sidebar';
import { YouTubeBottomNav } from '@/components/layout/youtube-bottom-nav';
import { TelegramSettingsModal } from '@/components/telegram/telegram-settings-modal';
import { getSavedSearches, deleteSavedSearch, getTelegramStatus } from '@/lib/api';
import { SavedSearch } from '@/types';
import { useSearchStore } from '@/stores/search-store';
import { formatRupiah } from '@/lib/format';
import { History, Search, Trash2, MapPin, ArrowUpRight } from 'lucide-react';

export default function SavedSearchesPage() {
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);

  const { setKeyword, setLocation, setRadiusKm, setPriceRange, setCategory, setCondition } = useSearchStore();

  useEffect(() => {
    loadSearches();
    getTelegramStatus().then((res) => setTelegramConnected(res.connected)).catch(() => {});
  }, []);

  const loadSearches = async () => {
    setIsLoading(true);
    try {
      const data = await getSavedSearches();
      setSearches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSearch = (s: SavedSearch) => {
    setKeyword(s.keyword);
    setLocation(s.location);
    setRadiusKm(s.radius_km || 50);
    setPriceRange(s.min_price, s.max_price);
    setCategory(s.category || 'Semua');
    setCondition(s.condition || 'Semua');
    router.push('/');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSavedSearch(id);
      setSearches((prev) => prev.filter((it) => it.id !== id));
    } catch (err) {
      console.error(err);
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
                <History className="h-3.5 w-3.5" />
              </div>
              <span>Pencarian Tersimpan</span>
            </h1>
            <p className="text-xs text-[#606060] dark:text-[#AAAAAA]">
              Filter pencarian favorit yang telah Anda simpan untuk akses cepat
            </p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-[#F2F2F2] dark:bg-[#272727] animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && searches.length === 0 && (
            <div className="py-24 text-center rounded-2xl border border-dashed border-[#E5E5E5] dark:border-[#303030] bg-card/40 max-w-md mx-auto space-y-3">
              <div className="h-12 w-12 rounded-full bg-[#F2F2F2] dark:bg-[#272727] text-[#606060] flex items-center justify-center mx-auto">
                <History className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground">Belum Ada Pencarian Tersimpan</h3>
                <p className="text-xs text-[#606060] dark:text-[#AAAAAA]">
                  Klik tombol &ldquo;Simpan Pencarian&rdquo; saat mencari barang di beranda untuk menyimpannya ke daftar ini.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center px-4 h-9 rounded-full bg-[#FF0000] text-white text-xs font-bold hover:bg-[#CC0000] transition-colors"
              >
                Mulai Mencari
              </Link>
            </div>
          )}

          {/* List */}
          {!isLoading && searches.length > 0 && (
            <div className="space-y-2.5">
              {searches.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#303030] bg-card hover:border-[#FF0000] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-[#FF0000]" />
                      <h3 className="font-bold text-sm text-foreground">
                        &ldquo;{s.keyword}&rdquo;
                      </h3>
                      {s.category && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F2F2F2] dark:bg-[#272727] text-[#606060] dark:text-[#AAAAAA]">
                          {s.category}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#606060] dark:text-[#AAAAAA]">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#FF0000]" />
                        <span>{s.location}</span>
                        {s.radius_km && <span>({s.radius_km}km)</span>}
                      </div>

                      {(s.min_price || s.max_price) && (
                        <span>
                          Harga: {s.min_price ? formatRupiah(s.min_price) : '0'} - {s.max_price ? formatRupiah(s.max_price) : 'Tanpa batas'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleRunSearch(s)}
                      className="h-8 px-4 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Buka Pencarian</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="h-8 w-8 rounded-full bg-[#F2F2F2] dark:bg-[#272727] hover:bg-[#FFE5E5] hover:text-[#CC0000] text-[#606060] flex items-center justify-center transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <YouTubeBottomNav />

      <TelegramSettingsModal
        open={telegramOpen}
        onOpenChange={setTelegramOpen}
        onConnectedSuccess={() => setTelegramConnected(true)}
        isConnected={telegramConnected}
      />
    </div>
  );
}
