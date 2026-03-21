/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        compliant:    { DEFAULT: '#16a34a', light: '#dcfce7' },
        noncompliant: { DEFAULT: '#dc2626', light: '#fee2e2' },
        ringfenced:   { DEFAULT: '#d97706', light: '#fef3c7' },
        ink: {
          DEFAULT: '#0f172a',
          2: '#1e293b',
          3: '#334155',
          muted: '#64748b',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        body:    ['"Sora"', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
