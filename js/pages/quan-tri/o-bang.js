// ============================================================
// giapha-supabase · js/pages/quan-tri/o-bang.js
// Vai trò  : Mấy mẩu dựng ô bảng theo ĐÚNG class của prototype quantri3 —
//            `.name` · `.sub` · `.badge` · `.btn` · `.link` · `.action-menu`
// Lớp      : pages — được gọi bởi: pages/quan-tri/* · được phép gọi: (không)
// Phụ thuộc: (không)
// Phiên bản: 0.1.0 · Cập nhật: 15/09/2026 (b118c)
// ============================================================
//
// ⚠ File này KHÔNG đặt màu, cỡ chữ hay khoảng cách nào. Mọi thứ nhìn thấy đến
//   từ class của quantri3 trong `quan-tri.css`. Thêm `style=` ở đây là bắt
//   đầu vẽ lại giao diện — đúng thứ b118c sinh ra để chấm dứt.

/** Tên vai theo CHỮ của prototype quantri3 (khác `config.vaiTroBangChu` ở sơ đồ). */
export const TEN_VAI = {
  quan_tri: 'Quản trị gia phả',
  sua: 'Thành viên',
  xem: 'Khách',
  sao_luu: 'Tài khoản sao lưu',
};

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

/** `<span class="name">` + `<span class="sub">` — dòng phụ trống thì không vẽ. */
export function tenVaPhu(ten, phu) {
  const f = document.createDocumentFragment();
  f.append(span('name', ten));
  if (phu) f.append(span('sub', phu));
  return f;
}

/** `kieu`: '' (xanh) · 'wait' (cam) · 'red' (đỏ) — đúng ba kiểu của quantri3. */
export function huyHieu(chu, kieu = '') {
  return span('badge' + (kieu ? ' ' + kieu : ''), chu);
}

/** `kieu`: '' · 'primary' · 'warm' · 'danger'. */
export function nut(chu, kieu = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn' + (kieu ? ' ' + kieu : '');
  b.textContent = chu;
  return b;
}

/**
 * `<button class="link">` của quantri3 — KHÔNG `<a>`: thẻ `a` mang gạch chân
 * mặc định của trình duyệt mà CSS prototype không gỡ, nên nhìn lệch hẳn.
 * Bấm thì đổi `#`, cùng một đường với mọi nút điều hướng khác.
 */
export function lienKet(chu, hash) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'link';
  b.textContent = chu;
  b.addEventListener('click', () => { window.location.hash = hash.replace(/^#/, ''); });
  return b;
}

/** Nút mờ kèm lý do — việc máy chủ CHƯA làm được. Không giả vờ chạy. */
export function nutMo(chu, lyDo, kieu = '') {
  const b = nut(chu, kieu);
  b.disabled = true;
  b.title = lyDo;
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
  d.append(...ds);
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
    const k = document.createElement('div');
    k.style.cssText = 'border-top:1px solid var(--line);margin:3px 0';   // chép nguyên quantri3
    ds.append(k);
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
