# Talk to Prompt — Feature Specification

## Purpose

Let a person speak or type a request in ordinary language and receive a personalized reusable prompt, or optionally run the task directly on the platform.

## User journey

1. User opens Talk to Prompt.
2. Chooses voice or text. Voice starts only after clear user action and browser permission.
3. User speaks; the transcript is displayed and can be edited.
4. The server extracts a structured intent using a validated schema.
5. The system determines whether important information is missing.
6. If needed, it asks a short, contextual follow-up. Avoid repeating answered questions.
7. It displays an editable requirements summary.
8. User chooses reusable prompt or direct task (where the latter is configured).
9. The server generates the result, validates it, and returns it.
10. User can copy, edit, refine, save or create a new version.

## Example request

“I have an Operating Systems exam tomorrow. Explain my notes simply and create 5-mark answers with examples and diagrams where needed.”

Potential extracted fields (only fill fields supported by the actual request or confirmed context):

```json
{
  "goal": "exam_preparation",
  "subject": "Operating Systems",
  "audience": "college_student",
  "input_mode": "voice",
  "output_mode": "both",
  "difficulty": "beginner",
  "source_preference": "uploaded_notes",
  "answer_format": {
    "marks": 5,
    "language": "simple",
    "include_examples": true,
    "include_diagrams": "when_needed",
    "sections": ["definition", "explanation", "example"]
  },
  "needs_clarification": false
}
```

This is a sample. Do not invent subject, exam date, mark allocation or user context. Store dates in normalized form if the user confirms a relative date and timezone matters.

## Intent schema fields

Recommended fields:

- `goal`: enum such as `exam_preparation`, `explain_notes`, `office_task`, `image_generation`, `coding`, `content_creation`, `research`, `other`.
- `subjectOrTask`: user-provided topic/task string.
- `audience`: beginner, student, professional, expert, other.
- `difficulty`: simple, balanced, advanced.
- `outputMode`: `reusable_prompt` or `direct_task`.
- `outputFormat`: step-by-step, bullets, table, essay, code, image prompt, custom.
- `language`: desired answer/prompt language.
- `constraints`: length, tone, sources, exclusions, deadlines or other requirements.
- `answerFormat`: marks/custom length, desired sections, diagram/example settings.
- `sourceDocumentIds`: references to server-owned document records, not arbitrary paths or URLs.
- `missingFields`: a list of important missing requirements.
- `confidence` or `needsConfirmation`: optional internal decision support, not a false guarantee of certainty.

Use a strict runtime schema. Enumerations must reject unexpected values. Keep original user text separately if history is enabled and permitted by retention settings.

## Clarification policy

Ask a follow-up only if missing information would materially change the result or the action is ambiguous. Examples:

- Subject is missing from a request to create a subject-specific exam prompt.
- User asks “explain my notes” but has not supplied notes or pasted content.
- It is unclear whether the user wants a reusable prompt or the task performed directly.

Do not ask questions whose answers can safely be optional. Offer defaults such as “Use a balanced explanation” and let users edit them.

## Transcript handling

- Feature-detect browser speech recognition.
- Show microphone permission and active recording states.
- Do not begin recording until the user explicitly clicks/taps the control.
- Keep a text-entry alternative.
- Support correction before server-side intent extraction.
- Do not persist raw audio by default.
- If server transcription is added, disclose processing, use secure transport and handle service errors.
- Do not imply every browser supports the same speech features.

## Output requirements

Reusable prompt output should contain a role only when helpful, context, precise task, constraints, output format, quality checks, and placeholders for missing/user-supplied content. Avoid padding or formulaic sections that do not help the task.

Direct-task output should display the actual generated answer and any limitations. It should not merely show a reusable prompt unless the user chose that mode.

## Example: exam answer preferences

Allow controls for:

- Subject/topic.
- Answer mark value: 2, 5, 10 or custom.
- Explanation level: simple, formal exam language, technical.
- Sections: definition, explanation, diagram, example, advantages/disadvantages, conclusion.
- Diagram policy: when useful, whenever possible, or text only.
- Source policy: uploaded notes only, notes plus supplementary explanation, or general knowledge.

Do not imply mark value determines an exact universal word count. The prompt should say to match the expected scope and avoid inventing syllabus or marking schemes.

## Error states

Handle denied microphone permission, unsupported speech recognition, no speech detected, network failure, malformed model response, missing provider configuration, rate limits and cancellation. In every case keep the transcript/text available where possible and explain what the user can do next.
