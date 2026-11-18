import { Module } from '@nestjs/common';
import { InertiaModule } from '@dudousxd/nestjs-inertia';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SimulationsModule } from './simulations/simulations.module.js';

@Module({
  imports: [
    InertiaModule.forRoot({
      rootView: 'inertia/root.html',
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
