# Security and Privacy Requirements

This is an engineering checklist, not a substitute for a formal security review or legal advice.

## Authentication and authorization

- Use a maintained authentication approach and secure session handling.
- Authorize every private resource at the server boundary.
- Verify resource ownership for sessions, documents, saved prompts and collections.
- Apply least privilege to admin features and storage credentials.
- Protect state-changing routes against the relevant CSRF/session risks for the chosen auth design.

## Secrets and configuration

- Never commit `.env`, API keys, cookies, private URLs, access tokens or real user files.
- Keep model, speech, email and storage credentials on the server.
- Maintain `.env.example` with names and blank/example values only.
- Rotate secrets if they are accidentally exposed; removing a secret from the latest commit is not sufficient if it was published.

## AI-specific safety

- Treat user text, transcripts, retrieved prompt-library content and uploaded document text as untrusted data.
- Separate system/developer instructions from source content.
- Do not interpret instructions inside a document as authorization to use tools or disclose private data.
- Validate model-generated JSON with strict schemas and handle malformed responses.
- Use a documented output moderation policy where public submissions or sensitive tasks are supported.
- Do not promise that model outputs are factual or guaranteed to receive an exam mark.

## File-upload security

- Allowlist file types and verify file signatures; do not trust filename extension alone.
- Enforce byte size, page count, extraction duration, quotas and concurrent jobs.
- Sanitize display names and never use user filenames as filesystem/storage paths.
- Store uploads privately; use short-lived, scoped signed URLs where applicable.
- Consider antivirus/malware scanning before parser or OCR processing.
- Prevent storage-key guessing and path traversal.
- Apply timeouts and parser isolation for risky formats where practical.
- Ensure deletion removes the active object and permitted extracted derivatives; record failures for retry.

## Privacy and retention

- Explain whether audio is transcribed locally or sent to a provider.
- Do not save raw recordings by default.
- Disclose how transcripts, generated answers and documents are stored and used.
- Minimize prompt/provider logs and avoid raw content in normal application logs.
- Define retention for guest sessions and authenticated history.
- Give users a way to delete retained content and their account, with clear limitations for backups/logs.
- Send only the necessary source text to AI providers and review each provider's data handling settings/terms.

## Abuse and cost controls

- Rate-limit sign-up, search if necessary, transcription, AI calls, upload and OCR.
- Enforce guest and authenticated usage quotas on the server.
- Bound input size, output size, token usage, timeout and retry count.
- Track provider usage/cost without recording secrets or unnecessary content.
- Protect public prompt submission and ratings against spam and abuse.

## Minimum release gate

Do not release private uploads or authenticated workspace features until ownership checks, provider-secret handling, input validation, deletion behavior and permission tests pass.
