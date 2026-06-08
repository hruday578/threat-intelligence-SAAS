import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Restored the Deep-Proxy Tunnel
      '/news-proxy': {
        target: 'https://newsapi.ai',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => '/api/v1/article/getArticles'
      },
      '/groq': {
        target: 'https://api.groq.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/groq/, '/openai/v1'),
      },
      '/openrouter': {
        target: 'https://openrouter.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/openrouter/, '/api/v1'),
      },
      '/deepseek': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/deepseek/, ''),
      },
      // ─── Geo-Radius Expansion Services ───
      '/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nominatim/, ''),
        headers: { 'User-Agent': 'AertEM-ThreatIntelligence/1.0' }
      },
      '/overpass': {
        target: 'https://overpass-api.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/overpass/, '/api/interpreter'),
      },
    },
  },
})
