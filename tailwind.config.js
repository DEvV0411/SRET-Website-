/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#60A5FA',
        },
        secondary: {
          DEFAULT: '#10B981',
          dark: '#047857',
          light: '#34D399',
        },
        accent: {
          DEFAULT: '#F59E0B',
          dark: '#B45309',
          light: '#FBBF24',
        },
        // Notion/Airtable style gray surfaces
        dark: {
          bg: '#0A0A0C',
          surface: '#121216',
          border: 'rgba(255, 255, 255, 0.08)',
          card: '#1A1A22',
        },
        light: {
          bg: '#F9FAF5',
          surface: '#FFFFFF',
          border: 'rgba(0, 0, 0, 0.08)',
          card: '#F3F4F6',
        }
      },
      fontFamily: {
        heading: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        body: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'md': '12px',
        'lg': '16px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(37, 99, 235, 0.15)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.15)',
      }
    },
  },
  plugins: [],
}
