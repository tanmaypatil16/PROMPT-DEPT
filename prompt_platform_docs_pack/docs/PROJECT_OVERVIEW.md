# Project Overview

## Working title

**Prompt/Dept.** is a placeholder name. Brand/name selection is `TBD` and must not be hard-coded as final identity throughout the app.

## One-sentence vision

A beautifully curated prompt library and guided prompt studio that helps people turn everyday goals—spoken or typed—into useful, structured AI prompts, with optional direct task execution for workflows such as explaining notes and preparing exam answers.

## Problem

Many people know what they want AI to do but do not know how to formulate a strong prompt. Existing prompt collections can be hard to search, generic templates lack context, and voice-only input does not reliably capture output requirements unless the user can review and refine them.

## Target users

- Students preparing for tests and exams.
- Office workers working with Excel, reports, emails and presentations.
- Developers learning, debugging and building software.
- Designers and creators generating visual or written content.
- Teachers, researchers, marketers, entrepreneurs and job seekers.
- General users who have a task but do not know how to prompt an AI model.

## Core value proposition

**Say what you need. Shape the result. Get a prompt you can reuse—or complete the task here.**

## Product pillars

1. **Discover:** search and browse curated prompts by field, task, output type, audience, difficulty and compatible model.
2. **Create:** use a guided builder or Talk to Prompt to convert a natural-language request into structured requirements and a reusable prompt.
3. **Learn:** optionally upload notes and ask the platform to explain them directly, create exam-ready answers, build quizzes or flashcards.
4. **Organize:** save, edit, version and group prompts in a personal workspace.
5. **Share:** later, submit prompts and collections for community discovery, subject to moderation.

## Product distinction

These are two separate actions and should never be confused:

- **Generate a prompt:** output instructions that the user can copy into another AI tool or save in this platform.
- **Run the task:** use an integrated model to perform the request now, such as explaining uploaded notes. This requires a configured AI provider and may consume quota.

When a generated prompt depends on an uploaded file, include a clear placeholder/instruction to attach the file in the destination AI tool. The other AI tool cannot access a private file uploaded to this site automatically.

## MVP goals

- Make the core library discoverable and attractive.
- Allow typed and, where supported, spoken requests to feed one shared intent pipeline.
- Produce editable, structured prompts from user goals and preferences.
- Support student/exam-answer options and a secure first version of notes upload/direct explanation.
- Give users reliable copy, edit, save and history workflows.
- Establish trustworthy privacy, security, testing and documentation practices.

## Not MVP goals

Unless the user explicitly changes scope, defer payments, creator payouts, enterprise/team controls, autonomous agents that take external actions, a large microservice architecture, custom model training, full semantic search, and complex multi-agent workflows.

## Experience principles

- Voice is optional; text input must always be available.
- Do not make users answer questions when a safe, clear default will work.
- Show extracted requirements before expensive generation.
- Let users edit the generated prompt.
- Keep defaults understandable and make advanced options available without overwhelming beginners.
- Never imply guaranteed exam predictions or guaranteed AI output quality.
- Accessibility, privacy, performance and clear error messages are product features.

## Product success indicators

Track these only after instrumentation and privacy review:

- Search-to-prompt-open rate.
- Prompt copy/save rate.
- Prompt generation completion rate.
- How often users edit or regenerate generated prompts.
- Successful document extraction rate.
- Direct-task completion and user feedback.
- Repeat use of saved prompts.
- Error rate, latency and AI/transcription cost per successful task.

## Assumptions and open decisions

- Final brand and domain: `TBD`.
- Existing repository/codebase: inspect before implementation.
- AI provider/model: `TBD`, behind a provider adapter.
- Speech-to-text provider: browser API for initial supported browsers with text fallback; production transcription fallback provider `TBD`.
- Hosting and object storage provider: `TBD`.
- Authentication provider: choose based on existing repo and deployment requirements.
- Languages: begin with English UI; design voice/transcription interfaces to support additional languages later.
