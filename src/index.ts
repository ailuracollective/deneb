import { Hono } from 'hono';
import type { NodeEnv } from '@ailura/nestjs-hono-adapter';
import { createApp } from './bootstrap.js';

/**
 * Vercel entry point.
 *
 * Vercel detects a Hono application by a default export at one
 * of a fixed set of paths, and this file is one of them; it
 * reads the `hono` import to tell a Hono entry from any other.
 * The Nest application is bootstrapped once — `init()` registers
 * every route on the Hono instance the adapter owns without
 * opening a socket — and that instance is what Vercel serves
 * each request through.
 */
const nest = await createApp();
await nest.init();

const app: Hono<NodeEnv> = nest.getHttpAdapter().getHono();

export default app;
