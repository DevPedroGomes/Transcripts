# Repository Guidelines

## Project Structure & Module Organization

- `src/app` contains Next.js routes, server actions, and API handlers; keep feature assets co-located within their route tree.
- `src/components` holds shadcn/Tailwind UI primitives; share components via shallow `index.ts` exports.
- `src/lib` groups integrations (`ai`, `stripe`, `supabase`), shared types, and helpers—extend these modules instead of wiring services inside components.
- `src/server` defines the streaming socket used by `socket-server.js`, while `public` stores static assets and `supabase/schema.sql` documents schema + RLS; update them together when data models shift.

## Build, Test, and Development Commands

- `npm install` pulls all web, socket, and tooling dependencies.
- `npm run dev` launches Next.js (port 3000) plus the WebSocket relay via `concurrently`; use `npm run socket` to debug the relay in isolation.
- `npm run build` creates the production bundle inside `.next/`; it must pass before opening a PR.
- `npm run start` runs the built site alongside the socket server for production smoke tests.
- `npm run lint` executes `next lint`; fix issues before committing.

## Coding Style & Naming Conventions

- Stick to TypeScript, 2-space indentation, double quotes in React files, and single quotes in Node utilities.
- Prefer functional React components with PascalCase filenames and camelCase hooks/utilities; keep route folders kebab-case.
- Use the `@/` alias for shared imports and keep Supabase, LangChain, or Stripe calls inside `src/lib` for reuse and testing.
- Tailwind classes should progress layout→spacing→color; prefer shadcn primitives over custom styling.

## Testing Guidelines

- Automated tests are not configured yet; when adding coverage, lean on Jest + Testing Library and include script updates in the same PR.
- Document manual QA (e.g., `npm run dev`, upload sample audio, confirm transcript status) inside the pull request description.
- Mock Supabase and Deepgram clients in tests and capture streamed transcript payloads as fixtures.

## Commit & Pull Request Guidelines

- Write commits in the imperative mood with focused subjects (`Add Deepgram throttling guard`) and keep detailed rationale in the body as needed.
- Pull requests should outline the purpose, linked issues, affected routes, manual verification, and any environment or schema changes.
- Attach screenshots or short clips for UI work and call out edits to `supabase/schema.sql` so reviewers can apply migrations.

## Environment & Secrets

- Populate `.env.local` with Supabase keys, `DEEPGRAM_API_KEY`, `STRIPE_SECRET_KEY`, and `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
- Restart the Next.js dev server and socket relay after updating env vars to reload configuration.
