import { Module } from '@nestjs/common';
import { SimulationsService } from './simulations.service.js';
import { SimulationsController } from './simulations.controller.js';

@Module({
  controllers: [SimulationsController],
  providers: [SimulationsService],
})
export class SimulationsModule {}
