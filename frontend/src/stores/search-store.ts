import { create } from 'zustand';

interface SearchState {
  keyword: string;
  location: string;
  radiusKm: number;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  category: string;
  condition: string;
  sortBy: string;
  drawerOpen: boolean;
  sidebarOpen: boolean;
  setKeyword: (keyword: string) => void;
  setLocation: (location: string) => void;
  setRadiusKm: (radius: number) => void;
  setPriceRange: (min?: number, max?: number) => void;
  setCategory: (category: string) => void;
  setCondition: (condition: string) => void;
  setSortBy: (sortBy: string) => void;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  resetFilters: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  keyword: 'iPhone 13',
  location: 'Jakarta',
  radiusKm: 50,
  minPrice: undefined,
  maxPrice: undefined,
  category: 'Semua',
  condition: 'Semua',
  sortBy: 'deal_score',
  drawerOpen: false,
  sidebarOpen: false,
  setKeyword: (keyword) => set({ keyword }),
  setLocation: (location) => set({ location }),
  setRadiusKm: (radiusKm) => set({ radiusKm }),
  setPriceRange: (minPrice, maxPrice) => set({ minPrice, maxPrice }),
  setCategory: (category) => set({ category }),
  setCondition: (condition) => set({ condition }),
  setSortBy: (sortBy) => set({ sortBy }),
  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  resetFilters: () =>
    set({
      minPrice: undefined,
      maxPrice: undefined,
      category: 'Semua',
      condition: 'Semua',
      sortBy: 'deal_score',
    }),
}));
