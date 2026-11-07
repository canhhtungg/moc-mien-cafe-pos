import { NextRequest, NextResponse } from "next/server";
import { CafeService } from "@/server/services/CafeService";
import { handleApiError, requireRequestRole } from "@/server/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    requireRequestRole(req, ["Barista", "Manager"], "Xem trạng thái quầy pha chế & nguyên liệu");
    const svc = new CafeService();
    const [boot, ingredients] = await Promise.all([
      svc.getBootstrap(),
      svc.listIngredients(),
    ]);
    return NextResponse.json({ menu: boot.menu, ingredients });
  } catch (err) {
    return handleApiError(err, "Không thể tải nguyên liệu quầy pha chế.");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    requireRequestRole(req, ["Barista", "Manager"], "Báo hết món / cập nhật nguyên liệu quầy bar");
    const body = await req.json();
    const svc = new CafeService();

    if (body.type === "toggle-menu") {
      await svc.toggleMenuAvailability(String(body.menuItemId), Boolean(body.isAvailable));
      const boot = await svc.getBootstrap();
      return NextResponse.json({ menu: boot.menu });
    }

    if (body.type === "ingredient-delta") {
      const ingredients = await svc.updateIngredientStock(
        String(body.ingredientId),
        Number(body.delta ?? 0)
      );
      return NextResponse.json({ ingredients });
    }

    return NextResponse.json({ error: "Thao tác không hợp lệ." }, { status: 400 });
  } catch (err) {
    return handleApiError(err, "Lỗi cập nhật quầy pha chế.");
  }
}
