'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Store,
  Bell,
  Radio,
  Bookmark,
  TrendingUp,
  Laptop,
  Smartphone,
  Tv,
  Headphones,
  Camera,
  Gamepad2,
  Send,
  KeyRound,
  Menu
} from 'lucide-react';
import { useSearchStore } from '@/stores/search-store';

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

  // Facebook-style Mini Rail Navigation (Tailored to DealHunter FB Project)
  const miniRailItems = [
    {
      href: '/',
      label: 'Marketplace',
      badge: null,
      icon: (active: boolean) => (
        <Store className={`w-5 h-5 ${active ? 'text-white stroke-[2.2]' : 'text-[#050505] dark:text-[#E4E6EB] stroke-[1.8]'}`} />
      ),
      isActive: pathname === '/',
    },
    {
      href: '/alerts',
      label: 'Radar Alert',
      badge: 'LIVE',
      icon: (active: boolean) => (
        <Bell className={`w-5 h-5 ${active ? 'text-white fill-current' : 'text-[#050505] dark:text-[#E4E6EB] stroke-[1.8]'}`} />
      ),
      isActive: pathname === '/alerts',
    },
    {
      href: '/watchlist',
      label: 'Pantauan',
      badge: null,
      icon: (active: boolean) => (
        <Radio className={`w-5 h-5 ${active ? 'text-white stroke-[2.2]' : 'text-[#050505] dark:text-[#E4E6EB] stroke-[1.8]'}`} />
      ),
      isActive: pathname === '/watchlist',
    },
    {
      href: '/saved',
      label: 'Tersimpan',
      badge: null,
      icon: (active: boolean) => (
        <Bookmark className={`w-5 h-5 ${active ? 'text-white fill-current' : 'text-[#050505] dark:text-[#E4E6EB] stroke-[1.8]'}`} />
      ),
      isActive: pathname === '/saved',
    },
    {
      href: '/trends',
      label: 'Tren Harga',
      badge: null,
      icon: (active: boolean) => (
        <TrendingUp className={`w-5 h-5 ${active ? 'text-white stroke-[2.2]' : 'text-[#050505] dark:text-[#E4E6EB] stroke-[1.8]'}`} />
      ),
      isActive: pathname === '/trends',
    },
  ];

  const primaryLinks = [
    { 
      href: '/', 
      label: 'Marketplace (Feed)', 
      icon: Store,
      badge: null,
    },
    { 
      href: '/alerts', 
      label: 'Radar Alert Deals', 
      icon: Bell,
      badge: 'Live',
    },
    { 
      href: '/watchlist', 
      label: 'Daftar Pantauan Target', 
      icon: Radio,
      badge: null,
    },
    { 
      href: '/saved', 
      label: 'Barang Tersimpan', 
      icon: Bookmark,
      badge: null,
    },
    { 
      href: '/trends', 
      label: 'Tren Harga Pasar', 
      icon: TrendingUp,
      badge: null,
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
        1. FACEBOOK-STYLE MINI SIDEBAR (RAIL)
        Fixed/Sticky on desktop (hidden on mobile), width 72px.
        Aligned with header hamburger button (center at x = 36px).
        Uses Facebook circular icon containers (w-10 h-10) with signature Facebook Blue (#1877F2).
      */}
      <aside 
        aria-label="Navigasi DealHunter"
        className="hidden md:flex flex-col items-center w-[72px] shrink-0 sticky top-14 left-0 h-[calc(100vh-56px)] bg-card py-2 select-none z-30 overflow-y-auto"
      >
        <div className="flex flex-col items-center w-full gap-1">
          {miniRailItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="w-[64px] py-1.5 flex flex-col items-center justify-center rounded-xl mx-auto transition-all duration-150 cursor-pointer group hover:bg-[#0000000A] dark:hover:bg-[#FFFFFF0D] active:scale-95"
              title={item.label}
            >
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                item.isActive 
                  ? 'bg-[#1877F2] text-white shadow-sm ring-2 ring-[#1877F2]/25' 
                  : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB] group-hover:bg-[#D8DADF] dark:group-hover:bg-[#4E4F50]'
              }`}>
                {item.icon(item.isActive)}
                {item.badge && !item.isActive && (
                  <span className="absolute -top-1 -right-1 bg-[#E41E3F] text-white text-[8px] font-bold px-1 py-0.2 rounded-full ring-2 ring-card shadow-xs animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] leading-[14px] text-center tracking-tight truncate w-full px-0.5 mt-1.5 transition-colors ${
                item.isActive 
                  ? 'text-[#1877F2] dark:text-[#2D88FF] font-semibold' 
                  : 'text-[#050505] dark:text-[#E4E6EB] font-medium'
              }`}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </aside>

      {/* 
        2. FACEBOOK-STYLE FULL SLIDING DRAWER (OVERLAY)
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
          className={`relative w-72 h-full bg-card shadow-2xl flex flex-col z-10 transition-transform duration-250 ease-[cubic-bezier(0.05,0.7,0.1,1.0)] transform ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header Drawer */}
          <div className="h-14 px-4 flex items-center gap-3 border-b border-[#E5E5E5] dark:border-[#303030] shrink-0">
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
              className="flex items-center gap-2 group select-none"
            >
              <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-xs">
                <Store className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground">
                Deal<span className="text-[#1877F2]">Hunter</span>
              </span>
              <span className="text-[10px] bg-[#E7F3FF] dark:bg-[#252F3E] text-[#1877F2] dark:text-[#2D88FF] font-semibold px-1.5 py-0.5 rounded-full ml-0.5">
                FB Radar
              </span>
            </Link>
          </div>

          {/* Scrollable Menu Content */}
          <div className="flex-1 overflow-y-auto px-3 py-3 select-none text-[14px] space-y-3">
            {/* SECTION 1: Navigasi Utama */}
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] uppercase tracking-wider">
                Navigasi Utama
              </div>
              {primaryLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center justify-between px-2.5 h-11 rounded-xl transition-all duration-150 ${
                      isActive
                        ? 'bg-[#E7F3FF] dark:bg-[#252F3E] text-[#1877F2] dark:text-[#2D88FF] font-semibold'
                        : 'text-foreground hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C]/50 active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isActive 
                          ? 'bg-[#1877F2] text-white shadow-xs' 
                          : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]'
                      }`}>
                        <Icon className={`w-4.5 h-4.5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                      </div>
                      <span className="truncate text-sm">{link.label}</span>
                    </div>
                    {link.badge && (
                      <span className="text-[10px] font-bold bg-[#E41E3F] text-white px-2 py-0.5 rounded-full shrink-0">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <hr className="border-[#E5E5E5] dark:border-[#303030]" />

            {/* SECTION 2: Kategori FB Marketplace */}
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] uppercase tracking-wider">
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
                    className={`w-full flex items-center gap-3 px-2.5 h-10 rounded-xl transition-all duration-150 text-left ${
                      isSelected
                        ? 'bg-[#E7F3FF] dark:bg-[#252F3E] text-[#1877F2] dark:text-[#2D88FF] font-semibold'
                        : 'text-foreground hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C]/50 active:scale-[0.98]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isSelected 
                        ? 'bg-[#1877F2] text-white shadow-xs' 
                        : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]'
                    }`}>
                      <Icon className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <span className="truncate text-sm">{item.name}</span>
                  </button>
                );
              })}
            </div>

            <hr className="border-[#E5E5E5] dark:border-[#303030]" />

            {/* SECTION 3: Integrasi & Status */}
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] uppercase tracking-wider">
                Integrasi & Status
              </div>

              <button
                type="button"
                onClick={() => {
                  onOpenTelegram?.();
                  setDrawerOpen(false);
                }}
                className="w-full flex items-center gap-3 px-2.5 h-11 rounded-xl text-foreground hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C]/50 transition-all duration-150 text-left active:scale-[0.98]"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  telegramConnected ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]'
                }`}>
                  <Send className="w-4.5 h-4.5 stroke-[1.8]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">Bot Telegram Alert</span>
                  <span className="text-[11px] text-[#65676B] dark:text-[#B0B3B8] truncate">
                    {telegramConnected ? '● Terhubung Aktif' : '○ Belum Terhubung'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenFacebook?.();
                  setDrawerOpen(false);
                }}
                className="w-full flex items-center gap-3 px-2.5 h-11 rounded-xl text-foreground hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C]/50 transition-all duration-150 text-left active:scale-[0.98]"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  facebookConnected ? 'bg-blue-100 text-[#1877F2] dark:bg-blue-950 dark:text-[#2D88FF]' : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-[#E4E6EB]'
                }`}>
                  <KeyRound className="w-4.5 h-4.5 stroke-[1.8]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">Sesi Akun Facebook</span>
                  <span className="text-[11px] text-[#65676B] dark:text-[#B0B3B8] truncate">
                    {facebookConnected ? '● Sesi Asli Aktif' : '○ Mode Tamu (Tanpa Akun)'}
                  </span>
                </div>
              </button>
            </div>

            <hr className="border-[#E5E5E5] dark:border-[#303030]" />

            {/* SECTION 4: Footer */}
            <div className="px-2 py-1 text-xs text-[#65676B] dark:text-[#B0B3B8] space-y-1 select-none">
              <div className="font-semibold text-foreground">
                DealHunter • FB Marketplace
              </div>
              <div>Pemantau & Notifikasi Deal Otomatis</div>
              <div className="text-[11px] text-[#8A8D91] pt-1">
                © 2026 DealHunter ID
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
