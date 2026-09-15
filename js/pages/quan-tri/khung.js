// ============================================================
// giapha-supabase · js/pages/quan-tri/khung.js
// Vai trò  : Khung điều hướng bốn khu của trang Quản trị — thanh trái trên
//            máy tính, hàng thẻ ngang trên điện thoại. Mỗi lần vẽ một khu.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb, pages/dang-nhap,
//            pages/quan-tri/khu-kiem-duyet · khu-gia-pha · khu-tai-khoan ·
//            khu-quan-tri-he-thong · trang-cay · trang-tai-khoan ·
//            trang-chi-tiet
// Phiên bản: 0.6.0 · Cập nhật: 15/09/2026 (b118)
//            0.6.0 (b118) khu thứ tư đổi từ *Sao lưu* (chưa viết) sang
//            *Quản trị hệ thống* — vẽ bằng `khu-quan-tri-he-thong.js`, vỏ
//            nạp động sổ tài khoản dời từ chip *Toàn hệ thống* của khu Tài
//            khoản (`THIET-KE-QUAN-TRI.md` 9.1). Trang chi tiết một tài
//            khoản (`TRANG`) đi theo, đổi khu cha từ `thanh-vien` sang
//            `quan-tri-he-thong` — nút "← Quay lại" phải về đúng khu vừa mở
//            nó ra. *Sao lưu* lùi lại thành một tab bên trong khu này, làm
//            ở b119.
//            0.5.0 (b117) khu 2 vẽ bằng `khu-tai-khoan.js` (Tài khoản của
//            tôi) · trang chi tiết thứ hai `#thanh-vien/tai-khoan/<mã>` ·
//            huy hiệu ĐƠN CHỜ DUYỆT chuyển sang nút Gia phả — đơn nay xét ở
//            trang của từng cây, dưới khu ấy.
//            0.4.0 (b115) lớp TRANG CHI TIẾT dưới bốn khu — danh sách `TRANG`,
//            địa chỉ `#<khu>/<trang>/<mã>[/<mục>]`, `veKhu()` sửa `#` lạ từng
//            tầng. Bốn khu cũ không đổi một dòng.
//            0.3.0 (b106) nối khu 2. Tên trên thanh là **Tài khoản**, còn `ma`
//            vẫn là `thanh-vien` — xem ghi chú ở danh sách `KHU` bên dưới.
// ============================================================
//
// ═══ BA LUẬT CỦA KHUNG NÀY, VÀ VÌ SAO ═══
//
//   1. **Thanh điều hướng CHÍNH LÀ dashboard.** Hai con số cần nhìn — số đơn
//      chờ duyệt và số thay đổi chờ kiểm duyệt — nằm ngay cạnh chỗ bấm để xử
//      lý chúng. Không có dãy ô số riêng ở đầu trang: cùng một con số hiện ở
//      hai nơi thì có ngày lệch nhau, và lúc ấy không biết tin chỗ nào.
//      Ở đây mỗi số tồn tại đúng một chỗ.
//
//   2. **Mỗi lần chỉ vẽ MỘT khu, và chỉ khu ấy gọi máy chủ.** Nối tiếp đúng
//      lý lẽ đã dựng nên trang này (`khu-kiem-duyet.js` đầu file): mở khu
//      Thành viên thì không có cớ gì gọi hàng chờ kiểm duyệt. Mở trang lần
//      đầu chỉ tốn hai lời gọi đếm cho hai con số trên thanh.
//
//   3. **Khu đang mở ghi vào `#` của địa chỉ** — `QuanTri.html#kiem-duyet`.
//      Tải lại trang về đúng chỗ cũ, gửi link cho nhau được, nút Back của
//      trình duyệt chạy đúng. Khoảng mười dòng mã, KHÔNG cần router.
//
// ═══ MỘT DANH SÁCH KHU, HAI CÁCH VẼ — KHÔNG PHẢI HAI BỘ MÃ ═══
//
// Trên điện thoại thanh trái thành hàng thẻ ngang ở đầu trang. Chỗ đổi nằm
// TRỌN trong `@media` của `QuanTri.html`; file này vẽ đúng một danh sách và
// không hỏi màn hình rộng bao nhiêu. Thêm một nhánh `if (window.innerWidth…)`
// vào đây là bắt đầu có hai bộ mã, và hai bộ mã thì có ngày lệch nhau.
//
// ⚠ **Ngôn ngữ hình lấy nguyên của `veThanhLoc()`** trong `khu-kiem-duyet.js`
//   — cùng bo góc, cùng nền `#2a2622` khi đang chọn. Trang này đã có sẵn một
//   hàng thẻ như thế từ b98; đẻ thêm kiểu thứ hai là để người dùng học hai
//   lần cùng một thứ.
//
// ⚠ **Không dùng ngăn kéo hamburger.** Nó phải đẻ ra lớp phủ, nút đóng, bẫy
//   phím — mà app này chưa có chỗ nào dùng, đến `confirm()` cũng không dùng.

import { layPhien, dsChoDuyet, demChoKiemDuyet } from '../../services/sb.js';
import { mountDangNhap } from '../dang-nhap.js';
import { mountKhuKiemDuyet } from './khu-kiem-duyet.js';
import { mountKhuGiaPha } from './khu-gia-pha.js';
import { mountKhuTaiKhoan } from './khu-tai-khoan.js';
import { mountKhuQuanTriHeThong } from './khu-quan-tri-he-thong.js';
import { mountTrangCay, MUC_TRANG_CAY } from './trang-cay.js';
import { mountTrangTaiKhoan, MUC_TRANG_TAI_KHOAN } from './trang-tai-khoan.js';
import { duongDan } from './trang-chi-tiet.js';

/**
 * Bốn khu, đúng thứ tự trên thanh. `ma` là chuỗi đi vào `#` của địa chỉ nên
 * nó là **giao kèo với người dùng** — đổi một chữ là mọi link đã gửi đi hỏng.
 *
 * `chuaLam` là câu nói thẳng khu ấy làm ở bước nào. Không vẽ bảng trống: bảng
 * trống nói "không có dữ liệu", mà sự thật là "chưa ai viết màn hình này".
 *
 * ⚠ **Khu 2 mang HAI cái tên, và đó là chủ ý** (b106). Chữ trên thanh là
 *   *Tài khoản* vì thứ khu ấy liệt kê là **tài khoản đăng nhập**, không phải
 *   người trong sơ đồ — chủ dự án nhắc thẳng chỗ này 08/09/2026. Còn `ma` vẫn
 *   là `thanh-vien` vì nó nằm trong `#` của địa chỉ: đổi nó là làm hỏng mọi
 *   link `QuanTri.html#thanh-vien` đã gửi đi, để lấy về đúng một chữ không ai
 *   nhìn thấy. Từ b117 khu này vẽ bằng `khu-tai-khoan.js`; `khu-thanh-vien.js`
 *   ở lại làm thư viện bảng "tài khoản của một cây" — đổi tên file mã là việc
 *   phải hỏi chủ dự án (`CLAUDE.md` mục 9).
 *
 * ⚠ **Khu 4 đổi tên ở b118**: `sao-luu` → `quan-tri-he-thong`, cùng lý do
 *   trên — `ma` là giao kèo trong `#`, nhưng khu này CHƯA từng viết xong
 *   (`chuaLam`) nên chưa có link thật nào ngoài kia trỏ vào `#sao-luu`, đổi
 *   `ma` không làm hỏng gì. Nội dung mới là sổ tài khoản dời từ khu Tài
 *   khoản; *Sao lưu* trở thành một việc con của khu này ở b119.
 */
const KHU = [
  { ma: 'gia-pha',    chu: 'Gia phả' },
  { ma: 'thanh-vien', chu: 'Tài khoản' },
  { ma: 'kiem-duyet', chu: 'Kiểm duyệt' },
  { ma: 'quan-tri-he-thong', chu: 'Quản trị hệ thống' },
];

/**
 * TRANG CHI TIẾT — lớp thứ hai dưới một khu (b115, `THIET-KE-QUAN-TRI.md`
 * 9.1). Địa chỉ `#<khu>/<ma>/<mã thứ đang xem>[/<mục>]`.
 *
 * `muc` là danh sách mục con, mục ĐẦU là mục mặc định. `khu` + `ma` cũng là
 * giao kèo trong địa chỉ như `ma` của khu — đổi một chữ là link cũ hỏng.
 *
 * Còn chờ đăng ký: trang đối chiếu một lần sửa dưới `kiem-duyet` (b118).
 */
const TRANG = [
  { khu: 'gia-pha', ma: 'cay', mount: mountTrangCay, muc: MUC_TRANG_CAY },
  // ⚠ `khu: 'quan-tri-he-thong'`, KHÔNG còn `'thanh-vien'` (đổi b118) — trang
  //   này mở từ sổ tài khoản, và sổ ấy nay sống ở khu Quản trị hệ thống. Để
  //   khu cũ thì nút "← Quay lại" đưa người xem về nhầm khu.
  { khu: 'quan-tri-he-thong', ma: 'tai-khoan', mount: mountTrangTaiKhoan,
    muc: MUC_TRANG_TAI_KHOAN },
];

// ============================================================
// Cửa vào
// ============================================================

/**
 * Mở trang Quản trị.
 *
 * Ba kết cục trước khi thấy được cái khung, đúng ba màn hình khác hẳn nhau:
 *
 *   · **Chưa cấu hình / mất mạng** → câu lỗi kèm lối về sơ đồ.
 *   · **Chưa đăng nhập**           → màn hình đăng nhập, xong thì quay lại đây.
 *   · **Đã đăng nhập**             → khung bốn khu.
 *
 * ⚠ **Không có kết cục "không đủ quyền".** Trang này KHÔNG phải hàng rào —
 *   hàng rào nằm ở Postgres. Ai gõ thẳng địa chỉ cũng mở được khung, và cũng
 *   chỉ nhận về mảng rỗng nếu máy chủ không cho. Cùng luật với
 *   `khu-kiem-duyet.js`: app không tự lọc, và vì thế app không thể lọc sai.
 */
export async function mountKhung(appEl) {
  appEl.textContent = 'Đang mở trang Quản trị…';

  const phien = await layPhien();
  if (phien.loi) return veCanhBao(appEl, phien.loi);
  if (!phien.daDangNhap) return mountDangNhap(appEl, () => mountKhung(appEl));

  appEl.innerHTML = '';

  const khung = document.createElement('div');
  khung.className = 'qt-khung';

  const thanh = document.createElement('aside');
  thanh.className = 'qt-thanh';

  const nhan = document.createElement('h1');
  nhan.className = 'qt-nhan';
  nhan.textContent = 'QUẢN TRỊ';

  const dieuHuong = document.createElement('nav');
  dieuHuong.className = 'qt-dieu-huong';
  dieuHuong.setAttribute('aria-label', 'Các khu quản trị');

  /** `ma` khu → nút của nó. Giữ lại để tô đậm và để gắn con số đếm. */
  const nutTheoMa = new Map();

  for (const khu of KHU) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'qt-nut';
    b.dataset.khu = khu.ma;

    const chu = document.createElement('span');
    chu.textContent = khu.chu;
    b.append(chu);

    // Đổi `#` chứ không tự vẽ lại — để nút Back của trình duyệt và cú bấm
    // vào nút này đi qua đúng một đường, là `hashchange`.
    b.addEventListener('click', () => { window.location.hash = khu.ma; });

    nutTheoMa.set(khu.ma, b);
    dieuHuong.append(b);
  }

  const veSoDo = document.createElement('a');
  veSoDo.className = 'qt-ve-so-do';
  veSoDo.href = 'index.html';
  veSoDo.textContent = '← Về sơ đồ';

  thanh.append(nhan, dieuHuong, veSoDo);

  const than = document.createElement('section');
  than.className = 'qt-than';

  khung.append(thanh, than);
  appEl.append(khung);

  const veKhuDangMo = () => veKhu(than, nutTheoMa, phien);
  window.addEventListener('hashchange', veKhuDangMo);
  veKhuDangMo();

  napSoDem(phien.treeId, nutTheoMa);
}

// ============================================================
// Vẽ một khu
// ============================================================

/**
 * Đọc `#` rồi vẽ đúng khu — hoặc đúng trang chi tiết — ấy.
 *
 * ⚠ `#` lạ — gõ nhầm, hay link cũ từ trước khi đổi tên khu — thì về khu đầu
 *   và **sửa luôn thanh địa chỉ** bằng `replaceState`. Không dùng
 *   `location.hash = …` ở đây: gán vào nó đẻ ra một `hashchange` nữa, tức
 *   vẽ hai lần; và nó thêm một mục vào lịch sử, khiến nút Back quay về đúng
 *   cái `#` hỏng vừa bỏ đi.
 *
 * ⚠ Luật ấy áp nguyên cho trang chi tiết (b115), từng tầng một: khu lạ → khu
 *   đầu · trang lạ hoặc thiếu mã → khu cha · mục lạ → mục đầu. **Khung kiểm
 *   hết rồi mới giao cho trang**, nên trang không bao giờ phải tự sửa `#` —
 *   hai chỗ sửa `#` là hai chỗ có ngày sửa khác nhau.
 *
 * ⚠ Mã trong địa chỉ (mã cây…) thì khung KHÔNG kiểm: có cây ấy hay không là
 *   câu hỏi máy chủ, và chỉ trang ấy được gọi máy chủ (luật 2).
 */
function veKhu(than, nutTheoMa, phien) {
  const doan = docHash();
  const khu = KHU.find((k) => k.ma === doan[0]) || KHU[0];
  const trang = khu.ma === doan[0] && doan[2]
    ? TRANG.find((t) => t.khu === khu.ma && t.ma === doan[1]) || null
    : null;
  const muc = trang && (trang.muc.find((m) => m.ma === doan[3]) || trang.muc[0]);
  // Mục đầu tiên KHÔNG ghi tên vào địa chỉ — một chỗ, một địa chỉ.
  const hashMuc = (ma) => duongDan(khu.ma, trang.ma, doan[2],
                                   ma === trang.muc[0].ma ? '' : ma);
  const dung = trang ? hashMuc(muc.ma) : khu.ma;
  if (window.location.hash.slice(1) !== dung) {
    window.history.replaceState(null, '', '#' + dung);
  }

  for (const [ma, b] of nutTheoMa) {
    const dangMo = ma === khu.ma;
    b.classList.toggle('dang-mo', dangMo);
    // `aria-current="page"` là cách trình đọc màn hình biết mục nào đang mở.
    // Tô đậm bằng màu thì người không nhìn thấy màu không biết mình đang đâu.
    if (dangMo) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }

  than.innerHTML = '';

  // Trang chi tiết: nút trên thanh trái vẫn tô đậm khu CHA ở vòng trên, để
  // người đang đứng sâu một tầng vẫn biết mình thuộc khu nào.
  if (trang) {
    trang.mount(than, { phien, thamSo: doan[2], muc: muc.ma,
                        hashQuayVe: khu.ma, chuQuayVe: khu.chu, hashMuc });
    return;
  }

  // ⚠ Hai khu nhận `phien` vì chúng phải biết những thứ chỉ phiên có: cây nào
  //   đang mở, người này có phải Quản trị hệ thống không, email của họ. Truyền
  //   sẵn cũng để khỏi hỏi máy chủ lần thứ hai đúng câu khung vừa hỏi.
  //
  //   ⚠ Nhưng cả hai vẫn **hỏi lại máy chủ câu QUYỀN** của riêng chúng
  //   (`coTheQuanTri`, `ds_gia_pha`); `phien` chỉ mang danh tính và cây đang
  //   mở. Suy quyền từ `phien.vaiTro` là dựng phân quyền bằng JavaScript.
  if (khu.ma === 'gia-pha') mountKhuGiaPha(than, phien);
  else if (khu.ma === 'thanh-vien') mountKhuTaiKhoan(than, phien);
  else if (khu.ma === 'kiem-duyet') mountKhuKiemDuyet(than);
  else if (khu.ma === 'quan-tri-he-thong') mountKhuQuanTriHeThong(than, phien);
  else veKhuChuaLam(than, khu);
}

/**
 * `#` của địa chỉ, tách theo `/`, mỗi đoạn đã giải mã. Đoạn mã hoá hỏng
 * (`%` lẻ) thành chuỗi rỗng — `decodeURIComponent` ném lỗi, và một cái `#` gõ
 * nhầm không được làm sập cả khung.
 */
function docHash() {
  return window.location.hash.slice(1).split('/').map((d) => {
    try { return decodeURIComponent(d); } catch (_) { return ''; }
  });
}

/** Khu chưa viết: nói thẳng nó làm ở bước nào, không vẽ bảng trống. */
function veKhuChuaLam(el, khu) {
  const h = document.createElement('h2');
  h.className = 'qt-tua';
  h.textContent = khu.chu;

  const hop = document.createElement('div');
  hop.className = 'qt-chua-lam';
  hop.textContent = khu.chuaLam;

  el.append(h, hop);
}

// ============================================================
// Hai con số trên thanh
// ============================================================

/**
 * Gắn số đơn chờ duyệt và số thay đổi chờ kiểm duyệt vào chính hai nút ấy.
 *
 * ⚠ **Hỏng thì im lặng, và đó là cố ý.** Không phải quản trị thì hai hàm này
 *   trả về mảng rỗng và số 0 — đúng như thiết kế, không phải lỗi. Còn nếu
 *   mạng hỏng thật thì khu người ta bấm vào sẽ tự nói ra; báo lỗi ở đây chỉ
 *   là chặn một cái khung vốn vẫn dùng được vì một con số trang trí.
 *
 * ⚠ **Số 0 thì không vẽ gì cả**, đúng luật `CLAUDE.md` mục 7: trường trống
 *   thì không vẽ hàng đó. Một cái huy hiệu "0" nói *"có việc đấy"* trong khi
 *   sự thật là không có việc nào.
 */
async function napSoDem(treeId, nutTheoMa) {
  if (!treeId) return;
  try {
    const [dsDon, soKiemDuyet] = await Promise.all([
      dsChoDuyet(treeId),
      demChoKiemDuyet(treeId),
    ]);
    // ⚠ Nút GIA PHẢ, không phải nút Tài khoản (đổi b117): đơn xin vào nay xét
    //   ở `#gia-pha/cay/<mã>/don-xin-vao`. Con số đứng cạnh một khu không có
    //   chỗ xử lý nó là dẫn người ta đi tìm một cái nút không có ở đó.
    themSo(nutTheoMa.get('gia-pha'), Array.isArray(dsDon) ? dsDon.length : 0,
           'đơn chờ duyệt');
    themSo(nutTheoMa.get('kiem-duyet'), Number(soKiemDuyet) || 0,
           'thay đổi chờ kiểm duyệt');
  } catch (_) {
    // Xem khối ghi chú ngay trên.
  }
}

function themSo(nut, so, nghiaLa) {
  if (!nut || !so) return;
  const huy = document.createElement('span');
  huy.className = 'qt-so';
  huy.textContent = String(so);
  // Con số trần không nói nó đếm cái gì. Trình đọc màn hình đọc câu này.
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
