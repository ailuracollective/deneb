import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ServerAdapter,
  type NestHonoApplication,
} from '@ailura/nestjs-hono-adapter';
import {
  fetchHandler,
  fetchServer,
} from '@ailura/nestjs-hono-adapter/fetch';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import handlebars from 'handlebars';
import { AppModule } from './app.module.js';

const adapter = new ServerAdapter({
  transport: fetchServer(),
  trustProxy: true,
  views: {
    directory: 'views',
    engine: (source: string, data: unknown) =>
      handlebars.compile(source)(data as Record<string, unknown>),
  },
});

const app = await NestFactory.create<NestHonoApplication>(AppModule, adapter, {
  logger: ['error', 'warn'],
});

app.enableCors();
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
  scalarHandler({} as never, {
    send: (value: string) => {
      html = value;
    },
  } as never);
  return context.html(html);
};
hono.get('/api', renderScalar);
hono.get('/api/', renderScalar);

await app.init();

export default {
  fetch: fetchHandler(hono),
};
