import { NextRequest, NextResponse } from "next/server";
import { promptSamples } from "@/data/prompts";

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const category = request.nextUrl.searchParams.get("category")?.trim().toLowerCase() ?? "";
  const prompts = promptSamples.filter((prompt) => {
    const content = [prompt.title, prompt.category, prompt.description, ...prompt.tags].join(" ").toLowerCase();
    return (!query || content.includes(query)) && (!category || category === "all" || prompt.category.toLowerCase() === category);
  });
  return NextResponse.json({ prompts, source: "local-sample-data" });
}
