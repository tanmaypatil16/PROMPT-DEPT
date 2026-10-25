# UX and Visual Design Guidelines

## Visual direction

Working direction: an editorial archive for discovery combined with a focused creative workspace for generation.

Current palette, based on the supplied visual reference:

- Warm paper: `#F5F3EF`
- Forest green: `#006B50`
- Leaf green: `#8DBD27`
- Seafoam: `#91C9BD`
- Pale lime: `#E8F0B0`
- Peach: `#ED9E62`

Use warm paper and ink for the main canvas and text, forest green for primary actions and the hero, and seafoam, pale lime, leaf green, and peach as restrained supporting accents.

The public homepage applies this palette with editorial hierarchy, fine borders, asymmetric content blocks, a responsive layout, visible focus styles, a skip link, and reduced-motion support. The sample prompt library is intentionally labelled as Phase 1 content; it is not production catalog data.

Typography may combine a highly legible sans-serif with a monospace face for metadata. Final fonts and licensing must be checked before production.

## Avoid generic AI aesthetics

- Do not use purple/blue gradients on every section.
- Do not fill the page with identical rounded cards.
- Do not use random AI-generated decorative imagery as a substitute for art direction.
- Do not animate everything or create motion that slows the user down.
- Prefer clear type hierarchy, editorial spacing, asymmetric but usable layouts, intentional borders and meaningful labels.

## Navigation and information architecture

Primary navigation should make these tasks obvious: Explore, Talk to Prompt, Build a Prompt, and Workspace. Notes Tutor may be shown as a mode or a dedicated destination. Avoid a crowded navigation bar; keep less-used pages under secondary navigation.

## Talk to Prompt interaction rules

- Display recording state clearly: ready, requesting permission, recording, transcribing, reviewing, processing, completed, and failed.
- Show an obvious stop/finish control and allow transcript corrections.
- Always provide text input as an alternative.
- Show the extracted requirements in ordinary language before final generation.
- Ask only necessary questions; prefill what can be reliably inferred and label inferred values for confirmation when important.
- Distinguish “Generate reusable prompt” from “Do task now.”
- Keep a copy button and an editable prompt output visible after completion.

## Components and states

Every interactive component needs accessible labels, keyboard support, focus indication and suitable states: idle, hover, active, disabled, loading, success and error as applicable. Include empty states and explanatory errors.

## Responsive and accessibility requirements

- Design mobile-first, then enhance desktop layouts.
- Do not require a pointer to operate the app.
- Use semantic headings and landmarks, proper labels and accessible dialogs.
- Ensure sufficient contrast; never communicate status only with color.
- Respect `prefers-reduced-motion`.
- Avoid automatically starting microphone recording or playing audio.
- Make uploads, transcript review and generated output usable at narrow widths.

## Content design

Use direct, human language and concrete labels. Prefer “Create a 5-mark exam answer” over abstract AI terminology. Explain when a result is a draft, a reusable prompt or an AI-generated answer. Never promise guaranteed results or exam predictions.
