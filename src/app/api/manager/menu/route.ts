import { NextRequest, NextResponse } from "next/server";
import { CafeService } from "@/server/services/CafeService";
import { handleApiError, requireRequestRole } from "@/server/api-helpers";
import type { CategoryId } from "@/types/cafe";

export async function POST(req: NextRequest) {
  try {
    requireRequestRole(req, ["Manager"], "Thêm hoặc chỉnh sửa giá thực đơn");
    const body = await req.json();
    const svc = new CafeService();
    await svc.upsertMenuItem({
      id: body.id ? String(body.id) : undefined,
      name: String(body.name ?? ""),
      category: String(body.category ?? "CaPhe") as CategoryId,
      description: String(body.description ?? ""),
      basePrice: Number(body.basePrice ?? 0),
      isAvailable: Boolean(body.isAvailable ?? true),
      isBestSeller: Boolean(body.isBestSeller ?? false),
      hasSizeOption: Boolean(body.hasSizeOption ?? true),
      hasTempOption: Boolean(body.hasTempOption ?? true),
    });
    const boot = await svc.getBootstrap();
    return NextResponse.json({ menu: boot.menu });
  } catch (err) {
    return handleApiError(err, "Không thể lưu món vào thực đơn.");
  }
}
