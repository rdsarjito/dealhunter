'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, RefreshCw, ExternalLink, Settings, Radio, MoreVertical } from 'lucide-react';
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
    <div className="absolute right-0 top-12 w-[380px] sm:w-[480px] max-w-[calc(100vw-20px)] rounded-xl bg-card border border-[#E5E5E5] dark:border-[#303030] shadow-2xl z-50 text-foreground overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-150 select-none">
      {/* YouTube Style Header */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#0000001A] dark:border-[#FFFFFF1A]">
        <div className="flex items-center gap-2">
          <span className="font-normal text-base text-foreground tracking-tight">Notifikasi</span>
          {notifications.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E1002D] text-white leading-none">
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={fetchNotifications}
            title="Segarkan notifikasi"
            className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#E1002D]' : ''}`} />
          </button>
          <Link
            href="/alerts"
            onClick={onClose}
            title="Setelan Notifikasi & Alerts"
            className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* YouTube Style Notification List */}
      <div className="max-h-[460px] overflow-y-auto divide-y divide-[#0000000A] dark:divide-[#FFFFFF0A] overscroll-contain">
        {loading && notifications.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center gap-2 text-[#606060] dark:text-[#AAAAAA] text-xs">
            <RefreshCw className="h-5 w-5 animate-spin text-[#E1002D]" />
            <span>Memuat notifikasi terbaru...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-secondary text-foreground flex items-center justify-center mx-auto">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Belum ada notifikasi</h4>
              <p className="text-xs text-[#606060] dark:text-[#AAAAAA] max-w-xs mx-auto leading-relaxed">
                Listing Facebook Marketplace yang cocok dengan kata kunci alert Anda akan muncul di sini.
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
                className="px-4 py-3 flex items-start gap-3 hover:bg-[#00000008] dark:hover:bg-[#FFFFFF0D] transition-colors cursor-pointer group relative"
              >
                {/* Left: Unread Blue Indicator Dot + Gambar dari Alerts */}
                <div className="flex items-center gap-1.5 shrink-0 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#065FD4] dark:bg-[#3EA6FF] shrink-0" />
                  <div className="w-9 h-9 rounded-full bg-secondary text-foreground flex items-center justify-center overflow-hidden border border-border shrink-0">
                    {notif.alert_thumbnail ? (
                      <img
                        src={notif.alert_thumbnail}
                        alt={notif.alert_keyword}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#FF0000]/10 text-[#FF0000]">
                        <Radio className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle: Text Information */}
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-[13px] font-normal text-foreground leading-[1.35] line-clamp-2">
                    <span className="font-semibold text-[#E1002D]">[{notif.alert_keyword.toUpperCase()}]</span>{' '}
                    {notif.listing.title}
                  </p>
                  <div className="flex items-center flex-wrap gap-1 text-[11px] text-[#606060] dark:text-[#AAAAAA] mt-1">
                    <span className="font-bold text-foreground tabular-price">
                      {formatRupiah(notif.listing.price)}
                    </span>
                    <span>•</span>
                    <span>{formatTimeAgo(notif.created_at)}</span>
                    {notif.listing.location && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[100px]">{notif.listing.location}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Item Thumbnail (Clean without Deal / Discount Badge) */}
                <div className="w-20 h-13 rounded-lg overflow-hidden shrink-0 relative bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                  {img ? (
                    <img
                      src={img}
                      alt={notif.listing.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-muted/20">
                      <Radio className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Far Right: YouTube 3-dots Menu Icon on Hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectListing(notif.listing);
                  }}
                  title="Opsi"
                  className="w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/15 flex items-center justify-center text-foreground transition-all shrink-0 -mr-1 self-center cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* YouTube Style Footer */}
      <div className="p-2.5 bg-muted/10 border-t border-[#0000001A] dark:border-[#FFFFFF1A] text-center">
        <Link
          href="/alerts"
          onClick={onClose}
          className="text-xs font-medium text-[#065FD4] dark:text-[#3EA6FF] hover:underline inline-flex items-center gap-1"
        >
          <span>Kelola kata kunci & pantauan alert</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
