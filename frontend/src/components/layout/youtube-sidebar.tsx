'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Laptop, 
  Smartphone, 
  Tv, 
  Headphones, 
  Camera, 
  Gamepad2, 
  Send,
  Play, 
  KeyRound,
  Menu
} from 'lucide-react';
import { useSearchStore } from '@/stores/search-store';

// Facebook Marketplace Storefront Awning Icon (Facebook Design)
function FacebookMarketplaceIcon({ active = false }: { active?: boolean }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M4 11v9a1 1 0 001 1h5v-6h4v6h5a1 1 0 001-1v-9H4z" />
        <path d="M21.4 8.2l-1.8-5.4A1 1 0 0018.65 2H5.35a1 1 0 00-.95.68L2.6 8.2a2 2 0 00.9 2.3 2.5 2.5 0 003 .5 2.5 2.5 0 003.5 0 2.5 2.5 0 003.5 0 2.5 2.5 0 003-.5 2 2 0 00.9-2.3z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-[1.8]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L5 3h14l2 6.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5a2.5 2.5 0 005 0 2.5 2.5 0 005 0 2.5 2.5 0 005 0 2.5 2.5 0 005 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a1 1 0 001 1h14a1 1 0 001-1v-8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 21v-6h4v6" />
    </svg>
  );
}

// Facebook-style Notification Bell Icon
function FacebookBellIcon({ active = false }: { active?: boolean }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-[1.8]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// Watchlist Radar Target Icon
function FacebookWatchlistIcon({ active = false }: { active?: boolean }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm0-13a5 5 0 100 10 5 5 0 000-10zm0 7a2 2 0 110-4 2 2 0 010 4z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-[1.8]">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

// Facebook-style Bookmark / Saved Ribbon Icon
function FacebookBookmarkIcon({ active = false }: { active?: boolean }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3.5 7 3.5V5c0-1.1-.9-2-2-2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-[1.8]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// Facebook-style Market Trends / Chart Icon
function FacebookTrendsIcon({ active = false }: { active?: boolean }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-[1.8]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 6l-9.5 9.5-5-5L1 18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 6h6v6" />
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

  // Mini rail items: Facebook icons & project routes, formatted in exact YouTube size & color
  const miniRailItems = [
    {
      href: '/',
      label: 'Marketplace',
      badge: false,
      icon: (active: boolean) => <FacebookMarketplaceIcon active={active} />,
      isActive: pathname === '/',
    },
    {
      href: '/alerts',
      label: 'Radar Alert',
      badge: true, // YouTube-style red dot indicator
      icon: (active: boolean) => <FacebookBellIcon active={active} />,
      isActive: pathname === '/alerts',
    },
    {
      href: '/watchlist',
      label: 'Pantauan',
      badge: false,
      icon: (active: boolean) => <FacebookWatchlistIcon active={active} />,
      isActive: pathname === '/watchlist',
    },
    {
      href: '/saved',
      label: 'Tersimpan',
      badge: false,
      icon: (active: boolean) => <FacebookBookmarkIcon active={active} />,
      isActive: pathname === '/saved',
    },
    {
      href: '/trends',
      label: 'Tren Pasar',
      badge: false,
      icon: (active: boolean) => <FacebookTrendsIcon active={active} />,
      isActive: pathname === '/trends',
    },
  ];

  // Drawer links
  const primaryLinks = [
    { 
      href: '/', 
      label: 'Marketplace (Feed)', 
      badge: null,
      icon: (active: boolean) => <FacebookMarketplaceIcon active={active} />,
    },
    { 
      href: '/alerts', 
      label: 'Radar Alert Deals', 
      badge: 'Live',
      icon: (active: boolean) => <FacebookBellIcon active={active} />,
    },
    { 
      href: '/watchlist', 
      label: 'Daftar Pantauan Target', 
      badge: null,
      icon: (active: boolean) => <FacebookWatchlistIcon active={active} />,
    },
    { 
      href: '/saved', 
      label: 'Barang Tersimpan', 
      badge: null,
      icon: (active: boolean) => <FacebookBookmarkIcon active={active} />,
    },
    { 
      href: '/trends', 
      label: 'Tren Harga Pasar', 
      badge: null,
      icon: (active: boolean) => <FacebookTrendsIcon active={active} />,
    },
  ];

  const exploreItems = [
    { name: 'Komputer & Laptop', icon: Laptop },
    { name: 'Handphone & Gadget', icon: Smartphone },
    { name: 'Monitor & Layar', icon: Tv },
    { name: 'Audio & Elektronik', icon: Headphones },
    { name: 'Kamera & Fotografi', icon: Camera },
    { name: 'Gaming & Konsol', icon: Gamepad2 },
  ];

  return (
    <>
      {/* 
        1. MINI SIDEBAR (RAIL)
        Fixed/Sticky on desktop (hidden on mobile), width 72px.
        Aligned with header hamburger button (center at x = 36px).
        Uses exact YouTube sizing (64x74 rounded-10px) and YouTube colors (#0F0F0F / #F1F1F1).
        Facebook Marketplace iconography tailored to DealHunter.
      */}
      <aside 
        aria-label="Navigasi DealHunter"
        className="hidden md:flex flex-col items-center w-[72px] shrink-0 sticky top-14 left-0 h-[calc(100vh-56px)] bg-card py-1 select-none z-30 overflow-y-auto"
      >
        <div className="flex flex-col items-center w-full gap-0.5">
          {miniRailItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative w-[64px] h-[74px] flex flex-col items-center justify-center rounded-[10px] my-0.5 mx-auto transition-all duration-150 ease-out cursor-pointer group active:scale-95 ${
                item.isActive
                  ? 'text-[#0F0F0F] dark:text-[#F1F1F1] font-semibold'
                  : 'text-[#0F0F0F] dark:text-[#F1F1F1] font-normal hover:bg-[#0000000D] dark:hover:bg-[#FFFFFF1A]'
              }`}
              title={item.label}
            >
              <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                {item.icon(item.isActive)}
                {item.badge && !item.isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF0000] ring-2 ring-card shadow-xs animate-pulse" />
                )}
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
        2. YOUTUBE-STYLE FULL SLIDING DRAWER (OVERLAY)
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
                    {link.badge && (
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FF0000] text-white">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <hr className="my-3 border-[#E5E5E5] dark:border-[#303030]" />

            {/* SECTION 2: Kategori FB Marketplace */}
            <div className="space-y-0.5">
              <div className="px-3 py-1 text-sm font-bold text-foreground">
                Kategori FB Marketplace
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

            {/* SECTION 3: Integrasi Bot Telegram & Sesi Facebook */}
            <div className="space-y-0.5">
              <div className="px-3 py-1 text-sm font-bold text-foreground">
                Integrasi & Pengaturan
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

            {/* SECTION 4: Footer */}
            <div className="px-3 py-2 text-[12px] text-[#606060] dark:text-[#AAAAAA] space-y-3 select-none">
              <div className="flex flex-wrap gap-x-2 gap-y-1 font-medium">
                <span>Tentang</span>
                <span>Marketplace</span>
                <span>Alert Telegram</span>
                <span>Privasi</span>
              </div>
              <div className="text-[11px] text-[#909090] dark:text-[#717171] pt-1">
                © 2026 DealHunter ID • FB Sniper
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
