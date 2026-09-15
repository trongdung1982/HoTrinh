// ============================================================
// giapha-supabase · js/pages/quan-tri/trang-chi-tiet.js
// Vai trò  : Vỏ của một TRANG CHI TIẾT trong khung Quản trị — thanh
//            "← Quay lại", tựa trang, thanh mục con. Chỉ vẽ vỏ, không gọi
//            máy chủ, không biết trang ấy nói về cái gì.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: (không)
// Phiên bản: 0.2.0 · Cập nhật: 15/09/2026 (b118c)
//            0.2.0 (b118c) vỏ trang chi tiết dùng class của quantri3 —
//            `.detailbar` · `.backbtn` · `.head` › `h1` + `.lead` ·
//            `.layout` › `.subnav`; bỏ bộ `.qt-*` tự vẽ.
//            0.1.0 (b115) vỏ đầu tiên.
// ============================================================
//
// ═══ VÌ SAO CÓ LỚP THỨ HAI ═══
//
// Prototype quantri3 (b114, `THIET-KE-QUAN-TRI.md` mục 9.1) giữ đúng bốn khu
// trên thanh trái, nhưng mỗi khu nay mở ra được TRANG CHI TIẾT của một thứ —
// một cây, một tài khoản, một lần sửa. Khu vẫn là danh sách; trang chi tiết
// là chỗ làm việc với MỘT dòng của danh sách ấy.
//
// Địa chỉ của trang chi tiết nối dài `#` của khu, nên luật 3 của khung
// (`khung.js`) áp nguyên: tải lại về đúng chỗ, gửi link cho nhau được, nút
// Back chạy đúng.
//
//     #gia-pha                         khu
//     #gia-pha/cay/NPG473              trang chi tiết, mục đầu tiên
//     #gia-pha/cay/NPG473/loi-moi      trang chi tiết, mục "Lời mời"
//
// ⚠ **Mã của thứ đang xem nằm TRONG địa chỉ**, không lấy từ "cây đang mở" của
//   app. Luật 5a (`THIET-KE-QUAN-TRI.md`): không màn hình nào được ngầm định
//   cây đang mở.
//
// ⚠ **File này KHÔNG hỏi bề ngang màn hình.** Thanh mục con đứng bên trái hay
//   thành hàng thẻ ở trên là việc của `quan-tri.css` (`.qt-layout`), đúng
//   luật "một danh sách, hai cách vẽ" của khung.

/**
 * Ghép các đoạn thành `#` của địa chỉ (không kèm dấu `#`). Đoạn rỗng bị bỏ —
 * nhờ vậy mục đầu tiên của một trang có đúng MỘT địa chỉ, không phải hai
 * (`…/NPG473` và `…/NPG473/tong-quan`).
 *
 * Mọi chỗ dựng `#` của trang chi tiết đi qua hàm này, kể cả `khung.js` lúc
 * sửa `#` lạ — hai chỗ tự ghép chuỗi là hai chỗ có ngày ghép khác nhau.
 */
export function duongDan(...doan) {
  return doan.filter(Boolean).map((d) => encodeURIComponent(d)).join('/');
}

/**
 * Vẽ vỏ trang chi tiết vào `el`, trả về phần tử NỘI DUNG để trang tự điền.
 *
 * @param {HTMLElement} el
 * @param {object} o
 * @param {string}   o.hashQuayVe  `#` của khu cha (không kèm dấu `#`)
 * @param {string}   o.chuQuayVe   tên khu cha — *"← Quay lại Gia phả"*
 * @param {string}   [o.viTri]     chữ mờ sau nút Quay lại: đang đứng ở đâu
 * @param {string}   o.tua         tựa trang
 * @param {string}   [o.phu]       một dòng mô tả dưới tựa
 * @param {Array<{ma:string, chu:string}>} [o.muc]  mục con; rỗng = không có thanh mục
 * @param {string}   [o.mucDangMo] `ma` của mục đang mở
 * @param {(ma:string)=>string} [o.hashMuc]  `#` của một mục
 * @returns {HTMLElement}
 */
export function veVoChiTiet(el, o) {
  el.innerHTML = '';

  // — `.detailbar` của quantri3: nút "← Khu cha" + chữ mờ "/ đang ở đâu" —
  const thanhVe = document.createElement('div');
  thanhVe.className = 'detailbar';

  // ⚠ **Gán `location.hash`, KHÔNG `history.back()`.** Người mở trang này
  //   bằng một link được gửi cho — không đi qua khu cha — thì `back()` đưa họ
  //   RA KHỎI trang Quản trị, về chỗ họ bấm link. Nút ghi *"← Gia phả"* thì
  //   phải về Gia phả, bất kể người ta tới đây bằng đường nào.
  const quayLai = document.createElement('button');
  quayLai.type = 'button';
  quayLai.className = 'backbtn';
  quayLai.textContent = '← ' + o.chuQuayVe;
  quayLai.addEventListener('click', () => { window.location.hash = o.hashQuayVe; });
  thanhVe.append(quayLai);

  if (o.viTri) {
    const viTri = document.createElement('span');
    viTri.className = 'muted';
    viTri.textContent = '/ ' + o.viTri;
    thanhVe.append(viTri);
  }

  // — `.head` của quantri3: h1 + dòng `.lead` —
  const dau = document.createElement('div');
  dau.className = 'head';
  const trai = document.createElement('div');
  const tua = document.createElement('h1');
  tua.textContent = o.tua;
  trai.append(tua);
  if (o.phu) {
    const phu = document.createElement('p');
    phu.className = 'lead';
    phu.textContent = o.phu;
    trai.append(phu);
  }
  dau.append(trai);

  el.append(thanhVe, dau);

  const noiDung = document.createElement('div');

  if (!o.muc || !o.muc.length) {
    el.append(noiDung);
    return noiDung;
  }

  // — `.layout` › `.subnav` của quantri3 (205px bên trái, gập ở 850px) —
  const layout = document.createElement('div');
  layout.className = 'layout';

  const thanhMuc = document.createElement('div');
  thanhMuc.className = 'subnav';
  thanhMuc.setAttribute('role', 'navigation');
  thanhMuc.setAttribute('aria-label', 'Các mục của ' + o.tua);

  for (const m of o.muc) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = m.chu;
    const dangMo = m.ma === o.mucDangMo;
    b.classList.toggle('active', dangMo);
    if (dangMo) b.setAttribute('aria-current', 'page');
    // Cùng một đường với nút trên thanh trái: đổi `#`, để `hashchange` vẽ.
    b.addEventListener('click', () => { window.location.hash = o.hashMuc(m.ma); });
    thanhMuc.append(b);
  }

  layout.append(thanhMuc, noiDung);
  el.append(layout);
  return noiDung;
}

/**
 * Mục chưa viết: nói thẳng nó làm ở bước nào, và HÔM NAY việc ấy làm ở đâu.
 * Không vẽ bảng trống — bảng trống nói "không có dữ liệu", mà sự thật là
 * "màn hình này chưa chuyển sang đây".
 *
 * @param {HTMLElement} el
 * @param {string} chu        câu nói bước nào
 * @param {string} [hashDi]   `#` của chỗ đang làm được việc ấy
 * @param {string} [chuDi]    chữ trên liên kết ấy
 */
export function veChuaChuyen(el, chu, hashDi, chuDi) {
  const hop = document.createElement('div');
  hop.className = 'qt-chua-lam';
  hop.textContent = chu;

  if (hashDi) {
    const a = document.createElement('a');
    a.className = 'qt-di-toi';
    a.href = '#' + hashDi;
    a.textContent = chuDi || 'Mở';
    hop.append(document.createElement('br'), a);
  }

  el.append(hop);
}
