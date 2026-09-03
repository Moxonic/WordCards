/** @type {import('tailwindcss').Config} */

// Zen / modern-Japanese palette: warm washi paper shading into sumi ink, with
// low-chroma matcha / ochre / vermilion accents used sparingly. `slate`,
// `emerald`, `amber` and `red` are remapped so the existing utility classes
// pick up the new tones without touching every component.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans JP"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        none: '0px',
        sm: '1px',
        DEFAULT: '2px',
        md: '2px',
        lg: '2px',
        xl: '3px',
        '2xl': '3px',
        '3xl': '4px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 1px rgba(28, 26, 22, 0.03)',
        DEFAULT: '0 1px 2px rgba(28, 26, 22, 0.04)',
        md: '0 1px 3px rgba(28, 26, 22, 0.05)',
        lg: '0 1px 3px rgba(28, 26, 22, 0.05)',
        xl: '0 2px 6px rgba(28, 26, 22, 0.05)',
        '2xl': '0 2px 10px rgba(28, 26, 22, 0.06)',
        none: 'none',
      },
      colors: {
        slate: {
          50: '#faf8f3',
          100: '#f4f1e8',
          200: '#e7e2d5',
          300: '#d5cfbe',
          400: '#a9a18d',
          500: '#847c69',
          600: '#5f584a',
          700: '#423d34',
          800: '#2b2823',
          900: '#1c1a16',
          950: '#131210',
        },
        emerald: {
          50: '#eef1e8',
          100: '#e2e8d5',
          200: '#cdd6bd',
          300: '#b2c19b',
          400: '#98a97e',
          500: '#7f9163',
          600: '#697c50',
          700: '#525f3f',
          800: '#43502f',
          900: '#2f3a1f',
        },
        amber: {
          50: '#f6f0e4',
          100: '#eee3cb',
          200: '#e3d3ac',
          300: '#d3ba85',
          400: '#bf9c5c',
          500: '#a9853f',
          600: '#8a6a30',
          700: '#6b5327',
          800: '#4f3d1c',
          900: '#3a2d15',
        },
        red: {
          50: '#f6ebe7',
          100: '#eed7cf',
          200: '#e3bcae',
          300: '#d29d8b',
          400: '#bd7360',
          500: '#a95440',
          600: '#934634',
          700: '#78392b',
          800: '#5c2c22',
          900: '#45201a',
        },
      },
    },
  },
  plugins: [],
};
