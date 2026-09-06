'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  BellOff,
  Radio, 
  Plus, 
  Trash2, 
  Pencil,
  Play, 
  RefreshCw,
  MoreVertical
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

function AlertsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentAlertId = searchParams.get('id');

  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);
  const [scanningAlertId, setScanningAlertId] = useState<string | null>(null);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [facebookOpen, setFacebookOpen] = useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Directly derive activeWatchAlert from URL param: id
  const activeWatchAlert = currentAlertId
    ? alerts.find((a) => a.id === currentAlertId) || null
    : null;

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

  const handleOpenWatch = (a: PriceAlert) => {
    router.push(`/alerts?id=${a.id}`);
  };

  const handleBackFromWatch = () => {
    router.push('/alerts');
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
      if (currentAlertId === id) {
        handleBackFromWatch();
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
        {currentAlertId && activeWatchAlert ? (
          <AlertWatchPage
            alert={activeWatchAlert}
            onBack={handleBackFromWatch}
          />
        ) : currentAlertId && isLoading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-[#FF0000] animate-spin mx-auto" />
            <h3 className="text-base font-bold text-foreground">Memuat detail alert...</h3>
          </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 sm:gap-x-5 gap-y-7 sm:gap-y-8 w-full">
                {alerts.map((a) => {
                  const isMenuOpen = openMenuId === a.id;
                  const displayTitle = a.keyword;

                  return (
                    <div
                      key={a.id}
                      className="group flex flex-col cursor-pointer select-none relative p-2.5 -m-2.5 rounded-2xl transition-colors duration-150 hover:bg-[#F2F2F2] dark:hover:bg-[#272727]"
                      onClick={() => handleOpenWatch(a)}
                    >
                      {/* 16:9 Video-Style Thumbnail */}
                      <div className="relative aspect-video w-full rounded-xl bg-[#1F1F1F] dark:bg-[#181818] overflow-hidden">
                        {a.thumbnail_url ? (
                          <img
                            src={a.thumbnail_url}
                            alt={a.keyword}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
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

                        {/* Bottom Right: Duration Badge (YouTube Black Pill) */}
                        <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-black/85 text-white backdrop-blur-xs tracking-tight">
                            {(a.match_count && a.match_count > 0) ? `${a.match_count} IKLAN` : '0 IKLAN'}
                          </span>
                        </div>
                      </div>

                      {/* Info Row: Title & Meta + Three Dots */}
                      <div className="flex items-start justify-between gap-2.5 pt-2.5">
                        {/* Title & Meta */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Title */}
                          <h3 
                            className="font-semibold text-sm sm:text-base text-[#0F0F0F] dark:text-[#F1F1F1] line-clamp-2 leading-snug group-hover:text-foreground/90 transition-colors"
                            title={displayTitle}
                          >
                            {displayTitle}
                          </h3>

                          {/* Meta: Price / Count / Time */}
                          <div className="text-xs text-[#606060] dark:text-[#AAAAAA] flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-foreground/85">
                              {a.min_price !== undefined && a.min_price !== null
                                ? `${formatRupiah(a.min_price)} - ${formatRupiah(a.max_price)}` 
                                : formatRupiah(a.max_price)
                              }
                            </span>
                            <span className="inline-block w-1 h-1 rounded-full bg-current opacity-50 shrink-0" />
                            <span>{(a.match_count && a.match_count > 0) ? `${a.match_count} iklan` : '0 iklan'}</span>
                            <span className="inline-block w-1 h-1 rounded-full bg-current opacity-50 shrink-0" />
                            <span>{a.last_scanned_at ? formatTimeAgo(a.last_scanned_at) : 'Baru saja'}</span>
                          </div>
                        </div>

                        {/* Three Dots Button (YouTube More Menu) */}
                        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(isMenuOpen ? null : a.id)}
                            className="h-9 w-9 rounded-full flex items-center justify-center text-[#0F0F0F] dark:text-[#F1F1F1] hover:bg-[#00000010] dark:hover:bg-[#FFFFFF1A] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Opsi lainnya"
                          >
                            <MoreVertical className="h-5 w-5 stroke-[1.5]" />
                          </button>

                          {/* YouTube Popover Dropdown Menu */}
                          {isMenuOpen && (
                            <div 
                              className="absolute right-0 top-full mt-1.5 z-40 w-[260px] rounded-xl bg-white dark:bg-[#282828] shadow-[0_4px_32px_0_rgba(0,0,0,0.14)] dark:border dark:border-[#FFFFFF1A] dark:shadow-2xl overflow-hidden py-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleOpenWatch(a);
                                }}
                                className="w-full px-4 py-2.5 first:pt-3.5 last:pb-3.5 flex items-center gap-4 hover:bg-[#F2F2F2] dark:hover:bg-[#383838] transition-colors text-left cursor-pointer"
                              >
                                <Play className="h-5 w-5 stroke-[1.5] text-[#0F0F0F] dark:text-[#F1F1F1] shrink-0" />
                                <span className="text-sm font-normal text-[#0F0F0F] dark:text-[#F1F1F1]">
                                  Lihat Iklan ({(a.match_count && a.match_count > 0) ? a.match_count : 0})
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  setOpenMenuId(null);
                                  handleScanSingle(a.id, e);
                                }}
                                disabled={scanningAlertId === a.id}
                                className="w-full px-4 py-2.5 first:pt-3.5 last:pb-3.5 flex items-center gap-4 hover:bg-[#F2F2F2] dark:hover:bg-[#383838] transition-colors text-left cursor-pointer disabled:opacity-50"
                              >
                                <RefreshCw className={`h-5 w-5 stroke-[1.5] text-[#0F0F0F] dark:text-[#F1F1F1] shrink-0 ${
                                  scanningAlertId === a.id ? 'animate-spin text-[#FF0000]' : ''
                                }`} />
                                <span className="text-sm font-normal text-[#0F0F0F] dark:text-[#F1F1F1]">
                                  {scanningAlertId === a.id ? 'Memindai Marketplace...' : 'Pindai Sekarang'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  setOpenMenuId(null);
                                  handleEditAlert(a, e);
                                }}
                                className="w-full px-4 py-2.5 first:pt-3.5 last:pb-3.5 flex items-center gap-4 hover:bg-[#F2F2F2] dark:hover:bg-[#383838] transition-colors text-left cursor-pointer"
                              >
                                <Pencil className="h-5 w-5 stroke-[1.5] text-[#0F0F0F] dark:text-[#F1F1F1] shrink-0" />
                                <span className="text-sm font-normal text-[#0F0F0F] dark:text-[#F1F1F1]">
                                  Edit Target Harga
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                  handleToggle(a.id, a.is_active);
                                }}
                                className="w-full px-4 py-2.5 first:pt-3.5 last:pb-3.5 flex items-center gap-4 hover:bg-[#F2F2F2] dark:hover:bg-[#383838] transition-colors text-left cursor-pointer"
                              >
                                {a.is_active ? (
                                  <BellOff className="h-5 w-5 stroke-[1.5] text-[#0F0F0F] dark:text-[#F1F1F1] shrink-0" />
                                ) : (
                                  <Bell className="h-5 w-5 stroke-[1.5] text-[#0F0F0F] dark:text-[#F1F1F1] shrink-0" />
                                )}
                                <span className="text-sm font-normal text-[#0F0F0F] dark:text-[#F1F1F1]">
                                  {a.is_active ? "Jeda Pantauan" : "Aktifkan Pantauan"}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDelete(a.id);
                                }}
                                className="w-full px-4 py-2.5 first:pt-3.5 last:pb-3.5 flex items-center gap-4 hover:bg-[#F2F2F2] dark:hover:bg-[#383838] transition-colors text-left cursor-pointer"
                              >
                                <Trash2 className="h-5 w-5 stroke-[1.5] text-[#0F0F0F] dark:text-[#F1F1F1] shrink-0" />
                                <span className="text-sm font-normal text-[#0F0F0F] dark:text-[#F1F1F1]">
                                  Hapus Pantauan
                                </span>
                              </button>
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

export default function AlertsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[#FF0000] border-t-transparent animate-spin" />
      </div>
    }>
      <AlertsContent />
    </Suspense>
  );
}
