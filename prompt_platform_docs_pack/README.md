# Prompt/Dept. — Project Documentation Pack

> Working title only. The final product name and brand identity have not yet been selected.

This repository documentation describes a voice-first prompt discovery and prompt-generation platform. It is designed to help a coding assistant implement the product in small, verifiable phases while keeping documentation and progress synchronized with the code.

## Run locally

Requirements: Node.js 22 or later and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Useful checks:

```bash
npm run lint
npm run typecheck
npm run build
```

No environment variables are required in Phase 1. See [`.env.example`](.env.example) for the intentionally empty baseline.

## Start here

1. Read [`AGENTS.md`](AGENTS.md) before asking an AI coding tool to change code.
2. Read [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) and [`docs/PRODUCT_REQUIREMENTS.md`](docs/PRODUCT_REQUIREMENTS.md).
3. Follow [`docs/ROADMAP.md`](docs/ROADMAP.md) in order. Implement only the current phase.
4. Copy the phase-specific prompt from [`docs/AI_CODER_PROMPTS.md`](docs/AI_CODER_PROMPTS.md) into your AI coding tool.
5. Update [`docs/PROGRESS.md`](docs/PROGRESS.md), [`docs/CHANGELOG.md`](docs/CHANGELOG.md), and (when applicable) [`docs/DECISIONS.md`](docs/DECISIONS.md) after every completed work unit.
6. Commit completed phases in Git and use pull requests or small reviewable commits.

## Current project status

The documents define the intended product and a proposed architecture. **This pack does not claim that the application has been implemented.** At creation, the project is in the planning/documentation stage. The codebase, chosen AI provider, hosting provider, final brand name, and speech-transcription provider must be verified or selected in the repository before implementation decisions are treated as final.

See [`docs/PROGRESS.md`](docs/PROGRESS.md) for the source of truth for status.

## How to add this pack to an existing repository

1. Download and extract this pack.
2. Copy the `docs/`, `.github/`, and `AGENTS.md` files into the root of your project repository. Merge rather than overwrite existing files if your repo already has instructions or templates.
3. Keep the project documents version-controlled alongside code.
4. If the repository already has an app, ask your coding assistant to **inspect the existing code and compare it with these documents before modifying anything**. Do not blindly replace the existing stack or files.
5. Commit the docs as a dedicated commit, for example: `docs: add project plan and AI coding workflow`.

## Core product idea

Users can discover ready-made prompts, create their own prompts by typing or speaking naturally, customize output requirements, upload notes/documents, and choose either to generate a reusable prompt or perform a task directly (for example, explain notes or create exam-ready answers). Prompt creation and direct AI execution are different flows and must be labelled clearly.

## Documentation map

| File | Why it exists |
|---|---|
| `AGENTS.md` | Non-negotiable guidance for AI coding agents |
| `docs/PROJECT_OVERVIEW.md` | Product vision, users, goals and non-goals |
| `docs/PRODUCT_REQUIREMENTS.md` | Functional requirements and acceptance criteria |
| `docs/ARCHITECTURE.md` | System diagrams and module boundaries |
| `docs/TECH_STACK.md` | Proposed stack and technology rules |
| `docs/UX_UI_GUIDELINES.md` | Art direction and experience principles |
| `docs/TALK_TO_PROMPT.md` | Voice-first workflow and intent schema |
| `docs/NOTES_AND_DOCUMENTS.md` | Upload and notes-explanation flow |
| `docs/DATABASE_SCHEMA.md` | Suggested data model and relationships |
| `docs/API_SPEC.md` | Suggested endpoints, requests and responses |
| `docs/SECURITY_PRIVACY.md` | Security, data privacy and file handling requirements |
| `docs/TESTING.md` | Required testing strategy and release checks |
| `docs/DEPLOYMENT.md` | Environments, secrets and deployment practices |
| `docs/ROADMAP.md` | Small phases with Definition of Done |
| `docs/AI_CODER_PROMPTS.md` | Copy-paste prompts for each implementation phase |
| `docs/PROGRESS.md` | Live status board and next action |
| `docs/CHANGELOG.md` | Human-readable record of changes |
| `docs/DECISIONS.md` | Architecture Decision Records (ADRs) |
| `docs/PROJECT_TASKS.csv` | Optional importable checklist/task list |
| `.github/` | Issue and pull-request templates |

## Rule for keeping documentation honest

Document only what is implemented, verified, or explicitly proposed. Mark unknowns as `TBD`; do not label unimplemented features as complete. After each coding session, record what changed, which tests were run, what remains broken, and the exact next step.
