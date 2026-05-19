import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // === Frontend palitra bilan moslashtirildi ===
        midnight: {
          50: '#e6e9f0',
          100: '#c2c9d8',
          200: '#9aa5be',
          300: '#7180a4',
          400: '#52628f',
          500: '#33457a',
          600: '#283867',
          700: '#1d2c54',
          800: '#131f3f',
          900: '#0b142a',
          950: '#060b1a',
        },
        gold: {
          50: '#fffaf0',
          100: '#fff0d4',
          200: '#ffe09a',
          300: '#ffcf5e',
          400: '#f5b342',
          500: '#e09a28',
          600: '#bd7d1c',
          700: '#8f5e16',
          800: '#634011',
          900: '#3a260b',
          950: '#1a1004',
        },
        // === Admin uchun qoʻshimcha qizil accent ===
        admin: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #f5b342 0%, #bd7d1c 100%)',
        'gradient-gold-soft': 'linear-gradient(135deg, rgba(245,179,66,0.15) 0%, rgba(189,125,28,0.08) 100%)',
        'gradient-admin': 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'pulse-red': 'pulse-red 2s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
          '50%': { boxShadow: '0 0 0 8px rgba(239, 68, 68, 0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
