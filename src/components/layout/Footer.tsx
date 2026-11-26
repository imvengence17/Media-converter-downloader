'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Github, Twitter, Heart } from 'lucide-react';

const footerLinks = {
  converters: [
    { label: 'Video Converter', href: '/video' },
    { label: 'Image Converter', href: '/image' },
    { label: 'Audio Converter', href: '/audio' },
    { label: 'PDF Tools', href: '/pdf' },
    { label: 'Image to Text', href: '/ocr' },
  ],
  tools: [
    { label: 'Image Compress', href: '/image?tool=compress' },
    { label: 'Merge PDF', href: '/pdf?tool=merge' },
    { label: 'Extract Audio', href: '/video?tool=extract-audio' },
    { label: 'Image Resize', href: '/image?tool=resize' },
    { label: 'PDF to Image', href: '/pdf?tool=pdf-to-image' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/about#privacy' },
    { label: 'Terms of Service', href: '/about#terms' },
  ],
};

export default function Footer() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <footer className="bg-[#080808] border-t border-white/10 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 lg:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#e0231c] to-[#ff3b34] flex items-center justify-center shadow-[0_0_20px_rgba(224,35,28,0.4)]">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-onest">
                Media<span className="text-[#e0231c]">Convert</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 font-light">
              High-performance media conversion platform. Transcode videos, images, audio, and documents with precision and zero cloud exposure.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Converters */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Converters</h3>
            <ul className="space-y-2.5">
              {footerLinks.converters.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-pink-primary transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Popular Tools</h3>
            <ul className="space-y-2.5">
              {footerLinks.tools.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-pink-primary transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-pink-primary transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Centered Legal Advisory & License */}
        <div className="py-6 border-t border-white/10">
          <div className="max-w-3xl mx-auto px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/15 text-center space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e0231c]">
              Legal Advisory &amp; License
            </p>
            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
              MediaConvert is provided strictly for personal, educational, and authorized media conversion. Users are solely responsible for ensuring they hold the rights or permission to process or download any files or URLs and must comply with all applicable copyright laws and platform terms of service.
            </p>
            <p className="text-xs font-medium text-white pt-1">
              MIT License · © {new Date().getFullYear()} MediaConvert · All Rights Reserved
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-5 border-t border-white/10 flex flex-col items-center justify-center text-center gap-2">
          <p className="text-sm text-gray-300">
            © {new Date().getFullYear()} MediaConvert. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-pink-primary fill-pink-primary" /> for the web
          </p>
        </div>
      </div>
    </footer>
  );
}
