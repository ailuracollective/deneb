import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const inertiaRoot = path.resolve(process.cwd(), 'inertia');

export default defineConfig({
  root: inertiaRoot,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(inertiaRoot, 'app'),
    },
  },
  build: {
    outDir: path.resolve(process.cwd(), 'dist/inertia/client'),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: path.resolve(inertiaRoot, 'app/client.tsx'),
    },
  },
});
