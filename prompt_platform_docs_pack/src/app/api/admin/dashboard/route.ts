import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { fetchDashboardMetrics, type DateRangeDays } from "@/lib/admin/metrics";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const daysParam = Number(request.nextUrl.searchParams.get("days") ?? "30");
  const days = ([7, 30, 90] as const).includes(daysParam as DateRangeDays) ? (daysParam as DateRangeDays) : 30;
  try {
    const metrics = await fetchDashboardMetrics(days);
    if (!metrics) {
      return NextResponse.json({
        configured: false,
        message: "Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).",
      }, { status: 503 });
    }
    return NextResponse.json({ configured: true, metrics });
  } catch (error) {
    console.error("Failed to load admin dashboard metrics", error);
    return NextResponse.json({
      error: "Dashboard metrics could not be loaded. Check the server logs for the failed Supabase query.",
    }, { status: 500 });
  }
}
