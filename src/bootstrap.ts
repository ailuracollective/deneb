import type {
  NestContext,
  NestHono,
  Transport,
} from '@ailura/nestjs-hono-adapter';
import { fetchServer } from '@ailura/nestjs-hono-adapter/fetch';
import { nodeServer } from '@ailura/nestjs-hono-adapter/node-server';
import type { OpenAPIObject } from '@nestjs/swagger';
import { serveStatic } from '@hono/node-server/serve-static';
import { apiReference } from '@scalar/nestjs-api-reference';

export const isVercel = Boolean(process.env.VERCEL);

// Vercel hands requests to the exported fetch handler; a local process owns a Node server.
export const createTransport = (): Transport =>
  isVercel ? fetchServer({ serveStatic }) : nodeServer();

export const registerScalar = (
  hono: NestHono,
  document: OpenAPIObject,
): void => {
  const handler = apiReference({
    content: document,
    pageTitle: 'Swagger Deneb - OpenAPI 3.0',
  });

  const render = (context: NestContext) => {
    let html = '';
    handler(
      {} as never,
      {
        send: (value: string) => {
          html = value;
        },
      } as never,
    );
    return context.html(html);
  };

  hono.get('/api', render);
  hono.get('/api/', render);
};
