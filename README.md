# Deneb API

API REST para calcular medidas de rendimiento en modelos de colas M/M/1, M/M/K, M/M/1/M/M y M/M/K/M/M.

## Tecnologías

- **Framework**: NestJS 12
- **Servidor HTTP**: Hono (vía @ailura/nestjs-hono-adapter)
- **Runtime**: Node.js 24+ o Bun 1.2+
- **Lenguaje**: TypeScript

## Descripción

Deneb es una herramienta API diseñada para abordar problemas relacionados con teorías de colas. Su API REST proporciona una solución accesible para integrar en proyectos a través de la siguiente URL: https://deneb.vercel.app/api/v1/simulations.

Para una exploración más detallada de la API y entender los parámetros que deben incluirse en las solicitudes, se recomienda consultar la página https://deneb.vercel.app/api/ui, donde está disponible una interfaz Swagger que permite probar y familiarizarse con los datos que deben enviarse en las aplicaciones.

## Requisitos

- Node.js 24.x o Bun 1.2+
- pnpm o bun (gestor de paquetes)

## Instalación

```bash
# Con bun (recomendado)
bun install

# Con pnpm
pnpm install
```

## Desarrollo

```bash
# Con bun (recomendado) - más rápido
bun run start:bun

# Con pnpm/Node
pnpm run start:dev
```

## Producción

```bash
# Build
bun run build

# Ejecutar con bun
bun run start:bun:prod

# Ejecutar con Node
pnpm run start:prod
```

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `start:bun` | Desarrollo con Bun y hot-reload |
| `start:dev` | Desarrollo con Node y hot-reload |
| `build` | Compilar para producción |
| `start:bun:prod` | Producción con Bun |
| `start:prod` | Producción con Node |
| `test` | Ejecutar tests |
| `lint` | Linter con auto-fix |

## Endpoints

- `GET /` - Vista principal
- `GET /api/v1/simulations` - Calcular medidas de rendimiento
- `GET /api` - Documentación Swagger (JSON)
- `GET /api/ui` - Interfaz Swagger UI
- `GET /public/` - Archivos estáticos

## Despliegue

### Vercel

El proyecto está configurado para desplegar en Vercel con Node.js:

```bash
vercel deploy
```

### Bun (Desarrollo local)

Para desarrollo local con Bun:

```bash
bun run start:bun
```

## Estructura del Proyecto

```
src/
├── main.ts                 # Punto de entrada
├── configure-app.ts        # Configuración de la aplicación
├── app.module.ts           # Módulo raíz
├── app.controller.ts       # Controlador raíz
├── app.service.ts          # Servicio raíz
└── simulations/            # Módulo de simulaciones
    ├── simulations.controller.ts
    ├── simulations.service.ts
    ├── simulations.module.ts
    ├── dto/
    │   ├── simulation.dto.ts
    │   └── simulation-response.dto.ts
    └── entities/
        └── simulation.entity.ts
```

## Notas de la Migración

Este proyecto fue migrado de Fastify a Hono usando [@ailura/nestjs-hono-adapter](https://github.com/ailuracollective/nestjs-hono-adapter). Ver la documentación del adaptador para más detalles sobre diferencias de comportamiento.

## Licencia

Deneb está [MIT licensed](LICENSE).
