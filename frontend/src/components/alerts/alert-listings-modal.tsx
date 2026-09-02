'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { PriceAlert, Listing } from '@/types';
import { getAlertListings } from '@/lib/api';
import { formatRupiah, parseImages, formatTimeAgo } from '@/lib/format';
import { DealBadge } from '@/components/listing/deal-badge';
import { ListingDetailModal } from '@/components/listing/listing-detail-modal';
import { 
  Bell, 
  ArrowUpRight, 
  RefreshCw, 
  Tag, 
  MapPin
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSearchStore } from '@/stores/search-store';

interface AlertListingsModalProps {
  alert: PriceAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertListingsModal({
  alert,
  open,
  onOpenChange,
}: AlertListingsModalProps) {
  const router = useRouter();
  const { setKeyword, setLocation, setPriceRange } = useSearchStore();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<Listing | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    if (alert && open) {
      loadListings(alert.id);
    }
  }, [alert, open]);

  const loadListings = async (alertId: string) => {
    setIsLoading(true);
    try {
      const res = await getAlertListings(alertId);
      setListings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenInSearch = () => {
    if (!alert) return;
    setKeyword(alert.keyword);
    setLocation(alert.location || 'Jakarta');
    setPriceRange(undefined, alert.max_price);
    onOpenChange(false);
    router.push('/');
  };

  if (!alert) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-card border border-border rounded-2xl max-h-[85vh] flex flex-col shadow-2xl">
          {/* Header */}
          <DialogHeader className="p-5 border-b border-border bg-card flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-secondary text-foreground flex items-center justify-center">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-foreground">
                    Iklan Terdeteksi: “{alert.keyword}”
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Target &le; <strong className="text-foreground">{formatRupiah(alert.max_price)}</strong> di <strong className="text-foreground">{alert.location || 'Jakarta'}</strong> · Dideteksi <strong className="text-foreground">{alert.trigger_count}x</strong>
                  </DialogDescription>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenInSearch}
                className="hidden sm:inline-flex items-center gap-1 px-3 h-8 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium transition-colors shrink-0"
              >
                <span>Buka di Feed</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </DialogHeader>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-background">
            {isLoading ? (
              <div className="py-16 text-center space-y-2">
                <RefreshCw className="h-5 w-5 text-foreground animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">Memuat daftar iklan...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="py-16 text-center space-y-2 max-w-sm mx-auto">
                <div className="h-10 w-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
                  <Tag className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">Belum Ada Iklan di Database</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Robot scanner terus memantau FB Marketplace di background. Saat iklan &le; {formatRupiah(alert.max_price)} muncul, datanya akan langsung dicatat di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground px-1 pb-1">
                  {listings.length} iklan yang memenuhi kriteria:
                </div>

                {listings.map((item) => {
                  const images = parseImages(item.images);
                  const thumb = images[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=300&q=80';

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedDetail(item);
                        setDetailModalOpen(true);
                      }}
                      className="p-3.5 rounded-xl border border-border bg-card hover:border-black/[0.18] dark:hover:border-white/[0.22] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <img
                          src={thumb}
                          alt={item.title}
                          className="h-14 w-14 rounded-lg object-cover bg-secondary shrink-0 border border-border/60"
                        />

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-base font-semibold text-foreground tabular-price">
                              {formatRupiah(item.price)}
                            </span>
                            {item.market_avg_price > 0 && item.discount_percent > 5 && (
                              <span className="text-[11px] text-muted-foreground line-through tabular-price">
                                {formatRupiah(item.market_avg_price)}
                              </span>
                            )}
                            <DealBadge
                              rating={item.deal_rating}
                              discount={item.discount_percent}
                            />
                          </div>

                          <h4 className="text-sm font-medium text-foreground truncate group-hover:underline">
                            {item.title}
                          </h4>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{item.location || 'Indonesia'}</span>
                            </div>
                            <span>·</span>
                            <span>{formatTimeAgo(item.listed_at || item.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={item.fb_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-3 rounded-xl bg-foreground text-background text-xs font-semibold flex items-center gap-1 hover:opacity-90 transition-opacity"
                        >
                          <span>Buka FB</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ListingDetailModal
        listing={selectedDetail}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </>
  );
}
