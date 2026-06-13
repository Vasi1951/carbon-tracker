# ADR 005: Testing Strategy with Vitest and Testcontainers

## Status
Accepted

## Context
A rigorous testing suite is necessary to maintain the integrity of the Clean Architecture layers, ensuring domain rules and infrastructure adapters work exactly as expected without flaky behavior. Mocking external services (PostgreSQL, Redis) often leads to false positives and high maintenance burdens.

## Decision
We will use **Vitest** as our test runner across the entire monorepo due to its native TypeScript support and ESM compatibility.
For the infrastructure layer, we will use **Testcontainers** to spin up actual, ephemeral instances of PostgreSQL and Redis during integration tests. 

## Consequences
- **Pros:**
  - High confidence in test accuracy (no mock mismatch).
  - Fast execution for pure domain tests with Vitest.
  - Testcontainers ensures environment consistency across developer machines and CI.
- **Cons:**
  - Requires Docker daemon to be running locally for integration tests.
  - Slower setup/teardown time for integration tests compared to mock-based tests.
