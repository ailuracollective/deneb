import type { FormEvent } from 'react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  ErrorResponse,
  QueueModel,
  Quantifier,
  SimulationFormValues,
  SimulationResponse,
  SimulationType,
  TimeUnit,
} from '@/types';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface PageProps {
  tittle?: string;
  nameProject?: string;
  description?: string;
}

const initialValues: SimulationFormValues = {
  lambda: '',
  miu: '',
  queueModel: 'MM1',
  m: '',
  k: '',
  n: '',
  cte: '',
  cts: '',
  ctse: '',
  cs: '',
  hr: '',
  decimalPrecision: '6',
  simulationType: 'SYSTEM',
  timeUnit: 'HOURS',
  quantifier: 'EXACTLY',
};

const queueModels: QueueModel[] = ['MM1', 'MM1MM', 'MMK', 'MMKMM'];
const timeUnits: TimeUnit[] = [
  'MILLISECONDS',
  'SECONDS',
  'MINUTES',
  'HOURS',
  'DAYS',
];
const simulationTypes: SimulationType[] = ['SYSTEM', 'QUEUE'];
const quantifiers: Quantifier[] = ['EXACTLY', 'AT_LEAST', 'AT_MOST'];

const generalLabels: Record<string, string> = {
  L: 'Queue length (L)',
  Lq: 'Waiting-line length (Lq)',
  Ln: 'Arrivals left behind (Ln)',
  W: 'Time in system (W)',
  Wq: 'Waiting time (Wq)',
  Wn: 'Time left behind (Wn)',
};

const specificLabels: Record<string, string> = {
  p: 'Utilization (p)',
  p0: 'Empty-system probability (p0)',
  pn: 'Finite-population probability (pn)',
  pe: 'Server-empty probability (pe)',
  pne: 'Finite-population server-empty probability (pne)',
  pk: 'K-server probability (pk)',
};

const costLabels: Record<string, string> = {
  CTte: 'Total service cost (CTte)',
  CTts: 'Total waiting cost (CTts)',
  CTtse: 'Total left-behind cost (CTtse)',
  CTs: 'Total server cost (CTs)',
  CT: 'Total cost (CT)',
};

const parameterLabels: Record<string, string> = {
  lambda: 'Arrival rate (λ)',
  miu: 'Service rate (μ)',
  M: 'Population size (M)',
  k: 'Servers (k)',
  N: 'Population (N)',
};

function formatValue(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : String(value);
}

function labelFor(key: string, labels: Record<string, string>): string {
  return labels[key] ?? key;
}

function errorMessage(payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const { message } = payload as ErrorResponse;
    if (Array.isArray(message)) return message.join('; ');
    if (typeof message === 'string') return message;
  }
  return 'The simulations API rejected the request.';
}

function MeasureTable({
  title,
  entries,
  labels,
}: {
  title: string;
  entries: Record<string, number | null>;
  labels: Record<string, string>;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Measure</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(entries).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell>{labelFor(key, labels)}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatValue(value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Index({ nameProject, description }: PageProps) {
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResponse | null>(null);

  const needsPopulation = values.queueModel === 'MM1MM' || values.queueModel === 'MMKMM';
  const needsServers = values.queueModel === 'MMK' || values.queueModel === 'MMKMM';

  function update<K extends keyof SimulationFormValues>(
    key: K,
    value: SimulationFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!values.lambda.trim() || !values.miu.trim()) {
      setResult(null);
      setStatus('error');
      setError('Arrival rate and service rate are required.');
      return;
    }
    if (needsPopulation && !values.m.trim()) {
      setResult(null);
      setStatus('error');
      setError('Population size (M) is required for this model.');
      return;
    }
    if (needsServers && !values.k.trim()) {
      setResult(null);
      setStatus('error');
      setError('Servers (k) is required for this model.');
      return;
    }

    const params = new URLSearchParams({
      lambda: values.lambda.trim(),
      miu: values.miu.trim(),
      queueModel: values.queueModel,
      decimalPrecision: values.decimalPrecision,
      simulationType: values.simulationType,
      timeUnit: values.timeUnit,
      quantifier: values.quantifier,
    });
    if (needsPopulation) params.set('M', values.m.trim());
    if (needsServers) params.set('k', values.k.trim());

    const optionalFields: Array<[string, string]> = [
      ['N', values.n],
      ['Cte', values.cte],
      ['Cts', values.cts],
      ['Ctse', values.ctse],
      ['Cs', values.cs],
      ['hr', values.hr],
    ];
    for (const [key, value] of optionalFields) {
      if (value.trim()) params.set(key, value.trim());
    }

    setStatus('loading');
    try {
      const response = await fetch(`/api/v1/simulations?${params.toString()}`);
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(errorMessage(payload));
      }
      setResult(payload as SimulationResponse);
      setStatus('success');
    } catch (cause) {
      setResult(null);
      setStatus('error');
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to reach the simulations API.',
      );
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="secondary">Queue theory simulator</Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {nameProject ?? 'Deneb'}
          </h1>
          <p className="text-muted-foreground">{description ?? 'Queuing theory calculator'}</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/api/">API reference</a>
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Simulation parameters</CardTitle>
            <CardDescription>
              Configure a queue model and calculate its performance measures.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" noValidate onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="queueModel">Queue model</Label>
                <NativeSelect
                  id="queueModel"
                  value={values.queueModel}
                  onChange={(event) =>
                    update('queueModel', event.target.value as QueueModel)
                  }
                >
                  {queueModels.map((model) => (
                    <NativeSelectOption key={model} value={model}>
                      {model}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lambda">Arrival rate (λ)</Label>
                  <Input
                    id="lambda"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.5"
                    value={values.lambda}
                    onChange={(event) => update('lambda', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="miu">Service rate (μ)</Label>
                  <Input
                    id="miu"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="1"
                    value={values.miu}
                    onChange={(event) => update('miu', event.target.value)}
                  />
                </div>
              </div>

              {(needsPopulation || needsServers) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {needsPopulation && (
                    <div className="space-y-2">
                      <Label htmlFor="m">Population size (M)</Label>
                      <Input
                        id="m"
                        type="number"
                        step="1"
                        min="1"
                        value={values.m}
                        onChange={(event) => update('m', event.target.value)}
                      />
                    </div>
                  )}
                  {needsServers && (
                    <div className="space-y-2">
                      <Label htmlFor="k">Servers (k)</Label>
                      <Input
                        id="k"
                        type="number"
                        step="1"
                        min="1"
                        value={values.k}
                        onChange={(event) => update('k', event.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="n">Population (N)</Label>
                <Input
                  id="n"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Optional"
                  value={values.n}
                  onChange={(event) => update('n', event.target.value)}
                />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timeUnit">Time unit</Label>
                  <NativeSelect
                    id="timeUnit"
                    value={values.timeUnit}
                    onChange={(event) =>
                      update('timeUnit', event.target.value as TimeUnit)
                    }
                  >
                    {timeUnits.map((unit) => (
                      <NativeSelectOption key={unit} value={unit}>
                        {unit.toLowerCase()}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="simulationType">Simulation type</Label>
                  <NativeSelect
                    id="simulationType"
                    value={values.simulationType}
                    onChange={(event) =>
                      update('simulationType', event.target.value as SimulationType)
                    }
                  >
                    {simulationTypes.map((type) => (
                      <NativeSelectOption key={type} value={type}>
                        {type.toLowerCase()}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantifier">Quantifier</Label>
                  <NativeSelect
                    id="quantifier"
                    value={values.quantifier}
                    onChange={(event) =>
                      update('quantifier', event.target.value as Quantifier)
                    }
                  >
                    {quantifiers.map((quantifier) => (
                      <NativeSelectOption key={quantifier} value={quantifier}>
                        {quantifier.toLowerCase().replace('_', ' ')}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="decimalPrecision">Decimal precision</Label>
                  <Input
                    id="decimalPrecision"
                    type="number"
                    min="3"
                    max="10"
                    value={values.decimalPrecision}
                    onChange={(event) =>
                      update('decimalPrecision', event.target.value)
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ['cte', 'Service cost (Cte)'],
                    ['cts', 'Waiting cost (Cts)'],
                    ['ctse', 'Left-behind cost (Ctse)'],
                    ['cs', 'Server cost (Cs)'],
                    ['hr', 'Hourly rate (hr)'],
                  ] as const
                ).map(([key, label]) => (
                  <div className="space-y-2" key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Optional"
                      value={values[key]}
                      onChange={(event) => update(key, event.target.value)}
                    />
                  </div>
                ))}
              </div>

              <Button className="w-full" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Calculating…' : 'Calculate simulation'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Results</CardTitle>
              {result && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{result.info.queueModel}</Badge>
                  <Badge variant="outline">
                    {result.info.timeUnit.toLowerCase()}
                  </Badge>
                </div>
              )}
            </div>
            <CardDescription>
              Performance measures and costs returned by the simulations API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" role="alert" aria-live="polite">
                <AlertTitle>Request failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!result && status !== 'error' && (
              <p className="text-muted-foreground text-sm">
                Run a simulation to see its parameters, performance measures and costs.
              </p>
            )}

            {result && (
              <div className="space-y-6">
                <MeasureTable
                  title="Simulation parameters"
                  entries={result.parameters.simulationParameters}
                  labels={parameterLabels}
                />
                <MeasureTable
                  title="Specific performance measures"
                  entries={result.performanceMeasures.specificPerformanceMeasures}
                  labels={specificLabels}
                />
                <MeasureTable
                  title="General performance measures"
                  entries={result.performanceMeasures.generalPerformanceMeasures}
                  labels={generalLabels}
                />
                {result.costs && (
                  <MeasureTable title="Costs" entries={result.costs} labels={costLabels} />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
