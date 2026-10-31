import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({ plugins: [react(), tailwindcss()], server: { host: '0.0.0.0', allowedHosts: true, port: 3000, proxy: { '/api': 'http://127.0.0.1:3001' }, hmr: process.env.DISABLE_HMR !== 'true' } });
