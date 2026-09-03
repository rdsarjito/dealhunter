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
import { Send, CheckCircle2, AlertCircle, HelpCircle, Bot, LogOut, Loader2 } from 'lucide-react';
import { connectTelegram, sendTestTelegram, disconnectTelegram } from '@/lib/api';

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
  const [botToken, setBotToken] = useState('');
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
      await connectTelegram(chatId.trim(), username.trim(), botToken.trim());
      setStatusMsg({
        type: 'success',
        text: 'Bot Telegram Anda berhasil terhubung! Pesan konfirmasi telah dikirim.',
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

  const handleDisconnect = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      await disconnectTelegram();
      setStatusMsg({
        type: 'success',
        text: 'Koneksi Telegram berhasil diputus.',
      });
      setChatId('');
      setBotToken('');
      setUsername('');
      onConnectedSuccess?.();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Gagal memutus koneksi Telegram',
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
        text: 'Pesan tes berhasil dikirim! Silakan periksa bot Telegram Anda.',
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Gagal mengirim pesan tes. Pastikan Anda sudah mengklik /start pada bot Anda.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">Pengaturan Bot Telegram Pribadi</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Gunakan BotFather untuk menerima notifikasi deal murah instan ke HP.
                </DialogDescription>
              </div>
            </div>

            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={loading}
                className="text-xs font-semibold text-[#CC0000] hover:underline flex items-center gap-1"
                title="Putus koneksi Telegram"
              >
                <LogOut className="h-3 w-3" />
                <span>Putus</span>
              </button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleConnect} className="space-y-4 pt-2">
          {/* Guide Box */}
          <div className="p-3.5 rounded-xl bg-[#F0F8FF] dark:bg-[#102030] border border-[#BAE0FD] dark:border-[#1E3A5F] text-xs space-y-1.5 text-muted-foreground">
            <div className="font-bold text-foreground flex items-center gap-1.5 text-[#229ED9]">
              <Bot className="h-4 w-4" />
              <span>Langkah Buat Bot di @BotFather:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-[#2C3E50] dark:text-[#CBD5E1]">
              <li>Buka Telegram, cari <strong>@BotFather</strong> &rarr; kirim pesan <code>/newbot</code></li>
              <li>Beri nama & username bot Anda (misal: <code>dealhunter_ku_bot</code>)</li>
              <li>Salin <strong>HTTP API Token</strong> yang diberikan BotFather</li>
              <li>Buka bot baru Anda tersebut lalu klik <strong>START</strong></li>
              <li>Cari <strong>@userinfobot</strong> di Telegram untuk melihat <strong>Chat ID</strong> (angka) Anda</li>
            </ol>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Bot Token dari @BotFather
            </label>
            <input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="Contoh: 7123456789:AAHk1_abcdef..."
              className="w-full h-10 px-3 rounded-xl bg-secondary/50 border border-border text-foreground text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Telegram Chat ID Anda
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Contoh: 123456789 (dari @userinfobot)"
              required
              className="w-full h-10 px-3 rounded-xl bg-secondary/50 border border-border text-foreground text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Username Anda (Opsional)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
              className="w-full h-10 px-3 rounded-xl bg-secondary/50 border border-border text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-foreground"
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
              disabled={loading || !chatId}
              className="px-3.5 h-9 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium transition-colors disabled:opacity-50"
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
                disabled={loading || !chatId}
                className="px-4 h-9 rounded-xl bg-[#229ED9] text-white text-xs font-semibold hover:bg-[#1E88E5] disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{loading ? 'Menyimpan...' : 'Simpan & Hubungkan'}</span>
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
