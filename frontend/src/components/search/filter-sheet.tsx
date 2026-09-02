'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchStore } from '@/stores/search-store';

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
}

const CATEGORIES = [
  'Semua',
  'Elektronik & Gadget',
  'Kendaraan & Otomotif',
  'Perabot Rumah Tangga',
  'Fashion & Aksesori',
  'Hobi & Olahraga',
  'Lainnya',
];

const CONDITIONS = [
  'Semua',
  'Bekas - Seperti Baru',
  'Bekas - Kondisi Baik',
  'Bekas - Wajar',
  'Baru - Segel Box',
];

export function FilterSheet({ open, onOpenChange, onApply }: FilterSheetProps) {
  const {
    minPrice,
    maxPrice,
    category,
    condition,
    sortBy,
    setPriceRange,
    setCategory,
    setCondition,
    setSortBy,
    resetFilters,
  } = useSearchStore();

  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  const handleReset = () => {
    resetFilters();
    onApply();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-6 overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-lg font-bold">Filter Pencarian</SheetTitle>
          <SheetDescription className="text-xs">
            Sesuaikan filter untuk menemukan deal terbaik di Facebook Marketplace
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 py-6 space-y-6">
          {/* Urutkan Berdasarkan */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Urutkan Berdasarkan</Label>
            <Select 
              value={sortBy} 
              onValueChange={(val) => {
                if (val) setSortBy(val);
              }}
            >
              <SelectTrigger className="w-full h-11 rounded-xl">
                <SelectValue placeholder="Pilih urutan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="deal_score">🔥 Deal Terbaik (% Potongan Terbesar)</SelectItem>
                <SelectItem value="price_asc">💵 Harga Terendah</SelectItem>
                <SelectItem value="price_desc">💎 Harga Tertinggi</SelectItem>
                <SelectItem value="date_desc">⏱️ Waktu Listing Terbaru</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rentang Harga */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-foreground">Rentang Harga (Rp)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Harga Minimum</span>
                <Input
                  type="number"
                  placeholder="Rp Min"
                  value={minPrice ?? ''}
                  onChange={(e) =>
                    setPriceRange(e.target.value ? Number(e.target.value) : undefined, maxPrice)
                  }
                  className="h-10 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Harga Maksimum</span>
                <Input
                  type="number"
                  placeholder="Rp Max"
                  value={maxPrice ?? ''}
                  onChange={(e) =>
                    setPriceRange(minPrice, e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="h-10 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Price Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: '< 1 Juta', min: undefined, max: 1000000 },
                { label: '1 - 3 Juta', min: 1000000, max: 3000000 },
                { label: '3 - 8 Juta', min: 3000000, max: 8000000 },
                { label: '> 10 Juta', min: 10000000, max: undefined },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setPriceRange(preset.min, preset.max)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-muted/60 hover:bg-muted text-foreground transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Kategori */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Kategori Barang</Label>
            <Select 
              value={category} 
              onValueChange={(val) => {
                if (val) setCategory(val);
              }}
            >
              <SelectTrigger className="w-full h-11 rounded-xl">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kondisi Barang */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Kondisi</Label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setCondition(cond)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    condition === cond
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-muted/70 hover:bg-muted text-foreground'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="pt-4 border-t flex flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="flex-1 h-11 rounded-xl text-xs font-medium"
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="flex-1 h-11 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Terapkan Filter
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
