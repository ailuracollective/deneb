import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { nestInertia } from '@dudousxd/nestjs-inertia-vite';
import { defineConfig } from 'vite';

const webRoot = path.resolve(process.cwd(), 'src/web');

export default defineConfig({
  root: webRoot,
  plugins: [
    nestInertia({
      react: true,
      root: 'src/web',
      entry: 'src/web/app/client.tsx',
      alias: { '@': path.resolve(webRoot, 'app') },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(webRoot, 'app'),
    },
  },
  build: {
    outDir: path.resolve(process.cwd(), 'dist/inertia/client'),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: path.resolve(webRoot, 'app/client.tsx'),
    },
  },
});
