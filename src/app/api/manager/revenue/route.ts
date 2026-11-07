import { NextRequest, NextResponse } from "next/server";
import { CafeService } from "@/server/services/CafeService";
import { handleApiError, requireRequestRole } from "@/server/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    requireRequestRole(req, ["Manager"], "Xem báo cáo doanh thu quán");
    const svc = new CafeService();
    const report = await svc.getRevenueReport();
    return NextResponse.json(report);
  } catch (err) {
    return handleApiError(err, "Không thể tải báo cáo doanh thu.");
  }
}
