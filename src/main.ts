import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ServerAdapter, NestHonoApplication } from '@ailura/nestjs-hono-adapter';
import { AppModule } from './app.module.js';
import handlebars from 'handlebars';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestHonoApplication>(AppModule, new ServerAdapter({
    views: {
      directory: 'views',
      engine: (source: string, data: unknown) => handlebars.compile(source)(data as Record<string, unknown>),
    },
  }));

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

  await app.listen(3000);
}

await bootstrap().catch((error) => {
  Logger.error('Error during application bootstrap', error);
  process.exit(1);
});
