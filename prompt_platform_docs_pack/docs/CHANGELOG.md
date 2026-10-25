# Changelog

User-visible and meaningful engineering changes. Keep newest entries at the top. This is not a substitute for Git history.

## 2026-10-24 — Warm forest-green visual palette

- Changed: replaced the dark blue/purple palette with warm paper surfaces, forest-green actions and hero, seafoam and pale-lime accents, and peach feedback.
- User-facing effect: the public shell, prompt library, prompt detail page, studio preview, and interactive states now use the supplied color direction.
- Tests/checks: `npm run typecheck` and `npm run build` pass. `npm run lint` reports an existing `react-hooks/set-state-in-effect` error in `src/components/prompt-card.tsx:18`, which is outside this visual change.
- Limitations/risks: the directory is not a Git repository, so Git status is unavailable.
- Related issue/PR: none.

## 2026-10-22 — Phase 1 stack verified and TypeScript compatibility corrected

- Changed: installed and locked the Phase 1 dependency graph; changed TypeScript from 7.0.2 to 6.0.3 after Next's bundled TypeScript ESLint integration rejected TypeScript 7.
- Tests/checks: lint, strict type check, and production build pass. The local development server returned HTTP 200 for the homepage.
- Limitations/risks: a build run inside the sandbox alone cannot spawn Next workers (`EPERM`), but it passes outside the sandbox. Manual responsive and keyboard accessibility checks remain.
- Related issue/PR: none.

## 2026-10-22 — Stack standardized for phased implementation

- Changed: pinned the current core and visual dependency versions; configured shadcn/ui component aliases and shared class-name utility.
- Architecture: adopted Next.js App Router, React, TypeScript, Node.js LTS, npm, Tailwind CSS 4, Lucide React, Motion, and server module boundaries; documented phased Neon, Prisma, Better Auth, Vercel AI SDK, Vitest, Playwright, and Vercel adoption.
- Compatibility: deferred Prisma because its current npm `latest` tag is a release candidate; Phase 4/5/6/7 dependencies were not installed.
- Tests/checks: npm registry version and peer-dependency checks passed; see the newer verification entry for completed install/build results.
- Related issue/PR: none.

## 2026-10-16 — Phase 1 public homepage foundation

- Added: Next.js App Router application scaffold with TypeScript, Tailwind CSS, ESLint configuration, baseline environment protection, and the Prompt/Dept. public homepage.
- User-facing effect: users can navigate the responsive public shell, filter and search clearly labelled sample prompts, and see honest future states for voice, builder, and workspace features.
- Tests/checks: source inspection and secret-pattern scan passed. Dependency installation stalled without producing `node_modules`; lint, type check, and build are blocked until installation completes.
- Limitations/risks: this directory is not a Git repository, and Phase 1 cannot be marked verified until the runnable checks pass.
- Related issue/PR: none.

## 2026-10-16 — Documentation-pack baseline audited

- Changed: recorded the verified documentation-only baseline and created the append-only AI coding session log.
- User-facing effect: none; no application source or product behavior is present in this directory.
- Tests/checks: file inventory and source/configuration search completed; `git status --short` could not run because this directory is not a Git repository; lint, type check, tests, and build are unavailable.
- Limitations/risks: the actual application repository has not been provided or audited.
- Related issue/PR: none.

## 2026-10-16 — Documentation pack prepared

- Added project overview, product requirements, architecture and proposed stack.
- Added UX guidelines, Talk to Prompt specification and notes/document handling rules.
- Added proposed database model and API conventions.
- Added security/privacy, testing and deployment guidance.
- Added phased roadmap, copy-paste prompts for AI coding agents and a progress source of truth.
- Added GitHub issue and pull-request templates.
- Status: documentation prepared; application implementation is not verified by this pack.

## Entry template

### YYYY-MM-DD — Short change description

- Added/changed:
- User-facing effect:
- Tests/checks:
- Limitations/risks:
- Related issue/PR:
