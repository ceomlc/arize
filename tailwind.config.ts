import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#0E1C12',
          mid: '#1A2E1E',
          light: '#243D28',
        },
        sage: {
          DEFAULT: '#4A7C59',
          light: '#6B9E7A',
          pale: '#A8C4AF',
        },
        gold: {
          DEFAULT: '#C9A227',
          light: '#E8B84B',
          pale: '#F2D98A',
        },
        cream: {
          DEFAULT: '#F5F0E8',
          mid: '#E8DFC8',
          muted: '#BDB5A0',
        },
        blush: '#E8D5C4',
        'warm-red': '#C4614A',
        sky: '#7BADC4',
      },
      fontFamily: {
        playfair: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '20px',
        xl: '16px',
        lg: '12px',
        md: '8px',
      },
    },
  },
  plugins: [],
}

export default config
