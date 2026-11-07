# Task Plan: Xây dựng Hệ thống Quản lý Quán Cafe Minimalist (Mộc Miên Café)

Use this file as the durable roadmap for the task. Create it before complex work and keep it current as phases change.

## Goal

Xây dựng hoàn chỉnh hệ thống quản lý quán cafe "Mộc Miên Café" theo phong cách Minimalist tông nâu nhạt ấm áp, thân thiện với người không rành công nghệ, tách biệt giao diện và phân quyền chặt chẽ theo 3 vai trò (Thu ngân, Pha chế, Quản lý) kèm chuyển đổi nhanh vai trò ở thanh trên cùng.

## Next Step

Hoàn tất kiểm thử, đẩy bản vá lên GitHub `canhhtungg/moc-mien-cafe-pos` và deploy bản Production lên Vercel `https://moc-mien-cafe-pos.vercel.app`.

## Current Phase

Phase 6

## Phases

Break the task into three to seven verifiable phases. Use only `pending`, `in_progress`, or `complete` for each status and update the value when work advances.

### Phase 1: Lưu trữ dự án cũ & Khởi tạo nền tảng dự án Cafe

- [x] Di chuyển toàn bộ dự án cửa hàng điện thoại sang `C:\Users\a\Desktop\project_hethongCHdienthoai`
- [x] Khởi tạo `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts` và cài đặt dependencies
- [x] Thiết lập hệ màu Minimalist Latte/Caramel và cấu trúc thư mục dự án Cafe
- **Status:** complete

### Phase 2: Cơ sở dữ liệu SQLite, Phân quyền RBAC & Nghiệp vụ Cafe

- [x] Xây dựng schema SQLite tối giản (Nhân sự, Danh mục & Thực đơn, Bàn, Nguyên liệu, Đơn hàng, Chi tiết đơn, Khách thân thiết, Cấu hình VietQR) và dữ liệu mẫu quán cafe Việt
- [x] Xây dựng bộ kiểm tra phân quyền `rbac.ts` chặn truy cập trái vai trò trên cả UI và API (`403 Forbidden`)
- [x] Xây dựng các dịch vụ nghiệp vụ: Gọi món & Gắn bàn, Hàng đợi Pha chế (Barista Queue), Sinh mã VietQR động EMVCo, Tích điểm khách quen, Báo cáo doanh thu & Kho nguyên liệu
- **Status:** complete

### Phase 3: Giao diện riêng biệt cho từng Vai trò (Minimalist Warm Coffee UI)

- [x] Xây dựng thanh chuyển đổi nhanh vai trò ở góc trên (`Thu ngân`, `Pha chế`, `Quản lý`) tự động điều hướng về đúng không gian làm việc của từng người
- [x] Giao diện Thu ngân (`/order`, `/tables`): Gọi món 1 chạm, chọn cỡ/đường/đá/topping, sơ đồ 12 bàn trực quan, tính tiền thừa tự động & quét VietQR
- [x] Giao diện Pha chế (`/barista`, `/bar-stock`): Thẻ phiếu pha chế chữ lớn theo thứ tự gọi, báo xong món 1 chạm và bật/tắt nhanh món tạm hết
- [x] Giao diện Quản lý (`/manager/revenue`, `/manager/menu`, `/manager/settings`): Xem doanh thu & món bán chạy (chỉ Quản lý thấy), chỉnh sửa thực đơn/giá/nguyên liệu và cấu hình VietQR + khôi phục dữ liệu mẫu
- **Status:** complete

### Phase 4: Kiểm thử Tự động, Build Production & Bàn giao

- [x] Viết và chạy bộ kiểm thử Vitest cho nghiệp vụ gọi món, pha chế, VietQR và khóa quyền RBAC (`403` khi Thu ngân/Pha chế gọi API doanh thu)
- [x] Chạy `npx tsc --noEmit` và `npm run build` đảm bảo 0 lỗi
- [x] Viết tài liệu `README.md` rõ ràng và bàn giao cho người dùng
- **Status:** complete

### Phase 5: Triển khai GitHub & Vercel riêng biệt (moc-mien-cafe-pos)

- [x] Khởi tạo Git repository mới tại `PTTKHT` và đẩy lên kho GitHub riêng `canhhtungg/moc-mien-cafe-pos`
- [x] Liên kết dự án Vercel mới `canhhtungg/moc-mien-cafe-pos` và deploy bản Production (`https://moc-mien-cafe-pos.vercel.app`)
- **Status:** complete

### Phase 6: Lưu trữ bền vững Cloud (Vercel Blob) & Đồng bộ UI tức thì

- [x] Khởi tạo kho lưu trữ đám mây `moc-mien-cafe-store` (Vercel Blob) gắn trực tiếp vào dự án `canhhtungg/moc-mien-cafe-pos`
- [x] Nâng cấp `src/server/db/client.ts` và `CafeService.ts` tự động đồng bộ trạng thái CSDL SQLite lên Cloud Blob sau mọi thao tác ghi và kiểm tra ETag trước mỗi lần đọc để loại bỏ hoàn toàn hiện tượng mất dữ liệu giữa các Serverless Lambda instances
- [x] Cải tiến trang `/tables` và `/barista`: cập nhật UI tức thì ngay khi bấm giao nước / dọn bàn, trả dữ liệu mới nhất ngay trong response mutation, và tự động polling mỗi 5 giây + khi focus cửa sổ
- **Status:** complete

### Phase 7: Nâng cấp Quản lý Kho nguyên liệu ưu tiên, Giá bán phân cách 3 chữ số & Thống kê Doanh thu Ngày/Tuần/Tháng

- [x] Đẩy các nguyên liệu sắp hết (`currentStock <= minStock`) lên đầu danh sách kèm màu sắc cảnh báo nổi bật và hỗ trợ thêm loại nguyên liệu mới vào kho (`/manager/menu`, `CafeService.ts`)
- [x] Tự động phân cách 3 chữ số cho ô nhập Giá bán khi thêm/sửa món mới (`35.000`) kèm các mức giá chọn nhanh 1 chạm
- [x] Thống kê chi tiết doanh thu theo **Ngày (4 ca trong ngày)**, **Tuần (7 ngày gần nhất)** và **Tháng (4 tuần trong 30 ngày qua)** tại `/manager/revenue`
- **Status:** complete

### Phase 8: Đổi thương hiệu Lặng. Café, Ước tính số cốc theo nguyên liệu, Tối ưu POS gọi món nhanh, Lịch sử các kỳ trước & In đúng 1 phiếu

- [x] Đổi tên quán thành **Lặng. Café** và cập nhật STK mặc định thành `0336606699` — `TO CANH TUNG`
- [x] Tính toán số cốc ước tính còn lại theo nguyên liệu (`estimatedMaxCups`), tự động trừ nguyên liệu khi tạo/làm đơn và chặn gọi vượt quá nguyên liệu hiện có
- [x] Tối ưu giao diện Thu ngân (`/order`) dạng lưới 3 cột gọn gàng, hỗ trợ tìm kiếm không dấu, bấm `+1 Nhanh` không cần cuộn dài
- [x] Bổ sung điều hướng xem lại các ngày trước, tuần trước, tháng trước (`offset`) kèm bảng phân tích tiêu hao & đề xuất phân phối nguyên liệu theo mùa/kỳ
- [x] Khắc phục CSS `@media print` để chỉ in đúng 1 phiếu duy nhất đưa khách và bổ sung chế độ tự động hoàn tất + tự động in phiếu khi quét VietQR
- **Status:** complete

## Key Questions

1. Quán đơn lẻ hay chuỗi? -> Chọn mô hình 1 quán cafe chuẩn thực tế (12 bàn + Mua mang đi) để tối giản và thân thiện nhất với người dùng phổ thông.
2. Các đối tượng người dùng nào? -> 3 vai trò rõ rệt: Thu ngân (`Cashier`), Pha chế (`Barista`), và Quản lý (`Manager`), mỗi vai trò chỉ thấy đúng chức năng của mình.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Next.js 15 + `@libsql/client` SQLite + Tailwind v4 + `qrcode` | Kế thừa nền tảng ổn định, chạy 0đ local lẫn serverless, tự tạo dữ liệu mẫu ngay khi mở |
| Hệ màu `#FAF6F1` (Oat Milk) + `#8C5A3C` (Caramel Roast) + `#2D1E17` (Espresso) | Mang đúng hơi hướng nâu nhạt cafe ấm áp, độ tương phản chữ cao, tối giản dễ nhìn |
| Kiểm tra quyền kép (Client Route Guard + Server API `requireRole`) | Đảm bảo đúng yêu cầu: Thu ngân/Pha chế không xem được doanh thu hay sửa thực đơn cả trên giao diện lẫn API |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| None yet | 0 | - |

## Notes

- Update phase status as work progresses: `pending` to `in_progress` to `complete`.
- Re-read the goal and next step before major decisions.
- Log errors promptly so failed approaches are not repeated.
