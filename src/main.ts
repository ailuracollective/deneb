import 'reflect-metadata';
import '@ailura/nestjs-platform-hono-inertia/register';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ServerAdapter,
  type NestHonoApplication,
} from '@ailura/nestjs-hono-adapter';
import { fetchHandler } from '@ailura/nestjs-hono-adapter/fetch';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './api/app.module.js';
import { createTransport, isVercel, registerScalar } from './bootstrap.js';

const adapter = new ServerAdapter({
  transport: createTransport(),
  trustProxy: true,
});

const app = await NestFactory.create<NestHonoApplication>(AppModule, adapter);

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
registerScalar(hono, document);

const fetch = fetchHandler(hono);

await app.init();

// The Inertia bridge installs asynchronously; when it lands late, Nest's post-render
// `reply(undefined)` clears the page the render already wrote. Keep the guard here too.
const reply = adapter.reply.bind(adapter);
adapter.reply = ((response: any, body: unknown, statusCode?: number) => {
  if (response?.finalized) return;
  return reply(response, body, statusCode);
}) as typeof adapter.reply;

if (!isVercel) {
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`Deneb listening on http://localhost:${port}`, 'NestApplication');
}

export default { fetch };
