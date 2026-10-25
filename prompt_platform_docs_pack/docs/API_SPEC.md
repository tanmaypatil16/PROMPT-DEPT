# API Specification (Proposed)

All endpoints below are proposed conventions, not proof that implementations already exist. Use the repository's current routing conventions if already established. Validate input/output schemas and standardize errors.

## Response conventions

- Return the correct HTTP status code.
- Use a stable error envelope, e.g. `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "requestId": "..." } }`.
- Do not expose stack traces, provider keys, private object keys or internal prompts to clients.
- Use request IDs and idempotency keys where retries could duplicate expensive work.
- Authenticate and authorize each protected endpoint server-side.

## Catalog

| Method | Path | Description | Access |
|---|---|---|---|
| GET | `/api/prompts` | Search/filter public prompts | Public |
| GET | `/api/prompts/[slug]` | Fetch public prompt | Public, unless private owner route is deliberately supported |
| POST | `/api/prompts` | Create personal prompt/draft | Authenticated |
| PATCH | `/api/prompts/[id]` | Update owned prompt | Owner/admin |
| DELETE | `/api/prompts/[id]` | Delete owned prompt | Owner/admin |
| POST | `/api/prompts/[id]/improve` | Improve prompt | Authenticated/limited guest policy |

## Talk to Prompt

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/api/talk/sessions` | Create temporary or authenticated session | Public with limits or authenticated, by policy |
| PATCH | `/api/talk/sessions/[id]/transcript` | Save corrected transcript where retention allows | Session owner |
| POST | `/api/talk/sessions/[id]/intent` | Extract structured intent | Session owner |
| POST | `/api/talk/sessions/[id]/clarify` | Submit answers to clarification questions | Session owner |
| POST | `/api/talk/sessions/[id]/generate-prompt` | Generate reusable prompt | Session owner |
| POST | `/api/talk/sessions/[id]/run-task` | Execute direct AI task | Session owner, quota permitting |
| GET | `/api/talk/sessions/[id]` | Fetch permitted session state | Session owner |
| DELETE | `/api/talk/sessions/[id]` | Delete session and related retained data | Session owner |

## Documents

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/api/documents/upload-init` | Validate upload request and return controlled upload target or accept upload | Authenticated/limited guest policy |
| GET | `/api/documents/[id]` | Read metadata and processing status | Owner only |
| POST | `/api/documents/[id]/process` | Start/retry extraction if supported | Owner, quota permitting |
| DELETE | `/api/documents/[id]` | Delete file and retained derived data | Owner only |

The upload protocol must be chosen based on storage provider. If signed uploads are used, sign only the intended object/key, limit expiration and content constraints where available, and verify upload completion on the server.

## Workspace

| Method | Path | Description | Access |
|---|---|---|---|
| GET, POST | `/api/me/favorites` | List/add favorites | Authenticated |
| DELETE | `/api/me/favorites/[promptId]` | Remove favorite | Authenticated |
| GET, POST | `/api/me/collections` | List/create collections | Authenticated |
| PATCH, DELETE | `/api/me/collections/[id]` | Update/delete owned collection | Owner only |
| GET | `/api/me/sessions` | List permitted history | Authenticated |

## Community and administration

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/api/community/submissions` | Submit prompt for review | Authenticated |
| POST | `/api/community/reports` | Report prompt/content | Authenticated or moderated public route by policy |
| GET | `/api/admin/prompts` | Review/curate prompts | Admin only |
| PATCH | `/api/admin/prompts/[id]` | Approve/reject/edit prompt | Admin only |

## Example prompt-generation request

```json
{
  "intent": {
    "goal": "exam_preparation",
    "subjectOrTask": "DBMS normalization",
    "audience": "college_student",
    "difficulty": "simple",
    "answerFormat": {
      "marks": 5,
      "language": "simple",
      "includeExamples": true,
      "includeDiagrams": "when_needed",
      "sections": ["definition", "explanation", "example"]
    },
    "sourcePreference": "notes_plus_explanation"
  },
  "outputMode": "reusable_prompt",
  "sourceDocumentIds": []
}
```

The server must validate that each supplied document ID belongs to the current user and is ready to use. Do not accept client-supplied storage keys or trust a client-provided `userId`.

## Example response

```json
{
  "resultType": "reusable_prompt",
  "content": "Act as an experienced DBMS tutor...",
  "status": "completed",
  "requestId": "generated-request-id"
}
```

## Rate limiting and idempotency

Apply limits to AI generation, transcription, upload and OCR routes. Use idempotency keys or equivalent request tracking when a retry might create duplicate charges or duplicated results. Do not automatically retry a non-idempotent expensive operation without a clear policy.
