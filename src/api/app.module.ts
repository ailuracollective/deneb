import { Module } from '@nestjs/common';
import { InertiaModule } from '@dudousxd/nestjs-inertia';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SimulationsModule } from './simulations/simulations.module.js';

// Vercel copies dist/ contents to the function root; locally they stay under dist/.
const dist = process.env.VERCEL ? '' : 'dist/';

@Module({
  imports: [
    InertiaModule.forRoot({
      rootView: `${dist}web/root.html`,
      vite: {
        entry: 'app/client.tsx',
        manifestPath: `${dist}inertia/client/.vite/manifest.json`,
      },
    }),
    SimulationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
