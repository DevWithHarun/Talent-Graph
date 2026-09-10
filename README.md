# Talent Graph monorepo

This repository is the company-level monorepo for Talent Graph, a sports talent
identity and scouting platform.

## Repository layout

- `Frontend/` contains the Vite web client for the Talent Graph experience.
- `Backend/` contains the API service layer for the platform.
- `lib/` contains reusable workspace packages such as the generated API client,
  validation schemas, and database layer consumed via `workspace:*` imports.
- `scripts/` contains repo utilities and maintenance tasks.

The root workspace manifest defines the monorepo boundaries and shared package
catalog. Keep all product code in `Frontend/` and `Backend/`, and reusable logic
in `lib/`.

## Useful commands

```sh
pnpm install
pnpm run typecheck
pnpm --filter @workspace/talent-graph run dev
pnpm --filter @workspace/backend run dev
```