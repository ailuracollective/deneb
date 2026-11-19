import { useEffect, useRef, useState } from 'react';
import { useForm, useSelector } from '@tanstack/react-form';
import { MoonIcon, SunIcon } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

function needsPopulationFor(model: QueueModel): boolean {
  return model === 'MM1MM' || model === 'MMKMM';
}

function needsServersFor(model: QueueModel): boolean {
  return model === 'MMK' || model === 'MMKMM';
}

function isRequired(value: string, message: string): string | undefined {
  return value.trim() ? undefined : message;
}

function FieldError({ errors }: { errors: unknown[] }) {
  const messages = [...new Set(errors.map(String))];
  if (messages.length === 0) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {messages.join(', ')}
    </p>
  );
}

function errorMessage(payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const { message } = payload as ErrorResponse;
    if (Array.isArray(message)) return message.join('; ');
    if (typeof message === 'string') return message;
  }
  return 'The simulations API rejected the request.';
}

const costColors = [
  'bg-sky-500 dark:bg-sky-400',
  'bg-violet-500 dark:bg-violet-400',
  'bg-amber-500 dark:bg-amber-400',
  'bg-emerald-500 dark:bg-emerald-400',
];

function CostBreakdown({ costs }: { costs: Record<string, number | null> }) {
  const parts = ['CTte', 'CTts', 'CTtse', 'CTs']
    .map((key) => ({ key, value: costs[key] ?? 0 }))
    .filter((part) => part.value > 0);
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  if (total === 0) return null;

  const percentage = (value: number) => Math.round((value / total) * 100);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Cost breakdown</h3>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={parts
          .map(
            (part) =>
              `${labelFor(part.key, costLabels)}: ${percentage(part.value)}%`,
          )
          .join(', ')}
      >
        {parts.map((part, index) => (
          <div
            key={part.key}
            className={costColors[index]}
            style={{ width: `${(part.value / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {parts.map((part, index) => (
          <li key={part.key} className="flex items-center gap-1.5">
            <span className={`size-2 shrink-0 rounded-full ${costColors[index]}`} />
            {labelFor(part.key, costLabels)} · {formatValue(part.value)} (
            {percentage(part.value)}%)
          </li>
        ))}
      </ul>
    </div>
  );
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
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Under lg the results sit below the form, so only then is the jump useful.
    if (!result || !window.matchMedia('(max-width: 1023px)').matches) return;
    resultsRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'start',
    });
  }, [result]);

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      setError(null);

      const needsPopulation = needsPopulationFor(value.queueModel);
      const needsServers = needsServersFor(value.queueModel);

      const params = new URLSearchParams({
        lambda: value.lambda.trim(),
        miu: value.miu.trim(),
        queueModel: value.queueModel,
        decimalPrecision: value.decimalPrecision,
        simulationType: value.simulationType,
        timeUnit: value.timeUnit,
        quantifier: value.quantifier,
      });
      if (needsPopulation) params.set('M', value.m.trim());
      if (needsServers) params.set('k', value.k.trim());

      const optionalFields: Array<[string, string]> = [
        ['N', value.n],
        ['Cte', value.cte],
        ['Cts', value.cts],
        ['Ctse', value.ctse],
        ['Cs', value.cs],
        ['hr', value.hr],
      ];
      for (const [key, fieldValue] of optionalFields) {
        if (fieldValue.trim()) params.set(key, fieldValue.trim());
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
    },
  });

  const queueModel = useSelector(form.store, (state) => state.values.queueModel);
  const needsPopulation = needsPopulationFor(queueModel);
  const needsServers = needsServersFor(queueModel);

  function toggleTheme() {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {}
    setDark(next);
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href="/api/" />}
          >
            API reference
          </Button>
        </div>
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
            <form
              className="space-y-5"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                form.handleSubmit();
              }}
            >
              <div className="space-y-2 sm:w-1/2">
                <Label htmlFor="queueModel">Queue model</Label>
                <form.Field name="queueModel">
                  {(field) => (
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as QueueModel)}
                    >
                      <SelectTrigger id="queueModel" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {queueModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </form.Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lambda">Arrival rate (λ)</Label>
                  <form.Field
                    name="lambda"
                    validators={{
                      onChange: ({ value }) =>
                        isRequired(value, 'Arrival rate (λ) is required.'),
                      onSubmit: ({ value }) =>
                        isRequired(value, 'Arrival rate (λ) is required.'),
                    }}
                  >
                    {(field) => (
                      <>
                        <Input
                          id="lambda"
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0.5"
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                          aria-invalid={field.state.meta.errors.length > 0}
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </>
                    )}
                  </form.Field>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="miu">Service rate (μ)</Label>
                  <form.Field
                    name="miu"
                    validators={{
                      onChange: ({ value }) =>
                        isRequired(value, 'Service rate (μ) is required.'),
                      onSubmit: ({ value }) =>
                        isRequired(value, 'Service rate (μ) is required.'),
                    }}
                  >
                    {(field) => (
                      <>
                        <Input
                          id="miu"
                          type="number"
                          step="any"
                          min="0"
                          placeholder="1"
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                          aria-invalid={field.state.meta.errors.length > 0}
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </>
                    )}
                  </form.Field>
                </div>
              </div>

              {(needsPopulation || needsServers) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {needsPopulation && (
                    <div className="space-y-2">
                      <Label htmlFor="m">Population size (M)</Label>
                      <form.Field
                        name="m"
                        validators={{
                          onChange: ({ value }) =>
                            needsPopulation
                              ? isRequired(
                                  value,
                                  'Population size (M) is required for this model.',
                                )
                              : undefined,
                          onSubmit: ({ value }) =>
                            needsPopulation
                              ? isRequired(
                                  value,
                                  'Population size (M) is required for this model.',
                                )
                              : undefined,
                        }}
                      >
                        {(field) => (
                          <>
                            <Input
                              id="m"
                              type="number"
                              step="1"
                              min="1"
                              value={field.state.value}
                              onChange={(event) => field.handleChange(event.target.value)}
                              aria-invalid={field.state.meta.errors.length > 0}
                            />
                            <FieldError errors={field.state.meta.errors} />
                          </>
                        )}
                      </form.Field>
                    </div>
                  )}
                  {needsServers && (
                    <div className="space-y-2">
                      <Label htmlFor="k">Servers (k)</Label>
                      <form.Field
                        name="k"
                        validators={{
                          onChange: ({ value }) =>
                            needsServers
                              ? isRequired(value, 'Servers (k) is required for this model.')
                              : undefined,
                          onSubmit: ({ value }) =>
                            needsServers
                              ? isRequired(value, 'Servers (k) is required for this model.')
                              : undefined,
                        }}
                      >
                        {(field) => (
                          <>
                            <Input
                              id="k"
                              type="number"
                              step="1"
                              min="1"
                              value={field.state.value}
                              onChange={(event) => field.handleChange(event.target.value)}
                              aria-invalid={field.state.meta.errors.length > 0}
                            />
                            <FieldError errors={field.state.meta.errors} />
                          </>
                        )}
                      </form.Field>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="n">Population (N)</Label>
                <form.Field name="n">
                  {(field) => (
                    <Input
                      id="n"
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Optional"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                  )}
                </form.Field>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timeUnit">Time unit</Label>
                  <form.Field name="timeUnit">
                    {(field) => (
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value as TimeUnit)}
                      >
                        <SelectTrigger id="timeUnit" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit.toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </form.Field>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="simulationType">Simulation type</Label>
                  <form.Field name="simulationType">
                    {(field) => (
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as SimulationType)
                        }
                      >
                        <SelectTrigger id="simulationType" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {simulationTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </form.Field>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantifier">Quantifier</Label>
                  <form.Field name="quantifier">
                    {(field) => (
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as Quantifier)
                        }
                      >
                        <SelectTrigger id="quantifier" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {quantifiers.map((quantifier) => (
                            <SelectItem key={quantifier} value={quantifier}>
                              {quantifier.toLowerCase().replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </form.Field>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="decimalPrecision">Decimal precision</Label>
                  <form.Field name="decimalPrecision">
                    {(field) => (
                      <Input
                        id="decimalPrecision"
                        type="number"
                        min="3"
                        max="10"
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                      />
                    )}
                  </form.Field>
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
                    <form.Field name={key}>
                      {(field) => (
                        <Input
                          id={key}
                          type="number"
                          step="any"
                          min="0"
                          placeholder="Optional"
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                        />
                      )}
                    </form.Field>
                  </div>
                ))}
              </div>

              <Button className="w-full" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Calculating…' : 'Calculate simulation'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="min-w-0" ref={resultsRef}>
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
                  <>
                    <MeasureTable title="Costs" entries={result.costs} labels={costLabels} />
                    <CostBreakdown costs={result.costs} />
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
