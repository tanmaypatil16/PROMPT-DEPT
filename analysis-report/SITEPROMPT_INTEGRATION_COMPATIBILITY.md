# SitePrompt integration compatibility audit

This document records the compatibility assessment for integrating approved content from SitePrompt into PROMPT/DEPT.

## Compatibility verdict

- The app is a Next.js + Supabase product with existing prompt catalog, admin workflows, and user-specific save/share behavior.
- SitePrompt is a static, content-heavy archive; its structure and data model are not directly portable as application code.
- The safest integration is a content review and manifest-driven import flow rather than a direct website merge.

## Recommended approach

- Use only reviewed prompt text and approved preview assets.
- Build metadata validation and source provenance before database writes.
- Keep imported records as drafts until reviewed and approved.
- Reuse the existing prompt builder and gallery instead of introducing a second browsing experience.
