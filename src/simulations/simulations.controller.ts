import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SimulationsService } from './simulations.service.js';
import { SimulationDto } from './dto/simulation.dto.js';
import { SimulationResultsDto } from './dto/simulation-response.dto.js';
import type { SimulationResults } from './entities/simulation.entity.js';

@Controller('api/v1/simulations')
@ApiTags('simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Calculate queue model performance measures',
    description:
      'Calculates all performance measures and costs for the requested queue model.',
  })
  @ApiOkResponse({
    description: 'Performance measures and costs for the given queue model.',
    type: SimulationResultsDto,
    example: {
      parameters: {
        simulationParameters: { lambda: 2, miu: 4 },
      },
      performanceMeasures: {
        specificPerformanceMeasures: { p: 0.5, p0: 0.5 },
        generalPerformanceMeasures: {
          L: 1,
          Lq: 0.5,
          Ln: 1,
          W: 0.5,
          Wq: 0.25,
          Wn: 0.5,
        },
      },
      info: {
        decimalPrecision: 6,
        simulationType: 'SYSTEM',
        queueModel: 'MM1',
        timeUnit: 'HOURS',
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Invalid parameters, or the stability condition is not satisfied.',
    examples: {
      validationError: {
        summary: 'Validation error',
        value: {
          message: [
            'lambda should not be null or undefined',
            'lambda must be a positive number',
          ],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      stabilityError: {
        summary: 'Stability condition not satisfied',
        value: {
          message: 'lambda=4/miu=2 < 1 does not satisfy the stability condition',
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error while calculating the simulation.',
    example: {
      message: 'Internal server error',
      error: 'Internal Server Error',
      statusCode: 500,
    },
  })
  calculate(@Query() simulationDto: SimulationDto): SimulationResults {
    return this.simulationsService.calculate(simulationDto);
  }
}
