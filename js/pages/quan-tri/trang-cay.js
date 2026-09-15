// ============================================================
// giapha-supabase · js/pages/quan-tri/trang-cay.js
// Vai trò  : Trang chi tiết MỘT gia phả (`#gia-pha/cay/<mã cây>`) — Tổng
//            quan · Thành viên & quyền · Lời mời · Đơn xin vào · Vòng đời đọc
//            và ghi thật; mục Đề xuất gắn người còn nói làm ở bước nào (b117).
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb, config, quan-tri/trang-chi-tiet,
//            quan-tri/khu-thanh-vien (dùng lại `veBang`), quan-tri/o-goi-y
// Phiên bản: 0.2.0 · Cập nhật: 15/09/2026 (b116)
//            0.2.0 Ba mục *Thành viên & quyền · Lời mời · Đơn xin vào* điền
//            thật — dùng lại NGUYÊN VẸN `veBang()` của `khu-thanh-vien.js`,
//            chỉ lọc `ds` theo `trangThaiDong()` trước khi vẽ (không viết
//            bảng thứ hai). Mục *Vòng đời* (chốt nghĩa 15/09/2026 với chủ dự
//            án: Bàn giao chủ + Xoá cây) mới hoàn toàn.
// ============================================================
//
// ⚠ **Cây lấy theo MÃ trong địa chỉ, không bao giờ theo `phien.treeId`.**
//   Luật 5a: không màn hình nào được ngầm định cây đang mở. Mã sai thì nói
//   "không thấy", KHÔNG lẳng lặng rơi về cây đang mở — rơi về là để người ta
//   làm việc trên một cây trong khi tưởng là cây kia.
//
// ⚠ Ba mục dùng lại `veBang()` đều gọi `dsThanhVien(cay.fileId)` RIÊNG —
//   không gộp một lần fetch cho cả ba, vì chỉ một mục hiện trên màn hình tại
//   một lúc (đúng luật 2 của `khung.js`: mỗi lần chỉ một khu/trang gọi máy
//   chủ). Đổi tab thì đổi luôn `#`, và `mountTrangCay()` chạy lại từ đầu.

import {
  layDanhSachGiaPha, dsThanhVien, coTheQuanTri,
  xinXoaCay, huyXinXoaCay, duyetXoaCay, doiChuCay, timTaiKhoan,
} from '../../services/sb.js';
import { vaiTroBangChu } from '../../config.js';
import { veVoChiTiet, veChuaChuyen } from './trang-chi-tiet.js';
import { veBang, trangThaiDong, nut, veLoi } from './khu-thanh-vien.js';
import { ganGoiY, dongTaiKhoan } from './o-goi-y.js';

/**
 * Mục con của trang, đúng thứ tự trên thanh mục. `ma` đi vào `#` của địa chỉ
 * nên là giao kèo với người dùng, như `ma` của khu.
 *
 * `hienNay` = hôm nay việc ấy làm ở đâu. Bỏ trường này đi đúng lúc mục ấy
 * được viết thật.
 */
export const MUC_TRANG_CAY = [
  { ma: 'tong-quan', chu: 'Tổng quan' },
  { ma: 'thanh-vien', chu: 'Thành viên & quyền' },
  { ma: 'loi-moi', chu: 'Lời mời' },
  { ma: 'don-xin-vao', chu: 'Đơn xin vào' },
  // Nghĩa chốt với chủ dự án 15/09/2026 (b116): Bàn giao chủ + Xoá cây — hai
  // việc đổi "cây này còn tồn tại / ai đứng tên nó" chứ không phải quyền của
  // một người trong đó.
  { ma: 'vong-doi', chu: 'Vòng đời' },
  // 9.2② — xét đơn đề xuất gắn mã người là việc của TỪNG CÂY, nên nó đứng ở
  // đây cạnh Đơn xin vào, không phải một tab của Quản trị hệ thống.
  { ma: 'de-xuat-gan', chu: 'Đề xuất gắn người',
    hienNay: ['Chuyển sang đây ở b117. Hôm nay: khu Tài khoản, khối xét đơn đề xuất dưới bảng.',
              'thanh-vien', 'Mở khu Tài khoản'] },
];

/**
 * @param {HTMLElement} el
 * @param {object} ctx  do `khung.js` dựng — mọi giá trị đã được khung kiểm
 * @param {string} ctx.thamSo      mã cây trong địa chỉ
 * @param {string} ctx.muc         `ma` của mục đang mở, luôn có trong MUC_TRANG_CAY
 * @param {string} ctx.hashQuayVe
 * @param {string} ctx.chuQuayVe
 * @param {(ma:string)=>string} ctx.hashMuc
 */
export async function mountTrangCay(el, ctx) {
  el.textContent = 'Đang mở gia phả…';

  // ⚠ Người bấm sang chỗ khác trong lúc chờ máy chủ thì khung đã vẽ trang
  //   khác vào đúng `el` này. Kết quả về muộn mà vẫn vẽ là đè lên trang người
  //   ta vừa mở — nên so lại địa chỉ trước khi vẽ.
  const hashLuc = window.location.hash;
  const kq = await layDanhSachGiaPha();
  if (window.location.hash !== hashLuc) return;

  const vo = { hashQuayVe: ctx.hashQuayVe, chuQuayVe: ctx.chuQuayVe };

  if (!kq.ok) {
    const nd = veVoChiTiet(el, { ...vo, tua: 'Không mở được gia phả' });
    veChuaChuyen(nd, kq.loi || 'Máy chủ không trả lời.');
    return;
  }

  const cay = kq.ds.find((c) => c.treeCode === ctx.thamSo);
  if (!cay) {
    const nd = veVoChiTiet(el, { ...vo, viTri: ctx.thamSo,
      tua: 'Không thấy gia phả mã ' + ctx.thamSo });
    veChuaChuyen(nd,
      'Danh sách gia phả của tài khoản này không có mã ấy. Có thể gõ nhầm mã, ' +
      'cây đã vào thùng rác, hoặc máy chủ không cho tài khoản này thấy cây ấy.',
      ctx.hashQuayVe, 'Về danh sách gia phả');
    return;
  }

  const nd = veVoChiTiet(el, {
    ...vo,
    viTri: cay.ten + ' · ' + cay.treeCode,
    tua: cay.ten,
    phu: 'Mã cây ' + cay.treeCode,
    muc: MUC_TRANG_CAY,
    mucDangMo: ctx.muc,
    hashMuc: ctx.hashMuc,
  });

  const muc = MUC_TRANG_CAY.find((m) => m.ma === ctx.muc);
  if (muc.hienNay) { veChuaChuyen(nd, ...muc.hienNay); return; }

  if (muc.ma === 'tong-quan') veTongQuan(nd, cay);
  else if (muc.ma === 'thanh-vien') veMucBang(nd, cay, ctx.phien, 'thanhvien',
    'Không có ai đã vào gia phả này.');
  else if (muc.ma === 'loi-moi') veMucBang(nd, cay, ctx.phien, 'duocmoi',
    'Không có lời mời nào đang chờ.');
  else if (muc.ma === 'don-xin-vao') veMucBang(nd, cay, ctx.phien, 'donxin',
    'Không có đơn xin vào nào đang chờ.');
  else if (muc.ma === 'vong-doi') veVongDoi(nd, cay, ctx.phien,
    () => mountTrangCay(el, ctx));
}

/**
 * Bảng thông tin một cây. Trường trống thì KHÔNG vẽ hàng đó (`CLAUDE.md`
 * mục 7) — không "Không rõ", không gạch ngang.
 */
function veTongQuan(el, cay) {
  const dong = [];

  if (cay.emailChu) dong.push(['Chủ cây', cay.emailChu + (cay.toiLaChu ? ' (tôi)' : '')]);
  if (cay.soNguoi) dong.push(['Số người trong sơ đồ', String(cay.soNguoi)]);

  // Ba trạng thái loại trừ nhau, đúng thứ tự `veOThaoTac()` của khu Gia phả:
  // lời mời đứng TRƯỚC — xem được cây không có nghĩa là có chân trong cây.
  if (cay.duocMoi) {
    dong.push(['Tôi trong cây này', 'Đang được mời làm ' + vaiTroBangChu(cay.moiVai) +
      (cay.emailNguoiMoi ? ' — mời bởi ' + cay.emailNguoiMoi : '')]);
  } else if (cay.vaiCuaToi) {
    dong.push(['Tôi trong cây này', vaiTroBangChu(cay.vaiCuaToi)]);
  } else if (cay.daNopDon) {
    dong.push(['Tôi trong cây này', 'Đã nộp đơn xin vào, đang chờ duyệt']);
  }

  dong.push(['Người lạ thấy tên', cay.choNguoiLaThayTen ? 'Đang bật' : 'Đang tắt']);

  // ⚠ Câu này tả luật MÁY CHỦ ĐANG CHẠY (xin rồi mới ẩn), không phải luật
  //   11.9 đã chốt mà SQL chưa theo kịp (b118b). Màn hình đi trước máy chủ là
  //   màn hình nói dối.
  if (cay.daXoaLuc) dong.push(['Trạng thái', 'Đã vào thùng rác']);
  else if (cay.xinXoaLuc) {
    dong.push(['Trạng thái', 'Chủ cây đã xin xoá' +
      (cay.xinXoaLyDo ? ' — ' + cay.xinXoaLyDo : '') +
      '. Cây vẫn dùng bình thường trong lúc chờ duyệt.']);
  }

  const dl = document.createElement('dl');
  dl.className = 'qt-tt';
  for (const [nhan, giaTri] of dong) {
    const hang = document.createElement('div');
    hang.className = 'qt-tt-dong';
    const dt = document.createElement('dt');
    dt.textContent = nhan;
    const dd = document.createElement('dd');
    dd.textContent = giaTri;
    hang.append(dt, dd);
    dl.append(hang);
  }
  el.append(dl);
}

// ============================================================
// Thành viên & quyền · Lời mời · Đơn xin vào — dùng lại veBang()
// ============================================================

/**
 * Ba mục cùng một khuôn: đọc `dsThanhVien(cay.fileId)`, lọc theo
 * `trangThaiDong()`, rồi vẽ đúng bảng `khu-thanh-vien.js` đã dùng — cùng năm
 * việc (đổi vai · gắn người · tin cậy · gỡ · bàn giao), cùng luật khoá nút
 * trên dòng của chính mình và trên lời mời chưa nhận. Không viết lại.
 *
 * @param {HTMLElement} nd
 * @param {object} cay        `{fileId, ten, treeCode, ...}` từ `ds_gia_pha()`
 * @param {object} phien
 * @param {'thanhvien'|'duocmoi'|'donxin'} trangThai
 * @param {string} chuRong    câu nói khi lọc ra rỗng
 */
async function veMucBang(nd, cay, phien, trangThai, chuRong) {
  nd.textContent = 'Đang đọc danh sách…';
  nd.style.cssText = 'color:#8a8078';

  const treeId = cay.fileId;
  const [kq, duocDoiQuyen] = await Promise.all([
    dsThanhVien(treeId), coTheQuanTri(treeId),
  ]);

  const napLai = () => veMucBang(nd, cay, phien, trangThai, chuRong);
  nd.innerHTML = '';
  nd.style.cssText = '';

  if (!kq.ok) {
    nd.append(veLoi(kq.loi || 'Không đọc được danh sách tài khoản.', napLai));
    return;
  }

  const ds = (kq.ds || []).filter((t) => trangThaiDong(t) === trangThai);
  if (!ds.length) {
    const r = document.createElement('div');
    r.className = 'qt-chua-lam';
    r.textContent = chuRong;
    nd.append(r);
    return;
  }

  const cayNho = { treeId: cay.fileId, ten: cay.ten || '', maCay: cay.treeCode || '' };
  const oViec = document.createElement('div');
  const bo = { oViec, dangMo: null, nut: [], oVai: [] };

  nd.append(veBang(ds, phien, cayNho, duocDoiQuyen, napLai, bo));
  nd.append(oViec);
}

// ============================================================
// Vòng đời — Bàn giao chủ + Xoá cây
// ============================================================
//
// Nghĩa chốt với chủ dự án 15/09/2026 (b116): mục này gộp hai việc đã có sẵn
// ở máy chủ (`doiChuCay` · `xinXoaCay`/`huyXinXoaCay`/`duyetXoaCay`) vào MỘT
// chỗ, thay vì rải rác — cả hai đều đổi "cây này còn hay không, đứng tên ai",
// khác hẳn năm việc đổi quyền của MỘT người trong ba mục trên.
//
// ⚠ Không `alert()`, không `confirm()` — luật chung cả app.

async function veVongDoi(nd, cay, phien, napLaiTrang) {
  nd.innerHTML = '';

  if (cay.toiLaChu) nd.append(veKhoiBanGiao(cay, napLaiTrang));
  nd.append(veKhoiXoa(cay, phien, napLaiTrang));
}

function veKhoiKhung(tua) {
  const khoi = document.createElement('section');
  khoi.style.cssText =
    'margin-bottom:18px;padding:14px 16px;border:1px solid #e6e0d8;' +
    'border-radius:10px;background:#faf8f5';
  const h = document.createElement('h3');
  h.textContent = tua;
  h.style.cssText = 'margin:0 0 6px;font-size:14px;color:#2a2622';
  khoi.append(h);
  return khoi;
}

/** Chỉ chủ cây thấy khối này. */
function veKhoiBanGiao(cay, napLaiTrang) {
  const khoi = veKhoiKhung('Bàn giao gia phả');

  const dan = document.createElement('p');
  dan.textContent =
    'Chuyển quyền đứng tên "' + (cay.ten || 'gia phả này') +
    '" cho một tài khoản khác đã có chân trong gia phả. Bạn sẽ thôi là chủ ' +
    'ngay khi bàn giao xong — muốn lấy lại thì người nhận phải bàn giao ngược lại.';
  dan.style.cssText = 'margin:0 0 10px;font-size:12px;color:#6a625a;line-height:1.5';
  khoi.append(dan);

  const hang = document.createElement('div');
  hang.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start';

  const oEmail = document.createElement('input');
  oEmail.type = 'email';
  oEmail.placeholder = 'gõ vài chữ của tên hoặc email';
  oEmail.autocomplete = 'off';
  oEmail.style.cssText =
    'flex:1 1 220px;min-width:200px;padding:7px;border:1px solid #dcd5cb;' +
    'border-radius:6px;font:inherit;font-size:12px';

  let userIdChon = '';
  const goGoiY = ganGoiY(oEmail, {
    tim: async (chuoi) => (await timTaiKhoan(cay.fileId, chuoi)).ds,
    ve: dongTaiKhoan,
    giaTri: (m) => m.email,
    khiChon: (m) => { userIdChon = m.userId; },
  });
  // Gõ tay (không chọn từ gợi ý) thì mất mã đã chọn trước đó.
  oEmail.addEventListener('input', () => { userIdChon = ''; });

  const b = nut('Bàn giao', false);
  b.style.cssText += ';border-color:#a83220;color:#a83220';
  b.addEventListener('click', async () => {
    if (!userIdChon) {
      hang.append(dongLoiCuc(
        'Gõ vài chữ rồi chọn đúng một dòng trong danh sách gợi ý — không gõ tay ' +
        'trần được, phải là một tài khoản có thật.'));
      return;
    }
    b.disabled = true;
    b.textContent = 'Đang bàn giao…';
    const kq = await doiChuCay(cay.fileId, userIdChon);
    if (kq.ok) { goGoiY(); napLaiTrang(); return; }
    b.disabled = false;
    b.textContent = 'Bàn giao';
    hang.append(dongLoiCuc(kq.loi || 'Không bàn giao được.'));
  });

  hang.append(oEmail, b);
  khoi.append(hang);
  return khoi;
}

/** Chủ cây và Quản trị hệ thống thấy nút; người khác chỉ thấy trạng thái. */
function veKhoiXoa(cay, phien, napLaiTrang) {
  const khoi = veKhoiKhung('Xoá gia phả');
  const laQT = phien.laQuanTriHeThong;

  if (cay.daXoaLuc) {
    const p = document.createElement('p');
    p.textContent = '"' + (cay.ten || 'Gia phả này') + '" đã ở trong thùng rác. ' +
      'Phục hồi hoặc dọn hẳn ở khu Gia phả, khối Thùng rác.';
    p.style.cssText = 'margin:0;font-size:12px;color:#6a625a;line-height:1.5';
    khoi.append(p);
    return khoi;
  }

  if (!cay.toiLaChu && !laQT) {
    const p = document.createElement('p');
    p.textContent = cay.xinXoaLuc
      ? ('Chủ gia phả đã xin xoá' + (cay.xinXoaLyDo ? ' — "' + cay.xinXoaLyDo + '"' : '') +
         '. Đang chờ Quản trị hệ thống duyệt.')
      : 'Chỉ chủ gia phả và Quản trị hệ thống xin/xoá được gia phả này.';
    p.style.cssText = 'margin:0;font-size:12px;color:#6a625a;line-height:1.5';
    khoi.append(p);
    return khoi;
  }

  const than = document.createElement('div');
  khoi.append(than);
  veThanXoa(than, cay, laQT, napLaiTrang);
  return khoi;
}

function veThanXoa(than, cay, laQT, napLaiTrang) {
  than.innerHTML = '';

  if (!cay.xinXoaLuc) {
    const dan = document.createElement('p');
    dan.textContent =
      'Gửi đơn xin xoá "' + (cay.ten || 'gia phả này') + '". Gia phả vẫn dùng ' +
      'bình thường cho tới khi Quản trị hệ thống duyệt.';
    dan.style.cssText = 'margin:0 0 8px;font-size:12px;color:#6a625a;line-height:1.5';
    than.append(dan);

    const oLyDo = document.createElement('textarea');
    oLyDo.rows = 2;
    oLyDo.maxLength = 500;
    oLyDo.placeholder = 'Vì sao xin xoá? (không bắt buộc)';
    oLyDo.style.cssText =
      'width:100%;max-width:420px;box-sizing:border-box;padding:7px;' +
      'border:1px solid #dcd5cb;border-radius:6px;font:inherit;font-size:12px;' +
      'resize:vertical;display:block;margin-bottom:8px';
    than.append(oLyDo);

    const b = nut('Xin xoá', false);
    b.style.cssText += ';border-color:#a83220;color:#a83220';
    b.addEventListener('click', async () => {
      b.disabled = true;
      b.textContent = 'Đang gửi…';
      const kq = await xinXoaCay(cay.fileId, oLyDo.value);
      if (kq.ok) { napLaiTrang(); return; }
      b.disabled = false;
      b.textContent = 'Xin xoá';
      than.append(dongLoiCuc(kq.loi || 'Không gửi được đơn.'));
    });
    than.append(b);
    return;
  }

  const ai = document.createElement('p');
  ai.textContent = (cay.emailXinXoa || 'ai đó') + ' đã xin xoá' +
    (cay.xinXoaLyDo ? ' — "' + cay.xinXoaLyDo + '"' : '') + '.';
  ai.style.cssText = 'margin:0 0 8px;font-size:12px;color:#6a625a;line-height:1.5';
  than.append(ai);

  const hang = document.createElement('div');
  hang.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';

  const bRut = nut('Rút đơn', false);
  bRut.addEventListener('click', async () => {
    bRut.disabled = true;
    bRut.textContent = 'Đang rút…';
    const kq = await huyXinXoaCay(cay.fileId);
    if (kq.ok) { napLaiTrang(); return; }
    bRut.disabled = false;
    bRut.textContent = 'Rút đơn';
    hang.append(dongLoiCuc(kq.loi || 'Không rút được đơn.'));
  });
  hang.append(bRut);

  if (laQT) {
    const bDuyet = nut('Duyệt xoá', true);
    bDuyet.addEventListener('click', () => veHoiDuyetXoaCuc(than, hang, bDuyet, cay, napLaiTrang));
    hang.append(bDuyet);
  } else {
    const cho = document.createElement('span');
    cho.textContent = 'chờ Quản trị hệ thống duyệt';
    cho.style.cssText = 'font-size:11px;color:#8a8078;align-self:center';
    hang.append(cho);
  }

  than.append(hang);
}

function veHoiDuyetXoaCuc(than, hang, bDuyet, cay, napLaiTrang) {
  bDuyet.disabled = true;

  const hoi = document.createElement('div');
  hoi.style.cssText =
    'margin-top:8px;padding:8px;border:1px solid #e2c9a8;background:#fdf7ee;' +
    'border-radius:7px;font-size:11px;color:#6a5233;line-height:1.45';
  hoi.textContent =
    'Duyệt xong, "' + (cay.ten || 'gia phả này') + '" (' + cay.soNguoi +
    ' người) đóng lại với mọi người và nằm trong thùng rác 30 ngày. Phục hồi ' +
    'được bất cứ lúc nào trước khi dọn.';

  const hangNut = document.createElement('div');
  hangNut.style.cssText = 'display:flex;gap:6px;margin-top:7px;justify-content:flex-end';

  const bThoi = nut('Thôi', false);
  bThoi.addEventListener('click', () => { hoi.remove(); bDuyet.disabled = false; });

  const bOk = nut('Duyệt xoá', true);
  bOk.addEventListener('click', async () => {
    bOk.disabled = true; bThoi.disabled = true;
    bOk.textContent = 'Đang duyệt…';
    const kq = await duyetXoaCay(cay.fileId);
    if (kq.ok) { napLaiTrang(); return; }
    bOk.disabled = false; bThoi.disabled = false;
    bOk.textContent = 'Duyệt xoá';
    hoi.append(dongLoiCuc(kq.loi || 'Không duyệt được.'));
  });

  hangNut.append(bThoi, bOk);
  hoi.append(hangNut);
  hang.after(hoi);
}

function dongLoiCuc(chu) {
  const d = document.createElement('div');
  d.textContent = chu;
  d.style.cssText = 'margin-top:6px;font-size:12px;color:#a83220;line-height:1.4;flex-basis:100%';
  return d;
}
