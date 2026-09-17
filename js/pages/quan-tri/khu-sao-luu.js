// ============================================================
// giapha-supabase · js/pages/quan-tri/khu-sao-luu.js
// Vai trò  : Tab *Sao lưu & khôi phục* của `#quan-tri-he-thong` — đổ số đếm
//            SỐNG (`dem_du_lieu`) vào bảng "Đối chiếu dữ liệu" của prototype
//            quantri3, để chủ dự án so bằng mắt với khối "dem" trong file
//            sao lưu đêm gần nhất.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb (demDuLieu) · o-bang
// Sổ tay   : so-tay/trang-quan-tri.md
// Phiên bản: 0.1.0 · Cập nhật: 17/09/2026 (b119)
// ============================================================
//
// ⚠ CHỈ ĐỌC. Không có nút Khôi phục — máy chủ chưa khôi phục được, và vẽ nút
//   là giả vờ giải quyết bằng giao diện (`THIET-KE-QUAN-TRI.md` Khu 4). Nút
//   ấy đã có sẵn trong HTML prototype, `disabled` từ đầu — file này không đụng.
//
// ⚠ KHÔNG có cột "Bản sao lưu" thật: app chạy trong trình duyệt, không có
//   đường nào đọc file trên Google Drive (không OAuth — `CLAUDE.md` mục 3).
//   Bảng chỉ điền được cột "Hiện tại trên DB"; cột kia để "—" và chủ dự án tự
//   mở file sao lưu mới nhất trong Drive ra so bằng mắt — đúng điều
//   `sao-luu/HUONG-DAN-SAO-LUU.md` đã dặn từ đầu.
//
// ⚠ Năm bảng ở đây PHẢI khớp đúng năm bảng `SaoLuu.gs` đếm vào "dem" — đếm
//   THÔ, không lọc `deleted`/`trang_thai`. Đổi một bên mà quên bên kia thì
//   phép so bằng mắt hai cột luôn lệch dù dữ liệu giống hệt nhau.

import { demDuLieu } from '../../services/sb.js';
import { td, span } from './o-bang.js';

const TEN_BANG = [
  ['persons', 'persons — người'],
  ['unions', 'unions — hôn nhân'],
  ['unionChildren', 'union_children — quan hệ cha/mẹ-con'],
  ['treeMembers', 'tree_members — tài khoản có chân'],
  ['changeLog', 'change_log — nhật ký sửa đổi'],
];

/**
 * @param {HTMLElement} sec  `section#quan-tri-he-thong`
 * @param {Array} ds  Danh sách gia phả CHƯA xoá (`layDanhSachGiaPha()`, đã lọc `daXoaLuc`)
 */
export async function veKhuSaoLuu(sec, ds) {
  const tb = sec.querySelector('#sl-doi-chieu-tbody');
  if (!ds.length) { dongRong(tb, 'Chưa có gia phả nào.'); return; }

  dongRong(tb, 'Đang đọc số đếm…');
  const ket = await Promise.all(ds.map((c) => demDuLieu(c.fileId)));

  tb.innerHTML = '';
  ds.forEach((c, i) => {
    const kq = ket[i];
    tb.append(dongTieuDe(c));
    if (!kq.ok) {
      tb.append(dongLoi(kq.loi || 'Không đọc được số đếm.'));
      return;
    }
    if (!kq.dem) {
      tb.append(dongLoi('Máy chủ không trả số cho gia phả này — chỉ Quản trị hệ thống đọc được.'));
      return;
    }
    for (const [ma, nhan] of TEN_BANG) tb.append(dongSo(nhan, kq.dem[ma]));
  });
}

function dongRong(tb, chu) {
  tb.innerHTML = '';
  const tr = document.createElement('tr');
  const o = td(span('muted', chu));
  o.colSpan = 5;
  tr.append(o);
  tb.append(tr);
}

function dongTieuDe(c) {
  const tr = document.createElement('tr');
  const ten = document.createElement('strong');
  ten.textContent = (c.ten || '(chưa đặt tên)') + ' · ' + c.treeCode;
  const o = td(ten);
  o.colSpan = 5;
  tr.append(o);
  return tr;
}

function dongLoi(chu) {
  const tr = document.createElement('tr');
  const o = td(span('muted', chu));
  o.colSpan = 5;
  tr.append(o);
  return tr;
}

function dongSo(nhan, soHienTai) {
  const tr = document.createElement('tr');
  tr.append(
    td(nhan),
    td(span('muted', '—')),
    td(String(soHienTai)),
    td(span('muted', '—')),
    td(span('muted', '')),
  );
  return tr;
}
