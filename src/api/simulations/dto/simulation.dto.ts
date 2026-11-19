import {
  IsDefined,
  IsEnum,
  IsOptional,
  IsPositive,
  Validate,
  ValidateIf,
  ValidatorConstraint,
} from 'class-validator';
import type {
  ValidationArguments,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  DecimalPrecision,
  Quantifiers,
  QueueModels,
  SimulationType,
  TimeUnit,
} from '../entities/simulation.entity.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'stabilityCondition', async: false })
class StabilityConditionConstraint implements ValidatorConstraintInterface {
  validate(queueModel: QueueModels, args: ValidationArguments) {
    const { lambda, miu, k } = args.object as SimulationDto;
    return isStable(queueModel, lambda, miu, k);
  }

  defaultMessage(args: ValidationArguments) {
    const { lambda, miu, k, queueModel } = args.object as SimulationDto;
    switch (queueModel) {
      case QueueModels.MM1:
        return `lambda=${lambda}/miu=${miu} < 1 does not satisfy the stability condition`;
      case QueueModels.MMK:
        if (!k)
          return 'k is required to calculate the satisfy the stability condition';
        return `lambda=${lambda}/(miu=${miu}*k=${k}) < 1 does not satisfy the stability condition`;
      case QueueModels.MM1MM:
      case QueueModels.MMKMM:
        return 'The stability condition is always satisfied for this model';
    }
  }
}

function isStable(
  queueModels: QueueModels,
  lambda: number,
  miu: number,
  k?: number,
): boolean {
  switch (queueModels) {
    case QueueModels.MM1:
      return lambda / miu < 1;
    case QueueModels.MMK:
      return k !== undefined && lambda / (k * miu) < 1;
    case QueueModels.MM1MM:
      return true;
    case QueueModels.MMKMM:
      return true;
  }
}

export class SimulationDto {
  @ApiProperty({
    default: 2,
    example: 2,
    description: 'Arrival rate (lambda).',
  })
  @Transform(({ value }) => parseFloat(value))
  @IsPositive()
  @IsDefined()
  lambda: number;

  @ApiProperty({
    default: 4,
    example: 4,
    description: 'Service rate (miu).',
  })
  @Transform(({ value }) => parseFloat(value))
  @IsPositive()
  @IsDefined()
  miu: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'System capacity (M), used for finite population models.',
  })
  @ValidateIf(
    (simulation) =>
      simulation.queueModel === QueueModels.MM1MM ||
      simulation.queueModel === QueueModels.MMKMM,
  )
  @Transform(({ value }) => parseInt(value, 10))
  @IsPositive()
  M: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of servers (k), used for multi-server models.',
  })
  @ValidateIf(
    (simulation) =>
      simulation.queueModel === QueueModels.MMK ||
      simulation.queueModel === QueueModels.MMKMM,
  )
  @Transform(({ value }) => parseInt(value, 10))
  @IsPositive()
  k: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Population size (N) used for quantifier probabilities.',
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsPositive()
  @IsOptional()
  N: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Waiting cost per unit of time (Cte).',
  })
  @Transform(({ value }) => parseFloat(value))
  @IsPositive()
  @IsOptional()
  Cte: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Service cost per unit of time (Cts).',
  })
  @Transform(({ value }) => parseFloat(value))
  @IsPositive()
  @IsOptional()
  Cts: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Service cost per server per unit of time (Ctse).',
  })
  @Transform(({ value }) => parseFloat(value))
  @IsPositive()
  @IsOptional()
  Ctse: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Cost per server (Cs).',
  })
  @Transform(({ value }) => parseFloat(value))
  @IsPositive()
  @IsOptional()
  Cs: number;

  @ApiPropertyOptional({
    example: 8,
    description: 'Hours per working day used for cost totals (hr).',
  })
  @Transform(({ value }) => parseFloat(value))
  @IsPositive()
  @IsOptional()
  hr: number;

  @ApiPropertyOptional({ enum: DecimalPrecision, example: DecimalPrecision.D6, description: 'Decimal places for the results.' })
  @Transform(({ value }) => parseInt(value, 10))
  @IsEnum(DecimalPrecision)
  @IsOptional()
  decimalPrecision: DecimalPrecision = DecimalPrecision.D6;

  @ApiPropertyOptional({ enum: SimulationType, example: SimulationType.SYSTEM, description: 'Whether to report system or queue measures.' })
  @Transform(({ value }) => value.toUpperCase())
  @IsEnum(SimulationType)
  @IsOptional()
  simulationType: SimulationType = SimulationType.SYSTEM;

  @ApiPropertyOptional({ enum: TimeUnit, example: TimeUnit.HOURS, description: 'Time unit for waiting times.' })
  @Transform(({ value }) => value.toUpperCase())
  @IsEnum(TimeUnit)
  @IsOptional()
  timeUnit: TimeUnit = TimeUnit.HOURS;

  @ApiPropertyOptional({ enum: Quantifiers, example: Quantifiers.EXACTLY, description: 'Quantifier applied to N.' })
  @ValidateIf((simulation) => !isNaN(simulation.N))
  @Transform(({ value }) => value.toUpperCase())
  @IsEnum(Quantifiers)
  @IsOptional()
  quantifier: Quantifiers = Quantifiers.EXACTLY;

  @ApiProperty({
    enum: QueueModels,
    example: QueueModels.MM1,
    description:
      'Queue model to evaluate. MIU/K stability conditions are validated.',
  })
  @Transform(({ value }) => value.toUpperCase())
  @IsEnum(QueueModels)
  @IsDefined()
  @Validate(StabilityConditionConstraint)
  queueModel: QueueModels;
}
