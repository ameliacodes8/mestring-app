import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Mestring - Family Chore Tracker',
        short_name: 'Mestring',
        description: 'Track family chores, goals, and rewards',
        theme_color: '#4f46e5'
      }
    })
  ],
  server: {
    port: 5173
  }
});