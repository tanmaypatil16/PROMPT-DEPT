# Project Progress — Source of Truth

> Update this file at the end of every AI coding session. Be factual: documentation in place does not mean app features are implemented.

## Current status

## Aureus website preview — 2026-10-29

- Added nullable `prompts.preview_url` migration and admin support.
- Added server-side preview-origin allowlisting for HTTPS Google Sites URLs and responsive iframe rendering with an external fallback link.
- Target prompt: `wealth-video-hero` (Wealth Video Hero).
- Google Sites publishes `X-Frame-Options: DENY` and limits `frame-ancestors`, so iframe embedding is expected to be blocked; the Open full preview path remains functional.
- Database migration and single-record association require the migration to be applied in Supabase first; the current environment does not expose database credentials or a linked Supabase CLI project, so neither database write was executed.


- **Overall status:** `PHASE 1 IMPLEMENTED / TRUSTED REVIEW-STATE FOUNDATION AUTHORED / MIGRATION NOT APPLIED / NO IMPORT EXECUTION ENABLED`
- **Application implementation status:** `Server review endpoint verifies commit-pinned source bytes and prepares atomic review-state/audit persistence; database migration is additive and unapplied`
- **Current phase:** GitHub prompt import completed as drafts
- **Last updated:** 2026-10-27
- **Current owner:** Project owner + AI coding assistant
- **Repository URL:** `TBD`
- **Live deployment URL:** `TBD`

## Confirmed scope

- Prompt discovery library and category-based browsing.
- Typed prompt builder with task-specific controls.
- Talk to Prompt voice/text intake.
- Structured intent extraction and relevant clarifying questions.
- Exam-ready answer requirements and note-related workflows.
- Separate reusable prompt generation and direct AI task execution.
- Optional notes uploads with private storage, extraction/OCR and deletion controls.
- User workspace for favorites, collections and later history/versioning.
- Community/admin features after the MVP core is stable.

## Proposed technical baseline (verify against repository)

- Frontend/server application: Next.js App Router + React + TypeScript.
- Styling: Tailwind CSS plus custom design components.
- Data: PostgreSQL + Prisma.
- Input validation: Zod or an equivalent schema library.
- AI model integration: server-side provider adapter; provider is `TBD`.
- Speech: browser support where available, text fallback, optional backend transcription provider `TBD`.
- Private file storage: provider `TBD`.
- Hosting/authentication: `TBD`.

## Phase tracker

| Phase | Status | Notes |
|---|---|---|
| 0 — Repo audit/setup | IN PROGRESS | Application scaffold and locked dependency graph verified; the directory remains outside a Git repository |
| 1 — Visual foundation | IN PROGRESS | Homepage and public shell pass automated checks and local HTTP smoke test; responsive and keyboard/accessibility manual checks remain |
| 2 — Prompt library | NOT STARTED | |
| 3 — Typed Prompt Builder | NOT STARTED | |
| 4 — Talk to Prompt voice/intent | NOT STARTED | |
| 5 — AI provider/prompt improver | NOT STARTED | Provider selection is TBD |
| 6 — Auth/workspace | NOT STARTED | Auth selection is TBD |
| 7 — Notes/direct tasks | NOT STARTED | Storage, extraction/OCR and AI provider must be selected/configured |
| 8 — Quality/release | NOT STARTED | |
| 9 — Community/growth | NOT STARTED | Post-MVP |
| 10 — Advanced features | NOT STARTED | Optional future scope |

## Completed in planning

- [x] Defined the product vision and user groups.
- [x] Defined the difference between reusable prompt generation and direct AI execution.
- [x] Proposed modular-monolith architecture and main modules.
- [x] Proposed database entities and API endpoint conventions.
- [x] Defined voice, exam-answer and notes-processing behavior.
- [x] Created phased implementation roadmap and copy-paste coding-agent prompts.
- [x] Added GitHub issue/PR templates to the documentation pack.

## SitePrompt review-state foundation — 2026-10-27

- Added the additive migration `supabase/migrations/20261027000000_import_source_review_state.sql`. It defines one current review row per repository/path, stores the full source commit and server-computed SHA-256, reviewer, status, rationale, and timestamps, applies constraints and admin-only RLS for reads, and provides an atomic RPC that writes state plus the audit event in one transaction.
- The review endpoint uses `requireAdmin()`, accepts only the configured upstream repository and safe Markdown paths at full 40-character commit SHAs, fetches the exact raw GitHub file server-side without following redirects, and computes the hash from response bytes. Reviewer identity comes only from the authenticated session; client-supplied hash, identity, reviewer, rights, and manifest approval fields are rejected.
- Concurrent updates use a server-read `updated_at` compare-and-swap in the transactional RPC. Exact retries are idempotent; source hash changes invalidate prior status and return the record to `requires_review`; invalid transitions and audit failures fail without success.
- Scope remains review-only. An `approved` status is a human review decision, not rights verification. The RPC records `rights_independently_verified: false`; import execution, prompts, media, and publication are not touched.
- Migration was created but **not applied**. Until it is applied through the normal reviewed migration process, the new persistence endpoint cannot operate against the database.
- Verification on 2026-10-27: `npm run lint` passed with 0 warnings; `npm run typecheck -- --pretty false` passed; focused Vitest run passed 3 files / 19 tests. Vitest emitted a non-fatal Vite native config-loader warning.
- Remaining limitation: source-author identity is not part of the upstream manifest, so the system binds a decision to source bytes and the authenticated active administrator but cannot independently establish who authored the source or whether redistribution is legally permitted.

## Verified and still pending

- [x] Documentation-pack file structure and Git baseline inspected.
- [x] Initial Next.js App Router application scaffold created with TypeScript, Tailwind CSS, ESLint, `.gitignore`, and `.env.example`.
- [x] Phase 1 responsive public homepage, sample prompt discovery/filtering, navigation, empty state, and future-feature states implemented.
- [x] Core framework and visual stack direction accepted and exact Phase 1 dependency versions pinned in `package.json`.
- [ ] Actual application repository, branch, and Git status (not present in this directory).
- [ ] Selected repository name/URL.
- [ ] Final product name/visual branding.
- [x] Database provisioned and migrations run.
- [ ] Authentication provider selected/configured.
- [ ] AI provider/model selected/configured.
- [ ] Speech transcription support verified in target browsers.
- [ ] Object storage provider and file-size limits selected.
- [ ] Deployment environment configured.
- [x] Lint, type checks, and production build run against the actual app.
- [x] Focused import-safety tests pass for manifest validation and parser behavior.
- [ ] Automated end-to-end tests (deferred until Playwright or a higher-level harness is introduced in later work).

## Verification log

The following records the audited baseline and the actual Phase 1 verification results.

| Date | Command/check | Result | Notes |
|---|---|---|---|
| 2026-10-27 | `npm run lint` | Pass | Review-state changes lint clean with 0 warnings. |
| 2026-10-27 | `npm run typecheck -- --pretty false` | Pass | TypeScript check passed for the review-state endpoint and source verifier. |
| 2026-10-27 | `npx vitest run src/lib/import/manifest.test.ts src/lib/import/review.test.ts src/lib/import/source-verification.test.ts` | Pass | Three files and 19 tests passed; Vitest emitted one non-fatal native config-loader warning. |
| 2026-10-27 | Supabase migration `20261027000000_import_source_review_state.sql` | Not applied | Additive review-state table/RPC proposed and implemented in source only; no database was modified. |
| 2026-10-26 | `npm run lint` | Pass | ESLint passed after fixing the admin prompt page effect and the import route nullability warnings. |
| 2026-10-26 | `npm run typecheck -- --pretty false` | Pass | TypeScript passes after tightening `db` handling in the admin import route. |
| 2026-10-26 | `npx vitest run src/lib/import/manifest.test.ts src/lib/import/parse-records.test.ts` | Pass | Six import-safety tests passed: manifest validation and parser behavior are covered. |
| 2026-10-25 | Supabase SQL Editor — `supabase/RUN_IN_SQL_EDITOR.sql` | Pass | Applied the schema and seed data; verified 19 public tables, 9 categories, 2 subscription plans, the public catalog view, and RLS on `prompts`. |
| 2026-10-24 | `npm run typecheck` | Pass | TypeScript check passed after implementing the supplied forest-green and warm-paper palette. |
| 2026-10-24 | `npm run build` | Pass | Production build completed successfully after the palette change. |
| 2026-10-24 | `npm run lint` | Fail (unrelated existing issue) | ESLint reported a `react-hooks/set-state-in-effect` warning in the admin prompts page and the admin import route; both issues were fixed in the current change. |
| 2026-10-16 | Documentation pack creation | Prepared | No application code was inspected or executed |
| 2026-10-16 | `Get-ChildItem -Force` | Pass | Confirmed only documentation-pack content: `.github/`, `docs/`, `AGENTS.md`, `README.md`, `PACK_MANIFEST.md`, and `.gitignore.recommended`. |
| 2026-10-16 | `rg --files -g "!docs/**" -g "!README.md" -g "!AGENTS.md" -g "!.github/**"` | Pass | No application source, package manifest, test configuration, or build configuration found. |
| 2026-10-16 | `git status --short` | Not run successfully | Failed: `fatal: not a git repository (or any of the parent directories): .git`. No Git status is available for this directory. |
| 2026-10-16 | Lint, type check, tests, build | Not run | No package manager manifest or runnable project scripts exist in this directory. |
| 2026-10-16 | `npm install` | Blocked | Two installation attempts stalled before creating `node_modules` or `package-lock.json`; stalled npm Node processes were stopped. |
| 2026-10-16 | `npm run lint` | Blocked | `eslint` could not be resolved because dependencies were not installed. |
| 2026-10-16 | `npm run typecheck` | Blocked | `tsc` could not be resolved because dependencies were not installed. |
| 2026-10-16 | `npm run build` | Blocked | `next` could not be resolved because dependencies were not installed. |
| 2026-10-16 | Secret-pattern scan | Pass | No credential-like assignment was found in the application and documentation files searched. |
| 2026-10-16 | `node -e "JSON.parse(...)"`; `node --check` config files | Pass | `package.json` and `tsconfig.json` parse successfully; ESM lint and PostCSS configuration files passed Node syntax checks. |
| 2026-10-22 | npm registry version and peer checks | Pass | Next.js 16.4.2 declares React 19 support; selected package versions recorded in `docs/TECH_STACK.md`. |
| 2026-10-22 | `npm install --no-audit --no-fund` | Pass | Created `node_modules` and `package-lock.json` for the pinned Phase 1 dependency graph. |
| 2026-10-22 | `npm run lint` | Pass | No errors or warnings after TypeScript was pinned to 6.0.3 and the PostCSS config was named. |
| 2026-10-22 | `npm run typecheck` | Pass | Strict TypeScript check completed with no errors. |
| 2026-10-22 | `npm run build` | Pass | Production build passed outside the sandbox; sandbox execution alone blocks Next worker spawning with `EPERM`. |
| 2026-10-22 | `npm run dev` + `Invoke-WebRequest http://localhost:3000` | Pass | Development server became ready; HTTP response was 200 and contained the homepage marker. |
| 2026-10-22 | `npm ls --depth=0` | Pass | Installed top-level dependency versions match the pinned manifest. |

## Blockers / decisions needed

- Repository and current branch: `TBD`.
- This documentation pack is not inside a Git repository; merge it into the intended application repository before implementation.
- Existing codebase or clean start: `TBD` — inspect before implementation.
- Final product name/domain: `TBD`.
- AI provider/model: `TBD`.
- Auth provider: `TBD`.
- Hosting/object storage: `TBD`.

## Next task — only one

**Perform a manual desktop/mobile and keyboard accessibility smoke test of the homepage, then update the Phase 1 acceptance checklist with its actual outcome.**

## Session update template

Append or edit the current tracker after each coding session:

- Date:
- Phase/task:
- Status after session:
- Files changed:
- Tests/commands run and actual results:
- Known issues/risks:
- Docs updated:
- Commit/PR reference (if created):
- Next single task:
