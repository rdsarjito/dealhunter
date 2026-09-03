'use client';

import { useState, useEffect } from 'react';
import { PriceAlert, Listing } from '@/types';
import { getAlertListings, addToWatchlist, removeFromWatchlist } from '@/lib/api';
import { formatRupiah, parseImages, formatTimeAgo } from '@/lib/format';
import { DealBadge } from '@/components/listing/deal-badge';
import { 
  ArrowLeft, 
  Radio, 
  ExternalLink, 
  Bookmark, 
  Check, 
  Share2, 
  MapPin, 
  RefreshCw, 
  ShieldCheck, 
  Play, 
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [savedItems, setSavedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadListings();
  }, [alert.id]);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const res = await getAlertListings(alert.id);
      setListings(res.data);
      setSelectedIndex(0); // Directly start with the FIRST item (#1)!
      setSelectedImgIndex(0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectItem = (index: number) => {
    setSelectedIndex(index);
    setSelectedImgIndex(0);
    setDescExpanded(false);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleToggleBookmark = async (item: Listing) => {
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
    setPriceRange(undefined, alert.max_price);
    router.push('/');
  };

  const currentItem = listings[selectedIndex];
  const images = currentItem ? parseImages(currentItem.images) : [];
  const currentImage = images[selectedImgIndex] || images[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80';

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="h-8 w-8 text-[#FF0000] animate-spin mx-auto" />
        <h3 className="text-base font-bold text-foreground">Memuat YouTube Watch Page untuk “{alert.keyword}”...</h3>
        <p className="text-xs text-[#606060] dark:text-[#AAAAAA]">Mengambil daftar iklan termurah dari Facebook Marketplace</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4 px-4">
        <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-xs">
          <Radio className="h-7 w-7 animate-pulse text-emerald-500" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Radar Aktif Mengintai 24/7</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">Menunggu Iklan Baru Diposting</h3>
          <p className="text-xs text-[#606060] dark:text-[#AAAAAA] leading-relaxed">
            Belum ada penjual yang baru memposting iklan <strong>“{alert.keyword}”</strong> dengan harga &le; {formatRupiah(alert.max_price)} di area {alert.location || 'sekitar Anda'}.
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Robot mengintai Facebook Marketplace setiap 2 menit. Detik ketika ada orang baru yang upload iklan cocok, iklannya langsung disambar masuk ke sini dan dikabari ke Telegram Anda!
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={loadListings}
            className="px-4 h-9 rounded-full border border-[#E5E5E5] dark:border-[#303030] text-xs font-semibold hover:bg-muted inline-flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Periksa Radar</span>
          </button>
          <button
            onClick={onBack}
            className="px-5 h-9 rounded-full bg-[#0F0F0F] dark:bg-[#F1F1F1] text-white dark:text-[#0F0F0F] text-xs font-bold"
          >
            Kembali ke Daftar Alert
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Top Header / Breadcrumbs */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E5E5E5] dark:border-[#303030] px-1 sm:px-0">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F2F2F2] dark:bg-[#272727] hover:bg-[#E5E5E5] dark:hover:bg-[#383838] text-foreground text-xs font-bold transition-colors shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Alert</span>
        </button>

        <div className="flex items-center gap-2 truncate">
          <span className="text-xs text-[#606060] dark:text-[#AAAAAA] hidden sm:inline truncate">
            Target: <strong className="text-foreground">{alert.keyword}</strong> (&le; {formatRupiah(alert.max_price)})
          </span>
          <button
            onClick={handleOpenInSearch}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#E5E5E5] dark:border-[#303030] bg-card hover:bg-[#F2F2F2] dark:hover:bg-[#272727] text-foreground text-xs font-semibold transition-colors shrink-0"
          >
            <span>Feed</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Responsive YouTube Watch Page: Desktop 2-Column, Mobile/Tablet 1-Column */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* MAIN VIDEO PLAYER COLUMN */}
        <div className="flex-1 min-w-0 w-full space-y-3 sm:space-y-4">
          {/* Main 16:9 Media Player Container */}
          <div className="relative aspect-video w-full rounded-xl sm:rounded-2xl bg-black overflow-hidden flex items-center justify-center select-none shadow-md">
            <img
              src={currentImage}
              alt={currentItem.title}
              className="max-h-full max-w-full object-contain"
            />

            {/* Condition Badge (Duration Style) */}
            <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 z-10">
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-black/85 text-white">
                {currentItem.condition || 'BEKAS'}
              </span>
            </div>

            {/* Deal Badge */}
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
              <DealBadge
                rating={currentItem.deal_rating}
                discount={currentItem.discount_percent}
              />
            </div>
          </div>

          {/* Thumbnail Gallery (if multiple photos exist) */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImgIndex(idx)}
                  className={`h-12 w-18 sm:h-16 sm:w-24 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImgIndex === idx ? 'border-[#FF0000] opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumb" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Title & Price */}
          <div className="space-y-1.5 px-1 sm:px-0">
            <h1 className="text-lg sm:text-2xl font-bold text-foreground leading-snug">
              {currentItem.title}
            </h1>

            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <span className="text-xl sm:text-3xl font-black text-[#FF0000] tabular-price">
                {formatRupiah(currentItem.price)}
              </span>
              {currentItem.market_avg_price > 0 && currentItem.discount_percent > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[#606060] dark:text-[#AAAAAA] line-through tabular-price text-[11px] sm:text-xs">
                    Pasaran: {formatRupiah(currentItem.market_avg_price)}
                  </span>
                  <span className="font-bold text-[#1F7D32] dark:text-[#31A24C] flex items-center text-[11px] sm:text-xs">
                    <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5" />
                    Hemat {formatRupiah(currentItem.market_avg_price - currentItem.price)} ({Math.round(currentItem.discount_percent)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Bar (Horizontally scrollable on mobile) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-y border-[#E5E5E5] dark:border-[#303030] px-1 sm:px-0">
            <a
              href={currentItem.fb_url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 sm:h-10 px-4 sm:px-5 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold text-xs flex items-center gap-2 transition-all shrink-0 shadow-xs"
            >
              <span>Buka di FB Marketplace</span>
              <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </a>

            <button
              type="button"
              onClick={() => handleToggleBookmark(currentItem)}
              className={`h-9 sm:h-10 px-3.5 sm:px-4 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                savedItems[currentItem.id]
                  ? 'bg-foreground text-background font-bold'
                  : 'bg-[#F2F2F2] dark:bg-[#272727] hover:bg-[#E5E5E5] dark:hover:bg-[#383838] text-foreground'
              }`}
            >
              {savedItems[currentItem.id] ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <Bookmark className="h-3.5 w-3.5" />}
              <span>{savedItems[currentItem.id] ? 'Tersimpan' : 'Simpan'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(currentItem.fb_url);
                  if (typeof window !== 'undefined') window.alert('Link Facebook Marketplace disalin!');
                }
              }}
              className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-[#F2F2F2] dark:bg-[#272727] hover:bg-[#E5E5E5] dark:hover:bg-[#383838] text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Bagikan</span>
            </button>
          </div>

          {/* YouTube Solid Grey Description Box */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#F2F2F2] dark:bg-[#272727] border border-[#E5E5E5] dark:border-[#383838] space-y-2.5 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#CCCCCC] dark:border-[#383838]">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                  {(currentItem.seller_name || 'P').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-foreground text-xs sm:text-sm truncate max-w-[200px] sm:max-w-xs">
                    {currentItem.seller_name || 'Penjual Facebook'}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#606060] dark:text-[#AAAAAA] flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#FF0000]" />
                    <span>{currentItem.location || 'Indonesia'}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(currentItem.listed_at || currentItem.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] sm:text-[11px] font-medium text-[#606060] dark:text-[#AAAAAA] block">Kondisi</span>
                <span className="font-bold text-foreground text-xs">{currentItem.condition || 'Bekas'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-foreground block">Deskripsi Penjual:</span>
              <p className={`text-[#0F0F0F] dark:text-[#E0E0E0] leading-relaxed whitespace-pre-line text-xs ${
                descExpanded ? '' : 'line-clamp-3'
              }`}>
                {currentItem.description || 'Tidak ada rincian deskripsi dari penjual. Silakan klik tombol merah di atas untuk chat langsung via Facebook Messenger.'}
              </p>
              {currentItem.description && currentItem.description.length > 150 && (
                <button
                  type="button"
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="font-bold text-[#0F0F0F] dark:text-[#FFFFFF] hover:underline pt-1 block"
                >
                  {descExpanded ? 'Lebih sedikit' : 'Selengkapnya...'}
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-[#CCCCCC] dark:border-[#383838] flex items-center gap-1.5 text-[#606060] dark:text-[#AAAAAA] text-[10px] sm:text-[11px]">
              <ShieldCheck className="h-4 w-4 text-[#31A24C] shrink-0" />
              <span>Selalu utamakan COD di tempat ramai. Cek fisik & fungsi barang sebelum bayar.</span>
            </div>
          </div>
        </div>

        {/* SIDEBAR / PLAYLIST QUEUE COLUMN (Responsive: Full width on mobile, 402px on desktop) */}
        <div className="w-full lg:w-[402px] shrink-0 space-y-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#E5E5E5] dark:border-[#303030]">
          <div className="flex items-center justify-between pb-1 px-1 sm:px-0">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <span>Iklan Terkait</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FF0000] text-white text-[10px] font-black">
                {listings.length}
              </span>
            </h3>
            <span className="text-xs text-[#606060] dark:text-[#AAAAAA]">Klik untuk memutar</span>
          </div>

          <div className="space-y-2.5 max-h-none lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto pr-0 lg:pr-1">
            {listings.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              const itemImages = parseImages(item.images);
              const thumb = itemImages[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=300&q=80';

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(idx)}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer flex gap-2.5 sm:gap-3 group ${
                    isSelected
                      ? 'bg-[#FFF0F0] dark:bg-[#2B1414] border-[#FF0000] ring-1 ring-[#FF0000]'
                      : 'bg-card hover:bg-[#F2F2F2] dark:hover:bg-[#272727] border-[#E5E5E5] dark:border-[#303030]'
                  }`}
                >
                  {/* Thumbnail (Responsive width: 120px on phones, 168px on tablets/desktop) */}
                  <div className="relative w-[120px] sm:w-[168px] h-[72px] sm:h-[94px] rounded-lg bg-[#E5E5E5] dark:bg-[#272727] overflow-hidden shrink-0">
                    <img
                      src={thumb}
                      alt={item.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="absolute top-1 left-1 z-10">
                      <span className={`px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded text-[9px] sm:text-[10px] font-black ${
                        isSelected ? 'bg-[#FF0000] text-white' : 'bg-black/80 text-white'
                      }`}>
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="absolute bottom-1 right-1 z-10">
                      <span className="px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-bold bg-black/85 text-white">
                        {item.condition || 'BEKAS'}
                      </span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1 py-0.5">
                    {isSelected && (
                      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-[#FF0000] uppercase tracking-wider">
                        <Play className="h-2 w-2 sm:h-2.5 sm:w-2.5 fill-[#FF0000]" />
                        <span>Sedang Ditampilkan</span>
                      </div>
                    )}

                    <h4 className={`text-xs sm:text-sm font-semibold leading-snug line-clamp-2 ${
                      isSelected ? 'text-[#FF0000]' : 'text-foreground group-hover:text-[#FF0000]'
                    }`}>
                      {item.title}
                    </h4>

                    <div className="text-xs font-bold text-[#FF0000] tabular-price">
                      {formatRupiah(item.price)}
                    </div>

                    <div className="text-[10px] sm:text-[11px] text-[#606060] dark:text-[#AAAAAA] truncate">
                      {item.location || 'Indonesia'} • {formatTimeAgo(item.listed_at || item.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
