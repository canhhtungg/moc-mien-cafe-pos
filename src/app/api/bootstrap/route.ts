import { NextResponse } from "next/server";
import { CafeService } from "@/server/services/CafeService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const svc = new CafeService();
    const data = await svc.getBootstrap();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi khởi tạo dữ liệu quán." },
      { status: 500 }
    );
  }
}
