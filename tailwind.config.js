/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#0d0f1a',
          50: '#f0f1f5',
          100: '#e1e3eb',
          200: '#c3c7d7',
          300: '#a5abc3',
          400: '#878faf',
          500: '#69739b',
          600: '#4b577b',
          700: '#2d3b5b',
          800: '#131520',
          900: '#0d0f1a',
          950: '#07080f',
        },
        royal: {
          DEFAULT: '#2563eb',
          light: '#3b82f6',
          dark: '#1d4ed8',
          glow: 'rgba(37, 99, 235, 0.3)',
        },
        // LUMINA antique gold — warmer and deeper than pure yellow
        lumina: {
          DEFAULT: '#c9a84c',
          light: '#e8c96a',
          dark: '#a07c2e',
          muted: '#c9a84c40',
          glow: 'rgba(201, 168, 76, 0.35)',
        },
        amber: {
          DEFAULT: '#eab308',
          light: '#facc15',
          dark: '#ca8a04',
          glow: 'rgba(234, 179, 8, 0.3)',
        },
        // LUMINA twilight violet — mountain sunset accent
        violet: {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
          dark: '#6d28d9',
          glow: 'rgba(139, 92, 246, 0.3)',
        },
        crimson: {
          DEFAULT: '#dc2626',
          light: '#ef4444',
          dark: '#b91c1c',
          glow: 'rgba(220, 38, 38, 0.3)',
        },
        glass: {
          DEFAULT: 'rgba(15, 16, 26, 0.72)',
          border: 'rgba(201, 168, 76, 0.09)',
          hover: 'rgba(15, 16, 26, 0.88)',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        glass: '16px',
      },
      boxShadow: {
        'gold-glow':   '0 0 20px rgba(234, 179, 8, 0.4), 0 0 40px rgba(234, 179, 8, 0.15)',
        'lumina-glow': '0 0 24px rgba(201, 168, 76, 0.4), 0 0 56px rgba(201, 168, 76, 0.15)',
        'violet-glow': '0 0 20px rgba(139, 92, 246, 0.35), 0 0 40px rgba(139, 92, 246, 0.12)',
        'blue-glow':   '0 0 20px rgba(37, 99, 235, 0.4), 0 0 40px rgba(37, 99, 235, 0.15)',
        'red-glow':    '0 0 20px rgba(220, 38, 38, 0.4), 0 0 40px rgba(220, 38, 38, 0.15)',
        'glass':       '0 8px 32px rgba(0, 0, 0, 0.4)',
        'card':        '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-gold': 'pulseGold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(234, 179, 8, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(234, 179, 8, 0.7)' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
