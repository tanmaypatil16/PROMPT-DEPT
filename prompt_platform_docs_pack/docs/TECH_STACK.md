# Technology Stack and Implementation Rules

## Adopted stack and phase boundaries

| Layer | Choice | Notes |
|---|---|---|
| Language/runtime/package manager | TypeScript 6.0.3, Node.js LTS, npm | Strict TypeScript; current local Node is v22.18.0 |
| Web application | Next.js App Router 16.4.2 + React 19.3.1 | UI, Route Handlers, and server modules in one repository; no Express server |
| Styling | Tailwind CSS 4.3.3 + custom CSS | CSS-first Tailwind configuration and the project design system |
| UI primitives | shadcn/ui-compatible source components | `components.json` is configured; add primitives only when a feature needs them |
| Icons and motion | Lucide React 1.61.0; Motion 14.6.0 | Installed for visual work; use motion sparingly and respect reduced-motion preferences |
| Forms and validation | React Hook Form 7.90.0 + Zod 4.6.7 | Approved for complex forms in later phases; not installed yet |
| Database | PostgreSQL hosted on Neon | Add during the database phase |
| ORM and migrations | Prisma 7.10.1 line | Defer installation; registry `latest` is currently Prisma 8 release-candidate software |
| Validation | Zod | Reuse schemas at API boundaries where practical |
| Authentication | Better Auth 1.7.12 | Defer installation until Phase 6 |
| AI integration | Vercel AI SDK 7.0.148 behind server-side provider adapters | Defer installation and first-provider choice until Phase 5 |
| Speech | Browser Web Speech API where supported; transcription adapter fallback | Provider `TBD` |
| File storage | Private S3-compatible or managed object storage | Provider `TBD` |
| Document parsing | Text extraction libraries plus OCR adapter | Validate file types and extraction quality |
| Testing | Vitest unit tests and Playwright E2E tests | Add with the first testable feature, not as Phase 1 setup debt |
| Deployment | Vercel + Neon | Configure only after application and database phases warrant it |

## Locked Phase 1 versions

The manifest and `package-lock.json` pin the verified core and visual packages: Next.js 16.4.2, React/React DOM 19.3.1, TypeScript 6.0.3, Tailwind CSS and its PostCSS plugin 4.3.3, Lucide React 1.61.0, and Motion 14.6.0. It also includes the small shadcn/ui support set (`@radix-ui/react-slot`, `class-variance-authority`, `clsx`, and `tailwind-merge`).

## Compatibility notes

- Next.js 16.4.2 declares React 19 support; the selected React 19.3.1 satisfies that peer range.
- TypeScript 7.0.2 was initially selected from the registry, but Next's bundled `typescript-eslint` rejected it. TypeScript 6.0.3 is pinned instead; lint, type checking, and production build pass with that version.
- The Next ESLint configuration declares ESLint 9 or newer. ESLint 9.39.5 is pinned rather than adopting ESLint 10 before an application build verifies compatibility.
- Tailwind CSS 4 targets modern browsers. Its documented baseline includes Chrome 111, Safari 16.4, and Firefox 128; product browser support should be confirmed before relying on newer CSS features.
- Do not install Prisma 8 while its npm `latest` tag is a release candidate. Re-evaluate Prisma 8 after a stable GA release; otherwise use the established 7.10.1 line in the database phase.

## Important selection rule

Before installing dependencies, inspect `package.json`, lockfiles and existing code. Do not swap the framework or package manager just because this document proposes defaults. If the codebase uses a different viable stack, document the difference and ask for a decision only when the change is consequential.

## Server/client boundaries

- Client components may manage microphone state, interaction state, transcript editing and visual feedback.
- Server modules handle secrets, user ownership, prompt provider calls, usage accounting, document access and moderation.
- Do not import server-only code into client bundles.
- Never prefix secret provider keys with a public environment variable convention.

## Environment file

Maintain `.env.example` with placeholders such as `DATABASE_URL=`, `AUTH_SECRET=`, `AI_PROVIDER_API_KEY=`, and storage configuration keys only when used. Never commit a working `.env` file.

## Dependency discipline

Before adding a package, explain what it solves, check whether the project already has equivalent functionality, and use a maintained package. Keep audio, document processing and provider integration abstracted from UI components.
