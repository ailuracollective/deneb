import 'reflect-metadata';
import '@ailura/nestjs-platform-hono-inertia/register';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ServerAdapter,
  type NestHonoApplication,
} from '@ailura/nestjs-hono-adapter';
import { fetchHandler, fetchServer } from '@ailura/nestjs-hono-adapter/fetch';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './api/app.module.js';

const isServerless = Boolean(process.env.VERCEL);

// The fetch transport takes no port: Vercel exports `fetch`, and only a local host listens.
const adapter = new ServerAdapter({
  transport: fetchServer({ serveStatic }),
  trustProxy: true,
});

const app = await NestFactory.create<NestHonoApplication>(AppModule, adapter);

if (!isServerless && process.env.NODE_ENV !== 'production') {
  // A dev response once carried an empty body with a valid ETag; never let a browser revalidate
  // that poisoned module instead of fetching the current one.
  app.use((request: any, _response: any, next: () => void) => {
    delete request.headers['if-none-match'];
    // The published adapter exposes these as getters, but Vite rewrites them.
    for (const key of ['originalUrl', 'url']) {
      Object.defineProperty(request, key, {
        value: request[key],
        writable: true,
        configurable: true,
      });
    }
    next();
  });
  const { setupInertiaVite } = await import('@dudousxd/nestjs-inertia-vite');
  // The published adapter lacks the Express surface Vite needs: fitted end() drops streamed
  // chunks and the response proxy has no emit(), so piping a font crashes the dev server.
  adapter
    .getHono()
    .use('*', async (context: any, next: () => Promise<void>) => {
      if (Object.hasOwn(context, 'end')) delete context.end;
      const outgoing = context.env?.outgoing;
      if (outgoing && typeof outgoing.emit === 'function') {
        Object.defineProperty(context, 'emit', {
          value: (event: string, ...args: unknown[]) =>
            outgoing.emit(event, ...args),
          configurable: true,
        });
      }
      await next();
    });
  await setupInertiaVite(app, {
    mode: 'development',
    root: 'src/web',
    publicDir: 'dist/inertia/client',
    outDir: 'dist/inertia',
  });
}

app.enableCors();
app.useStaticAssets('dist/inertia/client/assets', {
  prefix: '/assets',
});
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
  }),
);

const config = new DocumentBuilder()
  .setTitle('Swagger Deneb - OpenAPI 3.0')
  .setDescription(
    'API-REST that allows calculating a measure of performance in M/M/1, M/M/K, M/M/1/M/M and M/M/K/M/M models',
  )
  .setVersion('1.0.2')
  .addServer('https://deneb.vercel.app', 'Server Deneb')
  .addTag('simulations', 'Queue model performance measures and costs')
  .build();

const document = SwaggerModule.createDocument(app, config);

const hono = adapter.getHono();
hono.get('/api-json', (context) => context.json(document));

const scalarHandler = apiReference({
  content: document,
  pageTitle: 'Swagger Deneb - OpenAPI 3.0',
});

const renderScalar = (context: any) => {
  let html = '';
  scalarHandler(
    {} as never,
    {
      send: (value: string) => {
        html = value;
      },
    } as never,
  );
  return context.html(html);
};
hono.get('/api', renderScalar);
hono.get('/api/', renderScalar);

const fetch = fetchHandler(hono);

await app.init();

if (!isServerless) {
  const port = Number(process.env.PORT ?? 3000);
  serve({ fetch, port });
  Logger.log(`Deneb listening on http://localhost:${port}`, 'NestApplication');
}

export default { fetch };
