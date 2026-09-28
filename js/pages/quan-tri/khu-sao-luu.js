// ============================================================
// giapha-supabase · js/pages/quan-tri/khu-sao-luu.js
// Vai trò  : Tab *Sao lưu & khôi phục* của `#quan-tri-he-thong` — đổ số đếm
//            SỐNG (`dem_du_lieu`) vào bảng "Đối chiếu dữ liệu" của prototype
//            quantri3, để chủ dự án so bằng mắt với khối "dem" trong file
//            sao lưu đêm gần nhất. b147: bảng "Lịch sử sao lưu" + thẻ Sao
//            lưu ở Tổng quan, đọc từ Nhật ký hệ thống (`luoc-do/49`).
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb (demDuLieu · dsNhatKyHeThong) · o-bang
// Sổ tay   : so-tay/trang-quan-tri.md · so-tay/sao-luu.md
// Phiên bản: 0.2.0 · Cập nhật: 28/09/2026 (b147)
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

import { demDuLieu, dsNhatKyHeThong } from '../../services/sb.js';
import { td, span, huyHieu, datHuyHieu, dongTrong, ngayGio } from './o-bang.js';

/** Ba mã việc `luoc-do/49` ghi → chữ + kiểu huy hiệu. Trùng `khu-nhat-ky.js` `TEN_VIEC`. */
const KET_QUA = {
  sao_luu_dem: ['Đạt', ''],
  sao_luu_canh_bao: ['Đã ghi — có cảnh báo', 'wait'],
  sao_luu_hong: ['HỎNG', 'red'],
};

/** Số byte → chữ đọc được. Không có số thì trả '' (ô trống, không vẽ gì). */
function kichCo(n) {
  if (typeof n !== 'number') return '';
  if (n < 1024) return n + ' byte';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
}

/** Câu phụ dưới huy hiệu kết quả: lỗi / thiếu / cảnh báo, cắt ngắn. */
function cauPhu(c) {
  const chu = c.loi || c.thieu || c.canh_bao || '';
  return chu.length > 180 ? chu.slice(0, 180) + '…' : chu;
}

/**
 * Bảng *Lịch sử sao lưu hệ thống* + thẻ *Sao lưu* ở Tổng quan — b147.
 *
 * ⚠ Trình duyệt KHÔNG đọc được Google Drive (không OAuth, `CLAUDE.md` mục 3).
 *   Nguồn ở đây là chiều ngược lại: `SaoLuu.gs` 0.6.0 tự báo mỗi lần chạy vào
 *   Nhật ký hệ thống (`ghi_sao_luu_dem()`, `luoc-do/49`). Chưa dán `49` hoặc
 *   chưa thay `SaoLuu.gs` thì bảng nói đúng vậy, không vẽ số giả.
 * ⚠ Một lần đọc cho cả hai chỗ — `veTongQuan()` không đụng thẻ Sao lưu nữa.
 *
 * @param {HTMLElement} sec  `section#quan-tri-he-thong`
 */
export async function veLichSuSaoLuu(sec) {
  const tb = sec.querySelector('#sl-lich-su-tbody');
  const lanGan = sec.querySelector('#sl-lan-gan');
  dongTrong(tb, 5, 'Đang đọc…');
  const kq = await dsNhatKyHeThong({ loai: 'backup', gioiHan: 300 });
  const ds = kq.ok ? kq.ds.filter((d) => KET_QUA[d.suKien]).slice(0, 30) : [];
  veTheTongQuan(sec, kq, ds[0]);

  if (!kq.ok) { lanGan.hidden = true; dongTrong(tb, 5, kq.loi || 'Không đọc được nhật ký.'); return; }
  if (!ds.length) {
    lanGan.hidden = true;
    dongTrong(tb, 5, 'Chưa có lần sao lưu nào báo về. Cần dán luoc-do/49 và chép SaoLuu.gs 0.6.0 ' +
      'vào dự án Apps Script sao lưu; trước đó xem tại script.google.com → Executions.');
    return;
  }
  const [chuGan, kieuGan] = KET_QUA[ds[0].suKien];
  datHuyHieu(lanGan, 'Gần nhất: ' + ngayGio(ds[0].luc) + ' · ' + chuGan, kieuGan);
  lanGan.hidden = false;

  tb.innerHTML = '';
  for (const d of ds) {
    const c = d.chiTiet || {};
    const [chu, kieu] = KET_QUA[d.suKien];
    const phu = cauPhu(c);
    const tr = document.createElement('tr');
    tr.append(
      td(span('name', ngayGio(d.luc))),
      td(huyHieu(chu, kieu), phu ? span('sub', phu) : ''),
      td(span('sub', d.doiTuong)),
      td(span('sub', kichCo(c.so_byte))),
      // Hành động: không mở được file trên Drive từ trình duyệt — ô để trống.
      td(),
    );
    tb.append(tr);
  }
}

/** Thẻ *Sao lưu & khôi phục* ở tab Tổng quan — lần chạy gần nhất. */
function veTheTongQuan(sec, kq, gan) {
  const dat = (id, chu) => { const el = sec.querySelector('#' + id); if (el) el.textContent = chu; };
  if (!kq.ok || !gan) {
    dat('tq-sl-luc', 'Chưa có');
    dat('tq-sl-mo-ta', !kq.ok ? (kq.loi || 'Không đọc được nhật ký.')
      : 'Máy sao lưu đêm chưa báo lần nào về nhật ký (cần luoc-do/49 + SaoLuu.gs 0.6.0).');
    return;
  }
  const c = gan.chiTiet || {};
  dat('tq-sl-luc', ngayGio(gan.luc));
  dat('tq-sl-mo-ta', gan.suKien === 'sao_luu_hong'
    ? 'Lần gần nhất HỎNG: ' + cauPhu(c)
    : KET_QUA[gan.suKien][0] + ' · ' + [gan.doiTuong, kichCo(c.so_byte)].filter(Boolean).join(' · ') +
      (gan.suKien === 'sao_luu_canh_bao' ? ' — ' + cauPhu(c) : ''));
}

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
