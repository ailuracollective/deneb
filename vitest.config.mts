import path from 'node:path';
import react from '@vitejs/plugin-react';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/api/main.ts'],
      reportsDirectory: './coverage',
    },
    projects: [
      {
        extends: false,
        plugins: [swc.vite({ module: { type: 'es6' } })],
        test: {
          name: 'server',
          globals: true,
          environment: 'node',
          include: ['src/api/**/*.spec.ts'],
        },
      },
      {
        extends: false,
        plugins: [react()],
        resolve: {
          alias: {
            '@': path.resolve(process.cwd(), 'src/web/app'),
          },
        },
        test: {
          name: 'client',
          globals: true,
          environment: 'jsdom',
          include: ['src/web/**/*.spec.tsx'],
        },
      },
    ],
  },
});
