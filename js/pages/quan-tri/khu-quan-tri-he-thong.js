// ============================================================
// giapha-supabase · js/pages/quan-tri/khu-quan-tri-he-thong.js
// Vai trò  : Khu QUẢN TRỊ HỆ THỐNG — đổ dữ liệu vào section
//            `#quan-tri-he-thong` của prototype quantri3 (7 tab) và trang
//            `#sys-default-tree-selector`.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb, quan-tri/trang-chi-tiet · hop-thoai · o-bang ·
//            khu-thanh-vien (mẩu `veLoi`), khu-tai-khoan-he-thong (nạp động)
// Phiên bản: 1.0.0 · Cập nhật: 15/09/2026 (b118c)
//            1.0.0 (b118c) Bảy tab của quantri3. Gắn thật: *Tổng quan* ·
//            *Cây mặc định* (+ trang chọn cây) · *Thùng rác* (dời từ khu Gia
//            phả). Tab *Sổ tài khoản* TẠM vẽ bằng `khu-tai-khoan-he-thong.js`
//            như b118. Ba tab máy chủ chưa có gì để đọc — *Tạo tài khoản* ·
//            *Sao lưu* · *Nhật ký* — vẽ đúng HTML quantri3 nhưng mờ, kèm câu
//            nói thẳng việc ấy làm ở bước nào.
//            0.1.0 (b118) vỏ khu, nạp động sổ tài khoản.
// ============================================================
//
// ⚠ **Không gác trước bằng cờ `phien.laQuanTriHeThong`.** App không tự lọc,
//   máy chủ lọc: người không có cờ gõ thẳng `#quan-tri-he-thong` thì mọi hàm
//   ở đây trả rỗng, và màn hình nói đúng thế.
//
// ⚠ Nạp ĐỘNG sổ tài khoản — ai không phải Quản trị hệ thống thì không cần tải
//   1.300 dòng mã họ không có cửa dùng. Và chỉ nạp khi mở đúng tab ấy.

import {
  layDanhSachGiaPha, layCayMacDinh, datCayMacDinh, dsTaiKhoanHeThong, dsThanhVien,
  duyetXoaCay, huyXinXoaCay, phucHoiCay, donThungRac, xoaAnhThat,
} from '../../services/sb.js';
import { veLoi } from './khu-thanh-vien.js';
import { duongDan } from './trang-chi-tiet.js';
import { hoi, bao } from './hop-thoai.js';
import {
  td, span, huyHieu, nut, nutMo, hangNut, dongTrong, ngay, ngayGio,
} from './o-bang.js';

/**
 * ⚠⚠ Số ngày một cây nằm trong thùng rác trước khi dọn được — ĐÚNG luật MÁY
 *   CHỦ ĐANG CHẠY (`16-thung-rac-cay.sql`: 30 ngày). `THIET-KE-NHIEU-CAY.md`
 *   11.9 đã chốt 120 ngày, nhưng SQL đổi ở b118b. Đổi hằng số này CÙNG LÚC
 *   dán SQL ấy — màn hình đi trước máy chủ là màn hình nói dối.
 */
const NGAY_THUNG_RAC = 30;

/** Tab đang mở — giữ qua các lần nạp lại và khi đi sang trang chọn cây rồi về. */
let tabDangMo = 'tong-quan';

/**
 * @param {HTMLElement} sec  `section#quan-tri-he-thong`
 * @param {object} phien
 */
export async function mountKhuQuanTriHeThong(sec, phien) {
  const napLai = () => mountKhuQuanTriHeThong(sec, phien);

  const oTam = sec.querySelector('[data-sys-pane="so-tai-khoan"] [data-tam]');
  oTam.innerHTML = '';
  delete oTam.dataset.daNap;

  ganTab(sec, oTam);
  veChuaCo(sec);

  const hashLuc = window.location.hash;
  const [kq, cmd, tk] = await Promise.all([
    layDanhSachGiaPha(), layCayMacDinh(), dsTaiKhoanHeThong(),
  ]);
  if (window.location.hash !== hashLuc) return;

  const ds = kq.ok ? (kq.ds || []) : [];
  veTongQuan(sec, ds, cmd, tk);
  veCayMacDinh(sec, ds.filter((c) => !c.daXoaLuc), cmd, napLai);
  veThungRac(sec, kq, napLai);
}

// ============================================================
// Tab
// ============================================================

function ganTab(sec, oTam) {
  const chon = (ten) => { tabDangMo = ten; toTab(sec, oTam); };
  for (const b of sec.querySelectorAll('[data-sys-tab]')) b.onclick = () => chon(b.dataset.sysTab);
  for (const b of sec.querySelectorAll('[data-sys-goto]')) b.onclick = () => chon(b.dataset.sysGoto);
  toTab(sec, oTam);
}

function toTab(sec, oTam) {
  for (const b of sec.querySelectorAll('[data-sys-tab]')) {
    b.classList.toggle('active', b.dataset.sysTab === tabDangMo);
  }
  for (const p of sec.querySelectorAll('[data-sys-pane]')) {
    p.hidden = p.dataset.sysPane !== tabDangMo;
  }
  if (tabDangMo === 'so-tai-khoan' && !oTam.dataset.daNap) napSoTaiKhoan(oTam);
}

/** TẠM (b118c) — sổ tài khoản chưa chuyển sang bảng quantri3. */
async function napSoTaiKhoan(oTam) {
  oTam.dataset.daNap = '1';
  oTam.textContent = 'Đang đọc sổ tài khoản…';
  const napLai = () => { oTam.innerHTML = ''; napSoTaiKhoan(oTam); };

  let mo;
  try {
    mo = await import('./khu-tai-khoan-he-thong.js');
  } catch (e) {
    oTam.innerHTML = '';
    oTam.append(veLoi('Không nạp được sổ tài khoản: ' +
      (e && e.message ? e.message : 'lỗi không rõ'), napLai));
    return;
  }
  oTam.innerHTML = '';
  await mo.mountToanHeThong(oTam, napLai);
}

// ============================================================
// Ba tab máy chủ chưa có gì — nói thẳng, không vẽ số giả
// ============================================================

function veChuaCo(sec) {
  const dat = (id, chu) => { sec.querySelector('#' + id).textContent = chu; };

  dat('ttk-chua-co',
    'Chưa làm được: tạo tài khoản cần khoá service_role của Supabase, và khoá ấy chỉ ' +
    'được sống trong một Edge Function — hạ tầng dự án chưa có. Việc riêng, làm sau b120.');
  dat('sl-chua-co',
    'Chưa làm: lịch sử sao lưu và bảng đối chiếu 5 số đếm là bước b119. Màn hình này ' +
    'chưa đọc được kết quả các lần sao lưu đêm.');
  dat('nk-chua-co',
    'Chưa làm: nhật ký hệ thống cần một bảng mới ở máy chủ — việc riêng, làm sau b120. ' +
    'Lịch sử sửa dữ liệu cây vẫn xem ở khu Kiểm duyệt.');

  dongTrong(sec.querySelector('#sl-lich-su-tbody'), 5, 'Chưa đọc được lịch sử sao lưu (b119).');
  dongTrong(sec.querySelector('#sl-doi-chieu-tbody'), 5, 'Chưa có số đếm đối chiếu (b119).');
  dongTrong(sec.querySelector('#sys-log-tbody'), 5, 'Chưa có nhật ký hệ thống ở máy chủ.');
  dongTrong(sec.querySelector('#trash-logs-tbody'), 6, 'Chưa có nhật ký hệ thống ở máy chủ.');
  dongTrong(sec.querySelector('#default-tree-fields-tbody'), 4,
    'Công khai theo từng trường chưa có ở máy chủ — làm sau b120.');
}

// ============================================================
// Tổng quan — sáu thẻ
// ============================================================

function veTongQuan(sec, ds, cmd, tk) {
  const dat = (id, chu) => { sec.querySelector('#' + id).textContent = chu; };

  if (tk.ok) {
    const soQT = tk.ds.filter((t) => t.laQuanTriHeThong).length;
    const soTao = tk.ds.filter((t) => t.duocTaoCay).length;
    dat('tq-tk-so', tk.ds.length + ' tài khoản');
    dat('tq-tk-mo-ta', soQT + ' Quản trị hệ thống · ' + soTao + ' được tạo cây');
  } else {
    dat('tq-tk-so', '');
    dat('tq-tk-mo-ta', tk.loi || 'Không đọc được sổ tài khoản.');
  }

  dat('tq-qtht-so', 'Chưa có');
  dat('tq-qtht-mo-ta', 'Bổ nhiệm hai chữ ký chưa có ở máy chủ — làm ở b118b.');

  const cay = ds.find((c) => c.fileId === cmd && !c.daXoaLuc);
  dat('tq-cmd-ten', cay ? (cay.ten || cay.treeCode) : 'Chưa đặt');
  dat('tq-cmd-mo-ta', cay
    ? 'Mã: ' + cay.treeCode + ' · Đang hiển thị cho khách và người chưa có quyền'
    : 'Người chưa có quyền chưa mở được cây nào.');

  dat('tq-sl-luc', 'Chưa có');
  dat('tq-sl-mo-ta', 'Màn hình Sao lưu làm ở b119.');

  const rac = ds.filter((c) => c.daXoaLuc);
  const xin = ds.filter((c) => c.xinXoaLuc && !c.daXoaLuc);
  dat('tq-rac-so', rac.length + ' cây');
  dat('tq-rac-mo-ta', [
    rac[0] ? (rac[0].ten || '') + ' (' + rac[0].treeCode + ') · Còn ' + conLaiNgay(rac[0].daXoaLuc) + ' ngày' : '',
    xin.length ? xin.length + ' yêu cầu xin xóa chờ duyệt' : '',
  ].filter(Boolean).join(' · ') || 'Thùng rác trống, không có đơn xin xoá.');

  dat('tq-nk-so', 'Chưa có');
  dat('tq-nk-mo-ta', 'Cần bảng nhật ký mới ở máy chủ — làm sau b120.');
}

// ============================================================
// Cây mặc định
// ============================================================
//
// ⚠ Cây mặc định là **công tắc của cả hệ thống**: người chưa có chân ở đâu cả
//   mở app sẽ vào thẳng cây này, chỉ xem. KHÁC công tắc *Cho thấy tên* của
//   từng chủ cây (mở TÊN cây) — cái này mở NỘI DUNG một cây.

function veCayMacDinh(sec, ds, cmd, napLai) {
  const cay = ds.find((c) => c.fileId === cmd) || null;

  const bMo = sec.querySelector('#btn-open-tree-selector');
  bMo.textContent = cay
    ? cay.ten + ' · ' + cay.treeCode + ' (Bấm để xem danh sách & chọn cây khác →)'
    : 'Chưa đặt (Bấm để xem danh sách & chọn cây →)';
  bMo.onclick = () => { window.location.hash = duongDan('quan-tri-he-thong', 'cay-mac-dinh', 'chon'); };

  // Trường trống thì không vẽ hàng đó — `CLAUDE.md` mục 7.
  const hang = (id, chu) => {
    const o = sec.querySelector('#' + id);
    o.closest('li').hidden = !cay || !chu;
    o.textContent = chu || '';
    return o;
  };
  hang('cmd-chu', cay && cay.emailChu);
  const oCK = hang('cmd-cong-khai', cay && (cay.choNguoiLaThayTen ? 'Đang bật cho khách' : 'Riêng tư (Chưa bật)'));
  oCK.className = 'badge' + (cay && !cay.choNguoiLaThayTen ? ' wait' : '');
  hang('cmd-so-nguoi', cay && cay.soNguoi + ' người');
  const oTV = hang('cmd-so-tv', cay ? '…' : '');
  if (cay) {
    dsThanhVien(cay.fileId).then((r) => {
      if (r.ok) oTV.textContent = r.ds.filter((t) => t.daDuyet).length + ' người';
      else oTV.closest('li').hidden = true;
    });
  }
  sec.querySelector('#cmd-truong-mo-ta').textContent =
    'Công khai theo từng trường chưa có ở máy chủ — làm sau b120.';
  sec.querySelector('#btn-view-default-tree-public-detail').textContent = 'Chưa có';

  const chon = sec.querySelector('#sys-select-cay-mac-dinh');
  chon.innerHTML = '';
  for (const c of ds) {
    const op = document.createElement('option');
    op.value = c.fileId;
    op.textContent = c.ten + ' · ' + c.treeCode +
      ' (Chủ cây: ' + (c.emailChu || '—') + ' · ' + c.soNguoi + ' người)';
    chon.append(op);
  }
  const khong = document.createElement('option');
  khong.value = '';
  khong.textContent = '-- Không đặt cây mặc định --';
  chon.append(khong);
  chon.value = cay ? cay.fileId : '';

  const oLoi = sec.querySelector('#cmd-loi');
  oLoi.hidden = true;

  sec.querySelector('#btn-save-cay-mac-dinh').onclick = async () => {
    const moi = ds.find((c) => c.fileId === chon.value);
    const kq = await hoi({
      tua: 'Lưu cây mặc định',
      chu: moi
        ? 'Đặt “' + moi.ten + '” làm cây mặc định? Người chưa có quyền sẽ mở được cây này ở chế độ chỉ xem.'
        : 'Bỏ cây mặc định? Người chưa có quyền sẽ không mở được cây nào.',
      nutOk: 'Lưu thay đổi', kieuOk: 'primary',
      lam: () => datCayMacDinh(chon.value || null),
    });
    if (kq) napLai();
  };

  sec.querySelector('#btn-clear-cay-mac-dinh').onclick = async () => {
    const kq = await hoi({
      tua: 'Gỡ bỏ cây mặc định',
      chu: 'Người chưa có quyền sẽ không mở được cây nào nữa. Gỡ bỏ?',
      nutOk: 'Gỡ bỏ', kieuOk: 'danger',
      lam: () => datCayMacDinh(null),
    });
    if (kq) napLai();
  };
}

/**
 * Trang *Chọn cây gia phả mặc định* — `#quan-tri-he-thong/cay-mac-dinh/chon`.
 *
 * ⚠ Chỉ cây đã bật *Cho thấy tên* mới chọn được (quantri3). Đó là LUẬT GIAO
 *   DIỆN của prototype, không phải hàng rào máy chủ — `dat_cay_mac_dinh()`
 *   không hỏi cờ ấy.
 */
export async function mountChonCayMacDinh(sec, ctx) {
  tabDangMo = 'cay-mac-dinh';
  const tbody = sec.querySelector('#dts-tbody');
  const oHienTai = sec.querySelector('#dts-current-badge');
  dongTrong(tbody, 8, 'Đang đọc…');
  oHienTai.textContent = '';

  const hashLuc = window.location.hash;
  const [kq, cmd] = await Promise.all([layDanhSachGiaPha(), layCayMacDinh()]);
  if (window.location.hash !== hashLuc) return;

  const napLai = () => mountChonCayMacDinh(sec, ctx);
  if (!kq.ok) { dongTrong(tbody, 8, kq.loi || 'Không đọc được danh sách gia phả.', napLai); return; }

  const ds = (kq.ds || []).filter((c) => !c.daXoaLuc);
  const hienTai = ds.find((c) => c.fileId === cmd);
  oHienTai.textContent = hienTai ? hienTai.ten + ' · ' + hienTai.treeCode : 'Chưa đặt';

  if (!ds.length) { dongTrong(tbody, 8, 'Chưa có gia phả nào.'); return; }

  tbody.innerHTML = '';
  for (const c of ds) {
    const laMacDinh = c.fileId === cmd;

    const oTV = td('');
    dsThanhVien(c.fileId).then((r) => {
      if (r.ok) oTV.textContent = r.ds.filter((t) => t.daDuyet).length + ' người';
    });

    let oViec;
    if (laMacDinh) {
      const s = span('muted', 'Cây hiện tại');
      s.style.fontSize = '12px';
      oViec = s;
    } else if (!c.choNguoiLaThayTen) {
      oViec = nutMo('Cần bật công khai trước',
        'Cần bật Cho thấy tên (công khai sơ đồ) trước khi chọn làm mặc định');
    } else {
      oViec = nut('Chọn làm mặc định', 'warm');
      oViec.addEventListener('click', async () => {
        const r = await hoi({
          tua: 'Chọn cây mặc định',
          chu: 'Đặt “' + c.ten + '” làm cây mặc định? Người chưa có quyền sẽ mở được cây này ở chế độ chỉ xem.',
          nutOk: 'Chọn làm mặc định',
          lam: () => datCayMacDinh(c.fileId),
        });
        if (r) napLai();
      });
    }

    const tr = document.createElement('tr');
    const oMa = document.createElement('strong');
    oMa.textContent = c.treeCode;
    tr.append(
      td(span('name', c.ten || '(chưa đặt tên)')),
      td(oMa),
      td(c.emailChu || ''),
      td(c.soNguoi + ' người'),
      oTV,
      td(c.choNguoiLaThayTen ? huyHieu('Đang bật cho khách') : huyHieu('Riêng tư (Chưa bật)', 'wait')),
      td(laMacDinh ? huyHieu('Đang là mặc định') : huyHieu('Không', 'wait')),
      td(oViec),
    );
    tbody.append(tr);
  }
}

// ============================================================
// Thùng rác — dời từ khu Gia phả (b110), đúng chỗ quantri3 đặt
// ============================================================
//
// ⚠ Máy chủ ĐANG CHẠY luật `16`: chủ cây XIN → Quản trị hệ thống DUYỆT → cây
//   vào thùng rác `NGAY_THUNG_RAC` ngày → dọn tay. Bảng *"Cây gia phả chủ cây
//   đã xóa"* của quantri3 vì thế đang chứa ĐƠN xin xoá, và cây trong đó vẫn
//   dùng bình thường — câu đầu bảng nói đúng thế cho tới b118b.
//
// ⚠ Dọn = xoá cứng, cửa duy nhất của cả phần mềm. Sau khi máy chủ gật phải gọi
//   `xoaAnhThat(dsAnh)` — ảnh trong kho không đi theo `delete` của Postgres.

function conLaiNgay(daXoaLuc) {
  const t = Date.parse(daXoaLuc);
  if (Number.isNaN(t)) return NGAY_THUNG_RAC;
  return Math.max(0, NGAY_THUNG_RAC - Math.floor((Date.now() - t) / 86400000));
}

async function donVaXoaAnh(ids) {
  const kq = await donThungRac(ids);
  if (kq && kq.ok && Array.isArray(kq.dsAnh) && kq.dsAnh.length) await xoaAnhThat(kq.dsAnh);
  return kq;
}

/** Máy chủ BỎ QUA cây chưa đủ ngày và kể tên ở `boQua` — phải nói ra. */
function baoBoQua(kq) {
  const bo = kq && kq.kq && kq.kq.boQua;
  if (Array.isArray(bo) && bo.length) {
    bao('Có gia phả chưa dọn được', 'Máy chủ bỏ qua ' + bo.length +
      ' gia phả chưa đủ ' + NGAY_THUNG_RAC + ' ngày trong thùng rác.');
  }
}

function veThungRac(sec, kq, napLai) {
  const tbRac = sec.querySelector('#rac-tbody');
  const tbXin = sec.querySelector('#xin-xoa-tbody');
  const bDon = sec.querySelector('#btn-don-thung-rac');
  bDon.textContent = 'Dọn dẹp thùng rác (xóa cây > ' + NGAY_THUNG_RAC + ' ngày)';

  if (!kq.ok) {
    dongTrong(tbRac, 7, kq.loi || 'Không đọc được danh sách gia phả.', napLai);
    dongTrong(tbXin, 6, kq.loi || 'Không đọc được danh sách gia phả.', napLai);
    bDon.disabled = true;
    return;
  }

  const ds = kq.ds || [];
  const rac = ds.filter((c) => c.daXoaLuc);
  const xin = ds.filter((c) => c.xinXoaLuc && !c.daXoaLuc);

  sec.querySelector('#rac-dem').textContent = rac.length + ' cây · máy chủ giữ ' +
    NGAY_THUNG_RAC + ' ngày trước khi dọn được';
  sec.querySelector('#xin-xoa-dem').textContent = xin.length + ' đơn xin xoá đang chờ · ' +
    'cây vẫn dùng bình thường tới khi duyệt (luật hiện hành, đổi ở b118b)';
  sec.querySelector('#rac-nk-dem').textContent = '';

  // — Cây trong thùng rác —
  const duDon = rac.filter((c) => conLaiNgay(c.daXoaLuc) <= 0);
  bDon.disabled = false;
  bDon.onclick = async () => {
    if (!duDon.length) {
      bao('Chưa có gì để dọn', 'Chưa gia phả nào nằm đủ ' + NGAY_THUNG_RAC + ' ngày trong thùng rác.');
      return;
    }
    const soNguoi = duDon.reduce((t, c) => t + (c.soNguoi || 0), 0);
    const r = await hoi({
      tua: 'Dọn dẹp thùng rác',
      chu: 'Xoá hẳn ' + duDon.length + ' gia phả (' + duDon.map((c) => c.ten).join(' · ') +
           '), tổng ' + soNguoi + ' người, cùng toàn bộ hôn nhân, ảnh và nhật ký thay đổi. ' +
           'Việc này KHÔNG hoàn tác được — sau đây chỉ còn bản sao lưu đêm.',
      nutOk: 'Xoá hẳn', kieuOk: 'danger',
      lam: () => donVaXoaAnh(duDon.map((c) => c.fileId)),
    });
    if (r) { baoBoQua(r); napLai(); }
  };

  if (!rac.length) {
    dongTrong(tbRac, 7, 'Thùng rác trống.');
  } else {
    tbRac.innerHTML = '';
    for (const c of rac) {
      const conLai = conLaiNgay(c.daXoaLuc);

      const bKhoiPhuc = nut('Khôi phục', 'warm');
      bKhoiPhuc.addEventListener('click', async () => {
        const r = await hoi({
          tua: 'Khôi phục gia phả',
          chu: 'Lấy “' + c.ten + '” ra khỏi thùng rác? Mọi người có chân trong cây dùng lại được ngay.',
          nutOk: 'Khôi phục',
          lam: () => phucHoiCay(c.fileId),
        });
        if (r) napLai();
      });

      const bXoa = conLai > 0
        ? nutMo('Xóa vĩnh viễn', 'Còn ' + conLai + ' ngày nữa mới dọn được.', 'danger')
        : nut('Xóa vĩnh viễn', 'danger');
      bXoa.addEventListener('click', async () => {
        const r = await hoi({
          tua: 'Xóa vĩnh viễn',
          chu: 'Xoá hẳn “' + c.ten + '” (' + c.soNguoi + ' người) cùng hôn nhân, ảnh và nhật ký ' +
               'thay đổi. KHÔNG hoàn tác được — sau đây chỉ còn bản sao lưu đêm.',
          nutOk: 'Xoá hẳn', kieuOk: 'danger',
          lam: () => donVaXoaAnh([c.fileId]),
        });
        if (r) { baoBoQua(r); napLai(); }
      });

      const tr = document.createElement('tr');
      tr.append(
        td(span('name', c.ten || '(chưa đặt tên)')),
        td(c.treeCode),
        td(c.emailChu || ''),
        td(ngay(c.daXoaLuc)),
        td(''),   // `ds_gia_pha()` không trả người duyệt xoá — để trống, không bịa
        td(conLai > 0 ? huyHieu('Còn ' + conLai + ' ngày', 'wait') : huyHieu('Dọn được', 'red')),
        td(hangNut(bKhoiPhuc, bXoa)),
      );
      tbRac.append(tr);
    }
  }

  // — Đơn xin xoá của chủ cây —
  if (!xin.length) {
    dongTrong(tbXin, 6, 'Không có đơn xin xoá nào đang chờ.');
    return;
  }
  tbXin.innerHTML = '';
  for (const c of xin) {
    const bDuyet = nut('Duyệt đưa vào thùng rác', 'danger');
    bDuyet.addEventListener('click', async () => {
      const r = await hoi({
        tua: 'Duyệt đưa vào thùng rác',
        chu: 'Duyệt xong, “' + c.ten + '” (' + c.soNguoi + ' người) đóng lại với mọi người và ' +
             'nằm trong thùng rác ' + NGAY_THUNG_RAC + ' ngày. Bản sao lưu đêm vẫn chép nó. ' +
             'Khôi phục được bất cứ lúc nào trước khi dọn.',
        nutOk: 'Duyệt', kieuOk: 'danger',
        lam: () => duyetXoaCay(c.fileId),
      });
      if (r) napLai();
    });

    const bTraLai = nut('Khôi phục lại cho chủ cây', 'warm');
    bTraLai.addEventListener('click', async () => {
      const r = await hoi({
        tua: 'Khôi phục lại cho chủ cây',
        chu: 'Bỏ đơn xin xoá “' + c.ten + '”? Cây giữ nguyên, chủ cây có thể xin lại.',
        nutOk: 'Bỏ đơn',
        lam: () => huyXinXoaCay(c.fileId),
      });
      if (r) napLai();
    });

    const tr = document.createElement('tr');
    tr.append(
      td(span('name', c.ten || '(chưa đặt tên)')),
      td(c.treeCode),
      td(c.emailXinXoa || ''),
      td(ngayGio(c.xinXoaLuc)),
      td(c.xinXoaLyDo || ''),
      td(hangNut(bDuyet, bTraLai)),
    );
    tbXin.append(tr);
  }
}
