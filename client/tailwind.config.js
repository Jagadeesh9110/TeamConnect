/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary-bg": "#0F172A",
        "panel-bg": "#111827",
        accent: "#3B82F6",
        "text-primary": "#E5E7EB",
        "text-secondary": "#94A3B8",
        "border-soft": "#1F2937",
        navy: {
          900: '#0b1220',
          800: '#0f172a',
        },
        slate: {
          800: '#1e293b',
          700: '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
