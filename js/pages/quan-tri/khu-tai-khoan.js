// ============================================================
// giapha-supabase · js/pages/quan-tri/khu-tai-khoan.js
// Vai trò  : Khu 2 của trang Quản trị — TÀI KHOẢN CỦA TÔI: đổ dữ liệu vào
//            section `#tai-khoan` của quantri3 (hồ sơ · quyền cấp hệ thống ·
//            các gia phả tôi tham gia · đổi mật khẩu).
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb, quan-tri/hop-thoai · trang-cay · o-bang
// Phiên bản: 1.1.0 · Cập nhật: 16/09/2026 (b118c)
//            1.1.0 nút Chấp nhận/Từ chối lời mời Quản trị hệ thống nối thật
//            (`23` mục 6) — chữ ký thứ hai, đọc `loiMoiQthtCuaToi()`.
// Sổ tay   : so-tay/trang-quan-tri.md
// ============================================================
//
// ⚠ **Khu này MỞ CHO MỌI NGƯỜI**, không riêng quản trị. Nó chỉ hỏi máy chủ
//   những câu về chính người hỏi (`ds_gia_pha()` · dòng `tree_members` của
//   mình qua RLS), nên không cần hàng rào nào mới. Không dòng nào ở file này
//   đọc `phien.treeId` để chọn cây — mỗi dòng bảng mang tên cây của nó.
//
// ⚠ **Cờ "Được phép tạo gia phả" chỉ để ĐỌC** — không ai tự đặt quyền cho
//   mình. Cờ Quản trị hệ thống thì KHÁC: từ b118c nó có nút *Chấp nhận / Từ
//   chối* thật, đúng nghĩa "chấp nhận" — đây là chữ ký thứ HAI của lời mời
//   (`23` mục 6), không phải tự đặt quyền cho mình.

import {
  layDanhSachGiaPha, chanCuaToi, doiMatKhau, dangXuat, nguoiDangNhap,
  loiMoiQthtCuaToi, nhanQuyenQtht, tuChoiQuyenQtht,
} from '../../services/sb.js';
import { hoi, bao } from './hop-thoai.js';
import { hoiDeXuatGan, moSoDo } from './trang-cay.js';
import {
  TEN_VAI, td, span, tenVaPhu, huyHieu, datHuyHieu, nut, nutLink, lienKet, chuaCo,
  hangNut, dongTrong, chuDau, ngay, ngayGio,
} from './o-bang.js';

/** Bảng *Các gia phả tôi đang tham gia* hiện sẵn ngần này dòng (quantri3). */
const SO_HIEN_TRUOC = 5;

const LY_DO_CONG_KHAI =
  'Công khai theo từng trường thông tin chưa có ở máy chủ — việc riêng, làm sau b120.';

let moRong = false;

/**
 * @param {HTMLElement} sec  `section#tai-khoan`
 * @param {object} phien     kết quả `sb.layPhien()`
 */
export async function mountKhuTaiKhoan(sec, phien) {
  const $ = (id) => sec.querySelector('#' + id);
  veHoSo(sec, phien, null);
  veQuyenHeThong(sec, phien, {});
  ganMatKhau(sec);
  ganQuyenHeThong(sec);

  $('gia-pha-extra').innerHTML = '';
  $('gia-pha-extra').hidden = true;
  $('tk-xem-them').hidden = true;
  $('tk-cay-dem').textContent = '';
  dongTrong($('tk-cay-tbody'), 7, 'Đang đọc các gia phả của bạn…');

  // ⚠ Bốn câu hỏi đi CÙNG LƯỢT và không thay được cho nhau: `ds_gia_pha()` biết
  //   đơn chờ lẫn lời mời nhưng không biết mã người; `chanCuaToi()` biết mã
  //   người nhưng chỉ thấy chân ĐÃ DUYỆT; `nguoiDangNhap()` biết ngày đăng ký;
  //   `loiMoiQthtCuaToi()` biết lời mời Quản trị hệ thống đang chờ (b118c).
  const hashLuc = window.location.hash;
  const [nguoi, kqCay, kqChan, moiQtht] = await Promise.all([
    nguoiDangNhap().catch(() => null), layDanhSachGiaPha(), chanCuaToi(),
    loiMoiQthtCuaToi().catch(() => ({})),
  ]);
  if (window.location.hash !== hashLuc) return;

  veHoSo(sec, phien, nguoi);
  veQuyenHeThong(sec, phien, moiQtht);
  veBangCay(sec, phien, kqCay, kqChan, () => mountKhuTaiKhoan(sec, phien));
}

// ============================================================
// Hồ sơ cá nhân · Quyền cấp hệ thống
// ============================================================

/** Trường trống thì KHÔNG vẽ hàng đó (`CLAUDE.md` mục 7). */
function veHoSo(sec, phien, nguoi) {
  const dat = (id, chu) => {
    const o = sec.querySelector('#' + id);
    o.textContent = chu || '';
    const li = o.closest('li');
    if (li) li.hidden = !chu;
  };
  sec.querySelector('#tk-avatar').textContent = chuDau(phien.hoTen, phien.email);
  dat('tk-ten', phien.hoTen);
  dat('tk-email', phien.email);
  dat('tk-ma', phien.maNgan);
  dat('tk-ngay-dk', nguoi && ngay(nguoi.created_at));
  dat('tk-dang-nhap', nguoi && ngayGio(nguoi.last_sign_in_at));

  const xacMinh = nguoi ? Boolean(nguoi.email_confirmed_at) : null;
  const b = sec.querySelector('#tk-xac-minh');
  b.hidden = xacMinh === null;
  datHuyHieu(b, xacMinh ? 'Đã xác minh' : 'Chưa xác minh email', xacMinh ? '' : 'wait');
  sec.querySelector('#tk-trang-thai').textContent = 'Đang hoạt động' +
    (xacMinh === null ? '' : xacMinh ? ' · Đã xác minh' : ' · Chưa xác minh email');
}

/**
 * Ba trạng thái — đúng bảng của `khu-quan-tri-he-thong.js`: đã có cờ · lời
 * mời đang chờ CHÍNH MÌNH bấm Nhận · chưa có gì.
 */
function veQuyenHeThong(sec, phien, moi) {
  const laQT = Boolean(phien.laQuanTriHeThong);
  const badge = sec.querySelector('#my-sys-qtht-badge');
  const sub = sec.querySelector('#my-sys-qtht-sub');
  const actions = sec.querySelector('#my-sys-qtht-actions');

  if (laQT) {
    datHuyHieu(badge, 'Có (Quản trị hệ thống)');
    sub.textContent = 'Quyền quản lý toàn bộ hệ thống phần mềm';
    actions.hidden = true;
  } else if (moi && moi.coLoiMoi) {
    datHuyHieu(badge, 'Có lời mời đang chờ', 'wait');
    sub.textContent = (moi.emailNguoiMoi ? moi.emailNguoiMoi + ' mời bạn' : 'Bạn được mời') +
      (moi.moiLuc ? ' lúc ' + ngayGio(moi.moiLuc) : '') + '. Bấm Chấp nhận để có cờ ngay.';
    actions.hidden = false;
  } else {
    datHuyHieu(badge, 'Không');
    sub.textContent = 'Chỉ một Quản trị hệ thống khác mời được.';
    actions.hidden = true;
  }
  datHuyHieu(sec.querySelector('#tk-tao-cay'), phien.duocTaoCay ? 'Có' : 'Không');
}

/**
 * Chữ ký thứ hai của lời mời Quản trị hệ thống (`23` mục 6, b118c). Đổi
 * `laQuanTriHeThong` là đổi những gì phần còn lại của trang thấy được, nên
 * nạp lại cả trang thay vì tự vá `phien` — cùng cách `btn-dang-xuat` làm.
 */
function ganQuyenHeThong(sec) {
  sec.querySelector('#btn-my-accept-qtht').onclick = async () => {
    const kq = await hoi({
      tua: 'Chấp nhận làm Quản trị hệ thống',
      chu: 'Nhận cờ Quản trị hệ thống — đọc và sửa được MỌI gia phả, đổi quyền ở mọi cây, và mời ' +
        'người khác. Đây là chữ ký thứ hai; lời mời do một Quản trị hệ thống khác gửi.',
      nutOk: 'Chấp nhận', kieuOk: 'warm',
      lam: () => nhanQuyenQtht(),
    });
    if (kq) window.location.reload();
  };

  sec.querySelector('#btn-my-decline-qtht').onclick = async () => {
    const kq = await hoi({
      tua: 'Từ chối lời mời',
      chu: 'Từ chối lời mời làm Quản trị hệ thống? Xoá lời mời, không đánh dấu — mời lại được.',
      nutOk: 'Từ chối', kieuOk: 'danger',
      lam: () => tuChoiQuyenQtht(),
    });
    if (kq) window.location.reload();
  };
}

// ============================================================
// Các gia phả tôi đang tham gia
// ============================================================

/**
 * Ba trạng thái loại trừ nhau — **lời mời đứng TRƯỚC** (bài học b111c: xem
 * được cây không có nghĩa là có chân trong cây). Cây chỉ XEM ĐƯỢC mà không có
 * chân KHÔNG vào bảng này — câu ấy là của khu Gia phả.
 */
function trangThaiCuaToi(c) {
  if (c.duocMoi) return 'duocmoi';
  if (c.vaiCuaToi || c.toiLaChu) return 'thanhvien';
  if (c.daNopDon) return 'donxin';
  return null;
}

function veBangCay(sec, phien, kqCay, kqChan, napLai) {
  const $ = (id) => sec.querySelector('#' + id);
  const tbA = $('tk-cay-tbody');
  const tbB = $('gia-pha-extra');

  if (!kqCay.ok) { dongTrong(tbA, 7, kqCay.loi || 'Không đọc được danh sách gia phả.', napLai); return; }

  const chan = new Map((kqChan.ok ? kqChan.ds : []).map((r) => [r.treeId, r]));
  const ds = kqCay.ds.filter((c) => !c.daXoaLuc && trangThaiCuaToi(c));

  // Lỗi đọc mã người KHÔNG làm hỏng cả bảng — nhưng phải nói ra.
  $('tk-cay-dem').textContent = ds.length + ' cây · Quyền và vị trí nhân vật của bạn trong từng sơ đồ' +
    (kqChan.ok ? '' : ' · Không đọc được bạn gắn với ai: ' + (kqChan.loi || 'lỗi không rõ'));

  if (!ds.length) {
    const o = dongTrong(tbA, 7, 'Bạn chưa có chân trong gia phả nào. Xin vào một gia phả, hoặc nhận lời mời, ở khu Gia phả. ');
    o.append(lienKet('Mở khu Gia phả →', 'gia-pha'));
    return;
  }

  tbA.innerHTML = '';
  ds.forEach((c, i) => (i < SO_HIEN_TRUOC ? tbA : tbB)
    .append(dongCay(c, chan.get(c.fileId), kqChan.ok, phien, napLai)));

  const them = ds.length - SO_HIEN_TRUOC;
  if (them <= 0) return;
  const bThem = $('btn-xem-them-cay');
  const chu = $('tk-hien-thi');
  const ve = () => {
    tbB.hidden = !moRong;
    bThem.textContent = moRong ? 'Thu gọn ▴' : 'Xem thêm (' + them + ' cây) ▾';
    chu.textContent = moRong ? 'Đang hiển thị tất cả ' + ds.length + ' cây'
      : 'Đang hiển thị ' + SO_HIEN_TRUOC + ' / ' + ds.length + ' cây';
  };
  bThem.onclick = () => { moRong = !moRong; ve(); };
  $('tk-xem-them').hidden = false;
  ve();
}

function dongCay(c, chan, docDuocChan, phien, napLai) {
  const trangThai = trangThaiCuaToi(c);
  const cay = { treeId: c.fileId, ten: c.ten || '', maCay: c.treeCode };

  const vai = c.toiLaChu ? huyHieu('Chủ gia phả')
    : trangThai === 'duocmoi' ? huyHieu('Được mời: ' + (TEN_VAI[c.moiVai] || c.moiVai || ''), 'wait')
    : trangThai === 'donxin' ? huyHieu('Đơn xin vào', 'wait')
    : huyHieu(TEN_VAI[(chan && chan.vai) || c.vaiCuaToi] || c.vaiCuaToi || '');

  let gan = '';
  if (trangThai === 'thanhvien' && docDuocChan) {
    gan = chan && chan.maNguoi
      ? tenVaPhu(chan.tenNguoi || chan.maNguoi, 'Mã: ' + chan.maNguoi)
      : span('muted', 'Chưa gắn người');
  }

  const trang = trangThai === 'thanhvien' ? huyHieu('Đã duyệt')
    : trangThai === 'duocmoi' ? huyHieu('Chờ bạn nhận lời', 'wait')
    : huyHieu('Chờ duyệt', 'wait');

  const viec = [];
  if (c.coTheXem) viec.push(nutLink('Xem sơ đồ →', () => moSoDo(cay, phien)));
  if (trangThai === 'duocmoi') viec.push(lienKet('Nhận lời ở khu Gia phả →', 'gia-pha'));
  // ⚠ Nút Đề xuất CHỈ trên chân đã duyệt chưa gắn ai (9.2②) — đơn còn chờ và
  //   lời mời chưa nhận thì `nop_de_xuat_gan()` từ chối (đo Q4, Q5).
  if (trangThai === 'thanhvien' && docDuocChan && !(chan && chan.maNguoi)) {
    const b = nut('Đề xuất mã người');
    b.addEventListener('click', () => hoiDeXuatGan(cay, napLai));
    viec.push(b);
  }

  const tr = document.createElement('tr');
  tr.append(
    td(span('name', c.ten || c.treeCode)),
    td(c.treeCode),
    td(vai),
    td(gan),
    td(chuaCo('Chưa có', LY_DO_CONG_KHAI)),
    td(trang),
    td(viec.length > 1 ? hangNut(...viec) : (viec[0] || '')),
  );
  return tr;
}

// ============================================================
// Bảo mật & Đổi mật khẩu
// ============================================================

function ganMatKhau(sec) {
  const oCu = sec.querySelector('#pass-current');
  const oMoi = sec.querySelector('#pass-new');
  const oLai = sec.querySelector('#pass-confirm');
  // `autocomplete` đúng tên là thứ khiến trình quản lý mật khẩu điền hộ ô cũ.
  oCu.autocomplete = 'current-password';
  oMoi.autocomplete = 'new-password';
  oLai.autocomplete = 'new-password';

  const bDoi = sec.querySelector('#btn-doi-mat-khau');
  bDoi.onclick = async () => {
    // Ba phép dưới chỉ để khỏi gửi một yêu cầu chắc chắn vô ích. Luật độ dài
    // là của Supabase — câu từ chối của nó hiện nguyên văn.
    if (!oCu.value || !oMoi.value) { bao('Đổi mật khẩu', 'Gõ đủ mật khẩu hiện tại và mật khẩu mới.'); return; }
    if (oMoi.value !== oLai.value) { bao('Lỗi nhập liệu', 'Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.'); return; }
    if (oMoi.value === oCu.value) { bao('Đổi mật khẩu', 'Mật khẩu mới trùng mật khẩu hiện tại.'); return; }
    bDoi.disabled = true;
    const kq = await doiMatKhau(oCu.value, oMoi.value);
    bDoi.disabled = false;
    if (!kq.ok) { bao('Không đổi được mật khẩu', kq.loi || 'Máy chủ từ chối.'); return; }
    oCu.value = ''; oMoi.value = ''; oLai.value = '';
    bao('Thành công', 'Đã đổi mật khẩu. Lần đăng nhập sau dùng mật khẩu mới.');
  };

  sec.querySelector('#btn-dang-xuat').onclick = async () => {
    const kq = await hoi({
      tua: 'Đăng xuất',
      chu: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?',
      nutOk: 'Đăng xuất', nutHuy: 'Ở lại', kieuOk: 'danger',
      lam: () => dangXuat(),
    });
    if (kq) window.location.reload();
  };
}
