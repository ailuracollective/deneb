import { combinations, factorial, permutations } from 'mathjs';

export enum DecimalPrecision {
  D3 = 3,
  D4 = 4,
  D5 = 5,
  D6 = 6,
  D7 = 7,
  D8 = 8,
  D9 = 9,
  D10 = 10,
}

export enum Quantifiers {
  EXACTLY = 'EXACTLY',
  AT_LEAST = 'AT_LEAST',
  AT_MOST = 'AT_MOST',
}

export enum QueueModels {
  MM1 = 'MM1',
  MM1MM = 'MM1MM',
  MMK = 'MMK',
  MMKMM = 'MMKMM',
}

export enum SimulationType {
  SYSTEM = 'SYSTEM',
  QUEUE = 'QUEUE',
}

export enum TimeUnit {
  MILLISECONDS = 'MILLISECONDS',
  SECONDS = 'SECONDS',
  MINUTES = 'MINUTES',
  HOURS = 'HOURS',
  DAYS = 'DAYS',
}

export interface GeneralPerformanceMeasures {
  L: number;
  Lq: number;
  Ln: number;
  W: number;
  Wq: number;
  Wn: number;
}

export interface Info {
  decimalPrecision: DecimalPrecision;
  simulationType: SimulationType;
  queueModel: QueueModels;
  timeUnit: TimeUnit;
  quantifier: Quantifiers;
}

export interface SimulationCosts {
  Cte: number;
  Cts: number;
  Ctse: number;
  Cs: number;
  hr: number;
}

export interface TotalSimulationCosts {
  CTte: number;
  CTts: number;
  CTtse: number;
  CTs: number;
  CT: number;
}

export interface SimulationParameters {
  lambda: number;
  miu: number;
  M?: number;
  k?: number;
  N?: number;
}

export interface InputParameters {
  simulationParameters: SimulationParameters;
  simulationCosts: SimulationCosts;
  info: Info;
}

export interface SpecificPerformanceMeasures {
  p: number;
  p0: number;
  pn?: number;
  pe?: number;
  pne?: number;
  pk?: number;
}

export interface SimulationResults {
  parameters: {
    simulationParameters: SimulationParameters;
    simulationCosts?: SimulationCosts;
  };
  performanceMeasures: {
    specificPerformanceMeasures: SpecificPerformanceMeasures;
    generalPerformanceMeasures: GeneralPerformanceMeasures;
  };
  costs?: TotalSimulationCosts;
  info: Info;
}

export class Simulation {
  private readonly lambda: number;
  private readonly miu: number;
  private readonly M: number;
  private readonly k: number;
  private readonly N: number;
  private readonly Cte: number;
  private readonly Cts: number;
  private readonly Ctse: number;
  private readonly Cs: number;
  private readonly hr: number;
  private readonly decimalPrecision: DecimalPrecision;
  private readonly simulationType: SimulationType;
  private readonly queueModel: QueueModels;
  private readonly timeUnit: TimeUnit;
  private readonly quantifier: Quantifiers;
  private P: number;
  private P0: number;
  private PN: number;
  private PK: number;
  private PE: number;
  private PNE: number;
  private W: number;
  private WQ: number;
  private WN: number;
  private L: number;
  private LQ: number;
  private LN: number;
  private CT: number;
  private CTs: number;
  private CTte: number;
  private CTts: number;
  private CTtse: number;
  private multiplier: number;
  constructor(inputParameters: InputParameters) {
    const { simulationParameters, simulationCosts, info } = inputParameters;
    this.lambda = simulationParameters.lambda;
    this.miu = simulationParameters.miu;
    this.N = simulationParameters.N!;
    this.decimalPrecision = info.decimalPrecision;
    this.simulationType = info.simulationType;
    this.queueModel = info.queueModel;
    this.timeUnit = info.timeUnit;
    switch (this.timeUnit) {
      case TimeUnit.MILLISECONDS:
        this.multiplier = 3600002.88;
        break;
      case TimeUnit.SECONDS:
        this.multiplier = 3600;
        break;
      case TimeUnit.MINUTES:
        this.multiplier = 60;
        break;
      case TimeUnit.HOURS:
        this.multiplier = 1;
        break;
      case TimeUnit.DAYS:
        this.multiplier = 0.0416667;
        break;
    }
    if (this.N > 0) this.quantifier = info.quantifier;
    if (
      this.queueModel == QueueModels.MM1MM ||
      this.queueModel == QueueModels.MMKMM
    )
      this.M = simulationParameters.M!;
    if (
      this.queueModel == QueueModels.MMK ||
      this.queueModel == QueueModels.MMKMM
    )
      this.k = simulationParameters.k!;
    this.Cte = simulationCosts.Cte;
    this.Cts = simulationCosts.Cts;
    this.Ctse = simulationCosts.Ctse;
    this.Cs = simulationCosts.Cs;
    if (this.Cts > 0 || this.Cte > 0 || this.Ctse > 0 || this.Cs > 0)
      this.hr = simulationCosts.hr;
  }
  private calculateAll() {
    this.P = this.calculateP();
    this.P0 = this.calculateP0();
    this.PK = this.calculatePk()!;
    this.PE = this.calculatePe()!;
    this.PNE = this.calculatePne()!;
    if (this.N > 0) this.PN = this.calculatePn();
    this.L = this.calculateL();
    this.LQ = this.calculateLq();
    this.LN = this.calculateLn();
    this.W = this.calculateW();
    this.WQ = this.calculateWq();
    this.WN = this.calculateWn();
    if (this.Cte > 0 || this.Cts > 0 || this.Ctse > 0 || this.Cs > 0) {
      this.CTte = this.calculateCTte(this.lambda, this.WQ, this.Cte, this.hr);
      this.CTts = this.calculateCTts(this.lambda, this.W, this.Cts, this.hr);
      this.CTtse = this.calculateCTtse(
        this.lambda,
        this.miu,
        this.Ctse,
        this.hr,
      );
      this.CTs = this.calculateCTs(this.Cs, this.k);
      this.CT = this.calculateCT(this.CTte, this.CTts, this.CTtse, this.CTs);
    }
  }
  private calculateP(): number {
    return this.lambda / this.miu;
  }
  private calculateP0(): number {
    let sum = 0;
    switch (this.queueModel) {
      case QueueModels.MM1:
        return 1 - this.P;
      case QueueModels.MMK:
        for (let n = 0; n <= this.k - 1; n++) {
          sum += this.P ** n / factorial(n);
        }
        sum +=
          (this.P ** this.k / factorial(this.k)) *
          ((this.k * this.miu) / (this.k * this.miu - this.lambda));
        return 1 / sum;
      case QueueModels.MM1MM:
        for (let n = 0; n <= this.M; n++) {
          sum += permutations(this.M, n) * this.P ** n;
        }
        return 1 / sum;
      case QueueModels.MMKMM:
        for (let n = 0; n <= this.k - 1; n++) {
          sum += combinations(this.M, n) * this.P ** n;
        }
        for (let n = this.k; n <= this.M; n++) {
          sum +=
            (permutations(this.M, n) * this.P ** n) /
            (factorial(this.k) * this.k ** (n - this.k));
        }
        return 1 / sum;
    }
  }
  private calculatePn(): number {
    if (this.N > 0) return this.PN;
    let n: number = this.N;
    if (this.simulationType == SimulationType.SYSTEM) n = this.N;
    else if (this.simulationType == SimulationType.QUEUE) {
      if (
        this.queueModel == QueueModels.MMK ||
        this.queueModel == QueueModels.MMKMM
      )
        n = this.N + this.k;
      else n = this.N + 1;
    }
    switch (this.quantifier) {
      case Quantifiers.EXACTLY:
        return this.calculateExactPn(n);
      case Quantifiers.AT_MOST:
        return this.calculateMaxPn(n);
      case Quantifiers.AT_LEAST:
        return this.calculateMinPn(n);
    }
  }
  private calculatePk(): number | undefined {
    if (this.queueModel == QueueModels.MMK)
      return (
        (((this.P ** this.k / factorial(this.k)) * (this.k * this.miu)) /
          (this.k * this.miu - this.lambda)) *
        this.P0
      );
  }
  private calculatePe(): number | undefined {
    if (this.queueModel == QueueModels.MM1MM) return 1 - this.P0;
    else if (this.queueModel == QueueModels.MMKMM) {
      let sum = 0;
      for (let n = 0; n <= this.k - 1; n++) {
        sum += this.calculateExactPn(n);
      }
      return 1 - sum;
    }
  }
  private calculatePne(): number | undefined {
    if (this.queueModel == QueueModels.MMK) return 1 - this.PK;
    if (this.queueModel == QueueModels.MMKMM) return 1 - this.PE;
  }
  private calculateW(): number {
    switch (this.queueModel) {
      case QueueModels.MM1:
        return this.L / this.lambda;
      case QueueModels.MMK:
        return this.LQ / this.lambda + 1 / this.miu;
      default:
        return this.LQ / ((this.M - this.L) * this.lambda) + 1 / this.miu;
    }
  }
  private calculateWq(): number {
    switch (this.queueModel) {
      case QueueModels.MM1:
        return this.W * this.P;
      case QueueModels.MMK:
        return this.LQ / this.lambda;
      default:
        return this.W - 1 / this.miu;
    }
  }
  private calculateWn(): number {
    switch (this.queueModel) {
      case QueueModels.MM1:
        return this.W;
      case QueueModels.MMK:
        return this.WQ / this.PK;
      default:
        return this.WQ / this.PE;
    }
  }
  private calculateL(): number {
    switch (this.queueModel) {
      case QueueModels.MM1:
        return this.lambda / (this.miu - this.lambda);
      case QueueModels.MMK:
        return (
          (this.lambda * this.miu * this.P ** this.k * this.P0) /
            (factorial(this.k - 1) * (this.k * this.miu - this.lambda) ** 2) +
          this.P
        );
      case QueueModels.MM1MM:
        return this.M - (this.miu / this.lambda) * this.PE;
      case QueueModels.MMKMM: {
        let sum = 0;
        for (let n = 0; n <= this.k - 1; n++) {
          sum += n * this.calculateExactPn(n);
        }
        for (let n = this.k; n <= this.M; n++) {
          sum += (n - this.k) * this.calculateExactPn(n);
        }
        let aux = 0;
        for (let n = 0; n <= this.k - 1; n++) {
          aux += this.calculateExactPn(n);
        }
        sum += this.k * (1 - aux);
        return sum;
      }
    }
  }
  private calculateLq(): number {
    switch (this.queueModel) {
      case QueueModels.MM1MM:
        return this.M - ((this.miu + this.lambda) / this.lambda) * this.PE;
      case QueueModels.MMKMM: {
        let sum = 0;
        for (let n = this.k; n <= this.M; n++) {
          sum += (n - this.k) * this.calculateExactPn(n);
        }
        return sum;
      }
      default:
        return this.L * this.P;
    }
  }
  private calculateLn(): number {
    switch (this.queueModel) {
      case QueueModels.MM1:
        return this.L;
      case QueueModels.MMK:
        return this.LQ / this.PK;
      default:
        return this.LQ / this.PE;
    }
  }
  private calculateExactPn(n: number = this.N): number {
    const base = this.P ** n * this.P0;
    switch (this.queueModel) {
      case QueueModels.MM1:
        return base;
      case QueueModels.MMK:
        return n < this.k
          ? base / factorial(n)
          : base / (factorial(this.k) * this.k ** (n - this.k));
      case QueueModels.MM1MM:
        return base * permutations(this.M, n);
      case QueueModels.MMKMM:
        return 0 <= n && n <= this.k
          ? base * combinations(this.M, n)
          : (base * permutations(this.M, n)) /
              (factorial(this.k) * this.k ** (n - this.k));
    }
  }
  private calculateMaxPn(end: number): number {
    let sum = 0;
    for (let i = 0; i <= end; i++) {
      sum += this.calculateExactPn(i);
    }
    return sum;
  }
  private calculateMinPn(start: number): number {
    return 1 - this.calculateMaxPn(start - 1);
  }
  getAllCalculations(): SimulationResults {
    this.calculateAll();
    return {
      parameters: {
        simulationParameters: {
          lambda: this.fixed(this.lambda, this.decimalPrecision),
          miu: this.fixed(this.miu, this.decimalPrecision),
          M: this.M,
          k: this.k,
          N: this.N,
        },
        simulationCosts: this.omitUndefined({
          Cte: this.fixed(this.Cte, this.decimalPrecision),
          Cts: this.fixed(this.Cts, this.decimalPrecision),
          Ctse: this.fixed(this.Ctse, this.decimalPrecision),
          Cs: this.fixed(this.Cs, this.decimalPrecision),
          hr: this.fixed(this.hr, this.decimalPrecision),
        }),
      },
      performanceMeasures: {
        specificPerformanceMeasures: {
          p: this.fixed(this.P, this.decimalPrecision),
          p0: this.fixed(this.P0, this.decimalPrecision),
          pk: this.fixed(this.PK, this.decimalPrecision),
          pn: this.fixed(this.PN, this.decimalPrecision),
          pe: this.fixed(this.PE, this.decimalPrecision),
          pne: this.fixed(this.PNE, this.decimalPrecision),
        },
        generalPerformanceMeasures: {
          L: this.fixed(this.L, this.decimalPrecision),
          Lq: this.fixed(this.LQ, this.decimalPrecision),
          Ln: this.fixed(this.LN, this.decimalPrecision),
          W: this.fixed(this.W * this.multiplier, this.decimalPrecision),
          Wq: this.fixed(this.WQ * this.multiplier, this.decimalPrecision),
          Wn: this.fixed(this.WN * this.multiplier, this.decimalPrecision),
        },
      },
      costs: this.omitUndefined({
        CTte: this.fixed(this.CTte, this.decimalPrecision),
        CTts: this.fixed(this.CTts, this.decimalPrecision),
        CTtse: this.fixed(this.CTtse, this.decimalPrecision),
        CTs: this.fixed(this.CTs, this.decimalPrecision),
        CT: this.fixed(this.CT, this.decimalPrecision),
      }),
      info: {
        decimalPrecision: this.decimalPrecision,
        simulationType: this.simulationType,
        queueModel: this.queueModel,
        timeUnit: this.timeUnit,
        quantifier: this.quantifier,
      },
    };
  }

  private omitUndefined<T extends object>(object: T): T | undefined {
    const hasDefinedValue = Object.values(object).some(
      (value) => value !== undefined,
    );
    return hasDefinedValue ? object : undefined;
  }
  fixed(number: number, fix: number): number;
  fixed(number: number | undefined, fix: number): number | undefined;
  fixed(number: number | undefined, fix: number): number | undefined {
    if (number === undefined) return undefined;
    return Number(number.toFixed(fix));
  }
  private calculateCTte(
    lambda: number,
    WQ: number,
    Cte: number,
    hr = 8,
  ): number {
    return Cte ? lambda * hr * WQ * Cte : 0;
  }
  private calculateCTts(
    lambda: number,
    W: number,
    Cts: number,
    hr = 8,
  ): number {
    return Cts ? lambda * hr * W * Cts : 0;
  }
  private calculateCTtse(
    lambda: number,
    miu: number,
    Ctse: number,
    hr = 8,
  ): number {
    return Ctse ? lambda * hr * (1 / miu) * Ctse : 0;
  }
  private calculateCTs(Cs: number, k?: number): number {
    return Cs ? (k ? k * Cs : Cs) : 0;
  }
  private calculateCT(...costs: number[]): number {
    const total = costs.reduce((total, num) => total + num, 0);
    return total ? total : 0;
  }
}
