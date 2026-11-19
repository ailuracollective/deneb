import 'reflect-metadata';
import '@ailura/nestjs-platform-hono-inertia/register';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ServerAdapter,
  type NestHonoApplication,
} from '@ailura/nestjs-hono-adapter';
import { fetchHandler, fetchServer } from '@ailura/nestjs-hono-adapter/fetch';
import { nodeServer } from '@ailura/nestjs-hono-adapter/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { InertiaService } from '@dudousxd/nestjs-inertia';
import { AppModule } from './api/app.module.js';

if (process.env.VERCEL) {
  const originalRender = InertiaService.prototype.render;
  InertiaService.prototype.render = async function (
    this: any,
    ...args: unknown[]
  ) {
    const response = this.res;
    const originalHtml = response?.html;
    if (typeof originalHtml === 'function') {
      response.html = (body: unknown) => {
        console.log(
          '[dbg3] inertia html',
          typeof body,
          typeof body === 'string' ? body.length : -1,
          typeof body === 'string' ? JSON.stringify(body.slice(0, 90)) : '',
        );
        return originalHtml.call(response, body);
      };
    }
    return originalRender.apply(this, args as [never, never]);
  };
}

const isServerless = Boolean(process.env.VERCEL);

const adapter = new ServerAdapter({
  transport: isServerless ? fetchServer({ serveStatic }) : nodeServer(),
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

if (process.env.VERCEL) {
  hono.use('*', async (context: any, next: () => Promise<void>) => {
    await next();
    let length = -1;
    try {
      length = (await context.res.clone().text()).length;
    } catch {}
    console.log(
      '[dbg2]',
      context.req.path,
      context.res.status,
      length,
      process.env.NODE_ENV,
    );
  });
}

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

if (isServerless) {
  await app.init();
} else {
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`Deneb listening on http://localhost:${port}`, 'NestApplication');
}

const loggedFetch = async (request: Request) => {
  const response = await fetch(request);
  if (process.env.VERCEL) {
    let length = -1;
    try {
      length = (await response.clone().text()).length;
    } catch (error) {
      length = -2;
      console.log('[dbg] clone failed', String(error));
    }
    console.log(
      '[dbg]',
      request.method,
      new URL(request.url).pathname,
      response.status,
      response.headers.get('content-type'),
      length,
    );
  }
  return response;
};

export default { fetch: loggedFetch };
