export function formatRupiah(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return 'Rp 0';
  return 'Rp ' + Math.round(val).toLocaleString('id-ID');
}

export function parseImages(imagesRaw: string): string[] {
  try {
    if (!imagesRaw) return [];
    const parsed = JSON.parse(imagesRaw);
    if (Array.isArray(parsed)) {
      return parsed.filter((url) => typeof url === 'string' && url.length > 0);
    }
  } catch {
    // fallback if it's already a single url
    if (imagesRaw.startsWith('http')) return [imagesRaw];
  }
  return [];
}

export function getDealBadgeInfo(rating: string, discount: number, score: number) {
  switch (rating) {
    case 'great_deal':
      return {
        label: discount > 0 ? `Hemat ${Math.round(discount)}% • Deal Terbaik` : 'Super Deal',
        variant: 'emerald' as const,
        bgClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400',
        dotColor: 'bg-emerald-500',
      };
    case 'good_deal':
      return {
        label: discount > 0 ? `Hemat ${Math.round(discount)}% • Harga Murah` : 'Harga Bagus',
        variant: 'blue' as const,
        bgClass: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-400',
        dotColor: 'bg-blue-500',
      };
    case 'fair_price':
      return {
        label: 'Harga Wajar',
        variant: 'amber' as const,
        bgClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400',
        dotColor: 'bg-amber-500',
      };
    case 'overpriced':
    default:
      return {
        label: 'Diatas Pasaran',
        variant: 'rose' as const,
        bgClass: 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-400',
        dotColor: 'bg-rose-500',
      };
  }
}

export function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return 'Baru saja';
  const date = new Date(dateStr);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffHours < 1) return 'Baru saja';
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
