// ============================================================
// giapha-supabase · js/pages/quan-tri/khu-nhat-ky.js
// Vai trò  : Tab *Nhật ký hệ thống* của `#quan-tri-he-thong` + bảng *Nhật ký
//            trong thùng rác* (tab Thùng rác) + thẻ Nhật ký ở *Tổng quan* —
//            đổ dữ liệu vào HTML quantri3 có sẵn.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb · quan-tri/hop-thoai · o-bang
// Sổ tay   : so-tay/nhat-ky-he-thong.md · so-tay/trang-quan-tri.md
// Phiên bản: 0.4.0 · Cập nhật: 28/09/2026 (b150) — tên việc
//            `doi_cong_khai_ca_nhan` (`luoc-do/51`)
// ============================================================
//
// ⚠ Máy chủ TỰ GHI (trigger của `luoc-do/42`), trang này chỉ đọc và dọn.
//   Không có nút "thêm nhật ký" nào, cố ý.
//
// ⚠ Lọc LOẠI và THỜI GIAN chạy ở máy chủ (đọc lại mỗi lần đổi ô lọc); chọn
//   dòng, "chọn nhanh > 30 ngày", "Tải file JSON" chạy trên đúng các dòng
//   đang hiện. Trần 2000 dòng một lần đọc — vượt thì câu đếm nói ra.
//
// ⚠ Xoá = chuyển THÙNG RÁC thành một lô, giữ 120 ngày, phục hồi được. Việc
//   xoá / phục hồi / dọn tự để lại một dòng nhật ký loại *Sao lưu & Dữ liệu*.

import {
  dsNhatKyHeThong, xoaNhatKy, dsLoNhatKyRac, phucHoiLoNhatKy, donNhatKyRac,
} from '../../services/sb.js';
import { hoi, bao } from './hop-thoai.js';
import { td, span, huyHieu, nutNho, hangNut, dongTrong, chepKieu, ngay, ngayGio } from './o-bang.js';

const GIOI_HAN = 2000;
const NGAY_MS = 86400000;

const TEN_LOAI = {
  auth: 'Đăng nhập & Bảo mật',
  qtht: 'Phân quyền QTHT',
  tree: 'Gia phả & Thùng rác',
  backup: 'Sao lưu & Dữ liệu',
};

/** Tên việc + kiểu huy hiệu ('' xanh · 'wait' cam · 'red' đỏ). */
const TEN_VIEC = {
  dang_nhap: ['Đăng nhập', ''],
  tao_tai_khoan: ['Tài khoản mới', ''],
  khoa_tai_khoan: ['Khoá tài khoản', 'red'],
  mo_khoa_tai_khoan: ['Mở khoá tài khoản', 'wait'],
  xoa_tai_khoan: ['Xoá hẳn tài khoản', 'red'],
  moi_qtht: ['Mời làm QTHT', 'wait'],
  nhan_qtht: ['Nhận quyền QTHT', 'wait'],
  ha_qtht: ['Huỷ quyền QTHT', 'red'],
  huy_moi_qtht: ['Huỷ lời mời QTHT', ''],
  cap_quyen_tao_cay: ['Cấp quyền tạo cây', 'wait'],
  thu_quyen_tao_cay: ['Thu hồi quyền tạo cây', ''],
  tao_cay: ['Tạo gia phả', ''],
  xoa_cay: ['Xoá gia phả (ẩn, chờ QTHT)', 'red'],
  tra_lai_cay: ['Trả lại gia phả cho chủ', 'wait'],
  vao_thung_rac: ['Đưa gia phả vào thùng rác', 'red'],
  phuc_hoi_cay: ['Phục hồi gia phả', 'wait'],
  xoa_han_cay: ['Xoá hẳn gia phả', 'red'],
  doi_chu_cay: ['Bàn giao chủ gia phả', 'wait'],
  doi_cay_mac_dinh: ['Đổi cây mặc định', 'wait'],
  doi_truong_cong_khai: ['Đổi trường công khai cho khách', 'wait'],
  doi_cong_khai_ca_nhan: ['Đổi thông tin công khai của một thành viên', 'wait'],
  gop_nguoi: ['Gộp hai bản ghi người', 'wait'],
  sao_luu_dem: ['Sao lưu đêm', ''],
  sao_luu_canh_bao: ['Sao lưu đêm — có cảnh báo', 'wait'],
  sao_luu_hong: ['Sao lưu đêm HỎNG', 'red'],
  xoa_nhat_ky: ['Xoá nhật ký → thùng rác', 'red'],
  phuc_hoi_nhat_ky: ['Phục hồi nhật ký', 'wait'],
  don_nhat_ky_rac: ['Dọn thùng rác nhật ký', 'red'],
  bat_dau_nhat_ky: ['Bắt đầu ghi nhật ký', ''],
};

/** Tên nhóm trường công khai (`luoc-do/47`) cho câu chi tiết. */
const TEN_TRUONG = {
  gioi_tinh: 'giới tính', nam_sinh: 'năm sinh', ngay_sinh: 'ngày sinh',
  ngay_mat: 'ngày mất', anh: 'ảnh', tieu_su: 'tiểu sử',
};

/** Câu chi tiết — phần trống thì không nói (`CLAUDE.md` mục 7). */
function chiTiet(d) {
  const c = d.chiTiet || {};
  const phan = [d.doiTuong];
  if (c.ly_do) phan.push('lý do: “' + c.ly_do + '”');
  if (c.huy_loi_moi_qtht) phan.push('kèm huỷ lời mời QTHT đang chờ');
  if (c.moi_boi) phan.push('lời mời của ' + c.moi_boi);
  if (d.suKien === 'doi_chu_cay') phan.push((c.chu_cu || '(không ai)') + ' → ' + (c.chu_moi || '(không ai)'));
  if (d.suKien === 'doi_cay_mac_dinh') {
    phan[0] = d.doiTuong ? 'Nay: ' + d.doiTuong : 'Bỏ cây mặc định';
    if (c.cu) phan.push('trước: ' + c.cu);
  }
  if (/^doi_(truong_cong_khai|cong_khai_ca_nhan)$/.test(d.suKien) && Array.isArray(c.moi)) {
    phan.push('nay bật: ' + (c.moi.map((m) => TEN_TRUONG[m] || m).join(', ') || 'không trường nào'));
  }
  if (/^sao_luu_/.test(d.suKien)) {
    if (typeof c.so_byte === 'number') phan.push(Math.round(c.so_byte / 1024) + ' KB');
    if (typeof c.da_xoa === 'number' && c.da_xoa) phan.push('dọn ' + c.da_xoa + ' bản cũ');
    const loi = c.loi || c.thieu || c.canh_bao;
    if (loi) phan.push(loi.length > 200 ? loi.slice(0, 200) + '…' : loi);
  }
  if (d.suKien === 'gop_nguoi') {
    phan.push('bỏ ' + (c.ten_thua || '') + ' (' + (c.ma_thua || '') + ')');
    if (Array.isArray(c.hn_gop) && c.hn_gop.length) phan.push('gộp kèm ' + c.hn_gop.length + ' hôn nhân trùng');
  }
  if (d.suKien === 'bat_dau_nhat_ky') phan.push('Mọi việc trước lúc này không có trong nhật ký.');
  return phan.filter(Boolean).join(' · ');
}

/** Khoảng thời gian của ô lọc → `{tu, den}` cho máy chủ. */
function khoang(giaTri) {
  const nay = Date.now();
  if (giaTri === '7d') return { tu: new Date(nay - 7 * NGAY_MS), den: null };
  if (giaTri === '30d') return { tu: new Date(nay - 30 * NGAY_MS), den: null };
  if (giaTri === 'old') return { tu: null, den: new Date(nay - 30 * NGAY_MS) };
  return { tu: null, den: null };
}

/**
 * @param {HTMLElement} sec  `section#quan-tri-he-thong`
 */
export function veKhuNhatKy(sec) {
  const oLoai = sec.querySelector('#sys-log-filter-type');
  const oTG = sec.querySelector('#sys-log-filter-time');
  oLoai.onchange = () => veBang(sec);
  oTG.onchange = () => veBang(sec);
  veBang(sec);
  veRac(sec);
  veTheTongQuan(sec);
}

// ============================================================
// Bảng nhật ký
// ============================================================

async function veBang(sec) {
  const tb = sec.querySelector('#sys-log-tbody');
  const tom = sec.querySelector('#sys-log-summary');
  const oTatCa = sec.querySelector('#sys-log-check-all');
  const bXoa = sec.querySelector('#btn-delete-selected-logs');
  const bCu = sec.querySelector('#btn-select-old-logs');
  const bTai = sec.querySelector('#btn-export-logs');
  const oLoai = sec.querySelector('#sys-log-filter-type');
  const oTG = sec.querySelector('#sys-log-filter-time');

  const loai = oLoai.value === 'all' ? null : oLoai.value;
  const hoi1 = oLoai.value + '|' + oTG.value;
  sec.dataset.nkDangDoc = hoi1;
  dongTrong(tb, 5, 'Đang đọc nhật ký…');
  tom.textContent = '';

  const kq = await dsNhatKyHeThong({ loai, ...khoang(oTG.value), gioiHan: GIOI_HAN });
  if (sec.dataset.nkDangDoc !== hoi1) return;   // ô lọc đã đổi trong lúc chờ

  const chon = new Set();
  const capNhatNut = () => {
    bXoa.disabled = chon.size === 0;
    bXoa.textContent = 'Xóa các dòng đã chọn → Chuyển thùng rác (' + chon.size + ')';
    oTatCa.checked = ds.length > 0 && chon.size === ds.length;
  };

  if (!kq.ok) {
    dongTrong(tb, 5, kq.loi || 'Không đọc được nhật ký.', () => veBang(sec));
    for (const b of [bXoa, bCu, bTai, oTatCa]) b.disabled = true;
    return;
  }
  const ds = kq.ds;
  for (const b of [bCu, bTai, oTatCa]) b.disabled = ds.length === 0;

  tom.textContent = ds.length >= GIOI_HAN
    ? 'Hiện ' + GIOI_HAN + ' dòng mới nhất — thu hẹp ô lọc để thấy dòng cũ hơn'
    : ds.length + ' dòng';

  if (!ds.length) {
    // ⚠ Rỗng: hoặc ô lọc hẹp, hoặc không phải QTHT — máy chủ trả 0 dòng cho người không có cờ.
    dongTrong(tb, 5, (loai || oTG.value !== 'all')
      ? 'Không có dòng nào khớp ô lọc.'
      : 'Máy chủ không trả về dòng nào. Nhật ký chỉ Quản trị hệ thống đọc được.');
    capNhatNut();
    return;
  }

  const hop = new Map();
  tb.innerHTML = '';
  for (const d of ds) {
    const o = document.createElement('input');
    o.type = 'checkbox';
    o.addEventListener('change', () => { if (o.checked) chon.add(d.id); else chon.delete(d.id); capNhatNut(); });
    hop.set(d.id, o);

    const [ten, kieu] = TEN_VIEC[d.suKien] || [d.suKien, ''];
    const tr = document.createElement('tr');
    tr.append(
      chepKieu(td(o), 'text-align:center'),
      td(ngayGio(d.luc)),
      td(huyHieu(ten, kieu), span('sub', TEN_LOAI[d.loai] || d.loai)),
      td(d.emailNguoiLam ? span('name', d.emailNguoiLam) : span('muted', 'Hệ thống')),
      td(chiTiet(d)),
    );
    tb.append(tr);
  }

  const datChon = (ids) => {
    chon.clear();
    for (const id of ids) chon.add(id);
    for (const [id, o] of hop) o.checked = chon.has(id);
    capNhatNut();
  };
  oTatCa.onchange = () => datChon(oTatCa.checked ? ds.map((d) => d.id) : []);
  bCu.onclick = () => {
    const moc = Date.now() - 30 * NGAY_MS;
    const cu = ds.filter((d) => Date.parse(d.luc) < moc).map((d) => d.id);
    if (!cu.length) { bao('Không có dòng cũ', 'Không dòng nào đang hiện cũ hơn 30 ngày.'); return; }
    datChon(cu);
  };
  bTai.onclick = () => taiJson(ds, oLoai, oTG);
  bXoa.onclick = async () => {
    if (!chon.size) return;
    const r = await hoi({
      tua: 'Chuyển nhật ký vào thùng rác',
      chu: 'Chuyển ' + chon.size + ' dòng nhật ký đã chọn vào thùng rác thành một lô. Lô nằm đó ' +
           '120 ngày, phục hồi được bất cứ lúc nào trước khi dọn. Việc này tự để lại một dòng ' +
           'nhật ký mới (ai xoá, bao nhiêu dòng).',
      oNhap: { goiY: 'Ghi chú cho lô (không bắt buộc)' },
      nutOk: 'Chuyển thùng rác', kieuOk: 'danger',
      lam: (ghiChu) => xoaNhatKy([...chon], ghiChu || ''),
    });
    if (r) { veBang(sec); veRac(sec); veTheTongQuan(sec); }
  };
  capNhatNut();
}

/** Tải các dòng ĐANG HIỆN thành file JSON — không gọi máy chủ lần nữa. */
function taiJson(ds, oLoai, oTG) {
  const goi = {
    xuatLuc: new Date().toISOString(),
    loc: { loai: oLoai.value, thoiGian: oTG.value },
    soDong: ds.length,
    ds,
  };
  const blob = new Blob([JSON.stringify(goi, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const p = ngay(goi.xuatLuc).split('/').reverse().join('');
  a.download = 'nhat-ky-he-thong-' + p + '.json';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ============================================================
// Thùng rác nhật ký — tab Thùng rác
// ============================================================

async function veRac(sec) {
  const tb = sec.querySelector('#trash-logs-tbody');
  const dem = sec.querySelector('#rac-nk-dem');
  const bDon = sec.querySelector('#btn-don-nhat-ky-thung-rac');
  dongTrong(tb, 6, 'Đang đọc…');

  const kq = await dsLoNhatKyRac();
  if (!kq.ok) {
    dem.textContent = '';
    dongTrong(tb, 6, kq.loi || 'Không đọc được thùng rác nhật ký.', () => veRac(sec));
    bDon.disabled = true;
    return;
  }

  const ds = kq.ds;
  const soDong = ds.reduce((t, l) => t + l.soDong, 0);
  dem.textContent = ds.length ? ds.length + ' lô · ' + soDong + ' dòng · máy chủ giữ 120 ngày trước khi dọn được' : '';
  bDon.disabled = false;
  bDon.onclick = async () => {
    const du = ds.filter((l) => l.conLai <= 0);
    if (!du.length) {
      bao('Chưa có gì để dọn', ds.length
        ? 'Chưa lô nào nằm đủ 120 ngày — lô sớm nhất còn ' + Math.min(...ds.map((l) => l.conLai)) + ' ngày.'
        : 'Thùng rác nhật ký đang trống.');
      return;
    }
    const r = await hoi({
      tua: 'Dọn thùng rác nhật ký',
      chu: 'Xoá hẳn ' + du.length + ' lô (' + du.reduce((t, l) => t + l.soDong, 0) + ' dòng nhật ký) ' +
           'đã nằm đủ 120 ngày. KHÔNG hoàn tác được.',
      nutOk: 'Xoá hẳn', kieuOk: 'danger',
      lam: () => donNhatKyRac(),
    });
    if (r) { veRac(sec); veBang(sec); }
  };

  if (!ds.length) { dongTrong(tb, 6, 'Thùng rác nhật ký trống.'); return; }

  tb.innerHTML = '';
  for (const l of ds) {
    const bPH = nutNho('Phục hồi', 'warm');
    bPH.addEventListener('click', async () => {
      const r = await hoi({
        tua: 'Phục hồi nhật ký',
        chu: 'Đưa ' + l.soDong + ' dòng của lô “' + l.moTa + '” về lại nhật ký hệ thống?',
        nutOk: 'Phục hồi',
        lam: () => phucHoiLoNhatKy(l.id),
      });
      if (r) { veRac(sec); veBang(sec); veTheTongQuan(sec); }
    });
    const tr = document.createElement('tr');
    tr.append(
      td(l.moTa),
      td(l.soDong + ' dòng'),
      td(ngayGio(l.xoaLuc)),
      td(l.emailXoaBoi || span('muted', 'Hệ thống')),
      td(l.conLai > 0 ? huyHieu('Còn ' + l.conLai + ' ngày', 'wait') : huyHieu('Dọn được', 'red')),
      td(hangNut(bPH)),
    );
    tb.append(tr);
  }
}

// ============================================================
// Thẻ Nhật ký ở Tổng quan
// ============================================================

async function veTheTongQuan(sec) {
  const so = sec.querySelector('#tq-nk-so');
  const moTa = sec.querySelector('#tq-nk-mo-ta');
  const kq = await dsNhatKyHeThong({ tu: new Date(Date.now() - 7 * NGAY_MS), gioiHan: GIOI_HAN });
  if (!kq.ok) { so.textContent = ''; moTa.textContent = kq.loi || 'Không đọc được nhật ký.'; return; }
  so.textContent = kq.ds.length + (kq.ds.length >= GIOI_HAN ? '+' : '') + ' sự kiện';
  const moi = kq.ds[0];
  moTa.textContent = moi
    ? '7 ngày qua · mới nhất: ' + (TEN_VIEC[moi.suKien] || [moi.suKien])[0] + ' lúc ' + ngayGio(moi.luc)
    : 'Không có sự kiện nào trong 7 ngày qua.';
}
