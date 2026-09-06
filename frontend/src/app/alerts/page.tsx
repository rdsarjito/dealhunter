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
import { formatRupiah, formatTimeAgo, getSellerAvatar } from '@/lib/format';
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
  RefreshCw,
  MoreVertical
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';


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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
    getTelegramStatus().then((res) => setTelegramConnected(res.connected)).catch(() => {});
    getFacebookStatus().then((res) => setFacebookConnected(res.is_connected)).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 sm:gap-x-5 gap-y-7 sm:gap-y-8 w-full">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-video w-full rounded-xl sm:rounded-2xl bg-[#E5E5E5] dark:bg-[#272727] animate-pulse" />
                    <div className="flex gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#E5E5E5] dark:bg-[#272727] shrink-0 animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-[#E5E5E5] dark:bg-[#272727] rounded w-5/6 animate-pulse" />
                        <div className="h-3 bg-[#E5E5E5] dark:bg-[#272727] rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  </div>
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

            {/* Alerts List - Exact YouTube Grid Style */}
            {!isLoading && alerts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 sm:gap-x-5 gap-y-7 sm:gap-y-8 w-full pb-12">
                {alerts.map((a) => {
                  const isMenuOpen = openMenuId === a.id;
                  const displayTitle = `Pantauan: “${a.keyword}”`;
                  const sellerName = a.seller_name || 'Penjual Facebook';

                  return (
                    <div
                      key={a.id}
                      className="group flex flex-col cursor-pointer select-none relative"
                      onClick={() => setActiveWatchAlert(a)}
                    >
                      {/* 16:9 Video-Style Thumbnail */}
                      <div className="relative aspect-video w-full rounded-xl sm:rounded-2xl bg-[#1F1F1F] dark:bg-[#181818] overflow-hidden shadow-2xs">
                        {a.thumbnail_url ? (
                          <img
                            src={a.thumbnail_url}
                            alt={a.keyword}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-[#2B1414] via-[#1A1A1A] to-[#111111] text-white select-none">
                            <div className="h-10 w-10 rounded-full bg-[#FF0000]/20 flex items-center justify-center text-[#FF0000] mb-2 animate-pulse">
                              <Radio className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-center text-white/90 truncate max-w-full px-2">
                              {a.keyword}
                            </span>
                            <span className="text-[10px] text-white/60">
                              {a.location || 'Jakarta'}
                            </span>
                          </div>
                        )}

                        {/* Hover Play Button Overlay (YouTube style) */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[0.5px]">
                          <div className="h-11 w-11 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                            <Play className="h-5 w-5 fill-white ml-0.5" />
                          </div>
                        </div>

                        {/* Bottom Right: Duration Badge (YouTube Black Pill) */}
                        <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-black/85 text-white backdrop-blur-xs tracking-tight">
                            {(a.match_count && a.match_count > 0) ? `${a.match_count} IKLAN` : '0 IKLAN'}
                          </span>
                        </div>
                      </div>

                      {/* Info Row: Avatar + Details + Three Dots */}
                      <div className="flex items-start gap-3 pt-3">
                        {/* Circular Seller Avatar */}
                        <div 
                          className="relative h-9 w-9 rounded-full overflow-hidden bg-[#E5E5E5] dark:bg-[#272727] shrink-0 mt-0.5 ring-1 ring-border/20"
                          title={sellerName}
                        >
                          <img
                            src={getSellerAvatar(sellerName)}
                            alt={sellerName}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Title & Channel & Meta */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          {/* Title */}
                          <h3 
                            className="font-semibold text-sm sm:text-[15px] text-[#0F0F0F] dark:text-[#F1F1F1] line-clamp-2 leading-snug group-hover:text-foreground/90 transition-colors"
                            title={displayTitle}
                          >
                            {displayTitle}
                          </h3>

                          {/* Channel / Seller Name + Verified Badge */}
                          <div className="flex items-center gap-1 text-xs text-[#606060] dark:text-[#AAAAAA] hover:text-[#0F0F0F] dark:hover:text-[#F1F1F1] transition-colors pt-0.5">
                            <span className="truncate max-w-[180px] sm:max-w-[220px]">
                              {sellerName}
                            </span>
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-[#606060] dark:fill-[#AAAAAA] shrink-0" aria-hidden="true">
                              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM9.8 17.3l-4.2-4.1 1.4-1.4 2.8 2.7 7.4-7.4 1.4 1.4-8.8 8.8z" />
                            </svg>
                          </div>

                          {/* Meta: Price / Count / Time */}
                          <div className="text-xs text-[#606060] dark:text-[#AAAAAA] flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-foreground/85">Maks. {formatRupiah(a.max_price)}</span>
                            <span>•</span>
                            <span>{(a.match_count && a.match_count > 0) ? `${a.match_count} iklan` : '0 iklan'}</span>
                            <span>•</span>
                            <span>{a.last_scanned_at ? formatTimeAgo(a.last_scanned_at) : 'Baru saja'}</span>
                          </div>
                        </div>

                        {/* Three Dots Button (YouTube More Menu) */}
                        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(isMenuOpen ? null : a.id)}
                            className="h-8 w-8 rounded-full flex items-center justify-center text-[#606060] dark:text-[#AAAAAA] hover:text-[#0F0F0F] dark:hover:text-white hover:bg-[#0000000F] dark:hover:bg-[#FFFFFF1A] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Opsi lainnya"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {/* YouTube Popover Dropdown Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 z-30 w-52 py-1.5 rounded-xl bg-[#FFFFFF] dark:bg-[#282828] shadow-2xl border border-[#0000001A] dark:border-[#FFFFFF1A] text-xs font-medium text-foreground divide-y divide-[#0000000D] dark:divide-[#FFFFFF14]">
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setActiveWatchAlert(a);
                                  }}
                                  className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-[#0000000A] dark:hover:bg-[#FFFFFF14] transition-colors text-left cursor-pointer"
                                >
                                  <Play className="h-3.5 w-3.5 fill-current text-[#FF0000]" />
                                  <span>Tonton Iklan ({a.match_count || 0})</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    setOpenMenuId(null);
                                    handleScanSingle(a.id, e);
                                  }}
                                  disabled={scanningAlertId === a.id}
                                  className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-[#0000000A] dark:hover:bg-[#FFFFFF14] transition-colors text-left cursor-pointer disabled:opacity-50"
                                >
                                  <RefreshCw className={`h-3.5 w-3.5 ${scanningAlertId === a.id ? 'animate-spin text-[#FF0000]' : ''}`} />
                                  <span>{scanningAlertId === a.id ? 'Sedang Memindai...' : 'Pindai Sekarang'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    setOpenMenuId(null);
                                    handleEditAlert(a, e);
                                  }}
                                  className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-[#0000000A] dark:hover:bg-[#FFFFFF14] transition-colors text-left cursor-pointer"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>Edit Alert</span>
                                </button>
                              </div>

                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleToggle(a.id, a.is_active);
                                  }}
                                  className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-[#0000000A] dark:hover:bg-[#FFFFFF14] transition-colors text-left cursor-pointer"
                                >
                                  <span className="flex items-center gap-2.5">
                                    <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>Status Pantauan</span>
                                  </span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    a.is_active 
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                      : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {a.is_active ? 'AKTIF' : 'MATI'}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleDelete(a.id);
                                  }}
                                  className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors text-left cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Hapus Alert</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
