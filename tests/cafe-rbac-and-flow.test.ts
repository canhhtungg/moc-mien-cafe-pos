import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { resetCafeDatabaseToSeed } from "@/server/db/client";
import { CafeService } from "@/server/services/CafeService";
import { VietQRService } from "@/server/services/VietQRService";
import { canRoleAccessPath } from "@/lib/rbac";
import { formatThousandDigits, parseThousandDigits } from "@/lib/format";
import { GET as getRevenueRoute } from "@/app/api/manager/revenue/route";
import { POST as postMenuRoute } from "@/app/api/manager/menu/route";
import { GET as getBarStockRoute } from "@/app/api/bar-stock/route";

describe("Mộc Miên Café — Nghiệp vụ cốt lõi & Phân quyền chặt theo vai trò (RBAC)", () => {
  beforeEach(async () => {
    await resetCafeDatabaseToSeed();
  });

  it("khởi tạo đầy đủ 3 vai trò nhân sự, thực đơn, 12 bàn và đơn hàng mẫu", async () => {
    const svc = new CafeService();
    const boot = await svc.getBootstrap();
    expect(boot.staff).toHaveLength(3);
    expect(boot.tables).toHaveLength(12);
    expect(boot.menu.length).toBeGreaterThanOrEqual(12);
  });

  it("chặn tuyệt đối Thu ngân và Pha chế xem API Doanh thu hoặc sửa Thực đơn (HTTP 403)", async () => {
    const cashierReq = new NextRequest("http://localhost/api/manager/revenue", {
      headers: { "x-staff-role": "Cashier" },
    });
    const baristaReq = new NextRequest("http://localhost/api/manager/revenue", {
      headers: { "x-staff-role": "Barista" },
    });
    const managerReq = new NextRequest("http://localhost/api/manager/revenue", {
      headers: { "x-staff-role": "Manager" },
    });

    const resCashier = await getRevenueRoute(cashierReq);
    const resBarista = await getRevenueRoute(baristaReq);
    const resManager = await getRevenueRoute(managerReq);

    expect(resCashier.status).toBe(403);
    expect(resBarista.status).toBe(403);
    expect(resManager.status).toBe(200);

    const data = await resManager.json();
    expect(data.totalRevenue).toBeGreaterThan(0);

    // Thu ngân cũng không được vào API kho quầy pha chế hoặc sửa menu
    const cashierBarReq = new NextRequest("http://localhost/api/bar-stock", {
      headers: { "x-staff-role": "Cashier" },
    });
    expect((await getBarStockRoute(cashierBarReq)).status).toBe(403);

    const baristaEditMenuReq = new NextRequest("http://localhost/api/manager/menu", {
      method: "POST",
      headers: { "x-staff-role": "Barista", "content-type": "application/json" },
      body: JSON.stringify({ name: "Món lậu", category: "CaPhe", basePrice: 10000 }),
    });
    expect((await postMenuRoute(baristaEditMenuReq)).status).toBe(403);
  });

  it("kiểm tra phân quyền đường dẫn giao diện (canRoleAccessPath) đúng từng đối tượng", () => {
    expect(canRoleAccessPath("Cashier", "/order")).toBe(true);
    expect(canRoleAccessPath("Cashier", "/tables")).toBe(true);
    expect(canRoleAccessPath("Cashier", "/barista")).toBe(false);
    expect(canRoleAccessPath("Cashier", "/manager/revenue")).toBe(false);

    expect(canRoleAccessPath("Barista", "/barista")).toBe(true);
    expect(canRoleAccessPath("Barista", "/bar-stock")).toBe(true);
    expect(canRoleAccessPath("Barista", "/order")).toBe(false);
    expect(canRoleAccessPath("Barista", "/manager/revenue")).toBe(false);

    expect(canRoleAccessPath("Manager", "/manager/revenue")).toBe(true);
    expect(canRoleAccessPath("Manager", "/manager/menu")).toBe(true);
    expect(canRoleAccessPath("Manager", "/manager/settings")).toBe(true);
  });

  it("xử lý trọn vẹn luồng Gọi món tại bàn -> Tích điểm -> Pha chế -> Dọn bàn", async () => {
    const svc = new CafeService();

    // Khách quen Hoàng Nam (đang có 8 ly tích lũy) gọi thêm 2 ly Bạc Xỉu size M -> đủ 10 ly được tặng 1 phiếu 30k!
    const created = await svc.createOrder({
      orderType: "TaiBan",
      tableId: "B01",
      staffId: "NV-CASHIER",
      staffName: "Lan Anh",
      customerPhone: "0987654321",
      customerName: "Hoàng Nam",
      paymentMethod: "TienMat",
      cashReceived: 100000,
      items: [
        {
          menuItemId: "CF-BACXIU",
          quantity: 2,
          cupSize: "M", // 35,000 + 6,000 = 41,000 * 2 = 82,000
          sugarLevel: "70",
          iceLevel: "ItDa",
          toppingIds: [],
          itemNote: "Ít ngọt dễ uống",
        },
      ],
    });

    expect(created.totalAmount).toBe(82000);
    expect(created.changeAmount).toBe(18000);
    expect(created.prepStatus).toBe("ChoPha");

    // Khách Hoàng Nam từ 8 ly + 2 ly = 10 ly -> đổi thành 1 voucher giảm 30k và số dư ly về 0
    const updatedCustomer = await svc.lookupCustomer("0987654321");
    expect(updatedCustomer?.freeDrinkVouchers).toBe(1);
    expect(updatedCustomer?.cupsAccumulated).toBe(0);

    // Pha chế nhận đơn -> Đang pha -> Pha xong
    const brewing = await svc.updatePrepStatus(created.id, "DangPha");
    expect(brewing.prepStatus).toBe("DangPha");
    const ready = await svc.updatePrepStatus(created.id, "DaXong");
    expect(ready.prepStatus).toBe("DaXong");

    // Khách về -> Thu ngân bấm dọn Bàn 01
    await svc.clearTable("B01");
    const bootAfter = await svc.getBootstrap();
    const b01 = bootAfter.tables.find((t) => t.id === "B01");
    expect(b01?.status).toBe("Trong");

    // Đơn của Bàn 01 cũng tự động chuyển sang DaGiao và không còn nằm trong danh sách đơn đang thực hiện trong ca
    const activeOrdersAfterClear = await svc.listOrders(["ChoPha", "DangPha", "DaXong"]);
    expect(activeOrdersAfterClear.some((o) => o.id === created.id)).toBe(false);
  });

  it("sinh mã VietQR động đúng chuẩn EMVCo CRC16 chứa sẵn số tiền đơn cafe", async () => {
    const qrSvc = new VietQRService();
    const qr = await qrSvc.generateCafeQR({ amount: 75000, note: "Ban 05 thanh toan" });
    expect(qr.payload).toContain("540575000");
    expect(qr.payload).toMatch(/6304[0-9A-F]{4}$/);
    expect(qr.qrDataUrl.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("ưu tiên nguyên liệu sắp hết lên đầu danh sách, thêm nguyên liệu mới, tách 3 số giá bán và thống kê doanh thu Ngày/Tuần/Tháng", async () => {
    const svc = new CafeService();

    // 1. Nguyên liệu sắp hết luôn đứng đầu danh sách
    const ings = await svc.listIngredients();
    expect(ings.length).toBeGreaterThanOrEqual(6);
    expect(ings[0].currentStock).toBeLessThanOrEqual(ings[0].minStock);
    expect(ings[1].currentStock).toBeLessThanOrEqual(ings[1].minStock);

    // Thêm loại nguyên liệu mới có tồn kho thấp (1 < minStock 5) -> tự đẩy lên nhóm ưu tiên đầu
    const afterCreate = await svc.createIngredient({
      name: "Kem Béo Thực Vật Rich's",
      unit: "hộp 454g",
      currentStock: 1,
      minStock: 5,
    });
    expect(afterCreate.some((i) => i.name === "Kem Béo Thực Vật Rich's")).toBe(true);
    expect(afterCreate[0].name).toBe("Kem Béo Thực Vật Rich's");

    // 2. Định dạng tách 3 chữ số cho ô nhập giá bán
    expect(formatThousandDigits(35000)).toBe("35.000");
    expect(formatThousandDigits("125000")).toBe("125.000");
    expect(parseThousandDigits("35.000")).toBe(35000);

    // 3. Thống kê doanh thu theo Ngày / Tuần / Tháng
    const dayRep = await svc.getRevenueReport("day");
    const weekRep = await svc.getRevenueReport("week");
    const monthRep = await svc.getRevenueReport("month");

    expect(dayRep.breakdown).toHaveLength(4); // 4 ca trong ngày
    expect(weekRep.breakdown).toHaveLength(7); // 7 ngày trong tuần
    expect(monthRep.breakdown).toHaveLength(4); // 4 tuần trong tháng
    expect(weekRep.totalRevenue).toBeGreaterThan(dayRep.totalRevenue);
    expect(monthRep.totalRevenue).toBeGreaterThan(weekRep.totalRevenue);
  });
});
