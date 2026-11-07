import { NextRequest, NextResponse } from "next/server";
import { CafeService } from "@/server/services/CafeService";
import { handleApiError, requireRequestRole } from "@/server/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    requireRequestRole(req, ["Cashier", "Manager"], "Tra cứu tích điểm khách hàng");
    const phone = req.nextUrl.searchParams.get("phone") ?? "";
    const svc = new CafeService();
    const customer = await svc.lookupCustomer(phone);
    return NextResponse.json({ customer });
  } catch (err) {
    return handleApiError(err, "Lỗi tra cứu khách thân thiết.");
  }
}
