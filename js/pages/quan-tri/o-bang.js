// ============================================================
// giapha-supabase · js/pages/quan-tri/o-bang.js
// Vai trò  : Mấy mẩu dựng ô bảng theo ĐÚNG class của prototype quantri3 —
//            `.name` · `.sub` · `.badge` · `.btn` · `.link` · `.action-menu`
// Lớp      : pages — được gọi bởi: pages/quan-tri/* · được phép gọi: (không)
// Phụ thuộc: (không)
// Phiên bản: 0.2.0 · Cập nhật: 16/09/2026 (b118d)
// Sổ tay   : so-tay/trang-quan-tri.md
// ============================================================
//
// ⚠ File này KHÔNG tự đặt màu, cỡ chữ hay khoảng cách nào. Mọi thứ nhìn thấy
//   đến từ class của quantri3 trong `quan-tri.css`. Chỗ duy nhất có `style` là
//   `chepKieu()` — CHÉP NGUYÊN VĂN `style=` đã nằm sẵn trong mẫu dòng của
//   quantri3 (nút nhỏ 11px của sổ tài khoản…). Tự nghĩ ra `style` mới ở đây
//   là bắt đầu vẽ lại giao diện — đúng thứ b118c sinh ra để chấm dứt.

/** Tên vai theo CHỮ của prototype quantri3 (khác `config.vaiTroBangChu` ở sơ đồ). */
export const TEN_VAI = {
  quan_tri: 'Quản trị gia phả',
  sua: 'Thành viên',
  xem: 'Khách',
  sao_luu: 'Tài khoản sao lưu',
};

/** Ba vai cấp được cho tài khoản khác, đúng thứ tự ô chọn của quantri3. */
export const CHON_VAI = [['quan_tri', TEN_VAI.quan_tri], ['sua', TEN_VAI.sua], ['xem', TEN_VAI.xem]];

/** Một `<td>` chứa lần lượt các con — chuỗi hoặc nút DOM. */
export function td(...con) {
  const o = document.createElement('td');
  for (const c of con) if (c != null && c !== '') o.append(c);
  return o;
}

export function span(cls, chu) {
  const s = document.createElement('span');
  if (cls) s.className = cls;
  if (chu != null) s.textContent = chu;
  return s;
}

/** `<span class="name">` + `<span class="sub">` — phần trống thì không vẽ. */
export function tenVaPhu(ten, phu) {
  const f = document.createDocumentFragment();
  if (ten) f.append(span('name', ten));
  if (phu) f.append(span('sub', phu));
  return f;
}

/** `kieu`: '' (xanh) · 'wait' (cam) · 'red' (đỏ) — đúng ba kiểu của quantri3. */
export function huyHieu(chu, kieu = '') {
  return span('badge' + (kieu ? ' ' + kieu : ''), chu);
}

/** Đổi chữ + kiểu của một huy hiệu có sẵn trong HTML. */
export function datHuyHieu(el, chu, kieu = '') {
  el.className = 'badge' + (kieu ? ' ' + kieu : '');
  el.textContent = chu;
}

/** `kieu`: '' · 'primary' · 'warm' · 'danger'. */
export function nut(chu, kieu = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn' + (kieu ? ' ' + kieu : '');
  b.textContent = chu;
  return b;
}

/** Chép NGUYÊN VĂN một `style=` có sẵn trong mẫu dòng của quantri3. */
export function chepKieu(el, css) {
  el.style.cssText = css;
  return el;
}

/** Nút nhỏ trong ô bảng — `style="font-size:11px;padding:2px 7px"` của quantri3. */
export function nutNho(chu, kieu = '') {
  return chepKieu(nut(chu, kieu), 'font-size:11px;padding:2px 7px');
}

/**
 * `<button class="link">` của quantri3 — KHÔNG `<a>`: thẻ `a` mang gạch chân
 * mặc định của trình duyệt mà CSS prototype không gỡ, nên nhìn lệch hẳn.
 * Bấm thì đổi `#`, cùng một đường với mọi nút điều hướng khác.
 */
export function lienKet(chu, hash) {
  return nutLink(chu, () => { window.location.hash = hash.replace(/^#/, ''); });
}

/** `<button class="link">` chạy một việc thay vì đổi `#`. */
export function nutLink(chu, bam) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'link';
  b.textContent = chu;
  if (bam) b.addEventListener('click', bam);
  return b;
}

/** Nút mờ kèm lý do — việc máy chủ CHƯA làm được, hoặc chắc chắn bị từ chối. */
export function nutMo(chu, lyDo, kieu = '') {
  const b = nut(chu, kieu);
  b.disabled = true;
  b.title = lyDo;
  return b;
}

/**
 * Một mục của menu *Chọn hành động*: có lý do khoá thì mờ kèm lý do, không
 * thì bấm được. Bấm xong đóng menu — hộp hỏi mở ra, menu không đứng lơ lửng.
 */
export function mucMenu(chu, lyDo, bam, kieu = '') {
  if (lyDo) return nutMo(chu, lyDo, kieu);
  const b = nut(chu, kieu);
  b.addEventListener('click', () => {
    for (const x of document.querySelectorAll('.action-options')) x.hidden = true;
    bam();
  });
  return b;
}

/** Chữ mờ "chưa có" kèm lý do khi rê chuột. */
export function chuaCo(chu, lyDo) {
  const s = span('muted', chu);
  if (lyDo) s.title = lyDo;
  return s;
}

/** `<div class="row-actions">` của quantri3. */
export function hangNut(...ds) {
  const d = document.createElement('div');
  d.className = 'row-actions';
  d.append(...ds.filter(Boolean));
  return d;
}

export function dongLoi(chu) {
  return span('loi-dong', chu);
}

/**
 * Menu "Tùy chọn ▾" của quantri3 (`.action-menu` › `.action-options`).
 * `dsNut` là nút đã dựng; phần tử `null` vẽ thành đường kẻ ngăn.
 */
export function menuTuyChon(chu, dsNut) {
  const hop = document.createElement('div');
  hop.className = 'action-menu';
  const mo = nut(chu);
  mo.setAttribute('data-action-toggle', '');
  const ds = document.createElement('div');
  ds.className = 'action-options';
  ds.hidden = true;
  for (const b of dsNut) {
    if (b) { ds.append(b); continue; }
    ds.append(chepKieu(document.createElement('div'), 'border-top:1px solid var(--line);margin:3px 0'));
  }
  mo.addEventListener('click', (e) => {
    e.stopPropagation();
    for (const x of document.querySelectorAll('.action-options')) if (x !== ds) x.hidden = true;
    ds.hidden = !ds.hidden;
  });
  hop.append(mo, ds);
  return hop;
}

// Bấm ra ngoài thì đóng mọi menu — đúng một bộ nghe cho cả trang, như quantri3.
document.addEventListener('click', (e) => {
  if (e.target.closest && e.target.closest('.action-menu')) return;
  for (const x of document.querySelectorAll('.action-options')) x.hidden = true;
});

/**
 * Dọn `tbody` và để lại MỘT dòng nói tình trạng: đang đọc · rỗng · lỗi.
 * Bảng trống không một chữ nào thì người xem không biết là rỗng hay hỏng.
 */
export function dongTrong(tbody, soCot, chu, thuLai) {
  tbody.innerHTML = '';
  const tr = document.createElement('tr');
  tr.className = 'dong-trong';
  const o = document.createElement('td');
  o.colSpan = soCot;
  o.textContent = chu;
  if (thuLai) {
    const b = nut('Thử lại');
    b.style.marginLeft = '10px';
    b.addEventListener('click', thuLai);
    o.append(b);
  }
  tr.append(o);
  tbody.append(tr);
  return o;
}

/** Hai chữ cái đầu trên ô tròn `.avatar` của quantri3. */
export function chuDau(hoTen, email) {
  const tu = String(hoTen || '').trim().split(/\s+/).filter(Boolean);
  const chu = tu.length >= 2 ? tu[0][0] + tu[tu.length - 1][0] : (tu[0] || email || '?').slice(0, 2);
  return chu.toUpperCase();
}

function phan(iso) {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  const p = {};
  for (const x of new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(t)) p[x.type] = x.value;
  return p;
}

/** `dd/mm/yyyy` giờ Việt Nam. */
export function ngay(iso) {
  const p = iso && phan(iso);
  return p ? p.day + '/' + p.month + '/' + p.year : '';
}

/** `dd/mm/yyyy HH:mm` giờ Việt Nam — khuôn thời gian chung của dự án. */
export function ngayGio(iso) {
  const p = iso && phan(iso);
  return p ? p.day + '/' + p.month + '/' + p.year + ' ' + p.hour + ':' + p.minute : '';
}
