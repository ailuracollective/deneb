import { Logger } from '@nestjs/common';
import { createApp } from './bootstrap.js';

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`Deneb API is running on port ${port}`, 'Bootstrap');
}

await bootstrap().catch((error: unknown) => {
  Logger.error('Error during application bootstrap', error);
  process.exit(1);
});
