'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bookmark, Bell, History, TrendingUp } from 'lucide-react';

export function YouTubeBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/watchlist', label: 'Watchlist', icon: Bookmark },
    { href: '/alerts', label: 'Alerts', icon: Bell },
    { href: '/saved', label: 'Tersimpan', icon: History },
    { href: '/trends', label: 'Tren', icon: TrendingUp },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-[#E5E5E5] dark:border-[#303030] flex items-center justify-around h-13 px-2 select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
              isActive
                ? 'text-[#FF0000]'
                : 'text-[#606060] dark:text-[#AAAAAA] hover:text-foreground'
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-bold' : 'font-normal'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
