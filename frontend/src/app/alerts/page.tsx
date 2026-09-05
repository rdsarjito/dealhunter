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
  scanNow,
  getTelegramStatus, 
  getFacebookStatus 
} from '@/lib/api';
import { PriceAlert } from '@/types';
import { formatRupiah } from '@/lib/format';
import { 
  Bell, 
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

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);
  const [scanningAlertId, setScanningAlertId] = useState<string | null>(null);
  const [isScanningAll, setIsScanningAll] = useState(false);
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

  const handleScanAll = async () => {
    setIsScanningAll(true);
    try {
      await scanNow();
      setTimeout(() => {
        loadAlerts();
        setIsScanningAll(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      setIsScanningAll(false);
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
            {/* Clean Header Bar replacing old status banner */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E5E5E5] dark:border-[#303030] flex-wrap">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">Radar Pantauan Alert</h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#0000000D] dark:bg-[#FFFFFF14] text-foreground">
                    {alerts.filter(a => a.is_active).length} Aktif
                  </span>
                </div>
                <p className="text-xs text-[#606060] dark:text-[#AAAAAA]">
                  Pemindaian Facebook Marketplace berjalan otomatis sesuai frekuensi waktu scraping tiap alert.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleScanAll}
                  disabled={isScanningAll}
                  className="h-9 px-3.5 rounded-full bg-[#0000000D] dark:bg-[#FFFFFF14] hover:bg-[#0000001A] dark:hover:bg-[#FFFFFF26] text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Picu pemindaian semua alert aktif"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isScanningAll ? 'animate-spin text-[#FF0000]' : ''}`} />
                  <span>{isScanningAll ? 'Memindai Semua...' : 'Pindai Semua'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateAlert}
                  className="h-9 px-4 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Pasang Alert Baru</span>
                </button>
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="space-y-3 w-full">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 w-full rounded-xl bg-[#F2F2F2] dark:bg-[#272727] border border-[#E5E5E5] dark:border-[#303030] animate-pulse" />
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

            {/* Alerts List */}
            {!isLoading && alerts.length > 0 && (
              <div className="space-y-3 w-full">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className="w-full p-4 sm:p-5 rounded-xl border border-[#E5E5E5] dark:border-[#303030] bg-card hover:border-[#FF0000] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    {/* Clickable Area to open YouTube Watch Page */}
                    <div 
                      onClick={() => setActiveWatchAlert(a)}
                      className="space-y-2 flex-1 cursor-pointer min-w-0"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="h-7 w-7 rounded-full bg-[#FFF0F0] dark:bg-[#2B1414] text-[#FF0000] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="h-3.5 w-3.5 fill-[#FF0000]" />
                        </div>
                        <h3 className="font-bold text-base text-foreground group-hover:text-[#FF0000] transition-colors">
                          &ldquo;{a.keyword}&rdquo;
                        </h3>
                        <span className="text-xs font-black text-[#FF0000] tabular-price">
                          Maksimal {formatRupiah(a.max_price)}
                        </span>

                        {/* Individual Scraping Interval Badge */}
                        <div 
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#0000000D] dark:bg-[#FFFFFF14] text-[11px] font-semibold text-foreground"
                          title="Frekuensi pemindaian Facebook Marketplace untuk alert ini"
                        >
                          <Clock className="h-3 w-3 text-[#FF0000]" />
                          <span>Scraping tiap {a.interval_minutes || 5} menit</span>
                        </div>

                        {!a.is_active && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F2F2F2] dark:bg-[#272727] text-[#606060] dark:text-[#AAAAAA] font-medium">
                            Non-aktif
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#606060] dark:text-[#AAAAAA]">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-[#FF0000]" />
                          <span>{a.location || 'Jakarta'} ({a.radius_km || 25}km)</span>
                        </div>

                        <div className="flex items-center gap-1.5 font-bold">
                          {(a.match_count && a.match_count > 0) ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <span>{a.match_count} iklan baru tertangkap!</span>
                            </span>
                          ) : (
                            <span className="text-[#606060] dark:text-[#AAAAAA] flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Radar aktif mengintai</span>
                            </span>
                          )}
                        </div>

                        {a.last_matched_item && (
                          <div className="flex items-center gap-1 truncate max-w-md text-[#0F0F0F] dark:text-[#F1F1F1]">
                            <Clock className="h-3 w-3 text-[#606060]" />
                            <span className="truncate">Terakhir: {a.last_matched_item}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Right */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {/* Watch Page Button */}
                      <button
                        type="button"
                        onClick={() => setActiveWatchAlert(a)}
                        className="h-9 px-3.5 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                        title="Buka tampilan Watch Page ala YouTube"
                      >
                        <Play className="h-3 w-3 fill-white" />
                        <span>Tonton ({a.match_count || 0})</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>

                      {/* Single Alert Scan Button */}
                      <button
                        type="button"
                        onClick={(e) => handleScanSingle(a.id, e)}
                        disabled={scanningAlertId === a.id}
                        className="h-9 w-9 rounded-full bg-[#F2F2F2] dark:bg-[#272727] hover:bg-[#E5E5E5] dark:hover:bg-[#383838] text-foreground flex items-center justify-center transition-colors cursor-pointer"
                        title={`Pindai kata kunci "${a.keyword}" sekarang`}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${scanningAlertId === a.id ? 'animate-spin text-[#FF0000]' : ''}`} />
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={(e) => handleEditAlert(a, e)}
                        className="h-9 w-9 rounded-full bg-[#F2F2F2] dark:bg-[#272727] hover:bg-[#E5E5E5] dark:hover:bg-[#383838] text-foreground flex items-center justify-center transition-colors cursor-pointer"
                        title="Edit pengaturan & waktu scraping"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      {/* Active Toggle Switch */}
                      <div className="flex items-center pl-1 border-l border-[#E5E5E5] dark:border-[#303030]">
                        <Switch
                          checked={a.is_active}
                          onCheckedChange={() => handleToggle(a.id, a.is_active)}
                        />
                      </div>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        className="h-9 w-9 rounded-full bg-[#F2F2F2] dark:bg-[#272727] hover:bg-[#FFE5E5] hover:text-[#CC0000] text-[#606060] flex items-center justify-center transition-colors cursor-pointer"
                        title="Hapus alert"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
