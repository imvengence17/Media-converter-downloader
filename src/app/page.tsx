'use client';

import React from 'react';
import { KageLandingPage } from '@designcodeio/threeui';
import '@designcodeio/threeui/style.css';

export default function Home() {
  return (
    <div className="relative w-full h-screen h-[100dvh] overflow-hidden bg-[#080808]">
      <div className="shader-frame">
        <KageLandingPage
          headingFont="onest"
          bodyFont="onest"
          headingWeight="400"
          bodyWeight="300"
          primaryColor="#e0231c"
          headingSize={46}
          bodySize={17}
          headingLetterSpacing={-0.012}
        />
      </div>
    </div>
  );
}
