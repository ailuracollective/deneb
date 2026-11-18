import '@ailura/nestjs-platform-hono-inertia/register';

import { Test, type TestingModule } from '@nestjs/testing';
import {
  ServerAdapter,
  type NestHonoApplication,
} from '@ailura/nestjs-hono-adapter';
import { fetchServer } from '@ailura/nestjs-hono-adapter/fetch';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: NestHonoApplication;
  let adapter: ServerAdapter;

  beforeEach(async () => {
    process.env.NODE_ENV = 'production';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    adapter = new ServerAdapter({ transport: fetchServer() });
    app = moduleFixture.createNestApplication<NestHonoApplication>(adapter);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET) returns the Inertia page without reading the Vite manifest', async () => {
    const versionResponse = await adapter.getHono().request('/', {
      headers: { 'X-Inertia': 'true' },
    });
    expect(versionResponse.status).toBe(409);
    const assetVersion = versionResponse.headers.get('X-Inertia-Version');
    expect(assetVersion).toBeTruthy();

    const response = await adapter.getHono().request('/', {
      headers: {
        'X-Inertia': 'true',
        'X-Inertia-Version': assetVersion as string,
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/application\/json/);
    await expect(response.json()).resolves.toMatchObject({
      component: 'Simulations/Index',
    });
  });

  it('/ (GET) renders the Inertia shell with built client assets', async () => {
    const response = await adapter.getHono().request('/');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/text\/html/);
    const html = await response.text();
    expect(html).toContain('Simulations\\/Index');
    expect(html).toMatch(
      /<script type="module" src="\/assets\/client-[^"]+\.js"><\/script>/,
    );
  });
});
