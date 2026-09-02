'use client';

interface DealBadgeProps {
  rating?: string;
  discount?: number;
  score?: number;
}

export function DealBadge({ rating, discount }: DealBadgeProps) {
  if (!rating || rating === 'fair_price') {
    return null;
  }

  if (rating === 'great_deal') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#FF0000] text-white shadow-xs">
        {discount && discount > 0 ? `DEAL -${Math.round(discount)}%` : 'SUPER DEAL'}
      </span>
    );
  }

  if (rating === 'good_deal') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0F0F0F] text-white dark:bg-[#FFFFFF] dark:text-[#0F0F0F] shadow-xs">
        {discount && discount > 0 ? `-${Math.round(discount)}%` : 'MURAH'}
      </span>
    );
  }

  if (rating === 'overpriced') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-[#606060] text-white shadow-xs">
        DIATAS PASAR
      </span>
    );
  }

  return null;
}
