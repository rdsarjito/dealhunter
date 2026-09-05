'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bookmark, 
  History, 
  Smartphone, 
  Laptop, 
  Car, 
  Armchair, 
  Gamepad2, 
  Send,
  Play, 
  KeyRound,
  ChevronRight,
  Menu
} from 'lucide-react';
import { useSearchStore } from '@/stores/search-store';

// YouTube Exact SVG Icons
function YouTubeHomeIcon({ active = false }: { active?: boolean }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M4 21V10.08l8-6.92 8 6.92V21h-5v-6h-6v6H4z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-[1.8]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V10.08l8-6.92 8 6.92V21h-5v-6h-6v6H4z" />
    </svg>
  );
}

function YouTubeShortsIcon({ active = false }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
      <path d="M17.77 10.32l-1.2-.5L18 9.06a3.74 3.74 0 00-3.5-5.35c-.73 0-1.44.2-2.06.58L6.44 7.82A3.74 3.74 0 004.5 11c0 1.45.85 2.74 2.16 3.32l1.2.5L6.4 15.65a3.75 3.75 0 003.56 5.4c.73 0 1.44-.2 2.06-.58l5.94-3.53a3.74 3.74 0 001.94-3.18c0-1.45-.85-2.74-2.13-3.32v-.12zM10 14.65v-5.3l4.58 2.65L10 14.65z" />
    </svg>
  );
}

function YouTubeSubscriptionsIcon({ active = false }: { active?: boolean }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M20 7H4V6h16v1zm2 2H2v11h20V9zM5 19V10h14v9H5zm5-2l5-3.5-5-3.5v7zm8-13H6V3h12v1z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-[1.8]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M2 9h20v11H2V9zm8 3.5l5 3.5-5 3.5v-7zM6 3h12" />
    </svg>
  );
}

function YouTubeYouIcon({ active = false }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
    </svg>
  );
}

interface YouTubeSidebarProps {
  onOpenTelegram?: () => void;
  telegramConnected?: boolean;
  onOpenFacebook?: () => void;
  facebookConnected?: boolean;
}

export function YouTubeSidebar({ onOpenTelegram, telegramConnected, onOpenFacebook, facebookConnected }: YouTubeSidebarProps) {
  const pathname = usePathname();
  const { 
    drawerOpen, 
    setDrawerOpen, 
    category, 
    setCategory 
  } = useSearchStore();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname, setDrawerOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen, setDrawerOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (drawerOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }, [drawerOpen]);

  // Mini rail items (exactly matching YouTube desktop navigation)
  const miniRailItems = [
    {
      href: '/',
      label: 'Beranda',
      icon: (active: boolean) => <YouTubeHomeIcon active={active} />,
      isActive: pathname === '/',
    },
    {
      href: '/trends',
      label: 'Shorts',
      icon: (active: boolean) => <YouTubeShortsIcon active={active} />,
      isActive: pathname === '/trends',
    },
    {
      href: '/alerts',
      label: 'Subscription',
      icon: (active: boolean) => <YouTubeSubscriptionsIcon active={active} />,
      isActive: pathname === '/alerts',
    },
    {
      href: '/watchlist',
      label: 'Anda',
      icon: (active: boolean) => <YouTubeYouIcon active={active} />,
      isActive: pathname === '/watchlist' || pathname === '/saved',
    },
  ];

  const primaryLinks = [
    { 
      href: '/', 
      label: 'Beranda', 
      icon: (active: boolean) => <YouTubeHomeIcon active={active} /> 
    },
    { 
      href: '/trends', 
      label: 'Shorts (Tren Pasar)', 
      icon: (active: boolean) => <YouTubeShortsIcon active={active} /> 
    },
    { 
      href: '/alerts', 
      label: 'Subscription (Price Alerts)', 
      icon: (active: boolean) => <YouTubeSubscriptionsIcon active={active} /> 
    },
  ];

  const personalLinks = [
    { href: '/watchlist', label: 'Watchlist Saya', icon: Bookmark },
    { href: '/saved', label: 'Pencarian Tersimpan', icon: History },
  ];

  const exploreItems = [
    { name: 'Elektronik & Gadget', icon: Smartphone },
    { name: 'Komputer & Laptop', icon: Laptop },
    { name: 'Kendaraan & Otomotif', icon: Car },
    { name: 'Perabot Rumah Tangga', icon: Armchair },
    { name: 'Hobi & Olahraga', icon: Gamepad2 },
  ];

  return (
    <>
      {/* 
        1. YOUTUBE MINI SIDEBAR (RAIL)
        Fixed/Sticky on desktop (hidden on mobile), width 72px.
        Matches exact screenshot: Beranda, Shorts, Subscription, Anda.
      */}
      <aside 
        aria-label="Navigasi Mini YouTube"
        className="hidden md:flex flex-col items-center w-[72px] shrink-0 sticky top-14 left-0 h-[calc(100vh-56px)] bg-card py-1 select-none z-30 overflow-y-auto"
      >
        <div className="flex flex-col items-center w-full gap-0.5">
          {miniRailItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`w-[64px] h-[74px] flex flex-col items-center justify-center rounded-[10px] my-0.5 mx-auto transition-all duration-150 ease-out cursor-pointer group active:scale-95 ${
                item.isActive
                  ? 'text-[#0F0F0F] dark:text-[#F1F1F1] font-semibold'
                  : 'text-[#0F0F0F] dark:text-[#F1F1F1] font-normal hover:bg-[#0000000D] dark:hover:bg-[#FFFFFF1A]'
              }`}
              title={item.label}
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                {item.icon(item.isActive)}
              </div>
              <span className={`text-[10px] leading-[14px] text-center tracking-tight truncate w-full px-0.5 mt-1.5 ${
                item.isActive ? 'font-semibold' : 'font-normal'
              }`}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </aside>

      {/* 
        2. YOUTUBE FULL SLIDING DRAWER (OVERLAY)
        Smooth backdrop with cubic-bezier slide-out when hamburger is clicked.
      */}
      <div 
        className={`fixed inset-0 z-50 transition-all duration-250 ease-out ${
          drawerOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
      >
        {/* Greyed-out backdrop overlay */}
        <div 
          className={`absolute inset-0 bg-black/50 backdrop-blur-[0.5px] transition-opacity duration-250 ease-out cursor-pointer ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setDrawerOpen(false)}
        />

        {/* Sliding Menu Drawer */}
        <div 
          className={`relative w-64 h-full bg-card shadow-2xl flex flex-col z-10 transition-transform duration-250 ease-[cubic-bezier(0.05,0.7,0.1,1.0)] transform ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header Drawer */}
          <div className="h-14 px-4 flex items-center gap-4 border-b border-[#E5E5E5] dark:border-[#303030] shrink-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 text-foreground flex items-center justify-center cursor-pointer transition-colors"
              title="Tutup Menu"
            >
              <Menu className="h-5 w-5 stroke-[2] text-foreground" />
            </button>
            <Link 
              href="/" 
              onClick={() => setDrawerOpen(false)} 
              className="flex items-center gap-1 group select-none"
            >
              <div className="h-5 w-7 rounded-sm bg-[#FF0000] text-white flex items-center justify-center shadow-xs">
                <Play className="h-3 w-3 fill-white ml-0.5" />
              </div>
              <span className="font-bold text-lg tracking-tighter text-foreground">
                Deal<span className="text-[#FF0000]">Hunter</span>
              </span>
              <span className="text-[10px] text-[#606060] font-normal uppercase ml-0.5">ID</span>
            </Link>
          </div>

          {/* Scrollable Menu Content */}
          <div className="flex-1 overflow-y-auto px-3 py-3 select-none text-[14px]">
            {/* SECTION 1: Navigasi Utama */}
            <div className="space-y-0.5">
              {primaryLinks.map((link) => {
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-6 px-3 h-10 rounded-[10px] transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#0000000D] dark:bg-[#FFFFFF1A] text-[#0F0F0F] dark:text-[#F1F1F1] font-semibold'
                        : 'text-foreground hover:bg-[#0000000D] dark:hover:bg-[#FFFFFF1A] active:scale-[0.98]'
                    }`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      {link.icon(isActive)}
                    </div>
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <hr className="my-3 border-[#E5E5E5] dark:border-[#303030]" />

            {/* SECTION 2: Anda (You >) */}
            <div className="space-y-0.5">
              <Link 
                href="/watchlist"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-1 px-3 py-1 text-sm font-bold text-foreground hover:text-[#FF0000] group"
              >
                <span>Anda</span>
                <ChevronRight className="h-4 w-4 text-[#606060] group-hover:text-[#FF0000] transition-colors" />
              </Link>

              {personalLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-6 px-3 h-10 rounded-[10px] transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#0000000D] dark:bg-[#FFFFFF1A] text-[#0F0F0F] dark:text-[#F1F1F1] font-semibold'
                        : 'text-foreground hover:bg-[#0000000D] dark:hover:bg-[#FFFFFF1A] active:scale-[0.98]'
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-[#FF0000] stroke-[2.5]' : 'stroke-[1.8]'}`} />
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <hr className="my-3 border-[#E5E5E5] dark:border-[#303030]" />

            {/* SECTION 3: Eksplorasi (Explore) */}
            <div className="space-y-0.5">
              <div className="px-3 py-1 text-sm font-bold text-foreground">
                Eksplorasi
              </div>

              {exploreItems.map((item) => {
                const Icon = item.icon;
                const isSelected = category === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setCategory(item.name);
                      setDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-6 px-3 h-10 rounded-[10px] transition-colors duration-150 text-left ${
                      isSelected
                        ? 'bg-[#0000000D] dark:bg-[#FFFFFF1A] text-[#FF0000] font-semibold'
                        : 'text-foreground hover:bg-[#0000000D] dark:hover:bg-[#FFFFFF1A] active:scale-[0.98]'
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${isSelected ? 'text-[#FF0000]' : 'text-[#606060] dark:text-[#AAAAAA]'}`} />
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>

            <hr className="my-3 border-[#E5E5E5] dark:border-[#303030]" />

            {/* SECTION 4: Lainnya dari DealHunter */}
            <div className="space-y-0.5">
              <div className="px-3 py-1 text-sm font-bold text-foreground">
                Lainnya dari DealHunter
              </div>

              <button
                type="button"
                onClick={() => {
                  onOpenTelegram?.();
                  setDrawerOpen(false);
                }}
                className="w-full flex items-center gap-6 px-3 h-10 rounded-[10px] text-foreground hover:bg-[#0000000D] dark:hover:bg-[#FFFFFF1A] transition-colors duration-150 text-left active:scale-[0.98]"
              >
                <Send className={`h-5 w-5 shrink-0 ${telegramConnected ? 'text-[#31A24C]' : 'text-[#606060] dark:text-[#AAAAAA]'}`} />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">Bot Telegram</span>
                  <span className="text-[10px] text-[#606060] dark:text-[#AAAAAA] truncate">
                    {telegramConnected ? 'Aktif terhubung' : 'Belum terhubung'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenFacebook?.();
                  setDrawerOpen(false);
                }}
                className="w-full flex items-center gap-6 px-3 h-10 rounded-[10px] text-foreground hover:bg-[#0000000D] dark:hover:bg-[#FFFFFF1A] transition-colors duration-150 text-left active:scale-[0.98]"
              >
                <KeyRound className={`h-5 w-5 shrink-0 ${facebookConnected ? 'text-[#1877F2]' : 'text-[#606060] dark:text-[#AAAAAA]'}`} />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">Akun Facebook</span>
                  <span className="text-[10px] text-[#606060] dark:text-[#AAAAAA] truncate">
                    {facebookConnected ? 'Sesi asli aktif' : 'Mode tamu (tanpa akun)'}
                  </span>
                </div>
              </button>
            </div>

            <hr className="my-3 border-[#E5E5E5] dark:border-[#303030]" />

            {/* SECTION 5: YouTube Footer Copyright & Links */}
            <div className="px-3 py-2 text-[12px] text-[#606060] dark:text-[#AAAAAA] space-y-3 select-none">
              <div className="flex flex-wrap gap-x-2 gap-y-1 font-medium">
                <span>Tentang</span>
                <span>Pers</span>
                <span>Hak cipta</span>
                <span>Hubungi kami</span>
                <span>Kreator</span>
                <span>Iklan</span>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-1 font-medium text-[11px]">
                <span>Ketentuan</span>
                <span>Privasi</span>
                <span>Kebijakan & Keamanan</span>
              </div>
              <div className="text-[11px] text-[#909090] dark:text-[#717171] pt-1">
                © 2026 DealHunter ID LLC
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
