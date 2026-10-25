# Deployment and Environments

## Environments

Keep development, preview/staging, and production configuration separate. Use a disposable or separate development database for local work and migrations.

## Deployment sequence

1. Confirm the repository's build/runtime expectations and deployment provider.
2. Provision a managed PostgreSQL database and configure backups.
3. Provision private object storage if uploads are enabled.
4. Create secrets in the hosting provider's secret manager/dashboard, not in source code.
5. Apply reviewed database migrations using a documented process.
6. Deploy to preview/staging and run smoke tests.
7. Verify public browsing, auth, protected routes, provider errors, uploads/deletion (if enabled) and logs.
8. Promote to production only after release checklist passes.

## Environment variables

Names depend on selected providers. Keep `.env.example` synchronized with actual code. Potential examples include:

- `DATABASE_URL`
- `AUTH_SECRET` or the chosen authentication provider's required settings
- `AI_PROVIDER_API_KEY` and optional model/base URL configuration
- transcription provider credentials, if used
- object-storage bucket, endpoint, access key/secret and region, if used
- email provider settings, if required
- application base URL

Use placeholders only. Avoid duplicating secret values across files, issue comments, logs and screenshots.

## Database migrations

- Commit migration files.
- Never casually reset production databases.
- Review destructive changes and back up production before migration.
- Test migrations against a fresh database and a representative previous schema.
- Seed only safe demo content; never seed real users' private content into production.

## Monitoring

Track errors, request latency, provider failures and AI/transcription usage. Redact sensitive content. Add alerts for elevated error rates and unusual usage/cost.

## Rollback

Document how to revert application deployments. Database rollback may not be safe for every migration; prefer backward-compatible expand/contract migrations for risky changes. Have a backup/restore process verified before production use.
