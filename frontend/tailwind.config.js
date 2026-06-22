/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0B0F19",
          slate: "#1E293B",
          blue: "#3B82F6",
          purple: "#A855F7",
          cyan: "#06B6D4",
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'token-pulse': 'tokenPulse 1.5s infinite ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', filter: 'drop-shadow(0 0 5px rgba(6, 182, 212, 0.4))' },
          '50%': { opacity: '0.9', filter: 'drop-shadow(0 0 15px rgba(6, 182, 212, 0.8))' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        tokenPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)', filter: 'brightness(1.2)' },
        }
      }
    },
  },
  plugins: [],
}
