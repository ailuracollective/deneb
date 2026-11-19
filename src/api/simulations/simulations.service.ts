import { Injectable } from '@nestjs/common';
import { Simulation } from './entities/simulation.entity.js';
import type { SimulationResults } from './entities/simulation.entity.js';
import type { SimulationDto } from './dto/simulation.dto.js';

@Injectable()
export class SimulationsService {
  calculate(dto: SimulationDto): SimulationResults {
    const simulation = new Simulation({
      simulationParameters: {
        lambda: dto.lambda,
        miu: dto.miu,
        M: dto.M,
        k: dto.k,
        N: dto.N,
      },
      simulationCosts: {
        Cte: dto.Cte,
        Cts: dto.Cts,
        Ctse: dto.Ctse,
        Cs: dto.Cs,
        hr: dto.hr,
      },
      info: {
        decimalPrecision: dto.decimalPrecision,
        simulationType: dto.simulationType,
        queueModel: dto.queueModel,
        timeUnit: dto.timeUnit,
        quantifier: dto.quantifier,
      },
    });

    return simulation.getAllCalculations();
  }
}
