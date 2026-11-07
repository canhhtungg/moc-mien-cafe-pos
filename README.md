# Mộc Miên Café — Hệ thống Quản lý Quán Cafe Tối Giản & Thân Thiện

Hệ thống quản lý bán hàng, pha chế và vận hành quán cafe được thiết kế theo phong cách **Minimalist tông nâu nhạt ấm áp**, ưu tiên sự trực quan cho người dùng không chuyên công nghệ (non-tech) và tách biệt chặt chẽ giao diện theo từng vai trò nhân sự.

> **Lưu ý:** Toàn bộ dự án hệ thống cửa hàng điện thoại trước đó đã được lưu trữ nguyên vẹn tại `C:\Users\a\Desktop\project_hethongCHdienthoai`.

---

## 1. Tách biệt Giao diện & Phân quyền theo 3 Vai trò

Ở góc trên bên phải màn hình, bạn có thể chuyển đổi nhanh giữa 3 nhân sự đại diện cho 3 nhóm quyền (chưa cần đăng nhập):

| Vai trò | Nhân sự mẫu | Các màn hình & Quyền hạn được phép | Các mục bị khóa (cả trên UI & Server API `403`) |
| :--- | :--- | :--- | :--- |
| **Thu ngân & Phục vụ** (`Cashier`) | **Lan Anh** | • **Gọi món & Tính tiền (`/order`)**: Chạm chọn món, tùy chỉnh cỡ ly / độ ngọt / lượng đá / topping, chọn bàn hoặc mang đi, tích điểm SĐT khách quen (10 ly tặng phiếu giảm `30.000đ`), tính tiền thừa tự động & sinh mã **VietQR động**.<br>• **Sơ đồ bàn & Đơn vừa gọi (`/tables`)**: Xem 12 bàn theo khu vực, báo đã mang nước cho khách và dọn bàn trống. | Không được xem doanh thu quán, không được sửa giá thực đơn, không được đổi tài khoản ngân hàng. |
| **Quầy Pha chế** (`Barista`) | **Minh Khôi** | • **Phiếu nước cần pha (`/barista`)**: Màn hình thẻ phiếu chữ lớn xếp theo thứ tự gọi, làm nổi bật ghi chú *Ít ngọt / Ít đá / Pha nóng*, bấm 1 chạm **Nhận pha** → **Đã pha xong**.<br>• **Báo hết món & Nguyên liệu (`/bar-stock`)**: Bật/tắt nhanh món tạm hết ngay tại quầy bar và kiểm đếm nguyên liệu. | Không hiển thị giá tiền, không xem được doanh thu ngày hay cài đặt quán. |
| **Quản lý quán** (`Manager`) | **Chị Thảo** | • **Doanh thu hôm nay (`/manager/revenue`)**: Xem tổng thực thu, tiền mặt vs chuyển khoản VietQR, món bán chạy nhất, cảnh báo nguyên liệu sắp hết và hủy đơn nhập nhầm.<br>• **Thực đơn & Kho (`/manager/menu`)**: Thêm món mới, chỉnh giá bán và nhập thêm nguyên liệu.<br>• **Cài đặt quán & QR (`/manager/settings`)**: Đổi mật khẩu Wifi in trên phiếu, cấu hình tài khoản ngân hàng VietQR và khôi phục dữ liệu mẫu. | Toàn quyền quản trị và có thể mở xem hỗ trợ quầy Thu ngân / Pha chế khi quán đông. |

---

## 2. Cách chạy & Kiểm thử

```bash
# 1. Chạy kiểm thử tự động (Vitest: kiểm tra luồng gọi món, pha chế, VietQR & chặn quyền 403)
npm test

# 2. Khởi động máy chủ phát triển (http://localhost:3000)
npm run dev

# 3. Kiểm tra biên dịch Production
npm run build
```
