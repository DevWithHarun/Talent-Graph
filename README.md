# Talent Graph workspace

This repository is a PNPM workspace for Talent Graph, a sports talent identity
and scouting platform.

## Repository layout

- `artifacts/` contains deployable applications. `talent-graph` is the Vite
  web client, `api-server` is the shared Express backend, and
  `mockup-sandbox` hosts isolated UI previews.
- `lib/` contains reusable workspace packages: the generated API client and
  schemas, plus the Drizzle database package. These are consumed by artifacts
  through `workspace:*` dependencies.
- `scripts/` contains small repository utilities and maintenance commands.

The root `pnpm-workspace.yaml` defines package discovery and shared dependency
catalogs. Run applications through their managed Replit workflows; use
`pnpm install` after manifest changes and `pnpm run typecheck` for the
workspace-wide check.

## Useful commands

```sh
pnpm install
pnpm run typecheck
pnpm --filter @workspace/talent-graph run dev
pnpm --filter @workspace/api-server run dev
```