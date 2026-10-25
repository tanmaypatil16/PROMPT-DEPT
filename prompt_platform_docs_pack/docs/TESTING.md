# Testing Strategy and Release Checklist

## Test layers

### Unit tests
- Intent and API schemas accept valid inputs and reject invalid enums/shapes.
- Prompt composer includes selected output requirements and correct placeholders.
- Clarification logic does not ask again for already answered fields.
- File-state transitions and retention/permission helpers behave correctly.
- Model response parser handles malformed JSON, empty output and oversized output.

### Integration tests
- API routes enforce authentication and ownership.
- AI/speech/storage adapters handle success, provider errors, timeout and rate limits.
- Document upload, extraction, failure state and deletion are coherent.
- Database constraints prevent duplicate favorites and invalid relationships.
- Usage limits are enforced server-side.

### End-to-end tests
- Guest discovers a prompt and copies it.
- User types a request, edits requirements, generates a prompt and copies it.
- User speaks in a supported browser and can correct transcript; unsupported/denied permission falls back to text.
- User generates an exam prompt with 5-mark/simple-language/diagram preferences.
- User uploads a supported file and sees correct processing state.
- User can choose reusable prompt vs direct notes explanation.
- User cannot access another account's documents or sessions.
- User can save and delete a favorite/collection/session according to implemented scope.

## Critical edge cases

- Empty input, huge input, invalid field values, unsupported browser, denied microphone permission, no speech detected, poor transcript, duplicate requests, AI provider missing, provider timeout, malformed output, quota exceeded, unsupported file, renamed malicious file, scanned PDF, OCR failure, deletion during processing, expired session, and cross-user resource ID substitution.

## Suggested local commands

Use actual scripts from the repository's `package.json`. Common commands might include:

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Do not add scripts that do not exist without updating `package.json` appropriately. Report skipped commands and reasons accurately.

## Release gate

- [ ] All current-phase acceptance criteria pass.
- [ ] Lint/type-check/build/test commands recorded with actual results.
- [ ] No secrets or user data are committed.
- [ ] Authorization and ownership integration tests pass.
- [ ] Loading, empty, failure and success UI states work.
- [ ] Keyboard/accessibility smoke test completed.
- [ ] Migration reviewed and tested on non-production database.
- [ ] Environment variables documented without secret values.
- [ ] `docs/PROGRESS.md`, `docs/CHANGELOG.md` and relevant specifications updated.
