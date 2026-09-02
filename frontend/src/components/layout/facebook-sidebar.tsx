'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Store, 
  Bookmark, 
  History, 
  Bell, 
  TrendingUp, 
  MapPin, 
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  Check,
  Tag,
  Smartphone,
  Car,
  Home,
  Tv,
  Gamepad2,
  Package
} from 'lucide-react';
import { useSearchStore } from '@/stores/search-store';
import { formatRupiah } from '@/lib/format';

interface FacebookSidebarProps {
  onApplyFilters?: () => void;
}

const POPULAR_CITIES = [
  'Jakarta',
  'Bandung',
  'Surabaya',
  'Semarang',
  'Yogyakarta',
  'Bekasi',
  'Tangerang',
  'Depok',
  'Medan',
  'Bali',
];

const CATEGORIES = [
  { label: 'Semua Kategori', value: 'Semua', icon: Package },
  { label: 'Elektronik & Gadget', value: 'Elektronik & Gadget', icon: Smartphone },
  { label: 'Kendaraan & Otomotif', value: 'Kendaraan & Otomotif', icon: Car },
  { label: 'Perabot Rumah Tangga', value: 'Perabot Rumah Tangga', icon: Home },
  { label: 'TV & Elektronik', value: 'Lainnya', icon: Tv },
  { label: 'Hobi & Game', value: 'Hobi & Olahraga', icon: Gamepad2 },
];

export function FacebookSidebar({ onApplyFilters }: FacebookSidebarProps) {
  const pathname = usePathname();
  const {
    location,
    radiusKm,
    minPrice,
    maxPrice,
    category,
    condition,
    setLocation,
    setRadiusKm,
    setPriceRange,
    setCategory,
    setCondition,
    resetFilters,
  } = useSearchStore();

  const [locEditOpen, setLocEditOpen] = useState(false);
  const [customCity, setCustomCity] = useState('');
  const [localMin, setLocalMin] = useState<string>(minPrice ? minPrice.toString() : '');
  const [localMax, setLocalMax] = useState<string>(maxPrice ? maxPrice.toString() : '');

  const navItems = [
    { href: '/', label: 'Jelajahi Semua', icon: Store },
    { href: '/alerts', label: 'Notifikasi & Alerts', icon: Bell },
    { href: '/watchlist', label: 'Watchlist Saya', icon: Bookmark },
    { href: '/saved', label: 'Pencarian Tersimpan', icon: History },
    { href: '/trends', label: 'Tren & Analisis Harga', icon: TrendingUp },
  ];

  const handleApplyPrice = () => {
    const min = localMin ? Number(localMin) : undefined;
    const max = localMax ? Number(localMax) : undefined;
    setPriceRange(min, max);
    onApplyFilters?.();
  };

  const handleSelectCategory = (cat: string) => {
    setCategory(cat);
    onApplyFilters?.();
  };

  const handleSelectCondition = (cond: string) => {
    setCondition(cond);
    onApplyFilters?.();
  };

  const handleReset = () => {
    resetFilters();
    setLocalMin('');
    setLocalMax('');
    onApplyFilters?.();
  };

  const hasActiveFilters = 
    minPrice !== undefined || 
    maxPrice !== undefined || 
    (category && category !== 'Semua') || 
    (condition && condition !== 'Semua');

  return (
    <aside className="w-full lg:w-[360px] bg-card border-r border-border shrink-0 flex flex-col h-auto lg:h-[calc(100vh-56px)] lg:sticky lg:top-14 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Marketplace</h1>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-secondary text-primary'
                    : 'text-foreground hover:bg-secondary/70'
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-primary text-white' : 'bg-secondary text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <hr className="border-border" />

        {/* Location Section (Facebook Style) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Lokasi</span>
            <button
              type="button"
              onClick={() => setLocEditOpen(!locEditOpen)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {locEditOpen ? 'Tutup' : 'Ubah'}
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground font-normal">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="text-foreground font-medium">{location || 'Jakarta'}</span>
            <span>·</span>
            <span>Dalam {radiusKm} km</span>
          </div>

          {/* Location Picker Accordion */}
          {locEditOpen && (
            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-3 mt-2 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Ketik Nama Kota</span>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="Contoh: Bandung, Surabaya..."
                    className="flex-1 h-8 px-2.5 rounded-md bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customCity.trim()) {
                        setLocation(customCity.trim());
                        setCustomCity('');
                        setLocEditOpen(false);
                        onApplyFilters?.();
                      }
                    }}
                    className="px-3 h-8 rounded-md bg-primary text-white font-semibold hover:bg-primary/90"
                  >
                    Set
                  </button>
                </div>
              </div>

              {/* Quick Select Popular Cities */}
              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Kota Populer</span>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setLocation(city);
                        setLocEditOpen(false);
                        onApplyFilters?.();
                      }}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        location === city
                          ? 'bg-primary text-white'
                          : 'bg-card hover:bg-secondary text-foreground border border-border'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Radius Slider */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Radius:</span>
                  <span className="font-semibold text-foreground">{radiusKm} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={radiusKm}
                  onChange={(e) => {
                    setRadiusKm(Number(e.target.value));
                    onApplyFilters?.();
                  }}
                  className="w-full accent-primary h-1.5 bg-border rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        <hr className="border-border" />

        {/* Filter Harga */}
        <div className="space-y-2">
          <span className="text-sm font-semibold text-foreground">Harga</span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Rp Min"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              className="w-full h-9 px-2.5 rounded-md bg-card border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Rp Max"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              className="w-full h-9 px-2.5 rounded-md bg-card border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleApplyPrice}
            className="w-full h-8 rounded-md bg-secondary hover:bg-muted text-foreground text-xs font-semibold transition-colors"
          >
            Terapkan Harga
          </button>
        </div>

        <hr className="border-border" />

        {/* Filter Kondisi */}
        <div className="space-y-2">
          <span className="text-sm font-semibold text-foreground">Kondisi Barang</span>
          <div className="flex flex-wrap gap-1.5">
            {['Semua', 'Baru', 'Bekas'].map((cond) => (
              <button
                key={cond}
                type="button"
                onClick={() => handleSelectCondition(cond)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  condition === cond || (cond === 'Semua' && (!condition || condition === 'Semua'))
                    ? 'bg-primary text-white font-semibold'
                    : 'bg-secondary hover:bg-muted text-foreground'
                }`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-border" />

        {/* Kategori List */}
        <div className="space-y-1">
          <span className="text-sm font-semibold text-foreground px-1 mb-1 block">Kategori</span>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.value || (cat.value === 'Semua' && (!category || category === 'Semua'));

            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => handleSelectCategory(cat.value)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
                  isSelected
                    ? 'bg-secondary text-primary font-semibold'
                    : 'text-foreground hover:bg-secondary/60 font-normal'
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="truncate flex-1">{cat.label}</span>
                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
