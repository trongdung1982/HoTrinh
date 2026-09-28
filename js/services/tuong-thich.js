// ============================================================
// giapha-supabase · js/services/tuong-thich.js
// Vai trò  : Giàn giáo tạm. Giữ nguyên hình những lệnh mà bảy màn hình đang
//            gọi từ `services/gas.js`, để chúng chạy được trên nền Supabase
//            mà chưa phải sửa.
// Lớp      : services — được gọi bởi: pages · gọi: services/sb
// Phụ thuộc: services/sb.js
// Phiên bản: 0.4.0 · Cập nhật: 28/09/2026 (b149) — còn 1 màn hình (`chon-gia-pha`)
// ============================================================
//
// ═══ FILE NÀY LÀ GIÀN GIÁO, KHÔNG PHẢI KIẾN TRÚC ═══
//
// Nó tồn tại vì một lý do hẹp: bảy file trong `pages/` viết
// `import … from '../services/gas.js'`, mà `gas.js` không còn tồn tại trên
// nền này. Thiếu một module là **cả app không nạp được**, không phải một màn
// hình hỏng — nên phải có một cái gì đó đứng đúng chỗ ấy ngay từ đầu.
//
// Ba loại hàm nằm chung trong đây, và phải phân biệt cho rõ:
//
//   ✓ CHẠY THẬT   — đã có đường tương đương trên Supabase, chỉ đổi lối gọi
//   ⚠ ĐỔI HÌNH    — chạy được nhưng ý nghĩa khác bản cũ, đọc chú thích
//   ⛔ CHƯA LÀM    — ném lỗi có câu chữ đàng hoàng, KHÔNG trả về giả vờ thành công
//
// ⛔ quan trọng hơn cả. Một hàm chưa làm mà trả `{ ok: true }` cho êm chuyện
// là kiểu hỏng tệ nhất trong app này: màn hình báo *"đã sao lưu"* trong khi
// chưa có bản sao lưu nào, và người ta chỉ biết vào đúng ngày cần tới nó.
//
// ⚠ **Đích đến là XOÁ HẲN file này.** Mỗi màn hình được rà lại thì gọi thẳng
//   `services/sb.js` với chữ ký đúng, và bớt một mục ở đây. Còn dòng nào
//   trong file này là còn một màn hình chưa được rà.

import * as sb from './sb.js';

function chuaLam(ten, vaSao) {
  return () => {
    throw new Error('Chức năng "' + ten + '" chưa làm xong trên nền Supabase. '
                    + vaSao);
  };
}

// ============================================================
// ✓ CHẠY THẬT
// ============================================================

/** Có nối được xuống máy chủ không. */
export const coMayChu = sb.coKetNoi;

/** Danh sách gia phả người đang đăng nhập mở được. */
export const layDanhSachGiaPha = sb.layDanhSachGiaPha;

/** Đổi sang một gia phả khác. Nơi gọi phải NẠP LẠI CÂY sau khi hàm này gật. */
export const chonGiaPha = sb.chonGiaPha;

// ============================================================
// ⛔ CHƯA LÀM
// ============================================================

// --- Dựng gia phả mới (`pages/chon-gia-pha.js`) ---
export const taoFileDuLieuMoi = chuaLam('Dựng gia phả mới',
  'Trên Postgres việc này cần một hàm security definer trong cơ sở dữ liệu, ' +
  'vì 02-rls.sql cố ý không cấp cho trình duyệt quyền ghi vào bảng trees.');

// --- Bỏ chọn gia phả (`pages/chon-gia-pha.js`) ---
//
// ⚠ Bản Drive có một "gia phả mặc định" ghi cứng trong `Config.gs`, nên *bỏ
//   chọn* có nghĩa: xoá lựa chọn riêng đi và quay về cây mặc định ấy. Nền này
//   **không có cây mặc định** — mỗi người thấy đúng những cây họ được thêm
//   vào, và cây đầu tiên trong danh sách đóng vai ấy. Nên hàm này không còn
//   việc gì để làm, và giả vờ làm được là nói dối về một thứ không tồn tại.
export const boChonGiaPha = chuaLam('Bỏ chọn gia phả',
  'Nền Supabase không có "gia phả mặc định" để quay về — mỗi người chỉ thấy ' +
  'những gia phả họ được thêm vào. Dùng nút chọn gia phả thay cho nút này.');

