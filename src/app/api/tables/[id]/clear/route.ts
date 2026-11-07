import { NextRequest, NextResponse } from "next/server";
import { CafeService } from "@/server/services/CafeService";
import { handleApiError, requireRequestRole } from "@/server/api-helpers";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    requireRequestRole(req, ["Cashier", "Manager"], "Dọn bàn trống đón khách mới");
    const { id } = await context.params;
    const svc = new CafeService();
    await svc.clearTable(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "Không thể cập nhật trạng thái bàn.");
  }
}
