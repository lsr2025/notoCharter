import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Use our existing public/manifest.json — don't generate a new one
      manifest: false,
      workbox: {
        // Precache all static assets (JS, CSS, HTML, fonts, SVG)
        globPatterns: ['**/*.{js,css,html,svg,woff2,ico}'],
        // Runtime caching strategies
        runtimeCaching: [
          {
            // Supabase API — NetworkFirst with 5s timeout, falls back to cache
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts — StaleWhileRevalidate (fonts rarely change)
            urlPattern: ({ url }) =>
              url.hostname === 'fonts.googleapis.com' ||
              url.hostname === 'fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts' },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('recharts')) return 'charts'
        },
      },
    },
  },
})
