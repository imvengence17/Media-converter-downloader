'use client';

import React from 'react';

export default function KageBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <iframe
        src="/landing-pages/kage.html?bg=1"
        title="Animated Background"
        tabIndex={-1}
        className="w-full h-full border-0 pointer-events-none"
        style={{
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          inset: 0,
          border: 'none',
          pointerEvents: 'none',
        }}
      />
      {/* Subtle darkening so dashboard cards and controls are clear and high-contrast */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
    </div>
  );
}
