# Inertia React UI

Migrate Deneb's Handlebars home page to a React client rendered through the updated NestJS Hono adapter's Inertia bridge, with a shadcn-based console for the existing simulations API.

## Specs

S1. "recientemente el adaptador de nestjs para hono se actualizo y ahora tiene siporte para inertia"
S2. "quiero que miener desde el motor de plantillas a react"
S3. "usa shadcn en su ultima version"
S4. "para crea una interfaz que permita consumirl el api ya dispinible"

## Tasks

- T1 [S1,S2] → Upgrade the Hono adapter and wire the Inertia bridge, root shell and client asset serving. Commit: c623caa
- T2 [S2,S3] → Add the Vite/React/TypeScript/Tailwind/shadcn toolchain, client entry and page resolver. Commit: c623caa
- T3 [S4] → Build the simulations console form and results view with shadcn components against GET /api/v1/simulations. Commit: cd9122a
- T4 [S1-S4] → Add tests and docs; run focused checks, build, lint and the full suite. Commit: 835b9b1

## Log

L1: "recientemente el adaptador de nestjs para hono se actualizo y ahora tiene siporte para inertia, quiero que miener desde el motor de plantillas a react usa shadcn en su ultima version para crea una interfaz que permita consumirl el api ya dispinible"

L2 (evidence): npm latest is @ailura/nestjs-hono-adapter 2.2.0; Inertia support ships as the bridge package @ailura/nestjs-platform-hono-inertia 0.2.0 over @dudousxd/nestjs-inertia 3.0.1. The bridge requires `import '@ailura/nestjs-platform-hono-inertia/register'` before Nest application creation.

L3 (decision): the existing root Handlebars page is replaced by the Inertia React page. `GET /api`, `/api-json` and `/api/v1/simulations` remain unchanged.

L4 (decision): the React client is built by Vite with a manifest and served through the adapter's `useStaticAssets`. The `@dudousxd/nestjs-inertia-vite` helper is not used because its Express/Connect middleware is not a Hono middleware; local development uses `vite build --watch` with a production-mode manifest.

L5 (decision): no artboards are produced; the production UI is implemented directly with the latest shadcn CLI/components and gentle-ui-design guidance for hierarchy, feedback and responsive states.

L6 (evidence): the three Simulation page behavior tests began with two passes and one RED failure because native browser validation prevented the invalid form from reaching the API; adding `noValidate` preserved the assertions. Final checks are green: client tests 3/3, Hono/Inertia e2e 2/2, server tests 3/3, client typecheck, lint, Vite+Nest build and the combined suite all exit 0. The e2e covers both the 409 version handshake followed by a 200 JSON `Simulations/Index` page and the initial HTML shell with hashed client assets from the Vite manifest. TS5101 was resolved by removing the deprecated `baseUrl` from both tsconfigs; the page glob is typed as `{ default: ComponentType }` and the spec lives outside `pages/` so it is not bundled into the client.

L7 (decision): `test:e2e` builds the client before running Vitest so the manifest-backed shell assertion is deterministic; the e2e sets `NODE_ENV=production` before app creation for the same reason.

L8 (evidence): delivery slices are c623caa (adapter/bridge/toolchain/root shell and generated shadcn primitives; oversized because the pnpm lockfile and generated primitives belong to one coherent setup), cd9122a (console page and shared types), 835b9b1 (client tests, Hono/Inertia e2e and README). An unrelated Prettier-only rewrite of two simulation files produced by `lint --fix` was restored before committing.
