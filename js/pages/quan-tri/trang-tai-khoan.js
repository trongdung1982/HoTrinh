// ============================================================
// giapha-supabase · js/pages/quan-tri/trang-tai-khoan.js
// Vai trò  : Trang chi tiết MỘT tài khoản (`#thanh-vien/tai-khoan/<mã tài
//            khoản>`) — Tổng quan · Các gia phả liên quan. CHỈ ĐỌC.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb, config, quan-tri/trang-chi-tiet,
//            quan-tri/khu-thanh-vien (mẩu vẽ + `trangThaiDong`)
// Phiên bản: 0.2.0 · Cập nhật: 15/09/2026 (b118)
//            0.2.0 Khu cha đổi từ `thanh-vien` sang `quan-tri-he-thong` —
//            file này tự KHÔNG hardcode tên khu (nhận `ctx.hashQuayVe` /
//            `ctx.chuQuayVe` từ `khung.js`), chỉ câu "Về khu …" ở nhánh
//            "không thấy tài khoản" là phải sửa tay.
// ============================================================
//
// ⚠ **Tài khoản lấy theo MÃ NGẮN trong địa chỉ**, không theo `userId`. Mã ngắn
//   là `not null unique` (`11` mục 1) và là thứ người ta đọc cho nhau qua điện
//   thoại; một chuỗi uuid trong link thì không ai đọc được, cũng không ai kiểm
//   được link mình nhận có đúng người không.
//
// ⚠ **Trang này KHÔNG có nút nào**, và đó là luật 5b② chứ không phải việc còn
//   thiếu. Mọi thứ ở đây hoặc là cờ cấp tài khoản (đã có chỗ sửa ở khu *Quản
//   trị hệ thống*), hoặc là quyền trong MỘT cây — mà chỗ sửa quyền trong một cây là
//   bảng của cây ấy, nơi tên cây đứng ngay cạnh ô đang sửa. Mỗi dòng ở mục
//   *Các gia phả liên quan* là một liên kết sang đúng bảng ấy. Chép năm việc
//   đổi quyền sang đây là dựng chỗ thứ ba để chúng lệch nhau.
//
// ⚠ Chỉ Quản trị hệ thống mở được thật — `ds_tai_khoan_he_thong()` và
//   `ds_cay_cua_tai_khoan()` đều gác bằng cờ ấy ở máy chủ. Người khác gõ địa
//   chỉ vẫn mở được vỏ trang và nhận câu "không thấy"; trang không tự chặn,
//   vì trang không phải hàng rào.

import { dsTaiKhoanHeThong, dsCayCuaTaiKhoan } from '../../services/sb.js';
import { vaiTroBangChu } from '../../config.js';
import { veVoChiTiet, veChuaChuyen, duongDan } from './trang-chi-tiet.js';
import {
  huyHieu, o, veLoi, gioVietNam, nhanCay, trangThaiDong,
  capChieuCao, CSS_DAU_BANG,
} from './khu-thanh-vien.js';

/** Mục con — `ma` đi vào `#` của địa chỉ, là giao kèo với người dùng. */
export const MUC_TRANG_TAI_KHOAN = [
  { ma: 'tong-quan', chu: 'Tổng quan' },
  { ma: 'gia-pha', chu: 'Các gia phả liên quan' },
];

/**
 * @param {HTMLElement} el
 * @param {object} ctx  do `khung.js` dựng — mọi giá trị đã được khung kiểm
 * @param {string} ctx.thamSo  mã tài khoản trong địa chỉ
 */
export async function mountTrangTaiKhoan(el, ctx) {
  el.textContent = 'Đang mở tài khoản…';

  // Bấm sang chỗ khác trong lúc chờ thì khung đã vẽ trang khác vào `el` —
  // kết quả về muộn không được đè lên. Cùng luật `trang-cay.js`.
  const hashLuc = window.location.hash;
  const kq = await dsTaiKhoanHeThong();
  if (window.location.hash !== hashLuc) return;

  const vo = { hashQuayVe: ctx.hashQuayVe, chuQuayVe: ctx.chuQuayVe };

  if (!kq.ok) {
    const nd = veVoChiTiet(el, { ...vo, tua: 'Không mở được tài khoản' });
    veChuaChuyen(nd, kq.loi || 'Máy chủ không trả lời.');
    return;
  }

  const tk = (kq.ds || []).find((t) => t.maNgan === ctx.thamSo);
  if (!tk) {
    const nd = veVoChiTiet(el, { ...vo, viTri: ctx.thamSo,
      tua: 'Không thấy tài khoản mã ' + ctx.thamSo });
    // ⚠ Hai câu khác nhau cho hai người khác nhau. Người gõ đúng mã CỦA MÌNH
    //   mà không phải Quản trị hệ thống thì không hỏng gì cả — họ chỉ đang ở
    //   nhầm cửa, và cửa đúng là khu Tài khoản.
    const laToi = ctx.phien && ctx.phien.maNgan && ctx.phien.maNgan === ctx.thamSo;
    veChuaChuyen(nd, laToi
      ? 'Đây là mã tài khoản của chính bạn. Trang chi tiết một tài khoản chỉ ' +
        'Quản trị hệ thống mở được; thông tin của bạn nằm ở khu Tài khoản.'
      : 'Sổ tài khoản không có mã ấy — hoặc bạn đang đăng nhập bằng một tài ' +
        'khoản không phải Quản trị hệ thống, và chỉ Quản trị hệ thống xem được ' +
        'tài khoản của người khác.',
      ctx.hashQuayVe, 'Về khu Quản trị hệ thống');
    return;
  }

  const nd = veVoChiTiet(el, {
    ...vo,
    viTri: 'Tài khoản ' + tk.maNgan,
    tua: tk.hoTen || tk.email || tk.maNgan,
    phu: (tk.hoTen && tk.email ? tk.email + ' · ' : '') + 'mã ' + tk.maNgan,
    muc: MUC_TRANG_TAI_KHOAN,
    mucDangMo: ctx.muc,
    hashMuc: ctx.hashMuc,
  });

  if (ctx.muc === 'gia-pha') veCacGiaPha(nd, tk, hashLuc);
  else veTongQuan(nd, tk);
}

// ============================================================
// Tổng quan
// ============================================================

function veTongQuan(nd, tk) {
  const soCay = [String(tk.soCay) + ' gia phả'];
  if (tk.soCho) soCay.push(tk.soCho + ' đơn đang chờ');
  if (tk.soMoi) soCay.push(tk.soMoi + ' lời mời chưa nhận');

  const dong = [
    ['Họ tên', tk.hoTen],
    ['Email', tk.email
      ? tk.email + (tk.daXacNhanEmail ? ' · đã xác nhận' : ' · CHƯA xác nhận') : ''],
    ['Mã tài khoản', tk.maNgan],
    ['Quản trị hệ thống', tk.laQuanTriHeThong ? 'Có' : 'Không'],
    ['Được dựng gia phả mới', !tk.duocTaoCay ? 'Không'
      : tk.laQuanTriHeThong ? 'Có — đi kèm cờ Quản trị hệ thống' : 'Có'],
    ['Có chân ở', soCay.join(' · ')],
    ['Đang làm chủ', tk.soCayLamChu ? tk.soCayLamChu + ' gia phả' : ''],
    ['Đăng ký', tk.taoLuc ? gioVietNam(tk.taoLuc) : ''],
    // Mốc trống ở đây KHÔNG phải trường trống — "chưa đăng nhập lần nào" là
    // thông tin, và là thông tin đáng đọc nhất khi đoán một email gõ nhầm.
    ['Đăng nhập gần nhất', tk.dangNhapGanNhat
      ? gioVietNam(tk.dangNhapGanNhat) : 'Chưa đăng nhập lần nào'],
  ];

  const dl = document.createElement('dl');
  dl.className = 'qt-tt';
  for (const [nhan, giaTri] of dong) {
    if (!giaTri) continue;
    const hang = document.createElement('div');
    hang.className = 'qt-tt-dong';
    const dt = document.createElement('dt');
    dt.textContent = nhan;
    const dd = document.createElement('dd');
    dd.textContent = giaTri;
    if (nhan === 'Mã tài khoản' && tk.laChinhToi) dd.append(huyHieu('Bạn', false));
    hang.append(dt, dd);
    dl.append(hang);
  }
  nd.append(dl);

  const ghi = document.createElement('p');
  ghi.className = 'qt-ghi qt-ghi-khoi';
  ghi.textContent =
    'Trang này chỉ để xem. Hai cờ cấp tài khoản, họ tên, mời vào cây và xoá ' +
    'tài khoản: bấm tên tài khoản ở sổ đăng ký của khu Quản trị hệ thống. Vai ' +
    'trò và mã người trong MỘT gia phả: mục Các gia phả liên quan, bấm tên gia phả.';
  nd.append(ghi);
}

// ============================================================
// Các gia phả liên quan
// ============================================================

/** Mục của trang cây ứng với từng trạng thái — nơi dòng ấy SỬA được. */
const MUC_CAY_THEO_TRANG_THAI = {
  thanhvien: 'thanh-vien', duocmoi: 'loi-moi', donxin: 'don-xin-vao',
};

async function veCacGiaPha(nd, tk, hashLuc) {
  nd.textContent = 'Đang đọc các gia phả…';

  const kq = await dsCayCuaTaiKhoan(tk.userId);
  if (window.location.hash !== hashLuc) return;
  nd.innerHTML = '';

  if (!kq.ok) {
    nd.append(veLoi(kq.loi || 'Không đọc được các gia phả của tài khoản này.',
      () => veCacGiaPha(nd, tk, hashLuc)));
    return;
  }

  const ds = kq.ds || [];
  if (!ds.length) {
    const r = document.createElement('div');
    r.className = 'qt-chua-lam';
    r.textContent = 'Tài khoản này chưa có chân, đơn xin vào hay lời mời ở gia phả nào.';
    nd.append(r);
    return;
  }

  const ghi = document.createElement('p');
  ghi.className = 'qt-ghi';
  ghi.style.margin = '0 0 10px';
  ghi.textContent = 'Chỉ để đọc. Bấm tên gia phả để mở bảng của đúng cây ấy — ' +
    'chỗ đổi vai và gắn mã người, nơi tên cây đứng cạnh ô đang sửa.';
  nd.append(ghi);

  const khung = document.createElement('div');
  khung.className = 'qt-cuon-ngang';
  capChieuCao(khung, ds.length);

  const bang = document.createElement('table');
  bang.className = 'qt-bang';

  const thead = document.createElement('thead');
  const trDau = document.createElement('tr');
  for (const chu of ['Gia phả', 'Vai trò', 'Người được gắn', 'Trạng thái']) {
    const th = document.createElement('th');
    th.style.cssText = CSS_DAU_BANG;
    th.textContent = chu;
    trDau.append(th);
  }
  thead.append(trDau);
  bang.append(thead);

  const ruot = document.createElement('tbody');
  for (const c of ds) {
    const trangThai = trangThaiDong(c);
    const tr = document.createElement('tr');

    const oCay = o('', '');
    const a = document.createElement('a');
    a.className = 'qt-lk';
    a.href = '#' + duongDan('gia-pha', 'cay', c.maCay, MUC_CAY_THEO_TRANG_THAI[trangThai]);
    a.textContent = nhanCay({ ten: c.ten, maCay: c.maCay });
    oCay.append(a);

    // Người được mời mang `xem` tới lúc Nhận — hiện vai SẼ nhận (b110c).
    const vai = trangThai === 'duocmoi' ? (c.moiVai || c.vai) : c.vai;
    const oVai = o(vaiTroBangChu(vai), 'white-space:nowrap');

    const oNguoi = o('', '');
    if (c.maNguoi) {
      const ten = document.createElement('div');
      ten.style.fontWeight = '600';
      ten.textContent = c.tenNguoi || c.maNguoi;
      oNguoi.append(ten);
      if (c.tenNguoi && c.tenNguoi !== c.maNguoi) {
        const ma = document.createElement('div');
        ma.className = 'qt-ghi';
        ma.textContent = 'Mã: ' + c.maNguoi;
        oNguoi.append(ma);
      }
    }

    const oTrang = o(trangThai === 'duocmoi' ? 'Được mời — chờ họ bấm Nhận'
      : trangThai === 'donxin' ? 'Đơn xin vào chờ duyệt'
      : 'Đã vào' + (c.tinCay ? ' · tin cậy' : ''), '');
    if (c.laChuCay) oTrang.append(huyHieu('Chủ gia phả', true));

    tr.append(oCay, oVai, oNguoi, oTrang);
    ruot.append(tr);
  }
  bang.append(ruot);
  khung.append(bang);
  nd.append(khung);
}
