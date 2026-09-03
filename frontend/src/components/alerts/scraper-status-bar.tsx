'use client';

import { useState, useEffect, useCallback } from 'react';
import { WatcherStatus } from '@/types';
import { getWatcherStatus, scanNow } from '@/lib/api';
import { formatTimeAgo } from '@/lib/format';
import { Radio, RefreshCw, CheckCircle2, Clock, Zap, ShieldCheck } from 'lucide-react';

interface ScraperStatusBarProps {
  onScanTriggered?: () => void;
  compact?: boolean;
}

export function ScraperStatusBar({ onScanTriggered, compact = false }: ScraperStatusBarProps) {
  const [status, setStatus] = useState<WatcherStatus | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getWatcherStatus();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      // Quiet fail on network hiccups
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Poll every 4 seconds so user sees live transitions between scanning and idle
    const timer = setInterval(fetchStatus, 4000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  const handleManualScan = async () => {
    setIsTriggering(true);
    try {
      await scanNow();
      // Immediately set optimistic scanning state
      setStatus((prev) => prev ? { ...prev, is_scanning: true, current_keyword: 'Memulai scan...' } : null);
      onScanTriggered?.();
      setTimeout(fetchStatus, 1500);
    } catch (err: any) {
      setError('Gagal memicu pemindaian');
    } finally {
      setIsTriggering(false);
    }
  };

  if (!status) return null;

  const isScanning = status.is_scanning || isTriggering;

  // Calculate minutes until next scan
  let minutesLeft = status.interval_minutes || 15;
  if (status.next_scan_at) {
    const diffMs = new Date(status.next_scan_at).getTime() - Date.now();
    if (diffMs > 0) {
      minutesLeft = Math.max(1, Math.round(diffMs / 60000));
    }
  }

  if (compact) {
    // Topbar Pill Format
    return (
      <div className="flex items-center gap-2">
        {isScanning ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold animate-pulse">
            <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
            <span>Sedang Memindai FB{status.current_keyword ? `: ${status.current_keyword}` : ''}...</span>
          </div>
        ) : (
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
            title={`Terakhir dipindai ${status.last_scan_at ? formatTimeAgo(status.last_scan_at) : 'belum lama ini'}. Scan berikutnya dalam ~${minutesLeft} mnt.`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Radar Siaga (15m)</span>
          </div>
        )}
      </div>
    );
  }

  // Full Banner Format for Alerts Page
  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 ${
      isScanning 
        ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30 shadow-xs' 
        : 'bg-[#F9F9F9] dark:bg-[#181818] border-[#E5E5E5] dark:border-[#303030]'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
            isScanning 
              ? 'bg-amber-500 text-white animate-bounce' 
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            {isScanning ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">
                {isScanning ? 'Robot Sedang Memindai Facebook Marketplace...' : 'Sistem Siaga & Pemindaian Terakhir Selesai'}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                isScanning 
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse' 
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}>
                {isScanning ? 'MEMINDAI...' : 'AKTIF BERJALAN'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#606060] dark:text-[#AAAAAA]">
              {isScanning ? (
                <span className="text-foreground font-semibold">
                  Mencari kata kunci: “{status.current_keyword || 'Semua Alert'}” (Terdekat &le; radius target)
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Terakhir: {status.last_scan_at ? formatTimeAgo(status.last_scan_at) : 'Baru saja'}</span>
                  </span>
                  <span>•</span>
                  <span>{status.last_items_found !== undefined ? `${status.last_items_found} barang diperiksa` : 'Feed dipindai'}</span>
                  <span>•</span>
                  <span>Patroli otomatis berikutnya: dalam ~{minutesLeft} menit</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
          <button
            type="button"
            onClick={handleManualScan}
            disabled={isScanning}
            className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              isScanning 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-foreground text-background hover:opacity-90 active:scale-95'
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Sedang Memindai...</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>Pindai Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
