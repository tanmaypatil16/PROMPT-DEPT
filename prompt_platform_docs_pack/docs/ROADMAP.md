# Implementation Roadmap

## How to use this roadmap

Work one phase at a time. Each phase has explicit completion criteria. Do not start the next phase until the current phase is tested and documented. If this is an existing codebase, first audit it and map current features to these phases rather than rebuilding everything.

Status values: `NOT STARTED`, `IN PROGRESS`, `BLOCKED`, `DONE`. The current status source of truth is `docs/PROGRESS.md`.

## Phase 0 — Repository audit and project setup

**Goal:** establish a reliable baseline before implementing features.

**Stack decision (2026-10-22):** Next.js App Router, React, TypeScript, Node.js LTS, npm, Tailwind CSS 4, shadcn/ui-compatible primitives, Lucide React, and Motion are the approved foundation. Database, authentication, validation, AI, testing, and deployment dependencies are introduced only in their respective phases.

Tasks:
- Inspect files, framework, package manager, scripts, current Git status and existing components.
- Merge this documentation pack without overwriting useful existing docs or user work.
- Configure lint/type checks/tests only where compatible with the repo.
- Create `.env.example`, `.gitignore` protections and a clear README if missing.
- Document stack deviations and open decisions.

Acceptance criteria:
- [x] Existing documentation-pack files are preserved; no application code is present in this directory.
- [x] `README.md`, `AGENTS.md`, roadmap and progress tracker are present.
- [x] Current baseline is recorded accurately: no Git repository, application source, package manifest, scripts, or runnable checks are present here.
- [ ] No secrets or real uploaded files are committed.
- [ ] `docs/PROGRESS.md` lists a single next task.

## Phase 1 — Visual foundation and public shell

**Goal:** implement the visual identity and navigable responsive app shell with useful placeholder states.

**Implementation note (2026-10-22):** The source for this phase is present, including responsive navigation, a public homepage, client-side sample prompt filtering/search, an empty state, and clearly labelled future-feature states. Dependency installation, lint, strict type checking, production build, and local HTTP smoke test pass. Manual responsive and keyboard/accessibility checks remain before the phase is marked done.

Tasks:
- Create design tokens and reusable typography, buttons, inputs, badges, separators and layout primitives.
- Build responsive header/footer and navigation.
- Build homepage hero, discovery search UI and category entry points.
- Implement real links/navigation and responsive behavior; do not add nonfunctional buttons.

Acceptance criteria:
- [ ] Desktop and mobile layouts work.
- [ ] Keyboard focus and semantic heading structure work.
- [ ] Loading/empty/error states are considered.
- [ ] No fake claims or fabricated usage counters.
- [ ] Visual decisions are documented in `docs/UX_UI_GUIDELINES.md`.

## Phase 2 — Prompt library and discovery

**Goal:** users can browse, search, inspect and copy curated prompts.

Tasks:
- Define Prompt, Category and Tag models plus migrations/seed content.
- Build browse, category and prompt detail pages.
- Add keyword search and filtering with server-side data access.
- Add copy feedback and useful prompt metadata/placeholders.
- Populate a small, high-quality, non-duplicative starter library.

Acceptance criteria:
- [ ] Search/filter behavior returns correct results.
- [ ] Prompt details are shareable with stable URLs.
- [ ] Public browsing/copying does not require account creation.
- [ ] Prompt seed data is repeatable and safe.
- [ ] Tests cover search, visibility and slug behavior.

## Phase 3 — Typed Prompt Builder

**Goal:** users can configure a task and generate a reusable prompt without voice.

Tasks:
- Define and validate the shared intent schema.
- Add dynamic task-specific forms for study, office/Excel, image generation, coding and content creation.
- Add editable requirement summary.
- Implement prompt templates/composer and provider abstraction.
- Add preview, copy, edit, regenerate and failure states.

Acceptance criteria:
- [ ] Form input creates validated intent.
- [ ] Prompt reflects selected fields and contains useful placeholders.
- [ ] A missing provider is reported honestly; there is no false success.
- [ ] Unit tests cover schema and prompt composition.

## Phase 4 — Talk to Prompt: voice and intent

**Goal:** spoken and typed requests use the same intent pipeline.

Tasks:
- Add browser speech support detection, permission flow and transcript editor.
- Maintain text fallback at every point.
- Add transcription adapter interface so a backend provider can be added later.
- Build intent extraction, clarification manager and requirements review.
- Add cancellation, unsupported-browser, denial and network error states.

Acceptance criteria:
- [ ] Microphone is never activated without user action.
- [ ] User can review/correct transcript.
- [ ] Voice, typed input and form input use the same validated intent type.
- [ ] Important missing fields trigger reasonable clarifications.
- [ ] No raw audio is retained by default.

## Phase 5 — AI integration and prompt improvement

**Goal:** configured provider integration reliably generates/revises prompts.

Tasks:
- Select provider and model, record the choice in `docs/DECISIONS.md`.
- Implement server-side AI adapter and runtime output validation.
- Add timeouts, usage limits, safe retry policy and error mapping.
- Add improve prompt, before/after comparison and refinement instructions.

Acceptance criteria:
- [ ] Provider keys remain server-side.
- [ ] Invalid model output is handled safely.
- [ ] Usage/cost is bounded and errors are actionable.
- [ ] Tests cover provider errors and prompt output structure.

## Phase 6 — Authentication and personal workspace

**Goal:** signed-in users can securely save and organize prompts.

Tasks:
- Select auth solution and document it.
- Add favorites, personal prompts and basic collections.
- Add ownership checks to every private route.
- Add save/unsave feedback and empty states.

Acceptance criteria:
- [ ] Public discovery remains accessible.
- [ ] Private data is accessible only by its owner or authorized admin.
- [ ] Cross-user access tests pass.
- [ ] Delete behavior is documented and tested.

## Phase 7 — Notes upload and direct AI task execution

**Goal:** users can securely upload notes and either generate a reusable prompt or ask the platform to explain them.

Tasks:
- Select object-storage provider, file allowlist and size limits.
- Implement private upload, metadata, processing status and deletion.
- Implement text extraction for supported formats; add OCR adapter for scanned content.
- Add document ownership checks and untrusted-content boundaries.
- Implement source preferences, section/chunk handling and page references when available.
- Build direct-task mode separately from reusable-prompt mode.

Acceptance criteria:
- [ ] Invalid files are rejected safely.
- [ ] Extraction failures are visible and do not appear as success.
- [ ] Document IDs are verified against the current user.
- [ ] Prompt copied to another tool tells the user to attach/paste notes there.
- [ ] Direct explanation uses only authorized document context and communicates limitations.
- [ ] Deletion, quotas and upload ownership tests pass.

## Phase 8 — Quality, launch and documentation hardening

**Goal:** release a coherent MVP.

Tasks:
- Complete unit, integration and end-to-end tests for core journeys.
- Verify accessibility, responsive layout and performance.
- Configure production environment, backups, logging and error monitoring.
- Complete security review and check that secrets are absent from Git history/current files.
- Update deployment and user-facing privacy/retention documentation.

Acceptance criteria:
- [ ] Release checklist in `docs/TESTING.md` passes or exceptions are explicitly documented.
- [ ] `docs/DEPLOYMENT.md` matches actual infrastructure.
- [ ] All implemented behavior and known limitations are reflected in `docs/PROGRESS.md`.
- [ ] The application builds and deploys in the target environment.

## Phase 9 — Community and growth (post-MVP)

**Goal:** add safe content contribution and discovery improvements.

Tasks:
- Prompt submissions and moderation states.
- Ratings, reports and admin moderation dashboard.
- Public collections and contributor attribution.
- Search improvements/semantic search only if needed.

Acceptance criteria:
- [ ] User submissions are never published without the intended moderation policy.
- [ ] Admin operations are server-authorized and auditable.
- [ ] Anti-spam/rate limits and report handling work.

## Phase 10 — Advanced features (optional)

Potential features: multilingual voice, background workers for large documents, revision/side-by-side prompt comparison, quizzes/flashcards, workflow sequences, team libraries and a creator marketplace. Scope and design each as a separate phase. Do not include marketplace payments/payouts until legal, security and operational requirements are addressed.
