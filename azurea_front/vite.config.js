import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 5173);
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(root, 'src'), '@assets': path.resolve(root, '../../attached_assets') }, dedupe: ['react', 'react-dom'] },
  root,
  build: { outDir: path.resolve(root, 'dist/public'), emptyOutDir: true },
  server: { port, strictPort: true, host: '0.0.0.0', allowedHosts: true },
  preview: { port, host: '0.0.0.0', allowedHosts: true }
});
