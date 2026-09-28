// ============================================================
// giapha-supabase · js/pages/quan-tri/trang-cong-khai.js
// Vai trò  : Trang *Thông tin công khai trong gia phả* — đổ dữ liệu vào section
//            `#public-info-detail` của quantri3: một tài khoản chọn trường nào
//            về NGƯỜI MÌNH ĐƯỢC GẮN thì khách của cây ấy thấy (b150, `luoc-do/51`).
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb · services/hinh-dang · utils/{text,date} ·
//            quan-tri/{trang-chi-tiet,hop-thoai,khu-quan-tri-he-thong,o-bang}
// Phiên bản: 0.1.0 · Cập nhật: 28/09/2026 (b150)
// Sổ tay   : so-tay/trang-quan-tri.md
// ============================================================
//
// Ba lối vào, như quantri3:
//   `#gia-pha/cong-khai/<mã cây>` · `#thanh-vien/cong-khai/<mã cây>` — của tôi;
//   `#quan-tri-he-thong/cong-khai/<mã tài khoản>~<mã cây>` — QTHT đặt hộ.
// ⚠ Bảy dòng, không phải mười một của prototype: bốn dòng kia (tình trạng sinh
//   tử · Đời · quê quán · liên hệ) không có cột nào để che — vẽ công tắc không
//   làm gì là nói dối. Sáu nhóm = sáu nhóm của `47`, Họ tên cố định.
// ⚠ Khách thấy = nhóm CÂY bật ∩ nhóm NGƯỜI bật — cột "Người ngoài thấy" tính
//   cả hai, không chỉ ô tích của trang này.

import {
  docCongKhaiTaiKhoan, datCongKhaiTaiKhoan, layDanhSachGiaPha, dsTaiKhoanHeThong,
  dsCayCuaTaiKhoan,
} from '../../services/sb.js';
import { rapMotNguoi } from '../../services/hinh-dang.js';
import { fullName, coGiaTri } from '../../utils/text.js';
import { formatDate } from '../../utils/date.js';
import { duongDan } from './trang-chi-tiet.js';
import { bao } from './hop-thoai.js';
import { datTabQuanTriHeThong } from './khu-quan-tri-he-thong.js';
import { td, span, huyHieu, chepKieu, dongTrong, lienKet } from './o-bang.js';

const SO_COT = 5;
const GIOI = { M: 'Nam', F: 'Nữ' };

/** Sáu nhóm của `luoc-do/47`, cùng thứ tự với bảng quantri3. */
export const NHOM_CONG_KHAI = [
  ['gioi_tinh', 'Giới tính'],
  ['nam_sinh', 'Năm sinh'],
  ['ngay_sinh', 'Ngày tháng năm sinh đầy đủ'],
  ['ngay_mat', 'Ngày mất, ngày giỗ & nơi an táng'],
  ['anh', 'Ảnh chân dung đại diện'],
  ['tieu_su', 'Tiểu sử & ghi chú cá nhân'],
];

/**
 * Ô cột *Thông tin công khai* ở ba bảng (quantri3: *"n thông tin →"*). `hua` là
 * MỘT lần gọi `dsCongKhaiTaiKhoan()` cho cả bảng; về rồi mới điền số —
 * `null` = chưa đặt = đủ sáu. Máy chủ chưa dán `51` thì giữ chữ *Xem →*,
 * bấm vào trang nói lý do.
 */
export function lienKetCongKhai(hash, hua, treeId) {
  const a = lienKet('Xem →', hash);
  hua.then((kq) => {
    if (!kq.ok || !kq.theoCay.has(treeId)) return;
    const t = kq.theoCay.get(treeId);
    a.textContent = (1 + (Array.isArray(t) ? t.length : NHOM_CONG_KHAI.length)) + ' thông tin →';
  });
  return a;
}

/**
 * @param {HTMLElement} sec  `section#public-info-detail`
 * @param {object} ctx       do `khung.js` dựng — `thamSo` là mã cây, hoặc
 *                           `<mã tài khoản>~<mã cây>` ở khu QTHT
 */
export async function mountCongKhai(sec, ctx) {
  const $ = (id) => sec.querySelector('#' + id);
  const tuQTHT = ctx.hashQuayVe === 'quan-tri-he-thong';
  const [maTk, maCay] = tuQTHT ? String(ctx.thamSo).split('~') : ['', ctx.thamSo];
  const hashVe = tuQTHT ? duongDan('quan-tri-he-thong', 'tai-khoan', maTk) : ctx.hashQuayVe;
  const ve = () => { window.location.hash = hashVe; };
  if (tuQTHT) datTabQuanTriHeThong('so-tai-khoan');

  const tb = $('pid-fields-tbody');
  const bLuu = $('pid-btn-save');
  $('pid-title').textContent = 'Thông tin công khai · ' + (maCay || '');
  $('pid-meta').textContent = '';
  $('pid-count-badge').textContent = '';
  dongTrong(tb, SO_COT, 'Đang đọc…');
  for (const id of ['pid-back-btn', 'pid-btn-back-bottom', 'pid-btn-cancel']) $(id).onclick = ve;
  bLuu.disabled = true;

  const hashLuc = window.location.hash;
  const napLai = () => mountCongKhai(sec, ctx);
  const lo = (chu) => { if (window.location.hash === hashLuc) dongTrong(tb, SO_COT, chu, napLai); };

  // Mã trong địa chỉ → treeId (+ userId khi QTHT đặt hộ).
  let treeId = null, userId = null, tenTk = '';
  if (tuQTHT) {
    const kq = await dsTaiKhoanHeThong();
    const tk = kq.ok && kq.ds.find((t) => t.maNgan === maTk);
    if (!tk) { lo(kq.ok ? 'Không thấy tài khoản mã ' + maTk + '.' : kq.loi); return; }
    const kqCay = await dsCayCuaTaiKhoan(tk.userId);
    const c = kqCay.ok && kqCay.ds.find((x) => x.maCay === maCay);
    if (!c) { lo(kqCay.ok ? 'Tài khoản ' + maTk + ' không ở gia phả ' + maCay + '.' : kqCay.loi); return; }
    treeId = c.treeId; userId = tk.userId; tenTk = (tk.hoTen || tk.email) + ' (' + tk.maNgan + ')';
  } else {
    const kq = await layDanhSachGiaPha();
    const c = kq.ok && kq.ds.find((x) => x.treeCode === maCay);
    if (!c) { lo(kq.ok ? 'Không thấy gia phả mã ' + maCay + ' trong danh sách của bạn.' : kq.loi); return; }
    treeId = c.fileId;
    const p = ctx.phien || {};
    tenTk = (p.hoTen || p.email || '') + (p.maNgan ? ' (' + p.maNgan + ')' : '');
  }

  const d = await docCongKhaiTaiKhoan(treeId, userId);
  if (window.location.hash !== hashLuc) return;
  if (!d.ok) { lo(d.loi); return; }

  const nguoi = rapMotNguoi(d.nguoi);
  const tenCay = (d.ten || '') + ' (' + (d.maCay || maCay) + ')';
  const tenNguoi = nguoi ? fullName(nguoi) + ' (ID: ' + nguoi.id + ')' : 'Chưa gắn người';
  $('pid-title').textContent = 'Thông tin công khai · ' + tenCay;
  $('pid-meta').textContent = tuQTHT
    ? '[Quản trị hệ thống] Tài khoản: ' + tenTk + ' · Nhân vật trong sơ đồ: ' + tenNguoi
    : '[Tài khoản của bạn] Bạn: ' + tenTk + ' · Nhân vật của bạn: ' + tenNguoi;
  $('pid-breadcrumb').textContent = tuQTHT
    ? '/ Sổ tài khoản / Các gia phả của ' + tenTk + ' / Thông tin công khai'
    : '/ ' + ctx.chuQuayVe + ' / Thông tin công khai của tôi trong ' + tenCay;
  $('pid-back-btn').textContent = tuQTHT ? '← Quay lại Các gia phả của ' + tenTk : '← Quay lại ' + ctx.chuQuayVe;

  const bat = new Set(Array.isArray(d.truong) ? d.truong : NHOM_CONG_KHAI.map(([ma]) => ma));
  const cay = new Set(Array.isArray(d.truongCay) ? d.truongCay : []);
  const ve_ = () => veBang($, nguoi, d.doi, bat, cay);
  ve_();

  $('pid-btn-check-all').onclick = () => { for (const [ma] of NHOM_CONG_KHAI) bat.add(ma); ve_(); };
  $('pid-btn-uncheck-all').onclick = () => { bat.clear(); ve_(); };
  bLuu.disabled = false;
  bLuu.onclick = async () => {
    bLuu.disabled = true;
    const kq = await datCongKhaiTaiKhoan(treeId, userId, [...bat]);
    bLuu.disabled = false;
    if (!kq.ok) { await bao('Không lưu được', kq.loi); return; }
    await bao(tuQTHT ? 'Quản trị hệ thống đã lưu' : 'Lưu thành công',
      'Đã lưu thiết lập thông tin công khai trong gia phả "' + tenCay + '". Hiện có ' +
      (1 + bat.size) + '/' + (1 + NHOM_CONG_KHAI.length) +
      ' trường được phép hiển thị cho khách và người ngoài.');
    ve();
  };
}

// ============================================================
// Bảng bảy dòng
// ============================================================

function veBang($, nguoi, doi, bat, cay) {
  const tb = $('pid-fields-tbody');
  tb.innerHTML = '';
  const gt = giaTri(nguoi);

  // Họ tên — cố định, không công tắc (quantri3: "Bắt buộc công khai để nhận diện sơ đồ").
  tb.append(dong('Họ và tên nhân vật', gt.ten, true, gt.ten,
    chepKieu(span('muted', 'Cố định'), 'font-size:11px'), 'Bắt buộc công khai để nhận diện sơ đồ'));

  for (const [ma, chu] of NHOM_CONG_KHAI) {
    const moNguoi = bat.has(ma);
    // Bật ngày sinh đủ thì năm đi theo (`che_nguoi` của `47`).
    const moThat = ma === 'nam_sinh'
      ? (moNguoi || bat.has('ngay_sinh')) && (cay.has('nam_sinh') || cay.has('ngay_sinh'))
      : moNguoi && cay.has(ma);
    const lbl = chepKieu(document.createElement('label'), 'cursor:pointer;display:inline-flex;align-items:center;gap:4px');
    const o = chepKieu(document.createElement('input'), 'cursor:pointer;width:16px;height:16px');
    o.type = 'checkbox';
    o.checked = moNguoi;
    o.onchange = () => { if (o.checked) bat.add(ma); else bat.delete(ma); veBang($, nguoi, doi, bat, cay); };
    lbl.append(o, chepKieu(span('', moNguoi ? 'Bật' : 'Tắt'), 'font-size:12px'));
    const vi = !moThat && moNguoi && !cay.has(ma) ? 'Gia phả này đang tắt trường ấy với mọi khách' : '';
    tb.append(dong(chu, gt[ma], moNguoi, moThat ? gt[ma] : '-', lbl, vi));
  }

  if (coGiaTri(doi)) {
    // Đời không có công tắc ở máy chủ — luôn hiện, nói thẳng thay vì vẽ ô tích giả.
    tb.append(dong('Đời thứ trong tộc', 'Đời ' + doi, true, 'Đời ' + doi,
      chepKieu(span('muted', 'Cố định'), 'font-size:11px'), 'Sơ đồ luôn hiện Đời'));
  }

  const n = 1 + bat.size;
  $('pid-count-badge').textContent = n + ' / ' + (1 + NHOM_CONG_KHAI.length) + ' trường công khai';
}

function dong(ten, giaTriNhap, laCongKhai, khachThay, oCuoi, viSao) {
  const tr = document.createElement('tr');
  const oKhach = chepKieu(td(chepKieu(span('muted', khachThay || '-'), 'font-family:monospace;font-size:12px')),
    'text-align:center');
  if (viSao) oKhach.title = viSao;
  const oTen = document.createElement('strong');
  oTen.textContent = ten;
  tr.append(
    td(oTen),
    td(chepKieu(span('', giaTriNhap || '—'), 'color:var(--ink)')),
    td(huyHieu(laCongKhai ? 'Công khai' : 'Riêng tư', laCongKhai ? '' : 'wait')),
    oKhach,
    chepKieu(td(oCuoi), 'text-align:center'),
  );
  return tr;
}

/** Giá trị đang nhập của người được gắn, theo sáu nhóm — trống thì '—'. */
function giaTri(p) {
  if (!p) return { ten: '— (Chưa gắn người)' };
  const nam = (p.birth && (String(p.birth.iso || '').slice(0, 4) ||
    (String(p.birth.raw || '').match(/\d{4}/) || [''])[0])) || '';
  const noi = (x) => [formatDate(x), x && x.place].filter(coGiaTri).join(' · ');
  const mat = [noi(p.death), p.vn && p.vn.gio ? 'Giỗ ' + p.vn.gio : '',
    p.burialPlace ? 'An táng: ' + p.burialPlace : ''].filter(coGiaTri).join(' · ');
  const tieuSu = [p.note, p.title, p.occupation, p.education, p.religion, p.residence, p.nationality]
    .filter(coGiaTri).join(' · ');
  return {
    ten: fullName(p) || p.id,
    gioi_tinh: GIOI[p.sex] || '',
    nam_sinh: nam,
    ngay_sinh: noi(p.birth),
    ngay_mat: mat,
    anh: p.photoFileId ? 'Có ảnh (' + p.photoFileId + ')' : '',
    tieu_su: tieuSu.length > 80 ? tieuSu.slice(0, 80) + '…' : tieuSu,
  };
}
