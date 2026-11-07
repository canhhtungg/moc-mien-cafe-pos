import { NextRequest, NextResponse } from "next/server";
import { CafeService } from "@/server/services/CafeService";
import { handleApiError, requireRequestRole } from "@/server/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    requireRequestRole(req, ["Cashier", "Barista", "Manager"], "Xem danh sách phiếu gọi món trong ca");
    const mode = req.nextUrl.searchParams.get("mode") ?? "active";
    const svc = new CafeService();

    if (mode === "barista") {
      const orders = await svc.listOrders(["ChoPha", "DangPha"], 50);
      return NextResponse.json(
        { orders },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          },
        }
      );
    }

    const orders = await svc.listOrders(["ChoPha", "DangPha", "DaXong"], 50);
    return NextResponse.json(
      { orders },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err) {
    return handleApiError(err, "Không thể tải danh sách đơn trong ca.");
  }
}

export async function POST(req: NextRequest) {
  try {
    requireRequestRole(req, ["Cashier", "Manager"], "Tạo đơn gọi món & thanh toán");
    const body = await req.json();
    const svc = new CafeService();
    const order = await svc.createOrder(body);
    return NextResponse.json({ order });
  } catch (err) {
    return handleApiError(err, "Không thể lưu đơn gọi món.");
  }
}
