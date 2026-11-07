# Progress Log — Mộc Miên Café

## 2026-11-08
- Đã di chuyển toàn bộ dự án cửa hàng điện thoại sang `C:\Users\a\Desktop\project_hethongCHdienthoai`.
- Đã hoàn thiện CSDL SQLite 8 bảng, dữ liệu mẫu thực tế và kiểm soát phân quyền RBAC (`Cashier`, `Barista`, `Manager`).
- Đã xây dựng trọn bộ 7 màn hình Minimalist tông nâu nhạt ấm áp: `/order`, `/tables`, `/barista`, `/bar-stock`, `/manager/revenue`, `/manager/menu`, `/manager/settings`.
- Đã vượt qua bộ kiểm thử Vitest (`5/5 passed`) và kiểm tra TypeScript (`0 errors`).
- Đã tạo kho GitHub riêng https://github.com/canhhtungg/moc-mien-cafe-pos và triển khai Production thành công lên Vercel tại https://moc-mien-cafe-pos.vercel.app (`READY`).
- Đã gắn Cloud Storage thật (`moc-mien-cafe-store` trên Vercel Blob) và nâng cấp cơ chế đồng bộ CSDL xuyên suốt giữa các Serverless Functions, kết hợp cập nhật giao diện tức thì + tự động làm mới mỗi 5 giây tại trang Sơ đồ bàn (`/tables`) và Pha chế (`/barista`).
