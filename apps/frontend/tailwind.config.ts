import type { Config } from 'tailwindcss';

/**
 * Design tokens for the Sharvi Collections storefront.
 * Palette: warm ivory canvas, deep maroon/plum brand, and champagne-gold
 * accents — evoking premium multicultural jewellery (Pandora/Swarovski feel).
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#fbf7f4',
        maroon: {
          50: '#fbeef2',
          100: '#f6d6e0',
          200: '#eaa6bc',
          300: '#dd7597',
          400: '#c94873',
          500: '#a82c56',
          600: '#7c1f3f',
          700: '#651933',
          800: '#4d1327',
          900: '#360d1b',
        },
        gold: {
          50: '#fbf6ea',
          100: '#f5e9c8',
          200: '#ead18d',
          300: '#dcb857',
          400: '#c9a13a',
          500: '#a9842c',
          600: '#856726',
        },
        ink: '#241a1d',
      },
      fontFamily: {
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(124, 31, 63, 0.18)',
        card: '0 2px 16px -6px rgba(36, 26, 29, 0.12)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
