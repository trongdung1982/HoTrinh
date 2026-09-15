// ============================================================
// giapha-supabase · js/pages/quan-tri/trang-moi.js
// Vai trò  : Trang *Mời gia nhập* một gia phả — đổ dữ liệu vào section
//            `#tree-invite` của prototype quantri3. Địa chỉ `#gia-pha/moi/<mã cây>`.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb, quan-tri/o-goi-y · hop-thoai · o-bang
// Phiên bản: 0.1.0 · Cập nhật: 15/09/2026 (b118c)
// ============================================================
//
// ⚠ **Cây lấy theo MÃ trong địa chỉ, không bao giờ theo `phien.treeId`** —
//   luật 5a. Mã sai thì nói "không thấy", không rơi về cây đang mở.
//
// ⚠ BA Ô Tên · Email · ID tài khoản cùng là ô lọc (quantri3): gõ ô nào cũng
//   hỏi `timTaiKhoan` ở máy chủ, bấm một gợi ý thì điền cả ba. Lọc Ở MÁY CHỦ —
//   `QuanTri.html` cố ý không nạp danh sách tài khoản về rồi lọc tại chỗ.
//
// ⚠ Form cũ (b108) có thêm ô *Mã người trong sơ đồ*; quantri3 bỏ ô ấy. Gắn
//   người cho tài khoản làm ở bảng *Thành viên và quyền* sau khi họ nhận lời.

import {
  layDanhSachGiaPha, dsThanhVien, moiVaoCay, goThanhVien, timTaiKhoan,
} from '../../services/sb.js';
import { ganGoiY, dongTaiKhoan } from './o-goi-y.js';
import { hoi } from './hop-thoai.js';
import { TEN_VAI, td, nut, dongTrong } from './o-bang.js';

/** Hàm gỡ ô gợi ý của lần mở trước — `ganGoiY` treo bộ nghe lên `window`. */
let goGoiY = [];

/**
 * @param {HTMLElement} sec  `section#tree-invite`
 * @param {object} ctx       do `khung.js` dựng — `thamSo` là mã cây
 */
export async function mountTrangMoi(sec, ctx) {
  goGoiY.forEach((go) => go());
  goGoiY = [];

  const nguCanh = sec.querySelectorAll('[data-tree-context]');
  const oTen = sec.querySelector('#invite-name');
  const oEmail = sec.querySelector('#invite-email');
  const oMa = sec.querySelector('#invite-code');
  const oVai = sec.querySelector('#invite-vai');
  const bGui = sec.querySelector('#invite-gui');
  const oLoi = sec.querySelector('#invite-loi');
  const tbody = sec.querySelector('#invite-tbody');

  for (const o of [oTen, oEmail, oMa]) o.value = '';
  oLoi.hidden = true;
  nguCanh.forEach((x) => { x.textContent = ctx.thamSo; });
  dongTrong(tbody, 5, 'Đang đọc…');

  const hashLuc = window.location.hash;
  const kq = await layDanhSachGiaPha();
  if (window.location.hash !== hashLuc) return;

  const cay = kq.ok ? kq.ds.find((c) => c.treeCode === ctx.thamSo) : null;
  if (!cay) {
    nguCanh.forEach((x) => { x.textContent = 'Không thấy gia phả mã ' + ctx.thamSo; });
    bGui.disabled = true;
    dongTrong(tbody, 5, kq.ok
      ? 'Danh sách gia phả của tài khoản này không có mã ấy.'
      : (kq.loi || 'Máy chủ không trả lời.'));
    return;
  }

  nguCanh.forEach((x) => { x.textContent = (cay.ten || '') + ' · ' + cay.treeCode; });

  // Ẩn/mờ KHÔNG phải hàng rào — `moi_vao_cay()` hỏi `co_the_quan_tri()`.
  const duocMoi = cay.toiLaChu || ctx.phien.laQuanTriHeThong;
  bGui.disabled = !duocMoi;
  bGui.title = duocMoi ? '' : 'Chỉ chủ gia phả và Quản trị hệ thống mời được.';

  const dien = (m) => {
    oTen.value = m.hoTen || '';
    oEmail.value = m.email || '';
    oMa.value = m.maNgan || '';
  };
  const tim = async (chuoi) => (await timTaiKhoan(cay.fileId, chuoi)).ds;
  goGoiY = [
    ganGoiY(oTen, { tim, ve: dongTaiKhoan, giaTri: (m) => m.hoTen || m.email, khiChon: dien }),
    ganGoiY(oEmail, { tim, ve: dongTaiKhoan, giaTri: (m) => m.email, khiChon: dien }),
    ganGoiY(oMa, { tim, ve: dongTaiKhoan, giaTri: (m) => m.maNgan || '', khiChon: dien }),
  ];

  const napLoiMoi = () => veLoiMoiDaGui(tbody, cay);

  bGui.onclick = async () => {
    oLoi.hidden = true;
    const email = oEmail.value.trim();
    if (!email) {
      oLoi.textContent = 'Gõ vài chữ vào một ô rồi chọn đúng tài khoản trong danh sách gợi ý.';
      oLoi.hidden = false;
      return;
    }
    bGui.disabled = true;
    const chuCu = bGui.textContent;
    bGui.textContent = 'Đang mời…';
    const r = await moiVaoCay(cay.fileId, email, oVai.value, '');
    bGui.disabled = false;
    bGui.textContent = chuCu;
    if (!r.ok) { oLoi.textContent = r.loi || 'Không mời được.'; oLoi.hidden = false; return; }
    for (const o of [oTen, oEmail, oMa]) o.value = '';
    napLoiMoi();
  };

  napLoiMoi();
}

/**
 * Bảng *Lời mời đã gửi* — dòng `tree_members` chưa duyệt MÀ CÓ `moiLuc`.
 *
 * ⚠ Phân biệt lời mời với đơn xin vào bằng `moiLuc`, KHÔNG bằng người mời —
 *   `moi_boi` khai `on delete set null` (`14` mục 1).
 *
 * ⚠ Nút là *Thu hồi lời mời*, không phải *Xoá khỏi gia phả* — người ta chưa
 *   từng ở trong. Máy chủ dùng chung `goThanhVien` (9.5 đính chính).
 */
async function veLoiMoiDaGui(tbody, cay) {
  dongTrong(tbody, 5, 'Đang đọc…');
  const kq = await dsThanhVien(cay.fileId);
  if (!kq.ok) {
    dongTrong(tbody, 5, kq.loi || 'Không đọc được danh sách.', () => veLoiMoiDaGui(tbody, cay));
    return;
  }

  const ds = kq.ds.filter((t) => !t.daDuyet && t.moiLuc);
  if (!ds.length) { dongTrong(tbody, 5, 'Chưa có lời mời nào đang chờ nhận.'); return; }

  tbody.innerHTML = '';
  for (const t of ds) {
    const b = nut('Thu hồi lời mời', 'danger');
    b.addEventListener('click', async () => {
      const r = await hoi({
        tua: 'Thu hồi lời mời',
        chu: 'Thu hồi lời mời vào “' + (cay.ten || 'gia phả này') + '” đã gửi cho ' + t.email + '?',
        nutOk: 'Thu hồi', kieuOk: 'danger',
        lam: () => goThanhVien(cay.fileId, t.userId),
      });
      if (r) veLoiMoiDaGui(tbody, cay);
    });

    const tr = document.createElement('tr');
    // Cột *Tên tài khoản*: `ds_thanh_vien()` chưa trả tên tài khoản — để trống,
    // không bịa. Email và mã tài khoản đủ để nhận ra người.
    tr.append(td(''), td(t.email), td(t.maNgan), td(TEN_VAI[t.moiVai] || t.moiVai), td(b));
    tbody.append(tr);
  }
}
