// ============================================================
// giapha-supabase · js/pages/quan-tri/khu-quan-tri-he-thong.js
// Vai trò  : Khu QUẢN TRỊ HỆ THỐNG của trang Quản trị — vỏ khu, nạp động sổ
//            tài khoản (`khu-tai-khoan-he-thong.js`, dời từ chip *Toàn hệ
//            thống* của khu Tài khoản ở b118).
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: pages/quan-tri/khu-thanh-vien (mẩu `veLoi`),
//            pages/quan-tri/khu-tai-khoan-he-thong (nạp động)
// Phiên bản: 0.1.0 · Cập nhật: 15/09/2026 (b118)
// ============================================================
//
// ═══ VÌ SAO KHU RIÊNG, KHÔNG CÒN LÀ CHIP CỦA KHU TÀI KHOẢN ═══
//
// `THIET-KE-QUAN-TRI.md` mục 9.1: chip *Toàn hệ thống* "tạm ở khu 2 tới
// b118". Bước này dời nó ra khu riêng trên thanh điều hướng, đúng bốn khu
// của prototype quantri3 (Gia phả · Tài khoản · Kiểm duyệt · Quản trị hệ
// thống). Nội dung — sổ đăng ký cả phần mềm và bảng sâu theo từng tài khoản
// — KHÔNG đổi một dòng nào, vẫn sống nguyên ở `khu-tai-khoan-he-thong.js`.
// File này chỉ là cái vỏ: tựa khu, chỗ chờ, và một lời `import()` động.
//
// ⚠ Nạp ĐỘNG, không nạp tĩnh ở đầu `khung.js`: chỉ Quản trị hệ thống có việc
//   thật ở đây, và ai không phải hạng ấy thì không cần tải 1.300 dòng mã họ
//   không có cửa dùng. Cùng lý do `khu-tai-khoan.js` từng làm với chip này.
//
// ⚠ **Không gác trước bằng cờ `phien.laQuanTriHeThong`.** Cùng luật
//   `khu-kiem-duyet.js` và `khung.js` đã nói: app không tự lọc, máy chủ lọc.
//   `mountToanHeThong()` đã tự nói rõ "máy chủ không trả về tài khoản nào"
//   khi người xem không phải Quản trị hệ thống — một khối giải thích, không
//   phải bảng trống. Thêm một lớp hỏi lại ở đây là hai chỗ nói cùng một câu,
//   và hai chỗ nói cùng một câu là hai chỗ có ngày lệch nhau.

import { veLoi } from './khu-thanh-vien.js';

/**
 * @param {HTMLElement} el
 * @param {object} phien  kết quả `sb.layPhien()` — chưa dùng ở vỏ này, truyền
 *   xuống để có sẵn nếu khu này lớn thêm (Cây mặc định, Sao lưu… các bước sau)
 */
export async function mountKhuQuanTriHeThong(el, phien) {
  el.innerHTML = '';

  const h = document.createElement('h2');
  h.className = 'qt-tua';
  h.textContent = 'Quản trị hệ thống';
  el.append(h);

  const cho = document.createElement('div');
  cho.className = 'qt-cho';
  cho.textContent = 'Đang đọc sổ tài khoản…';
  el.append(cho);

  const napLai = () => mountKhuQuanTriHeThong(el, phien);

  let mo;
  try {
    mo = await import('./khu-tai-khoan-he-thong.js');
  } catch (e) {
    cho.remove();
    el.append(veLoi('Không nạp được khu Quản trị hệ thống: ' +
      (e && e.message ? e.message : 'lỗi không rõ'), napLai));
    return;
  }

  cho.remove();
  await mo.mountToanHeThong(el, napLai);
}
