'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Send, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { connectTelegram, sendTestTelegram } from '@/lib/api';

interface TelegramSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectedSuccess?: () => void;
  isConnected?: boolean;
}

export function TelegramSettingsModal({
  open,
  onOpenChange,
  onConnectedSuccess,
  isConnected = false,
}: TelegramSettingsModalProps) {
  const [chatId, setChatId] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId.trim()) return;

    setLoading(true);
    setStatusMsg(null);
    try {
      await connectTelegram(chatId.trim(), username.trim());
      setStatusMsg({
        type: 'success',
        text: 'Telegram berhasil terhubung!',
      });
      onConnectedSuccess?.();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Gagal menghubungkan ke Telegram',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      await sendTestTelegram(chatId || undefined);
      setStatusMsg({
        type: 'success',
        text: 'Pesan tes berhasil dikirim! Silakan periksa Telegram Anda.',
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Gagal mengirim pesan tes',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl border border-border bg-card shadow-2xl">
        <DialogHeader className="space-y-1 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-secondary text-foreground flex items-center justify-center">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">Pengaturan Bot Telegram</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Notifikasi instan saat ada iklan murah baru di Facebook Marketplace.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleConnect} className="space-y-4 pt-2">
          {/* Guide Box */}
          <div className="p-3.5 rounded-xl bg-secondary/50 border border-border text-xs space-y-1 text-muted-foreground">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-foreground" />
              <span>Cara Mendapatkan Chat ID:</span>
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] pt-1 leading-normal">
              <li>Buka Telegram, cari bot: <strong>@userinfobot</strong></li>
              <li>Kirim pesan <strong>/start</strong> untuk melihat angka ID Anda</li>
              <li>Salin angka ID tersebut dan masukkan ke kolom di bawah ini</li>
            </ol>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Telegram Chat ID</label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Contoh: 123456789"
              required
              className="w-full h-10 px-3 rounded-xl bg-secondary/50 border border-border text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Username (Opsional)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
              className="w-full h-10 px-3 rounded-xl bg-secondary/50 border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>

          {statusMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <DialogFooter className="pt-2 flex flex-row gap-2 justify-between items-center">
            <button
              type="button"
              onClick={handleTest}
              disabled={loading}
              className="px-3.5 h-9 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium transition-colors"
            >
              Tes Pesan
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 h-9 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 h-9 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? 'Menyimpan...' : 'Simpan & Hubungkan'}
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
