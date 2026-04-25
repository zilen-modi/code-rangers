# Web App Architecture Guide

This app uses **Next.js App Router** with a **src-first structure**.

The goal is simple: keep development fast, UX polished, and folder ownership clear.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS + CSS variables
- shadcn/ui primitives
- React Query
- Axios
- React Hook Form + Zod
- next-themes

## Folder Structure

```txt
apps/web
├── src
│   ├── app
│   ├── components
│   │   ├── common
│   │   └── layout
│   ├── config
│   ├── features
│   ├── hooks
│   ├── lib
│   ├── providers
│   ├── services
│   ├── styles
│   └── types
├── public
├── package.json
└── ...
```

## What Goes Where

- `src/app`
  - Route segments, layouts, route-level `loading.tsx` and `error.tsx`.
  - Keep route files thin and compose feature/components.

- `src/components/common`
  - Reusable UI blocks shared across features (loaders, fallback UI, wrappers).

- `src/components/layout`
  - App shell and spacing primitives (`Navbar`, `Container`, `PageWrapper`).

- `src/features/<feature-name>`
  - Feature-first modules. Preferred shape:
    - `api/` for API functions
    - `hooks/` for feature query/mutation hooks
    - `components/` for feature UI
    - `schema.ts` for zod schemas
    - `types.ts` for feature types

- `src/providers`
  - Global providers only (query, theme, user context, toaster).

- `src/services`
  - Cross-feature service clients and adapters (axios instance, error mapping).

- `src/config`
  - Runtime/static config and env validation.

- `src/lib`
  - Framework-agnostic helpers (`cn`, `debounce`, `formatDate`).

- `src/styles`
  - Global styles and design tokens (CSS variables, typography, transitions).

- `src/types`
  - Shared app-level types only.

## Design System Notes

- Theme tokens live in `src/styles/globals.css` under `:root` and `.dark`.
- Tailwind consumes those tokens in `tailwind.config.ts`.
- Do not introduce hardcoded color values in random components unless necessary.

## Adding a New Feature (Recommended Flow)

1. Create `src/features/<name>/`.
2. Add `schema.ts` and `types.ts`.
3. Add `api/` functions (pure request layer).
4. Add `hooks/` (React Query wrappers).
5. Add `components/` and compose from route in `src/app/.../page.tsx`.

This keeps features modular and easy to evolve.

## Rules To Keep It Consistent

- Use `@/*` imports (mapped to `src/*`).
- Keep business logic inside `features` or `services`, not in route files.
- Prefer shared primitives from `@repo/ui` and existing `common` components.
- Keep global state minimal; use feature-local state by default.
- Avoid recreating root-level folders outside `src` (single source of truth is `src`).

## Future Add-ons

- Add new providers in `src/providers` only when truly global.
- Add analytics/telemetry via a dedicated provider.
- Add accessibility utilities (focus management, keyboard helpers) in `src/lib`.
- Add more design primitives in `@repo/ui` package, then consume here.
- Add additional domains under `src/features` (billing, notifications, settings).

## Commands

From repo root:

- `pnpm --filter web dev`
- `pnpm --filter web lint`
- `pnpm --filter web type-check`
- `pnpm --filter web build`
