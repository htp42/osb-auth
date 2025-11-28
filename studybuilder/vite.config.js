import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      sass: {
        api: 'modern-compiler',
      },
    },
  },
  plugins: [
    vue(),
    vuetify({ styles: { configFile: 'src/styles/settings.scss' } }),
    {
      name: 'spa-fallback-for-dots',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          // Handle routes with version numbers (e.g., /overview/4.1)
          // Vite treats dots as file extensions, so we need to handle these specially
          if (req.url.includes('/overview/') && req.url.match(/\/\d+\.\d+$/)) {
            req.url = '/'
          }
          next()
        })
      },
    },
  ],
  assetsInclude: ['**/*.md'],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.API_BASE_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
