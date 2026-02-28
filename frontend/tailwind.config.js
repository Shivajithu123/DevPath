export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        bg: '#0a0a0f',
        surface: '#13131a',
        surface2: '#1c1c28',
        border: '#2a2a3d',
        accent: '#7c6aff',
        accent2: '#ff6a6a',
        accent3: '#6affd4',
        muted: '#6b6b8a',
      }
    }
  },
  plugins: []
}
