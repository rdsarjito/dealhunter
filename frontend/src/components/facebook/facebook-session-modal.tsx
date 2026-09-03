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
import { KeyRound, CheckCircle2, AlertCircle, HelpCircle, ShieldCheck, LogOut, Loader2 } from 'lucide-react';
import { connectFacebook, disconnectFacebook, getFacebookStatus } from '@/lib/api';

interface FacebookSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectedSuccess?: () => void;
}

export function FacebookSessionModal({
  open,
  onOpenChange,
  onConnectedSuccess,
}: FacebookSessionModalProps) {
  const [rawCookie, setRawCookie] = useState('');
  const [cUser, setCUser] = useState('');
  const [xsToken, setXsToken] = useState('');
  const [useRaw, setUseRaw] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentStatus, setCurrentStatus] = useState<{ is_connected: boolean; account_name?: string; c_user?: string } | null>(null);

  useEffect(() => {
    if (open) {
      loadStatus();
    }
  }, [open]);

  const loadStatus = async () => {
    try {
      const res = await getFacebookStatus();
      setCurrentStatus(res);
    } catch {
      // ignore
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await connectFacebook(rawCookie, cUser, xsToken);
      setStatusMsg({
        type: 'success',
        text: res.message || 'Akun Facebook berhasil terhubung!',
      });
      loadStatus();
      onConnectedSuccess?.();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Gagal menghubungkan akun Facebook',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      await disconnectFacebook();
      setStatusMsg({
        type: 'success',
        text: 'Sesi akun Facebook berhasil diputus.',
      });
      loadStatus();
      onConnectedSuccess?.();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Gagal memutus sesi Facebook',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-foreground">
            <div className="h-8 w-8 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2]">
              <KeyRound className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-semibold text-foreground">
              Hubungkan Akun Facebook Asli
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#606060] dark:text-[#AAAAAA] leading-relaxed">
            Menghubungkan akun Facebook mengizinkan robot scraper bertindak sebagai akun Anda di Jakarta. 
            Scraping akan 100% akurat, menangkap deal real-time lokal, dan terbebas dari blokir atau iklan asing.
          </DialogDescription>
        </DialogHeader>

        {/* Current status badge */}
        <div className="p-3 rounded-xl border border-[#E5E5E5] dark:border-[#303030] bg-[#F9F9F9] dark:bg-[#1F1F1F] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${currentStatus?.is_connected ? 'bg-[#31A24C] animate-pulse' : 'bg-[#9E9E9E]'}`} />
            <div>
              <p className="text-xs font-bold text-foreground">
                {currentStatus?.is_connected ? 'Status: Terhubung & Aktif' : 'Status: Mode Tamu (Tanpa Akun)'}
              </p>
              {currentStatus?.is_connected && (
                <p className="text-[11px] text-[#606060] dark:text-[#AAAAAA]">
                  {currentStatus.account_name} (ID: {currentStatus.c_user})
                </p>
              )}
            </div>
          </div>
          {currentStatus?.is_connected && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={loading}
              className="text-xs font-semibold text-[#CC0000] hover:underline flex items-center gap-1"
            >
              <LogOut className="h-3 w-3" />
              Putus
            </button>
          )}
        </div>

        {/* Guidance box */}
        <div className="p-3.5 rounded-xl bg-[#EBF5FF] dark:bg-[#142338] border border-[#BEDBFE] dark:border-[#1E3A5F] text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-[#1877F2] dark:text-[#60A5FA]">
            <HelpCircle className="h-4 w-4 shrink-0" />
            <span>Cara Mengambil Cookie dari Browser Anda:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[#2B3B52] dark:text-[#C5D5E8] text-[11px] leading-relaxed">
            <li>Buka browser tempat Anda login Facebook (misal: <strong>facebook.com</strong>).</li>
            <li>Tekan tombol <strong>F12</strong> (atau Klik Kanan &rarr; <em>Inspect / Periksa</em>).</li>
            <li>Pilih tab <strong>Application</strong> &rarr; klik <strong>Cookies</strong> &rarr; <code>https://www.facebook.com</code>.</li>
            <li>Cari cookie bernama <strong>c_user</strong> dan <strong>xs</strong>, atau salin seluruh cookie string.</li>
          </ol>
        </div>

        <form onSubmit={handleConnect} className="space-y-4 pt-1">
          <div className="flex items-center justify-between text-xs pb-1">
            <span className="font-semibold text-foreground">Metode Input:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUseRaw(true)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                  useRaw ? 'bg-[#1877F2] text-white' : 'bg-[#F2F2F2] dark:bg-[#272727] text-[#606060]'
                }`}
              >
                Paste Cookie String
              </button>
              <button
                type="button"
                onClick={() => setUseRaw(false)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                  !useRaw ? 'bg-[#1877F2] text-white' : 'bg-[#F2F2F2] dark:bg-[#272727] text-[#606060]'
                }`}
              >
                c_user & xs terpisah
              </button>
            </div>
          </div>

          {useRaw ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Salin & Tempel Seluruh Cookie String:
              </label>
              <textarea
                value={rawCookie}
                onChange={(e) => setRawCookie(e.target.value)}
                placeholder="c_user=1000...; xs=...; datr=...;"
                rows={3}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-[#E5E5E5] dark:border-[#303030] bg-background text-foreground focus:outline-hidden focus:border-[#1877F2]"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">c_user (User ID)</label>
                <input
                  type="text"
                  value={cUser}
                  onChange={(e) => setCUser(e.target.value)}
                  placeholder="Contoh: 100088912345678"
                  className="w-full text-xs h-9 px-3 rounded-lg border border-[#E5E5E5] dark:border-[#303030] bg-background text-foreground focus:outline-hidden focus:border-[#1877F2]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">xs (Session Token)</label>
                <input
                  type="password"
                  value={xsToken}
                  onChange={(e) => setXsToken(e.target.value)}
                  placeholder="Contoh: 34%3AUb5e..."
                  className="w-full text-xs h-9 px-3 rounded-lg border border-[#E5E5E5] dark:border-[#303030] bg-background text-foreground focus:outline-hidden focus:border-[#1877F2]"
                />
              </div>
            </div>
          )}

          {statusMsg && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
              statusMsg.type === 'success' 
                ? 'bg-[#EDF7ED] dark:bg-[#1E2E1E] text-[#1E4620] dark:text-[#81C784]' 
                : 'bg-[#FDEDED] dark:bg-[#2C1B1D] text-[#5F2120] dark:text-[#E57373]'
            }`}>
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-[#606060] dark:text-[#AAAAAA] pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#31A24C] shrink-0" />
            <span>Cookie hanya disimpan secara lokal di server Lenovo Anda dan tidak pernah dikirim ke pihak luar.</span>
          </div>

          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 h-9 rounded-full border border-[#E5E5E5] dark:border-[#303030] text-xs font-semibold hover:bg-muted"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={loading || (!rawCookie && !cUser && !xsToken)}
              className="px-5 h-9 rounded-full bg-[#1877F2] hover:bg-[#1565C0] text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Simpan & Terapkan Sesi</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
