import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dragonRajaData0Plugin } from './src/server/data0StreamPlugin';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/DR-Online/' : '/',
  plugins:
    process.env.GITHUB_PAGES === 'true'
      ? [react()]
      : [react(), dragonRajaData0Plugin()],
  server: {
    host: true,
    port: 5188,
    strictPort: false,
    open: false
  },
  preview: {
    host: true,
    port: 5188,
    strictPort: false
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500
  }
});
