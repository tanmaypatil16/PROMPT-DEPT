import { NextResponse } from "next/server";

type StudioRequest = { idea?: unknown; category?: unknown; format?: unknown };

export async function POST(request: Request) {
  let body: StudioRequest;
  try { body = await request.json() as StudioRequest; } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const idea = typeof body.idea === "string" ? body.idea.trim() : "";
  const category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : "creative project";
  const format = typeof body.format === "string" && body.format.trim() ? body.format.trim() : "detailed creative brief";
  if (idea.length < 8) return NextResponse.json({ error: "Tell us a little more about what you want to make (at least 8 characters)." }, { status: 400 });
  if (idea.length > 1200) return NextResponse.json({ error: "Keep your idea under 1,200 characters for this prototype." }, { status: 400 });
  if (category.length > 80) return NextResponse.json({ error: "Choose a category under 80 characters." }, { status: 400 });
  if (format.length > 100) return NextResponse.json({ error: "Choose an output type under 100 characters." }, { status: 400 });
  const prompt = `Act as a thoughtful ${category} collaborator. Develop this idea: ${idea}\n\nCreate a ${format}. Start by clarifying the intention and audience, then provide a useful structure, concrete details, and one strong example. Keep the tone practical and specific. Include relevant constraints and accessibility considerations where appropriate. Ask no more than one follow-up question if a critical detail is missing.`;
  return NextResponse.json({ prompt, mode: "template", notice: "Generated with the local deterministic Prompt Studio template; no external AI provider was called." });
}
