import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const BACKEND_TARGET = process.env.BACKEND_PROXY_TARGET || 'http://127.0.0.1:8000';
const ALLOWED_HOSTS = ['tracker.66dayrefresh.com'];

export default defineConfig({
  logLevel: 'error',
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ALLOWED_HOSTS,
    proxy: {
      '/api': { target: BACKEND_TARGET, changeOrigin: true },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ALLOWED_HOSTS,
    proxy: {
      '/api': { target: BACKEND_TARGET, changeOrigin: true },
    },
  },
});