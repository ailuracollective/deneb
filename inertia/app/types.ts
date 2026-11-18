export type QueueModel = 'MM1' | 'MM1MM' | 'MMK' | 'MMKMM';
export type TimeUnit = 'MILLISECONDS' | 'SECONDS' | 'MINUTES' | 'HOURS' | 'DAYS';
export type SimulationType = 'SYSTEM' | 'QUEUE';
export type Quantifier = 'EXACTLY' | 'AT_LEAST' | 'AT_MOST';

export interface SimulationFormValues {
  lambda: string;
  miu: string;
  queueModel: QueueModel;
  m: string;
  k: string;
  n: string;
  cte: string;
  cts: string;
  ctse: string;
  cs: string;
  hr: string;
  decimalPrecision: string;
  simulationType: SimulationType;
  timeUnit: TimeUnit;
  quantifier: Quantifier;
}

export interface SimulationResponse {
  parameters: {
    simulationParameters: Record<string, number>;
    simulationCosts?: Record<string, number>;
  };
  performanceMeasures: {
    specificPerformanceMeasures: Record<string, number | null>;
    generalPerformanceMeasures: Record<string, number | null>;
  };
  costs?: Record<string, number>;
  info: {
    decimalPrecision: number;
    simulationType: SimulationType;
    queueModel: QueueModel;
    timeUnit: TimeUnit;
    quantifier: Quantifier;
  };
}

export interface ErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}
