// ============================================================
// giapha-supabase · js/pages/quan-tri/khu-gia-pha.js
// Vai trò  : Khu 1 của trang Quản trị — đổ dữ liệu thật vào section
//            `#gia-pha` của prototype quantri3: bốn chip *Tôi quản lý · Tôi
//            là thành viên · Có thể xin vào · Tạo gia phả mới*.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb, utils/id, quan-tri/trang-chi-tiet ·
//            quan-tri/hop-thoai · quan-tri/o-bang
// Phiên bản: 1.2.0 · Cập nhật: 23/09/2026 — bấm TÊN CÂY mở trang cây
//            1.1.0 *Xin đổi quyền* nối thật (`xinDoiVai()`, `23` mục 10) ·
//            *Xóa cây* có hiệu lực NGAY (luật 4) · *Rút đơn xoá* đổi thành
//            *Trả lại cho chủ*, chỉ Quản trị hệ thống bấm được. Lịch sử các
//            bản trước: `git log -p`.
// ============================================================
//
// ⚠ KHU NÀY LÀ CHỖ DUY NHẤT NGƯỜI LẠ CÓ VIỆC — người chưa có chân ở đâu cả
//   vào đây để thấy tên các cây và nộp đơn; không chặn ai, không vẽ câu "bạn
//   không có quyền" khi danh sách rỗng.
// ⚠ MÁY CHỦ QUYẾT, MÀN HÌNH CHỈ CHUYỂN LỜI: `ds_gia_pha()` trả `coTheXem` ·
//   `toiLaChu` · `daNopDon` · `duocMoi`. Ẩn/mờ một nút ở đây KHÔNG phải hàng
//   rào — chỉ để không mời người ta bấm thứ chắc chắn bị từ chối.
// ⚠ **Chỗ khác prototype, vì máy chủ chưa làm được**: cột *Thông tin công
//   khai* (nhóm E) · ô *Quyền đề nghị* trong đơn xin vào.

import {
  layDanhSachGiaPha, datChoNguoiLaThayTen, chonGiaPha, xinVaoCay, taoGiaPhaMoi,
  nhanLoiMoi, tuChoiLoiMoi, rutDonXinVao, roiCay, dsThanhVien,
  xinXoaCay, huyXinXoaCay, xinDoiVai,
} from '../../services/sb.js';
import { sinhMaCay } from '../../utils/id.js';
import { duongDan } from './trang-chi-tiet.js';
import { hoi, bao } from './hop-thoai.js';
import {
  TEN_VAI, td, span, tenVaPhu, huyHieu, nut, nutMo, lienKet, chuaCo, hangNut,
  menuTuyChon, mucMenu, dongTrong, dongLoi,
} from './o-bang.js';

/** Số cột của từng bảng — phải khớp `<thead>` trong QuanTri.html. */
const SO_COT = { manage: 9, member: 7, available: 6 };

const LY_DO_CONG_KHAI =
  'Công khai theo từng trường thông tin chưa có ở máy chủ — việc riêng, làm sau b120.';
const LY_DO_QUYEN_DE_NGHI =
  'Máy chủ chưa ghi quyền đề nghị vào đơn — người duyệt chọn quyền lúc duyệt (đổi ở b118b).';

/** Chip đang mở — giữ nguyên qua các lần nạp lại. */
let chipDangMo = 'manage';

/**
 * @param {HTMLElement} sec  `section#gia-pha` của QuanTri.html
 * @param {object} phien     kết quả `sb.layPhien()`
 */
export async function mountKhuGiaPha(sec, phien) {
  ganChip(sec);
  veScope(sec, phien);
  ganTaoMoi(sec, phien);
  await nap(sec, phien);
}

function ganChip(sec) {
  for (const b of sec.querySelectorAll('[data-family-tab]')) {
    b.onclick = () => { chipDangMo = b.dataset.familyTab; toChip(sec); };
  }
  toChip(sec);
}

function toChip(sec) {
  for (const b of sec.querySelectorAll('[data-family-tab]')) {
    b.classList.toggle('active', b.dataset.familyTab === chipDangMo);
  }
  for (const p of sec.querySelectorAll('[data-family-pane]')) {
    p.hidden = p.dataset.familyPane !== chipDangMo;
  }
}

/** Ô *Cây đang hiển thị tại trang Sơ đồ* ở góc phải đầu khu. */
function veScope(sec, phien) {
  const chu = [phien.tenCay, phien.maCay].filter(Boolean).join(' · ');
  sec.querySelector('[data-scope-cay]').hidden = !chu;
  sec.querySelector('[data-cay-dang-mo]').textContent = chu;
}

async function nap(sec, phien) {
  const tb = {};
  for (const ma of Object.keys(SO_COT)) {
    tb[ma] = sec.querySelector('[data-tbody="' + ma + '"]');
    dongTrong(tb[ma], SO_COT[ma], 'Đang đọc danh sách…');
  }

  const hashLuc = window.location.hash;
  const kq = await layDanhSachGiaPha();
  if (window.location.hash !== hashLuc) return;

  const napLai = () => nap(sec, phien);

  if (!kq.ok) {
    for (const ma of Object.keys(SO_COT)) {
      dongTrong(tb[ma], SO_COT[ma], kq.loi || 'Không đọc được danh sách gia phả.', napLai);
    }
    return;
  }

  // ⚠ Cây trong thùng rác KHÔNG hiện ở đây — chúng sống ở tab *Thùng rác* của
  //   khu Quản trị hệ thống. Hai chỗ nói về một cây là hai dòng để lệch nhau.
  const ds = (kq.ds || []).filter((c) => !c.daXoaLuc);

  // ⚠ BA NHÓM, MỘT `ds` — loại trừ nhau, xét theo thứ tự:
  //     · quản lý    — chủ cây HOẶC được phong `quan_tri`;
  //     · thành viên — còn lại, đã có vai HOẶC đang là lời mời chờ nhận;
  //     · xin vào    — chưa có vai, chưa được mời (kể cả đã nộp đơn).
  const dsQuanLy = ds.filter((c) => c.toiLaChu || c.vaiCuaToi === 'quan_tri');
  const dsThanhVien = ds.filter((c) => !dsQuanLy.includes(c) && (c.vaiCuaToi || c.duocMoi));
  const dsXinVao = ds.filter((c) => !c.vaiCuaToi && !c.duocMoi && !c.toiLaChu);

  veBang(tb.manage, SO_COT.manage, dsQuanLy,
    'Bạn chưa quản lý gia phả nào — làm chủ hoặc được phong Quản trị gia phả thì cây ấy hiện ở đây.',
    (c) => dongQuanLy(c, phien, napLai));
  veBang(tb.member, SO_COT.member, dsThanhVien,
    'Bạn chưa là thành viên của gia phả nào khác.',
    (c) => dongThanhVien(c, phien, napLai));
  veBang(tb.available, SO_COT.available, dsXinVao,
    'Không có gia phả nào khác để xin vào lúc này.',
    (c) => dongXinVao(c, phien, napLai));
}

function veBang(tbody, soCot, ds, chuRong, veDong) {
  if (!ds.length) { dongTrong(tbody, soCot, chuRong); return; }
  tbody.innerHTML = '';
  for (const c of ds) tbody.append(veDong(c));
}

// ============================================================
// Chip *Tôi quản lý* — 9 cột
// ============================================================

function dongQuanLy(c, phien, napLai) {
  const tr = document.createElement('tr');
  const duocDieuHanh = c.toiLaChu || phien.laQuanTriHeThong;

  // Bấm TÊN CÂY là mở trang của cây ấy (chủ dự án nêu 17/09, làm 23/09). Trước
  // đó tên là chữ trơ, và mọi đường vào cây nằm rải ở các cột khác — người ta
  // bấm vào tên trước tiên, đó là chỗ tay tự đưa tới.
  const oTen = td(lienKet(c.ten || '(chưa đặt tên)', '#' + duongDan('gia-pha', 'cay', c.treeCode)),
    span('sub', 'Mã cây: ' + c.treeCode));

  const oQuyen = td(huyHieu(c.toiLaChu ? 'Chủ gia phả'
    : (TEN_VAI[c.vaiCuaToi] || c.vaiCuaToi || '')));

  // Cột *Thành viên và quyền* — con số điền sau, khi `dsThanhVien` về.
  const lkTV = lienKet('Xem danh sách →', '#' + duongDan('gia-pha', 'cay', c.treeCode, 'thanh-vien'));
  const phuTV = span('sub', '');
  const oTV = td(lkTV, phuTV);

  const oCongKhai = td(chuaCo('Chưa có', LY_DO_CONG_KHAI));
  const oLa = td(oCongTac(c, duocDieuHanh));
  const oHienThi = td(oCayHienThi(c, phien, 'Cây mặc định'));

  const oMoi = td(duocDieuHanh
    ? lienKet('Mời', '#' + duongDan('gia-pha', 'moi', c.treeCode))
    : span('muted', 'Không phải chủ'));

  const lkDon = lienKet('Xem đơn →', '#' + duongDan('gia-pha', 'cay', c.treeCode, 'don-xin-vao'));
  const oDon = td(lkDon);

  const oXoa = td(oXoaCay(c, duocDieuHanh, Boolean(phien.laQuanTriHeThong), napLai));

  tr.append(oTen, oQuyen, oTV, oCongKhai, oLa, oHienThi, oMoi, oDon, oXoa);
  demThanhVien(c, lkTV, phuTV, lkDon);
  return tr;
}

/**
 * Điền *"3 người có quyền · 2 quản trị · 1 thành viên"* và số đơn chờ.
 *
 * ⚠ Một lời gọi cho mỗi cây quản lý — cả hai con số đọc từ CÙNG một
 *   `dsThanhVien`, không hỏi hai lần. Hỏng thì để nguyên chữ *"Xem danh
 *   sách →"*: con số là tiện, bảng thật vẫn mở được.
 */
async function demThanhVien(c, lkTV, phuTV, lkDon) {
  const kq = await dsThanhVien(c.fileId);
  if (!kq.ok) return;

  const daVao = kq.ds.filter((t) => t.daDuyet);
  // ⚠ Đơn xin vào = chưa duyệt VÀ không phải lời mời (`moiLuc` trống) — b110c.
  const don = kq.ds.filter((t) => !t.daDuyet && !t.moiLuc);

  lkTV.textContent = daVao.length + ' người có quyền';
  const dem = [
    [daVao.filter((t) => t.laChuCay).length, 'chủ'],
    [daVao.filter((t) => !t.laChuCay && t.vai === 'quan_tri').length, 'quản trị'],
    [daVao.filter((t) => !t.laChuCay && t.vai === 'sua').length, 'thành viên'],
    [daVao.filter((t) => !t.laChuCay && t.vai === 'xem').length, 'khách'],
  ].filter(([n]) => n).map(([n, chu]) => n + ' ' + chu);
  phuTV.textContent = dem.join(' · ');

  lkDon.textContent = '';
  if (don.length) lkDon.append(huyHieu(String(don.length), 'wait'), ' người');
  else lkDon.textContent = 'Không có đơn';
}

/** Cột *Người lạ thấy tên* — ô tích *Cho thấy tên*. */
function oCongTac(c, duocBam) {
  const nhan = document.createElement('label');
  const o = document.createElement('input');
  o.type = 'checkbox';
  o.checked = !!c.choNguoiLaThayTen;
  if (!duocBam) {
    o.disabled = true;
    nhan.title = 'Chỉ chủ gia phả và Quản trị hệ thống bật/tắt được.';
  }
  o.addEventListener('change', async () => {
    o.disabled = true;
    const kq = await datChoNguoiLaThayTen(c.fileId, o.checked);
    o.disabled = false;
    if (kq.ok) { c.choNguoiLaThayTen = o.checked; return; }
    // Máy chủ từ chối: trả ô về đúng sự thật, rồi nói lý do TẠI ĐÂY.
    o.checked = !o.checked;
    nhan.after(dongLoi(kq.loi || 'Không đổi được.'));
  });
  nhan.append(o, ' Cho thấy tên');
  return nhan;
}

/**
 * Cột *Cây hiển thị tại sơ đồ* — ô tích. Trang sơ đồ mở ĐÚNG MỘT gia phả, nên
 * tích vào cây khác là ĐỔI cây (hỏi trước), còn bỏ tích cây đang mở thì không
 * có nghĩa gì.
 *
 * ⚠ Hỏi trước, đổi sau — ô tích nằm giữa bảng dễ chạm nhầm khi cuộn trên điện
 *   thoại, và đổi nhầm thì mọi con số nhảy sang cây khác. Chủ dự án chốt
 *   08/09/2026.
 *
 * ⚠ Đổi xong phải NẠP LẠI TRANG, không chỉ vẽ lại bảng: `khung.js` đếm hai con
 *   số trên thanh theo `phien.treeId` lấy MỘT lần lúc dựng trang.
 */
function oCayHienThi(c, phien, chu) {
  if (!c.coTheXem) return span('muted', c.duocMoi ? 'Chưa nhận lời mời' : 'Chưa xem được');

  const dangMo = c.fileId === phien.treeId;
  const nhan = document.createElement('label');
  const o = document.createElement('input');
  o.type = 'checkbox';
  o.checked = dangMo;

  o.addEventListener('change', async () => {
    if (dangMo) {
      o.checked = true;
      bao('Cây hiển thị tại sơ đồ',
        'Trang sơ đồ luôn mở đúng một gia phả. Muốn đổi thì tích vào gia phả khác.');
      return;
    }
    o.checked = false;
    const kq = await hoi({
      tua: 'Đổi cây hiển thị tại sơ đồ?',
      chu: 'Trang sơ đồ sẽ mở “' + (c.ten || 'gia phả này') + '”. Trang này nạp lại, ' +
           'và từ đó mọi quyền quản trị tính theo gia phả này.',
      nutOk: 'Đổi',
      lam: () => chonGiaPha(c.fileId),
    });
    if (kq) window.location.reload();
  });

  nhan.append(o, ' ' + chu);
  return nhan;
}

/**
 * Cột *Xóa*. Từ `23` (b118c) — luật 4: xoá có hiệu lực NGAY, gia phả ẩn với
 * mọi người (trừ Quản trị hệ thống) từ giây bấm. *Rút đơn* chỉ còn dành cho
 * Quản trị hệ thống — chủ cây không tự trả lại được nữa (`huyXinXoaCay()`
 * đổi tập người gọi ở b118c).
 */
function oXoaCay(c, duocDieuHanh, laQT, napLai) {
  if (!duocDieuHanh) return span('muted', 'Không phải chủ');

  if (c.xinXoaLuc) {
    const b = laQT ? nut('Trả lại cho chủ') : nutMo('Trả lại cho chủ', 'Chỉ Quản trị hệ thống.');
    b.addEventListener('click', async () => {
      const kq = await hoi({
        tua: 'Trả lại cho chủ',
        chu: 'Mở lại “' + (c.ten || 'gia phả này') + '” — hết ẩn, dùng bình thường như trước.',
        nutOk: 'Trả lại',
        lam: () => huyXinXoaCay(c.fileId),
      });
      if (kq) napLai();
    });
    const hop = document.createElement('div');
    hop.append(huyHieu('Đang ẨN, chờ Quản trị hệ thống', 'wait'), document.createElement('br'), b);
    return hop;
  }

  const b = nut('Xóa cây', 'danger');
  b.addEventListener('click', async () => {
    const kq = await hoi({
      tua: 'Xóa cây',
      chu: '⚠️ “' + (c.ten || 'gia phả này') + '” sẽ ẨN NGAY với mọi người (trừ Quản trị hệ ' +
           'thống) — không còn "vẫn dùng được trong lúc chờ".',
      oNhap: { nhieuDong: true, goiY: 'Vì sao xoá? Ví dụ: dựng nhầm, đã gộp vào cây khác.' },
      nutOk: 'Xoá ngay',
      kieuOk: 'danger',
      lam: (lyDo) => xinXoaCay(c.fileId, lyDo),
    });
    if (kq) napLai();
  });
  return b;
}

// ============================================================
// Chip *Tôi là thành viên* — 7 cột
// ============================================================

function dongThanhVien(c, phien, napLai) {
  const tr = document.createElement('tr');

  const oQuyen = td(c.duocMoi
    ? huyHieu('Được mời: ' + (TEN_VAI[c.moiVai] || c.moiVai || ''), 'wait')
    : huyHieu(TEN_VAI[c.vaiCuaToi] || c.vaiCuaToi || ''));

  tr.append(
    // Người mới ĐƯỢC MỜI chưa có chân trong cây — trang cây sẽ nói "không
    // thấy", nên tên họ vẫn là chữ trơ cho tới khi bấm Nhận.
    td(c.duocMoi
      ? span('name', c.ten || '(chưa đặt tên)')
      : lienKet(c.ten || '(chưa đặt tên)', '#' + duongDan('gia-pha', 'cay', c.treeCode))),
    td(c.emailChu ? span('name', c.emailChu) : ''),
    td(c.treeCode),
    oQuyen,
    td(chuaCo('Chưa có', LY_DO_CONG_KHAI)),
    td(oCayHienThi(c, phien, 'Đặt mặc định')),
    td(c.duocMoi ? oNhanLoiMoi(c, napLai) : oTuyChonThanhVien(c, napLai)),
  );
  return tr;
}

/**
 * ⚠⚠ LỜI MỜI ĐỨNG TRƯỚC QUYỀN XEM — vá 14/09/2026. Quản trị hệ thống và cây
 *   mặc định đều XEM được cây mà chưa có chân; hỏi `coTheXem` trước là nút
 *   Nhận không bao giờ được vẽ cho hai hạng người ấy. Xem được KHÔNG PHẢI là
 *   có chân trong cây.
 */
function oNhanLoiMoi(c, napLai) {
  const bNhan = nut('Nhận', 'warm');
  const bTuChoi = nut('Từ chối', 'danger');
  const hang = hangNut(bNhan, bTuChoi);

  bNhan.addEventListener('click', async () => {
    bNhan.disabled = true; bTuChoi.disabled = true;
    const kq = await nhanLoiMoi(c.fileId);
    if (kq.ok) { napLai(); return; }
    bNhan.disabled = false; bTuChoi.disabled = false;
    hang.append(dongLoi(kq.loi || 'Không nhận được.'));
  });

  bTuChoi.addEventListener('click', async () => {
    const kq = await hoi({
      tua: 'Từ chối lời mời',
      chu: 'Từ chối lời mời vào “' + (c.ten || 'gia phả này') + '”' +
           (c.emailNguoiMoi ? ' của ' + c.emailNguoiMoi : '') + '?',
      nutOk: 'Từ chối', kieuOk: 'danger',
      lam: () => tuChoiLoiMoi(c.fileId),
    });
    if (kq) napLai();
  });

  return hang;
}

/**
 * Nộp đơn xin đổi sang một vai khác trong cây này. Việc xin **không đổi gì
 * cả** — chỉ ghi một lá đơn; chủ gia phả hoặc Quản trị hệ thống duyệt ở bảng
 * *Thành viên & quyền* (`23` mục 10, b118c).
 */
async function hoiXinDoiVai(c, vai, napLai) {
  const kq = await hoi({
    tua: 'Xin đổi quyền',
    chu: 'Nộp đơn xin đổi vai của bạn trong “' + (c.ten || 'gia phả này') + '” sang ' +
      (TEN_VAI[vai] || vai).toLowerCase() + '. Chủ gia phả hoặc Quản trị hệ thống sẽ duyệt.',
    oNhap: { goiY: 'Vì sao xin đổi? (không bắt buộc)' },
    nutOk: 'Nộp đơn',
    lam: (lyDo) => xinDoiVai(c.fileId, vai, lyDo),
  });
  if (kq) napLai();
}

/** Menu *Tùy chọn ▾* của quantri3: hai dòng xin đổi quyền + Thoát khỏi gia phả. */
function oTuyChonThanhVien(c, napLai) {
  const khac = ['quan_tri', 'sua', 'xem'].filter((v) => v !== c.vaiCuaToi);
  const dsNut = khac.map((v) =>
    mucMenu('Xin đổi sang quyền ' + (TEN_VAI[v] || v).toLowerCase(), '',
      () => hoiXinDoiVai(c, v, napLai)));

  // ⚠ CHỦ CÂY không rời được (`roi_cay()` chặn, `luoc-do/22`).
  const bThoat = c.toiLaChu
    ? nutMo('Thoát khỏi gia phả', 'Chủ gia phả không tự rời được — bàn giao trước.', 'danger')
    : nut('Thoát khỏi gia phả', 'danger');

  bThoat.addEventListener('click', async () => {
    const kq = await hoi({
      tua: 'Thoát khỏi gia phả',
      chu: 'Bạn có chắc chắn muốn thoát khỏi “' + (c.ten || 'gia phả này') + '” không?',
      nutOk: 'Thoát khỏi gia phả', nutHuy: 'Hủy', kieuOk: 'danger',
      lam: () => roiCay(c.fileId),
    });
    if (kq) napLai();
  });

  return menuTuyChon('Tùy chọn ▾', [...dsNut, null, bThoat]);
}

// ============================================================
// Chip *Có thể xin vào* — 6 cột
// ============================================================

function dongXinVao(c, phien, napLai) {
  const tr = document.createElement('tr');

  const oTrangThai = td(c.daNopDon
    ? huyHieu('Đã nộp đơn', 'wait')
    : span('sub', 'Chưa nộp đơn'));

  // Ô *Quyền đề nghị* — vẽ đúng như prototype nhưng mờ: máy chủ chưa có chỗ
  // ghi quyền đề nghị trong đơn.
  const chon = document.createElement('select');
  chon.className = 'role-select';
  for (const v of ['quan_tri', 'sua', 'xem']) {
    const op = document.createElement('option');
    op.value = v;
    op.textContent = TEN_VAI[v];
    chon.append(op);
  }
  chon.value = 'sua';
  chon.disabled = true;
  chon.title = LY_DO_QUYEN_DE_NGHI;

  const oViec = td();
  if (c.daNopDon) {
    const b = nut('Rút đơn', 'danger');
    b.addEventListener('click', async () => {
      const kq = await hoi({
        tua: 'Rút đơn xin gia nhập',
        chu: 'Bạn có chắc chắn muốn rút đơn xin gia nhập “' + (c.ten || 'gia phả này') + '” không?',
        nutOk: 'Rút đơn', nutHuy: 'Giữ đơn', kieuOk: 'danger',
        lam: () => rutDonXinVao(c.fileId),
      });
      if (kq) napLai();
    });
    oViec.append(b);
  } else {
    const b = nut('Nộp đơn', 'warm');
    b.addEventListener('click', async () => {
      const kq = await hoi({
        tua: 'Nộp đơn xin gia nhập',
        chu: 'Vài lời để người quản lý “' + (c.ten || 'gia phả này') + '” biết bạn là ai.',
        oNhap: { nhieuDong: true, goiY: 'Ví dụ: Tôi là con ông Nguyễn Văn A, chi thứ hai.' },
        nutOk: 'Nộp đơn',
        lam: (loiNhan) => xinVaoCay(loiNhan, c.fileId),
      });
      if (kq) napLai();
    });
    oViec.append(b);
  }

  // Quản trị hệ thống XEM được mọi cây mà chưa có chân — vẫn phải mở được cây
  // ấy trên sơ đồ, dù prototype không có cột này ở chip *Có thể xin vào*.
  if (c.coTheXem && c.fileId !== phien.treeId) {
    const bMo = nut('Mở trên sơ đồ');
    bMo.style.marginLeft = '6px';
    bMo.addEventListener('click', async () => {
      const kq = await hoi({
        tua: 'Đổi cây hiển thị tại sơ đồ?',
        chu: 'Trang sơ đồ sẽ mở “' + (c.ten || 'gia phả này') + '” ở chế độ bạn được phép. Trang này nạp lại.',
        nutOk: 'Đổi',
        lam: () => chonGiaPha(c.fileId),
      });
      if (kq) window.location.reload();
    });
    oViec.append(bMo);
  }

  tr.append(
    td(span('name', c.ten || '(chưa đặt tên)')),
    td(c.emailChu ? span('name', c.emailChu) : ''),
    td(c.treeCode),
    oTrangThai,
    td(chon),
    oViec,
  );
  return tr;
}

// ============================================================
// Chip *Tạo gia phả mới*
// ============================================================
//
// ⚠⚠ **CHIP NÀY HIỆN CHO MỌI NGƯỜI, KỂ CẢ NGƯỜI KHÔNG CÓ QUYỀN** — điểm dừng
//   b104: *"một tài khoản không được cấp bấm vào thì bị MÁY CHỦ từ chối, không
//   phải bị JavaScript giấu nút"*. Hàng rào là `duoc_tao_cay()` trong `12`.
//
// ⚠ Mã cây do hệ thống sinh (quantri3: *"Mã cây do hệ thống sinh"*) — không có
//   ô gõ mã. Hạt giống có thêm thời điểm bấm, để hai cây cùng tên không ra
//   cùng một mã rồi bị máy chủ từ chối vì trùng.

function ganTaoMoi(sec, phien) {
  const oTen = sec.querySelector('#tao-ten');
  const oGhi = sec.querySelector('#tao-ghi-chu');
  const b = sec.querySelector('#tao-nut');
  const oLoi = sec.querySelector('#tao-loi');

  b.onclick = async () => {
    oLoi.hidden = true;
    const ten = oTen.value.trim();
    if (!ten) { oLoi.textContent = 'Nhập tên gia phả.'; oLoi.hidden = false; return; }

    b.disabled = true;
    const chuCu = b.textContent;
    b.textContent = 'Đang tạo…';
    const kq = await taoGiaPhaMoi(ten, sinhMaCay(ten, ten + Date.now()), oGhi.value);
    b.disabled = false;
    b.textContent = chuCu;

    // Máy chủ từ chối — nói nguyên văn tại chip. Đây cũng là chỗ người không
    // được cấp quyền nghe câu "chưa được cấp quyền dựng gia phả mới".
    if (!kq.ok) { oLoi.textContent = kq.loi || 'Không tạo được gia phả.'; oLoi.hidden = false; return; }

    oTen.value = '';
    oGhi.value = '';
    const mo = await hoi({
      tua: 'Đã tạo gia phả',
      chu: '“' + (kq.cay.ten || ten) + '” (mã ' + (kq.cay.maCay || '') + ') nay là gia ' +
           'phả của bạn, và đang rỗng. Mở nó trên trang sơ đồ để thêm người đầu tiên.',
      nutOk: 'Mở gia phả mới', nutHuy: 'Để sau',
      lam: () => chonGiaPha(kq.cay.fileId),
    });
    // ⚠ Đi thẳng sang SƠ ĐỒ — với một cây rỗng, việc duy nhất còn ý nghĩa là
    //   thêm người đầu tiên, thứ chỉ có ở màn hình sơ đồ.
    if (mo) { window.location.href = 'index.html'; return; }
    chipDangMo = 'manage';
    mountKhuGiaPha(sec, phien);
  };
}
