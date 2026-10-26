import { NextRequest, NextResponse } from "next/server";
import { promptSamples } from "@/data/prompts";
import { listPublishedPrompts } from "@/lib/prompts/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const category = request.nextUrl.searchParams.get("category")?.trim() ?? "";

  if (isSupabaseConfigured()) {
    const { user } = await getSessionUser();
    const db = await listPublishedPrompts({
      query,
      category,
      userId: user?.id ?? null,
    });
    if (db) {
      return NextResponse.json({ prompts: db.prompts, source: db.source });
    }
  }

  const prompts = promptSamples.filter((prompt) => {
    const content = [prompt.title, prompt.category, prompt.description, ...prompt.tags].join(" ").toLowerCase();
    return (!query || content.includes(query.toLowerCase()))
      && (!category || category.toLowerCase() === "all" || prompt.category.toLowerCase() === category.toLowerCase());
  });
  return NextResponse.json({ prompts, source: "local-sample-data" });
}
