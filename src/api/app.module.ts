import { readFileSync, readdirSync } from 'node:fs';
import { Module } from '@nestjs/common';
import { InertiaModule } from '@dudousxd/nestjs-inertia';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SimulationsModule } from './simulations/simulations.module.js';

// Keep Vercel's file tracer aware of the HTML, manifest and assets read at runtime.
if (process.env.NODE_ENV === 'production') {
  void readFileSync(new URL('../web/root.html', import.meta.url));
  void readFileSync(
    new URL('../../dist/inertia/client/.vite/manifest.json', import.meta.url),
  );
  void readdirSync(
    new URL('../../dist/inertia/client/assets', import.meta.url),
  );
}

@Module({
  imports: [
    InertiaModule.forRoot({
      rootView: 'src/web/root.html',
      vite: {
        entry: 'app/client.tsx',
        manifestPath: 'dist/inertia/client/.vite/manifest.json',
      },
    }),
    SimulationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
