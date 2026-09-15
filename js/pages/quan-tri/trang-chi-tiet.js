// ============================================================
// giapha-supabase · js/pages/quan-tri/trang-chi-tiet.js
// Vai trò  : Ghép `#` của một TRANG CHI TIẾT trong khung Quản trị
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: (không)
// Phiên bản: 0.3.0 · Cập nhật: 16/09/2026 (b118d)
// ============================================================
//
// ⚠ Từ b118d vỏ trang chi tiết (thanh "← Quay lại", tựa, thanh mục) là HTML
//   quantri3 nằm sẵn trong QuanTri.html — `veVoChiTiet()` · `veChuaChuyen()`
//   đã gỡ. File này còn đúng MỘT việc: dựng địa chỉ.
//
//     #gia-pha                         khu
//     #gia-pha/cay/NPG473              trang chi tiết, mục đầu tiên
//     #gia-pha/cay/NPG473/thanh-vien   trang chi tiết, mục "Thành viên & quyền"
//
// ⚠ **Mã của thứ đang xem nằm TRONG địa chỉ**, không lấy từ "cây đang mở" của
//   app. Luật 5a (`THIET-KE-QUAN-TRI.md`).

/**
 * Ghép các đoạn thành `#` của địa chỉ (không kèm dấu `#`). Đoạn rỗng bị bỏ —
 * nhờ vậy mục đầu tiên của một trang có đúng MỘT địa chỉ, không phải hai.
 *
 * Mọi chỗ dựng `#` của trang chi tiết đi qua hàm này, kể cả `khung.js` lúc
 * sửa `#` lạ — hai chỗ tự ghép chuỗi là hai chỗ có ngày ghép khác nhau.
 */
export function duongDan(...doan) {
  return doan.filter(Boolean).map((d) => encodeURIComponent(d)).join('/');
}
