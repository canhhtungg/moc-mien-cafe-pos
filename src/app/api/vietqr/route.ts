import { NextRequest, NextResponse } from "next/server";
import { VietQRService } from "@/server/services/VietQRService";
import { handleApiError, requireRequestRole } from "@/server/api-helpers";

export async function POST(req: NextRequest) {
  try {
    requireRequestRole(req, ["Cashier", "Manager"], "Tạo mã thanh toán VietQR");
    const body = await req.json();
    const qrSvc = new VietQRService();
    const qr = await qrSvc.generateCafeQR({
      amount: Number(body.amount ?? 0),
      note: String(body.note ?? "MOCMIEN"),
      overrideBin: body.overrideBin ? String(body.overrideBin) : undefined,
      overrideAccountNo: body.overrideAccountNo ? String(body.overrideAccountNo) : undefined,
      overrideAccountName: body.overrideAccountName ? String(body.overrideAccountName) : undefined,
      overrideBankShortName: body.overrideBankShortName ? String(body.overrideBankShortName) : undefined,
    });
    return NextResponse.json(qr);
  } catch (err) {
    return handleApiError(err, "Lỗi tạo mã VietQR.");
  }
}
