'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Send, CheckCircle2 } from 'lucide-react';
import { createAlert, getTelegramStatus } from '@/lib/api';
import { LocationMapPicker } from './location-map-picker';

interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultKeyword?: string;
  defaultLocation?: string;
  defaultMaxPrice?: number;
  onAlertCreated?: () => void;
  onOpenTelegramSettings?: () => void;
}

export function AlertModal({
  open,
  onOpenChange,
  defaultKeyword = '',
  defaultLocation = 'Jakarta',
  defaultMaxPrice = 0,
  onAlertCreated,
  onOpenTelegramSettings,
}: AlertModalProps) {
  const [keyword, setKeyword] = useState(defaultKeyword);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [location, setLocation] = useState(defaultLocation);
  const [radiusKm, setRadiusKm] = useState(50);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);

  useEffect(() => {
    if (open) {
      setKeyword(defaultKeyword);
      setLocation(defaultLocation);
      setMaxPrice(defaultMaxPrice);
      setSuccess(false);
      getTelegramStatus().then((res) => {
        setTelegramConnected(res.connected);
      }).catch(() => {});
    }
  }, [open, defaultKeyword, defaultLocation, defaultMaxPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    try {
      await createAlert({
        keyword: keyword.trim(),
        max_price: Number(maxPrice),
        location: location.trim(),
        radius_km: radiusKm,
        category: 'Semua',
      });
      setSuccess(true);
      onAlertCreated?.();
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-2xl p-5 sm:p-6 rounded-2xl border border-[#E5E5E5] dark:border-[#303030] bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 pb-3 border-b border-[#E5E5E5] dark:border-[#303030]">
          <div>
            <DialogTitle className="text-base font-bold text-foreground">Pasang Price Alert Baru</DialogTitle>
            <DialogDescription className="text-xs text-[#606060] dark:text-[#AAAAAA]">
              Robot scanner memantau Facebook Marketplace otomatis setiap 2 menit.
            </DialogDescription>
          </div>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-[#31A24C] mx-auto" />
            <h3 className="font-bold text-base text-foreground">Alert Berhasil Dibuat!</h3>
            <p className="text-xs text-[#606060] dark:text-[#AAAAAA]">
              Monitor otomatis untuk “{keyword}” telah aktif di area {location} (Radius {radiusKm}km).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Kata Kunci Barang</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Contoh: iPhone 13, Monitor A24i"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#303030] text-foreground text-xs focus:outline-none focus:border-[#FF0000]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Harga Maksimal (Rp)</label>
                <input
                  type="number"
                  value={maxPrice === 0 ? '' : maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="0"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#303030] text-foreground text-xs tabular-price focus:outline-none focus:border-[#FF0000]"
                />
              </div>
            </div>

            {/* Interactive Map & Radius Picker */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-foreground">
                Pilih Titik Lokasi & Radius Pantauan di Peta
              </label>
              <LocationMapPicker
                initialLocation={location}
                initialRadiusKm={radiusKm}
                onChange={(loc, rad) => {
                  setLocation(loc);
                  setRadiusKm(rad);
                }}
              />
            </div>

            {/* Telegram Notice */}
            <div className="p-3 rounded-xl bg-[#F2F2F2] dark:bg-[#272727] border border-[#E5E5E5] dark:border-[#303030] text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-foreground">
                <Send className={`h-4 w-4 ${telegramConnected ? 'text-[#31A24C]' : 'text-[#606060]'}`} />
                <span>
                  {telegramConnected ? 'Notifikasi Telegram aktif' : 'Telegram belum terhubung'}
                </span>
              </div>
              {!telegramConnected && onOpenTelegramSettings && (
                <button
                  type="button"
                  onClick={onOpenTelegramSettings}
                  className="text-xs font-bold text-[#FF0000] hover:underline shrink-0 cursor-pointer"
                >
                  Hubungkan
                </button>
              )}
            </div>

            <DialogFooter className="pt-2 flex flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 h-9 rounded-full border border-[#CCCCCC] dark:border-[#303030] bg-[#F2F2F2] dark:bg-[#272727] hover:bg-[#E5E5E5] text-foreground text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 h-9 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
              >
                {loading ? 'Menyimpan...' : 'Aktifkan Alert'}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
