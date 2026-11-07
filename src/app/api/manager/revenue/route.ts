import { NextRequest, NextResponse } from "next/server";
import { CafeService } from "@/server/services/CafeService";
import { handleApiError, requireRequestRole } from "@/server/api-helpers";
import type { RevenuePeriod } from "@/types/cafe";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    requireRequestRole(req, ["Manager"], "Xem báo cáo doanh thu quán");
    const rawPeriod = req.nextUrl.searchParams.get("period") ?? "day";
    const period: RevenuePeriod =
      rawPeriod === "week" || rawPeriod === "month" ? rawPeriod : "day";

    const svc = new CafeService();
    const report = await svc.getRevenueReport(period);
    return NextResponse.json(report, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (err) {
    return handleApiError(err, "Không thể tải báo cáo doanh thu.");
  }
}
