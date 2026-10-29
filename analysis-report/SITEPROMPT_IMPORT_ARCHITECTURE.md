# SitePrompt import architecture

This document captures the safe integration approach for PROMPT/DEPT. when evaluating prompt content from the SitePrompt clone.

## Scope and guardrails

- Keep the imported source repository separate from the working app repository.
- Do not port SitePrompt application code or assets into the PROMPT/DEPT. codebase.
- Treat prompt text, media, and demo assets as unverified until ownership and licensing are confirmed in writing.
- Default to draft-only, dry-run import behavior unless an administrator explicitly approves a manifest entry.

## Source manifest

Each reviewed source item should be tracked with:

- source_repository
- source_path
- source_commit
- source_content_hash
- reviewed_title
- reviewed_description
- reviewed_category
- reviewed_tags
- attribution
- license_status
- preview_type
- preview_url
- status
- imported_prompt_id (if created)
- review_notes

These fields are stored in a version-controlled manifest and reviewed by an admin before any database write.

## Import pipeline

1. Review a source file and generate a normalized record.
2. Validate required fields and disallow duplicate content hashes.
3. Check manifest approval status before run-time import.
4. Run a dry-run summary showing valid, duplicate, invalid, and rejected counts.
5. Require explicit approval before creating draft prompts or media records.
6. Collect import logs and source provenance for every approved run.

## Security and data handling

- All writes remain server-side through the existing Supabase admin client.
- No service role key is committed or exposed in browser code.
- Media is only imported when the source is explicitly authorized and the MIME type is validated.
- Do not rehost third-party video or HLS streams without permission.
- Display a placeholder for missing preview media instead of inventing a URL.

## Integration with existing app

The existing PROMPT/DEPT. galleries, prompt-card components, prompt detail pages, and builder routes can consume source-approved records without altering the user-facing design system.

The import layer must remain additive: it should power a draft review workflow, not replace the existing prompt library or public site behavior.
