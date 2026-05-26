/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        foreground: '#000000',
        muted:      '#6F6F6F',
        border:     'rgba(0,0,0,0.08)',

        // Keep gold accent for Ukrainian identity
        lumina: {
          DEFAULT: '#c9a84c',
          light: '#e8c96a',
          dark: '#a07c2e',
          glow: 'rgba(201, 168, 76, 0.35)',
        },
        // Legacy aliases — mapped to new palette so old classes compile
        obsidian: {
          DEFAULT: '#FFFFFF',
          800: '#f5f5f5',
          900: '#FFFFFF',
          950: '#f0f0f0',
        },
        royal: {
          DEFAULT: '#000000',
          light: '#333333',
          dark: '#000000',
          glow: 'rgba(0,0,0,0.15)',
        },
        amber: {
          DEFAULT: '#c9a84c',
          light: '#e8c96a',
          dark: '#a07c2e',
          glow: 'rgba(201,168,76,0.3)',
        },
        violet: {
          DEFAULT: '#6F6F6F',
          light: '#888888',
          dark: '#4a4a4a',
          glow: 'rgba(111,111,111,0.2)',
        },
        crimson: {
          DEFAULT: '#dc2626',
          light: '#ef4444',
          dark: '#b91c1c',
          glow: 'rgba(220,38,38,0.3)',
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.9)',
          border: 'rgba(0,0,0,0.08)',
          hover: 'rgba(255,255,255,1)',
        },
      },
      fontFamily: {
        serif:   ['"Instrument Serif"', 'Georgia', 'serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        hero: '-0.04em',
      },
      lineHeight: {
        hero: '0.95',
      },
      backdropBlur: {
        glass: '16px',
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.12), 0 24px 48px rgba(0,0,0,0.08)',
        'nav':        '0 -1px 0 rgba(0,0,0,0.06), 0 -8px 24px rgba(0,0,0,0.04)',
        'input':      '0 1px 3px rgba(0,0,0,0.06)',
        'lumina-glow':'0 0 24px rgba(201,168,76,0.4), 0 0 56px rgba(201,168,76,0.15)',
        // Legacy
        'gold-glow':  '0 0 20px rgba(201,168,76,0.4)',
        'blue-glow':  '0 0 20px rgba(0,0,0,0.3)',
        'red-glow':   '0 0 20px rgba(220,38,38,0.4)',
        'glass':      '0 8px 32px rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-rise':         'fadeRise 0.8s ease-out forwards',
        'fade-rise-delay':   'fadeRise 0.8s ease-out 0.2s forwards',
        'fade-rise-delay-2': 'fadeRise 0.8s ease-out 0.4s forwards',
        'fade-in':           'fadeIn 0.2s ease-out',
        'slide-up':          'slideUp 0.3s ease-out',
        'pulse-gold':        'pulseGold 3s ease-in-out infinite',
      },
      keyframes: {
        fadeRise: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(201,168,76,0.4)' },
          '50%':       { boxShadow: '0 0 40px rgba(201,168,76,0.7)' },
        },
      },
    },
  },
  plugins: [],
};
