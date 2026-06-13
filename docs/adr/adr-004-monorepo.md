# ADR 004: Monorepo Architecture with NPM Workspaces

## Status
Accepted

## Context
The project requires a strict separation of concerns following Clean Architecture (Domain, Application, Infrastructure, Web UI, API). Managing these layers as completely separate repositories would introduce significant overhead for dependency management, code sharing, and continuous integration. Alternatively, keeping them all in a single tightly-coupled package often leads to circular dependencies and boundary violations.

## Decision
We will use a monorepo architecture leveraging `npm workspaces`. The project is structured into `apps/` (consumer-facing boundaries like `web` and `api`) and `packages/` (core logic like `domain`, `application`, `infrastructure`, and `shared-types`).

## Consequences
- **Pros:** 
  - Frictionless code sharing between layers.
  - unified configuration for linting, testing, and formatting.
  - Enforced architectural boundaries (e.g. `domain` cannot import `infrastructure`).
- **Cons:**
  - Build processes must be orchestrated carefully.
  - IDEs can sometimes struggle with resolving workspace symlinks without proper configuration.
