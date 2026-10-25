import { NextResponse } from "next/server";
import { findPrompt } from "@/data/prompts";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const prompt = findPrompt(id);
  return prompt ? NextResponse.json({ prompt, source: "local-sample-data" }) : NextResponse.json({ error: "Prompt not found." }, { status: 404 });
}
