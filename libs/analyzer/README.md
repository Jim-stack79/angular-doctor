# Angular Doctor

Herramienta de análisis estático para proyectos Angular. Detecta problemas de rendimiento, arquitectura y malas prácticas de forma automática y los explica con ayuda de IA.

> Angular Doctor detecta y explica. No modifica código.

---

## Estado actual

| Fase | Descripción | Estado |
|------|-------------|--------|
| 0 | Entorno base | ✅ Completa |
| 1 | Estructura del monorepo | ✅ Completa |
| 2 | Motor de análisis + Tests | ✅ Completa |
| 3 | Capa de IA | 🔜 Pendiente |
| 4 | CLI | 🔜 Pendiente |
| 5 | Backend SaaS | 🔜 Pendiente |
| 6 | Frontend (dashboard web) | 🔜 Pendiente |
| 7 | IA en la UI | 🔜 Pendiente |
| 8 | CI/CD | 🔜 Pendiente |
| 9 | Deploy | 🔜 Pendiente |
| 10 | Observabilidad | 🔜 Pendiente |
| 11 | Documentación y demo | 🔜 Pendiente |

---

## Estructura del monorepo

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

| ID | Descripción | Severidad |
|----|-------------|-----------|
| `no-circular-deps` | Detecta dependencias circulares entre módulos | 🔴 Alta |
| `rxjs-unsubscribe` | Detecta subscripciones a Observables sin `ngOnDestroy` | 🔴 Alta |
| `rxjs-nested-subscribe` | Detecta `.subscribe()` anidado dentro de otro `.subscribe()` | 🔴 Alta |
| `missing-onpush` | Detecta componentes sin `ChangeDetectionStrategy.OnPush` | 🟡 Media |
| `missing-lazy-loading` | Detecta rutas que deberían usar lazy loading y no lo hacen | 🟡 Media |
| `high-cyclomatic-complexity` | Detecta métodos con complejidad ciclomática superior a 10 | 🟡 Media |
| `large-bundle-import` | Detecta imports de librerías pesadas completas | 🟡 Media |

Cada problema detectado incluye descripción, impacto en rendimiento o mantenibilidad, y sugerencia concreta de resolución.

## Otras métricas interesantes, pero para v2:

`missing-trackby` — usar *ngFor sin trackBy en listas grandes destroza el rendimiento
`large-component` — componentes con demasiadas líneas (god components)
`direct-dom-manipulation` — usar document.querySelector o ElementRef.nativeElement directamente en vez de el renderer de Angular
`any-type-usage` — abuso de any en TypeScript, que anula el tipado fuerte
`console-log-in-production` — console.log olvidados en código de producción

---

## Stack tecnológico

| Tecnología | Para qué |
|------------|----------|
| Node.js LTS | Runtime principal |
| TypeScript (strict) | Tipado fuerte en todo el monorepo |
| pnpm + workspaces | Gestión de dependencias en monorepo |
| Nx | Gestión de apps y libs, caché de builds |
| ts-morph | Análisis de AST sobre código TypeScript/Angular |
| Vitest | Tests unitarios del motor de análisis |
| Git + GitHub | Control de versiones y base para CI/CD |

---

## Cómo funciona el motor

El motor de análisis (`libs/analyzer`) sigue este flujo:

1. Recibe el path de un proyecto Angular
2. Carga todos los archivos TypeScript via `ts-morph` (análisis de AST)
3. Ejecuta cada regla sobre el árbol de sintaxis
4. Agrega los resultados, asigna severidad y ordena por prioridad
5. Devuelve un `AnalysisResult` con todos los problemas detectados

El análisis trabaja sobre el AST (Árbol de Sintaxis Abstracta), no sobre texto plano, lo que lo hace preciso y resistente a falsos positivos.