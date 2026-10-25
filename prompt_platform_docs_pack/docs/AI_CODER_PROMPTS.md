# Copy-Paste Prompts for Your AI Coding Tool

Use one prompt per session. Keep `AGENTS.md` in the repository so the coding tool can read the standing rules. Replace bracketed values where necessary. Never ask the builder to implement all phases in one enormous task.

## Prompt 0 — Audit the repository (start here)

```text
Read AGENTS.md and the docs/ directory first. Do not implement product features yet.

Audit this repository: inspect the file tree, package manager, framework, scripts, current Git status, existing code, database setup, and available tests. Preserve all existing work. Compare the current repo with docs/PROJECT_OVERVIEW.md, docs/ARCHITECTURE.md, and docs/ROADMAP.md. Report what exists, what is missing, any contradictions, and the actual commands that currently pass/fail. Do not claim to run commands unless you run them. Do not overwrite existing README, configuration, or app code blindly. Make only safe documentation/setup corrections that fit Phase 0. Update docs/PROGRESS.md, docs/CHANGELOG.md, and docs/DECISIONS.md if decisions are made. End with the single next implementation task and a proposed commit message.
```

## Prompt 1 — Phase 1: visual foundation

```text
Read AGENTS.md, docs/PROGRESS.md, docs/ROADMAP.md Phase 1, and docs/UX_UI_GUIDELINES.md. Inspect existing code before editing. Implement Phase 1 only: responsive app shell, navigation, design tokens, reusable accessible UI primitives, and homepage discovery shell. Use the editorial archive direction as a proposal, not a finalized brand. Do not add fake data statistics, dead buttons, or generic gradient-heavy AI styling. Use the current project stack and package manager. Add/update tests where appropriate. Run available lint, type-check, tests and build, and report actual results. Update docs/PROGRESS.md and docs/CHANGELOG.md. Do not start Phase 2.
```

## Prompt 2 — Phase 2: prompt library

```text
Read AGENTS.md and relevant docs, especially ROADMAP Phase 2, DATABASE_SCHEMA.md and API_SPEC.md. Implement only the prompt catalog: Prompt/Category/Tag schema and migration, safe seed content, browse page, category page, prompt detail page, keyword search, filters and copy feedback. Preserve existing app patterns. Public prompts must be browseable without sign-in. Add tests for search, visibility and slugs. Use real database access if configured; do not fake persistence. If database credentials/config are missing, implement the schema/code and clearly state what remains unverified rather than claiming success. Update documentation and progress.
```

## Prompt 3 — Phase 3: typed Prompt Builder

```text
Read AGENTS.md, docs/TALK_TO_PROMPT.md, docs/PRODUCT_REQUIREMENTS.md and ROADMAP Phase 3. Implement the typed guided Prompt Builder before voice. Define a validated shared intent schema; build task-specific settings for study/exams, Excel/office, image generation, coding and content creation; show editable extracted/selected requirements; compose a reusable prompt; provide preview, copy, edit and clear loading/error states. Keep reusable prompt generation separate from direct task execution. Put provider calls behind server-only adapters. Do not silently simulate a successful AI call. Add schema/composer tests and update docs/PROGRESS.md and CHANGELOG.md.
```

## Prompt 4 — Phase 4: Talk to Prompt voice pipeline

```text
Read AGENTS.md and docs/TALK_TO_PROMPT.md. Implement ROADMAP Phase 4 only. Add explicit microphone permission flow, browser speech-recognition feature detection, recording/listening/transcribing/reviewing/error states, an editable transcript, and a permanently available text-input fallback. Route both voice and typed text into the same intent schema and clarification logic. Do not start recording automatically. Do not retain raw audio by default. Handle unsupported browser, denial, no-speech, cancellation and network errors. Use a transcription adapter boundary so a server provider may be configured later. Add tests and update the docs/progress tracker.
```

## Prompt 5 — Phase 5: AI provider and prompt improver

```text
Read AGENTS.md, docs/TECH_STACK.md, docs/API_SPEC.md and ROADMAP Phase 5. First identify whether an AI provider/model is configured. If not, do not pretend generation is live: create the provider interface and document the configuration needed, or ask for the missing provider decision only if implementation is blocked. Keep keys server-side. Validate structured model output, implement timeouts, bounded inputs/outputs, rate limits or quotas, safe retries, error mapping, and prompt improvement with before/after comparison. Add provider mocks for tests without representing mocks as production execution. Record provider/model decisions in docs/DECISIONS.md and update progress.
```

## Prompt 6 — Phase 6: authentication and workspace

```text
Read AGENTS.md, docs/DATABASE_SCHEMA.md, docs/API_SPEC.md, docs/SECURITY_PRIVACY.md and ROADMAP Phase 6. Inspect the repo for existing auth before choosing another. Implement sign-in integration and workspace features scoped to the authenticated owner: favorites, saved prompts and basic collections. Public browsing should remain public. Every API action must verify authorization and resource ownership server-side. Add cross-user access tests, deletion behavior, empty/loading/error states and update documentation. Do not add paid plans or team features.
```

## Prompt 7 — Phase 7: notes and direct task execution

```text
Read AGENTS.md, docs/NOTES_AND_DOCUMENTS.md, docs/SECURITY_PRIVACY.md, docs/TALK_TO_PROMPT.md and ROADMAP Phase 7. Implement secure file handling for the explicitly supported formats only. Use private object storage or clearly mark the storage adapter as unconfigured; never put private files in a public folder. Validate file size/type/signature, ownership, quotas and processing state. Implement text extraction, OCR adapter where configured, extraction-quality errors, permitted source references and deletion. Add two explicitly separate choices: generate a reusable prompt from notes or explain the notes directly. The reusable prompt must tell users to attach/paste their notes into the destination model. Direct execution must use only files the current user owns. Treat document contents as untrusted input. Add security and integration tests. Update all relevant documentation.
```

## Prompt 8 — Phase 8: release hardening

```text
Read AGENTS.md, docs/TESTING.md, docs/DEPLOYMENT.md, docs/SECURITY_PRIVACY.md and ROADMAP Phase 8. Do not add large new features. Audit the implemented MVP for failing tests, accessibility issues, authorization bypasses, upload/privacy risks, unhandled provider failures, performance problems, missing environment documentation, and accidental secrets. Fix confirmed issues, add tests, verify build and production configuration without exposing credentials, and update the release checklist and progress log. Clearly distinguish confirmed fixes from remaining risks. Do not claim deployment unless it is verified.
```

## Prompt for every subsequent work session

```text
Read AGENTS.md, docs/PROGRESS.md, docs/CHANGELOG.md and the current phase in docs/ROADMAP.md. Inspect git status and existing code. Continue from the single “Next task” in docs/PROGRESS.md. Do not restart or rewrite finished work. Implement one small, testable increment. Run relevant checks and report the actual outcomes. Update docs/PROGRESS.md, docs/CHANGELOG.md, and any affected specification. End with completed files, verification commands/results, known limitations, and the next single task. Do not commit unless I explicitly ask you to commit.
```

## Bug-fix prompt

```text
Read AGENTS.md and inspect the reproduction steps, relevant code and current tests. Reproduce the bug if the environment allows. Find the smallest root-cause fix; do not refactor unrelated areas. Add a regression test. Run the relevant checks and report actual outputs. Update docs/PROGRESS.md and docs/CHANGELOG.md when the user-visible behavior changes. Do not claim the bug is fixed if it was not verified.
```

## New feature prompt

```text
Before coding, map the proposed feature to docs/PRODUCT_REQUIREMENTS.md and docs/ROADMAP.md. State its user value, scope, data/security impact, UI states, API/schema impact, test plan and acceptance criteria. Implement only after that plan is clear. Keep the feature behind a configuration or incomplete state if an external provider is unavailable. Update requirements, architecture/API docs where needed, progress, changelog and decisions. Avoid broad unrelated refactors.
```
