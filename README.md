# Forma Workspace

An independent project workspace built from [spec.md](./spec.md), implementing milestones M1–M3. React, strict TypeScript, Vite, shadcn/ui (Radix), Tailwind, React Router, TanStack Query, Zustand, dnd-kit, React Hook Form, Zod and Sonner.

## Run

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Node.js 24 is recommended.

## Verify

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

## Included

- Responsive workspace shell, light/dark/system themes, Home, Projects, My Tasks, Settings, recoverable 404s.
- Project creation/editing; task creation, editing, subtasks, labels, dates, archive confirmation and local activity.
- Shared Board/List data and filters, sorting, grouping, manual board sorting across and within columns. Drag handles support keyboard sorting (Space, arrows, Space); task details also provide a status selector.
- Global search with Cmd/Ctrl+K, project/view deep links, `?task=<id>` sheets, URL filter precedence.
- Docs library with rich text editing, autosave, project organization, templates, favorites, full-text search, duplication, text export, trash and restore. Documents use `/docs` and `/docs/:documentId`; project libraries use `/projects/:projectId/docs`.
- Versioned local persistence with deterministic seeds, schema validation, v0 migration, memory fallback, and reset confirmation.
- Lazy loaded Board/List; tests and CI.

## Architecture

`src/features/tasks/types.ts` defines the contract. `src/repositories/local-repository.ts` implements the asynchronous repository and validates stored data. `src/features/tasks/api.ts` owns mutations and Query invalidation. Entity data lives in the Query cache; Zustand holds UI preferences only. `src/features/tasks/lib/view-engine.ts` derives filtering, ordering and grouping. Navigation state is explicit in the URL.

Writes persist synchronously before resolving, then invalidate the workspace query. Views show pending states and mutation errors; drag operations publish the destination immediately for the landing animation and restore affected tasks if saving fails. Destination columns rebalance integer ranks on moves.

The demo stores data in this browser only; it has no account system or shared backend. P1 Table/Calendar/Timeline, inbox, members and files, and P2 server features remain outside this MVP. Virtualization for datasets above 1,000 tasks is deferred; current demo is intentionally small.

For static hosting, configure all application routes to serve `index.html` so deep links survive refresh.

## Documents

The Docs feature lives in `src/features/docs/`. The TipTap editor loads only when opening a document; stored content is structured JSON validated by `src/repositories/document-repository.ts`. The separate `forma.documents.v1` key preserves compatibility with existing task data. Autosave waits 600ms after editing and flushes synchronously on navigation, page hiding, or refresh. Query owns shared document state; editor drafts remain local until saved. Storage failures keep the current memory session and display a notice. Resetting demo data also resets documents.

Docs are local to this browser; copied links are deep links into the same local workspace. Real-time collaboration, file attachments and server storage are not included.
