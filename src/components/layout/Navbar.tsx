'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, Monitor, Menu, X, Video, Image, FileAudio,
  FileText, ScanText, Home, Info, Mail, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Video', href: '/video', icon: Video },
  { label: 'Audio', href: '/audio', icon: FileAudio },
  { label: 'Image', href: '/image', icon: Image },
  { label: 'PDF', href: '/pdf', icon: FileText },
  { label: 'OCR', href: '/ocr', icon: ScanText },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const ThemeIcon = () => {
    if (!mounted) return <Monitor className="w-5 h-5" />;
    if (theme === 'dark') return <Moon className="w-5 h-5" />;
    if (theme === 'light') return <Sun className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const themeLabel = !mounted ? 'System' : theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System';

  const isHome = pathname === '/';

  if (isHome) {
    // On the main landing page, the main central dashboard and top navigation are built directly into the scene.
    return null;
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-[#080808]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl'
            : 'bg-[#080808]/75 backdrop-blur-md border-b border-white/5'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#e0231c] to-[#ff3b34] flex items-center justify-center shadow-[0_0_20px_rgba(224,35,28,0.4)] group-hover:shadow-[0_0_30px_rgba(224,35,28,0.7)] transition-shadow duration-300">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight font-onest">
                <span className="text-white">Media</span>
                <span className="text-[#e0231c]">Convert</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                      isActive
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute inset-0 bg-[#e0231c]/15 border border-[#e0231c]/30 rounded-lg -z-10 shadow-[0_0_15px_rgba(224,35,28,0.25)]"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Action CTA + Theme + Mobile Menu Button */}
            <div className="flex items-center gap-3">
              <Link
                href="/video"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#e0231c] hover:bg-[#ff3b34] rounded-lg transition-all duration-200 shadow-[0_0_18px_rgba(224,35,28,0.4)] hover:shadow-[0_0_25px_rgba(224,35,28,0.6)]"
              >
                <span>Convert</span>
              </Link>

              <button
                onClick={cycleTheme}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-[#e0231c] hover:border-[#e0231c]/40 transition-all duration-200 hover:scale-105"
                title={`Theme: ${themeLabel}`}
              >
                <ThemeIcon />
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 transition-all duration-200"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-[min(85vw,340px)] bg-[#0c0c10]/98 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-lg font-bold font-onest">
                    <span className="text-white">Media</span>
                    <span className="text-[#e0231c]">Convert</span>
                  </span>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map((item, idx) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200',
                            isActive
                              ? 'bg-[#e0231c]/15 text-white border border-[#e0231c]/30 shadow-[0_0_15px_rgba(224,35,28,0.2)]'
                              : 'text-gray-300 hover:text-white hover:bg-white/5'
                          )}
                        >
                          <Icon className={cn('w-5 h-5', isActive ? 'text-[#e0231c]' : 'text-gray-400')} />
                          {item.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-semibold font-mono">Theme</p>
                  <div className="flex gap-2">
                    {[
                      { value: 'light', icon: Sun, label: 'Light' },
                      { value: 'dark', icon: Moon, label: 'Dark' },
                      { value: 'system', icon: Monitor, label: 'System' },
                    ].map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all',
                          theme === value
                            ? 'bg-[#e0231c] text-white shadow-[0_0_15px_rgba(224,35,28,0.4)]'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
