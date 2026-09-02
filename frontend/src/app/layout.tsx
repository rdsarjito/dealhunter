import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'DealHunter — Facebook Marketplace Deal Finder',
  description: 'Temukan barang murah dan pantau deal terbaik di Facebook Marketplace secara real-time.',
  keywords: ['facebook marketplace', 'deal finder', 'reseller', 'barang murah', 'indonesia'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="min-h-screen bg-background text-foreground font-sans selection:bg-[#FF0000] selection:text-white">
        {children}
      </body>
    </html>
  );
}
