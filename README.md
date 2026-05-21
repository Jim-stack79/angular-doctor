# Angular Doctor

Herramienta de análisis estático para proyectos Angular. Detecta problemas de rendimiento, arquitectura y malas prácticas de forma automática y los explica con ayuda de IA.

> Angular Doctor detecta y explica. No modifica código.

---

## Estado actual


| Fase | Descripción               | Estado       |
| ---- | ------------------------- | ------------ |
| 0    | Entorno base              | ✅ Completa   |
| 1    | Estructura del monorepo   | ✅ Completa   |
| 2    | Motor de análisis + Tests | ✅ Completa   |
| 3    | Capa de IA                | ✅ Completa   |
| 4    | CLI                       | ✅ Completa   |
| 5    | Backend SaaS              | ✅ Completa   |
| 6    | Frontend (dashboard web)  | ✅ Completa   |
| 7    | IA en la UI               | ✅ Completa   |
| 8    | CI/CD                     | ✅ Completa   |
| 9    | Deploy                    | 🔜 Pendiente |
| 10   | Observabilidad            | ✅ Completa   |
| 11   | Documentación y demo      | 🔜 Pendiente |


---

## Fase 1 - Estructura del monorepo

```
angular-doctor/
├── apps/
│   ├── cli/          # Interfaz de línea de comandos
│   └── web/          # Dashboard web (Angular)
└── libs/
    ├── analyzer/     # Motor de análisis — núcleo del proyecto
    ├── rules/        # Sistema de reglas (futuro paquete independiente)
    └── shared/       # Tipos y utilidades compartidas
```

---

## Cómo arrancar

**Requisitos**

- Node.js LTS (>=20)
- pnpm (>=11)

**Instalación**

```bash
git clone https://github.com/tu-usuario/angular-doctor.git
cd angular-doctor
pnpm install
pnpm approve-builds
```

**Ejecutar los tests**

```bash
# Tests del motor de análisis
pnpm nx test analyzer

# Tests de todos los paquetes
pnpm test
```

---

## Reglas disponibles

El motor analiza proyectos Angular aplicando las siguientes reglas:


| ID                           | Descripción                                                  | Severidad |
| ---------------------------- | ------------------------------------------------------------ | --------- |
| `no-circular-deps`           | Detecta dependencias circulares entre módulos                | 🔴 Alta   |
| `rxjs-unsubscribe`           | Detecta subscripciones a Observables sin `ngOnDestroy`       | 🔴 Alta   |
| `rxjs-nested-subscribe`      | Detecta `.subscribe()` anidado dentro de otro `.subscribe()` | 🔴 Alta   |
| `missing-onpush`             | Detecta componentes sin `ChangeDetectionStrategy.OnPush`     | 🟡 Media  |
| `missing-lazy-loading`       | Detecta rutas que deberían usar lazy loading y no lo hacen   | 🟡 Media  |
| `high-cyclomatic-complexity` | Detecta métodos con complejidad ciclomática superior a 10    | 🟡 Media  |
| `large-bundle-import`        | Detecta imports de librerías pesadas completas               | 🟡 Media  |


Cada problema detectado incluye descripción, impacto en rendimiento o mantenibilidad, y sugerencia concreta de resolución.

## Otras métricas interesantes, pero para v2:

`missing-trackby` — usar *ngFor sin trackBy en listas grandes destroza el rendimiento
`large-component` — componentes con demasiadas líneas (god components)
`direct-dom-manipulation` — usar document.querySelector o ElementRef.nativeElement directamente en vez de el renderer de Angular
`any-type-usage` — abuso de any en TypeScript, que anula el tipado fuerte
`console-log-in-production` — console.log olvidados en código de producción

---

## Stack tecnológico


| Tecnología          | Para qué                                        |
| ------------------- | ----------------------------------------------- |
| Node.js LTS         | Runtime principal                               |
| TypeScript (strict) | Tipado fuerte en todo el monorepo               |
| pnpm + workspaces   | Gestión de dependencias en monorepo             |
| Nx                  | Gestión de apps y libs, caché de builds         |
| ts-morph            | Análisis de AST sobre código TypeScript/Angular |
| Vitest              | Tests unitarios del motor de análisis           |
| Git + GitHub        | Control de versiones y base para CI/CD          |


---

## Fase 2 - Cómo funciona el motor de análisis

El motor de análisis (`libs/analyzer`) sigue este flujo:

1. Recibe el path de un proyecto Angular
2. Carga todos los archivos TypeScript via `ts-morph` (análisis de AST)
3. Ejecuta cada regla sobre el árbol de sintaxis
4. Agrega los resultados, asigna severidad y ordena por prioridad
5. Devuelve un `AnalysisResult` con todos los problemas detectados

El análisis trabaja sobre el AST (Árbol de Sintaxis Abstracta), no sobre texto plano, lo que lo hace preciso y resistente a falsos positivos.

---

## Fase 3 - Cómo funciona la capa de IA

La capa de IA es opcional y se activa con el flag `--ai`. Todo corre en local con Ollama — ningún dato sale a internet.

**El flujo completo:**

1. El motor detecta un problema y genera un `Issue` con `ruleId`, `message`, `impact`, `suggestion`, etc.
2. La CLI pasa ese `Issue` a `explainIssue()` en `ai.service.ts`
3. `explainIssue()` construye un prompt con toda la información del problema y se lo envía a Ollama via HTTP a `localhost:11434`
4. Ollama carga el modelo `llama3.2` localmente y genera la respuesta en JSON
5. Zod valida que el JSON tiene la estructura esperada (`summary`, `whyItMatters`, `howToFix`, `codeExample`). Si el modelo devuelve algo inesperado, Zod lo rechaza y devuelve `null` — el análisis no se rompe

**¿Por qué las explicaciones son diferentes para cada problema?**

Porque el prompt cambia con cada `Issue`. Para `rxjs-unsubscribe` el modelo recibe un contexto completamente distinto que para `missing-onpush`. El modelo genera texto nuevo cada vez basándose en ese contexto — no tiene respuestas predefinidas.

**Requisitos para usar `--ai`:**

- Tener [Ollama](https://ollama.com) instalado
- Haber descargado el modelo: `ollama pull llama3.2`
- Ollama corriendo en segundo plano (se inicia automáticamente al instalar la app en macOS)

---

## Fase 4 - Cómo funciona el CLI



```markdown
## Cómo funciona la CLI (Fase 4)

La CLI permite analizar un proyecto Angular directamente desde la terminal sin necesidad de abrir el dashboard web. Se ejecuta apuntando al path del proyecto y muestra los resultados en consola con colores.

**Uso básico:**

```bash
# Primero buildamos la CLI
pnpm nx build cli

# Análisis básico
node dist/apps/cli/main.js analyze /ruta/a/tu/proyecto-angular

# Con explicaciones de IA (requiere Ollama corriendo)
node dist/apps/cli/main.js analyze /ruta/a/tu/proyecto-angular --ai

# Output en formato JSON
node dist/apps/cli/main.js analyze /ruta/a/tu/proyecto-angular --json

```

**Ejemplo de output en consola:**

```
✔ Analysis complete — 7 issues found

Angular Doctor — Analysis Report
/ruta/a/tu/proyecto-angular
────────────────────────────────────────────────────────────

● HIGH (2)
  [rxjs-unsubscribe] Component "BadComponent" uses .subscribe() but does not implement ngOnDestroy
  File: src/app/bad.component.ts:6
  Impact: Active subscriptions after component destruction cause memory leaks
  Fix: Implement ngOnDestroy and call unsubscribe(), or use takeUntilDestroyed()

● MEDIUM (5)
  [missing-onpush] Component "App" does not use ChangeDetectionStrategy.OnPush
  ...

────────────────────────────────────────────────────────────
Summary: 2 high  5 medium  0 low

```

**Flags disponibles:**


| Flag     | Descripción                                                                  |
| -------- | ---------------------------------------------------------------------------- |
| `--ai`   | Enriquece cada issue con explicaciones generadas por Ollama                  |
| `--json` | Devuelve el resultado completo en formato JSON en lugar del output coloreado |


**Arquitectura interna:**

- `main.ts` — punto de entrada, registra los comandos con `commander`
- `commands/analyze.ts` — lógica del comando `analyze`: llama al motor, muestra el spinner con `ora`, pinta el output con `chalk`



## Fase 5 - Cómo funciona el backend

El backend (`apps/api`) es un servidor Fastify que expone una API REST para lanzar análisis y consultar el historial. En v1 el historial se guarda en memoria — la persistencia con base de datos se añade en versiones posteriores.

**Endpoints disponibles:**


| Método | Ruta            | Descripción                                                   |
| ------ | --------------- | ------------------------------------------------------------- |
| `GET`  | `/health`       | Comprueba que el servidor está vivo                           |
| `POST` | `/analyze`      | Recibe un path, ejecuta el análisis y devuelve los resultados |
| `GET`  | `/analyses`     | Lista el historial de análisis                                |
| `GET`  | `/analyses/:id` | Devuelve el detalle de un análisis concreto                   |


**Ejemplo de uso:**

```bash
# Lanzar un análisis
curl -X POST http://localhost:3333/analyze \
  -H "Content-Type: application/json" \
  -d '{"projectPath": "/ruta/a/tu/proyecto-angular"}'

# Lanzar un análisis con explicaciones de IA
curl -X POST http://localhost:3333/analyze \
  -H "Content-Type: application/json" \
  -d '{"projectPath": "/ruta/a/tu/proyecto-angular", "withAI": true}'
```

**Arrancar el backend:**

```bash
pnpm nx serve api
```

---

## Fase 6 - Cómo funciona el frontend

El dashboard web (`apps/web`) es una aplicación Angular con Signals que consume la API del backend. Permite lanzar análisis introduciendo el path del proyecto y visualiza los resultados agrupados por severidad.

**Vistas disponibles:**


| Ruta            | Descripción                                               |
| --------------- | --------------------------------------------------------- |
| `/`             | Dashboard principal — formulario de análisis y resultados |
| `/analyses/:id` | Detalle de un análisis concreto                           |


**Arrancar el frontend:**

```bash
pnpm nx serve web
```

Abre `http://localhost:4200` en el navegador.

---

## Fase 7 - Cómo funciona la IA en la UI

Cada issue detectado tiene un botón **"🤖 Explain this"** que solicita una explicación bajo demanda a la IA. La interacción es controlada — el usuario decide qué issues quiere que la IA explique, en lugar de procesar todos de golpe.

**Flujo:**

1. El usuario pulsa "Explain this" en un issue concreto
2. El frontend envía el issue al endpoint `POST /explain` del backend
3. El backend llama a Ollama con un prompt contextualizado
4. La explicación aparece directamente en la tarjeta del issue

Cada issue gestiona su propio estado de carga de forma independiente — puedes pedir explicaciones en paralelo sin que se bloqueen entre sí.

**La explicación incluye:**

- Resumen del problema en lenguaje natural
- Por qué importa en producción
- Cómo resolverlo paso a paso
- Ejemplo de código antes/después (cuando aplica)

## **Nota sobre Vercel AI SDK:** El roadmap menciona Vercel AI SDK para gestionar streaming de respuestas. En v1 con Ollama local no es necesario — la latencia es mínima al correr en la misma máquina. Se añadirá cuando se migre a un LLM de producción (OpenAI / Anthropic) donde el streaming mejora significativamente la experiencia de usuario.

## Cómo usar Angular Doctor completo

Para usar el stack completo necesitas tres terminales:

**Terminal 1 — Backend:**

```bash
pnpm nx serve api
```

**Terminal 2 — Frontend:**

```bash
pnpm nx serve web
```

**Terminal 3 — CLI (opcional):**

```bash
# Sin IA
node dist/apps/cli/main.js analyze /ruta/a/tu/proyecto-angular

# Con IA (requiere Ollama corriendo)
node dist/apps/cli/main.js analyze /ruta/a/tu/proyecto-angular --ai

# Output en JSON
node dist/apps/cli/main.js analyze /ruta/a/tu/proyecto-angular --json
```

Aquí tienes un resumen claro para el README:

---

## Fase 8 — CI/CD con GitHub Actions

En esta fase se automatizó el proceso de validación del código mediante GitHub Actions. Cada vez que se hace un push a `develop` o se abre un Pull Request hacia `main`, el sistema ejecuta automáticamente una serie de comprobaciones para garantizar que el código es correcto antes de integrarlo.

### Qué se ha configurado

`ci.yml` — Pipeline principal de integración continua. Se dispara en cada push a `develop` y en PRs hacia `main` o `develop`. Instala dependencias con pnpm, instala los browsers de Playwright necesarios para los tests e2e, y ejecuta lint, build y tests usando `nx affected`, que solo procesa los proyectos que han cambiado respecto al commit anterior. Esto hace el CI rápido y eficiente en un monorepo.

`main.yml` — Validación completa de la rama principal. Se dispara cuando se mergea código a `main`. A diferencia del CI, aquí se ejecuta `nx run-many --all` para buildear y testear absolutamente todo el proyecto, garantizando que `main` siempre está en un estado limpio y desplegable.

### Decisiones tomadas

- **Sin feature branches por ahora** — al ser un proyecto personal, se trabaja directamente en `develop` y se mergea a `main` cuando una fase está completa. Los workflows están preparados para soportar feature branches en el futuro sin cambios.
- `analyze.yml` **descartado** — el workflow que ejecutaba Angular Doctor sobre el propio repositorio se eliminó porque Angular Doctor analiza proyectos Angular externos, no el monorepo en sí mismo.  
- **Repo privado** — se añadieron los permisos `contents: read` y `actions: read` necesarios para que GitHub Actions pueda acceder al código y al historial de commits.

### Problemas resueltos durante la configuración

- Campo `packages` faltante en `pnpm-workspace.yaml`
- Browsers de Playwright no disponibles en el runner → se instalan con `playwright install --with-deps`
- Test e2e placeholder generado por Nx buscaba `"Welcome"` en lugar de `"Angular Doctor"`
- `.pnpm-store/` se coló en el repositorio → añadido al `.gitignore`





Aquí tienes el texto listo para el README:

---

## Fase 10 — Observabilidad (parcial): Logs estructurados con Pino

En esta fase se añadió logging estructurado al servidor Fastify usando Pino, la librería de logging más rápida del ecosistema Node.js.

### Por qué Pino y no console.log

`console.log` produce texto plano sin estructura, difícil de filtrar y de leer en producción. Pino escribe logs en formato JSON con nivel de severidad, timestamp y datos contextuales, lo que permite trazabilidad real de lo que ocurre en el servidor.

### Qué se ha configurado

En desarrollo los logs salen formateados con colores y timestamps legibles gracias a `pino-pretty`. En producción saldrían en JSON puro, que es el formato que esperan plataformas como Railway o Render para mostrarlos en sus dashboards.

### Qué se loguea

Cada petición al servidor genera automáticamente logs de entrada y salida con su `reqId` único, método, url, status code y tiempo de respuesta. Además, en cada endpoint se añaden logs específicos:

- `/analyze` — projectPath, si se solicitó IA, número de issues encontrados y duración en ms
- `/explain` — issue analizado y duración de la llamada a la IA
- `/analyses` y `/analyses/:id` — accesos y casos de not found
- `/health` — debug silencioso, no contamina los logs en producción

### Ejemplo de output en desarrollo

```
[2026-05-21 19:38:35.316 +0200] INFO: Server ready
    host: "localhost"
    port: 3333

[2026-05-21 19:38:52.086 +0200] INFO: Analysis requested
    reqId: "req-2"
    projectPath: "/Users/jaime/Workspace/test-angular-app"
    withAI: false

[2026-05-21 19:38:52.230 +0200] INFO: Analysis complete
    reqId: "req-2"
    projectPath: "/Users/jaime/Workspace/test-angular-app"
    issuesFound: 7
    duration: 144

[2026-05-21 19:38:52.231 +0200] INFO: request completed
    reqId: "req-2"
    res: { "statusCode": 200 }
    responseTime: 146.42

```

### Dependencias añadidas

- `pino` — logger principal
- `pino-pretty` — formateo visual para desarrollo (devDependency)

### Nota

Sentry y PostHog, también mencionados en esta fase del roadmap, tienen sentido cuando el proyecto esté desplegado en producción con usuarios reales. Se añadirán en la Fase 9 cuando se aborde el deploy.

---

