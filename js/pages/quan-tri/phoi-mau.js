// ============================================================
// giapha-supabase · js/pages/quan-tri/phoi-mau.js
// Vai trò  : Nút *Tông màu* ở thanh trái trang Quản trị — mở bảng 10 tông,
//            chọn thì đổi `data-theme` trên <html> và nhớ ở máy này.
// Lớp      : pages — được gọi bởi: quan-tri/khung · được phép gọi: (không)
// Phụ thuộc: (không) — nút + bảng chọn là HTML tĩnh trong QuanTri.html,
//            màu ở phoi-mau.css
// Phiên bản: 1.0.0 · Cập nhật: 29/09/2026
// Sổ tay   : so-tay/trang-quan-tri.md
// ============================================================
//
// KHÔNG có trong quantri3 — Antigravity dựng bản thử b101 (06/09/2026), chủ dự
// án duyệt: nút ngay trên *Về sơ đồ*, bảng mở sang PHẢI nút cách 14px, chân
// bảng ngang chân nút, chạm trần/đáy màn hình thì tự dịch vào. Điện thoại:
// CSS đặt bảng giữa màn hình (đè chỗ file này tính).
//
// ⚠ Tông `goc` = GỠ `data-theme` đi, không đặt `data-theme="goc"`: mọi luật đè
//   màu trong phoi-mau.css đứng sau `html[data-theme]`, nên chỉ khi gỡ hẳn thì
//   trang mới trả về đúng từng điểm ảnh của quantri3.
// ⚠ Khoá `giapha_phoi_mau` còn được đọc ở `<head>` của QuanTri.html (đặt màu
//   trước khi vẽ) — đổi tên khoá thì đổi cả hai chỗ.

const KHOA_LUU = 'giapha_phoi_mau';
const MAC_DINH = 'goc';
const KHOANG_CACH_NUT = 14;
const LE_MAN_HINH = 12;

function docDaLuu() {
  try { return localStorage.getItem(KHOA_LUU) || MAC_DINH; } catch (e) { return MAC_DINH; }
}

function apDung(ma) {
  const goc = document.documentElement;
  if (ma === MAC_DINH) goc.removeAttribute('data-theme');
  else goc.setAttribute('data-theme', ma);
  try {
    if (ma === MAC_DINH) localStorage.removeItem(KHOA_LUU);
    else localStorage.setItem(KHOA_LUU, ma);
  } catch (e) { /* không nhớ được thì chỉ đổi cho lần mở này */ }
}

/**
 * Gắn việc vào nút *Tông màu* có sẵn trong `aside`. Gọi một lần khi khung dựng.
 * @param {HTMLElement} app  khối `.app` của QuanTri.html
 */
export function ganNutPhoiMau(app) {
  const khoi = app.querySelector('.pm-khoi');
  if (!khoi) return;
  const nut = khoi.querySelector('.pm-nut');
  const bang = khoi.querySelector('.pm-bang');
  const dangDung = khoi.querySelector('.pm-dang-dung');
  const cacMuc = [...khoi.querySelectorAll('.pm-muc[data-ma]')];
  // ⚠ Dời bảng ra `body`: trên điện thoại `aside` là khay trượt mang
  //   `transform`, mà `position:fixed` bên trong phần tử có `transform` thì
  //   bám theo khay chứ không bám màn hình — bảng bị khay cắt mất (đo ảnh
  //   `kq-pm-390`, 29/09/2026).
  document.body.append(bang);
  const trongKhoi = (el) => khoi.contains(el) || bang.contains(el);
  const tenCua = (ma) => {
    const m = cacMuc.find((x) => x.dataset.ma === ma);
    return m ? m.textContent.trim() : '';
  };

  const danhDau = (ma) => {
    for (const m of cacMuc) m.classList.toggle('dang-chon', m.dataset.ma === ma);
    dangDung.textContent = 'Đang dùng: ' + tenCua(ma);
  };

  // Tên đã lưu mà nay không còn trong danh sách (tông bị bỏ) → về mặc định.
  let dangChon = docDaLuu();
  if (!tenCua(dangChon)) dangChon = MAC_DINH;
  apDung(dangChon);
  danhDau(dangChon);

  // Tính chỗ đứng cạnh nút. Trên điện thoại CSS đè `top`/`left` bằng
  // `!important` (giữa màn hình) — file này không hỏi bề ngang, như `khung.js`.
  function dinhVi() {
    if (bang.hidden) return;
    const r = nut.getBoundingClientRect();
    const cao = bang.offsetHeight;
    const rong = bang.offsetWidth;
    let tren = r.bottom - cao;
    if (tren + cao > window.innerHeight - LE_MAN_HINH) tren = window.innerHeight - LE_MAN_HINH - cao;
    if (tren < LE_MAN_HINH) tren = LE_MAN_HINH;
    let trai = r.right + KHOANG_CACH_NUT;
    if (trai + rong > window.innerWidth - LE_MAN_HINH) trai = Math.max(LE_MAN_HINH, window.innerWidth - LE_MAN_HINH - rong);
    bang.style.top = tren + 'px';
    bang.style.left = trai + 'px';
  }

  function mo() {
    bang.hidden = false;
    nut.setAttribute('aria-expanded', 'true');
    dinhVi();
  }
  function dong() {
    bang.hidden = true;
    nut.setAttribute('aria-expanded', 'false');
  }

  nut.addEventListener('click', (e) => {
    e.stopPropagation();
    if (bang.hidden) mo(); else dong();
  });
  bang.querySelector('.pm-dong').addEventListener('click', dong);
  for (const m of cacMuc) {
    m.addEventListener('click', () => {
      apDung(m.dataset.ma);
      danhDau(m.dataset.ma);
      dong();
    });
  }
  document.addEventListener('click', (e) => { if (!trongKhoi(e.target)) dong(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dong(); });
  window.addEventListener('resize', dinhVi, { passive: true });
}
