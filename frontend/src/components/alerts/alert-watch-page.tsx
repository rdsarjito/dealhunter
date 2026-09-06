'use client';

import { useState, useEffect } from 'react';
import { PriceAlert, Listing } from '@/types';
import { getAlertListings, scanSingleAlert, addToWatchlist, removeFromWatchlist } from '@/lib/api';
import { formatRupiah, parseImages } from '@/lib/format';
import { DealBadge } from '@/components/listing/deal-badge';
import { ListingDetailModal } from '@/components/listing/listing-detail-modal';
import { 
  ArrowLeft, 
  RefreshCw, 
  ExternalLink, 
  Bookmark, 
  Check, 
  Home, 
  Search,
  Radio,
  SlidersHorizontal,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSearchStore } from '@/stores/search-store';

interface AlertWatchPageProps {
  alert: PriceAlert;
  onBack: () => void;
}

export function AlertWatchPage({ alert, onBack }: AlertWatchPageProps) {
  const router = useRouter();
  const { setKeyword, setLocation, setPriceRange } = useSearchStore();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [savedItems, setSavedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadListings();
  }, [alert.id]);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const res = await getAlertListings(alert.id);
      setListings(res.data || []);
    } catch (err) {
      console.error('Error loading alert listings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanNow = async () => {
    setIsScanning(true);
    try {
      await scanSingleAlert(alert.id);
      await loadListings();
    } catch (err) {
      console.error('Error triggering scan:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenDetail = (item: Listing) => {
    setSelectedListing(item);
    setDetailModalOpen(true);
  };

  const handleToggleBookmark = async (e: React.MouseEvent, item: Listing) => {
    e.stopPropagation();
    const isCurrentlySaved = savedItems[item.id];
    try {
      if (isCurrentlySaved) {
        await removeFromWatchlist(item.id);
        setSavedItems((prev) => ({ ...prev, [item.id]: false }));
      } else {
        await addToWatchlist(item.id);
        setSavedItems((prev) => ({ ...prev, [item.id]: true }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenInSearch = () => {
    setKeyword(alert.keyword);
    setLocation(alert.location || 'Jakarta');
    setPriceRange(alert.min_price || undefined, alert.max_price);
    router.push('/');
  };

  const formatDistance = (distKm?: number) => {
    if (distKm === undefined || distKm === null) {
      return 'Dekat rumah Anda';
    }
    if (distKm === 0 || distKm < 0.1) {
      return 'Sangat dekat rumah (0 km)';
    }
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)} m dari rumah`;
    }
    return `${distKm < 10 ? distKm.toFixed(1) : Math.round(distKm)} km dari rumah`;
  };

  return (
    <div className="space-y-5 w-full pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E5] dark:border-[#303030]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F2F2F2] dark:bg-[#272727] hover:bg-[#E5E5E5] dark:hover:bg-[#383838] text-foreground text-xs font-bold transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Alert</span>
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-foreground truncate flex items-center gap-2">
              <span>{alert.keyword}</span>
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black">
                {listings.length}
              </span>
            </h1>
          </div>
        </div>

        {/* Right Info Badges & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Target Price */}
          <div className="px-2.5 py-1 rounded-full bg-muted/70 text-[11px] font-semibold text-foreground/85 shrink-0">
            Target: {alert.min_price !== undefined && alert.min_price !== null && alert.min_price > 0
              ? `${formatRupiah(alert.min_price)} - ${formatRupiah(alert.max_price)}`
              : formatRupiah(alert.max_price)
            }
          </div>

          {/* User House Location Anchor */}
          <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1 shrink-0">
            <Home className="h-3 w-3" />
            <span>Rumah: {alert.location || 'Kebayoran Lama, Jakarta'}</span>
          </div>

          {/* Scan Now */}
          <button
            type="button"
            onClick={handleScanNow}
            disabled={isScanning}
            className="h-8 px-3 rounded-full border border-[#E5E5E5] dark:border-[#303030] bg-card hover:bg-[#F2F2F2] dark:hover:bg-[#272727] text-foreground text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin text-red-500' : ''}`} />
            <span>{isScanning ? 'Memindai...' : 'Pindai'}</span>
          </button>

          {/* Open In Search */}
          <button
            type="button"
            onClick={handleOpenInSearch}
            className="h-8 px-3 rounded-full bg-foreground text-background hover:opacity-90 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shrink-0"
          >
            <span>Feed</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 w-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square w-full rounded-2xl bg-[#E5E5E5] dark:bg-[#272727] animate-pulse" />
              <div className="space-y-1.5 pt-1">
                <div className="h-4 bg-[#E5E5E5] dark:bg-[#272727] rounded w-1/2 animate-pulse" />
                <div className="h-3.5 bg-[#E5E5E5] dark:bg-[#272727] rounded w-5/6 animate-pulse" />
                <div className="h-3 bg-[#E5E5E5] dark:bg-[#272727] rounded w-2/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && listings.length === 0 && (
        <div className="py-20 text-center max-w-md mx-auto space-y-4 px-4">
          <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-xs">
            <Radio className="h-7 w-7 animate-pulse text-emerald-500" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Pemantauan Aktif 24/7</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">Menunggu Iklan Baru Diposting</h3>
            <p className="text-xs text-[#606060] dark:text-[#AAAAAA] leading-relaxed">
              Belum ada penjual yang memposting iklan <strong>“{alert.keyword}”</strong> dengan rentang harga target di area {alert.location || 'sekitar rumah Anda'}.
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Robot DealHunter terus memantau Facebook Marketplace secara otomatis setiap {alert.interval_minutes || 5} menit. Iklan baru yang cocok akan langsung ditampilkan di grid ini dan dikirim ke Telegram!
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleScanNow}
              disabled={isScanning}
              className="px-4 h-9 rounded-full border border-[#E5E5E5] dark:border-[#303030] text-xs font-semibold hover:bg-muted inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Memindai...' : 'Pindai Sekarang'}</span>
            </button>
            <button
              onClick={onBack}
              className="px-5 h-9 rounded-full bg-[#0F0F0F] dark:bg-[#F1F1F1] text-white dark:text-[#0F0F0F] text-xs font-bold"
            >
              Kembali
            </button>
          </div>
        </div>
      )}

      {/* Main Facebook Marketplace Grid - Matching User Reference Screenshot */}
      {!isLoading && listings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 w-full">
          {listings.map((item) => {
            const images = parseImages(item.images);
            const thumb = images[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
            const isSaved = !!savedItems[item.id];

            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                className="group flex flex-col text-left cursor-pointer select-none transition-all duration-200"
              >
                {/* 1:1 Aspect Ratio Square Photo with Rounded Corners */}
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#242526] dark:bg-[#1C1C1D]">
                  <img
                    src={thumb}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Top Left: Deal Badge (if discounted or good deal) */}
                  {(item.deal_rating === 'great_deal' || item.deal_rating === 'good_deal' || item.discount_percent > 10) && (
                    <div className="absolute top-2 left-2 z-10">
                      <DealBadge
                        rating={item.deal_rating}
                        discount={item.discount_percent}
                      />
                    </div>
                  )}

                  {/* Top Right: Bookmark Quick Action */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleBookmark(e, item)}
                    className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-xs text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title={isSaved ? 'Hapus Simpanan' : 'Simpan Iklan'}
                  >
                    {isSaved ? (
                      <Check className="h-4 w-4 text-emerald-400 stroke-[2.5]" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </button>

                  {/* Bottom Right: Condition Pill */}
                  {item.condition && (
                    <div className="absolute bottom-2 right-2 z-10">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/80 text-white backdrop-blur-xs">
                        {item.condition}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info Lines (Exact Match to User Reference Screenshot) */}
                <div className="pt-2 sm:pt-2.5 space-y-0.5">
                  {/* Line 1: Bold Price */}
                  <div className="font-bold text-base sm:text-lg text-foreground leading-tight tracking-tight tabular-price">
                    {formatRupiah(item.price)}
                  </div>

                  {/* Line 2: Title */}
                  <h3
                    className="text-xs sm:text-sm text-foreground/90 font-normal leading-snug line-clamp-2 group-hover:text-foreground transition-colors"
                    title={item.title}
                  >
                    {item.title}
                  </h3>

                  {/* Line 3: Location and Distance from User's House */}
                  <div className="text-[11px] sm:text-xs text-[#606060] dark:text-[#AAAAAA] line-clamp-1 flex items-center gap-1 pt-0.5">
                    <span className="truncate">{item.location || 'Indonesia'}</span>
                    <span className="shrink-0">•</span>
                    <span className="shrink-0 text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatDistance(item.distance_km)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          isBookmarked={!!savedItems[selectedListing.id]}
          onBookmarkChange={(val) => {
            setSavedItems((prev) => ({ ...prev, [selectedListing.id]: val }));
          }}
        />
      )}
    </div>
  );
}
