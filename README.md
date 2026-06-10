# Carbon Tracker

Monorepo workspace for carbon tracking application, designed with Clean Architecture and zero-tolerance code quality controls.

## Repository Structure

```
/apps
  /web          → React 19 + Vite + TypeScript (strict)
  /mobile       → React Native 0.74 + shared logic
  /api          → Express + TypeScript
/packages
  /domain       → Pure business logic (no frameworks)
  /application  → Use cases + ports
  /infrastructure → DB (Prisma), cache, external APIs
  /shared-types → Cross-package TypeScript types
/e2e            → Playwright end-to-end testing scaffold
```

## Architecture Diagram

```mermaid
graph TD
    subgraph Apps
        Web[apps/web]
        Mobile[apps/mobile]
        API[apps/api]
    end

    subgraph Packages
        Infra[packages/infrastructure]
        App[packages/application]
        Domain[packages/domain]
        Types[packages/shared-types]
    end

    Web --> Types
    Mobile --> Types
    API --> Infra
    API --> App
    API --> Types
    Infra --> App
    Infra --> Types
    App --> Domain
    App --> Types
    Domain --> Types
```

## Getting Started

### Prerequisites

- Node.js >= 20.x
- Docker and Docker Compose

### Setup Instructions

1. Clone the repository and navigate to the directory:
   ```bash
   cd carbon-tracker
   ```
2. Copy environment variables file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start development database and support services:
   ```bash
   docker compose up -d
   ```

### Running Verification Tools

- **Linter**: Ensure zero lint violations across workspaces:
  ```bash
  npm run lint
  ```
- **Type Check**: Validate TypeScript compilation:
  ```bash
  npm run typecheck
  ```
- **Tests**: Execute Vitest (packages) and Jest (apps/web) suites with coverage:
  ```bash
  npm run test
  ```
- **Build**: Compile all packages and applications:
  ```bash
  npm run build
  ```

## Contribution Guide

1. Ensure Husky and lint-staged are active. They automatically run ESLint and typechecks on pre-commit.
2. Follow Dependency Inversion rules: never import `@carbon-tracker/domain` from `@carbon-tracker/infrastructure`. Use ports/interfaces defined in `@carbon-tracker/application`.
3. Do not introduce raw `any` types. Enforced by `@typescript-eslint/strict-type-checked`.
4. Keep functions concise. Limit functions to 25 lines maximum and cyclomatic complexity to 8 maximum.
