import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DecimalPrecision,
  Quantifiers,
  QueueModels,
  SimulationType,
  TimeUnit,
} from '../entities/simulation.entity.js';

export class SimulationParametersResponseDto {
  @ApiProperty({ example: 2, description: 'Arrival rate (lambda).' })
  lambda: number;

  @ApiProperty({ example: 4, description: 'Service rate (miu).' })
  miu: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'System capacity, present for M/M/1/M/M and M/M/K/M/M.',
  })
  M?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of servers, present for M/M/K and M/M/K/M/M.',
  })
  k?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Population size used for the quantifier probability.',
  })
  N?: number;
}

export class SimulationCostsResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Expected waiting cost per unit time.',
  })
  Cte: number;

  @ApiProperty({
    example: 1,
    description: 'Expected service cost per unit time.',
  })
  Cts: number;

  @ApiProperty({
    example: 1,
    description: 'Expected service cost per server per unit time.',
  })
  Ctse: number;

  @ApiProperty({ example: 1, description: 'Cost per server.' })
  Cs: number;

  @ApiProperty({ example: 8, description: 'Hours per working day.' })
  hr: number;
}

export class InfoResponseDto {
  @ApiProperty({ enum: DecimalPrecision, example: DecimalPrecision.D6 })
  decimalPrecision: DecimalPrecision;

  @ApiProperty({ enum: SimulationType, example: SimulationType.SYSTEM })
  simulationType: SimulationType;

  @ApiProperty({ enum: QueueModels, example: QueueModels.MM1 })
  queueModel: QueueModels;

  @ApiProperty({ enum: TimeUnit, example: TimeUnit.HOURS })
  timeUnit: TimeUnit;

  @ApiProperty({ enum: Quantifiers, example: Quantifiers.EXACTLY })
  quantifier: Quantifiers;
}

export class SpecificPerformanceMeasuresDto {
  @ApiProperty({
    example: 0.5,
    description: 'Traffic intensity (lambda / miu).',
  })
  p: number;

  @ApiProperty({ example: 0.5, description: 'Probability of an empty system.' })
  p0: number;

  @ApiPropertyOptional({
    example: 0.125,
    description: 'Probability of exactly N.',
  })
  pn?: number;

  @ApiPropertyOptional({ example: 0.2, description: 'Probability of waiting.' })
  pe?: number;

  @ApiPropertyOptional({
    example: 0.8,
    description: 'Probability of not waiting.',
  })
  pne?: number;

  @ApiPropertyOptional({
    example: 0.1,
    description: 'Probability that all servers are busy.',
  })
  pk?: number;
}

export class GeneralPerformanceMeasuresDto {
  @ApiProperty({ example: 1, description: 'Average number in the system.' })
  L: number;

  @ApiProperty({ example: 0.5, description: 'Average number in the queue.' })
  Lq: number;

  @ApiProperty({
    example: 1,
    description: 'Average number in the non-empty system.',
  })
  Ln: number;

  @ApiProperty({ example: 0.5, description: 'Average time in the system.' })
  W: number;

  @ApiProperty({ example: 0.25, description: 'Average time in the queue.' })
  Wq: number;

  @ApiProperty({
    example: 0.5,
    description: 'Average time in the non-empty system.',
  })
  Wn: number;
}

export class TotalSimulationCostsDto {
  @ApiProperty({ example: 2.13, description: 'Total waiting cost.' })
  CTte: number;

  @ApiProperty({ example: 6.13, description: 'Total service cost.' })
  CTts: number;

  @ApiProperty({ example: 4, description: 'Total server cost.' })
  CTtse: number;

  @ApiProperty({ example: 2, description: 'Total capacity cost.' })
  CTs: number;

  @ApiProperty({ example: 14.27, description: 'Total cost.' })
  CT: number;
}

export class SimulationParametersBlockDto {
  @ApiProperty({ type: SimulationParametersResponseDto })
  simulationParameters: SimulationParametersResponseDto;

  @ApiPropertyOptional({
    type: SimulationCostsResponseDto,
    description: 'Only present when costs were provided in the request.',
  })
  simulationCosts?: SimulationCostsResponseDto;
}

export class PerformanceMeasuresDto {
  @ApiProperty({ type: SpecificPerformanceMeasuresDto })
  specificPerformanceMeasures: SpecificPerformanceMeasuresDto;

  @ApiProperty({ type: GeneralPerformanceMeasuresDto })
  generalPerformanceMeasures: GeneralPerformanceMeasuresDto;
}

export class SimulationResultsDto {
  @ApiProperty({ type: SimulationParametersBlockDto })
  parameters: SimulationParametersBlockDto;

  @ApiProperty({ type: PerformanceMeasuresDto })
  performanceMeasures: PerformanceMeasuresDto;

  @ApiPropertyOptional({
    type: TotalSimulationCostsDto,
    description: 'Only present when costs were provided in the request.',
  })
  costs?: TotalSimulationCostsDto;

  @ApiProperty({ type: InfoResponseDto })
  info: InfoResponseDto;
}
