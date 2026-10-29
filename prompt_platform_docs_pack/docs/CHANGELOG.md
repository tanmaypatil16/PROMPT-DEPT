# Changelog

User-visible and meaningful engineering changes. Keep newest entries at the top. This is not a substitute for Git history.

## 2026-10-29 — GitHub prompt sources imported as drafts

- Added: source-specific parsers and generation scripts for the image-prompt collection and SitePrompt Markdown repositories, preserving complete prompt text, source URLs, attribution, stable hashes, and unique slugs.
- Changed: imported 416 eligible prompts into the configured Supabase database as drafts: 350 image prompts and 66 website/UI prompts. No imported prompts were published.
- Attribution/rights: SitePrompt is MIT licensed. The image collection was imported under explicit project-owner permission; its repository has no detected license file, so preview assets were not imported.
- Verification: content hashes and slugs are unique in the generated manifest; repeat import verification found 416 existing content hashes and 0 remaining candidates.
- Remaining action: a trusted administrator must publish reviewed drafts from the existing admin prompt workflow before they appear in the public gallery.

## 2026-10-27 — Trusted import review-state foundation

- Added: commit-pinned source verification for the configured upstream repository. The review API derives source identity and SHA-256 from bytes fetched server-side and rejects client-supplied approval, rights, reviewer, identity, and hash claims.
- Added: additive migration `supabase/migrations/20261027000000_import_source_review_state.sql` for current review state, constraints, admin-read RLS, and an atomic state-plus-audit RPC with compare-and-swap concurrency checks.
- Changed: review decisions now persist through the transactional RPC, with idempotent retries, explicit status transition guards, and automatic invalidation to `requires_review` when source bytes change.
- User-facing effect: admins can record version-bound review decisions after using a full immutable commit SHA. Approval is only a human review decision and does not confirm redistribution rights or enable imports.
- Tests/checks: `npm run lint` and `npm run typecheck -- --pretty false` pass; focused Vitest tests pass (3 files, 19 tests). Vitest reports one non-fatal native config-loader warning.
- Limitations/risks: migration is not applied; the persistence endpoint requires it. The system cannot independently identify upstream authors or establish licensing/redistribution rights. The import-run endpoint remains separate and was not invoked.
- Related issue/PR: none.

## 2026-10-27 — SitePrompt admin review workflow hardened

- Added: an admin-only review API at `/api/admin/import/review` that accepts structured manifest decisions, enforces server-side admin authorization, rejects missing rights/status approvals, blocks duplicate identities, and logs reviewer actions.
- Changed: hardened the review endpoint against client-side approval tampering by rejecting approval-like `manifestStatus`/`licenseStatus` fields and by requiring a stable source hash before accepting a historical review decision as valid context.
- Added: a review-only admin UI section in the import admin page for manifest review, dry-run display, and per-entry review actions without import execution.
- Added: focused tests covering unauthenticated/unauthorized requests, malformed payloads, duplicate identities, stale content after review, and the guarantee that no prompt writes or media uploads occur.
- Changed: strengthened the dry-run manifest path and final review safeguards to require a valid approval state, confirmed rights, and no duplicate/stale approval conditions.
- User-facing effect: administrators can review an import manifest and record decisions, but the project still does not execute any import, publish, or media-upload operation in this phase.
- Tests/checks: `npm run lint`, `npm run typecheck -- --pretty false`, and `npx vitest run src/lib/import/manifest.test.ts src/lib/import/review.test.ts` pass.
- Limitations/risks: this remains an approval-only workflow; actual SitePrompt import execution and rights verification remain separate, explicit, and user-approved follow-up work.
- Related issue/PR: none.

## 2026-10-26 — SitePrompt import safety scaffolding

- Added: a review-only import manifest and validation layer for approved SitePrompt source entries.
- Added: safe import-test coverage for manifest validation and record parsing.
- Changed: fixed the admin import route nullability issue and removed a synchronous state update in the admin prompts page that triggered ESLint's `react-hooks/set-state-in-effect` rule.
- User-facing effect: no production import behavior was enabled; the repo now has a dry-run-safe import framework and clear rights/approval guardrails.
- Tests/checks: `npm run lint`, `npm run typecheck -- --pretty false`, and focused `npx vitest run src/lib/import/manifest.test.ts src/lib/import/parse-records.test.ts` pass.
- Limitations/risks: the app still requires a verified rights review and explicit approval before any SitePrompt content is imported or published.
- Related issue/PR: none.

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
