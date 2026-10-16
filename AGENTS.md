# Repository Guidelines

## Project Structure & Module Organization

Forma uses React, TypeScript, and Vite. See `spec.md` for scope and `README.md` for setup.

- `src/app/`: application shell, routing, providers, and error boundary.
- `src/features/`: dashboard, projects, settings, tasks, and docs. Keep components, views, types, mutations, and algorithms together.
- `src/components/ui/`: shadcn/ui primitives; shared page elements belong in `src/components/shared/`.
- `src/repositories/`: local persistence and repository contracts; `src/mocks/`: deterministic seeds; `src/stores/`: UI preferences.
- `src/index.css`: theme tokens and application styles. `public/` holds static assets; `src/assets/` holds imported assets.
- Unit tests sit beside source; browser tests use `tests/e2e/`; CI uses `.github/workflows/ci.yml`.

## Build, Test, and Development Commands

Use Node.js 24 and npm; commit `package-lock.json` changes.

- `npm ci`: install locked dependencies.
- `npm run dev`: start the Vite development server.
- `npm run build`: typecheck and build into `dist/`; `npm run preview` serves that build.
- `npm run lint`: run ESLint with zero warnings allowed.
- `npm run typecheck`: check TypeScript.
- `npm test`: run Vitest tests with jsdom and React Testing Library.
- `npx playwright install chromium`, then `npm run test:e2e`: run browser tests.
- `npm run format` / `npm run format:check`: apply / verify Prettier formatting.

## Coding Style & Architecture

Use strict TypeScript, two-space indentation, double quotes, and semicolons as formatted by Prettier. Use PascalCase for components, camelCase for functions, `use` prefixes for hooks, and kebab-case feature filenames.

Keep workspace entities in the TanStack Query cache and persistence behind repositories; Zustand stores preferences only. Keep shareable navigation state in URLs. Reuse pure algorithms for hover previews and committed moves. Use semantic theme tokens and preserve keyboard access, focus restoration, and reduced-motion behavior.

## Testing Guidelines

Name unit tests `*.test.ts` or `*.test.tsx`; name browser tests `*.spec.ts`. No numeric coverage threshold is configured. Cover changed behavior, especially persistence, failure rollback, filtering, and drag placement. Prefer role-based locators and observable conditions over delays. Run CI checks before submitting.

## Commit & Pull Request Guidelines

No Git metadata exists here; historical commit conventions cannot be verified. Use imperative subjects, e.g. `Fix board drop placement`. PRs should explain behavior, link relevant issues or spec sections, report checks, and show screenshots for visual changes.

## Agent Instructions

Prefer codebase-memory-mcp for code discovery: `search_graph`, `trace_path`, `get_code_snippet`, then `query_graph`. Run `index_repository` if unindexed. Fall back to text search for literals, configuration, non-code files, or insufficient graph results. Never store secrets in localStorage or commit generated build/test artifacts.
