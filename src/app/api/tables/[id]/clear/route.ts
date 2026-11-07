import { NextRequest, NextResponse } from "next/server";
import { CafeService } from "@/server/services/CafeService";
import { handleApiError, requireRequestRole } from "@/server/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    requireRequestRole(req, ["Cashier", "Manager"], "Dọn bàn trống đón khách mới");
    const { id } = await context.params;
    const svc = new CafeService();
    await svc.clearTable(id);
    const [tables, activeOrders] = await Promise.all([
      svc.listTables(),
      svc.listOrders(["ChoPha", "DangPha", "DaXong"], 50),
    ]);
    return NextResponse.json({ ok: true, tables, activeOrders });
  } catch (err) {
    return handleApiError(err, "Không thể cập nhật trạng thái bàn.");
  }
}
