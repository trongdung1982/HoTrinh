// ============================================================
// giapha-supabase · js/pages/quan-tri/khu-quan-tri-he-thong.js
// Vai trò  : Khu QUẢN TRỊ HỆ THỐNG — đổ dữ liệu vào section
//            `#quan-tri-he-thong` của prototype quantri3 (7 tab) và trang
//            `#sys-default-tree-selector`.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb, quan-tri/trang-chi-tiet · hop-thoai · o-bang
// Phiên bản: 1.3.0 · Cập nhật: 17/09/2026 (b119)
//            1.3.0 tab Sao lưu: bảng Đối chiếu dữ liệu nay đọc SỐNG qua
//            `khu-sao-luu.js` (`dem_du_lieu`). Lịch sử trước: `git log -p`.
// Sổ tay   : so-tay/trang-quan-tri.md
// ============================================================
//
// ⚠ **Không gác trước bằng cờ `phien.laQuanTriHeThong`.** App không tự lọc,
//   máy chủ lọc: người không có cờ gõ thẳng `#quan-tri-he-thong` thì mọi hàm
//   ở đây trả rỗng, và màn hình nói đúng thế.
//
// ⚠ Gắn thật: *Tổng quan* · *Sổ tài khoản* · *Cây mặc định* · *Thùng rác* ·
//   *Sao lưu* (bảng Đối chiếu, `khu-sao-luu.js`). Hai tab còn trống — *Tạo
//   tài khoản* · *Nhật ký* — vẽ đúng HTML quantri3 nhưng mờ kèm lý do. Tab
//   *Sao lưu* cũng còn hai phần mờ (lịch sử · nút "Sao lưu ngay"): không
//   phải "chưa tới lượt", mà trình duyệt không gọi được Drive/Apps Script.
//
// ⚠ Sổ tài khoản: *Bổ nhiệm QTHT* là LỜI MỜI hai chữ ký (`23` mục 6) — bấm
//   chỉ GỬI, người kia tự Chấp nhận ở khu Tài khoản mới có cờ thật · *Khóa
//   tài khoản* (mềm 60 ngày) đã nối · *Xóa* nay ĐÒI đã khoá đủ 60 ngày.

import {
  layDanhSachGiaPha, layCayMacDinh, datCayMacDinh, dsTaiKhoanHeThong, dsThanhVien,
  duyetXoaCay, huyXinXoaCay, phucHoiCay, donThungRac, xoaAnhThat,
  datQuanTriHeThong, datDuocTaoCay, xoaTaiKhoan, khoaTaiKhoan, moKhoaTaiKhoan,
} from '../../services/sb.js';
import { duongDan } from './trang-chi-tiet.js';
import { hoi, bao } from './hop-thoai.js';
import { veKhuSaoLuu } from './khu-sao-luu.js';
import {
  td, span, tenVaPhu, huyHieu, nut, nutNho, nutMo, lienKet, hangNut, dongTrong,
  chepKieu, ngay, ngayGio,
} from './o-bang.js';

/**
 * Số ngày một cây nằm trong thùng rác trước khi dọn được — ĐÚNG luật MÁY CHỦ
 * ĐANG CHẠY. `THIET-KE-NHIEU-CAY.md` 11.9 chốt 120 ngày, `23` (b118c) đã dán
 * đúng con số ấy vào máy chủ.
 */
const NGAY_THUNG_RAC = 120;

/** Tab đang mở — giữ qua các lần nạp lại và khi đi sang trang con rồi về. */
let tabDangMo = 'tong-quan';

/** Trang con gọi trước khi mở, để nút "← …" về đúng tab của nó. */
export function datTabQuanTriHeThong(ten) {
  tabDangMo = ten;
}

/**
 * @param {HTMLElement} sec  `section#quan-tri-he-thong`
 * @param {object} phien
 */
export async function mountKhuQuanTriHeThong(sec, phien) {
  const napLai = () => mountKhuQuanTriHeThong(sec, phien);

  ganTab(sec);
  veChuaCo(sec);
  dongTrong(sec.querySelector('#stk-tbody'), 8, 'Đang đọc sổ tài khoản…');

  const hashLuc = window.location.hash;
  const [kq, cmd, tk] = await Promise.all([
    layDanhSachGiaPha(), layCayMacDinh(), dsTaiKhoanHeThong(),
  ]);
  if (window.location.hash !== hashLuc) return;

  const ds = kq.ok ? (kq.ds || []) : [];
  const dsSong = ds.filter((c) => !c.daXoaLuc);
  veTongQuan(sec, ds, cmd, tk);
  veSoTaiKhoan(sec, tk, napLai);
  veCayMacDinh(sec, dsSong, cmd, napLai);
  veThungRac(sec, kq, napLai);
  veKhuSaoLuu(sec, dsSong);
}

// ============================================================
// Tab
// ============================================================

function ganTab(sec) {
  const chon = (ten) => { tabDangMo = ten; toTab(sec); };
  for (const b of sec.querySelectorAll('[data-sys-tab]')) b.onclick = () => chon(b.dataset.sysTab);
  for (const b of sec.querySelectorAll('[data-sys-goto]')) b.onclick = () => chon(b.dataset.sysGoto);
  sec.querySelector('#btn-goto-tao-tai-khoan').onclick = () => chon('tao-tai-khoan');
  toTab(sec);
}

function toTab(sec) {
  for (const b of sec.querySelectorAll('[data-sys-tab]')) {
    b.classList.toggle('active', b.dataset.sysTab === tabDangMo);
  }
  for (const p of sec.querySelectorAll('[data-sys-pane]')) {
    p.hidden = p.dataset.sysPane !== tabDangMo;
  }
}

// ============================================================
// Ba tab máy chủ chưa có gì — nói thẳng, không vẽ số giả
// ============================================================

function veChuaCo(sec) {
  const dat = (id, chu) => { sec.querySelector('#' + id).textContent = chu; };
  const mo = (chon, lyDo) => {
    for (const el of sec.querySelectorAll(chon)) { el.disabled = true; el.title = lyDo; }
  };

  const LY_TAO = 'Chưa làm được: tạo tài khoản cần khoá service_role của Supabase, và khoá ấy chỉ ' +
    'được sống trong một Edge Function — hạ tầng dự án chưa có. Việc riêng, làm sau b120.';
  dat('ttk-chua-co', LY_TAO);
  mo('#form-tao-tai-khoan input, #form-tao-tai-khoan select, #btn-reset-form-tao-tk, #btn-submit-tao-tk', LY_TAO);

  // ⚠ b119: bảng đối chiếu 5 số đếm nay đọc SỐNG (`veKhuSaoLuu`, dưới). Hai
  //   thứ còn lại vẫn không làm được — không phải "chưa tới lượt" mà là app
  //   chạy trong trình duyệt, không có đường nào gọi tới Google Drive/Apps
  //   Script (không OAuth, `CLAUDE.md` mục 3).
  const LY_SL = 'Máy chủ này (Supabase/trình duyệt) không nối được tới Google Drive hay Apps Script — ' +
    'không đọc được danh sách file hay kết quả từng lần sao lưu đêm. Xem lịch sử tại script.google.com ' +
    '→ Executions, hoặc mở thư mục "Sao lưu gia phả (Supabase)" trên Drive. Bảng Đối chiếu dữ liệu bên ' +
    'dưới đọc SỐNG từ cơ sở dữ liệu — cột "Bản sao lưu" phải tự mở file sao lưu mới nhất ra so bằng mắt.';
  dat('sl-chua-co', LY_SL);
  mo('#btn-sao-luu-ngay', 'Nút này cần gọi Apps Script từ trình duyệt, mà dự án sao lưu không có địa ' +
    'chỉ web để gọi tới — chạy hàm saoLuuNgay tại script.google.com.');

  const LY_NK = 'Chưa làm: nhật ký hệ thống cần một bảng mới ở máy chủ — việc riêng, làm sau b120. ' +
    'Lịch sử sửa dữ liệu cây vẫn xem ở khu Kiểm duyệt.';
  dat('nk-chua-co', LY_NK);
  mo('#sys-log-filter-type, #sys-log-filter-time, #btn-select-old-logs, #btn-export-logs, ' +
    '#btn-delete-selected-logs, #sys-log-check-all, #btn-don-nhat-ky-thung-rac', LY_NK);

  mo('#btn-don-tai-khoan-60ngay', 'Xoá mềm 60 ngày chưa có ở máy chủ — làm ở b118b.');
  mo('#btn-save-default-tree-fields', 'Công khai theo từng trường chưa có ở máy chủ — làm sau b120.');

  dongTrong(sec.querySelector('#sl-lich-su-tbody'), 5,
    'Không đọc được — máy chủ này không nối tới Google Drive. Xem tại script.google.com → Executions.');
  // `#sl-doi-chieu-tbody` không mờ ở đây nữa — `veKhuSaoLuu()` tự vẽ số thật.
  dongTrong(sec.querySelector('#sys-log-tbody'), 5, 'Chưa có nhật ký hệ thống ở máy chủ.');
  dongTrong(sec.querySelector('#trash-logs-tbody'), 6, 'Chưa có nhật ký hệ thống ở máy chủ.');
  dongTrong(sec.querySelector('#default-tree-fields-tbody'), 4,
    'Công khai theo từng trường chưa có ở máy chủ — làm sau b120.');
  dongTrong(sec.querySelector('#stk-cho-xoa-tbody'), 7,
    'Chưa có ở máy chủ — xoá mềm 60 ngày làm ở b118b. Hôm nay Xóa tài khoản là xoá hẳn.');
  dat('stk-cho-xoa-dem', '');
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
  dat('tq-sl-mo-ta', 'Không nối được tới Drive/Apps Script — xem bảng đối chiếu số đếm ở khu Sao lưu.');

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
// Sổ tài khoản — bảng quantri3 (b118d)
// ============================================================
//
// ⚠ `style=` trong ô bảng dưới đây là CHÉP NGUYÊN VĂN mẫu dòng của quantri3
//   (`chepKieu`) — không tự nghĩ ra.
//
// ⚠ Dòng của chính mình: không nút cờ nào, không khoá/xoá — luật *không ai
//   đặt quyền cho chính mình* (cửa 6, 7), đúng chữ quantri3 *"Chính bạn
//   (không tự gỡ)"* · *"Không tự khóa/xóa"*.

function veSoTaiKhoan(sec, tk, napLai) {
  const tb = sec.querySelector('#stk-tbody');
  const dem = sec.querySelector('#stk-dem');
  if (!tk.ok) { dem.textContent = ''; dongTrong(tb, 8, tk.loi || 'Không đọc được sổ tài khoản.', napLai); return; }

  // ⚠ Rỗng gần như luôn nghĩa là *"máy chủ không cho bạn đọc"* — chính bạn
  //   đang là một tài khoản.
  if (!tk.ds.length) {
    dem.textContent = '';
    dongTrong(tb, 8, 'Máy chủ không trả về tài khoản nào. Danh sách này chỉ Quản trị hệ thống đọc ' +
      'được — nếu bạn vừa được cấp cờ ấy thì đăng xuất rồi đăng nhập lại một lần.');
    return;
  }

  dem.textContent = tk.ds.length + ' tài khoản · Bấm vào cột Số cây để xem các gia phả của tài khoản đó';
  tb.innerHTML = '';
  for (const t of tk.ds) tb.append(dongTaiKhoan(t, tk.ds, napLai));
}

function dongTaiKhoan(t, ds, napLai) {
  const tr = document.createElement('tr');

  const oTen = td(tenVaPhu(t.hoTen || t.email, [t.maNgan, t.laChinhToi ? 'Bạn' : ''].filter(Boolean).join(' · ')));

  const email = chepKieu(span('name', t.email), 'font-weight:400');
  const xn = chepKieu(huyHieu(t.daXacNhanEmail ? 'Đã xác nhận' : 'Chưa xác nhận',
    t.daXacNhanEmail ? 'ok' : 'wait'), 'font-size:11px;padding:2px 7px');
  const oEmail = td(boc(email), chepKieu(boc(xn), 'margin-top:4px'));

  // — Quản trị hệ thống — ba trạng thái: đã có cờ · lời mời đang chờ · chưa có gì.
  const oQT = td();
  if (t.laQuanTriHeThong) {
    oQT.append(huyHieu('Là QTHT', 'ok'));
    if (t.laChinhToi) {
      oQT.append(chepKieu(span('sub', 'Chính bạn (không tự gỡ)'), 'display:block;margin-top:2px;font-size:11px'));
    } else {
      const b = nutNho('Hủy quyền', 'danger');
      b.addEventListener('click', () => hoiCoQT(t, false, napLai));
      oQT.append(chepKieu(boc(b), 'margin-top:4px'));
    }
  } else if (t.qthtMoiLuc) {
    oQT.append(chepKieu(huyHieu('Đang chờ nhận lời mời', 'wait'), 'display:block;margin-bottom:3px'));
    oQT.append(chepKieu(span('sub', 'Mời lúc ' + ngayGio(t.qthtMoiLuc) +
      (t.emailQthtMoiBoi ? ' bởi ' + t.emailQthtMoiBoi : '')), 'display:block;margin-bottom:3px'));
    if (!t.laChinhToi) {
      const b = nutNho('Hủy lời mời', 'danger');
      b.addEventListener('click', () => hoiCoQT(t, false, napLai));
      oQT.append(b);
    }
  } else {
    oQT.append(chepKieu(span('sub', 'Chưa có'), 'display:block;margin-bottom:3px'));
    if (!t.laChinhToi) {
      const b = nutNho('Mời làm QTHT', 'warm');
      b.addEventListener('click', () => hoiCoQT(t, true, napLai));
      oQT.append(b);
    }
  }

  // — Tạo gia phả —
  const oTao = td();
  if (t.duocTaoCay) {
    oTao.append(huyHieu('Được phép', 'ok'));
    if (!t.laChinhToi) {
      const b = nutNho('Thu hồi');
      b.addEventListener('click', () => hoiTaoCay(t, false, napLai));
      oTao.append(chepKieu(boc(b), 'margin-top:4px'));
    }
  } else {
    oTao.append(chepKieu(span('sub', t.laChinhToi ? 'Không' : 'Chưa có'), 'display:block;margin-bottom:3px'));
    if (!t.laChinhToi) {
      const b = nutNho('Cấp quyền');
      b.addEventListener('click', () => hoiTaoCay(t, true, napLai));
      oTao.append(b);
    }
  }

  // — Số cây: dòng TÓM TẮT xuyên cây, bấm ra trang theo từng cây (5b②) —
  const oSo = td(lienKet(t.soCay + ' cây →', duongDan('quan-tri-he-thong', 'tai-khoan', t.maNgan)));
  const treo = [t.soCho ? t.soCho + ' chờ' : '', t.soMoi ? t.soMoi + ' mời' : ''].filter(Boolean).join(' · ');
  if (treo) oSo.append(span('sub', treo));

  const oDn = td(t.dangNhapGanNhat ? ngayGio(t.dangNhapGanNhat) : span('muted', 'Chưa đăng nhập'));

  // — Hành động — khoá mềm trước, xoá hẳn sau 60 ngày (`23` mục 7, b118c).
  let oViec;
  if (t.laChinhToi) {
    oViec = td(chepKieu(span('muted', 'Không tự khóa/xóa'), 'font-size:12px'));
  } else {
    const cot = document.createElement('div');
    chepKieu(cot, 'display:flex;flex-direction:column;gap:4px;align-items:flex-start');

    if (t.khoaLuc) {
      cot.append(chepKieu(huyHieu('Đã khoá', 'danger'), 'font-size:11px;padding:2px 7px'));
      cot.append(chepKieu(span('sub', 'Từ ' + ngay(t.khoaLuc) +
        (t.khoaLyDo ? ' — “' + t.khoaLyDo + '”' : '')), 'font-size:11px'));
      const bMo = nutNho('Mở khoá');
      bMo.addEventListener('click', () => hoiMoKhoaTaiKhoan(t, napLai));
      cot.append(bMo);
    } else {
      const bKhoa = nutNho('Khóa tài khoản', 'danger');
      bKhoa.addEventListener('click', () => hoiKhoaTaiKhoan(t, napLai));
      cot.append(bKhoa);
    }

    const bXoa = t.khoaLuc ? nutNho('Xóa tài khoản', 'danger') : nutMo('Xóa tài khoản',
      'Khoá mềm trước — 60 ngày sau mới xoá hẳn được.', 'danger');
    if (t.khoaLuc) bXoa.addEventListener('click', () => hoiXoaTaiKhoan(t, ds, napLai));
    cot.append(bXoa);

    oViec = td(cot);
  }

  const oTrangThai = td(t.khoaLuc ? huyHieu('Đã khoá', 'danger') : huyHieu('Hoạt động'));
  tr.append(oTen, oEmail, oQT, oTao, oTrangThai, oSo, oDn, oViec);
  return tr;
}

function boc(el) {
  const d = document.createElement('div');
  d.append(el);
  return d;
}

/**
 * Cửa thứ SÁU (`14` mục 7), nay HAI chữ ký (`23` mục 6, b118c).
 *
 * ⚠⚠ `bat=true` CHỈ GỬI LỜI MỜI — cờ chưa đổi giá trị cho tới khi chính
 *   người kia bấm Nhận ở khu Tài khoản. `bat=false` (hủy quyền/hủy lời mời)
 *   vẫn là MỘT chữ ký, có hiệu lực ngay — cố ý, xem `23` mục 6.
 */
async function hoiCoQT(t, bat, napLai) {
  const dangMoi = Boolean(t.qthtMoiLuc);
  const kq = await hoi({
    tua: bat ? 'Mời làm Quản trị hệ thống' : (dangMoi ? 'Hủy lời mời' : 'Hủy quyền Quản trị hệ thống'),
    // ⚠ Cờ của TÀI KHOẢN — một trong hai chỗ duy nhất không hỏi cây (luật 5a),
    //   nên câu phải tự khai điều ấy.
    chu: 'Cờ của tài khoản — cả hệ thống, không chọn cây. ' + (bat
      ? 'Gửi lời mời làm Quản trị hệ thống cho ' + t.email + '. Đây là chữ ký thứ NHẤT — họ chưa có ' +
        'một mẩu quyền nào cho tới khi tự bấm Chấp nhận (chữ ký thứ hai) ở khu Tài khoản. Nhận xong, ' +
        'cờ này cho tài khoản đọc và sửa MỌI gia phả, đổi quyền ở mọi cây, và mời người khác.'
      : dangMoi
        ? 'Hủy lời mời chưa được ' + t.email + ' nhận. Họ vẫn chưa có quyền gì từ lời mời này.'
        : 'Bạn có chắc chắn muốn hủy quyền Quản trị hệ thống của ' + t.email + '? Máy chủ không cho ' +
          'tắt người cuối cùng.'),
    nutOk: bat ? 'Gửi lời mời' : 'Hủy',
    nutHuy: 'Giữ lại',
    kieuOk: bat ? 'warm' : 'danger',
    lam: () => datQuanTriHeThong(t.userId, bat),
  });
  if (kq) napLai();
}

/** Cửa thứ BẢY (`17`) — cờ của TÀI KHOẢN, không hỏi cây nào. */
async function hoiTaoCay(t, bat, napLai) {
  const kq = await hoi({
    tua: bat ? 'Cấp quyền tạo cây' : 'Thu hồi quyền tạo cây',
    chu: 'Cờ của tài khoản — cả hệ thống, không riêng cây nào. ' + (bat
      ? 'Cấp quyền Tạo gia phả mới cho tài khoản ' + t.email + '? Cây họ dựng ra là cây của họ. ' +
        'Quyền này TÁCH HẲN khỏi vai Quản trị gia phả.'
      : 'Thu hồi quyền Tạo gia phả của tài khoản ' + t.email + '? Khi thu hồi, người này không thể ' +
        'tạo thêm cây mới, nhưng các cây đã tạo trước đó vẫn giữ nguyên.'),
    nutOk: bat ? 'Cấp quyền' : 'Thu hồi',
    nutHuy: bat ? 'Hủy' : 'Giữ lại',
    lam: () => datDuocTaoCay(t.userId, bat),
  });
  if (kq) napLai();
}

/**
 * Khoá mềm — chữ ký duy nhất, có hiệu lực ngay. KHÔNG chuyển chủ cây (`23`
 * mục 7): cây của người bị khoá vẫn có chủ, chỉ tạm không ai làm gì được.
 */
async function hoiKhoaTaiKhoan(t, napLai) {
  const kq = await hoi({
    tua: 'Khóa tài khoản',
    chu: 'Khoá mềm ' + t.email + ' — họ không đăng nhập vào được gia phả nào nữa cho tới khi ' +
      'mở khoá. Không chuyển chủ cây nào cả. Đủ 60 ngày mới xoá hẳn được.',
    truong: [{ ma: 'email', nhan: 'Gõ lại email của tài khoản này', goiY: t.email },
      { ma: 'lyDo', nhan: 'Lý do (không bắt buộc)' }],
    nutOk: 'Khóa', nutHuy: 'Hủy', kieuOk: 'danger',
    lam: (v) => khoaTaiKhoan(t.userId, v.email.trim(), v.lyDo || ''),
  });
  if (kq) napLai();
}

async function hoiMoKhoaTaiKhoan(t, napLai) {
  const kq = await hoi({
    tua: 'Mở khoá tài khoản',
    chu: 'Mở khoá ' + t.email + ' — họ đăng nhập và dùng lại bình thường ngay.',
    nutOk: 'Mở khoá',
    lam: () => moKhoaTaiKhoan(t.userId),
  });
  if (kq) napLai();
}

/**
 * Xoá HẲN — việc duy nhất phá huỷ một lối đăng nhập. Đòi tài khoản đã khoá
 * mềm đủ 60 ngày (`23` mục 7) — máy chủ từ chối và nói còn bao nhiêu ngày,
 * hộp hỏi hiện nguyên câu ấy. Phép so email gõ lại nằm ở MÁY CHỦ, không so ở đây.
 */
async function hoiXoaTaiKhoan(t, ds, napLai) {
  const truong = [{ ma: 'email', nhan: 'Gõ lại email của tài khoản này', goiY: t.email }];
  if (t.soCayLamChu > 0) {
    truong.push({ ma: 'chuMoi', nhan: 'Ai nhận ' + t.soCayLamChu + ' gia phả tài khoản này đang làm chủ',
      chon: [['', 'Bạn nhận (mặc định)'], ...ds.filter((k) => k.userId !== t.userId).map((k) => [k.userId, k.email])] });
  }
  const kq = await hoi({
    tua: 'Xóa tài khoản',
    chu: '⚠️ Xoá HẲN tài khoản ' + t.email + ' — mất lối đăng nhập, KHÔNG hoàn tác được. ' +
      'Nhật ký ai sửa gì vẫn còn nguyên.',
    truong,
    nutOk: 'Xác nhận xóa', nutHuy: 'Hủy', kieuOk: 'danger',
    lam: (v) => xoaTaiKhoan(t.userId, v.email.trim(), v.chuMoi || ''),
  });
  if (kq) napLai();
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
      oViec = chepKieu(span('muted', 'Cây hiện tại'), 'font-size:12px');
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
