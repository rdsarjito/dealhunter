'use client';

import { useState } from 'react';
import { 
  Search, 
  MapPin, 
  SlidersHorizontal, 
  RefreshCw, 
  Sparkles,
  Compass
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { useSearchStore } from '@/stores/search-store';

interface SearchBarProps {
  onSearch: (live?: boolean) => void;
  isLoading?: boolean;
  onOpenFilters: () => void;
  activeFilterCount?: number;
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

const POPULAR_SEARCHES = [
  'iPhone 13',
  'MacBook Air M1',
  'PlayStation 5',
  'Sepeda Lipat',
  'Kursi Gaming',
  'Meja Kerja',
  'Honda Vario',
];

export function SearchBar({ onSearch, isLoading, onOpenFilters, activeFilterCount = 0 }: SearchBarProps) {
  const { keyword, location, radiusKm, setKeyword, setLocation, setRadiusKm } = useSearchStore();
  const [locOpen, setLocOpen] = useState(false);
  const [customLocInput, setCustomLocInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Main Search Bar Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 items-stretch">
        {/* Search Keyword Input */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Cari barang apa saja di FB Marketplace (misal: iPhone 13, Sepeda)..."
            className="pl-10 h-12 rounded-xl text-base bg-card/60 backdrop-blur-md border-border/70 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 shadow-xs"
          />
        </div>

        {/* Location & Radius Picker Popover */}
        <Popover open={locOpen} onOpenChange={setLocOpen}>
          <PopoverTrigger
            type="button"
            className="h-12 px-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-md flex items-center justify-between gap-2.5 sm:w-56 text-sm font-medium hover:border-emerald-500/50 active:scale-[0.96] transition-all cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 truncate">
              <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="truncate">{location || 'Pilih Lokasi'}</span>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md shrink-0">
              {radiusKm}km
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 rounded-2xl border-border/70 shadow-xl" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Compass className="h-4 w-4 text-emerald-500" />
                  <span>Pilih Lokasi & Radius</span>
                </div>
                <span className="text-xs text-muted-foreground">FB Marketplace</span>
              </div>

              {/* Custom City Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Cari Kota / Wilayah Lain</label>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Nama kota/kabupaten..."
                    value={customLocInput}
                    onChange={(e) => setCustomLocInput(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (customLocInput.trim()) {
                          setLocation(customLocInput.trim());
                          setCustomLocInput('');
                          setLocOpen(false);
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 px-3 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      if (customLocInput.trim()) {
                        setLocation(customLocInput.trim());
                        setCustomLocInput('');
                        setLocOpen(false);
                      }
                    }}
                  >
                    Pilih
                  </Button>
                </div>
              </div>

              {/* Quick Select Popular Indonesian Cities */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Kota Populer</label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setLocation(city);
                        setLocOpen(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        location === city
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-muted/70 hover:bg-muted text-foreground'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Radius Slider */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Jarak Radius Pencarian</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{radiusKm} km</span>
                </div>
                <Slider
                  value={[radiusKm]}
                  min={5}
                  max={100}
                  step={5}
                  onValueChange={(val) => {
                    if (Array.isArray(val)) {
                      setRadiusKm(val[0]);
                    } else if (typeof val === 'number') {
                      setRadiusKm(val);
                    }
                  }}
                  className="py-1"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Filter Toggle Button */}
        <Button
          type="button"
          variant="outline"
          onClick={onOpenFilters}
          className="h-12 px-3.5 rounded-xl border-border/70 bg-card/60 backdrop-blur-md relative active:scale-[0.96] transition-all"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden md:inline text-sm">Filter</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Live Scrape Quick Button */}
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() => onSearch(true)}
          title="Scrape data langsung dari Facebook Marketplace detik ini juga"
          className="h-12 px-3 rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white active:scale-[0.96] transition-all flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={"h-3.5 w-3.5 " + (isLoading ? "animate-spin" : "")} />
          <span className="hidden sm:inline">Scrape FB</span>
        </Button>

        {/* Search Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="h-12 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 active:scale-[0.96] transition-all flex items-center gap-2"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span>Cari Deals</span>
        </Button>
      </form>

      {/* Quick Search Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-muted-foreground font-medium shrink-0">Populer:</span>
        {POPULAR_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => {
              setKeyword(term);
              setTimeout(() => onSearch(false), 50);
            }}
            className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-foreground/80 hover:text-foreground font-medium whitespace-nowrap transition-colors active:scale-[0.96]"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
