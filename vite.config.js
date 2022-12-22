import { defineConfig } from "vite"
import { flowPlugin, esbuildFlowPlugin } from "@bunchtogether/vite-plugin-flow"
import { VitePWA } from 'vite-plugin-pwa'

import path from "path"

export default defineConfig({
  optimizeDeps: { esbuildOptions: { plugins: [esbuildFlowPlugin()] } },
  plugins: [flowPlugin(),
  VitePWA({ registerType: 'auto', devOptions: { enabled: false } })],
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

