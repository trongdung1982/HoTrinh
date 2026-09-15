// ============================================================
// giapha-supabase · js/pages/quan-tri/trang-tai-khoan.js
// Vai trò  : Trang *Các gia phả của tài khoản* `#quan-tri-he-thong/tai-khoan/
//            <mã tài khoản>` — đổ dữ liệu vào section `#sys-account-trees` của
//            quantri3: mỗi dòng một cây, menu *Chọn ▾* đổi vai · gắn người ·
//            tin cậy · gỡ · duyệt đơn, cộng mời vào cây khác và đổi họ tên.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb, quan-tri/hop-thoai · trang-cay · khu-quan-tri-he-thong · o-bang
// Phiên bản: 1.0.0 · Cập nhật: 16/09/2026 (b118d)
// Sổ tay   : so-tay/trang-quan-tri.md
// ============================================================
//
// ⚠ **Luật 5b②:** cột *Số cây* của Sổ tài khoản là dòng TÓM TẮT; bấm vào mở
//   trang này — mỗi dòng mang TÊN CÂY của nó, và mọi hộp hỏi gọi tên cây ấy.
//   Đó là lý do việc SỬA được đứng ở đây mà không đứng trong ô tóm tắt.
//
// ⚠ **Tài khoản lấy theo MÃ NGẮN trong địa chỉ**, không theo `userId` — mã
//   ngắn là thứ người ta đọc cho nhau qua điện thoại.
//
// ⚠ Chỉ Quản trị hệ thống mở được thật — `ds_tai_khoan_he_thong()` và
//   `ds_cay_cua_tai_khoan()` gác bằng cờ ấy. Người khác gõ địa chỉ vẫn mở được
//   vỏ trang và nhận câu "không thấy"; trang không tự chặn.
//
// ⚠ Hộp hỏi đổi quyền dùng CHUNG với bảng Thành viên của trang cây
//   (`trang-cay.js`) — một việc, một bản.

import {
  dsTaiKhoanHeThong, dsCayCuaTaiKhoan, layDanhSachGiaPha, moiVaoCay, datHoTenTaiKhoan,
} from '../../services/sb.js';
import { duongDan } from './trang-chi-tiet.js';
import { hoi } from './hop-thoai.js';
import { datTabQuanTriHeThong } from './khu-quan-tri-he-thong.js';
import {
  hoiDoiVai, hoiGanNguoi, hoiTinCay, hoiGo, hoiDuyetDon, hoiTuChoiDon, moSoDo, cumCay,
} from './trang-cay.js';
import {
  TEN_VAI, CHON_VAI, td, span, tenVaPhu, huyHieu, nut, mucMenu, menuTuyChon, chuaCo,
  dongTrong, ngay,
} from './o-bang.js';

const LY_DO_CONG_KHAI =
  'Công khai theo từng trường thông tin chưa có ở máy chủ — việc riêng, làm sau b120.';

/**
 * @param {HTMLElement} sec  `section#sys-account-trees`
 * @param {object} ctx       do `khung.js` dựng — `thamSo` là mã tài khoản
 */
export async function mountTrangTaiKhoan(sec, ctx) {
  // Nút "← Sổ tài khoản" về khu cha — mở đúng tab ấy, như quantri3.
  datTabQuanTriHeThong('so-tai-khoan');

  const $ = (id) => sec.querySelector('#' + id);
  const tb = $('sat-trees-tbody');
  const bHoTen = $('btn-sat-ho-ten');
  const bThem = $('btn-sat-add-to-tree');
  $('sat-acc-name').textContent = 'Đang mở tài khoản…';
  $('sat-acc-meta').textContent = '';
  $('sat-acc-code').textContent = ctx.thamSo;
  $('sat-tree-count').textContent = '';
  bHoTen.disabled = true;
  bThem.disabled = true;
  dongTrong(tb, 7, 'Đang đọc…');

  const hashLuc = window.location.hash;
  const [kq, kqCay] = await Promise.all([dsTaiKhoanHeThong(), layDanhSachGiaPha()]);
  if (window.location.hash !== hashLuc) return;
  const napLai = () => mountTrangTaiKhoan(sec, ctx);

  if (!kq.ok) {
    $('sat-acc-name').textContent = 'Không mở được tài khoản';
    dongTrong(tb, 7, kq.loi || 'Máy chủ không trả lời.', napLai);
    return;
  }

  const tk = kq.ds.find((t) => t.maNgan === ctx.thamSo);
  if (!tk) {
    const laToi = ctx.phien && ctx.phien.maNgan === ctx.thamSo;
    $('sat-acc-name').textContent = 'Không thấy tài khoản mã ' + ctx.thamSo;
    dongTrong(tb, 7, laToi
      ? 'Đây là mã tài khoản của chính bạn. Trang này chỉ Quản trị hệ thống mở được; thông tin ' +
        'của bạn nằm ở khu Tài khoản.'
      : 'Sổ tài khoản không có mã ấy — hoặc bạn không phải Quản trị hệ thống, và chỉ Quản trị hệ ' +
        'thống xem được tài khoản của người khác.');
    return;
  }

  const quyen = [tk.laQuanTriHeThong ? 'Quản trị hệ thống' : '', tk.duocTaoCay ? 'Được tạo cây' : '']
    .filter(Boolean).join(' · ') || 'Thành viên thông thường';
  $('sat-acc-name').textContent = 'Các gia phả của ' + (tk.hoTen || tk.email);
  $('sat-acc-meta').textContent = ['Mã: ' + tk.maNgan, tk.email, 'Quyền hệ thống: ' + quyen,
    'Trạng thái: Hoạt động'].join(' · ');
  $('sat-acc-code').textContent = tk.maNgan;

  // — Đổi họ tên: chỗ DUY NHẤT điền tên cho một tài khoản (b109b) —
  bHoTen.disabled = false;
  bHoTen.onclick = async () => {
    const r = await hoi({
      tua: 'Đổi họ tên tài khoản',
      chu: 'Tên để NHẬN MẶT ' + tk.email + ' trong ô gợi ý — không phải tên người trong sơ đồ gia ' +
        'phả. Bỏ trống thì ô gợi ý chỉ hiện được địa chỉ email.',
      truong: [{ ma: 'ten', nhan: 'Họ tên', goiY: 'Nguyễn Văn Hùng — để trống là xoá tên', giaTri: tk.hoTen || '' }],
      nutOk: 'Lưu họ tên',
      lam: (v) => datHoTenTaiKhoan(tk.userId, v.ten),
    });
    if (r) napLai();
  };

  // — Thêm vào gia phả khác = gửi LỜI MỜI (chữ ký thứ nhất) —
  const dsCay = kqCay.ok ? kqCay.ds.filter((c) => !c.daXoaLuc) : [];
  const moiVao = async () => {
    const r = await hoi({
      tua: 'Thêm tài khoản vào gia phả',
      chu: 'Mời ' + tk.email + ' vào một gia phả. Lời mời là chữ ký thứ nhất — tài khoản này phải ' +
        'tự bấm Nhận thì mới thật sự vào cây. Ô gia phả mở ra ở mục trống, cố ý: lời mời phải nói ' +
        'rõ mời vào cây nào.',
      truong: [
        { ma: 'cay', nhan: 'Gia phả', chon: [['', '— chọn gia phả —'],
          ...dsCay.map((c) => [c.fileId, (c.ten || '') + ' · ' + c.treeCode])], giaTri: '' },
        { ma: 'vai', nhan: 'Quyền khi tham gia', chon: CHON_VAI, giaTri: 'sua' },
      ],
      nutOk: 'Gửi lời mời',
      lam: (v) => (v.cay ? moiVaoCay(v.cay, tk.email, v.vai, '')
        : { ok: false, loi: 'Chưa chọn gia phả — lời mời phải nói rõ mời vào cây nào.' }),
    });
    if (r) napLai();
  };
  bThem.disabled = tk.laChinhToi || !dsCay.length;
  bThem.title = tk.laChinhToi ? 'Không ai tự mời mình vào cây được.' : '';
  bThem.onclick = moiVao;

  const kqDs = await dsCayCuaTaiKhoan(tk.userId);
  if (window.location.hash !== hashLuc) return;
  if (!kqDs.ok) { dongTrong(tb, 7, kqDs.loi || 'Không đọc được các gia phả của tài khoản này.', napLai); return; }

  const ds = kqDs.ds;
  const soVao = ds.filter((c) => c.daDuyet).length;
  const treo = ds.length - soVao;
  $('sat-tree-count').textContent = 'Đang tham gia ' + soVao + ' cây' +
    (treo ? ' · ' + treo + ' đơn hoặc lời mời đang chờ' : '');

  if (!ds.length) {
    const o = dongTrong(tb, 7, 'Tài khoản này hiện chưa tham gia cây gia phả nào.');
    if (!bThem.disabled) {
      const b = nut('+ Thêm vào cây', 'warm');
      b.style.marginLeft = '8px';   // chép nguyên quantri3
      b.addEventListener('click', moiVao);
      o.append(b);
    }
    return;
  }

  tb.innerHTML = '';
  for (const c of ds) tb.append(dongCay(c, tk, ctx.phien, napLai));
}

function dongCay(c, tk, phien, napLai) {
  const tt = c.daDuyet ? 'thanhvien' : c.moiLuc ? 'duocmoi' : 'donxin';
  const cay = { treeId: c.treeId, ten: c.ten, maCay: c.maCay };
  // Hình dạng `t` mà các hộp hỏi chờ: quyền gắn vào TÀI KHOẢN, còn vai và mã
  // người thì theo TỪNG CÂY — ghép hai nguồn đúng ở đây.
  const t = {
    userId: tk.userId, email: tk.email, maNgan: tk.maNgan, laChinhToi: tk.laChinhToi,
    vai: c.vai, daDuyet: c.daDuyet, maNguoi: c.maNguoi, tenNguoi: c.tenNguoi,
    tinCay: c.tinCay, laChuCay: c.laChuCay,
  };

  const maCay = document.createElement('strong');
  maCay.textContent = c.maCay;

  // Người được mời mang vai `xem` tới lúc Nhận — hiện vai SẼ nhận (b110c).
  const vaiHien = tt === 'duocmoi' ? (c.moiVai || c.vai) : c.vai;
  const vai = huyHieu(c.laChuCay ? 'Chủ gia phả' : (TEN_VAI[vaiHien] || vaiHien),
    c.laChuCay || vaiHien === 'quan_tri' ? '' : 'wait');

  const trang = td(
    huyHieu(tt === 'thanhvien' ? 'Đã duyệt' : tt === 'duocmoi' ? 'Được mời — chờ họ bấm Nhận' : 'Đơn chờ duyệt',
      tt === 'thanhvien' ? '' : 'wait'),
    c.thamGia ? span('sub', ngay(c.thamGia)) : '');

  const cuaMinh = tk.laChinhToi
    ? 'Tài khoản của chính bạn — không ai đặt quyền cho chính mình được.' : '';
  const saoLuu = c.vai === 'sao_luu'
    ? 'Tài khoản sao lưu tự động — đổi vai hay gỡ nó là bản sao lưu đêm ra file rỗng.' : '';

  const ds = [];
  if (tt === 'thanhvien') {
    ds.push(
      mucMenu('Đổi vai trò trong cây',
        cuaMinh || (c.laChuCay ? 'Chủ gia phả không hạ vai được — bàn giao trước.' : '') || saoLuu,
        () => hoiDoiVai(t, cay, napLai)),
      mucMenu('Gắn / đổi mã người', cuaMinh, () => hoiGanNguoi(t, cay, napLai)),
      mucMenu(c.tinCay ? 'Tắt tin cậy (ghi thẳng)' : 'Bật tin cậy (ghi thẳng)', cuaMinh,
        () => hoiTinCay(t, cay, napLai)),
      mucMenu('Gỡ khỏi gia phả',
        cuaMinh || (c.laChuCay ? 'Không thể gỡ chủ sở hữu khi chưa bàn giao.' : '') || saoLuu,
        () => hoiGo(t, cay, napLai), 'danger'),
    );
  } else if (tt === 'donxin') {
    ds.push(
      mucMenu('Duyệt đơn vào ' + cumCay(cay), cuaMinh, () => hoiDuyetDon(t, cay, napLai)),
      mucMenu('Từ chối đơn', cuaMinh, () => hoiTuChoiDon(t, cay, napLai), 'danger'),
    );
  } else {
    // ⚠ Lời mời không có việc NHẬN hộ — chỉ thu hồi (chữ ký thứ hai là của họ).
    ds.push(mucMenu('Thu hồi lời mời', '', () => hoiGo(t, cay, napLai), 'danger'));
  }
  ds.push(null,
    mucMenu('Mở bảng thành viên của cây', '', () => {
      window.location.hash = duongDan('gia-pha', 'cay', c.maCay, 'thanh-vien');
    }),
    mucMenu('Xem sơ đồ', '', () => moSoDo(cay, phien)));

  const tr = document.createElement('tr');
  tr.append(
    td(tenVaPhu(c.ten || c.maCay, 'Mã: ' + c.maCay)),
    td(maCay),
    td(vai),
    td(c.maNguoi ? tenVaPhu(c.tenNguoi || c.maNguoi, 'ID: ' + c.maNguoi) : span('name', 'Chưa gắn')),
    td(chuaCo('Chưa có', LY_DO_CONG_KHAI)),
    trang,
    td(menuTuyChon('Chọn ▾', ds)),
  );
  return tr;
}
