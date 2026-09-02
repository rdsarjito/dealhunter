'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { YouTubeSidebar } from '@/components/layout/youtube-sidebar';
import { YouTubeBottomNav } from '@/components/layout/youtube-bottom-nav';
import { TelegramSettingsModal } from '@/components/telegram/telegram-settings-modal';
import { formatRupiah } from '@/lib/format';
import { 
  TrendingUp, 
  Info
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const SAMPLE_TRENDS: Record<string, {
  avgPrice: number;
  dealThreshold: number;
  data: { month: string; avg: number; bestDeal: number }[];
  insights: string;
}> = {
  'iPhone 13': {
    avgPrice: 7500000,
    dealThreshold: 6200000,
    data: [
      { month: 'Apr', avg: 8200000, bestDeal: 7100000 },
      { month: 'Mei', avg: 7900000, bestDeal: 6800000 },
      { month: 'Jun', avg: 7700000, bestDeal: 6500000 },
      { month: 'Jul', avg: 7600000, bestDeal: 6400000 },
      { month: 'Agt', avg: 7500000, bestDeal: 6200000 },
      { month: 'Sep', avg: 7400000, bestDeal: 6100000 },
    ],
    insights: 'Harga iPhone 13 di FB Marketplace stabil di kisaran Rp 7.2jt - Rp 7.6jt. Deal terbaik biasanya muncul di bawah Rp 6.3jt dari penjual yang butuh dana cepat (BU).',
  },
  'MacBook Air M1': {
    avgPrice: 8400000,
    dealThreshold: 7200000,
    data: [
      { month: 'Apr', avg: 9100000, bestDeal: 8000000 },
      { month: 'Mei', avg: 8900000, bestDeal: 7800000 },
      { month: 'Jun', avg: 8700000, bestDeal: 7600000 },
      { month: 'Jul', avg: 8500000, bestDeal: 7400000 },
      { month: 'Agt', avg: 8400000, bestDeal: 7300000 },
      { month: 'Sep', avg: 8300000, bestDeal: 7150000 },
    ],
    insights: 'MacBook Air M1 tetap menjadi laptop paling likuid di FB Marketplace. Jika menemukan unit dengan battery health > 85% di harga Rp 7.3jt, langsung ambil karena cepat laku.',
  },
  'PlayStation 5': {
    avgPrice: 6200000,
    dealThreshold: 5300000,
    data: [
      { month: 'Apr', avg: 6900000, bestDeal: 6000000 },
      { month: 'Mei', avg: 6700000, bestDeal: 5800000 },
      { month: 'Jun', avg: 6500000, bestDeal: 5600000 },
      { month: 'Jul', avg: 6400000, bestDeal: 5500000 },
      { month: 'Agt', avg: 6300000, bestDeal: 5400000 },
      { month: 'Sep', avg: 6200000, bestDeal: 5250000 },
    ],
    insights: 'Varian PS5 Disc lebih stabil harganya. Model digital cenderung turun lebih cepat. Batas deal terbaik saat ini berada di Rp 5.2jt - Rp 5.4jt.',
  },
  'Honda Vario 160': {
    avgPrice: 22500000,
    dealThreshold: 20000000,
    data: [
      { month: 'Apr', avg: 24000000, bestDeal: 21500000 },
      { month: 'Mei', avg: 23800000, bestDeal: 21000000 },
      { month: 'Jun', avg: 23500000, bestDeal: 20800000 },
      { month: 'Jul', avg: 23000000, bestDeal: 20500000 },
      { month: 'Agt', avg: 22700000, bestDeal: 20200000 },
      { month: 'Sep', avg: 22500000, bestDeal: 19800000 },
    ],
    insights: 'Unit Vario 160 tahun 2022-2023 dengan surat lengkap (BPKB & STNK hidup) di bawah Rp 20jt adalah hot deal untuk flip atau pakai pribadi.',
  },
};

export default function TrendsPage() {
  const [selectedProduct, setSelectedProduct] = useState('iPhone 13');
  const [telegramOpen, setTelegramOpen] = useState(false);
  const currentTrend = SAMPLE_TRENDS[selectedProduct];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-14 md:pb-0">
      <Navbar
        onOpenTelegram={() => setTelegramOpen(true)}
      />

      <div className="flex-1 flex flex-row w-full min-h-[calc(100vh-56px)]">
        <YouTubeSidebar
          onOpenTelegram={() => setTelegramOpen(true)}
        />

        <main className="flex-1 min-w-0 w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-6 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <div className="h-6 w-8 rounded-lg bg-[#FF0000] text-white flex items-center justify-center shadow-xs">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <span>Tren & Analisis Harga Pasar</span>
            </h1>
            <p className="text-xs text-[#606060] dark:text-[#AAAAAA]">
              Pergerakan harga rata-rata dan batas deal termurah di Facebook Marketplace
            </p>
          </div>

          {/* Product Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {Object.keys(SAMPLE_TRENDS).map((prod) => (
              <button
                key={prod}
                type="button"
                onClick={() => setSelectedProduct(prod)}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold transition-colors ${
                  selectedProduct === prod
                    ? 'bg-[#0F0F0F] dark:bg-[#F1F1F1] text-white dark:text-[#0F0F0F]'
                    : 'bg-[#F2F2F2] dark:bg-[#272727] text-foreground hover:bg-[#E5E5E5]'
                }`}
              >
                {prod}
              </button>
            ))}
          </div>

          {/* Main Chart Card */}
          <div className="p-6 rounded-2xl border border-[#E5E5E5] dark:border-[#303030] bg-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E5E5E5] dark:border-[#303030]">
              <div>
                <span className="text-xs text-[#606060] dark:text-[#AAAAAA]">Tren 6 Bulan Terakhir</span>
                <h2 className="text-xl font-bold text-foreground tracking-tight">{selectedProduct}</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#F2F2F2] dark:bg-[#272727] border border-[#E5E5E5] dark:border-[#303030] text-right">
                  <span className="text-[11px] text-[#606060] dark:text-[#AAAAAA] block">Rata-Rata Saat Ini</span>
                  <div className="text-sm font-bold text-foreground tabular-price">
                    {formatRupiah(currentTrend.avgPrice)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FFF0F0] dark:bg-[#2B1414] border border-[#FF0000]/30 text-right">
                  <span className="text-[11px] text-[#FF0000] font-bold block">Batas Deal Murah</span>
                  <div className="text-sm font-black text-[#FF0000] tabular-price">
                    &lt; {formatRupiah(currentTrend.dealThreshold)}
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={currentTrend.data}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#888888" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#888888" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDeal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF0000" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF0000" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: '#888888' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#888888' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}jt`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #E5E5E5',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                      backgroundColor: '#FFFFFF',
                      color: '#0F0F0F'
                    }}
                    formatter={(val: any) => [formatRupiah(val), '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="avg"
                    name="Harga Rata-rata"
                    stroke="#888888"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAvg)"
                  />
                  <Area
                    type="monotone"
                    dataKey="bestDeal"
                    name="Deal Termurah"
                    stroke="#FF0000"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorDeal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Insights Section */}
            <div className="p-4 rounded-xl bg-[#F2F2F2] dark:bg-[#272727] border border-[#E5E5E5] dark:border-[#303030] flex gap-3 items-start text-xs">
              <Info className="h-4 w-4 text-[#FF0000] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-foreground block">Insight Reseller DealHunter:</span>
                <p className="text-[#606060] dark:text-[#AAAAAA] leading-relaxed">
                  {currentTrend.insights}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <YouTubeBottomNav />

      <TelegramSettingsModal
        open={telegramOpen}
        onOpenChange={setTelegramOpen}
      />
    </div>
  );
}
