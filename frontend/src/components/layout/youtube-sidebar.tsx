'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Bookmark, 
  History, 
  Bell, 
  Smartphone, 
  Laptop, 
  Car, 
  Armchair, 
  Gamepad2, 
  Send,
  Play,
  KeyRound,
  Flame,
  ChevronRight,
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

  const primaryLinks = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/alerts', label: 'Price Alerts', icon: Bell },
  ];

  const personalLinks = [
    { href: '/watchlist', label: 'Watchlist Saya', icon: Bookmark },
    { href: '/saved', label: 'Pencarian Tersimpan', icon: History },
  ];

  const exploreItems = [
    { href: '/trends', label: 'Tren Pasar Terkini', icon: Flame, isLink: true },
    { name: 'Elektronik & Gadget', icon: Smartphone },
    { name: 'Komputer & Laptop', icon: Laptop },
    { name: 'Kendaraan & Otomotif', icon: Car },
    { name: 'Perabot Rumah Tangga', icon: Armchair },
    { name: 'Hobi & Olahraga', icon: Gamepad2 },
  ];

  const sidebarMenuItems = (
    <div className="flex flex-col gap-0 text-[14px]">
      {/* SECTION 1: Navigasi Utama */}
      <div className="space-y-0.5">
        {primaryLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-6 px-3 h-10 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'bg-[#F2F2F2] dark:bg-[#272727] text-[#0F0F0F] dark:text-[#F1F1F1] font-semibold'
                  : 'text-foreground hover:bg-[#F2F2F2] dark:hover:bg-[#272727] active:scale-[0.98]'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-[#FF0000] stroke-[2.5]' : 'stroke-[1.8]'}`} />
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
              className={`flex items-center gap-6 px-3 h-10 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'bg-[#F2F2F2] dark:bg-[#272727] text-[#0F0F0F] dark:text-[#F1F1F1] font-semibold'
                  : 'text-foreground hover:bg-[#F2F2F2] dark:hover:bg-[#272727] active:scale-[0.98]'
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

        {exploreItems.map((item: any) => {
          const Icon = item.icon;
          if (item.isLink) {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-6 px-3 h-10 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-[#F2F2F2] dark:bg-[#272727] text-[#0F0F0F] dark:text-[#F1F1F1] font-semibold'
                    : 'text-foreground hover:bg-[#F2F2F2] dark:hover:bg-[#272727] active:scale-[0.98]'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-[#FF0000]' : 'text-foreground'}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          }

          const isSelected = category === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => {
                setCategory(item.name);
                setDrawerOpen(false);
              }}
              className={`w-full flex items-center gap-6 px-3 h-10 rounded-xl transition-all duration-150 text-left ${
                isSelected
                  ? 'bg-[#F2F2F2] dark:bg-[#272727] text-[#FF0000] font-semibold'
                  : 'text-foreground hover:bg-[#F2F2F2] dark:hover:bg-[#272727] active:scale-[0.98]'
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
          className="w-full flex items-center gap-6 px-3 h-10 rounded-xl text-foreground hover:bg-[#F2F2F2] dark:hover:bg-[#272727] transition-all duration-150 text-left active:scale-[0.98]"
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
          className="w-full flex items-center gap-6 px-3 h-10 rounded-xl text-foreground hover:bg-[#F2F2F2] dark:hover:bg-[#272727] transition-all duration-150 text-left active:scale-[0.98]"
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
  );

  return (
    /* 
      YOUTUBE SLIDE-OVER DRAWER ONLY
      Saat tidak diklik menu: TIDAK ADA ICON SAMA SEKALI di samping layar!
      Saat diklik menu: Meluncur mulus dari kiri dan seluruh layar menjadi abu-abu (dimmed)!
    */
    <div 
      className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out ${
        drawerOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
      }`}
    >
      {/* Greyed-out backdrop overlay */}
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-out cursor-pointer ${
          drawerOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Sliding Menu Drawer */}
      <div 
        className={`relative w-64 h-full bg-card shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-out transform ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Drawer */}
        <div className="h-14 px-4 flex items-center gap-4 border-b border-[#E5E5E5] dark:border-[#303030] shrink-0">
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="h-10 w-10 rounded-full hover:bg-[#F2F2F2] dark:hover:bg-[#272727] text-foreground flex items-center justify-center cursor-pointer transition-colors"
            title="Tutup Menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
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
        <div className="flex-1 overflow-y-auto px-3 py-3 select-none">
          {sidebarMenuItems}
        </div>
      </div>
    </div>
  );
}
