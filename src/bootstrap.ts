import type { Transport } from '@ailura/nestjs-hono-adapter';
import { fetchServer } from '@ailura/nestjs-hono-adapter/fetch';
import { nodeServer } from '@ailura/nestjs-hono-adapter/node-server';
import { serveStatic } from '@hono/node-server/serve-static';

export const isVercel = Boolean(process.env.VERCEL);

// Vercel hands requests to the exported fetch handler; a local process owns a Node server.
export const createTransport = (): Transport =>
  isVercel ? fetchServer({ serveStatic }) : nodeServer();
