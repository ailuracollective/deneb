import { Controller, Get } from '@nestjs/common';
import { Inertia } from '@dudousxd/nestjs-inertia';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { AppService } from './app.service.js';
import type { RootView } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiExcludeEndpoint()
  @Inertia('Simulations/Index')
  root(): RootView {
    return this.appService.getRootView();
  }
}
