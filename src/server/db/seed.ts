import type { Client, InStatement } from "@libsql/client";

function minsAgoISO(mins: number): string {
  return new Date(Date.now() - mins * 60 * 1000).toISOString();
}

export async function seedCafeDatabase(db: Client): Promise<void> {
  const now = new Date().toISOString();

  const statements: InStatement[] = [
    // 1. Nhân sự 3 vai trò đặc thù
    {
      sql: "INSERT INTO cafe_staff (id, name, role, shift_label) VALUES (?, ?, ?, ?)",
      args: ["NV-CASHIER", "Lan Anh", "Cashier", "Thu ngân ca sáng"],
    },
    {
      sql: "INSERT INTO cafe_staff (id, name, role, shift_label) VALUES (?, ?, ?, ?)",
      args: ["NV-BARISTA", "Minh Khôi", "Barista", "Pha chế chính"],
    },
    {
      sql: "INSERT INTO cafe_staff (id, name, role, shift_label) VALUES (?, ?, ?, ?)",
      args: ["NV-MANAGER", "Chị Thảo", "Manager", "Quản lý quán"],
    },

    // 2. Thực đơn quán cafe (4 nhóm thân thuộc)
    {
      sql: "INSERT INTO cafe_menu VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["CF-BACXIU", "Bạc Xỉu Kem Muối", "CaPhe", "Sữa tươi thanh trùng hòa quyện cà phê phin và lớp kem muối biển béo nhẹ", 35000, 1, 1, 1, 1],
    },
    {
      sql: "INSERT INTO cafe_menu VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["CF-SUADA", "Cà Phê Phin Sữa Đá", "CaPhe", "Hạt Robusta & Arabica rang vừa, thơm đậm vị truyền thống", 29000, 1, 1, 1, 1],
    },
    {
      sql: "INSERT INTO cafe_menu VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["CF-DENDA", "Đen Đá Rang Mộc", "CaPhe", "Không chất bảo quản, hậu vị ngọt dịu tự nhiên", 25000, 1, 0, 1, 1],
    },
    {
      sql: "INSERT INTO cafe_menu VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["CF-COLDBREW", "Cold Brew Cam Vàng", "CaPhe", "Ủ lạnh 16 tiếng cùng lát cam vàng tươi và sả thơm", 42000, 1, 0, 1, 0],
    },
    {
      sql: "INSERT INTO cafe_menu VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["CF-LATTE", "Latte Hạnh Nhân Nướng", "CaPhe", "Espresso êm dịu cùng sữa yến mạch và siro hạnh nhân nướng", 45000, 1, 0, 1, 1],
    },

    {
      sql: "INSERT INTO cafe_menu VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["TR-DAOCAMSA", "Trà Đào Cam Sả", "TraTraiCay", "Trà đen ủ mới mỗi sáng cùng đào miếng giòn và cam tươi", 39000, 1, 1, 1, 1],
    },
    {
      sql: "INSERT INTO cafe_menu VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["TR-VAI", "Trà Vải Hoa Nhài", "TraTraiCay", "Trà lục ướp hoa nhài thanh mát kèm trái vải ngâm ngọt thanh", 39000, 1, 0, 1, 0],
    },
    {
      sql: "INSERT INTO cafe_menu VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["TR-OLONGSEN", "Ô Long Hạt Sen Kem Sữa", "TraTraiCay", "Trà Ô Long nướng nhẹ điểm hạt sen bùi và lớp kem mịn", 45000, 1, 0, 1, 1],
    },

    {
      sql: "INSERT INTO cafe_menu VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["MC-UJI", "Matcha Uji Kem Phô Mai", "MatchaSua", "Bột trà xanh Uji Nhật Bản đánh tay cùng sữa tươi lạnh", 45000, 1, 1, 1, 1],
    },
    {
      sql: "INSERT INTO cafe_menu VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["MC-CACAO", "Cacao Sữa Ấm Bọt Mịn", "MatchaSua", "Cacao nguyên chất Đắk Lắk thơm nồng, dịu ngọt", 38000, 1, 0, 1, 1],
    },
    {
      sql: "INSERT INTO cafe_menu VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["MC-SUATT", "Sữa Tươi Trân Châu Đường Nâu", "MatchaSua", "Tạm hết trân châu đường nâu trong ca này", 36000, 0, 0, 1, 0],
    },

    {
      sql: "INSERT INTO cafe_menu VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["BN-CROISSANT", "Bánh Sừng Bò Bơ Pháp", "BanhNgot", "Nướng ấm giòn rụm trước khi mang ra bàn", 32000, 1, 1, 0, 0],
    },
    {
      sql: "INSERT INTO cafe_menu VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["BN-TIRAMISU", "Tiramisu Cà Phê Nhỏ", "BanhNgot", "Cốt bánh mềm thấm vị cà phê và phô mai Mascarpone", 38000, 1, 0, 0, 0],
    },
    {
      sql: "INSERT INTO cafe_menu VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["BN-CHUOI", "Bánh Chuối Nướng Cốt Dừa", "BanhNgot", "Bánh nhà làm ít ngọt, thơm lừng mùi chuối chín", 28000, 1, 0, 0, 0],
    },

    // 3. Topping gọi thêm
    { sql: "INSERT INTO cafe_toppings VALUES (?, ?, ?)", args: ["TOP-TC", "Trân châu trắng giòn", 8000] },
    { sql: "INSERT INTO cafe_toppings VALUES (?, ?, ?)", args: ["TOP-KC", "Kem phô mai mặn", 10000] },
    { sql: "INSERT INTO cafe_toppings VALUES (?, ?, ?)", args: ["TOP-ES", "Thêm 1 shot Cà phê", 10000] },
    { sql: "INSERT INTO cafe_toppings VALUES (?, ?, ?)", args: ["TOP-TH", "Thạch sương sáo", 6000] },

    // 4. Sơ đồ 12 bàn trong quán
    { sql: "INSERT INTO cafe_tables VALUES (?, ?, ?, ?, ?, ?)", args: ["B01", "Bàn 01", "Góc cửa sổ", 2, "Trong", null] },
    { sql: "INSERT INTO cafe_tables VALUES (?, ?, ?, ?, ?, ?)", args: ["B02", "Bàn 02", "Góc cửa sổ", 2, "CoKhach", "ORD-1004"] },
    { sql: "INSERT INTO cafe_tables VALUES (?, ?, ?, ?, ?, ?)", args: ["B03", "Bàn 03", "Góc cửa sổ", 4, "Trong", null] },
    { sql: "INSERT INTO cafe_tables VALUES (?, ?, ?, ?, ?, ?)", args: ["B04", "Bàn 04", "Góc cửa sổ", 4, "Trong", null] },
    { sql: "INSERT INTO cafe_tables VALUES (?, ?, ?, ?, ?, ?)", args: ["B05", "Bàn 05", "Trong nhà", 2, "Trong", null] },
    { sql: "INSERT INTO cafe_tables VALUES (?, ?, ?, ?, ?, ?)", args: ["B06", "Bàn 06", "Trong nhà", 4, "Trong", null] },
    { sql: "INSERT INTO cafe_tables VALUES (?, ?, ?, ?, ?, ?)", args: ["B07", "Bàn 07", "Trong nhà", 4, "Trong", null] },
    { sql: "INSERT INTO cafe_tables VALUES (?, ?, ?, ?, ?, ?)", args: ["B08", "Bàn 08", "Trong nhà", 6, "Trong", null] },
    { sql: "INSERT INTO cafe_tables VALUES (?, ?, ?, ?, ?, ?)", args: ["B09", "Bàn 09", "Hiên sân vườn", 2, "CoKhach", "ORD-1002"] },
    { sql: "INSERT INTO cafe_tables VALUES (?, ?, ?, ?, ?, ?)", args: ["B10", "Bàn 10", "Hiên sân vườn", 2, "Trong", null] },
    { sql: "INSERT INTO cafe_tables VALUES (?, ?, ?, ?, ?, ?)", args: ["B11", "Bàn 11", "Hiên sân vườn", 4, "Trong", null] },
    { sql: "INSERT INTO cafe_tables VALUES (?, ?, ?, ?, ?, ?)", args: ["B12", "Bàn 12", "Hiên sân vườn", 4, "Trong", null] },

    // 5. Kho nguyên liệu quầy bar (có 2 mặt hàng chạm ngưỡng sắp hết)
    { sql: "INSERT INTO cafe_ingredients VALUES (?, ?, ?, ?, ?, ?)", args: ["NL-CF", "Hạt cà phê rang mộc Cầu Đất", "kg", 4.5, 2, now] },
    { sql: "INSERT INTO cafe_ingredients VALUES (?, ?, ?, ?, ?, ?)", args: ["NL-SUATUOI", "Sữa tươi thanh trùng Dalatmilk", "hộp 1L", 3, 6, now] },
    { sql: "INSERT INTO cafe_ingredients VALUES (?, ?, ?, ?, ?, ?)", args: ["NL-SUADAC", "Sữa đặc có đường", "lon", 12, 5, now] },
    { sql: "INSERT INTO cafe_ingredients VALUES (?, ?, ?, ?, ?, ?)", args: ["NL-DAO", "Đào ngâm miếng giòn", "hộp", 2, 4, now] },
    { sql: "INSERT INTO cafe_ingredients VALUES (?, ?, ?, ?, ?, ?)", args: ["NL-MATCHA", "Bột Matcha Uji Nhật Bản", "gói 500g", 5, 2, now] },
    { sql: "INSERT INTO cafe_ingredients VALUES (?, ?, ?, ?, ?, ?)", args: ["NL-LYGIAY", "Ly mang đi & Nắp giấy", "lốc 50 ly", 8, 3, now] },

    // 6. Khách quen tích điểm (10 ly tặng 1 phiếu giảm 30.000đ)
    { sql: "INSERT INTO cafe_customers VALUES (?, ?, ?, ?, ?)", args: ["0901234567", "Minh Anh", 2, 1, 420000] },
    { sql: "INSERT INTO cafe_customers VALUES (?, ?, ?, ?, ?)", args: ["0987654321", "Hoàng Nam", 8, 0, 310000] },
    { sql: "INSERT INTO cafe_customers VALUES (?, ?, ?, ?, ?)", args: ["0912345678", "Thu Hà", 5, 0, 195000] },

    // 7. Đơn hàng mẫu sinh động trong ca (đã phục vụ + đã pha xong + đang pha + mới gọi)
    {
      sql: `INSERT INTO cafe_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["ORD-1001", "#101", "MangDi", null, null, "NV-CASHIER", "Lan Anh", "0987654321", "Hoàng Nam", 64000, 0, 64000, "VietQR", null, null, "DaGiao", null, minsAgoISO(95), minsAgoISO(88)],
    },
    {
      sql: `INSERT INTO cafe_order_items (order_id, menu_item_id, menu_item_name, quantity, cup_size, sugar_level, ice_level, toppings_text, item_note, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["ORD-1001", "CF-SUADA", "Cà Phê Phin Sữa Đá", 1, "M", "70", "BinhThuong", "", "", 35000, 35000],
    },
    {
      sql: `INSERT INTO cafe_order_items (order_id, menu_item_id, menu_item_name, quantity, cup_size, sugar_level, ice_level, toppings_text, item_note, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["ORD-1001", "BN-CHUOI", "Bánh Chuối Nướng Cốt Dừa", 1, null, null, null, "", "Hâm ấm nhẹ", 29000, 29000],
    },

    {
      sql: `INSERT INTO cafe_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["ORD-1002", "#102", "TaiBan", "B09", "Bàn 09", "NV-CASHIER", "Lan Anh", "0901234567", "Minh Anh", 96000, 0, 96000, "TienMat", 100000, 4000, "DaXong", null, minsAgoISO(18), minsAgoISO(5)],
    },
    {
      sql: `INSERT INTO cafe_order_items (order_id, menu_item_id, menu_item_name, quantity, cup_size, sugar_level, ice_level, toppings_text, item_note, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["ORD-1002", "MC-UJI", "Matcha Uji Kem Phô Mai", 2, "S", "70", "ItDa", "", "Khuấy đều kem giúp khách", 48000, 96000],
    },

    {
      sql: `INSERT INTO cafe_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["ORD-1003", "#103", "MangDi", null, null, "NV-CASHIER", "Lan Anh", null, null, 94000, 0, 94000, "VietQR", null, null, "DangPha", null, minsAgoISO(7), minsAgoISO(3)],
    },
    {
      sql: `INSERT INTO cafe_order_items (order_id, menu_item_id, menu_item_name, quantity, cup_size, sugar_level, ice_level, toppings_text, item_note, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["ORD-1003", "TR-DAOCAMSA", "Trà Đào Cam Sả", 2, "S", "70", "ItDa", "Trân châu trắng giòn", "Bỏ túi đôi mang đi", 47000, 94000],
    },

    {
      sql: `INSERT INTO cafe_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["ORD-1004", "#104", "TaiBan", "B02", "Bàn 02", "NV-CASHIER", "Lan Anh", "0912345678", "Thu Hà", 67000, 0, 67000, "TienMat", 100000, 33000, "ChoPha", null, minsAgoISO(2), minsAgoISO(2)],
    },
    {
      sql: `INSERT INTO cafe_order_items (order_id, menu_item_id, menu_item_name, quantity, cup_size, sugar_level, ice_level, toppings_text, item_note, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["ORD-1004", "CF-BACXIU", "Bạc Xỉu Kem Muối", 1, "S", "70", "ItDa", "", "Ít sữa đặc, nhiều kem muối", 35000, 35000],
    },
    {
      sql: `INSERT INTO cafe_order_items (order_id, menu_item_id, menu_item_name, quantity, cup_size, sugar_level, ice_level, toppings_text, item_note, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["ORD-1004", "BN-CROISSANT", "Bánh Sừng Bò Bơ Pháp", 1, null, null, null, "", "Làm nóng giòn", 32000, 32000],
    },

    // 8. Cấu hình quán & Tài khoản thụ hưởng VietQR
    { sql: "INSERT INTO cafe_settings VALUES ('shopName', 'Mộc Miên Café')", args: [] },
    { sql: "INSERT INTO cafe_settings VALUES ('address', '28 Ngõ Nhỏ Phố Cổ, Hoàn Kiếm, Hà Nội')", args: [] },
    { sql: "INSERT INTO cafe_settings VALUES ('wifiName', 'MocMien_Cafe')", args: [] },
    { sql: "INSERT INTO cafe_settings VALUES ('wifiPassword', 'henmotngayvui')", args: [] },
    { sql: "INSERT INTO cafe_settings VALUES ('receiptFooter', 'Cảm ơn bạn đã ghé Mộc Miên hôm nay. Chúc bạn một ngày thật êm!')", args: [] },
    { sql: "INSERT INTO cafe_settings VALUES ('bankBin', '970422')", args: [] },
    { sql: "INSERT INTO cafe_settings VALUES ('bankShortName', 'MB Bank')", args: [] },
    { sql: "INSERT INTO cafe_settings VALUES ('bankAccountNo', '0966889999')", args: [] },
    { sql: "INSERT INTO cafe_settings VALUES ('bankAccountName', 'MOC MIEN CAFE')", args: [] },
  ];

  await db.batch(statements, "write");
}
