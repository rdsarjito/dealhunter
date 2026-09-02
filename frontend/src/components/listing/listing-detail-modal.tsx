'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Listing } from '@/types';
import { formatRupiah, parseImages, formatTimeAgo } from '@/lib/format';
import { DealBadge } from './deal-badge';
import { 
  ArrowUpRight, 
  MapPin, 
  ShieldCheck, 
  Bookmark, 
  Check, 
  Share2,
  TrendingDown
} from 'lucide-react';
import { addToWatchlist, removeFromWatchlist } from '@/lib/api';

interface ListingDetailModalProps {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isBookmarked?: boolean;
  onBookmarkChange?: (isBookmarked: boolean) => void;
}

export function ListingDetailModal({
  listing,
  open,
  onOpenChange,
  isBookmarked = false,
  onBookmarkChange,
}: ListingDetailModalProps) {
  if (!listing) return null;

  const [saved, setSaved] = useState(isBookmarked);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const images = parseImages(listing.images);
  const mainImage = images[selectedImgIndex] || images[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';

  const handleToggleBookmark = async () => {
    try {
      if (saved) {
        await removeFromWatchlist(listing.id);
        setSaved(false);
        onBookmarkChange?.(false);
      } else {
        await addToWatchlist(listing.id);
        setSaved(true);
        onBookmarkChange?.(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-card border border-border rounded-2xl shadow-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{listing.title}</DialogTitle>
        </DialogHeader>

        {/* 2-Column Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px] max-h-[85vh]">
          {/* Left Column: Image Viewer */}
          <div className="md:col-span-7 bg-neutral-950 flex flex-col items-center justify-center p-6 relative select-none">
            <div className="relative w-full h-full flex items-center justify-center min-h-[320px]">
              <img
                src={mainImage}
                alt={listing.title}
                className="max-h-[65vh] max-w-full object-contain rounded-lg"
              />
            </div>

            {/* Thumbnail switcher */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto p-1 max-w-full no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImgIndex(idx)}
                    className={`h-12 w-12 rounded-lg overflow-hidden border transition-all shrink-0 ${
                      selectedImgIndex === idx ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information & Actions */}
          <div className="md:col-span-5 flex flex-col p-6 overflow-y-auto bg-card divide-y divide-border space-y-4">
            {/* Header & Price */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="uppercase font-mono text-[10px] tracking-wider">
                  {listing.category || 'Marketplace'}
                </span>
                <span>{formatTimeAgo(listing.listed_at || listing.created_at)}</span>
              </div>

              <h2 className="text-lg font-semibold text-foreground leading-snug">
                {listing.title}
              </h2>

              <div className="pt-1">
                <div className="text-2xl font-bold tracking-tight text-foreground tabular-price">
                  {formatRupiah(listing.price)}
                </div>

                {listing.market_avg_price > 0 && listing.discount_percent > 0 && (
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="text-muted-foreground line-through tabular-price">
                      Pasaran: {formatRupiah(listing.market_avg_price)}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center">
                      <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                      Hemat {formatRupiah(listing.market_avg_price - listing.price)} ({Math.round(listing.discount_percent)}%)
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-1">
                <DealBadge
                  rating={listing.deal_rating}
                  discount={listing.discount_percent}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 space-y-2.5">
              <a
                href={listing.fb_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 px-4 rounded-xl bg-foreground text-background font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <span>Buka di Facebook Marketplace</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleToggleBookmark}
                  className={`h-9 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    saved
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-card text-foreground hover:bg-secondary'
                  }`}
                >
                  {saved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                  <span>{saved ? 'Tersimpan' : 'Simpan'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(listing.fb_url);
                      alert('Link FB disalin!');
                    }
                  }}
                  className="h-9 rounded-xl border border-border bg-card text-foreground hover:bg-secondary text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Bagikan</span>
                </button>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="pt-4 space-y-2 text-xs">
              <span className="font-semibold text-foreground">Informasi Barang</span>
              <div className="space-y-1.5 text-muted-foreground">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Kondisi</span>
                  <span className="font-medium text-foreground">{listing.condition || 'Bekas'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Lokasi</span>
                  <span className="font-medium text-foreground">{listing.location || 'Indonesia'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span>Penjual</span>
                  <span className="font-medium text-foreground">{listing.seller_name || 'Penjual FB'}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="pt-4 space-y-1.5 text-xs">
              <span className="font-semibold text-foreground">Deskripsi</span>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-xs">
                {listing.description || 'Tidak ada deskripsi rinci dari penjual.'}
              </p>
            </div>

            {/* COD Safety Note */}
            <div className="pt-4 text-xs">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Transaksi Aman</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Selalu utamakan COD di tempat umum. Cek fungsi barang sebelum membayar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
