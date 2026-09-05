'use client';

import { useState } from 'react';
import { 
  Search, 
  MapPin, 
  SlidersHorizontal, 
  RefreshCw, 
  RotateCcw
} from 'lucide-react';
import { useSearchStore } from '@/stores/search-store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface MinimalFilterDockProps {
  onSearch: (live?: boolean) => void;
  isLoading?: boolean;
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
  'Semua',
  'Elektronik & Gadget',
  'Kendaraan & Otomotif',
  'Perabot Rumah Tangga',
  'TV & Audio',
  'Hobi & Olahraga',
  'Komputer & Laptop',
  'Handphone',
];

export function MinimalFilterDock({ onSearch, isLoading }: MinimalFilterDockProps) {
  const {
    keyword,
    location,
    radiusKm,
    minPrice,
    maxPrice,
    category,
    condition,
    setKeyword,
    setLocation,
    setRadiusKm,
    setPriceRange,
    setCategory,
    setCondition,
    resetFilters,
  } = useSearchStore();

  const [filterExpanded, setFilterExpanded] = useState(false);
  const [localMin, setLocalMin] = useState(minPrice ? minPrice.toString() : '');
  const [localMax, setLocalMax] = useState(maxPrice ? maxPrice.toString() : '');
  const [customCity, setCustomCity] = useState('');
  const [locPopoverOpen, setLocPopoverOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(false);
  };

  const handleApplyPrice = () => {
    const min = localMin ? Number(localMin) : undefined;
    const max = localMax ? Number(localMax) : undefined;
    setPriceRange(min, max);
    onSearch(false);
  };

  const handleCategoryClick = (cat: string) => {
    setCategory(cat);
    onSearch(false);
  };

  const handleConditionClick = (cond: string) => {
    setCondition(cond);
    onSearch(false);
  };

  const handleReset = () => {
    resetFilters();
    setLocalMin('');
    setLocalMax('');
    onSearch(false);
  };

  const hasActiveFilters = 
    minPrice !== undefined || 
    maxPrice !== undefined || 
    (category && category !== 'Semua') || 
    (condition && condition !== 'Semua');

  return (
    <div className="w-full space-y-3">
      {/* Mobile Search Input */}
      <form onSubmit={handleSubmit} className="flex sm:hidden items-center gap-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Cari barang..."
            className="w-full h-10 px-3.5 rounded-full border border-[#303030] bg-[#121212] text-xs text-[#F1F1F1] focus:outline-none focus:border-[#1C62B9]"
          />
        </div>
        <button
          type="submit"
          className="h-10 px-4 rounded-full bg-[#272727] text-[#F1F1F1] text-xs font-semibold"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      {/* Sub-bar: YouTube Category Chips + Location & Filters */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Exact YouTube Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat || (cat === 'Semua' && (!category || category === 'Semua'));
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-[#F1F1F1] text-[#0F0F0F] font-semibold shadow-xs'
                    : 'bg-[#272727] hover:bg-[#3F3F3F] text-[#F1F1F1]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Location Picker Pill */}
          <Popover open={locPopoverOpen} onOpenChange={setLocPopoverOpen}>
            <PopoverTrigger
              type="button"
              className="h-8 px-3 rounded-lg border border-[#303030] bg-[#272727] text-[#F1F1F1] text-xs font-medium flex items-center gap-1.5 hover:bg-[#3F3F3F] transition-colors cursor-pointer"
            >
              <MapPin className="h-3 w-3 text-[#FF0000]" />
              <span>{location || 'Jakarta'}</span>
              <span className="text-[#AAAAAA] text-[11px]">({radiusKm}km)</span>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 rounded-xl border border-[#303030] bg-[#181818] text-[#F1F1F1] shadow-2xl space-y-3" align="end">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#F1F1F1]">Pilih Lokasi</span>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="Nama kota..."
                    className="flex-1 h-8 px-2.5 rounded-lg bg-[#272727] border border-[#303030] text-xs text-[#F1F1F1] focus:outline-none focus:border-[#1C62B9]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customCity.trim()) {
                        setLocation(customCity.trim());
                        setCustomCity('');
                        setLocPopoverOpen(false);
                        onSearch(false);
                      }
                    }}
                    className="px-3 h-8 rounded-lg bg-[#FF0000] text-white text-xs font-semibold hover:bg-[#CC0000]"
                  >
                    Set
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {POPULAR_CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setLocation(city);
                      setLocPopoverOpen(false);
                      onSearch(false);
                    }}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      location === city
                        ? 'bg-[#FF0000] text-white font-semibold'
                        : 'bg-[#272727] text-[#F1F1F1] hover:bg-[#3F3F3F]'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>

              <div className="space-y-1 pt-2 border-t border-[#303030]">
                <div className="flex justify-between text-xs text-[#AAAAAA]">
                  <span>Radius Jarak:</span>
                  <span className="font-semibold text-[#F1F1F1]">{radiusKm} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={radiusKm}
                  onChange={(e) => {
                    setRadiusKm(Number(e.target.value));
                    onSearch(false);
                  }}
                  className="w-full accent-[#FF0000] h-1.5 bg-[#303030] rounded-lg cursor-pointer"
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Filter Toggle */}
          <button
            type="button"
            onClick={() => setFilterExpanded(!filterExpanded)}
            className={`h-8 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              filterExpanded || hasActiveFilters
                ? 'border-[#F1F1F1] bg-[#F1F1F1] text-[#0F0F0F] font-semibold'
                : 'border-[#303030] bg-[#272727] text-[#F1F1F1] hover:bg-[#3F3F3F]'
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>Filter</span>
          </button>

          {/* YouTube Red Live Scrape Button */}
          <button
            type="button"
            onClick={() => onSearch(true)}
            disabled={isLoading}
            className="h-8 px-3.5 rounded-lg bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Scrape FB</span>
          </button>
        </div>
      </div>

      {/* Expanded Filter Box */}
      {filterExpanded && (
        <div className="p-3.5 rounded-xl border border-[#303030] bg-[#181818] space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#303030]">
            <span className="font-semibold text-[#F1F1F1]">Filter Lanjutan</span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium text-[#AAAAAA] hover:text-[#F1F1F1] flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[#AAAAAA] font-medium">Rentang Harga (Rp)</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Min"
                  value={localMin}
                  onChange={(e) => setLocalMin(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg bg-[#272727] border border-[#303030] text-xs text-[#F1F1F1] tabular-price"
                />
                <span className="text-[#AAAAAA]">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={localMax}
                  onChange={(e) => setLocalMax(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg bg-[#272727] border border-[#303030] text-xs text-[#F1F1F1] tabular-price"
                />
                <button
                  type="button"
                  onClick={handleApplyPrice}
                  className="px-3 h-8 rounded-lg bg-[#3F3F3F] hover:bg-[#505050] text-[#F1F1F1] font-semibold text-xs shrink-0"
                >
                  OK
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[#AAAAAA] font-medium">Kondisi Barang</span>
              <div className="flex gap-1">
                {['Semua', 'Baru', 'Bekas'].map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => handleConditionClick(cond)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      condition === cond || (cond === 'Semua' && (!condition || condition === 'Semua'))
                        ? 'bg-[#F1F1F1] text-[#0F0F0F] font-semibold'
                        : 'bg-[#272727] text-[#AAAAAA] hover:text-[#F1F1F1] hover:bg-[#3F3F3F]'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
