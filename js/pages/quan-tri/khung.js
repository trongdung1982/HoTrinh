// ============================================================
// giapha-supabase · js/pages/quan-tri/khung.js
// Vai trò  : Khung trang Quản trị — gắn điều hướng vào HTML quantri3 có sẵn
//            trong QuanTri.html, đọc `#`, hiện đúng MỘT `<section class="view">`
//            và giao cho khu/trang ấy đổ dữ liệu.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb, pages/dang-nhap,
//            pages/quan-tri/khu-kiem-duyet · khu-gia-pha · khu-tai-khoan ·
//            khu-quan-tri-he-thong · trang-cay · trang-tai-khoan · trang-moi ·
//            trang-chi-tiet
// Phiên bản: 1.0.0 · Cập nhật: 15/09/2026 (b118c)
//            1.0.0 (b118c) KHÔNG DỰNG KHUNG NỮA. Thanh trái, đầu trang, các
//            `section` đều là HTML của prototype quantri3 nằm sẵn trong
//            `QuanTri.html`; file này chỉ hiện/ẩn và gắn việc. Mỗi khu/trang
//            khai `view` = `id` của section nó vẽ vào. Khu chưa chuyển sang
//            giao diện quantri3 vẽ vào `#khu-tam` bằng mã cũ.
//            0.6.0 (b118) khu thứ tư *Quản trị hệ thống*. 0.5.0 (b117) khu 2
//            *Tài khoản của tôi*. 0.4.0 (b115) lớp TRANG CHI TIẾT.
// ============================================================
//
// ═══ BA LUẬT CỦA KHUNG NÀY, VÀ VÌ SAO ═══
//
//   1. **Thanh điều hướng mang con số cần nhìn.** Số đơn chờ duyệt và số thay
//      đổi chờ kiểm duyệt đứng trong `<b>` của chính nút ấy (kiểu quantri3).
//      Mỗi số tồn tại đúng một chỗ.
//
//   2. **Mỗi lần chỉ hiện MỘT section, và chỉ khu ấy gọi máy chủ.** Mở trang
//      lần đầu chỉ tốn hai lời gọi đếm cho hai con số trên thanh.
//
//   3. **Khu đang mở ghi vào `#` của địa chỉ.** Tải lại về đúng chỗ cũ, gửi
//      link cho nhau được, nút Back chạy đúng.
//
// ⚠ **Không có kết cục "không đủ quyền".** Trang này KHÔNG phải hàng rào —
//   hàng rào nằm ở Postgres. Nút *Quản trị hệ thống* ẩn với người không có
//   cờ ấy là theo prototype, không phải để chặn: gõ thẳng `#quan-tri-he-thong`
//   vẫn mở được, và máy chủ trả về rỗng.
//
// ⚠ File này không hỏi bề ngang màn hình. Thanh trái thành hàng thẻ trên điện
//   thoại là việc của `@media(max-width:850px)` trong `quan-tri.css`.

import { layPhien, dsChoDuyet, demChoKiemDuyet } from '../../services/sb.js';
import { mountDangNhap } from '../dang-nhap.js';
import { mountKhuKiemDuyet } from './khu-kiem-duyet.js';
import { mountKhuGiaPha } from './khu-gia-pha.js';
import { mountKhuTaiKhoan } from './khu-tai-khoan.js';
import { mountKhuQuanTriHeThong, mountChonCayMacDinh } from './khu-quan-tri-he-thong.js';
import { mountTrangCay, MUC_TRANG_CAY } from './trang-cay.js';
import { mountTrangTaiKhoan, MUC_TRANG_TAI_KHOAN } from './trang-tai-khoan.js';
import { mountTrangMoi } from './trang-moi.js';
import { duongDan } from './trang-chi-tiet.js';

/**
 * Bốn khu, đúng thứ tự trên thanh. `ma` là chuỗi đi vào `#` của địa chỉ nên
 * nó là **giao kèo với người dùng** — đổi một chữ là mọi link đã gửi đi hỏng.
 * `view` là `id` của `<section>` trong QuanTri.html.
 *
 * ⚠ **Khu 2 mang HAI cái tên, và đó là chủ ý** (b106). Chữ trên thanh là
 *   *Tài khoản*; `ma` vẫn là `thanh-vien` vì nó nằm trong `#` của địa chỉ.
 *
 * ⚠ `view: 'khu-tam'` = khu CHƯA chuyển sang giao diện quantri3 (b118c). Mỗi
 *   lần chuyển xong một khu thì đổi `view` sang section quantri3 của nó.
 */
const KHU = [
  { ma: 'gia-pha',    chu: 'Gia phả', view: 'gia-pha' },
  { ma: 'thanh-vien', chu: 'Tài khoản', view: 'khu-tam' },
  { ma: 'kiem-duyet', chu: 'Kiểm duyệt', view: 'khu-tam' },
  { ma: 'quan-tri-he-thong', chu: 'Quản trị hệ thống', view: 'quan-tri-he-thong' },
];

/**
 * TRANG CHI TIẾT — lớp thứ hai dưới một khu. Địa chỉ
 * `#<khu>/<ma>/<mã thứ đang xem>[/<mục>]`. `muc` rỗng = trang không có thanh
 * mục con. `khu` + `ma` cũng là giao kèo trong địa chỉ.
 */
const TRANG = [
  { khu: 'gia-pha', ma: 'cay', view: 'khu-tam', mount: mountTrangCay, muc: MUC_TRANG_CAY },
  // quantri3 `#tree-invite` — cột *Mời gia nhập* của bảng Gia phả mở trang này.
  { khu: 'gia-pha', ma: 'moi', view: 'tree-invite', mount: mountTrangMoi, muc: [] },
  // ⚠ Khu cha là `quan-tri-he-thong` (đổi b118) — trang mở từ sổ tài khoản.
  { khu: 'quan-tri-he-thong', ma: 'tai-khoan', view: 'khu-tam', mount: mountTrangTaiKhoan,
    muc: MUC_TRANG_TAI_KHOAN },
  // quantri3 `#sys-default-tree-selector`. Đoạn mã luôn là `chon` — trang này
  // không nói về MỘT thứ nào, nhưng địa chỉ trang chi tiết cần đủ ba đoạn.
  { khu: 'quan-tri-he-thong', ma: 'cay-mac-dinh', view: 'sys-default-tree-selector',
    mount: mountChonCayMacDinh, muc: [] },
];

// ============================================================
// Cửa vào
// ============================================================

/**
 * Mở trang Quản trị. Ba kết cục trước khi thấy khung:
 *   · **Chưa cấu hình / mất mạng** → câu lỗi kèm lối về sơ đồ.
 *   · **Chưa đăng nhập**           → màn hình đăng nhập, xong thì quay lại đây.
 *   · **Đã đăng nhập**             → hiện `.app` của quantri3.
 *
 * @param {HTMLElement} appEl  `#app` — chỗ vẽ "đang mở", đăng nhập, câu lỗi
 */
export async function mountKhung(appEl) {
  appEl.textContent = 'Đang mở trang Quản trị…';

  const phien = await layPhien();
  if (phien.loi) return veCanhBao(appEl, phien.loi);
  if (!phien.daDangNhap) return mountDangNhap(appEl, () => mountKhung(appEl));

  appEl.innerHTML = '';
  const app = document.querySelector('.app');
  app.hidden = false;

  veNguoiDung(app, phien);

  /** `ma` khu → nút của nó. Giữ lại để tô đậm và để gắn con số đếm. */
  const nutTheoMa = new Map();
  for (const b of app.querySelectorAll('.nav[data-route]')) {
    const ma = b.dataset.route;
    if (b.hasAttribute('data-system-only')) b.hidden = !phien.laQuanTriHeThong;
    // Đổi `#` chứ không tự vẽ lại — cú bấm và nút Back đi qua đúng một đường.
    b.addEventListener('click', () => { window.location.hash = ma; });
    nutTheoMa.set(ma, b);
  }

  // Nút "← …" của quantri3 (`data-back`) — cũng chỉ đổi `#`. Gán, KHÔNG
  // `history.back()`: người mở bằng link được gửi cho không đi qua khu cha.
  for (const b of app.querySelectorAll('[data-back]')) {
    b.addEventListener('click', () => { window.location.hash = b.dataset.back; });
  }

  const veKhuDangMo = () => veKhu(app, nutTheoMa, phien);
  window.addEventListener('hashchange', veKhuDangMo);
  veKhuDangMo();

  napSoDem(phien.treeId, nutTheoMa);
}

/** Dòng tài khoản ở góc phải đầu trang — `.top .user` của quantri3. */
function veNguoiDung(app, phien) {
  const ten = (phien.hoTen || '').trim();
  const tu = ten.split(/\s+/).filter(Boolean);
  const chuDau = tu.length >= 2
    ? tu[0][0] + tu[tu.length - 1][0]
    : (ten || phien.email || '?').slice(0, 2);
  app.querySelector('[data-avatar]').textContent = chuDau.toUpperCase();
  app.querySelector('[data-user-email]').textContent = phien.email || '';
}

// ============================================================
// Vẽ một khu
// ============================================================

/**
 * Đọc `#` rồi hiện đúng section và giao cho khu — hoặc trang chi tiết — ấy.
 *
 * ⚠ `#` lạ thì về khu đầu và **sửa luôn thanh địa chỉ** bằng `replaceState`.
 *   Không `location.hash = …` ở đây: gán đẻ ra một `hashchange` nữa (vẽ hai
 *   lần) và thêm một mục vào lịch sử (nút Back kẹt ở cái `#` hỏng).
 *
 * ⚠ Luật ấy áp cho trang chi tiết từng tầng: khu lạ → khu đầu · trang lạ hoặc
 *   thiếu mã → khu cha · mục lạ → mục đầu. **Khung kiểm hết rồi mới giao cho
 *   trang**, nên trang không bao giờ tự sửa `#`.
 *
 * ⚠ Mã trong địa chỉ (mã cây…) thì khung KHÔNG kiểm — đó là câu hỏi máy chủ.
 */
function veKhu(app, nutTheoMa, phien) {
  const doan = docHash();
  const khu = KHU.find((k) => k.ma === doan[0]) || KHU[0];
  const trang = khu.ma === doan[0] && doan[2]
    ? TRANG.find((t) => t.khu === khu.ma && t.ma === doan[1]) || null
    : null;
  const muc = trang && trang.muc.length
    ? (trang.muc.find((m) => m.ma === doan[3]) || trang.muc[0])
    : null;
  // Mục đầu tiên KHÔNG ghi tên vào địa chỉ — một chỗ, một địa chỉ.
  const hashMuc = (ma) => duongDan(khu.ma, trang.ma, doan[2],
                                   ma === trang.muc[0].ma ? '' : ma);
  const dung = !trang ? khu.ma
    : muc ? hashMuc(muc.ma)
    : duongDan(khu.ma, trang.ma, doan[2]);
  if (window.location.hash.slice(1) !== dung) {
    window.history.replaceState(null, '', '#' + dung);
  }

  for (const [ma, b] of nutTheoMa) {
    const dangMo = ma === khu.ma;
    b.classList.toggle('active', dangMo);
    if (dangMo) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }

  const viewId = trang ? trang.view : khu.view;
  for (const v of app.querySelectorAll('main > .view')) v.hidden = v.id !== viewId;
  const el = document.getElementById(viewId);
  // Section quantri3 giữ nguyên HTML, khu tự đổ lại dữ liệu. Chỉ chỗ vẽ tạm
  // mới được dọn trắng — nó không có HTML nào của prototype để giữ.
  if (viewId === 'khu-tam') el.innerHTML = '';

  if (trang) {
    trang.mount(el, { phien, thamSo: doan[2], muc: muc ? muc.ma : '',
                      hashQuayVe: khu.ma, chuQuayVe: khu.chu, hashMuc });
    return;
  }

  // ⚠ Khu nhận `phien` để biết danh tính và cây đang mở — KHÔNG để suy quyền.
  //   Câu QUYỀN mỗi khu tự hỏi máy chủ.
  if (khu.ma === 'gia-pha') mountKhuGiaPha(el, phien);
  else if (khu.ma === 'thanh-vien') mountKhuTaiKhoan(el, phien);
  else if (khu.ma === 'kiem-duyet') mountKhuKiemDuyet(el);
  else if (khu.ma === 'quan-tri-he-thong') mountKhuQuanTriHeThong(el, phien);
}

/**
 * `#` của địa chỉ, tách theo `/`, mỗi đoạn đã giải mã. Đoạn mã hoá hỏng
 * thành chuỗi rỗng — một cái `#` gõ nhầm không được làm sập cả khung.
 */
function docHash() {
  return window.location.hash.slice(1).split('/').map((d) => {
    try { return decodeURIComponent(d); } catch (_) { return ''; }
  });
}

// ============================================================
// Hai con số trên thanh
// ============================================================

/**
 * Gắn số đơn chờ duyệt và số thay đổi chờ kiểm duyệt vào chính hai nút ấy.
 *
 * ⚠ **Hỏng thì im lặng, và đó là cố ý.** Không phải quản trị thì hai hàm này
 *   trả mảng rỗng và số 0 — đúng thiết kế. Mạng hỏng thật thì khu người ta
 *   bấm vào sẽ tự nói ra.
 *
 * ⚠ **Số 0 thì không vẽ gì cả** (`CLAUDE.md` mục 7).
 */
async function napSoDem(treeId, nutTheoMa) {
  if (!treeId) return;
  try {
    const [dsDon, soKiemDuyet] = await Promise.all([
      dsChoDuyet(treeId),
      demChoKiemDuyet(treeId),
    ]);
    themSo(nutTheoMa.get('gia-pha'), Array.isArray(dsDon) ? dsDon.length : 0,
           'đơn chờ duyệt');
    themSo(nutTheoMa.get('kiem-duyet'), Number(soKiemDuyet) || 0,
           'thay đổi chờ kiểm duyệt');
  } catch (_) {
    // Xem khối ghi chú ngay trên.
  }
}

/** `<b>` trong `.nav` — huy hiệu đếm của quantri3. */
function themSo(nut, so, nghiaLa) {
  if (!nut || !so) return;
  const huy = document.createElement('b');
  huy.textContent = String(so);
  huy.setAttribute('aria-label', so + ' ' + nghiaLa);
  nut.append(huy);
}

// ============================================================
// Không mở được trang
// ============================================================

function veCanhBao(el, chu) {
  el.innerHTML = '';

  const hop = document.createElement('div');
  hop.className = 'qt-canh-bao';

  const h = document.createElement('h1');
  h.textContent = 'Không mở được trang Quản trị';

  const p = document.createElement('p');
  p.textContent = chu;

  const a = document.createElement('a');
  a.href = 'index.html';
  a.textContent = '← Về sơ đồ gia phả';

  hop.append(h, p, a);
  el.append(hop);
}
