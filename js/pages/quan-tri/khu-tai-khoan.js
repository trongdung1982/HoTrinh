// ============================================================
// giapha-supabase · js/pages/quan-tri/khu-tai-khoan.js
// Vai trò  : Khu 2 của trang Quản trị — TÀI KHOẢN CỦA TÔI: đổ dữ liệu vào
//            section `#tai-khoan` của quantri3 (hồ sơ · quyền cấp hệ thống ·
//            mã người & dòng họ (b126d) · các gia phả tôi tham gia · đổi
//            mật khẩu).
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb, quan-tri/hop-thoai · trang-cay · o-bang
// Phiên bản: 1.2.0 · Cập nhật: 26/09/2026 (b126d) — panel *Mã người & Dòng
//            họ* (KHÔNG có trong quantri3): gắn mã dời từ bảng cây (mỗi cây
//            một mã) về đây, chuyện của TÀI KHOẢN. Lịch sử: `git log -p`.
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
  layDanhSachGiaPha, doiMatKhau, dangXuat, nguoiDangNhap,
  loiMoiQthtCuaToi, nhanQuyenQtht, tuChoiQuyenQtht,
  deXuatGanCuaToi, nopDeXuatGan, rutDeXuatGan, duyetDeXuatGan,
  deXuatDongHoCuaToi, nopDeXuatDongHo, rutDeXuatDongHo, datDongHoQtht,
} from '../../services/sb.js';
import { hoi, bao } from './hop-thoai.js';
import { goiYNguoi, moSoDo } from './trang-cay.js';
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
  const napLai = () => mountKhuTaiKhoan(sec, phien);
  veHoSo(sec, phien, null);
  veQuyenHeThong(sec, phien, {});
  ganMatKhau(sec);
  ganQuyenHeThong(sec);

  $('gia-pha-extra').innerHTML = '';
  $('gia-pha-extra').hidden = true;
  $('tk-xem-them').hidden = true;
  $('tk-cay-dem').textContent = '';
  dongTrong($('tk-cay-tbody'), 7, 'Đang đọc các gia phả của bạn…');

  // ⚠ Năm câu hỏi đi CÙNG LƯỢT và không thay được cho nhau: `ds_gia_pha()` biết
  //   đơn chờ lẫn lời mời; `nguoiDangNhap()` biết ngày đăng ký; `loiMoiQthtCuaToi()`
  //   biết lời mời Quản trị hệ thống đang chờ (b118c); `deXuatGanCuaToi()` và
  //   `deXuatDongHoCuaToi()` biết đơn gắn mã/dòng họ ĐANG CHỜ của chính mình
  //   (b126d) — mã/dòng họ ĐÃ có thì đã nằm sẵn trong `phien`, không hỏi lại.
  const hashLuc = window.location.hash;
  const [nguoi, kqCay, moiQtht, donGan, donDongHo] = await Promise.all([
    nguoiDangNhap().catch(() => null), layDanhSachGiaPha(),
    loiMoiQthtCuaToi().catch(() => ({})),
    deXuatGanCuaToi().catch(() => ({ coDon: false })),
    deXuatDongHoCuaToi().catch(() => ({ coDon: false })),
  ]);
  if (window.location.hash !== hashLuc) return;

  veHoSo(sec, phien, nguoi);
  veQuyenHeThong(sec, phien, moiQtht);
  veHoSoDon(sec, phien, donGan, donDongHo, kqCay, napLai);
  veBangCay(sec, phien, kqCay, () => mountKhuTaiKhoan(sec, phien));
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
// Mã người trong sơ đồ & Dòng họ (b126d) — KHÔNG CÓ TRONG QUANTRI3
// ============================================================
//
// ⚠ Gắn mã và dòng họ nay là chuyện TOÀN PHẦN MỀM của TÀI KHOẢN, không của
//   một cây (`THIET-KE-NHIEU-CAY.md` mục 6) — đây là chỗ DUY NHẤT tự khai cả
//   hai, thay cho bảng *Các gia phả tôi tham gia* (mỗi cây một mã) trước b126.
//
// ⚠ Gắn mã: mọi ca đều cần một Quản trị hệ thống KHÁC, TRỪ khe hẹp `36` —
//   chủ MỘT gia phả bất kỳ, lần gắn ĐẦU TIÊN, mã chưa ai giữ, tự duyệt được.
//   Nút *Tự duyệt* chỉ HIỆN khi `kqCay` báo bạn là chủ ít nhất một cây — đó là
//   gợi ý, KHÔNG phải hàng rào; máy chủ tự quyết đúng/sai, hộp hỏi hiện lại
//   câu từ chối nếu đoán sai (ví dụ mã vừa bị người khác giành mất).
//
// ⚠ Dòng họ: KHÔNG có khe tự duyệt nào cho người thường — `37` chốt rõ.
//   Quản trị hệ thống tự đặt cho MÌNH bằng đường riêng (`datDongHoQtht`),
//   không qua đơn.

function dsCayThanhVien(kqCay) {
  return kqCay.ok ? kqCay.ds.filter((c) => !c.daXoaLuc && (c.vaiCuaToi || c.toiLaChu)) : [];
}

function veHoSoDon(sec, phien, donGan, donDongHo, kqCay, napLai) {
  veHoSoGan(sec, phien, donGan, kqCay, napLai);
  veHoSoDongHo(sec, phien, donDongHo, kqCay, napLai);
}

function veHoSoGan(sec, phien, don, kqCay, napLai) {
  const sub = sec.querySelector('#hs-gan-sub');
  const badge = sec.querySelector('#hs-gan-badge');
  const actions = sec.querySelector('#hs-gan-actions');
  actions.innerHTML = '';

  const laChuMotCay = dsCayThanhVien(kqCay).some((c) => c.toiLaChu);
  const treeGoiY = (dsCayThanhVien(kqCay)[0] || {}).fileId || null;

  if (phien.maNguoiGan) {
    datHuyHieu(badge, 'Đã gắn', 'ok');
    sub.textContent = (phien.tenNguoiGan || phien.maNguoiGan) + ' — mã ' + phien.maNguoiGan;
    const b = nut('Đề xuất đổi mã');
    b.addEventListener('click', () => hoiGanMa(phien, don, treeGoiY, laChuMotCay, napLai));
    actions.append(b);
    return;
  }

  if (don.coDon) {
    datHuyHieu(badge, 'Đang chờ duyệt', 'wait');
    sub.textContent = 'Bạn đề xuất: ' + don.maNguoi +
      (don.tenNguoi && don.tenNguoi !== don.maNguoi ? ' — ' + don.tenNguoi : '') +
      (don.taoLuc ? ' (nộp ' + ngayGio(don.taoLuc) + ')' : '');
    const bSua = nut('Sửa đề xuất');
    bSua.addEventListener('click', () => hoiGanMa(phien, don, treeGoiY, laChuMotCay, napLai));
    const bRut = nut('Rút đơn', 'danger');
    bRut.addEventListener('click', async () => {
      const kq = await hoi({ tua: 'Rút đơn', chu: 'Rút đơn đề xuất mã ' + don.maNguoi + ' của bạn?',
        nutOk: 'Rút đơn', kieuOk: 'danger', lam: () => rutDeXuatGan(don.id) });
      if (kq) napLai();
    });
    actions.append(bSua, bRut);
    if (laChuMotCay) {
      const bTu = nut('Tự duyệt (nếu đủ điều kiện)', 'warm');
      bTu.addEventListener('click', async () => {
        const kq = await hoi({
          tua: 'Tự duyệt đơn gắn mã',
          chu: 'Chỉ thành công khi đây là lần gắn ĐẦU TIÊN của bạn và mã ' + don.maNguoi +
            ' chưa ai giữ. Ca khác thì máy chủ từ chối, nhờ một Quản trị hệ thống khác duyệt.',
          nutOk: 'Tự duyệt', kieuOk: 'warm', lam: () => duyetDeXuatGan(don.id),
        });
        if (kq) napLai();
      });
      actions.append(bTu);
    }
    return;
  }

  datHuyHieu(badge, 'Chưa gắn', 'wait');
  sub.textContent = 'Mã người quyết định bạn sửa được những ai trong sơ đồ — bản thân, tổ tiên, con cháu, vợ/chồng.';
  const b = nut('Đề xuất mã người');
  b.addEventListener('click', () => hoiGanMa(phien, don, treeGoiY, laChuMotCay, napLai));
  actions.append(b);
}

async function hoiGanMa(phien, don, treeGoiY, laChuMotCay, napLai) {
  const kq = await hoi({
    tua: don.coDon ? 'Sửa đề xuất mã người' : 'Đề xuất mã người trong sơ đồ',
    chu: 'Mã này quyết định bạn sửa được những ai TRONG MỌI gia phả bạn tham gia: bản thân, tổ ' +
      'tiên đường thẳng, toàn bộ con cháu, cộng vợ/chồng. Một Quản trị hệ thống KHÁC xét đơn' +
      (laChuMotCay ? ' — trừ khi đây là lần gắn ĐẦU TIÊN và mã ấy chưa ai giữ, bạn tự duyệt được vì đang là chủ một gia phả.' : '.'),
    truong: [
      { ma: 'ma', nhan: 'Mã người trong sơ đồ', goiY: 'gõ tên hoặc mã người — ví dụ P0012',
        giaTri: don.coDon ? don.maNguoi : (phien.maNguoiGan || ''), ganVao: goiYNguoi(treeGoiY) },
      { ma: 'lyDo', nhan: 'Vì sao bạn là người này', goiY: 'không bắt buộc',
        giaTri: don.coDon ? (don.lyDo || '') : '' },
    ],
    nutOk: don.coDon ? 'Sửa đề xuất' : 'Nộp đề xuất',
    nutThem: don.coDon ? { chu: 'Rút đơn', kieu: 'danger', lam: () => rutDeXuatGan(don.id) } : null,
    lam: (v) => nopDeXuatGan(v.ma, v.lyDo),
  });
  if (kq) napLai();
}

function veHoSoDongHo(sec, phien, don, kqCay, napLai) {
  const sub = sec.querySelector('#hs-dongho-sub');
  const badge = sec.querySelector('#hs-dongho-badge');
  const actions = sec.querySelector('#hs-dongho-actions');
  actions.innerHTML = '';
  const dsCay = dsCayThanhVien(kqCay);

  if (phien.laQuanTriHeThong) {
    datHuyHieu(badge, phien.tenDongHo ? 'Đã chọn' : 'Chưa chọn', phien.tenDongHo ? 'ok' : 'wait');
    sub.textContent = phien.tenDongHo || 'Quản trị hệ thống tự chọn, không cần ai duyệt.';
    if (!dsCay.length) { sub.textContent += ' Chưa là thành viên đã duyệt của gia phả nào.'; return; }
    const b = nut(phien.tenDongHo ? 'Đổi dòng họ' : 'Chọn dòng họ');
    b.addEventListener('click', () => hoiChonDongHo(phien, { coDon: false }, dsCay, true, napLai));
    actions.append(b);
    return;
  }

  if (phien.tenDongHo) {
    datHuyHieu(badge, 'Đã chọn', 'ok');
    sub.textContent = phien.tenDongHo;
    if (dsCay.length) {
      const b = nut('Đề xuất đổi dòng họ');
      b.addEventListener('click', () => hoiChonDongHo(phien, don, dsCay, false, napLai));
      actions.append(b);
    }
    return;
  }

  if (don.coDon) {
    datHuyHieu(badge, 'Đang chờ duyệt', 'wait');
    sub.textContent = 'Bạn đề xuất: ' + don.tenCay + (don.taoLuc ? ' (nộp ' + ngayGio(don.taoLuc) + ')' : '');
    const bSua = nut('Sửa đề xuất');
    bSua.addEventListener('click', () => hoiChonDongHo(phien, don, dsCay, false, napLai));
    const bRut = nut('Rút đơn', 'danger');
    bRut.addEventListener('click', async () => {
      const kq = await hoi({ tua: 'Rút đơn', chu: 'Rút đơn đề xuất dòng họ ' + don.tenCay + '?',
        nutOk: 'Rút đơn', kieuOk: 'danger', lam: () => rutDeXuatDongHo(don.id) });
      if (kq) napLai();
    });
    actions.append(bSua, bRut);
    return;
  }

  datHuyHieu(badge, 'Chưa chọn', 'wait');
  if (!dsCay.length) {
    sub.textContent = 'Chọn trong các gia phả bạn là thành viên đã duyệt — chưa có cây nào.';
    return;
  }
  sub.textContent = 'Cây bạn tự nhận là dòng họ chính của mình. Một Quản trị hệ thống xét đơn.';
  const b = nut('Chọn dòng họ');
  b.addEventListener('click', () => hoiChonDongHo(phien, don, dsCay, false, napLai));
  actions.append(b);
}

async function hoiChonDongHo(phien, don, dsCay, truc, napLai) {
  const truong = [{ ma: 'cay', nhan: 'Gia phả', chon: dsCay.map((c) => [c.fileId, (c.ten || c.treeCode) + ' · ' + c.treeCode]),
    giaTri: don.coDon ? don.treeId : (phien.cayChinhId || dsCay[0].fileId) }];
  if (!truc) {
    truong.push({ ma: 'lyDo', nhan: 'Vì sao chọn cây này', goiY: 'không bắt buộc',
      giaTri: don.coDon ? (don.lyDo || '') : '' });
  }
  const kq = await hoi({
    tua: truc ? 'Chọn dòng họ' : (don.coDon ? 'Sửa đề xuất dòng họ' : 'Đề xuất dòng họ'),
    chu: truc
      ? 'Quản trị hệ thống tự chọn cho mình, có hiệu lực ngay — không qua đơn.'
      : 'Cây bạn tự nhận là dòng họ chính của mình. Một Quản trị hệ thống xét đơn — không có khe tự duyệt.',
    truong,
    nutOk: truc ? 'Chọn dòng họ' : (don.coDon ? 'Sửa đề xuất' : 'Nộp đề xuất'),
    nutThem: (!truc && don.coDon) ? { chu: 'Rút đơn', kieu: 'danger', lam: () => rutDeXuatDongHo(don.id) } : null,
    lam: (v) => (truc ? datDongHoQtht(v.cay) : nopDeXuatDongHo(v.cay, v.lyDo)),
  });
  if (kq) napLai();
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

function veBangCay(sec, phien, kqCay, napLai) {
  const $ = (id) => sec.querySelector('#' + id);
  const tbA = $('tk-cay-tbody');
  const tbB = $('gia-pha-extra');

  if (!kqCay.ok) { dongTrong(tbA, 7, kqCay.loi || 'Không đọc được danh sách gia phả.', napLai); return; }

  const ds = kqCay.ds.filter((c) => !c.daXoaLuc && trangThaiCuaToi(c));

  $('tk-cay-dem').textContent = ds.length + ' cây · Quyền của bạn trong từng sơ đồ';

  if (!ds.length) {
    const o = dongTrong(tbA, 7, 'Bạn chưa có chân trong gia phả nào. Xin vào một gia phả, hoặc nhận lời mời, ở khu Gia phả. ');
    o.append(lienKet('Mở khu Gia phả →', 'gia-pha'));
    return;
  }

  tbA.innerHTML = '';
  ds.forEach((c, i) => (i < SO_HIEN_TRUOC ? tbA : tbB).append(dongCay(c, phien)));

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

/**
 * ⚠ b126d — cột "Tôi được gắn với ai" đọc `phien.maNguoiGan`/`tenNguoiGan`,
 *   MỘT giá trị chung cho mọi dòng: gắn nay là chuyện của TÀI KHOẢN, không
 *   theo cây (`34`). Sửa/nộp mã ở panel *Mã người & Dòng họ* phía trên, không
 *   còn nút riêng trên từng dòng cây.
 */
function dongCay(c, phien) {
  const trangThai = trangThaiCuaToi(c);
  const cay = { treeId: c.fileId, ten: c.ten || '', maCay: c.treeCode };

  const vai = c.toiLaChu ? huyHieu('Chủ gia phả')
    : trangThai === 'duocmoi' ? huyHieu('Được mời: ' + (TEN_VAI[c.moiVai] || c.moiVai || ''), 'wait')
    : trangThai === 'donxin' ? huyHieu('Đơn xin vào', 'wait')
    : huyHieu(TEN_VAI[c.vaiCuaToi] || c.vaiCuaToi || '');

  let gan = '';
  if (trangThai === 'thanhvien') {
    gan = phien.maNguoiGan
      ? tenVaPhu(phien.tenNguoiGan || phien.maNguoiGan, 'Mã: ' + phien.maNguoiGan)
      : span('muted', 'Chưa gắn người');
  }

  const trang = trangThai === 'thanhvien' ? huyHieu('Đã duyệt')
    : trangThai === 'duocmoi' ? huyHieu('Chờ bạn nhận lời', 'wait')
    : huyHieu('Chờ duyệt', 'wait');

  const viec = [];
  if (c.coTheXem) viec.push(nutLink('Xem sơ đồ →', () => moSoDo(cay, phien)));
  if (trangThai === 'duocmoi') viec.push(lienKet('Nhận lời ở khu Gia phả →', 'gia-pha'));

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
