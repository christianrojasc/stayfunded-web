import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1E2D3D',
        'navy-light': '#2A3F55',
        'navy-muted': '#6B7E91',
        green: {
          brand: '#2D8B4E',
          light: '#4ADE50',
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
        },
        bg: '#F5F7FA',
        surface: '#FFFFFF',
        border: '#E4E9F0',
        loss: '#EF4444',
        'loss-bg': '#FEF2F2',
        'win-bg': '#F0FDF4',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #2D8B4E 0%, #4ADE50 100%)',
        'gradient-brand-h': 'linear-gradient(90deg, #2D8B4E 0%, #4ADE50 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,247,250,0.8) 100%)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(30,45,61,0.06), 0 4px 16px rgba(30,45,61,0.06)',
        'card-hover': '0 4px 20px rgba(30,45,61,0.12), 0 1px 4px rgba(30,45,61,0.08)',
        'glass': '0 8px 32px rgba(30,45,61,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
        'green': '0 4px 16px rgba(45,139,78,0.25)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(12px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { from: { transform: 'translateY(-8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        scaleIn: { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}
export default config
