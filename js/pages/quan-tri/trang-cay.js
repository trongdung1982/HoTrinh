// ============================================================
// giapha-supabase · js/pages/quan-tri/trang-cay.js
// Vai trò  : Trang chi tiết MỘT gia phả (`#gia-pha/cay/<mã cây>`) — mục Tổng
//            quan đọc thật; bốn mục còn lại nói thẳng làm ở bước nào.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb, config, quan-tri/trang-chi-tiet
// Phiên bản: 0.1.0 · Cập nhật: 15/09/2026 07:40 (b115)
// ============================================================
//
// b115 dựng KHUNG, chưa đổi ruột khu nào (`KE-HOACH.md`). Trang này vì thế
// chỉ ĐỌC: một lời gọi `layDanhSachGiaPha()` — cùng hàm khu Gia phả dùng, nên
// không mở thêm cửa nào ở máy chủ — rồi vẽ những gì máy chủ đã cho người này
// thấy về cây ấy. Không nút ghi nào.
//
// ⚠ **Cây lấy theo MÃ trong địa chỉ, không bao giờ theo `phien.treeId`.**
//   Luật 5a: không màn hình nào được ngầm định cây đang mở. Mã sai thì nói
//   "không thấy", KHÔNG lẳng lặng rơi về cây đang mở — rơi về là để người ta
//   làm việc trên một cây trong khi tưởng là cây kia.
//
// ⚠ Mục *Vòng đời* của prototype CHƯA có ở đây: nghĩa của nó chưa hỏi
//   (`THIET-KE-QUAN-TRI.md` 9.5, hỏi ở b116). Vẽ một mục chưa ai biết chứa gì
//   là mời bấm vào chỗ trống.

import { layDanhSachGiaPha } from '../../services/sb.js';
import { vaiTroBangChu } from '../../config.js';
import { veVoChiTiet, veChuaChuyen } from './trang-chi-tiet.js';

/**
 * Mục con của trang, đúng thứ tự trên thanh mục. `ma` đi vào `#` của địa chỉ
 * nên là giao kèo với người dùng, như `ma` của khu.
 *
 * `hienNay` = hôm nay việc ấy làm ở đâu. Bỏ trường này đi đúng lúc mục ấy
 * được viết thật.
 */
export const MUC_TRANG_CAY = [
  { ma: 'tong-quan', chu: 'Tổng quan' },
  { ma: 'thanh-vien', chu: 'Thành viên & quyền',
    hienNay: ['Chuyển sang đây ở b116. Hôm nay: khu Tài khoản, chọn cây này ở ô chọn cây.',
              'thanh-vien', 'Mở khu Tài khoản'] },
  { ma: 'loi-moi', chu: 'Lời mời',
    hienNay: ['Chuyển sang đây ở b116. Hôm nay: khu Gia phả, cột Mời ở dòng của cây này.',
              'gia-pha', 'Mở khu Gia phả'] },
  { ma: 'don-xin-vao', chu: 'Đơn xin vào',
    hienNay: ['Chuyển sang đây ở b116. Hôm nay: khu Tài khoản, nút Xét đơn.',
              'thanh-vien', 'Mở khu Tài khoản'] },
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
  if (muc.hienNay) veChuaChuyen(nd, ...muc.hienNay);
  else veTongQuan(nd, cay);
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
