import { createInertiaApp } from '@inertiajs/react';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import './globals.css';

const pageModules = import.meta.glob<{ default: ComponentType }>('../pages/**/*.tsx');
const pages = Object.fromEntries(
  Object.entries(pageModules).filter(([path]) => !path.endsWith('.spec.tsx')),
);

createInertiaApp({
  resolve: async (name) => {
    const loadPage = pages[`../pages/${name}.tsx`];
    if (!loadPage) {
      throw new Error(`Unknown Inertia page: ${name}`);
    }
    return (await loadPage()).default;
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
  title: (title) => (title ? `${title} · Deneb` : 'Deneb'),
});
