# Angular Doctor

Static analysis tool for Angular projects. Automatically detects performance issues, architectural problems and bad practices, and explains them with the help of AI.

> **Angular Doctor detects and explains. It does not modify code.**

---

## Why this project exists

I have over 15 years of experience as a Software Engineer specialised in Angular. I'm good at what I do, but I was aware that I was falling behind on everything related to AI: how to use it as a development tool, how to integrate it into real products, how to build with it instead of ignoring it.

Angular Doctor was born as a response to that. The idea was to build something real from start to finish — analysis engine, CLI, backend, frontend, CI/CD, observability, deploy — using today's tools: Cursor, Claude, Ollama. And to let the project's own domain (performance, optimisation and best practices in Angular) force me to go deep on the topics that matter most for a senior engineer.

The result is this monorepo. It is not a toy project. Every decision has a reason.

---

## What it analyses

Angular Doctor examines Angular projects at the AST (Abstract Syntax Tree) level, not with regular expressions. This makes it precise and resistant to false positives.


| ID                           | Description                                                 | Severity  |
| ---------------------------- | ----------------------------------------------------------- | --------- |
| `no-circular-deps`           | Detects circular dependencies between modules               | 🔴 High   |
| `rxjs-unsubscribe`           | Detects Observable subscriptions without `ngOnDestroy`      | 🔴 High   |
| `rxjs-nested-subscribe`      | Detects `.subscribe()` nested inside another `.subscribe()` | 🔴 High   |
| `missing-onpush`             | Detects components without `ChangeDetectionStrategy.OnPush` | 🟡 Medium |
| `missing-lazy-loading`       | Detects routes that should use lazy loading but don't       | 🟡 Medium |
| `high-cyclomatic-complexity` | Detects methods with cyclomatic complexity above 10         | 🟡 Medium |
| `large-bundle-import`        | Detects full imports of heavy libraries                     | 🟡 Medium |


Each issue includes a description, its impact on performance or maintainability, and a concrete suggestion for resolution.

---

## Tech stack


| Technology           | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| Nx 22 + pnpm         | Monorepo: app and lib management, build caching |
| TypeScript strict    | Strong typing across the entire project         |
| ts-morph             | AST analysis over TypeScript/Angular code       |
| Vitest               | Unit tests for the analysis engine              |
| Fastify              | REST API backend                                |
| Angular 21 + Signals | Reactive web dashboard                          |
| Tailwind CSS         | Utility-first styling                           |
| Ollama + llama3.2    | Local AI at no cost for development             |
| Zod                  | Validation of AI responses                      |
| Pino                 | Structured logging in the backend               |
| GitHub Actions       | Automated CI/CD                                 |


---

## Monorepo structure

```
angular-doctor/
├── apps/
│   ├── api/          # Fastify backend — port 3333
│   ├── cli/          # Command line interface
│   └── web/          # Angular dashboard — port 4200
└── libs/
    └── analyzer/     # Analysis engine — core of the project

```

---

## Installation

**Requirements:** Node.js >=20, pnpm >=11

```bash
git clone https://github.com/Jim-stack79/angular-doctor.git
cd angular-doctor
pnpm install
pnpm approve-builds

```

---

## Usage

### CLI

```bash
# Build required first
pnpm nx build cli

# Basic analysis
node dist/apps/cli/main.js analyze /path/to/your/angular-project

# With AI explanations (requires Ollama running with llama3.2)
node dist/apps/cli/main.js analyze /path/to/your/angular-project --ai

# JSON output
node dist/apps/cli/main.js analyze /path/to/your/angular-project --json

```

Example output:

```
✔ Analysis complete — 7 issues found

Angular Doctor — Analysis Report
/path/to/your/angular-project
────────────────────────────────────────────────────────────

● HIGH (2)
  [rxjs-unsubscribe] Component "BadComponent" uses .subscribe() but does not implement ngOnDestroy
  File: src/app/bad.component.ts:6
  Impact: Active subscriptions after component destruction cause memory leaks
  Fix: Implement ngOnDestroy and call unsubscribe(), or use takeUntilDestroyed()

● MEDIUM (5)
  [missing-onpush] Component "App" does not use ChangeDetectionStrategy.OnPush
  File: src/app/app.ts:4
  Impact: Component will re-render on every change detection cycle
  Fix: Add changeDetection: ChangeDetectionStrategy.OnPush to the @Component decorator

────────────────────────────────────────────────────────────
Summary: 2 high · 5 medium · 0 low

```

### Full stack (API + Web)

You need two terminals:

```bash
# Terminal 1 — Backend
pnpm nx serve api

# Terminal 2 — Frontend
pnpm nx serve web

```

Open [http://localhost:4200](http://localhost:4200), enter the path to your Angular project and click **Analyze**. Each issue has an **🤖 Explain this** button that generates a contextualised AI explanation on demand.

### Direct REST API

```bash
# Run an analysis
curl -X POST http://localhost:3333/analyze \
  -H "Content-Type: application/json" \
  -d '{"projectPath": "/path/to/your/angular-project"}'

# With AI explanations
curl -X POST http://localhost:3333/analyze \
  -H "Content-Type: application/json" \
  -d '{"projectPath": "/path/to/your/angular-project", "withAI": true}'

```

Available endpoints:


| Method | Route           | Description                         |
| ------ | --------------- | ----------------------------------- |
| `GET`  | `/health`       | Server status                       |
| `POST` | `/analyze`      | Run an analysis                     |
| `GET`  | `/analyses`     | Analysis history                    |
| `GET`  | `/analyses/:id` | Detail of a specific analysis       |
| `POST` | `/explain`      | AI explanation for a specific issue |


### Tests

```bash
# Analysis engine
pnpm nx test analyzer

# All projects
pnpm nx run-many -t test --all

```

---

## How it works internally

### Analysis engine (libs/analyzer)

Receives the path to an Angular project, loads all TypeScript files via ts-morph, runs each rule against the AST, aggregates results with severity and priority, and returns an `AnalysisResult`. By working on the AST rather than plain text, it detects patterns with real semantic precision.

### AI layer

AI is optional and activated with `--ai` in the CLI or the **Explain this** button in the dashboard. Everything runs locally with Ollama — no data leaves your machine.

The flow: the engine generates an `Issue` → `explainIssue()` builds a contextualised prompt → Ollama responds with JSON → Zod validates the structure `{ summary, whyItMatters, howToFix, codeExample }`. If the response is not valid, it returns `null` without breaking the analysis.

To use AI you need Ollama installed and the model downloaded:

```bash
ollama pull llama3.2

```

> **Note on Vercel AI SDK:** the roadmap mentions Vercel AI SDK for streaming. With local Ollama it is not necessary — latency is minimal. It will be added when migrating to a production LLM (OpenAI / Anthropic).

### Structured logging (Pino)

The backend uses Pino for structured logging. In development, logs are formatted with colours and timestamps. Each request has a unique `reqId` for full traceability:

```
[2026-05-21 19:38:52.086 +0200] INFO: Analysis requested
    reqId: "req-2"
    projectPath: "/path/to/project"
    withAI: false

[2026-05-21 19:38:52.230 +0200] INFO: Analysis complete
    reqId: "req-2"
    issuesFound: 7
    duration: 144

```

---

## CI/CD

Two active workflows in GitHub Actions:

`ci.yml` — triggered on every push to `develop` and on PRs targeting `main`. Runs lint, build and tests using `nx affected`, processing only the projects that changed. Fast and efficient in a monorepo.

`main.yml` — triggered when merging to `main`. Runs `nx run-many --all` to validate the entire project. `main` is always clean and deployable.

---

## Project status


| Phase | Description              | Status         |
| ----- | ------------------------ | -------------- |
| 0     | Base environment         | ✅ Complete     |
| 1     | Monorepo structure       | ✅ Complete     |
| 2     | Analysis engine + Tests  | ✅ Complete     |
| 3     | AI layer                 | ✅ Complete     |
| 4     | CLI                      | ✅ Complete     |
| 5     | Backend SaaS             | ✅ Complete     |
| 6     | Frontend (web dashboard) | ✅ Complete     |
| 7     | AI in the UI             | ✅ Complete     |
| 8     | CI/CD                    | ✅ Complete     |
| 9     | Deploy                   | 🔜 Pending     |
| 10    | Observability            | ✅ Complete     |
| 11    | Documentation and demo   | 🔄 In progress |


---

## Next steps (v2)

Rules pending implementation:

- `missing-trackby` — `*ngFor` without `trackBy` on large lists
- `large-component` — components with too many lines (god components)
- `direct-dom-manipulation` — use of `document.querySelector` or `ElementRef.nativeElement`
- `any-type-usage` — overuse of `any` that defeats strong typing
- `console-log-in-production` — forgotten `console.log` calls in production code



→ [How to add a new rule](./docs/[adding-rules.md](http://adding-rules.md))