# Product Requirements

## Priority legend

- **P0 — MVP blocker:** needed for a coherent first release.
- **P1 — Early follow-up:** valuable after core workflows work.
- **P2 — Later:** defer until there is evidence of need.

## Public discovery

### P0
- Homepage with product explanation, search, category entry points, featured prompts and a clear Talk to Prompt action.
- Explore page with keyword search, category/tag filters and sorting.
- Prompt detail page showing title, purpose, full prompt, tags, use case, variables/placeholders, copy action and related prompts.
- Public prompt browsing and copying without mandatory account creation.
- Responsive and keyboard-accessible design.

### P1
- SEO metadata, canonical URLs and shareable public collections.
- Popular/recent/editor-curated prompt groupings based on real data.

## Prompt generation

### P0
- Typed request input.
- A guided form builder with dynamic fields based on selected task type.
- Intent extraction into a validated schema.
- Editable requirement summary before generation.
- Reusable prompt generation using a provider adapter or deterministic template fallback clearly labelled as such.
- Prompt preview with copy and edit actions.
- Validation, loading, error, retry and quota states.

### P1
- Improve an existing prompt and show before/after changes.
- Save named prompt versions and compare revisions.
- Suggestions for related prompt templates.

## Talk to Prompt / voice

### P0
- Microphone permission flow with a clear status indicator.
- Speech recognition where browser support exists.
- Editable transcript before intent extraction.
- Text input available at all times.
- Intent extraction and the same schema shared with typed/form input.
- Clarifying questions only when an important detail is missing.
- User can review and change extracted fields.
- Explicit choice between “Generate reusable prompt” and “Do task now” when direct execution is available.

### P1
- Configurable backend transcription fallback.
- Multilingual transcription and output-language selection.
- Voice-session resume and transcript history with retention controls.

## Student and exam workflows

### P0
- Select subject/topic, audience/level, answer marks or length, explanation style, diagram preference, source preference and desired answer sections.
- Support 2-, 5-, 10-mark and custom answer structures as configurable preferences, not rigid rules.
- Source options: uploaded notes only; notes plus supplementary explanation; general knowledge.
- Instruct the model not to invent source details and to disclose when information is missing.
- If the model cannot draw a diagram, it should provide a text/ASCII description or a diagram specification appropriate to the target tool.

### P1
- Revision plan, flashcards, quizzes, oral practice and weak-topic tracking.
- Multiple output formats including concise answers, tables and long-form explanations.

## Notes and document workflows

### P0
- Supported format list and configurable size limits.
- Private upload initiation and ownership validation.
- File processing status, error state and deletion.
- Text extraction from supported text PDFs and DOCX/TXT files.
- OCR adapter for scanned PDFs/images when configured.
- Distinct options: “Create a reusable prompt from my notes” vs “Explain my notes now.”
- Clearly explain when extraction is incomplete.

### P1
- Page-level source references, chunk-based retrieval for larger files, and background processing.

## User workspace

### P0
- Authentication for private workspace features.
- Save/unsave prompts, list favorites, rename/manage collections if collections are included in the MVP slice.
- Ownership enforcement on the server.

### P1
- Generation history, prompt versions, private drafts, export.

## Community and admin

### P1
- Prompt submissions with pending/published/rejected state.
- Ratings and reports, moderation queue and admin-only management.
- Public contributor profiles only if privacy and moderation rules are ready.

### P2
- Paid creator marketplace, payouts, teams/enterprise features.

## Quality requirements

- No secret keys in client code.
- Runtime validation on all AI output and API inputs.
- Clear failure handling for unavailable AI/speech provider, rejected upload, extraction failure and rate limiting.
- Server-enforced access control and ownership checks.
- Accessibility basics: keyboard support, labels, focus visibility, contrast, reduced-motion support.
- Unit/integration/E2E coverage for critical workflows.
- Do not retain raw voice recordings by default.

## MVP acceptance scenario

A new guest visits the site, searches and copies a public prompt. They can then open Talk to Prompt, type or speak a request for a simple 5-mark answer, correct the transcript if necessary, review and change answer requirements, generate a reusable prompt and copy it. A signed-in user can save a prompt. When document upload is enabled, the user can upload a permitted file and choose direct explanation or reusable prompt generation. If a provider is not configured, the affected integration must be clearly marked unavailable rather than simulated as completed.
