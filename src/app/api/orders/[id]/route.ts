import { NextRequest, NextResponse } from "next/server";
import { CafeService } from "@/server/services/CafeService";
import { handleApiError, requireRequestRole } from "@/server/api-helpers";
import type { PrepStatus } from "@/types/cafe";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const action = String(body.action ?? "status");
    const svc = new CafeService();

    if (action === "cancel") {
      requireRequestRole(req, ["Manager"], "Hủy đơn hàng đã thanh toán");
      const order = await svc.cancelOrder(id, String(body.reason ?? "Khách đổi ý"));
      const [activeOrders, tables] = await Promise.all([
        svc.listOrders(["ChoPha", "DangPha", "DaXong"], 50),
        svc.listTables(),
      ]);
      return NextResponse.json({ order, activeOrders, tables });
    }

    const nextStatus = String(body.prepStatus ?? "") as PrepStatus;
    if (nextStatus === "DangPha" || nextStatus === "DaXong") {
      requireRequestRole(req, ["Barista", "Manager"], "Cập nhật tiến độ pha chế");
    } else {
      requireRequestRole(req, ["Cashier", "Barista", "Manager"], "Xác nhận giao nước cho khách");
    }

    const order = await svc.updatePrepStatus(id, nextStatus);
    const [activeOrders, baristaOrders, tables] = await Promise.all([
      svc.listOrders(["ChoPha", "DangPha", "DaXong"], 50),
      svc.listOrders(["ChoPha", "DangPha"], 50),
      svc.listTables(),
    ]);
    return NextResponse.json({ order, activeOrders, baristaOrders, tables });
  } catch (err) {
    return handleApiError(err, "Không thể cập nhật trạng thái đơn.");
  }
}
