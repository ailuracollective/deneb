import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Index from '../pages/Simulations/Index';
import type { SimulationResponse } from '@/types';

const successfulResult: SimulationResponse = {
  parameters: {
    simulationParameters: { lambda: 0.5, miu: 1, N: 100 },
    simulationCosts: { hr: 10 },
  },
  performanceMeasures: {
    specificPerformanceMeasures: { p: 0.5, p0: 0.5, pn: 0.25 },
    generalPerformanceMeasures: { L: 1, Lq: 0.5, Ln: 0.5, W: 2, Wq: 1, Wn: 1 },
  },
  costs: { CTte: 100, CTts: 50, CTtse: 25, CTs: 10, CT: 185 },
  info: {
    decimalPrecision: 6,
    simulationType: 'SYSTEM',
    queueModel: 'MM1',
    timeUnit: 'HOURS',
    quantifier: 'EXACTLY',
  },
};

const props = {
  tittle: 'Deneb API ✨ Queuing theory calculator',
  nameProject: 'Deneb Api',
  description: 'Queuing theory calculator',
};

describe('Sim simulations page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the current form to the simulations API and renders its result', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => successfulResult,
    });
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<Index {...props} />);

    await user.type(screen.getByLabelText('Arrival rate (λ)'), '0.5');
    await user.type(screen.getByLabelText('Service rate (μ)'), '1');
    await user.type(screen.getByLabelText('Population (N)'), '100');
    await user.click(screen.getByRole('button', { name: 'Calculate simulation' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string, 'http://localhost');
    expect(requestedUrl.pathname).toBe('/api/v1/simulations');
    expect(Object.fromEntries(requestedUrl.searchParams)).toMatchObject({
      lambda: '0.5',
      miu: '1',
      queueModel: 'MM1',
      N: '100',
      simulationType: 'SYSTEM',
      timeUnit: 'HOURS',
      quantifier: 'EXACTLY',
      decimalPrecision: '6',
    });

    expect(await screen.findByText('185')).toBeTruthy();
    expect(screen.getByText('Queue length (L)')).toBeTruthy();
  });

  it('shows population and server fields only for the models that use them', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const user = userEvent.setup();
    render(<Index {...props} />);

    expect(screen.queryByLabelText('Population size (M)')).toBeNull();
    expect(screen.queryByLabelText('Servers (k)')).toBeNull();

    await user.selectOptions(screen.getByLabelText('Queue model'), 'MM1MM');
    expect(screen.getByLabelText('Population size (M)')).toBeTruthy();

    await user.selectOptions(screen.getByLabelText('Queue model'), 'MMK');
    expect(screen.getByLabelText('Servers (k)')).toBeTruthy();
    expect(screen.queryByLabelText('Population size (M)')).toBeNull();
  });

  it('shows the validation message returned by the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        statusCode: 400,
        message: ['lambda must be a positive number', 'miu must be a positive number'],
        error: 'Bad Request',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<Index {...props} />);
    await user.type(screen.getByLabelText('Arrival rate (λ)'), '-1');
    await user.type(screen.getByLabelText('Service rate (μ)'), '0');
    await user.click(screen.getByRole('button', { name: 'Calculate simulation' }));

    expect(
      await screen.findByText('lambda must be a positive number; miu must be a positive number'),
    ).toBeTruthy();
  });
});
