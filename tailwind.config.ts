import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f5f5f7',
          100: '#e5e5eb',
          200: '#cbcbda',
          300: '#a4a4be',
          400: '#757597',
          500: '#4e4e6f',
          600: '#34344e',
          700: '#232336',
          800: '#151520',
          900: '#0c0c10',
          950: '#060608',
        },
        kage: {
          vermilion: '#e0231c',
          'vermilion-light': '#ff3b34',
          'vermilion-dark': '#b81712',
          charred: '#080808',
          cypress: '#121214',
          ash: '#1e1e24',
          gold: '#c99b53',
          ink: '#030304',
        },
        pink: {
          primary: '#e0231c',
          light: '#ff3b34',
          dark: '#b81712',
          50: '#fff1f0',
          100: '#ffe1df',
          200: '#ffc7c4',
          300: '#ffa19c',
          400: '#ff6f68',
          500: '#e0231c',
          600: '#c71c16',
          700: '#a31510',
          800: '#83140f',
          900: '#6d1612',
        },
        surface: {
          light: '#F5F7FC',
          dark: '#080F20',
        },
      },
      fontFamily: {
        sans: ['Onest', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        onest: ['Onest', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.65)',
        glow: '0 0 24px rgba(224, 35, 28, 0.45)',
        'glow-lg': '0 0 48px rgba(224, 35, 28, 0.65)',
        'kage-card': '0 12px 40px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'kage-glow': '0 0 30px rgba(224, 35, 28, 0.35)',
      },
      backdropBlur: {
        glass: '16px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'gradient': 'gradient 8s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(214, 51, 132, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(214, 51, 132, 0.6)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
