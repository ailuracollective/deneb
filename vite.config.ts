import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { nestInertia } from '@dudousxd/nestjs-inertia-vite';
import { defineConfig } from 'vite';

const webRoot = path.resolve(process.cwd(), 'src/web');
// nestInertia hardcodes 24679; derive it from PORT so parallel dev servers don't collide.
const hmrPort = Number(process.env.PORT ?? 3000) + 20000;

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
    {
      name: 'deneb-hmr-port',
      configResolved(config) {
        config.server.ws = { ...config.server.ws, port: hmrPort };
      },
    },
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
