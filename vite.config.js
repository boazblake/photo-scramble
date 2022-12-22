import { defineConfig } from "vite"
import { flowPlugin, esbuildFlowPlugin } from "@bunchtogether/vite-plugin-flow"
import { VitePWA } from 'vite-plugin-pwa'

import path from "path"

export default defineConfig({
  optimizeDeps: { esbuildOptions: { plugins: [esbuildFlowPlugin()] } },
  plugins: [flowPlugin(),
  VitePWA({
    includeAssets: ['favicon.ico',], manifest: {
      "theme_color": "#f69435",
      "background_color": "#f69435",
      "display": "fullscreen",
      "scope": "/",
      "start_url": "/",
      "name": "Photo Scramble",
      "short_name": "Photo Scrambler",
      "description": "Photo Scrambler Game",
      "icons": [
        {
          "src": "./assets/images/icon-192x192.png",
          "sizes": "192x192",
          "type": "image/png"
        },
        {
          "src": "./assets/images/icon-256x256.png",
          "sizes": "256x256",
          "type": "image/png"
        },
        {
          "src": "./assets/images/icon-384x384.png",
          "sizes": "384x384",
          "type": "image/png"
        },
        {
          "src": "./assets/images/icon-512x512.png",
          "sizes": "512x512",
          "type": "image/png"
        }
      ]
    }
    , registerType: 'autoUpdate', devOptions: { enabled: true }
  })],
  resolve: {
    alias: {
      m: "mithril",
      Stream: "mithril-stream",
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: { outDir: "docs" },
  server: {
    port: 3000,
    open: true,
  },
  base: './',
})

