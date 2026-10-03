// ============================================================
// giapha-supabase · js/pages/quan-tri/khu-tao-tai-khoan.js
// Vai trò  : Tab *+ Tạo tài khoản mới* của `#quan-tri-he-thong` — đổ việc vào
//            form quantri3 có sẵn (`#form-tao-tai-khoan`), không vẽ lại.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb · quan-tri/hop-thoai
// Sổ tay   : so-tay/tao-tai-khoan.md · so-tay/trang-quan-tri.md
// Phiên bản: 0.2.0 · Cập nhật: 03/10/2026 (b171) — bỏ lựa chọn gửi liên kết qua email
// ============================================================
//
// ⚠ Chuỗi BỐN bước, chỉ bước 1 cần Edge Function: ① `taoTaiKhoan` (Edge
//   Function `tao-tai-khoan`) ② họ tên ③ quyền tạo cây ④ lời mời QTHT —
//   ②③④ là các hàm SQL cũ, cùng luật + nhật ký như nút ở Sổ tài khoản.
//   Bước 1 xong thì tài khoản ĐÃ CÓ: bước sau hỏng cũng không trả lỗi cho
//   hộp thoại (bấm lại sẽ vấp "email đã có") — báo ra ở hộp kết quả.
//
// ⚠ App KHÔNG gửi thư (không dùng dịch vụ email): lựa chọn *Gửi liên kết qua
//   email* bị GỠ khỏi ô chọn. Chỉ còn *Mật khẩu tạm* — máy chủ sinh, hiện MỘT lần.

import {
  taoTaiKhoan, datHoTenTaiKhoan, datDuocTaoCay, datQuanTriHeThong,
} from '../../services/sb.js';
import { hoi, bao } from './hop-thoai.js';

/**
 * @param {HTMLElement} sec  `section#quan-tri-he-thong`
 * @param {() => void} napLai  vẽ lại cả khu (Sổ tài khoản có dòng mới)
 */
export function veKhuTaoTaiKhoan(sec, napLai) {
  const $ = (id) => sec.querySelector('#' + id);
  const oTen = $('new-acc-name');
  const oEmail = $('new-acc-email');
  const oMa = $('new-acc-code');
  const oKieu = $('new-acc-pass-type');
  const oTaoCay = $('new-acc-perm-create-tree');
  const oQtht = $('new-acc-perm-qtht');

  $('ttk-chua-co').textContent = 'Máy chủ sinh một mật khẩu tạm 10 ký tự, hiện MỘT lần sau khi tạo — ' +
    'chép lại và đưa tận tay người nhận. Họ đăng nhập được ngay, rồi tự đổi ở khu Tài khoản → Đổi mật khẩu.';

  // Không gửi thư: bỏ hẳn lựa chọn liên kết qua email, chỉ còn mật khẩu tạm.
  oKieu.querySelector('option[value="invite_link"]').remove();
  oKieu.value = 'temp_pass';
  oKieu.disabled = true;
  oMa.placeholder = 'Máy chủ sinh sau khi tạo';

  const datLai = () => {
    oTen.value = '';
    oEmail.value = '';
    oMa.value = '';
    oTaoCay.checked = false;
    oQtht.checked = false;
  };
  $('btn-reset-form-tao-tk').onclick = datLai;
  $('btn-submit-tao-tk').onclick = () => hoiTao(
    { hoTen: oTen.value.trim(), email: oEmail.value.trim(), taoCay: oTaoCay.checked, qtht: oQtht.checked },
    (ma) => { datLai(); oMa.value = ma; napLai(); });
}

async function hoiTao(v, xong) {
  if (!v.hoTen) { await bao('Thiếu họ tên', 'Điền Họ và tên người dùng trước.'); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) {
    await bao('Email chưa đúng', 'Điền một địa chỉ email đúng khuôn, ví dụ giang@email.vn.');
    return;
  }

  const quyen = [v.taoCay ? 'quyền Tạo gia phả mới' : '', v.qtht ? 'lời mời Quản trị hệ thống' : '']
    .filter(Boolean);
  const kq = await hoi({
    tua: 'Tạo tài khoản mới',
    chu: 'Tạo tài khoản ' + v.email + ' (' + v.hoTen + ')' +
      (quyen.length ? ', kèm ' + quyen.join(' và ') : '') + '? Tài khoản đăng nhập được ngay ' +
      'bằng mật khẩu tạm máy chủ sinh ra.',
    nutOk: 'Tạo tài khoản',
    nutHuy: 'Hủy',
    kieuOk: 'warm',
    lam: () => chayChuoi(v),
  });
  if (!kq) return;

  const r = kq.kq;
  await bao('Đã tạo tài khoản', 'Email: ' + r.email + '\nMật khẩu tạm: ' + r.matKhau +
    (r.maNgan ? '\nMã tài khoản: ' + r.maNgan : '') +
    '\n\nChép mật khẩu ngay — đóng hộp này là không xem lại được.' +
    (r.hong.length ? '\n\n⚠ Tài khoản đã có, nhưng mấy bước sau chưa xong — làm tay ở Sổ tài khoản:\n• ' +
      r.hong.join('\n• ') : ''));
  xong(r.maNgan);
}

/** Bước 1 hỏng → trả lỗi (hộp thoại giữ nguyên để sửa). Bước sau hỏng → gom vào `hong`. */
async function chayChuoi(v) {
  const tk = await taoTaiKhoan(v.email);
  if (!tk.ok) return tk;

  const hong = [];
  const buoc = async (ten, lam) => {
    const k = await lam();
    if (!k.ok) hong.push(ten + ': ' + (k.loi || 'máy chủ từ chối'));
  };
  await buoc('Họ tên', () => datHoTenTaiKhoan(tk.userId, v.hoTen));
  if (v.taoCay) await buoc('Quyền tạo cây', () => datDuocTaoCay(tk.userId, true));
  if (v.qtht) await buoc('Lời mời Quản trị hệ thống', () => datQuanTriHeThong(tk.userId, true));
  return { ...tk, hong };
}
