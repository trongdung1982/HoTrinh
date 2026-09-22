// ============================================================
// giapha-supabase · js/pages/quan-tri/trang-cay.js
// Vai trò  : Trang MỘT gia phả `#gia-pha/cay/<mã cây>[/<mục>]` — đổ dữ liệu
//            vào ba section quantri3: `#tree-detail` (Tổng quan · Vòng đời ·
//            Đề xuất gắn người) · `#tree-members` · `#tree-requests`. Kèm các
//            hộp hỏi đổi quyền dùng chung với trang một tài khoản.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb, quan-tri/trang-chi-tiet · hop-thoai · o-goi-y · o-bang
// Phiên bản: 1.2.0 · Cập nhật: 23/09/2026 (b124c) — nới nút Duyệt đơn của mình
//            1.1.0 Vòng đời: xoá cây có hiệu lực NGAY (luật 4), *Rút đơn* đổi
//            thành *Trả lại cho chủ* — chỉ Quản trị hệ thống. Bảng Thành viên
//            & quyền nối duyệt/từ chối đơn xin đổi quyền (`23` mục 10).
// Sổ tay   : so-tay/trang-quan-tri.md
// ============================================================
//
// ⚠ **Cây lấy theo MÃ trong địa chỉ, không bao giờ theo `phien.treeId`.**
//   Luật 5a: mã sai thì nói "không thấy", KHÔNG rơi về cây đang mở.
//
// ⚠ **Ẩn / mờ nút KHÔNG phải hàng rào.** Hàng rào là bảy hàm SQL của `13` +
//   `18`. Mờ sẵn kèm lý do chỉ để không mời người ta bấm một thứ chắc chắn
//   bị từ chối — và ba lý do khoá (dòng của chính mình · lời mời chưa nhận ·
//   không đổi được quyền) phải TRÙNG lý do máy chủ từ chối, không rộng hơn.
//
// ⚠ Luật *"không ai đặt quyền cho chính mình"* không có ngoại lệ, kể cả Quản
//   trị hệ thống. Dòng của chính mình còn đúng MỘT lối: *Đề xuất mã người* —
//   nộp đơn để một quản trị KHÁC xét (cửa thứ tám, `21`).
//
// ⚠ Lời mời chưa nhận KHÔNG hiện ở bảng Thành viên — nó ở *Lời mời đã gửi*
//   của trang Mời gia nhập. Nhận hộ người khác là bỏ mất chữ ký thứ hai.

import {
  layDanhSachGiaPha, dsThanhVien, coTheQuanTri, laQuanTriCay, chonGiaPha,
  doiVaiThanhVien, ganNguoiChoThanhVien, datTinCayThanhVien, goThanhVien,
  doiChuCay, duyetThanhVien, tuChoiThanhVien, timNguoiTrongCay, timTaiKhoan,
  xinXoaCay, huyXinXoaCay, duyetXoaCay,
  nopDeXuatGan, rutDeXuatGan, deXuatGanCuaToi, dsDeXuatGan, duyetDeXuatGan, tuChoiDeXuatGan,
  dsXinDoiVai, duyetXinDoiVai,
} from '../../services/sb.js';
import { duongDan } from './trang-chi-tiet.js';
import { hoi } from './hop-thoai.js';
import { ganGoiY, dongNguoi, dongTaiKhoan } from './o-goi-y.js';
import {
  TEN_VAI, CHON_VAI, td, span, tenVaPhu, huyHieu, datHuyHieu, nut, nutMo, mucMenu,
  hangNut, menuTuyChon, chuaCo, dongTrong, ngayGio, chepKieu,
} from './o-bang.js';

/**
 * Mục con, đúng thứ tự thanh mục của `#tree-detail`. `ma` đi vào `#` nên là
 * giao kèo với người dùng. `view` = section quantri3 khác `#tree-detail`.
 *
 * ⚠ *Lời mời* KHÔNG là một mục: nút ấy trên thanh mục đi thẳng sang trang Mời
 *   gia nhập (`#gia-pha/moi/<mã>`), nơi quantri3 đặt bảng *Lời mời đã gửi*.
 *   Hai địa chỉ cho một bảng là hai chỗ để lệch nhau.
 */
export const MUC_TRANG_CAY = [
  { ma: 'tong-quan', chu: 'Tổng quan' },
  { ma: 'thanh-vien', chu: 'Thành viên & quyền', view: 'tree-members' },
  { ma: 'don-xin-vao', chu: 'Đơn xin vào', view: 'tree-requests' },
  // Nghĩa chốt 15/09/2026 (b116): Bàn giao chủ + Xoá cây.
  { ma: 'vong-doi', chu: 'Vòng đời' },
  // 9.2② — xét đơn đề xuất gắn mã người là việc của TỪNG CÂY.
  { ma: 'de-xuat-gan', chu: 'Đề xuất gắn người' },
];

const LY_DO_QUYEN_DE_NGHI =
  'Máy chủ chưa ghi quyền đề nghị vào đơn — duyệt xong đổi vai ở bảng Thành viên (đổi ở b118b).';

/**
 * @param {HTMLElement} sec  section của mục đang mở (khung đã chọn)
 * @param {object} ctx       do `khung.js` dựng — mọi giá trị đã được khung kiểm
 */
export async function mountTrangCay(sec, ctx) {
  const hashLuc = window.location.hash;
  if (ctx.muc === 'thanh-vien') return mountThanhVien(sec, ctx, hashLuc);
  if (ctx.muc === 'don-xin-vao') return mountDonXinVao(sec, ctx, hashLuc);
  return mountChiTiet(sec, ctx, hashLuc);
}

// ============================================================
// Mẩu dùng chung
// ============================================================

async function timCay(ctx) {
  const kq = await layDanhSachGiaPha();
  if (!kq.ok) return { loi: kq.loi || 'Máy chủ không trả lời.' };
  const cay = kq.ds.find((c) => c.treeCode === ctx.thamSo);
  if (cay) return { cay };
  return { loi: 'Không thấy gia phả mã ' + ctx.thamSo + ' — gõ nhầm mã, cây đã vào thùng rác, ' +
    'hoặc máy chủ không cho tài khoản này thấy cây ấy.' };
}

/** `{treeId, ten, maCay}` — hình dạng mọi hộp hỏi đổi quyền nhận. */
export function cayNho(c) {
  return { treeId: c.fileId, ten: c.ten || '', maCay: c.treeCode || '' };
}

/** `Nguyễn Trọng Bắc · NTB` */
export function nhanCay(cay) {
  return [cay.ten, cay.maCay].filter(Boolean).join(' · ') || '(gia phả không tên)';
}

/** *"gia phả X"* — không lặp chữ khi tên cây đã mang sẵn nó (ảnh b110b). */
export function cumCay(cay) {
  const n = nhanCay(cay);
  return /^gia\s*phả/i.test(n) ? n : 'gia phả ' + n;
}

/** Ô gợi ý người trong một cây — trả hàm gắn cho `hoi({truong})`. */
export function goiYNguoi(treeId) {
  return (el) => ganGoiY(el, {
    tim: async (chuoi) => (await timNguoiTrongCay(treeId, chuoi)).ds,
    ve: dongNguoi,
    giaTri: (m) => m.maNguoi,
  });
}

/** Mở cây trên trang sơ đồ — hỏi trước nếu phải đổi cây (luật 08/09/2026). */
export async function moSoDo(cay, phien) {
  if (cay.treeId === phien.treeId) { window.location.href = 'index.html'; return; }
  const kq = await hoi({
    tua: 'Đổi cây hiển thị tại sơ đồ?',
    chu: 'Trang sơ đồ sẽ mở “' + nhanCay(cay) + '” ở chế độ bạn được phép.',
    nutOk: 'Mở sơ đồ',
    lam: () => chonGiaPha(cay.treeId),
  });
  if (kq) window.location.href = 'index.html';
}

function datNguCanh(sec, chu) {
  for (const x of sec.querySelectorAll('[data-tree-context]')) x.textContent = chu;
}

function demVai(daVao) {
  const phan = [
    [daVao.filter((t) => t.laChuCay).length, 'chủ'],
    [daVao.filter((t) => !t.laChuCay && t.vai === 'quan_tri').length, 'quản trị'],
    [daVao.filter((t) => !t.laChuCay && t.vai === 'sua').length, 'thành viên'],
    [daVao.filter((t) => !t.laChuCay && t.vai === 'xem').length, 'khách'],
  ].filter(([n]) => n).map(([n, chu]) => n + ' ' + chu);
  return [daVao.length + ' người có quyền', ...phan].join(' · ');
}

// ============================================================
// Hộp hỏi đổi quyền — `t` là một dòng tài khoản TRONG `cay`
// ============================================================
//
// ⚠ Câu nào cũng gọi TÊN CÂY (luật 5a): vai trò không phải thuộc tính của tài
//   khoản — cùng một người là Quản trị gia phả cây A và Khách ở cây B.

export async function hoiDoiVai(t, cay, napLai) {
  const kq = await hoi({
    tua: 'Đổi vai trò',
    chu: 'Đổi vai của ' + t.email + ' trong ' + cumCay(cay) + '. Vai chỉ có hiệu lực ' +
      'trong cây này. Quyền cao nhất cấp được cho tài khoản khác là Quản trị gia phả.',
    truong: [{ ma: 'vai', nhan: 'Vai trò mới', chon: CHON_VAI,
      giaTri: CHON_VAI.some(([v]) => v === t.vai) ? t.vai : 'xem' }],
    nutOk: 'Đổi vai',
    lam: (v) => doiVaiThanhVien(cay.treeId, t.userId, v.vai),
  });
  if (kq) napLai();
}

export async function hoiGanNguoi(t, cay, napLai) {
  const kq = await hoi({
    tua: 'Gắn mã người trong sơ đồ',
    chu: 'Mã này quyết định ' + t.email + ' sửa được những ai TRONG ' + cumCay(cay) +
      ': bản thân, tổ tiên đường thẳng, toàn bộ con cháu, cộng vợ/chồng. Để trống ' +
      'là gỡ gắn — chỉ xem. Một mã chỉ gắn cho MỘT tài khoản.',
    truong: [{ ma: 'ma', nhan: 'Mã người', goiY: 'gõ tên hoặc mã — để trống là gỡ gắn',
      giaTri: t.maNguoi || '', ganVao: goiYNguoi(cay.treeId) }],
    nutOk: 'Lưu mã người',
    lam: (v) => ganNguoiChoThanhVien(cay.treeId, t.userId, v.ma),
  });
  if (kq) napLai();
}

export async function hoiTinCay(t, cay, napLai) {
  const bat = !t.tinCay;
  const kq = await hoi({
    tua: bat ? 'Bật tin cậy' : 'Tắt tin cậy',
    chu: 'Đang ' + (t.tinCay ? 'BẬT' : 'TẮT') + '. Bật là cho ' + t.email + ' ghi thẳng vào ' +
      cumCay(cay) + ': mỗi lần họ bấm Lưu là thành chính thức ngay, không qua hàng chờ ' +
      'kiểm duyệt. Cây khác không đổi theo.',
    nutOk: bat ? 'Bật tin cậy' : 'Tắt tin cậy',
    kieuOk: bat ? 'danger' : 'warm',
    lam: () => datTinCayThanhVien(cay.treeId, t.userId, bat),
  });
  if (kq) napLai();
}

export async function hoiGo(t, cay, napLai) {
  const laLoiMoi = !t.daDuyet;
  const kq = await hoi({
    tua: laLoiMoi ? 'Thu hồi lời mời' : 'Xóa khỏi gia phả',
    chu: laLoiMoi
      ? 'Thu hồi lời mời vào ' + cumCay(cay) + ' đã gửi cho ' + t.email + '?'
      : 'Gỡ ' + t.email + ' khỏi ' + cumCay(cay) + '? Tài khoản của họ vẫn còn, vẫn đăng ' +
        'nhập và xin vào lại được; chân ở những gia phả KHÁC không suy suyển.',
    nutOk: laLoiMoi ? 'Thu hồi' : 'Xóa khỏi gia phả',
    kieuOk: 'danger',
    lam: () => goThanhVien(cay.treeId, t.userId),
  });
  if (kq) napLai();
}

async function hoiBanGiaoCho(t, cay, napLai) {
  const kq = await hoi({
    tua: 'Bàn giao chủ sở hữu',
    chu: t.email + ' thành chủ ' + cumCay(cay) + ' và nhận toàn bộ quyền đổi quyền trong ' +
      'cây ấy. Chủ cũ ở lại làm Quản trị gia phả. Không có đường quay lại từ phía chủ cũ.',
    nutOk: 'Bàn giao', kieuOk: 'danger',
    lam: () => doiChuCay(cay.treeId, t.userId),
  });
  if (kq) napLai();
}

export async function hoiDuyetDon(t, cay, napLai) {
  const kq = await hoi({
    tua: 'Duyệt đơn xin gia nhập',
    chu: 'Duyệt là cấp quyền ĐỌC ' + cumCay(cay) + ' cho ' + t.email + ', và chỉ cây ấy.' +
      (t.loiNhan ? ' Lời nhắn: “' + t.loiNhan + '”.' : '') +
      ' Gắn mã người thì họ sửa được nhánh của người ấy; để trống thì chỉ xem.',
    truong: [{ ma: 'ma', nhan: 'Mã người trong sơ đồ', goiY: 'P0012 — để trống thì chỉ xem',
      ganVao: goiYNguoi(cay.treeId) }],
    nutOk: 'Duyệt',
    lam: (v) => duyetThanhVien(cay.treeId, t.email, v.ma.trim()),
  });
  if (kq) napLai();
}

export async function hoiTuChoiDon(t, cay, napLai) {
  const kq = await hoi({
    tua: 'Từ chối đơn',
    chu: 'Từ chối là XOÁ đơn của ' + t.email + ' vào ' + cumCay(cay) +
      ', không phải đánh dấu. Người ấy nộp lại được.',
    nutOk: 'Từ chối', kieuOk: 'danger',
    lam: () => tuChoiThanhVien(cay.treeId, t.email),
  });
  if (kq) napLai();
}

/** Duyệt hoặc từ chối đơn XIN ĐỔI QUYỀN của một thành viên (`23` mục 10c). */
export async function hoiDuyetXinDoiVai(t, xin, cay, napLai) {
  const kq = await hoi({
    tua: 'Duyệt đơn xin đổi quyền',
    chu: t.email + ' xin đổi từ ' + (TEN_VAI[xin.vaiHienTai] || xin.vaiHienTai || '') + ' sang ' +
      (TEN_VAI[xin.xinVai] || xin.xinVai) + ' trong ' + cumCay(cay) +
      (xin.xinVaiLyDo ? '. Lý do: “' + xin.xinVaiLyDo + '”.' : '.'),
    nutOk: 'Duyệt', kieuOk: 'warm',
    lam: () => duyetXinDoiVai(cay.treeId, t.userId, true),
  });
  if (kq) napLai();
}

export async function hoiTuChoiXinDoiVai(t, cay, napLai) {
  const kq = await hoi({
    tua: 'Từ chối đơn xin đổi quyền',
    chu: 'Từ chối là XOÁ đơn của ' + t.email + ', không đổi vai hiện tại. Người ấy xin lại được.',
    nutOk: 'Từ chối', kieuOk: 'danger',
    lam: () => duyetXinDoiVai(cay.treeId, t.userId, false),
  });
  if (kq) napLai();
}

/**
 * Nộp / sửa / rút ĐƠN đề xuất mã người cho CHÍNH MÌNH (`21`). Không gắn gì —
 * một quản trị KHÁC xét ở mục *Đề xuất gắn người* của cây ấy.
 */
export async function hoiDeXuatGan(cay, napLai) {
  const d = await deXuatGanCuaToi(cay.treeId);
  const phan = ['Bạn KHÔNG tự gắn mã người cho mình được — luật này không có ngoại lệ. ' +
    'Nộp đề xuất, rồi MỘT QUẢN TRỊ KHÁC xét. Đơn chỉ có hiệu lực trong ' + cumCay(cay) + '.'];
  if (d.coDon) {
    phan.push('Đang chờ xét: ' + d.maNguoi +
      (d.tenNguoi && d.tenNguoi !== d.maNguoi ? ' — ' + d.tenNguoi : '') +
      (d.taoLuc ? ' (nộp ' + ngayGio(d.taoLuc) + ')' : '') + '. Nộp lại là sửa đơn này.');
  }
  if (d.lanTuChoi) {
    phan.push('Lần trước bị từ chối' +
      (d.lanTuChoi.maNguoi ? ' (xin mã ' + d.lanTuChoi.maNguoi + ')' : '') +
      (d.lanTuChoi.xetLuc ? ' lúc ' + ngayGio(d.lanTuChoi.xetLuc) : '') +
      ': ' + (d.lanTuChoi.loiXet || '') + '.');
  }
  const kq = await hoi({
    tua: 'Đề xuất mã người',
    chu: phan.join(' '),
    truong: [
      { ma: 'ma', nhan: 'Mã người trong sơ đồ', goiY: 'gõ tên hoặc mã người — ví dụ P0012',
        giaTri: d.coDon ? d.maNguoi : '', ganVao: goiYNguoi(cay.treeId) },
      { ma: 'lyDo', nhan: 'Vì sao bạn là người này', goiY: 'không bắt buộc',
        giaTri: d.coDon ? (d.lyDo || '') : '' },
    ],
    nutOk: d.coDon ? 'Sửa đề xuất' : 'Nộp đề xuất',
    nutThem: d.coDon ? { chu: 'Rút đơn', kieu: 'danger', lam: () => rutDeXuatGan(d.id) } : null,
    lam: (v) => nopDeXuatGan(cay.treeId, v.ma, v.lyDo),
  });
  if (kq) napLai();
}

// ============================================================
// #tree-members — Thành viên và quyền
// ============================================================

async function mountThanhVien(sec, ctx, hashLuc) {
  const tb = sec.querySelector('#tm-tbody');
  const dem = sec.querySelector('#tm-dem');
  const nhac = sec.querySelector('#tm-chi-xem');
  dem.textContent = '';
  nhac.hidden = true;
  datNguCanh(sec, ctx.thamSo);
  dongTrong(tb, 5, 'Đang đọc danh sách…');

  const { cay, loi } = await timCay(ctx);
  if (window.location.hash !== hashLuc) return;
  if (!cay) { datNguCanh(sec, 'Không thấy gia phả mã ' + ctx.thamSo); dongTrong(tb, 5, loi); return; }
  datNguCanh(sec, (cay.ten || '') + ' · ' + cay.treeCode);

  // ⚠ `dsXinDoiVai` đi CÙNG LƯỢT — máy chủ tự trả rỗng nếu không phải quản
  //   trị, nên gọi luôn không tốn gì thêm khi `duocDoiQuyen` chưa biết trước.
  const [kq, duocDoiQuyen, dsXin] = await Promise.all([
    dsThanhVien(cay.fileId), coTheQuanTri(cay.fileId), dsXinDoiVai(cay.fileId),
  ]);
  if (window.location.hash !== hashLuc) return;

  const napLai = () => mountThanhVien(sec, ctx, window.location.hash);
  if (!kq.ok) { dongTrong(tb, 5, kq.loi || 'Không đọc được danh sách tài khoản.', napLai); return; }

  // Nợ b105: quản trị được phong XEM được bảng mà không đổi được quyền của ai.
  if (!duocDoiQuyen) {
    nhac.textContent = 'Bạn xem được danh sách này nhưng không đổi được quyền của ai, và ' +
      'không duyệt được đơn xin vào — việc ấy thuộc chủ gia phả và Quản trị hệ thống. ' +
      'Bạn vẫn sửa và duyệt nội dung bình thường.';
    nhac.hidden = false;
  }

  const ds = kq.ds.filter((t) => t.daDuyet);
  dem.textContent = demVai(ds) + (dsXin.length ? ' · ' + dsXin.length + ' đơn xin đổi quyền' : '');
  if (!ds.length) { dongTrong(tb, 5, 'Chưa có ai đã vào gia phả này.'); return; }

  const xinMap = new Map(dsXin.map((x) => [x.userId, x]));
  tb.innerHTML = '';
  const c = cayNho(cay);
  for (const t of ds) tb.append(dongThanhVien(t, c, duocDoiQuyen, napLai, xinMap.get(t.userId)));
}

function dongThanhVien(t, cay, duocDoiQuyen, napLai, xin) {
  const tr = document.createElement('tr');
  if (t.laChinhToi) tr.className = 'current-account';

  const oTen = td(tenVaPhu(t.laChinhToi ? 'Bạn' : (t.hoTen || ''),
    t.maNgan ? 'Mã tài khoản: ' + t.maNgan : ''));

  const oNguoi = td(t.maNguoi
    ? tenVaPhu(t.tenNguoi || t.maNguoi, 'ID: ' + t.maNguoi)
    : span('name', 'Chưa gắn'));

  // — Quyền: `button.link` của quantri3, bấm là đổi vai —
  const saoLuu = t.vai === 'sao_luu'
    ? 'Tài khoản sao lưu tự động — đổi vai hay gỡ nó là bản sao lưu đêm ra file rỗng.' : '';
  const cuaMinh = t.laChinhToi
    ? 'Dòng của chính bạn — không ai đặt quyền cho chính mình được, kể cả Quản trị hệ thống.' : '';
  const khongQuyen = duocDoiQuyen ? '' : 'Chỉ chủ gia phả và Quản trị hệ thống đổi được quyền.';

  const bVai = document.createElement('button');
  bVai.type = 'button';
  bVai.className = 'link';
  bVai.textContent = t.laChuCay ? 'Quản trị · Chủ gia phả' : (TEN_VAI[t.vai] || t.vai);
  const khoaVai = khongQuyen || cuaMinh ||
    (t.laChuCay ? 'Chủ gia phả không hạ vai được — muốn đổi chủ thì Bàn giao chủ sở hữu.' : '') || saoLuu;
  if (khoaVai) { bVai.disabled = true; bVai.title = khoaVai; }
  else bVai.addEventListener('click', () => hoiDoiVai(t, cay, napLai));
  const oVai = td(bVai);
  if (t.tinCay) oVai.append(span('sub', 'Tin cậy — ghi thẳng'));
  if (xin) oVai.append(span('sub', 'Xin đổi sang ' + (TEN_VAI[xin.xinVai] || xin.xinVai).toLowerCase() +
    (xin.xinVaiLyDo ? ' — “' + xin.xinVaiLyDo + '”' : '')));

  // — Hành động: chủ/QTHT có menu, người chỉ xem có đúng một nút mờ (quantri3) —
  let oViec;
  if (!duocDoiQuyen) {
    oViec = nutMo('Xóa người khỏi gia phả', khongQuyen, 'danger');
    if (t.laChinhToi) tr.classList.add('is-disabled-row');
  } else {
    const ds = [
      mucMenu('Gắn / đổi mã người', cuaMinh, () => hoiGanNguoi(t, cay, napLai)),
      mucMenu(t.tinCay ? 'Tắt tin cậy (ghi thẳng)' : 'Bật tin cậy (ghi thẳng)', cuaMinh,
        () => hoiTinCay(t, cay, napLai)),
      mucMenu('Bàn giao chủ sở hữu',
        cuaMinh || (t.laChuCay ? 'Người này đang là chủ gia phả.' : '') || saoLuu,
        () => hoiBanGiaoCho(t, cay, napLai)),
    ];
    if (t.laChinhToi) ds.push(mucMenu('Đề xuất mã người cho mình', '', () => hoiDeXuatGan(cay, napLai)));
    if (xin) {
      ds.push(
        mucMenu('Duyệt đổi sang ' + (TEN_VAI[xin.xinVai] || xin.xinVai).toLowerCase(), '',
          () => hoiDuyetXinDoiVai(t, xin, cay, napLai), 'warm'),
        mucMenu('Từ chối đơn xin đổi quyền', '', () => hoiTuChoiXinDoiVai(t, cay, napLai), 'danger'),
      );
    }
    ds.push(null, mucMenu('Xóa khỏi gia phả',
      cuaMinh || (t.laChuCay ? 'Không thể xóa chủ sở hữu khi chưa bàn giao' : '') || saoLuu,
      () => hoiGo(t, cay, napLai), 'danger'));
    oViec = menuTuyChon('Chọn hành động', ds);
  }
  const oHanhDong = td(oViec);
  oHanhDong.setAttribute('data-action-cell', '');

  tr.append(oTen, td(t.email), oNguoi, oVai, oHanhDong);
  return tr;
}

// ============================================================
// #tree-requests — Đơn xin gia nhập
// ============================================================

async function mountDonXinVao(sec, ctx, hashLuc) {
  const tb = sec.querySelector('#tr-tbody');
  const dem = sec.querySelector('#tr-dem');
  dem.textContent = '';
  datNguCanh(sec, ctx.thamSo);
  dongTrong(tb, 7, 'Đang đọc đơn…');

  const { cay, loi } = await timCay(ctx);
  if (window.location.hash !== hashLuc) return;
  if (!cay) { datNguCanh(sec, 'Không thấy gia phả mã ' + ctx.thamSo); dongTrong(tb, 7, loi); return; }
  datNguCanh(sec, (cay.ten || '') + ' · ' + cay.treeCode);

  const [kq, duocDoiQuyen] = await Promise.all([dsThanhVien(cay.fileId), coTheQuanTri(cay.fileId)]);
  if (window.location.hash !== hashLuc) return;

  const napLai = () => mountDonXinVao(sec, ctx, window.location.hash);
  if (!kq.ok) { dongTrong(tb, 7, kq.loi || 'Không đọc được danh sách đơn.', napLai); return; }

  // ⚠ Đơn = chưa duyệt VÀ không phải lời mời (`moiLuc` trống) — b110c.
  const ds = kq.ds.filter((t) => !t.daDuyet && !t.moiLuc);
  dem.textContent = ds.length + ' đơn';
  if (!ds.length) { dongTrong(tb, 7, 'Không có đơn xin vào nào đang chờ.'); return; }

  const c = cayNho(cay);
  const lyDo = 'Duyệt đơn là cấp quyền đọc — việc của chủ gia phả và Quản trị hệ thống.';
  tb.innerHTML = '';
  for (const t of ds) {
    const bDuyet = duocDoiQuyen ? nut('Duyệt', 'warm') : nutMo('Duyệt', lyDo, 'warm');
    const bTuChoi = duocDoiQuyen ? nut('Từ chối', 'danger') : nutMo('Từ chối', lyDo, 'danger');
    if (duocDoiQuyen) {
      bDuyet.addEventListener('click', () => hoiDuyetDon(t, c, napLai));
      bTuChoi.addEventListener('click', () => hoiTuChoiDon(t, c, napLai));
    }
    const tr = document.createElement('tr');
    tr.append(
      td(tenVaPhu(t.hoTen || '', t.loiNhan ? '“' + t.loiNhan + '”' : '')),
      td(t.email),
      td(t.maNgan),
      td(''),   // đơn chưa gắn người nào — gắn lúc duyệt
      td(chuaCo('Chưa có', LY_DO_QUYEN_DE_NGHI)),
      td(ngayGio(t.xinLuc || t.thamGia)),
      td(bDuyet, ' ', bTuChoi),
    );
    tb.append(tr);
  }
}

// ============================================================
// #tree-detail — Tổng quan · Vòng đời · Đề xuất gắn người
// ============================================================

async function mountChiTiet(sec, ctx, hashLuc) {
  const $ = (id) => sec.querySelector('#' + id);

  for (const b of sec.querySelectorAll('[data-td-muc]')) {
    const ma = b.dataset.tdMuc;
    if (b.parentElement.classList.contains('subnav')) b.classList.toggle('active', ma === ctx.muc);
    b.onclick = () => {
      window.location.hash = ma === 'loi-moi'
        ? duongDan('gia-pha', 'moi', ctx.thamSo) : ctx.hashMuc(ma);
    };
  }

  const layout = sec.querySelector('.layout');
  const tongQuan = $('td-tong-quan');
  const noiMuc = $('td-muc');
  layout.hidden = false;
  tongQuan.hidden = ctx.muc !== 'tong-quan';
  noiMuc.hidden = ctx.muc === 'tong-quan';
  noiMuc.innerHTML = '';
  $('td-vi-tri').textContent = '/ ' + ctx.thamSo;
  $('td-ten').textContent = 'Đang mở gia phả…';
  $('td-phu').textContent = '';
  $('td-trang-thai').hidden = true;
  $('td-so-don').hidden = true;

  const { cay, loi } = await timCay(ctx);
  if (window.location.hash !== hashLuc) return;
  if (!cay) {
    $('td-ten').textContent = 'Không mở được gia phả';
    $('td-phu').textContent = loi;
    layout.hidden = true;
    return;
  }

  $('td-vi-tri').textContent = '/ ' + (cay.ten || '') + ' · ' + cay.treeCode;
  $('td-ten').textContent = cay.ten || cay.treeCode;
  $('td-phu').textContent = 'Chi tiết cây' + (cay.emailChu ? ' · Chủ cây: ' + cay.emailChu : '');
  const tt = $('td-trang-thai');
  tt.hidden = false;
  if (cay.daXoaLuc) datHuyHieu(tt, 'Trong thùng rác', 'red');
  else if (cay.xinXoaLuc) datHuyHieu(tt, 'Đang chờ duyệt xoá', 'wait');
  else datHuyHieu(tt, 'Đang hoạt động');

  const napLai = () => mountChiTiet(sec, ctx, window.location.hash);

  if (ctx.muc === 'vong-doi') { veVongDoi(noiMuc, cay, ctx.phien, napLai); }

  const kqTV = await dsThanhVien(cay.fileId);
  if (window.location.hash !== hashLuc) return;
  const ds = kqTV.ok ? kqTV.ds : [];
  const daVao = ds.filter((t) => t.daDuyet);
  const don = ds.filter((t) => !t.daDuyet && !t.moiLuc);
  $('td-so-don').textContent = String(don.length);
  $('td-so-don').hidden = !don.length;

  if (ctx.muc === 'de-xuat-gan') { veDeXuat(noiMuc, cay, napLai, hashLuc); return; }
  if (ctx.muc !== 'tong-quan') return;

  $('td-ma').textContent = cay.treeCode;
  $('td-l-ten').textContent = cay.ten || '';
  datHuyHieu($('td-l-la'), cay.choNguoiLaThayTen ? 'Đang bật' : 'Đang tắt',
    cay.choNguoiLaThayTen ? '' : 'wait');
  const dangMo = cay.fileId === ctx.phien.treeId;
  datHuyHieu($('td-l-mac-dinh'), dangMo ? 'Đang bật' : 'Đang tắt', dangMo ? '' : 'wait');

  if (!kqTV.ok) {
    $('td-l-tv').textContent = '';
    $('td-c-tv').textContent = kqTV.loi || 'Không đọc được danh sách tài khoản.';
    $('td-c-don').textContent = '';
    return;
  }
  $('td-l-tv').textContent = daVao.length + ' người';
  const loai = [
    [daVao.some((t) => t.laChuCay), 'Chủ cây'],
    [daVao.some((t) => !t.laChuCay && t.vai === 'quan_tri'), 'Quản trị cây'],
    [daVao.some((t) => !t.laChuCay && t.vai === 'sua'), 'Thành viên'],
    [daVao.some((t) => !t.laChuCay && t.vai === 'xem'), 'Khách'],
  ].filter(([co]) => co).map(([, chu]) => chu);
  $('td-c-tv').textContent = daVao.length + ' người' + (loai.length ? ' · ' + loai.join(', ') : '') + '.';
  $('td-c-don').textContent = (don.length ? don.length + ' đơn đang chờ.' : 'Không có đơn nào đang chờ.') +
    ' Lời mời chưa nhận không tính vào đây.';
}

/** `.panel` › `.panel-head` của quantri3 — khung cho hai mục quantri3 chưa vẽ. */
function khungPanel(tua, phu) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  const dau = document.createElement('div');
  dau.className = 'panel-head';
  const h = document.createElement('h3');
  h.textContent = tua;
  dau.append(h);
  if (phu) dau.append(span('', phu));
  panel.append(dau);
  return panel;
}

/** Một `<li>` kiểu *Quyền cấp hệ thống* của quantri3: nhãn đậm + dòng phụ · nút. */
function dongList(ul, nhan, phu, ...nutPhai) {
  const li = document.createElement('li');
  const trai = document.createElement('div');
  const s = document.createElement('strong');
  chepKieu(s, 'display:block');
  s.textContent = nhan;
  trai.append(s);
  if (phu) trai.append(span('sub', phu));
  li.append(trai);
  if (nutPhai.length) li.append(hangNut(...nutPhai));
  ul.append(li);
}

/**
 * Vòng đời — Bàn giao chủ + Xoá cây (b116, luật 4 của `23` từ b118c).
 *
 * ⚠⚠ ĐỔI SO VỚI TRƯỚC b118c: *Xóa cây* nay có hiệu lực NGAY — gia phả ẩn với
 *   mọi người (trừ Quản trị hệ thống) từ giây bấm, không còn "vẫn dùng được
 *   trong lúc chờ duyệt". Và *"Rút đơn"* đổi tên thành *"Trả lại cho chủ"* —
 *   nay CHỈ Quản trị hệ thống bấm được, chủ cây không tự rút được nữa (đó
 *   không còn là rút đơn của mình, mà là đảo ngược một việc đã có hiệu lực).
 */
function veVongDoi(noi, cay, phien, napLai) {
  const laQT = Boolean(phien.laQuanTriHeThong);
  const duocLam = cay.toiLaChu || laQT;
  const c = cayNho(cay);
  const panel = khungPanel('Vòng đời gia phả', 'Bàn giao chủ sở hữu · xoá gia phả');
  const ul = document.createElement('ul');
  ul.className = 'list';
  panel.append(ul);

  // — Bàn giao —
  const bGiao = duocLam && !cay.daXoaLuc
    ? nut('Bàn giao chủ sở hữu')
    : nutMo('Bàn giao chủ sở hữu', 'Chỉ chủ gia phả và Quản trị hệ thống bàn giao được.');
  bGiao.addEventListener('click', async () => {
    let daChon = null;
    let oEmail = null;
    const kq = await hoi({
      tua: 'Bàn giao chủ sở hữu',
      chu: 'Chuyển quyền đứng tên ' + cumCay(c) + ' cho một tài khoản khác đã có chân trong ' +
        'cây. Gõ vài chữ của tên hoặc email rồi chọn đúng một dòng gợi ý. Chủ cũ ở lại làm ' +
        'Quản trị gia phả — không có đường quay lại từ phía chủ cũ.',
      truong: [{ ma: 'email', nhan: 'Tài khoản nhận', goiY: 'gõ vài chữ của tên hoặc email',
        ganVao: (el) => {
          oEmail = el;
          return ganGoiY(el, {
            tim: async (chuoi) => (await timTaiKhoan(cay.fileId, chuoi)).ds,
            ve: dongTaiKhoan,
            giaTri: (m) => m.email,
            khiChon: (m) => { daChon = m; },
          });
        } }],
      nutOk: 'Bàn giao', kieuOk: 'danger',
      // So lại email LÚC BẤM: gõ tay đè lên dòng đã chọn thì không còn là
      // tài khoản đã chọn nữa.
      lam: () => (daChon && oEmail && oEmail.value.trim() === daChon.email
        ? doiChuCay(cay.fileId, daChon.userId)
        : { ok: false, loi: 'Chọn đúng một tài khoản trong danh sách gợi ý — không gõ tay trần được.' }),
    });
    if (kq) napLai();
  });
  dongList(ul, 'Chủ gia phả', (cay.emailChu || '') + (cay.toiLaChu ? ' (bạn)' : ''), bGiao);

  // — Xoá —
  if (cay.daXoaLuc) {
    dongList(ul, 'Xóa gia phả', 'Đã ở trong thùng rác — khôi phục hoặc dọn ở Quản trị hệ thống › Thùng rác.');
  } else if (cay.xinXoaLuc) {
    // ⚠ Chỉ Quản trị hệ thống — chủ cây không tự trả lại được nữa (`23` mục 8b).
    const bTra = laQT ? nut('Trả lại cho chủ') : nutMo('Trả lại cho chủ', 'Chỉ Quản trị hệ thống.');
    bTra.addEventListener('click', async () => {
      const kq = await hoi({ tua: 'Trả lại cho chủ',
        chu: 'Mở lại ' + cumCay(c) + ' cho chủ gia phả — gia phả hết ẩn, dùng bình thường như trước.',
        nutOk: 'Trả lại', lam: () => huyXinXoaCay(cay.fileId) });
      if (kq) napLai();
    });
    const bDuyet = laQT ? nut('Duyệt đưa vào thùng rác', 'danger')
      : nutMo('Duyệt đưa vào thùng rác', 'Chỉ Quản trị hệ thống duyệt xoá.', 'danger');
    bDuyet.addEventListener('click', async () => {
      const kq = await hoi({ tua: 'Duyệt đưa vào thùng rác',
        chu: 'Duyệt xong, ' + cumCay(c) + ' (' + cay.soNguoi + ' người) vào thùng rác, giữ 120 ngày. ' +
          'Khôi phục được trước khi dọn.',
        nutOk: 'Duyệt', kieuOk: 'danger', lam: () => duyetXoaCay(cay.fileId) });
      if (kq) napLai();
    });
    dongList(ul, 'Xóa gia phả', 'Đã bị ' + (cay.emailXinXoa || 'chủ cây') + ' xoá' +
      (cay.xinXoaLyDo ? ' — “' + cay.xinXoaLyDo + '”' : '') +
      '. Gia phả ĐANG ẨN với mọi người trừ Quản trị hệ thống, chờ duyệt.', bTra, bDuyet);
  } else {
    const bXoa = duocLam ? nut('Xóa cây', 'danger')
      : nutMo('Xóa cây', 'Chỉ chủ gia phả và Quản trị hệ thống xoá được gia phả.', 'danger');
    bXoa.addEventListener('click', async () => {
      const kq = await hoi({ tua: 'Xóa cây',
        chu: '⚠️ ' + cumCay(c) + ' sẽ ẨN NGAY với mọi người (trừ Quản trị hệ thống) — không còn ' +
          '"vẫn dùng được trong lúc chờ". Quản trị hệ thống sẽ trả lại cho bạn nếu nhầm, hoặc duyệt ' +
          'đưa hẳn vào thùng rác.',
        oNhap: { nhieuDong: true, goiY: 'Vì sao xoá? Ví dụ: dựng nhầm, đã gộp vào cây khác.' },
        nutOk: 'Xoá ngay', kieuOk: 'danger', lam: (lyDo) => xinXoaCay(cay.fileId, lyDo) });
      if (kq) napLai();
    });
    dongList(ul, 'Xóa gia phả', 'Đang dùng bình thường.', bXoa);
  }

  noi.append(panel);
}

/**
 * Đề xuất gắn người — xét đơn b111c. Đơn của chính mình: Duyệt/Từ chối mờ
 * (cửa thứ TÁM, gác ở máy chủ), còn nút Rút.
 */
async function veDeXuat(noi, cay, napLai, hashLuc) {
  const c = cayNho(cay);
  const panel = khungPanel('Đơn đề xuất gắn mã người', '');
  const bang = document.createElement('table');
  const thead = document.createElement('thead');
  const trDau = document.createElement('tr');
  for (const chu of ['Tài khoản', 'Tự nhận là', 'Lý do', 'Nộp lúc', 'Hành động']) {
    const th = document.createElement('th');
    th.textContent = chu;
    trDau.append(th);
  }
  thead.append(trDau);
  const tb = document.createElement('tbody');
  bang.append(thead, tb);
  panel.append(bang);
  noi.append(panel);
  dongTrong(tb, 5, 'Đang đọc đơn…');

  // b124c — `tuDuyetDuoc` KHÔNG suy được từ `duocDoiQuyen`: cái sau bật cho cả
  // Quản trị hệ thống, mà cờ ấy không cho tự duyệt (`luoc-do/29`, luật 11.10).
  const [ds, duocDoiQuyen, tuDuyetDuoc] = await Promise.all([
    dsDeXuatGan(cay.fileId), coTheQuanTri(cay.fileId), laQuanTriCay(cay.fileId)]);
  if (window.location.hash !== hashLuc) return;

  panel.querySelector('.panel-head').append(span('', ds.length + ' đơn đang chờ · mỗi đơn là một ' +
    'người tự nhận mình là ai trong sơ đồ; duyệt là mở quyền sửa nhánh của người ấy'));
  if (!ds.length) { dongTrong(tb, 5, 'Không có đơn đề xuất gắn mã người nào đang chờ trong ' + cumCay(c) + '.'); return; }

  tb.innerHTML = '';
  for (const d of ds) {
    const khoa = d.laCuaToi && !tuDuyetDuoc
      ? 'Đơn của chính bạn — người nộp không ký luôn chữ thứ hai. Nhờ một quản trị khác xét, hoặc rút đơn.'
      : duocDoiQuyen ? '' : 'Bạn xem được đơn này nhưng không xét được — việc của chủ gia phả và Quản trị hệ thống.';

    // ⚠ Tự TỪ CHỐI đơn mình thì máy chủ vẫn chặn (`21` mục 7) — đường đúng là
    //   nút Rút đơn ngay dưới. Chỉ nút Duyệt được nới.
    const khoaTuChoi = d.laCuaToi
      ? 'Đơn của chính bạn — muốn thôi thì rút đơn về, không phải tự từ chối mình.'
      : khoa;

    const bDuyet = khoa ? nutMo('Duyệt', khoa, 'warm') : nut('Duyệt', 'warm');
    bDuyet.addEventListener('click', async () => {
      const kq = await hoi({ tua: 'Duyệt đề xuất',
        chu: 'Gắn ' + d.maNguoi + ' cho ' + d.email + ' trong ' + cumCay(c) + ' — mở quyền sửa bản ' +
          'thân, tổ tiên đường thẳng và toàn bộ con cháu của người ấy.',
        nutOk: 'Duyệt', lam: () => duyetDeXuatGan(d.id) });
      if (kq) napLai();
    });
    const bTuChoi = khoaTuChoi ? nutMo('Từ chối', khoaTuChoi, 'danger') : nut('Từ chối', 'danger');
    bTuChoi.addEventListener('click', async () => {
      const kq = await hoi({ tua: 'Từ chối đề xuất',
        chu: 'Người nộp đọc lại được câu lý do này — bắt buộc ghi.',
        oNhap: { nhieuDong: true, goiY: 'Lý do từ chối' },
        nutOk: 'Từ chối', kieuOk: 'danger', lam: (lyDo) => tuChoiDeXuatGan(d.id, lyDo) });
      if (kq) napLai();
    });
    const viec = [bDuyet, bTuChoi];
    if (d.laCuaToi) {
      const bRut = nut('Rút đơn');
      bRut.addEventListener('click', async () => {
        const kq = await hoi({ tua: 'Rút đơn', chu: 'Rút đơn đề xuất ' + d.maNguoi + ' của bạn?',
          nutOk: 'Rút đơn', lam: () => rutDeXuatGan(d.id) });
        if (kq) napLai();
      });
      viec.push(bRut);
    }

    const oTk = td(tenVaPhu(d.email, d.maNgan ? 'Mã tài khoản: ' + d.maNgan : ''));
    if (d.laCuaToi) oTk.append(huyHieu('Đơn của bạn', 'wait'));
    // ⚠ Nói TRƯỚC khi ai bấm: mã đang gắn cho người khác thì máy chủ từ chối (Q18).
    const oLyDo = td(d.lyDo ? '“' + d.lyDo + '”' : '');
    if (d.maDangCo) oLyDo.append(span('sub', 'Mã này đang gắn cho ' + d.maDangCo + ' — duyệt sẽ bị từ chối.'));

    const tr = document.createElement('tr');
    tr.append(oTk, td(tenVaPhu(d.tenNguoi || d.maNguoi, 'ID: ' + d.maNguoi)), oLyDo,
      td(ngayGio(d.taoLuc)), td(hangNut(...viec)));
    tb.append(tr);
  }
}
