'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import KageBackground from './KageBackground';

export default function KageBackgroundWrapper() {
  const pathname = usePathname();
  // On the home page ('/'), KageLandingPage is already rendered with its full canvas.
  if (pathname === '/') return null;

  return <KageBackground />;
}
