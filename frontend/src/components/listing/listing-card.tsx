'use client';

import { useState } from 'react';
import { Bookmark, Check } from 'lucide-react';
import { Listing } from '@/types';
import { formatRupiah, parseImages, formatTimeAgo } from '@/lib/format';
import { DealBadge } from './deal-badge';
import { addToWatchlist, removeFromWatchlist } from '@/lib/api';

interface ListingCardProps {
  listing: Listing;
  isBookmarked?: boolean;
  onBookmarkChange?: (isBookmarked: boolean) => void;
  onSelectDetail?: (listing: Listing) => void;
}

export function ListingCard({
  listing,
  isBookmarked = false,
  onBookmarkChange,
  onSelectDetail,
}: ListingCardProps) {
  const [saved, setSaved] = useState(isBookmarked);
  const [isSaving, setIsSaving] = useState(false);
  const images = parseImages(listing.images);
  const thumbnail = images[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  };

  const sellerInitial = (listing.seller_name || 'P').charAt(0).toUpperCase();

  return (
    <div 
      onClick={() => onSelectDetail?.(listing)}
      className="group flex flex-col gap-2.5 cursor-pointer select-none"
    >
      {/* 16:9 Video-Style Thumbnail */}
      <div className="relative aspect-video w-full rounded-xl bg-[#E5E5E5] dark:bg-[#272727] overflow-hidden">
        <img
          src={thumbnail}
          alt={listing.title}
          className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out"
          loading="lazy"
        />

        {/* Top Left: Deal Badge */}
        <div className="absolute top-2 left-2 z-10">
          <DealBadge
            rating={listing.deal_rating}
            discount={listing.discount_percent}
          />
        </div>

        {/* Top Right: Bookmark Button */}
        <button
          onClick={handleToggleBookmark}
          disabled={isSaving}
          title={saved ? 'Hapus dari Watchlist' : 'Simpan ke Watchlist'}
          className={`absolute top-2 right-2 z-10 h-7 w-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
            saved
              ? 'bg-[#FF0000] text-white shadow-xs'
              : 'bg-black/50 text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity'
          }`}
        >
          {saved ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <Bookmark className="h-3.5 w-3.5" />}
        </button>

        {/* Bottom Right: Duration Tag (YouTube Black Pill) */}
        <div className="absolute bottom-2 right-2 z-10">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/85 text-white">
            {listing.condition || 'BEKAS'}
          </span>
        </div>
      </div>

      {/* Info Section (Avatar on Left, Title & Price on Right) */}
      <div className="flex items-start gap-3">
        <div 
          className="h-9 w-9 rounded-full bg-[#E5E5E5] dark:bg-[#272727] text-[#0F0F0F] dark:text-[#F1F1F1] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5"
          title={listing.seller_name || 'Penjual FB'}
        >
          {sellerInitial}
        </div>

        <div className="flex-1 min-w-0 space-y-0.5">
          {/* Title */}
          <h3 className="text-sm font-semibold text-[#0F0F0F] dark:text-[#F1F1F1] line-clamp-2 leading-snug group-hover:text-[#FF0000] transition-colors">
            {listing.title}
          </h3>

          {/* Seller Name */}
          <div className="text-xs text-[#606060] dark:text-[#AAAAAA] hover:text-[#0F0F0F] dark:hover:text-[#F1F1F1] truncate">
            {listing.seller_name || 'Penjual FB Marketplace'}
          </div>

          {/* Price & Savings */}
          <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
            <span className="text-base font-bold text-[#FF0000] tabular-price">
              {formatRupiah(listing.price)}
            </span>
            {listing.market_avg_price > 0 && listing.discount_percent > 5 && (
              <span className="text-xs text-[#606060] dark:text-[#AAAAAA] line-through tabular-price">
                {formatRupiah(listing.market_avg_price)}
              </span>
            )}
          </div>

          {/* Location & Time */}
          <div className="text-xs text-[#606060] dark:text-[#AAAAAA] truncate">
            {listing.location || 'Indonesia'} • {formatTimeAgo(listing.listed_at || listing.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}
