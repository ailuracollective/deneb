import { Logger } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ServerAdapter,
  NestHonoApplication,
} from '@ailura/nestjs-hono-adapter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import handlebars from 'handlebars';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
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

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`Deneb API is running on port ${port}`, 'Bootstrap');
}

await bootstrap().catch((error: unknown) => {
  Logger.error('Error during application bootstrap', error);
  process.exit(1);
});
