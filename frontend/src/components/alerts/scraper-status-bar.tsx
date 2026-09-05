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

  // YouTube-Style Horizontal Filter Chips Bar for Alerts Page
  return (
    <div className="w-full flex items-center justify-between gap-2.5 flex-wrap py-1 select-none">
      {/* Left: Status & Metric Chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
        {/* Chip 1: Live Status */}
        {isScanning ? (
          <div className="h-8 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center gap-2 shrink-0 animate-pulse">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-500" />
            <span>Memindai FB{status.current_keyword ? `: “${status.current_keyword}”` : ''}...</span>
          </div>
        ) : (
          <div 
            className="h-8 px-3 rounded-lg bg-[#0000000D] dark:bg-[#FFFFFF14] hover:bg-[#0000001A] dark:hover:bg-[#FFFFFF26] text-foreground text-xs font-medium flex items-center gap-2 shrink-0 transition-colors cursor-default"
            title={`Patroli otomatis berikutnya dalam ~${minutesLeft} menit`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Patroli Siaga</span>
            <span className="text-[#606060] dark:text-[#AAAAAA] text-[11px]">
              (~{minutesLeft}m lagi)
            </span>
          </div>
        )}

        {/* Chip 2: Inspection Metric */}
        <div 
          className="h-8 px-3 rounded-lg bg-[#0000000D] dark:bg-[#FFFFFF14] text-foreground text-xs font-medium flex items-center gap-2 shrink-0 cursor-default"
          title={`Terakhir dipindai ${status.last_scan_at ? formatTimeAgo(status.last_scan_at) : 'baru saja'}`}
        >
          <Clock className="h-3.5 w-3.5 text-[#606060] dark:text-[#AAAAAA]" />
          <span>{status.last_items_found !== undefined ? `${status.last_items_found} barang diperiksa` : 'Feed aktif'}</span>
          <span className="text-[#606060] dark:text-[#AAAAAA] text-[11px]">
            • {status.last_scan_at ? formatTimeAgo(status.last_scan_at) : 'Baru saja'}
          </span>
        </div>
      </div>

      {/* Right: Action Chip (Pindai Sekarang) */}
      <button
        type="button"
        onClick={handleManualScan}
        disabled={isScanning}
        className="h-8 px-3.5 rounded-lg bg-[#0F0F0F] text-white dark:bg-[#F1F1F1] dark:text-[#0F0F0F] hover:opacity-90 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-xs shrink-0 ml-auto"
        title="Picu pemindaian Facebook Marketplace sekarang"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
        <span>{isScanning ? 'Memindai...' : 'Pindai Sekarang'}</span>
      </button>
    </div>
  );
}
