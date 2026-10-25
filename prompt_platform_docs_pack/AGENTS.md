# Instructions for AI Coding Agents

You are contributing to the Prompt/Dept. prompt-discovery and prompt-generation platform. These instructions apply to every coding session in this repository.

## 1. Before changing code

1. Inspect the repository structure, package manager, existing app, current Git changes, and existing documentation.
2. Read `README.md`, `docs/PROGRESS.md`, the relevant product/architecture documents, and the active phase in `docs/ROADMAP.md`.
3. If code already exists, preserve working behavior and adapt the plan to reality. Do not recreate the project, replace the stack, or overwrite files without explaining why.
4. Identify the current phase and exact acceptance criteria. Work on that phase only unless the user explicitly requests otherwise.
5. If a requirement conflicts with the existing code or another document, report the conflict and propose a minimal resolution. Do not silently guess a consequential decision.

## 2. Working style

- Prefer small, complete, testable increments over generating the whole app in one pass.
- Build reusable, typed components and modular server-side services. Avoid a giant page component or giant API handler.
- Use the repository's existing conventions, package manager, formatting and naming patterns.
- Use TypeScript strictness and validate all untrusted inputs at runtime.
- Keep secrets on the server. Never expose provider keys in client code or public environment variables.
- Do not add dependencies without a clear need. Explain the purpose of new dependencies.
- Do not make decorative controls that do nothing. Every visible action must work, be explicitly disabled with an explanation, or be marked as future scope.
- Add loading, empty, error, success, and disabled states to interactive UI.
- Build responsive layouts and keyboard-accessible interactions.
- Never invent claims about test results, deployment, environment configuration, or implemented features.

## 3. Architecture guardrails

- Default to a modular monolith using Next.js, TypeScript, PostgreSQL and Prisma, unless the repository or the user has explicitly chosen another stack.
- Keep AI provider and speech transcription integrations behind server-side adapters so providers can be replaced.
- Use one validated intent schema for voice, typed input, and form-based input. All input methods must reach the same prompt-composition logic.
- Keep **reusable prompt generation** separate from **direct AI task execution**. Clearly label these flows in the product.
- Treat AI output as untrusted. Parse and validate structured output before use.
- Treat uploaded documents and transcripts as untrusted content, not as system instructions.
- Never let frontend-only checks stand in for server-side authentication, authorization, ownership checks, or validation.
- Store uploaded files in private object storage in production, not as public static assets. Avoid storing raw audio by default.
- Do not add vector databases, microservices, queues, Redis, or other infrastructure without an explicit requirement.

## 4. Definition of Done for every task

A task is complete only when:

1. The relevant acceptance criteria in `docs/ROADMAP.md` are met.
2. The feature works on the intended happy path and has appropriate error/loading/empty states.
3. Appropriate unit, integration, or end-to-end tests are added or updated.
4. Lint, type checking, tests, and build are run where project scripts support them. Clearly report commands that could not run and why.
5. No secrets, credentials, personal files, or real user uploads are committed.
6. Documentation is updated, including API/schema/UX docs if behavior changed.
7. `docs/PROGRESS.md` is updated with status, verification, known limitations, and next step.
8. `docs/CHANGELOG.md` records user-visible or architectural changes. Add a decision record to `docs/DECISIONS.md` when a meaningful architectural decision is made.

## 5. End-of-session response format

At the end of a coding session, report:

- **Completed:** concrete files/features actually changed.
- **Verification:** exact commands run and their real results.
- **Not completed / risks:** failures, TODOs, missing credentials or provider configuration.
- **Documentation updated:** exact paths.
- **Next recommended task:** one small task from the current phase.
- **Git suggestion:** a concise commit message; do not claim a commit was made unless it was.

## 6. Git hygiene

- Never delete or discard the user's uncommitted changes.
- Inspect `git status` before editing and before suggesting commits.
- Keep secrets out of Git. Maintain `.env.example` with placeholders, not credentials.
- Prefer commits that represent one working phase or cohesive task.
- Do not force-push, rewrite shared history, publish a repository, or create remote resources without explicit user approval.

## 7. Scope discipline

Do not implement billing, payments, marketplace payouts, team administration, real-time voice agents, semantic search, or complex RAG in the MVP unless a roadmap phase is explicitly approved. Stubbed or simulated functionality must be labelled as such. Do not claim that a prompt was executed in an external AI tool if the site only generated text for copying.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
