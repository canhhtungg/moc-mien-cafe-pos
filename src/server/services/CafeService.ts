import { ensureCafeDbReady, getDbClient, persistCafeDbToBlob } from "@/server/db/client";
import { CUP_SIZE_OPTIONS } from "@/lib/format";
import type {
  CafeOrder,
  CafeOrderItem,
  CafeSettings,
  CafeTable,
  CategoryId,
  CupSize,
  IceLevel,
  Ingredient,
  LoyalCustomer,
  MenuItem,
  OrderType,
  PaymentMethod,
  PrepStatus,
  RevenueBreakdownBucket,
  RevenuePeriod,
  RevenueReportDTO,
  StaffMember,
  StaffRole,
  SugarLevel,
  ToppingOption,
} from "@/types/cafe";

export interface CreateCafeOrderInput {
  orderType: OrderType;
  tableId?: string | null;
  staffId: string;
  staffName: string;
  customerPhone?: string;
  customerName?: string;
  useFreeVoucher?: boolean;
  paymentMethod: PaymentMethod;
  cashReceived?: number | null;
  items: Array<{
    menuItemId: string;
    quantity: number;
    cupSize?: CupSize | null;
    sugarLevel?: SugarLevel | null;
    iceLevel?: IceLevel | null;
    toppingIds?: string[];
    itemNote?: string;
  }>;
}

export class CafeService {
  async getBootstrap() {
    await ensureCafeDbReady();
    const db = getDbClient();

    const [staffRes, menuRes, topRes, tableRes, setRes] = await Promise.all([
      db.execute("SELECT * FROM cafe_staff"),
      db.execute("SELECT * FROM cafe_menu ORDER BY is_best_seller DESC, category, name"),
      db.execute("SELECT * FROM cafe_toppings ORDER BY price ASC"),
      db.execute("SELECT * FROM cafe_tables ORDER BY id ASC"),
      db.execute("SELECT key, value FROM cafe_settings"),
    ]);

    const staff: StaffMember[] = staffRes.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      role: String(r.role) as StaffRole,
      shiftLabel: String(r.shift_label),
    }));

    const menu: MenuItem[] = menuRes.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      category: String(r.category) as CategoryId,
      description: String(r.description ?? ""),
      basePrice: Number(r.base_price),
      isAvailable: Number(r.is_available) === 1,
      isBestSeller: Number(r.is_best_seller) === 1,
      hasSizeOption: Number(r.has_size_option) === 1,
      hasTempOption: Number(r.has_temp_option) === 1,
    }));

    const toppings: ToppingOption[] = topRes.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      price: Number(r.price),
    }));

    const tables: CafeTable[] = tableRes.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      zone: String(r.zone),
      seats: Number(r.seats),
      status: String(r.status) as "Trong" | "CoKhach",
      activeOrderId: r.active_order_id ? String(r.active_order_id) : null,
    }));

    const map = new Map<string, string>();
    for (const r of setRes.rows) {
      map.set(String(r.key), String(r.value));
    }

    return {
      staff,
      menu,
      toppings,
      tables,
      shopInfo: {
        shopName: map.get("shopName") ?? "Mộc Miên Café",
        address: map.get("address") ?? "",
        wifiName: map.get("wifiName") ?? "",
        wifiPassword: map.get("wifiPassword") ?? "",
        receiptFooter: map.get("receiptFooter") ?? "",
      },
    };
  }

  async lookupCustomer(phone: string): Promise<LoyalCustomer | null> {
    await ensureCafeDbReady();
    const clean = phone.replace(/\D/g, "");
    if (!clean) return null;
    const db = getDbClient();
    const res = await db.execute({
      sql: "SELECT * FROM cafe_customers WHERE phone = ?",
      args: [clean],
    });
    const r = res.rows[0];
    if (!r) return null;
    return {
      phone: String(r.phone),
      name: String(r.name),
      cupsAccumulated: Number(r.cups_accumulated),
      freeDrinkVouchers: Number(r.free_drink_vouchers),
      totalSpent: Number(r.total_spent),
    };
  }

  async createOrder(input: CreateCafeOrderInput): Promise<CafeOrder> {
    await ensureCafeDbReady();
    if (!input.items || input.items.length === 0) {
      throw new Error("Chưa có món nào trong phiếu gọi món.");
    }

    const db = getDbClient();
    const [menuRes, topRes, countRes] = await Promise.all([
      db.execute("SELECT * FROM cafe_menu"),
      db.execute("SELECT * FROM cafe_toppings"),
      db.execute("SELECT COUNT(*) AS cnt FROM cafe_orders"),
    ]);

    const menuMap = new Map<string, MenuItem>();
    for (const r of menuRes.rows) {
      menuMap.set(String(r.id), {
        id: String(r.id),
        name: String(r.name),
        category: String(r.category) as CategoryId,
        description: String(r.description ?? ""),
        basePrice: Number(r.base_price),
        isAvailable: Number(r.is_available) === 1,
        isBestSeller: Number(r.is_best_seller) === 1,
        hasSizeOption: Number(r.has_size_option) === 1,
        hasTempOption: Number(r.has_temp_option) === 1,
      });
    }

    const topMap = new Map<string, ToppingOption>();
    for (const r of topRes.rows) {
      topMap.set(String(r.id), {
        id: String(r.id),
        name: String(r.name),
        price: Number(r.price),
      });
    }

    let tableName: string | null = null;
    const cleanTableId = input.orderType === "TaiBan" ? input.tableId?.trim() || null : null;
    if (input.orderType === "TaiBan") {
      if (!cleanTableId) {
        throw new Error("Vui lòng chọn số bàn cho khách ngồi tại quán.");
      }
      const tRes = await db.execute({
        sql: "SELECT * FROM cafe_tables WHERE id = ?",
        args: [cleanTableId],
      });
      if (!tRes.rows[0]) {
        throw new Error("Số bàn không tồn tại.");
      }
      tableName = String(tRes.rows[0].name);
    }

    const computedItems: CafeOrderItem[] = [];
    let subtotal = 0;
    let totalDrinkCups = 0;

    for (const raw of input.items) {
      const m = menuMap.get(raw.menuItemId);
      if (!m) {
        throw new Error(`Không tìm thấy món (${raw.menuItemId}).`);
      }
      if (!m.isAvailable) {
        throw new Error(`Món "${m.name}" hiện đang tạm hết, vui lòng chọn món khác giúp khách.`);
      }
      const qty = Math.max(1, Math.floor(raw.quantity));
      const sizeExtra =
        m.hasSizeOption && raw.cupSize
          ? CUP_SIZE_OPTIONS.find((s) => s.value === raw.cupSize)?.extraPrice ?? 0
          : 0;

      const selectedToppings = (raw.toppingIds ?? [])
        .map((id) => topMap.get(id))
        .filter((t): t is ToppingOption => Boolean(t));
      const toppingExtra = selectedToppings.reduce((acc, t) => acc + t.price, 0);

      const unitPrice = m.basePrice + sizeExtra + toppingExtra;
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;
      if (m.category !== "BanhNgot") {
        totalDrinkCups += qty;
      }

      computedItems.push({
        menuItemId: m.id,
        menuItemName: m.name,
        quantity: qty,
        cupSize: m.hasSizeOption ? (raw.cupSize ?? "S") : null,
        sugarLevel: m.hasTempOption ? (raw.sugarLevel ?? "100") : null,
        iceLevel: m.hasTempOption ? (raw.iceLevel ?? "BinhThuong") : null,
        toppingsText: selectedToppings.map((t) => t.name).join(", "),
        itemNote: (raw.itemNote ?? "").trim(),
        unitPrice,
        lineTotal,
      });
    }

    // Xử lý tích điểm & dùng phiếu tặng 30.000đ cho khách quen
    const cleanPhone = (input.customerPhone ?? "").replace(/\D/g, "");
    let customerName: string | null = (input.customerName ?? "").trim() || null;
    let discountAmount = 0;

    let existingCustomer: LoyalCustomer | null = null;
    if (cleanPhone.length >= 9) {
      existingCustomer = await this.lookupCustomer(cleanPhone);
      if (existingCustomer && !customerName) {
        customerName = existingCustomer.name;
      }
      if (input.useFreeVoucher && existingCustomer && existingCustomer.freeDrinkVouchers > 0) {
        discountAmount = Math.min(30000, subtotal);
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);
    const cashReceived =
      input.paymentMethod === "TienMat" && input.cashReceived
        ? Math.round(input.cashReceived)
        : input.paymentMethod === "TienMat"
          ? totalAmount
          : null;

    if (input.paymentMethod === "TienMat" && cashReceived !== null && cashReceived < totalAmount) {
      throw new Error("Số tiền khách đưa chưa đủ tổng tiền thanh toán.");
    }
    const changeAmount = cashReceived !== null ? Math.max(0, cashReceived - totalAmount) : null;

    const seq = 101 + Number(countRes.rows[0]?.cnt ?? 0);
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const orderNumber = `#${seq}`;
    const nowIso = new Date().toISOString();

    const batchStmts = [
      {
        sql: `INSERT INTO cafe_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ChoPha', NULL, ?, ?)`,
        args: [
          orderId,
          orderNumber,
          input.orderType,
          cleanTableId,
          tableName,
          input.staffId,
          input.staffName,
          cleanPhone || null,
          customerName,
          subtotal,
          discountAmount,
          totalAmount,
          input.paymentMethod,
          cashReceived,
          changeAmount,
          nowIso,
          nowIso,
        ],
      },
      ...computedItems.map((it) => ({
        sql: `INSERT INTO cafe_order_items (
                order_id, menu_item_id, menu_item_name, quantity, cup_size,
                sugar_level, ice_level, toppings_text, item_note, unit_price, line_total
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          orderId,
          it.menuItemId,
          it.menuItemName,
          it.quantity,
          it.cupSize,
          it.sugarLevel,
          it.iceLevel,
          it.toppingsText,
          it.itemNote,
          it.unitPrice,
          it.lineTotal,
        ],
      })),
    ];

    if (cleanTableId) {
      batchStmts.push({
        sql: "UPDATE cafe_tables SET status = 'CoKhach', active_order_id = ? WHERE id = ?",
        args: [orderId, cleanTableId],
      });
    }

    if (cleanPhone.length >= 9) {
      const prevCups = existingCustomer?.cupsAccumulated ?? 0;
      const prevVouchers =
        (existingCustomer?.freeDrinkVouchers ?? 0) - (discountAmount > 0 ? 1 : 0);
      const combinedCups = prevCups + totalDrinkCups;
      const newlyEarnedVouchers = Math.floor(combinedCups / 10);
      const remainderCups = combinedCups % 10;
      const finalVouchers = Math.max(0, prevVouchers + newlyEarnedVouchers);
      const finalSpent = (existingCustomer?.totalSpent ?? 0) + totalAmount;

      batchStmts.push({
        sql: `INSERT INTO cafe_customers (phone, name, cups_accumulated, free_drink_vouchers, total_spent)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(phone) DO UPDATE SET
                name = excluded.name,
                cups_accumulated = excluded.cups_accumulated,
                free_drink_vouchers = excluded.free_drink_vouchers,
                total_spent = excluded.total_spent`,
        args: [
          cleanPhone,
          customerName || "Khách thân thiết",
          remainderCups,
          finalVouchers,
          finalSpent,
        ],
      });
    }

    await db.batch(batchStmts, "write");
    await persistCafeDbToBlob();
    const created = await this.getOrderById(orderId);
    if (!created) throw new Error("Không thể đọc lại đơn hàng vừa tạo.");
    return created;
  }

  async listTables(): Promise<CafeTable[]> {
    await ensureCafeDbReady();
    const db = getDbClient();
    const tableRes = await db.execute("SELECT * FROM cafe_tables ORDER BY id ASC");
    return tableRes.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      zone: String(r.zone),
      seats: Number(r.seats),
      status: String(r.status) as "Trong" | "CoKhach",
      activeOrderId: r.active_order_id ? String(r.active_order_id) : null,
    }));
  }

  async getOrderById(orderId: string): Promise<CafeOrder | null> {
    await ensureCafeDbReady();
    const db = getDbClient();
    const [oRes, iRes] = await Promise.all([
      db.execute({ sql: "SELECT * FROM cafe_orders WHERE id = ?", args: [orderId] }),
      db.execute({ sql: "SELECT * FROM cafe_order_items WHERE order_id = ?", args: [orderId] }),
    ]);
    const r = oRes.rows[0];
    if (!r) return null;
    return this.mapOrderRow(r, iRes.rows);
  }

  async listOrders(statuses?: PrepStatus[], limit = 40): Promise<CafeOrder[]> {
    await ensureCafeDbReady();
    const db = getDbClient();
    const oRes =
      statuses && statuses.length > 0
        ? await db.execute({
            sql: `SELECT * FROM cafe_orders WHERE prep_status IN (${statuses
              .map(() => "?")
              .join(",")}) ORDER BY created_at ASC LIMIT ?`,
            args: [...statuses, limit],
          })
        : await db.execute({
            sql: "SELECT * FROM cafe_orders ORDER BY created_at DESC LIMIT ?",
            args: [limit],
          });

    if (oRes.rows.length === 0) return [];
    const ids = oRes.rows.map((r) => String(r.id));
    const iRes = await db.execute({
      sql: `SELECT * FROM cafe_order_items WHERE order_id IN (${ids.map(() => "?").join(",")})`,
      args: ids,
    });

    const itemsByOrder = new Map<string, Record<string, unknown>[]>();
    for (const row of iRes.rows) {
      const oid = String(row.order_id);
      const list = itemsByOrder.get(oid) ?? [];
      list.push(row as Record<string, unknown>);
      itemsByOrder.set(oid, list);
    }

    return oRes.rows.map((r) =>
      this.mapOrderRow(r, itemsByOrder.get(String(r.id)) ?? [])
    );
  }

  async updatePrepStatus(orderId: string, nextStatus: PrepStatus): Promise<CafeOrder> {
    await ensureCafeDbReady();
    const db = getDbClient();
    const nowIso = new Date().toISOString();
    await db.execute({
      sql: "UPDATE cafe_orders SET prep_status = ?, updated_at = ? WHERE id = ?",
      args: [nextStatus, nowIso, orderId],
    });
    await persistCafeDbToBlob();
    const updated = await this.getOrderById(orderId);
    if (!updated) throw new Error("Không tìm thấy đơn hàng.");
    return updated;
  }

  async clearTable(tableId: string): Promise<void> {
    await ensureCafeDbReady();
    const db = getDbClient();
    const tRes = await db.execute({
      sql: "SELECT active_order_id FROM cafe_tables WHERE id = ?",
      args: [tableId],
    });
    const activeOrderId = tRes.rows[0]?.active_order_id
      ? String(tRes.rows[0].active_order_id)
      : null;

    const nowIso = new Date().toISOString();
    const stmts = [
      {
        sql: "UPDATE cafe_tables SET status = 'Trong', active_order_id = NULL WHERE id = ?",
        args: [tableId],
      },
      {
        sql: "UPDATE cafe_orders SET prep_status = 'DaGiao', updated_at = ? WHERE table_id = ? AND prep_status IN ('ChoPha', 'DangPha', 'DaXong')",
        args: [nowIso, tableId],
      },
    ];
    if (activeOrderId) {
      stmts.push({
        sql: "UPDATE cafe_orders SET prep_status = 'DaGiao', updated_at = ? WHERE id = ? AND prep_status IN ('ChoPha', 'DangPha', 'DaXong')",
        args: [nowIso, activeOrderId],
      });
    }
    await db.batch(stmts, "write");
    await persistCafeDbToBlob();
  }

  async toggleMenuAvailability(menuItemId: string, isAvailable: boolean): Promise<void> {
    await ensureCafeDbReady();
    const db = getDbClient();
    await db.execute({
      sql: "UPDATE cafe_menu SET is_available = ? WHERE id = ?",
      args: [isAvailable ? 1 : 0, menuItemId],
    });
    await persistCafeDbToBlob();
  }

  async listIngredients(): Promise<Ingredient[]> {
    await ensureCafeDbReady();
    const db = getDbClient();
    const res = await db.execute(`
      SELECT * FROM cafe_ingredients
      ORDER BY
        CASE WHEN current_stock <= min_stock THEN 0 ELSE 1 END ASC,
        (current_stock - min_stock) ASC,
        name ASC
    `);
    return res.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      unit: String(r.unit),
      currentStock: Number(r.current_stock),
      minStock: Number(r.min_stock),
      updatedAt: String(r.updated_at),
    }));
  }

  async createIngredient(input: {
    name: string;
    unit: string;
    currentStock: number;
    minStock: number;
  }): Promise<Ingredient[]> {
    await ensureCafeDbReady();
    const cleanName = input.name.trim();
    const cleanUnit = input.unit.trim() || "đơn vị";
    if (!cleanName) {
      throw new Error("Vui lòng nhập tên nguyên liệu mới.");
    }
    const id = `NL-${Date.now().toString().slice(-5)}`;
    const nowIso = new Date().toISOString();
    const db = getDbClient();
    await db.execute({
      sql: `INSERT INTO cafe_ingredients (id, name, unit, current_stock, min_stock, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        cleanName,
        cleanUnit,
        Math.max(0, Math.round(Number(input.currentStock || 0) * 100) / 100),
        Math.max(0.5, Math.round(Number(input.minStock || 2) * 100) / 100),
        nowIso,
      ],
    });
    await persistCafeDbToBlob();
    return this.listIngredients();
  }

  async updateIngredientStock(id: string, delta: number): Promise<Ingredient[]> {
    await ensureCafeDbReady();
    const db = getDbClient();
    await db.execute({
      sql: `UPDATE cafe_ingredients
            SET current_stock = MAX(0, ROUND(current_stock + ?, 2)), updated_at = ?
            WHERE id = ?`,
      args: [delta, new Date().toISOString(), id],
    });
    await persistCafeDbToBlob();
    return this.listIngredients();
  }

  // --- ĐẶC QUYỀN QUẢN LÝ (MANAGER ONLY) ---

  async upsertMenuItem(input: {
    id?: string;
    name: string;
    category: CategoryId;
    description: string;
    basePrice: number;
    isAvailable: boolean;
    isBestSeller: boolean;
    hasSizeOption: boolean;
    hasTempOption: boolean;
  }): Promise<void> {
    await ensureCafeDbReady();
    if (!input.name.trim() || input.basePrice < 0) {
      throw new Error("Tên món và giá bán không hợp lệ.");
    }
    const id = input.id?.trim() || `MN-${Date.now().toString().slice(-5)}`;
    const db = getDbClient();
    await db.execute({
      sql: `INSERT INTO cafe_menu (
              id, name, category, description, base_price,
              is_available, is_best_seller, has_size_option, has_temp_option
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              category = excluded.category,
              description = excluded.description,
              base_price = excluded.base_price,
              is_available = excluded.is_available,
              is_best_seller = excluded.is_best_seller,
              has_size_option = excluded.has_size_option,
              has_temp_option = excluded.has_temp_option`,
      args: [
        id,
        input.name.trim(),
        input.category,
        input.description.trim(),
        Math.round(input.basePrice),
        input.isAvailable ? 1 : 0,
        input.isBestSeller ? 1 : 0,
        input.hasSizeOption ? 1 : 0,
        input.hasTempOption ? 1 : 0,
      ],
    });
    await persistCafeDbToBlob();
  }

  async cancelOrder(orderId: string, reason: string): Promise<CafeOrder> {
    await ensureCafeDbReady();
    const existing = await this.getOrderById(orderId);
    if (!existing) throw new Error("Không tìm thấy đơn hàng cần hủy.");

    const db = getDbClient();
    const stmts = [
      {
        sql: "UPDATE cafe_orders SET prep_status = 'DaHuy', cancel_reason = ?, updated_at = ? WHERE id = ?",
        args: [reason.trim() || "Hủy theo yêu cầu khách", new Date().toISOString(), orderId],
      },
    ];
    if (existing.tableId) {
      stmts.push({
        sql: "UPDATE cafe_tables SET status = 'Trong', active_order_id = NULL WHERE id = ? AND active_order_id = ?",
        args: [existing.tableId, orderId],
      });
    }
    await db.batch(stmts, "write");
    await persistCafeDbToBlob();
    const updated = await this.getOrderById(orderId);
    if (!updated) throw new Error("Lỗi cập nhật hủy đơn.");
    return updated;
  }

  async getRevenueReport(period: RevenuePeriod = "day"): Promise<RevenueReportDTO> {
    await ensureCafeDbReady();
    const db = getDbClient();

    const nowMs = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const cutoffIso =
      period === "day"
        ? new Date(nowMs - dayMs).toISOString()
        : period === "week"
          ? new Date(nowMs - 7 * dayMs).toISOString()
          : new Date(nowMs - 30 * dayMs).toISOString();

    const periodLabel =
      period === "day"
        ? "Trong ngày (24 giờ qua)"
        : period === "week"
          ? "Trong tuần (7 ngày gần nhất)"
          : "Trong tháng (30 ngày gần nhất)";

    const [aggRes, topRes, lowIngRes, ordersRes] = await Promise.all([
      db.execute({
        sql: `
          SELECT
            COALESCE(SUM(CASE WHEN prep_status != 'DaHuy' THEN total_amount ELSE 0 END), 0) AS total_rev,
            COALESCE(SUM(CASE WHEN prep_status != 'DaHuy' AND payment_method = 'TienMat' THEN total_amount ELSE 0 END), 0) AS cash_rev,
            COALESCE(SUM(CASE WHEN prep_status != 'DaHuy' AND payment_method = 'VietQR' THEN total_amount ELSE 0 END), 0) AS qr_rev,
            SUM(CASE WHEN prep_status != 'DaHuy' THEN 1 ELSE 0 END) AS paid_cnt,
            SUM(CASE WHEN prep_status = 'DaHuy' THEN 1 ELSE 0 END) AS cancel_cnt
          FROM cafe_orders
          WHERE created_at >= ?
        `,
        args: [cutoffIso],
      }),
      db.execute({
        sql: `
          SELECT
            oi.menu_item_id,
            oi.menu_item_name,
            SUM(oi.quantity) AS qty_sold,
            SUM(oi.line_total) AS item_rev
          FROM cafe_order_items oi
          JOIN cafe_orders o ON o.id = oi.order_id
          WHERE o.prep_status != 'DaHuy' AND o.created_at >= ?
          GROUP BY oi.menu_item_id, oi.menu_item_name
          ORDER BY qty_sold DESC, item_rev DESC
          LIMIT 6
        `,
        args: [cutoffIso],
      }),
      db.execute("SELECT COUNT(*) AS cnt FROM cafe_ingredients WHERE current_stock <= min_stock"),
      db.execute({
        sql: "SELECT * FROM cafe_orders WHERE created_at >= ? ORDER BY created_at DESC LIMIT 60",
        args: [cutoffIso],
      }),
    ]);

    const r0 = aggRes.rows[0] ?? {};
    const totalRevenue = Number(r0.total_rev ?? 0);
    const cashRevenue = Number(r0.cash_rev ?? 0);
    const vietqrRevenue = Number(r0.qr_rev ?? 0);
    const paidOrdersCount = Number(r0.paid_cnt ?? 0);
    const cancelledOrdersCount = Number(r0.cancel_cnt ?? 0);

    const cupsRes = await db.execute({
      sql: `
        SELECT COALESCE(SUM(oi.quantity), 0) AS total_items
        FROM cafe_order_items oi
        JOIN cafe_orders o ON o.id = oi.order_id
        WHERE o.prep_status != 'DaHuy' AND o.created_at >= ?
      `,
      args: [cutoffIso],
    });
    const totalCupsSold = Number(cupsRes.rows[0]?.total_items ?? 0);

    // Map orders with items
    let recentOrders: CafeOrder[] = [];
    if (ordersRes.rows.length > 0) {
      const ids = ordersRes.rows.map((r) => String(r.id));
      const iRes = await db.execute({
        sql: `SELECT * FROM cafe_order_items WHERE order_id IN (${ids.map(() => "?").join(",")})`,
        args: ids,
      });
      const itemsByOrder = new Map<string, Record<string, unknown>[]>();
      for (const row of iRes.rows) {
        const oid = String(row.order_id);
        const list = itemsByOrder.get(oid) ?? [];
        list.push(row as Record<string, unknown>);
        itemsByOrder.set(oid, list);
      }
      recentOrders = ordersRes.rows.map((r) =>
        this.mapOrderRow(r, itemsByOrder.get(String(r.id)) ?? [])
      );
    }

    const breakdown = this.computePeriodBreakdown(period, recentOrders, nowMs);

    return {
      period,
      periodLabel,
      totalRevenue,
      cashRevenue,
      vietqrRevenue,
      paidOrdersCount,
      cancelledOrdersCount,
      totalCupsSold,
      averageOrderValue: paidOrdersCount > 0 ? Math.round(totalRevenue / paidOrdersCount) : 0,
      lowStockIngredientsCount: Number(lowIngRes.rows[0]?.cnt ?? 0),
      breakdown,
      topSellingItems: topRes.rows.map((row) => ({
        menuItemId: String(row.menu_item_id),
        menuItemName: String(row.menu_item_name),
        quantitySold: Number(row.qty_sold),
        revenue: Number(row.item_rev),
      })),
      recentOrders,
    };
  }

  private computePeriodBreakdown(
    period: RevenuePeriod,
    orders: CafeOrder[],
    nowMs: number
  ): RevenueBreakdownBucket[] {
    const validOrders = orders.filter((o) => o.prepStatus !== "DaHuy");
    const dayMs = 24 * 60 * 60 * 1000;

    if (period === "day") {
      const shifts: Array<{ label: string; subLabel: string; match: (hr: number) => boolean }> = [
        { label: "Ca sáng", subLabel: "06:00 – 11:00", match: (h) => h >= 6 && h < 11 },
        { label: "Ca trưa", subLabel: "11:00 – 14:00", match: (h) => h >= 11 && h < 14 },
        { label: "Ca chiều", subLabel: "14:00 – 18:00", match: (h) => h >= 14 && h < 18 },
        { label: "Ca tối & Đêm", subLabel: "18:00 – 06:00", match: (h) => h >= 18 || h < 6 },
      ];
      return shifts.map((s) => {
        const matched = validOrders.filter((o) => {
          const hr = new Date(o.createdAt).getHours();
          return s.match(hr);
        });
        return this.summarizeBucket(s.label, s.subLabel, matched);
      });
    }

    if (period === "week") {
      const buckets: RevenueBreakdownBucket[] = [];
      for (let d = 6; d >= 0; d--) {
        const endMs = nowMs - d * dayMs;
        const startMs = endMs - dayMs;
        const dateObj = new Date(endMs);
        const dateStr = new Intl.DateTimeFormat("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }).format(dateObj);
        const label = d === 0 ? "Hôm nay" : d === 1 ? "Hôm qua" : `${d} ngày trước`;
        const matched = validOrders.filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t > startMs && t <= endMs + (d === 0 ? 60000 : 0);
        });
        buckets.push(this.summarizeBucket(label, `Ngày ${dateStr}`, matched));
      }
      return buckets;
    }

    // period === "month": 4 tuần trong 30 ngày gần nhất
    const weekRanges = [
      { label: "Tuần 4 (Mới nhất)", subLabel: "7 ngày gần đây", minDays: 0, maxDays: 7 },
      { label: "Tuần 3", subLabel: "8 – 14 ngày trước", minDays: 7, maxDays: 14 },
      { label: "Tuần 2", subLabel: "15 – 21 ngày trước", minDays: 14, maxDays: 21 },
      { label: "Tuần 1", subLabel: "22 – 30 ngày trước", minDays: 21, maxDays: 31 },
    ];
    return weekRanges.reverse().map((w) => {
      const maxMs = nowMs - w.minDays * dayMs + (w.minDays === 0 ? 60000 : 0);
      const minMs = nowMs - w.maxDays * dayMs;
      const matched = validOrders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t > minMs && t <= maxMs;
      });
      return this.summarizeBucket(w.label, w.subLabel, matched);
    });
  }

  private summarizeBucket(
    label: string,
    subLabel: string,
    orders: CafeOrder[]
  ): RevenueBreakdownBucket {
    let revenue = 0;
    let cashRevenue = 0;
    let vietqrRevenue = 0;
    let cupsSold = 0;
    for (const o of orders) {
      revenue += o.totalAmount;
      if (o.paymentMethod === "TienMat") cashRevenue += o.totalAmount;
      if (o.paymentMethod === "VietQR") vietqrRevenue += o.totalAmount;
      for (const it of o.items) {
        cupsSold += it.quantity;
      }
    }
    return {
      label,
      subLabel,
      revenue,
      cashRevenue,
      vietqrRevenue,
      ordersCount: orders.length,
      cupsSold,
    };
  }

  async getFullSettings(): Promise<CafeSettings> {
    await ensureCafeDbReady();
    const db = getDbClient();
    const res = await db.execute("SELECT key, value FROM cafe_settings");
    const map = new Map<string, string>();
    for (const r of res.rows) {
      map.set(String(r.key), String(r.value));
    }
    return {
      shopName: map.get("shopName") ?? "Mộc Miên Café",
      address: map.get("address") ?? "",
      wifiName: map.get("wifiName") ?? "",
      wifiPassword: map.get("wifiPassword") ?? "",
      receiptFooter: map.get("receiptFooter") ?? "",
      bankBin: map.get("bankBin") ?? "970422",
      bankShortName: map.get("bankShortName") ?? "MB Bank",
      bankAccountNo: map.get("bankAccountNo") ?? "0966889999",
      bankAccountName: map.get("bankAccountName") ?? "MOC MIEN CAFE",
    };
  }

  async updateFullSettings(settings: CafeSettings): Promise<CafeSettings> {
    await ensureCafeDbReady();
    const db = getDbClient();
    const entries: Array<[string, string]> = [
      ["shopName", settings.shopName.trim()],
      ["address", settings.address.trim()],
      ["wifiName", settings.wifiName.trim()],
      ["wifiPassword", settings.wifiPassword.trim()],
      ["receiptFooter", settings.receiptFooter.trim()],
      ["bankBin", settings.bankBin.trim()],
      ["bankShortName", settings.bankShortName.trim()],
      ["bankAccountNo", settings.bankAccountNo.trim()],
      ["bankAccountName", settings.bankAccountName.trim().toUpperCase()],
    ];
    await db.batch(
      entries.map(([k, v]) => ({
        sql: "INSERT OR REPLACE INTO cafe_settings (key, value) VALUES (?, ?)",
        args: [k, v],
      })),
      "write"
    );
    await persistCafeDbToBlob();
    return this.getFullSettings();
  }

  private mapOrderRow(
    r: Record<string, unknown>,
    itemRows: Array<Record<string, unknown>>
  ): CafeOrder {
    return {
      id: String(r.id),
      orderNumber: String(r.order_number),
      orderType: String(r.order_type) as OrderType,
      tableId: r.table_id ? String(r.table_id) : null,
      tableName: r.table_name ? String(r.table_name) : null,
      staffId: String(r.staff_id),
      staffName: String(r.staff_name),
      customerPhone: r.customer_phone ? String(r.customer_phone) : null,
      customerName: r.customer_name ? String(r.customer_name) : null,
      subtotal: Number(r.subtotal),
      discountAmount: Number(r.discount_amount),
      totalAmount: Number(r.total_amount),
      paymentMethod: String(r.payment_method) as PaymentMethod,
      cashReceived: r.cash_received !== null ? Number(r.cash_received) : null,
      changeAmount: r.change_amount !== null ? Number(r.change_amount) : null,
      prepStatus: String(r.prep_status) as PrepStatus,
      cancelReason: r.cancel_reason ? String(r.cancel_reason) : null,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
      items: itemRows.map((it) => ({
        id: Number(it.id),
        orderId: String(it.order_id),
        menuItemId: String(it.menu_item_id),
        menuItemName: String(it.menu_item_name),
        quantity: Number(it.quantity),
        cupSize: it.cup_size ? (String(it.cup_size) as CupSize) : null,
        sugarLevel: it.sugar_level ? (String(it.sugar_level) as SugarLevel) : null,
        iceLevel: it.ice_level ? (String(it.ice_level) as IceLevel) : null,
        toppingsText: String(it.toppings_text ?? ""),
        itemNote: String(it.item_note ?? ""),
        unitPrice: Number(it.unit_price),
        lineTotal: Number(it.line_total),
      })),
    };
  }
}
