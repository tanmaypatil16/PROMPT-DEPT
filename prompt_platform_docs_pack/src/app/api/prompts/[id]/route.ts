import { NextResponse } from "next/server";
import { findPrompt } from "@/data/prompts";
import { getPublishedPromptBySlug } from "@/lib/prompts/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (isSupabaseConfigured()) {
    const { user } = await getSessionUser();
    const db = await getPublishedPromptBySlug(id, user?.id ?? null);
    if (db) {
      return NextResponse.json({ prompt: db.prompt, source: db.source, promptDbId: db.dbId });
    }
  }

  const prompt = findPrompt(id);
  return prompt
    ? NextResponse.json({ prompt, source: "local-sample-data" })
    : NextResponse.json({ error: "Prompt not found." }, { status: 404 });
}
