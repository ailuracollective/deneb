import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ServerAdapter,
  NestHonoApplication,
} from '@ailura/nestjs-hono-adapter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import handlebars from 'handlebars';
import { AppModule } from './app.module.js';

/**
 * Builds the fully configured Nest application on Hono, without
 * starting to listen. Both the long-running entry point
 * (`main.ts`) and the serverless one (`api/index.ts`) share it,
 * so the routes, the views and the Swagger document are wired
 * the same way in every runtime.
 */
export async function createApp(): Promise<NestHonoApplication> {
  const app = await NestFactory.create<NestHonoApplication>(
    AppModule,
    new ServerAdapter({
      trustProxy: true,
      views: {
        directory: 'views',
        engine: (source: string, data: unknown) =>
          handlebars.compile(source)(data as Record<string, unknown>),
      },
    }),
  );

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

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  return app;
}
