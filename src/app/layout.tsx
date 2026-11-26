import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import KageBackgroundWrapper from '@/components/layout/KageBackgroundWrapper';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#080808',
};

export const metadata: Metadata = {
  title: 'MediaConvert - All-in-One Media Converter',
  description: 'Convert videos, images, audio, and documents effortlessly. Fast, secure, and simple.',
  keywords: ['media converter', 'video converter', 'image converter', 'audio converter', 'pdf tools', 'ocr'],
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col bg-[#080808] text-gray-100 relative`}>
        <ThemeProvider>
          <KageBackgroundWrapper />
          <Navbar />
          <main className="flex-1 relative z-10 bg-transparent">
            {children}
          </main>
          <Footer />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--toast-bg, #fff)',
                border: '1px solid var(--toast-border, #e5e7eb)',
                color: 'var(--toast-color, #1f2937)',
              },
              className: 'dark:!bg-navy-900 dark:!border-gray-700 dark:!text-gray-100',
            }}
            richColors
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
