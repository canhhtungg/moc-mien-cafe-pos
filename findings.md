# Findings — Mộc Miên Café Minimalist POS

## Workspace & Archival
- Toàn bộ 27 mục trong `C:\Users\a\Desktop\PTTKHT` của hệ thống cửa hàng điện thoại cũ đã được di chuyển nguyên vẹn sang `C:\Users\a\Desktop\project_hethongCHdienthoai`.
- Thư mục `C:\Users\a\Desktop\PTTKHT` hiện hoàn toàn trống, sẵn sàng cho hệ thống quán cafe mới.

## Role-Based Permissions Matrix (RBAC)
- `Cashier` (Thu ngân / Phục vụ): Chỉ được truy cập `/order` (Gọi món & Thanh toán) và `/tables` (Sơ đồ bàn & Trạng thái đơn trong ca). Không được xem tổng doanh thu ngày, lợi nhuận, chỉnh sửa giá thực đơn hay đổi tài khoản ngân hàng.
- `Barista` (Pha chế): Chỉ được truy cập `/barista` (Hàng đợi phiếu pha chế) và `/bar-stock` (Báo tạm hết món / kiểm kê nhanh nguyên liệu quầy bar). Không thấy giá tiền, hóa đơn thanh toán hay doanh thu.
- `Manager` (Quản lý): Được quyền truy cập `/manager/revenue` (Doanh thu & Hóa đơn), `/manager/menu` (Quản lý Thực đơn & Kho nguyên liệu), `/manager/settings` (Cấu hình quán, VietQR & Khôi phục dữ liệu mẫu), đồng thời có thể xem hỗ trợ quầy Gọi món / Pha chế khi cần.
