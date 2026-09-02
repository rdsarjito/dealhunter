'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Menu,
  Play, 
  Search, 
  Send, 
  Sun, 
  Moon, 
  Bell, 
  Mic, 
  Plus 
} from 'lucide-react';
import { useSearchStore } from '@/stores/search-store';

interface NavbarProps {
  onOpenTelegram?: () => void;
  telegramConnected?: boolean;
  onOpenAlertModal?: () => void;
  onSearchSubmit?: (keyword: string) => void;
}

export function Navbar({ 
  onOpenTelegram, 
  telegramConnected, 
  onOpenAlertModal, 
  onSearchSubmit 
}: NavbarProps) {
  const router = useRouter();
  const { 
    keyword, 
    setKeyword, 
    toggleDrawer 
  } = useSearchStore();
  const [isDark, setIsDark] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const toggleTheme = () => {
    if (typeof document !== 'undefined') {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        setIsDark(false);
      } else {
        document.documentElement.classList.add('dark');
        setIsDark(true);
      }
    }
  };

  const handleHamburgerClick = () => {
    toggleDrawer();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMobileSearchOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(keyword);
    } else {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full h-14 bg-card border-b border-[#E5E5E5] dark:border-[#303030] select-none transition-colors">
      <div className="w-full px-4 sm:px-6 h-full flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: YouTube Hamburger (☰) + Logo */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={handleHamburgerClick}
            title="Menu YouTube"
            className="h-10 w-10 rounded-full hover:bg-[#F2F2F2] dark:hover:bg-[#272727] text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>

          <Link 
            href="/" 
            className="flex items-center gap-1 group hover:opacity-95 transition-opacity"
            title="DealHunter Beranda"
          >
            <div className="h-5 w-7 rounded-sm bg-[#FF0000] text-white flex items-center justify-center shadow-xs">
              <Play className="h-3 w-3 fill-white ml-0.5" />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tighter text-foreground">
              Deal<span className="text-[#FF0000]">Hunter</span>
            </span>
            <span className="text-[10px] text-[#606060] dark:text-[#AAAAAA] font-normal uppercase tracking-wider ml-0.5 hidden xs:inline">
              ID
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Server Live" />
          </Link>
        </div>

        {/* Center: Real YouTube Search Bar + Voice Search Mic */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-2xl px-2">
          <div className="flex items-center w-full max-w-xl">
            <form onSubmit={handleSearchSubmit} className="flex items-center flex-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Telusuri FB Marketplace..."
                  className="w-full h-10 pl-4 pr-3 rounded-l-full border border-[#CCCCCC] dark:border-[#303030] bg-card text-foreground text-sm placeholder:text-[#606060] focus:outline-none focus:border-[#065FD4] transition-colors"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-6 rounded-r-full border border-l-0 border-[#CCCCCC] dark:border-[#303030] bg-[#F8F8F8] dark:bg-[#222222] hover:bg-[#F0F0F0] dark:hover:bg-[#272727] text-foreground flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title="Telusuri"
              >
                <Search className="h-4 w-4 text-[#606060] dark:text-[#AAAAAA]" />
              </button>
            </form>

            {/* YouTube Circular Voice Search Button */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') window.alert('Fitur pencarian suara sedang dalam pengembangan.');
              }}
              title="Telusuri dengan suara"
              className="h-10 w-10 ml-3 rounded-full bg-[#F2F2F2] dark:bg-[#272727] hover:bg-[#E5E5E5] dark:hover:bg-[#383838] text-foreground flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              <Mic className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* Right: YouTube "+ Buat" Pill, Notifications, Theme, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 justify-end shrink-0">
          {/* Mobile Search Icon Toggle */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden h-9 w-9 rounded-full hover:bg-[#F2F2F2] dark:hover:bg-[#272727] text-foreground flex items-center justify-center"
            title="Cari"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* YouTube "+ Buat" Pill Button */}
          {onOpenAlertModal && (
            <button
              type="button"
              onClick={onOpenAlertModal}
              title="Buat Alert Baru"
              className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#F2F2F2] dark:bg-[#272727] hover:bg-[#E5E5E5] dark:hover:bg-[#383838] text-foreground text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Alert</span>
            </button>
          )}

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Mode Terang YouTube' : 'Mode Gelap YouTube'}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-[#F2F2F2] dark:hover:bg-[#272727] text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-neutral-700" />}
          </button>

          {/* YouTube Bell Notification Icon with Dot */}
          <Link
            href="/alerts"
            title="Notifikasi & Alerts"
            className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-[#F2F2F2] dark:hover:bg-[#272727] text-foreground flex items-center justify-center transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#FF0000]" />
          </Link>

          {/* YouTube Profile Avatar Circle */}
          <button
            type="button"
            onClick={onOpenTelegram}
            title={telegramConnected ? 'Telegram Terhubung' : 'Hubungkan Telegram'}
            className="relative ml-1 cursor-pointer"
          >
            <div className="h-8 w-8 rounded-full bg-[#FF0000] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              R
            </div>
            {telegramConnected && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#31A24C] border-2 border-card" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Expanding Search Bar */}
      {mobileSearchOpen && (
        <div className="md:hidden px-3 py-2 bg-card border-b border-[#E5E5E5] dark:border-[#303030] flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleSearchSubmit} className="flex items-center flex-1">
            <input
              type="text"
              autoFocus
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Telusuri FB Marketplace..."
              className="flex-1 h-9 px-3.5 rounded-l-full border border-[#CCCCCC] dark:border-[#303030] bg-card text-foreground text-xs focus:outline-none focus:border-[#065FD4]"
            />
            <button
              type="submit"
              className="h-9 px-4 rounded-r-full border border-l-0 border-[#CCCCCC] dark:border-[#303030] bg-[#F8F8F8] dark:bg-[#222222] text-foreground flex items-center justify-center shrink-0"
            >
              <Search className="h-3.5 w-3.5 text-[#606060]" />
            </button>
          </form>
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            className="text-xs font-semibold text-[#606060] dark:text-[#AAAAAA] px-1"
          >
            Batal
          </button>
        </div>
      )}
    </header>
  );
}
