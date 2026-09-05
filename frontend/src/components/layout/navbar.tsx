'use client';

import { ScraperStatusBar } from '@/components/alerts/scraper-status-bar';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Menu,
  Play,
  Store, 
  Search, 
  Send, 
  Sun, 
  Moon, 
  Bell, 
  Mic, 
  Plus,
  ChevronRight,
  KeyRound
} from 'lucide-react';
import { useSearchStore } from '@/stores/search-store';

interface NavbarProps {
  onOpenTelegram?: () => void;
  telegramConnected?: boolean;
  onOpenFacebook?: () => void;
  facebookConnected?: boolean;
  onOpenAlertModal?: () => void;
  onSearchSubmit?: (keyword: string) => void;
}

export function Navbar({ 
  onOpenTelegram, 
  telegramConnected,
  onOpenFacebook,
  facebookConnected, 
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

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
      <div className="w-full pl-4 pr-4 sm:pr-6 h-full flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Hamburger (☰) + FB Marketplace DealHunter Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={handleHamburgerClick}
            title="Menu Utama"
            className="h-10 w-10 rounded-full hover:bg-[#F2F2F2] dark:hover:bg-[#272727] text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>

          <Link 
            href="/" 
            className="flex items-center gap-1 group hover:opacity-95 transition-opacity select-none"
            title="DealHunter Beranda"
          >
            <div className="h-5 w-7 rounded-[4px] bg-[#FF0000] text-white flex items-center justify-center shadow-xs">
              <Play className="h-3 w-3 fill-white ml-0.5" />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tighter text-foreground">
              Deal<span className="text-[#FF0000]">Hunter</span>
            </span>
            <span className="text-[10px] text-[#606060] dark:text-[#AAAAAA] font-normal uppercase tracking-wider ml-0.5">
              ID
            </span>
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

          {/* Scraper Live Status Badge */}
          <ScraperStatusBar compact />

          {/* YouTube Profile Avatar Circle & Dropdown Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              title="Akun & Integrasi"
              className="relative ml-1 cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF0000]/50"
            >
              <div className="h-8 w-8 rounded-full bg-[#FF0000] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                R
              </div>
              {(telegramConnected || facebookConnected) && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#31A24C] border-2 border-card" />
              )}
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-11 w-80 rounded-2xl bg-card border border-[#E5E5E5] dark:border-[#303030] shadow-2xl py-2 z-50 text-foreground animate-in fade-in-0 zoom-in-95 duration-150 select-none">
                {/* Header: User Profile Info (YouTube Style) */}
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#E5E5E5] dark:border-[#303030]">
                  <div className="h-10 w-10 rounded-full bg-[#FF0000] text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0">
                    R
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm text-foreground truncate">Rama</span>
                    <span className="text-xs text-[#606060] dark:text-[#AAAAAA] truncate">@dealhunter_id</span>
                    <span className="text-[11px] text-[#065FD4] dark:text-[#3EA6FF] hover:underline cursor-pointer mt-0.5">
                      Akun Reseller Pro
                    </span>
                  </div>
                </div>

                {/* Section 1: Status Integrasi (Telegram & Facebook) */}
                <div className="py-1">
                  <div className="px-4 pt-2 pb-1 text-[11px] font-semibold text-[#606060] dark:text-[#AAAAAA] uppercase tracking-wider">
                    Status Integrasi
                  </div>

                  {/* Telegram Notification Row */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onOpenTelegram?.();
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-[#0000000D] dark:hover:bg-[#FFFFFF1A] transition-colors text-left group cursor-pointer"
                  >
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <Send className={`w-5 h-5 ${telegramConnected ? 'text-[#31A24C]' : 'text-[#606060] dark:text-[#AAAAAA]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-normal text-foreground group-hover:text-foreground">
                        Notifikasi Telegram
                      </div>
                      <div className="text-xs flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-block w-2 h-2 rounded-full ${telegramConnected ? 'bg-[#31A24C]' : 'bg-[#9E9E9E]'}`} />
                        <span className={telegramConnected ? 'text-[#31A24C] font-medium' : 'text-[#606060] dark:text-[#AAAAAA]'}>
                          {telegramConnected ? 'Terhubung & Aktif' : 'Belum Terhubung'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#606060] dark:text-[#AAAAAA] shrink-0" />
                  </button>

                  {/* Facebook Account Session Row */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onOpenFacebook?.();
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-[#0000000D] dark:hover:bg-[#FFFFFF1A] transition-colors text-left group cursor-pointer"
                  >
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <KeyRound className={`w-5 h-5 ${facebookConnected ? 'text-[#1877F2]' : 'text-[#606060] dark:text-[#AAAAAA]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-normal text-foreground group-hover:text-foreground">
                        Sesi Akun Facebook
                      </div>
                      <div className="text-xs flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-block w-2 h-2 rounded-full ${facebookConnected ? 'bg-[#1877F2]' : 'bg-[#9E9E9E]'}`} />
                        <span className={facebookConnected ? 'text-[#1877F2] font-medium' : 'text-[#606060] dark:text-[#AAAAAA]'}>
                          {facebookConnected ? 'Sesi Asli Terhubung' : 'Mode Tamu (Tanpa Akun)'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#606060] dark:text-[#AAAAAA] shrink-0" />
                  </button>
                </div>

                <hr className="my-1 border-[#E5E5E5] dark:border-[#303030]" />

                {/* Section 2: Tampilan & Navigasi Cepat */}
                <div className="py-1">
                  {/* Theme Switcher in Dropdown */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-[#0000000D] dark:hover:bg-[#FFFFFF1A] transition-colors text-left group cursor-pointer"
                  >
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      {isDark ? <Moon className="w-5 h-5 text-neutral-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-normal text-foreground">Tampilan</div>
                      <div className="text-xs text-[#606060] dark:text-[#AAAAAA] mt-0.5">
                        {isDark ? 'Tema Gelap' : 'Tema Terang'}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#606060] dark:text-[#AAAAAA] shrink-0" />
                  </button>

                  {/* Link to Alerts */}
                  <Link
                    href="/alerts"
                    onClick={() => setProfileMenuOpen(false)}
                    className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-[#0000000D] dark:hover:bg-[#FFFFFF1A] transition-colors text-left group cursor-pointer"
                  >
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5 text-[#606060] dark:text-[#AAAAAA]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-normal text-foreground">Radar Alert Deals</div>
                      <div className="text-xs text-[#606060] dark:text-[#AAAAAA] mt-0.5">
                        Kelola barang pantauan & notifikasi
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#606060] dark:text-[#AAAAAA] shrink-0" />
                  </Link>
                </div>

                <hr className="my-1 border-[#E5E5E5] dark:border-[#303030]" />

                {/* Footer in Dropdown */}
                <div className="px-4 py-2 text-[11px] text-[#606060] dark:text-[#AAAAAA]">
                  DealHunter ID • YouTube Engine
                </div>
              </div>
            )}
          </div>
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
