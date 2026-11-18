# Deneb

API REST y consola web para calcular medidas de rendimiento en modelos de colas M/M/1, M/M/K, M/M/1/M/M y M/M/K/M/M.

## Stack

- **Framework**: NestJS 12
- **Servidor HTTP**: Hono mediante `@ailura/nestjs-hono-adapter` 2.2
- **Renderizado de páginas**: puente Inertia con `@ailura/nestjs-platform-hono-inertia`
- **Cliente**: React 19, TypeScript, Vite y componentes shadcn
- **Runtime**: Node.js 24.x
- **Gestor de paquetes**: pnpm

## Descripción

Deneb permite resolver problemas de teoría de colas desde la consola React disponible en `GET /` o consumir directamente su API REST. La consola utiliza los componentes shadcn para configurar los parámetros, consultar `GET /api/v1/simulations` y presentar las medidas y los costes devueltos por el servidor.

La API pública también está disponible en https://deneb.vercel.app/api/v1/simulations.

## Requisitos

- Node.js 24.x
- pnpm 12.9.1

## Instalación

```bash
pnpm install
```

## Desarrollo

El cliente se compila con Vite y el servidor NestJS carga sus archivos mediante el manifiesto generado. Abre dos terminales y ejecuta primero la compilación del cliente en modo watch:

```bash
# Terminal 1: compilar y observar el cliente
pnpm run dev:client
```

Después, con el primer proceso todavía activo, inicia el servidor:

```bash
# Terminal 2: iniciar y observar NestJS
pnpm run start:dev
```

Los scripts `start`, `start:dev`, `start:debug` y `start:prod` establecen `NODE_ENV=production`; por eso el servidor utiliza el manifiesto de Vite incluso durante el desarrollo local. No detengas `dev:client` mientras trabajas en la interfaz.

## Producción

```bash
pnpm run build
pnpm run start:prod
```

`build` genera primero los archivos del cliente con Vite y después compila el servidor NestJS.

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `build` | Compilar el cliente con Vite y el servidor con NestJS |
| `build:client` | Generar una compilación de producción del cliente |
| `dev:client` | Compilar el cliente y observar cambios |
| `start:dev` | Iniciar NestJS en modo watch con el manifiesto de Vite |
| `typecheck:client` | Comprobar los tipos del cliente sin emitir archivos |
| `test` | Ejecutar las pruebas del servidor y del cliente |
| `test:e2e` | Compilar el cliente y ejecutar las pruebas end-to-end de Hono/Inertia |

## Endpoints

- `GET /` — consola React renderizada mediante Inertia.
- `GET /api/v1/simulations` — calcular medidas de rendimiento y costes.
- `GET /api` — documentación interactiva con Scalar UI.
- `GET /api-json` — documento OpenAPI en formato JSON.

## Estructura del proyecto

```text
src/
├── main.ts                 # Punto de entrada y configuración HTTP/OpenAPI
├── app.module.ts           # Módulo raíz e integración de Inertia
├── app.controller.ts       # Página Inertia principal
├── app.service.ts          # Propiedades de la página principal
└── simulations/            # API y dominio de simulaciones
inertia/
├── app/                    # Entrada del cliente, componentes y tipos
└── pages/Simulations/      # Consola React y sus pruebas
test/
└── app.e2e-spec.ts         # Prueba Hono/Inertia de extremo a extremo
```

## Despliegue

El proyecto está configurado para desplegar en Vercel con Node.js. Genera la compilación completa antes de ejecutar el servidor de producción.

## Licencia

Deneb está [bajo licencia MIT](LICENSE).
