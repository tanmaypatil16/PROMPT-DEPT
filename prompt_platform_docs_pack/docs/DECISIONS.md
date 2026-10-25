# Architecture Decisions

Record important decisions and their reasons. Proposed defaults are not final decisions until verified/adopted by the project owner. Use newest entries at the top.

## ADR-001 — Start with a modular monolith

- **Status:** Proposed
- **Date:** 2026-10-16
- **Decision:** Use one Next.js application with clear server-side modules and one primary PostgreSQL database for the MVP.
- **Reason:** Lower operational complexity and faster iteration while preserving separation between domains.
- **Trade-offs:** Large workloads may later require a background worker; modules must keep clear boundaries.
- **Revisit when:** measured scaling/processing needs justify separate infrastructure.

## ADR-002 — One shared intent schema for every input method

- **Status:** Proposed
- **Date:** 2026-10-16
- **Decision:** Voice, typed text and guided forms converge on the same validated intent object and prompt composition services.
- **Reason:** Consistent behavior and easier testing across input modes.
- **Trade-offs:** Schema evolution requires versioning/migration of persisted intent where needed.

## ADR-003 — Keep reusable prompt generation separate from direct task execution

- **Status:** Proposed
- **Date:** 2026-10-16
- **Decision:** Expose two explicit output modes.
- **Reason:** A prompt to paste elsewhere is not the same as an AI task completed within this platform.
- **Trade-offs:** UI and usage accounting need to support different result types.

## ADR-004 — Provider adapters for AI and speech

- **Status:** Proposed
- **Date:** 2026-10-16
- **Decision:** Use server-side interfaces for model calls and optional transcription service calls.
- **Reason:** Avoid coupling product logic to one provider and prevent secret leakage.
- **Trade-offs:** Adapter interfaces require a little extra abstraction up front.

## ADR-005 — Use native components and local sample content for Phase 1

- **Status:** Accepted
- **Date:** 2026-10-16
- **Decision:** Build the visual foundation with Next.js, React state, Tailwind CSS, custom CSS, and local sample prompt data; do not add a component library, database, or API in this phase.
- **Context:** The repository initially contained only documentation, and the requested scope is the public visual foundation.
- **Reason:** Keeps the first page lightweight, accessible, and honest while preserving a clean path to the catalog and intent pipeline in later phases.
- **Consequences/trade-offs:** Prompt search and category filters operate only on six client-side sample entries; they must be replaced by server-backed catalog data in Phase 2.
- **Revisit when:** Phase 2 introduces the Prompt, Category, and Tag data model.

## ADR-006 — Standardize the web and integration stack by phase

- **Status:** Accepted
- **Date:** 2026-10-22
- **Decision:** Use Next.js App Router, React, TypeScript, Node.js LTS, and npm as the application foundation. Use Tailwind CSS 4, shadcn/ui-compatible source primitives, Lucide React, and Motion for the UI. Use Route Handlers and server modules instead of Express. Adopt PostgreSQL on Neon, Prisma, Better Auth, Vercel AI SDK, Vitest, Playwright, GitHub, and Vercel only in their respective roadmap phases.
- **Context:** The initial project source had unpinned `latest` dependencies and no installed package graph. The architecture needs stable direction without prematurely installing future services.
- **Reason:** Pinning the visual foundation now limits accidental major-version drift, while phased adoption keeps the first release small and prevents database, provider, or authentication configuration from leaking into public UI work.
- **Consequences/trade-offs:** TypeScript 7.0.2 was incompatible with Next's bundled `typescript-eslint`; TypeScript 6.0.3 is pinned after successful lint, type-check, and build verification. Prisma is deferred because the registry `latest` tag is release-candidate software; the database phase should use the established 7.10.1 line or reassess after Prisma 8 GA.
- **Revisit when:** A stable Prisma 8 release is available, or a verified build exposes an incompatibility among the pinned Next.js, React, TypeScript, Tailwind, or ESLint versions.

## Decision template

## ADR-NNN — Title
- **Status:** Proposed / Accepted / Superseded
- **Date:** YYYY-MM-DD
- **Decision:**
- **Context:**
- **Options considered:**
- **Reason:**
- **Consequences/trade-offs:**
- **Revisit when:**
