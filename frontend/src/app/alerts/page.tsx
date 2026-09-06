'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { YouTubeSidebar } from '@/components/layout/youtube-sidebar';
import { YouTubeBottomNav } from '@/components/layout/youtube-bottom-nav';
import { AlertModal } from '@/components/alerts/alert-modal';
import { AlertWatchPage } from '@/components/alerts/alert-watch-page';
import { TelegramSettingsModal } from '@/components/telegram/telegram-settings-modal';
import { FacebookSessionModal } from '@/components/facebook/facebook-session-modal';
import { 
  getAlerts, 
  toggleAlert, 
  deleteAlert, 
  scanSingleAlert,
  getTelegramStatus, 
  getFacebookStatus 
} from '@/lib/api';
import { PriceAlert } from '@/types';
import { formatRupiah, formatTimeAgo } from '@/lib/format';
import { 
  Bell,
  Radio, 
  Plus, 
  Trash2, 
  Pencil,
  MapPin, 
  Clock, 
  Play, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';


const AVATAR_POOL = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
];

function getSellerAvatar(name?: string): string {
  if (!name) return AVATAR_POOL[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_POOL.length;
  return AVATAR_POOL[idx];
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);
  const [scanningAlertId, setScanningAlertId] = useState<string | null>(null);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [facebookOpen, setFacebookOpen] = useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [activeWatchAlert, setActiveWatchAlert] = useState<PriceAlert | null>(null);

  useEffect(() => {
    loadAlerts();
    getTelegramStatus().then((res) => setTelegramConnected(res.connected)).catch(() => {});
    getFacebookStatus().then((res) => setFacebookConnected(res.is_connected)).catch(() => {});
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAlert = () => {
    setEditingAlert(null);
    setAlertModalOpen(true);
  };

  const handleEditAlert = (alert: PriceAlert, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingAlert(alert);
    setAlertModalOpen(true);
  };

  const handleScanSingle = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScanningAlertId(id);
    try {
      await scanSingleAlert(id);
      setTimeout(() => {
        loadAlerts();
        setScanningAlertId(null);
      }, 2500);
    } catch (err) {
      console.error(err);
      setScanningAlertId(null);
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await toggleAlert(id, !currentActive);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: !currentActive } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      if (activeWatchAlert?.id === id) {
        setActiveWatchAlert(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-14 md:pb-0 w-full">
      <Navbar
        onOpenTelegram={() => setTelegramOpen(true)}
        telegramConnected={telegramConnected}
        onOpenFacebook={() => setFacebookOpen(true)}
        facebookConnected={facebookConnected}
        onOpenAlertModal={handleCreateAlert}
      />

      <div className="flex-1 flex flex-row w-full min-h-[calc(100vh-56px)]">
        <YouTubeSidebar
          onOpenTelegram={() => setTelegramOpen(true)}
          telegramConnected={telegramConnected}
          onOpenFacebook={() => setFacebookOpen(true)}
          facebookConnected={facebookConnected}
        />

        <main className="flex-1 min-w-0 px-4 sm:px-6 py-4 space-y-4 overflow-y-auto">
        {activeWatchAlert ? (
          <AlertWatchPage
            alert={activeWatchAlert}
            onBack={() => setActiveWatchAlert(null)}
          />
        ) : (
          <div className="space-y-4 w-full">
            {/* Loading */}
            {isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 w-full">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-44 w-full rounded-2xl bg-[#F2F2F2] dark:bg-[#272727] animate-pulse" />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && alerts.length === 0 && (
              <div className="py-20 px-4 text-center rounded-xl border border-dashed border-[#E5E5E5] dark:border-[#303030] bg-card/40 max-w-md mx-auto space-y-3.5">
                <div className="h-12 w-12 rounded-full bg-[#F2F2F2] dark:bg-[#272727] text-muted-foreground flex items-center justify-center mx-auto">
                  <Bell className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">Belum Ada Alert Aktif</h3>
                  <p className="text-xs text-[#606060] dark:text-[#AAAAAA] leading-relaxed">
                    Pasang alert untuk barang incaran Anda (misal: Monitor &le; 500k, PlayStation 5 &le; 5.5jt) dan atur frekuensi scraping-nya secara fleksibel.
                  </p>
                </div>
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={handleCreateAlert}
                    className="px-4 h-9 rounded-full bg-[#FF0000] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#CC0000] cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Pasang Alert Sekarang</span>
                  </button>
                </div>
              </div>
            )}

            {/* Alerts List - 2 Cards Per Row (YouTube Horizontal Style) */}
            {!isLoading && alerts.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 w-full pb-10">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setActiveWatchAlert(a)}
                    className="group relative flex flex-col sm:flex-row gap-3.5 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-card hover:bg-[#00000006] dark:hover:bg-[#FFFFFF0D] border border-[#0000000D] dark:border-[#FFFFFF14] hover:border-[#0000001F] dark:hover:border-[#FFFFFF26] transition-all cursor-pointer shadow-2xs"
                  >
                    {/* Left: 16:9 Video-Style Thumbnail */}
                    <div className="relative aspect-video w-full sm:w-44 md:w-48 lg:w-52 shrink-0 rounded-xl bg-[#1F1F1F] dark:bg-[#181818] overflow-hidden shadow-xs">
                      {a.thumbnail_url ? (
                        <img
                          src={a.thumbnail_url}
                          alt={a.keyword}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-[#2B1414] via-[#1A1A1A] to-[#111111] text-white select-none">
                          <div className="h-8 w-8 rounded-full bg-[#FF0000]/20 flex items-center justify-center text-[#FF0000] mb-1.5 animate-pulse">
                            <Radio className="h-4 w-4" />
                          </div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-center text-white/90 truncate max-w-full px-2">
                            {a.keyword}
                          </span>
                          <span className="text-[9px] text-white/60">
                            {a.location || 'Jakarta'}
                          </span>
                        </div>
                      )}

                      {/* Hover Play Button Overlay (YouTube style) */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                        <div className="h-10 w-10 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                          <Play className="h-4 w-4 fill-white ml-0.5" />
                        </div>
                      </div>


                      {/* Bottom Right: Duration Badge (YouTube Black Pill with count) */}
                      <div className="absolute bottom-2 right-2 z-10">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/85 text-white backdrop-blur-xs flex items-center gap-1">
                          <span>{(a.match_count && a.match_count > 0) ? `${a.match_count} IKLAN` : '0 IKLAN'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Right: Info & Actions Column */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                      <div>
                        {/* Title & Price */}
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-[#FF0000] transition-colors truncate leading-snug" title={a.keyword}>
                            Pantauan: “{a.keyword}”
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs sm:text-sm font-extrabold text-[#FF0000] tabular-price">
                              Maks. {formatRupiah(a.max_price)}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#0000000A] dark:bg-[#FFFFFF14] text-foreground flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5 text-[#FF0000]" />
                              Tiap {a.interval_minutes || 5} mnt
                            </span>
                          </div>
                        </div>

                        {/* Meta Seller Row */}
                        <div className="flex items-center gap-1.5 text-[11px] text-[#606060] dark:text-[#AAAAAA] mt-1.5 flex-wrap">
                          <div 
                            className="relative h-4.5 w-4.5 rounded-full overflow-hidden bg-[#E5E5E5] dark:bg-[#272727] shrink-0 ring-1 ring-border/20"
                            title={a.seller_name || 'Penjual FB Marketplace'}
                          >
                            <img
                              src={getSellerAvatar(a.seller_name)}
                              alt={a.seller_name || 'Penjual'}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <span className="font-semibold text-foreground/90 truncate max-w-[160px] sm:max-w-[220px]" title={a.seller_name || 'Penjual FB Marketplace'}>
                            {a.seller_name || 'Penjual FB Marketplace'}
                          </span>
                          <span>•</span>
                          <div className="flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5 text-[#FF0000]" />
                            <span>{a.location || 'Jakarta'} ({a.radius_km || 50}km)</span>
                          </div>
                          <span>•</span>
                          <span className="truncate">{a.last_scanned_at ? formatTimeAgo(a.last_scanned_at) : 'Baru dipasang'}</span>
                        </div>

                        {/* Snippet caught item */}
                        <div className="mt-2">
                          {(a.match_count && a.match_count > 0) ? (
                            <div className="text-[11px] text-foreground/90 bg-[#00000005] dark:bg-[#FFFFFF08] p-2 rounded-lg border border-[#0000000A] dark:border-[#FFFFFF0D] flex items-start gap-1.5">
                              <div className="min-w-0 flex-1 truncate">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 mr-1">
                                  {a.match_count} baru:
                                </span>
                                <span className="text-[#606060] dark:text-[#AAAAAA]">
                                  {a.last_matched_item || 'Iklan sesuai kriteria'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-[#606060] dark:text-[#AAAAAA] flex items-center gap-1.5 py-0.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                              <span className="truncate">Memantau harga pasar &le; {formatRupiah(a.max_price)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="flex items-center gap-1.5 pt-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setActiveWatchAlert(a)}
                          className="h-7 sm:h-8 px-3 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <Play className="h-3 w-3 fill-white" />
                          <span>Tonton ({a.match_count || 0})</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleScanSingle(a.id, e)}
                          disabled={scanningAlertId === a.id}
                          className="h-7 sm:h-8 px-2.5 rounded-full bg-[#0000000D] dark:bg-[#FFFFFF14] hover:bg-[#0000001A] dark:hover:bg-[#FFFFFF26] text-foreground text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          title={`Picu scraping kata kunci "${a.keyword}" sekarang`}
                        >
                          <RefreshCw className={`h-3 w-3 ${scanningAlertId === a.id ? 'animate-spin text-[#FF0000]' : ''}`} />
                          <span className="hidden sm:inline">{scanningAlertId === a.id ? 'Memindai...' : 'Pindai'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleEditAlert(a, e)}
                          className="h-7 sm:h-8 px-2.5 rounded-full bg-[#0000000D] dark:bg-[#FFFFFF14] hover:bg-[#0000001A] dark:hover:bg-[#FFFFFF26] text-foreground text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Edit alert & waktu scraping"
                        >
                          <Pencil className="h-3 w-3" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <div className="flex items-center px-1.5 h-7 sm:h-8 rounded-full bg-[#00000008] dark:bg-[#FFFFFF0D]" title={a.is_active ? 'Alert Aktif' : 'Alert Nonaktif'}>
                          <Switch
                            checked={a.is_active}
                            onCheckedChange={() => handleToggle(a.id, a.is_active)}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(a.id)}
                          className="h-7 sm:h-8 w-7 sm:w-8 rounded-full bg-[#0000000D] dark:bg-[#FFFFFF14] hover:bg-[#FFE5E5] hover:text-[#CC0000] text-[#606060] dark:text-[#AAAAAA] flex items-center justify-center transition-colors cursor-pointer ml-auto"
                          title="Hapus alert"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </main>
      </div>

      <YouTubeBottomNav />

      <AlertModal
        open={alertModalOpen}
        onOpenChange={(val) => {
          setAlertModalOpen(val);
          if (!val) setEditingAlert(null);
        }}
        alertToEdit={editingAlert}
        onAlertSaved={loadAlerts}
        onOpenTelegramSettings={() => setTelegramOpen(true)}
      />

      <TelegramSettingsModal
        open={telegramOpen}
        onOpenChange={setTelegramOpen}
        onConnectedSuccess={() => setTelegramConnected(true)}
        isConnected={telegramConnected}
      />

      <FacebookSessionModal
        open={facebookOpen}
        onOpenChange={setFacebookOpen}
        onConnectedSuccess={() => setFacebookConnected(true)}
      />
    </div>
  );
}
