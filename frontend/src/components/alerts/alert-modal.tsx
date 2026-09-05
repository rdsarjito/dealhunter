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
import { Send, CheckCircle2, Clock, Zap } from 'lucide-react';
import { createAlert, updateAlert, getTelegramStatus } from '@/lib/api';
import { LocationMapPicker } from './location-map-picker';
import { PriceAlert } from '@/types';

interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alertToEdit?: PriceAlert | null;
  defaultKeyword?: string;
  defaultLocation?: string;
  defaultMaxPrice?: number;
  defaultInterval?: number;
  onAlertCreated?: () => void;
  onAlertSaved?: () => void;
  onOpenTelegramSettings?: () => void;
}

const INTERVAL_PRESETS = [
  { value: 2, label: '2 Menit', badge: 'Kilat' },
  { value: 5, label: '5 Menit', badge: 'Rekomendasi' },
  { value: 10, label: '10 Menit' },
  { value: 15, label: '15 Menit' },
  { value: 30, label: '30 Menit' },
  { value: 60, label: '1 Jam' },
];

export function AlertModal({
  open,
  onOpenChange,
  alertToEdit,
  defaultKeyword = '',
  defaultLocation = 'Jakarta',
  defaultMaxPrice = 0,
  defaultInterval = 5,
  onAlertCreated,
  onAlertSaved,
  onOpenTelegramSettings,
}: AlertModalProps) {
  const isEditMode = Boolean(alertToEdit);

  const [keyword, setKeyword] = useState(defaultKeyword);
  const [maxPrice, setMaxPrice] = useState<number>(defaultMaxPrice);
  const [location, setLocation] = useState(defaultLocation);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -6.2464309,
    lng: 106.7707263,
  });
  const [radiusKm, setRadiusKm] = useState(50);
  const [intervalMinutes, setIntervalMinutes] = useState<number>(defaultInterval);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);

  useEffect(() => {
    if (open) {
      if (alertToEdit) {
        setKeyword(alertToEdit.keyword || '');
        setMaxPrice(alertToEdit.max_price || 0);
        setLocation(alertToEdit.location || 'Jakarta');
        setRadiusKm(alertToEdit.radius_km || 50);
        setIntervalMinutes(alertToEdit.interval_minutes && alertToEdit.interval_minutes > 0 ? alertToEdit.interval_minutes : 5);
        if (alertToEdit.latitude && alertToEdit.longitude) {
          setCoords({ lat: alertToEdit.latitude, lng: alertToEdit.longitude });
        }
      } else {
        setKeyword(defaultKeyword);
        setLocation(defaultLocation);
        setMaxPrice(defaultMaxPrice);
        setIntervalMinutes(defaultInterval || 5);
      }
      setSuccess(false);
      getTelegramStatus().then((res) => {
        setTelegramConnected(res.connected);
      }).catch(() => {});
    }
  }, [open, alertToEdit, defaultKeyword, defaultLocation, defaultMaxPrice, defaultInterval]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    try {
      const validInterval = Math.max(1, Number(intervalMinutes) || 5);
      if (isEditMode && alertToEdit) {
        await updateAlert(alertToEdit.id, {
          keyword: keyword.trim(),
          max_price: Number(maxPrice),
          location: location.trim(),
          latitude: coords.lat,
          longitude: coords.lng,
          radius_km: radiusKm,
          interval_minutes: validInterval,
          category: alertToEdit.category || 'Semua',
        });
      } else {
        await createAlert({
          keyword: keyword.trim(),
          max_price: Number(maxPrice),
          location: location.trim(),
          latitude: coords.lat,
          longitude: coords.lng,
          radius_km: radiusKm,
          interval_minutes: validInterval,
          category: 'Semua',
        });
      }

      setSuccess(true);
      onAlertCreated?.();
      onAlertSaved?.();
      setTimeout(() => {
        onOpenChange(false);
      }, 1200);
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
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <span>{isEditMode ? 'Edit Pengaturan Alert & Waktu Scraping' : 'Pasang Price Alert Baru'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#606060] dark:text-[#AAAAAA]">
              {isEditMode 
                ? 'Ubah kata kunci, batas harga, titik lokasi, dan frekuensi waktu scraping untuk alert ini.'
                : 'Atur kata kunci, harga maksimal, lokasi, dan seberapa sering robot memindai Facebook Marketplace.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-[#31A24C] mx-auto" />
            <h3 className="font-bold text-base text-foreground">
              {isEditMode ? 'Perubahan Alert Berhasil Disimpan!' : 'Alert Berhasil Dibuat!'}
            </h3>
            <p className="text-xs text-[#606060] dark:text-[#AAAAAA]">
              Pemindaian otomatis untuk “{keyword}” berjalan setiap {intervalMinutes} menit di area {location} (Radius {radiusKm}km).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Keyword and Max Price */}
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

            {/* Waktu Scraping / Interval Picker (Requested Feature) */}
            <div className="p-3.5 rounded-xl bg-[#F9F9F9] dark:bg-[#181818] border border-[#E5E5E5] dark:border-[#303030] space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Clock className="h-4 w-4 text-[#FF0000]" />
                  <span>Waktu Scraping Otomatis (Interval Patroli)</span>
                </div>
                <span className="text-[11px] text-[#606060] dark:text-[#AAAAAA]">
                  Patroli tiap <strong className="text-foreground">{intervalMinutes} menit</strong>
                </span>
              </div>

              {/* Preset Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {INTERVAL_PRESETS.map((preset) => {
                  const isSelected = intervalMinutes === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setIntervalMinutes(preset.value)}
                      className={`h-7 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0F0F0F] text-white dark:bg-[#F1F1F1] dark:text-[#0F0F0F] font-bold shadow-xs'
                          : 'bg-[#0000000D] dark:bg-[#FFFFFF14] hover:bg-[#0000001A] dark:hover:bg-[#FFFFFF26] text-foreground font-medium'
                      }`}
                    >
                      <span>{preset.label}</span>
                      {preset.badge && (
                        <span className={`text-[10px] px-1 py-0.2 rounded font-extrabold uppercase ${
                          isSelected ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' : 'text-[#FF0000]'
                        }`}>
                          {preset.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Number Input */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#E5E5E5] dark:border-[#272727]">
                <label className="text-xs text-[#606060] dark:text-[#AAAAAA] whitespace-nowrap">
                  Atau kustom waktu:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={intervalMinutes || ''}
                    onChange={(e) => setIntervalMinutes(Math.max(1, Number(e.target.value)))}
                    className="w-20 h-8 px-2.5 rounded-lg bg-white dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#303030] text-foreground text-xs font-bold text-center focus:outline-none focus:border-[#FF0000]"
                  />
                  <span className="text-xs font-semibold text-foreground">Menit sekali</span>
                </div>
                <p className="text-[11px] text-[#606060] dark:text-[#AAAAAA] ml-auto hidden sm:block">
                  (Min. 1 menit, maks. 1440 menit / 24 jam)
                </p>
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
                onChange={(loc, rad, lat, lng) => {
                  setLocation(loc);
                  setRadiusKm(rad);
                  if (lat !== undefined && lng !== undefined) {
                    setCoords({ lat, lng });
                  }
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
                className="px-4 h-9 rounded-full border border-[#CCCCCC] dark:border-[#303030] bg-[#F2F2F2] dark:bg-[#272727] hover:bg-[#E5E5E5] text-foreground text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 h-9 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {loading ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 fill-white" />
                    <span>{isEditMode ? 'Simpan Perubahan' : 'Aktifkan Alert'}</span>
                  </>
                )}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
