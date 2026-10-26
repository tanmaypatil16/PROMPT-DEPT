import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const { data, error } = await db.from("categories").select("id, name, slug, is_active, display_order").order("display_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data });
}
