import type { Hono } from 'hono';
import { createApp } from './bootstrap.js';

let cached: Hono | null = null;

async function getApp(): Promise<Hono> {
  if (cached) return cached;
  const app = await createApp();
  await app.init();
  cached = app.getHttpAdapter().getInstance() as Hono;
  return cached;
}

export default async function handler(request: Request): Promise<Response> {
  const app = await getApp();
  return app.fetch(request);
}