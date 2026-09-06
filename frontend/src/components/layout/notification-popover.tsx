'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, RefreshCw, ExternalLink, Tag, Settings, Radio } from 'lucide-react';
import { NotificationItem, Listing } from '@/types';
import { formatRupiah, formatTimeAgo } from '@/lib/format';
import { getNotifications } from '@/lib/api';

interface NotificationPopoverProps {
  open: boolean;
  onClose: () => void;
  onSelectListing: (listing: Listing) => void;
  onCountUpdate?: (count: number) => void;
}

export function NotificationPopover({
  open,
  onClose,
  onSelectListing,
  onCountUpdate,
}: NotificationPopoverProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications(20);
      setNotifications(data);
      onCountUpdate?.(data.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 45 seconds
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="absolute right-0 top-12 w-[360px] sm:w-[420px] rounded-2xl bg-card border border-[#E5E5E5] dark:border-[#303030] shadow-2xl z-50 text-foreground overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-150 select-none">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#E5E5E5] dark:border-[#303030] bg-muted/10">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-foreground">Notifikasi</span>
          {notifications.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FF0000] text-white">
              {notifications.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={fetchNotifications}
            title="Segarkan notifikasi"
            className="h-7 w-7 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#FF0000]' : ''}`} />
          </button>
          <Link
            href="/alerts"
            onClick={onClose}
            title="Kelola Pengaturan Alerts"
            className="h-7 w-7 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Content List */}
      <div className="max-h-[440px] overflow-y-auto divide-y divide-[#F0F0F0] dark:divide-[#272727] overscroll-contain">
        {loading && notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
            <RefreshCw className="h-5 w-5 animate-spin text-[#FF0000]" />
            <span>Memuat notifikasi deal terbaru...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-2.5">
            <div className="h-12 w-12 rounded-full bg-[#FF0000]/10 text-[#FF0000] flex items-center justify-center mx-auto">
              <Bell className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground">Belum ada notifikasi deal baru</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                DealHunter terus memantau postingan Facebook Marketplace secara otomatis sesuai kriteria alert Anda.
              </p>
            </div>
          </div>
        ) : (
          notifications.map((notif) => {
            const img = (() => {
              try {
                const arr = JSON.parse(notif.listing.images || '[]');
                return Array.isArray(arr) && arr.length > 0 ? arr[0] : '';
              } catch {
                return '';
              }
            })();

            return (
              <div
                key={notif.id}
                onClick={() => onSelectListing(notif.listing)}
                className="p-3 flex items-start gap-3 hover:bg-[#00000008] dark:hover:bg-[#FFFFFF0D] transition-colors cursor-pointer group relative"
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/5 dark:bg-black/40 shrink-0 relative border border-[#E5E5E5] dark:border-[#303030]">
                  {img ? (
                    <img
                      src={img}
                      alt={notif.listing.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-muted/20">
                      <Radio className="h-5 w-5 text-[#FF0000]/70" />
                    </div>
                  )}
                  {notif.listing.discount_percent > 0 && (
                    <div className="absolute top-1 left-1 bg-[#2BA640] text-white text-[9px] font-bold px-1 rounded">
                      -{Math.round(notif.listing.discount_percent)}%
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Alert Tag & Time */}
                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-[#FF0000]/10 text-[#FF0000] truncate max-w-[140px]">
                      {notif.alert_keyword}
                    </span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(notif.created_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-[#065FD4] dark:group-hover:text-[#3EA6FF] transition-colors">
                    {notif.listing.title}
                  </h4>

                  {/* Price & Location */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="font-bold text-foreground tabular-price">
                      {formatRupiah(notif.listing.price)}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate max-w-[110px]">
                      {notif.listing.location || 'Indonesia'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-muted/20 border-t border-[#E5E5E5] dark:border-[#303030] text-center">
        <Link
          href="/alerts"
          onClick={onClose}
          className="text-xs font-semibold text-[#065FD4] dark:text-[#3EA6FF] hover:underline inline-flex items-center gap-1"
        >
          <span>Buka Semua Pantauan di Alerts</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
