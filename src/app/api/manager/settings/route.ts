import { NextRequest, NextResponse } from "next/server";
import { resetCafeDatabaseToSeed } from "@/server/db/client";
import { CafeService } from "@/server/services/CafeService";
import { VIETNAMESE_BANKS } from "@/server/services/VietQRService";
import { handleApiError, requireRequestRole } from "@/server/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    requireRequestRole(req, ["Manager"], "Xem cài đặt quán & tài khoản ngân hàng");
    const svc = new CafeService();
    const settings = await svc.getFullSettings();
    return NextResponse.json({ settings, banks: VIETNAMESE_BANKS });
  } catch (err) {
    return handleApiError(err, "Không thể tải cài đặt quán.");
  }
}

export async function PUT(req: NextRequest) {
  try {
    requireRequestRole(req, ["Manager"], "Cập nhật thông tin quán & tài khoản VietQR");
    const body = await req.json();
    const svc = new CafeService();
    const settings = await svc.updateFullSettings({
      shopName: String(body.shopName ?? "Mộc Miên Café"),
      address: String(body.address ?? ""),
      wifiName: String(body.wifiName ?? ""),
      wifiPassword: String(body.wifiPassword ?? ""),
      receiptFooter: String(body.receiptFooter ?? ""),
      bankBin: String(body.bankBin ?? "970422"),
      bankShortName: String(body.bankShortName ?? "MB Bank"),
      bankAccountNo: String(body.bankAccountNo ?? ""),
      bankAccountName: String(body.bankAccountName ?? "MOC MIEN CAFE"),
    });
    return NextResponse.json({ settings });
  } catch (err) {
    return handleApiError(err, "Không thể lưu cài đặt quán.");
  }
}

export async function POST(req: NextRequest) {
  try {
    requireRequestRole(req, ["Manager"], "Khôi phục dữ liệu mẫu ban đầu");
    await resetCafeDatabaseToSeed();
    return NextResponse.json({
      ok: true,
      message: "Đã khôi phục toàn bộ thực đơn, bàn và đơn mẫu ban đầu!",
    });
  } catch (err) {
    return handleApiError(err, "Không thể khôi phục dữ liệu mẫu.");
  }
}
