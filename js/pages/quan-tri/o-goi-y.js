// ============================================================
// giapha-supabase · js/pages/quan-tri/o-goi-y.js
// Vai trò  : Ô gõ vài chữ → hiện danh sách khớp. MỘT bản cho CẢ BỐN chỗ đang
//            gõ tay mù: email + mã người ở form Mời, mã người ở khu Tài
//            khoản, và ô "đã có trong phần mềm chưa" của form thêm người.
// Lớp      : pages — gọi bởi pages/quan-tri/*, pages/person-edit.js
// Phụ thuộc: (không) — nơi gọi truyền hàm `tim`/`ve` vào; file này không biết
//            Supabase là gì, nên đổi nguồn dữ liệu không phải sửa nó
// Phiên bản: 0.4.0 · Cập nhật: 22/09/2026 (b124a2) — bẫy 5 và 6
// Sổ tay   : so-tay/o-goi-y.md
// ============================================================
//
// ═══ SÁU CÁI BẪY ĐÃ TÍNH TRƯỚC — chuyện đầy đủ ở sổ tay ═══
//
//  1. Danh sách nổi trên `body` bằng `position:fixed`, KHÔNG nằm trong ô cha:
//     ba chỗ kia ở trong bảng cuộn ngang được, thả vào trong là cụt mép.
//  2. Câu trả lời về CHẬM hơn câu hỏi sau — mỗi lời gọi mang một số thứ tự,
//     chỉ số MỚI NHẤT được vẽ.
//  3. `blur` xảy ra TRƯỚC `click` — chọn bằng `mousedown` + `preventDefault()`.
//  4. Bàn phím ảo mở ra không bắn `resize` của `window` — nghe thêm
//     `window.visualViewport`, nếu không toạ độ đã đo lệch mất (b122d).
//  5. `chon()` bắn lại `input`, và lượt ấy MỞ LẠI DANH SÁCH, đè lên đúng lời
//     báo "đã chọn" — người dùng thấy cú bấm của mình rơi vào hư không
//     (22/09/2026). `boQuaLuotSau` nuốt đúng một lượt. Và vì cú bấm là thứ
//     dễ mất nhất, mỗi dòng nghe CẢ `mousedown` LẪN `click`; cú thứ hai tự
//     rơi ra vì `ds` đã rỗng.
//  6. Rê chuột KHÔNG được vẽ lại cả bảng: `innerHTML = ''` ở `mouseenter`
//     làm Chrome bắn `mouseenter` cho dòng vừa dựng lại — vòng ấy quay mỗi
//     khung hình — và `scrollTop` về 0 ngay lúc người ta định bấm. Đổi màu
//     tại chỗ bằng `toSang()`; chỉ `veBang()` khi danh sách thật sự đổi.

/** Bao lâu sau khi ngừng gõ thì mới hỏi máy chủ (mili giây). */
const CHO_GO = 180;

/** Dưới ngần này ký tự thì không hỏi. Máy chủ cũng gác, đây chỉ đỡ cho nó. */
const TOI_THIEU = 2;

/**
 * Gắn ô gợi ý vào một `<input>` đã có sẵn.
 *
 * @param {HTMLInputElement} oNhap
 * @param {object} tuyChon
 * @param {(chuoi: string) => Promise<Array>} tuyChon.tim   hỏi máy chủ
 * @param {(muc: any) => {chinh: string, phu: string, mo?: boolean}} tuyChon.ve
 *        hai dòng chữ của một gợi ý; `mo: true` thì vẽ mờ (chọn được, nhưng
 *        báo trước là sẽ vướng)
 * @param {(muc: any) => string} tuyChon.giaTri  điền gì vào ô khi chọn
 * @param {(muc: any) => void} [tuyChon.khiChon] chạy thêm gì sau khi chọn
 * @returns {() => void} gọi để gỡ hẳn ô gợi ý (dọn cả bộ nghe toàn cục)
 */
export function ganGoiY(oNhap, { tim, ve, giaTri, khiChon }) {
  let bang = null;         // phần tử danh sách, chỉ tồn tại khi đang mở
  let ds = [];
  let dang = -1;           // dòng đang trỏ tới, -1 = chưa trỏ đâu
  let dongHo = null;
  let soLuot = 0;          // bẫy 2 — số thứ tự lời gọi
  let cacDong = [];        // bẫy 6 — phần tử của từng dòng, để đổi màu tại chỗ
  let boQuaLuotSau = false; // bẫy 5 — `chon()` bắn lại `input`, đừng hỏi lại

  // ------------------------------------------------------------
  // Vẽ
  // ------------------------------------------------------------

  function dong() {
    if (bang) { bang.remove(); bang = null; }
    ds = [];
    cacDong = [];
    dang = -1;
  }

  function datCho() {
    if (!bang) return;
    const h = oNhap.getBoundingClientRect();
    bang.style.left = h.left + 'px';
    bang.style.top = (h.bottom + 2) + 'px';
    bang.style.width = Math.max(h.width, 240) + 'px';
  }

  /** Kiểu của MỘT dòng. Một chỗ định nghĩa, cho `veBang` và `toSang` dùng chung. */
  function kieuDong(i, mo) {
    return 'padding:7px 10px;cursor:pointer;border-bottom:1px solid #f0ebe3;' +
      (i === dang ? 'background:#f2ece2;' : '') +
      (mo ? 'opacity:.62;' : '');
  }

  /**
   * Đổi dòng đang trỏ tới mà KHÔNG vẽ lại danh sách — bẫy 6 ở đầu file.
   * Cuộn dòng ấy vào tầm nhìn, vì đi bằng phím mũi tên qua dòng thứ tám thì
   * nó đã nằm dưới mép hộp cao 246px.
   */
  function toSang() {
    cacDong.forEach((d, i) => { d.style.cssText = kieuDong(i, d.dataset.mo === '1'); });
    const d = cacDong[dang];
    if (d && d.scrollIntoView) d.scrollIntoView({ block: 'nearest' });
  }

  function veBang() {
    if (!bang) {
      bang = document.createElement('div');
      bang.style.cssText =
        'position:fixed;z-index:9999;max-height:246px;overflow-y:auto;' +
        'background:#fffdf9;border:1px solid #c9c0b4;border-radius:8px;' +
        'box-shadow:0 6px 18px rgba(42,38,34,.16);font-size:12px;' +
        'color:#2a2622';
      document.body.append(bang);
    }
    bang.innerHTML = '';
    cacDong = [];

    ds.forEach((muc, i) => {
      const { chinh, phu, mo } = ve(muc);

      const d = document.createElement('div');
      d.dataset.mo = mo ? '1' : '0';
      d.style.cssText = kieuDong(i, mo);

      const c1 = document.createElement('div');
      c1.textContent = chinh;
      c1.style.cssText = 'font-weight:600';

      d.append(c1);
      if (phu) {
        const c2 = document.createElement('div');
        c2.textContent = phu;
        c2.style.cssText = 'font-size:11px;color:#6a625a;margin-top:1px';
        d.append(c2);
      }

      // ⚠ `mousedown` + `preventDefault`, KHÔNG `click` — bẫy 3 ở đầu file.
      d.addEventListener('mousedown', (e) => { e.preventDefault(); chon(i); });
      // …và `click` đi kèm làm lưới đỡ, bẫy 5: `chon()` đã rỗng `ds` nên cú
      // thứ hai tự rơi ra ở dòng đầu tiên, chọn hai lần là vô hại.
      d.addEventListener('click', (e) => { e.preventDefault(); chon(i); });
      // ⚠ Chỉ ĐỔI MÀU, không vẽ lại — bẫy 6 ở đầu file.
      d.addEventListener('mouseenter', () => {
        if (dang === i) return;
        dang = i;
        toSang();
      });

      bang.append(d);
      cacDong.push(d);
    });

    datCho();
  }

  function chon(i) {
    const muc = ds[i];
    if (!muc) return;
    oNhap.value = giaTri(muc);
    dong();
    if (khiChon) khiChon(muc);
    // ⚠ Vẫn bắn `input` để nơi gọi nghe được chữ vừa điền — nhưng KHÔNG được
    //   để nó hỏi máy chủ thêm một lượt nữa. Bẫy 5 ở đầu file.
    boQuaLuotSau = true;
    oNhap.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ------------------------------------------------------------
  // Hỏi máy chủ
  // ------------------------------------------------------------

  async function hoi() {
    const chuoi = oNhap.value.trim();
    if (chuoi.length < TOI_THIEU) { dong(); return; }

    const luot = ++soLuot;
    let kq;
    try {
      kq = await tim(chuoi);
    } catch (e) {
      // ⚠ Ô gợi ý im lặng khi hỏng, và đó là chủ ý: nó là thứ giúp cho tiện,
      //   không phải thứ người ta đang làm. Ném một dải chữ đỏ lên giữa lúc
      //   ai đó đang gõ dở là làm phiền chứ không phải báo tin. Ô vẫn gõ tay
      //   được, và nút Mời vẫn nói thật nếu email sai.
      kq = [];
    }
    if (luot !== soLuot) return;      // bẫy 2 — câu trả lời đã cũ

    ds = Array.isArray(kq) ? kq : [];
    dang = -1;
    if (ds.length === 0) { dong(); return; }
    veBang();
  }

  // ------------------------------------------------------------
  // Nghe
  // ------------------------------------------------------------

  function khiGo() {
    // Bẫy 5 — lượt này là do chính `chon()` bắn ra, không phải người ta gõ.
    if (boQuaLuotSau) { boQuaLuotSau = false; return; }
    if (dongHo) clearTimeout(dongHo);
    dongHo = setTimeout(hoi, CHO_GO);
  }

  function khiPhim(e) {
    if (!bang || ds.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      dang = (dang + 1) % ds.length;
      toSang();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      dang = (dang <= 0 ? ds.length : dang) - 1;
      toSang();
    } else if (e.key === 'Enter') {
      // Chỉ nuốt phím Enter khi người ta ĐANG trỏ vào một dòng. Không trỏ vào
      // đâu mà vẫn nuốt là chặn mất đường gõ tay xong bấm Enter.
      if (dang >= 0) { e.preventDefault(); chon(dang); }
    } else if (e.key === 'Escape') {
      dong();
    }
  }

  const khiRoi = () => dong();
  const khiCuon = () => { if (bang) datCho(); };
  // Bẫy 4 — bàn phím ảo đổi `visualViewport`, không đổi `window`.
  const vv = window.visualViewport;

  oNhap.addEventListener('input', khiGo);
  oNhap.addEventListener('keydown', khiPhim);
  oNhap.addEventListener('blur', khiRoi);
  // `true` = bắt ở pha bắt giữ, để nghe được cả những khối cuộn bên trong.
  window.addEventListener('scroll', khiCuon, true);
  window.addEventListener('resize', khiCuon);
  if (vv) {
    vv.addEventListener('resize', khiCuon);
    vv.addEventListener('scroll', khiCuon);
  }

  return function go() {
    if (dongHo) clearTimeout(dongHo);
    dong();
    oNhap.removeEventListener('input', khiGo);
    oNhap.removeEventListener('keydown', khiPhim);
    oNhap.removeEventListener('blur', khiRoi);
    window.removeEventListener('scroll', khiCuon, true);
    window.removeEventListener('resize', khiCuon);
    if (vv) {
      vv.removeEventListener('resize', khiCuon);
      vv.removeEventListener('scroll', khiCuon);
    }
  };
}

// ============================================================
// HAI KHUÔN DÒNG — để ba nơi gọi nói giống nhau
// ============================================================
//
// ⚠ Chữ trên dòng gợi ý là thứ người ta đọc để quyết "đúng người chưa", nên
//   nó phải nằm MỘT CHỖ. Rải ba bản ở ba file là ba chỗ để lệch nhau, và cái
//   lệch ấy không có phép kiểm nào bắt được — cả ba đều "hiện ra được".

/** Chữ cho một dòng tài khoản. Có tên thì tên đứng trước, email xuống dưới. */
export function dongTaiKhoan(m) {
  const noi = {
    chinh_minh: 'chính bạn — không tự mời mình được',
    thanh_vien: 'đã có tên trong gia phả này',
    cho_duyet: 'đang có đơn xin vào — duyệt đơn ấy, đừng mời lại',
    da_moi: 'đã mời rồi, đang chờ nhận lời',
  }[m.trangThai] || '';

  const duoi = [m.email, noi].filter(Boolean).join('  ·  ');

  return {
    chinh: m.hoTen || m.email,
    phu: m.hoTen ? duoi : noi,
    // Bốn trạng thái kia đều bị `moi_vao_cay()` từ chối. Vẫn cho chọn — người
    // ta có thể đang tra cứu chứ không phải đang mời — nhưng vẽ mờ để biết
    // trước, đúng luật "khoá sẵn kèm lý do, không mở ra rồi mới giải thích".
    mo: m.trangThai !== 'chua',
  };
}

/**
 * Chữ cho một dòng người trong sơ đồ. Khuôn chép của phần mềm gia phả:
 * **tên, năm sinh–mất trong ngoặc, mã đứng cuối như một cái nhãn**.
 *
 * ⚠ Năm trống thì KHÔNG vẽ cặp ngoặc rỗng — luật dữ liệu của dự án:
 *   trường trống thì không vẽ hàng ấy, không ghi "Không rõ", không hiện `...`.
 */
export function dongNguoi(m) {
  const nam = (m.namSinh || m.namMat)
    ? '(' + (m.namSinh || '?') + '–' + (m.namMat || '') + ')'
    : '';

  const phu = [m.maNguoi, nam,
    m.ganChoEmail ? 'đã gắn cho ' + m.ganChoEmail : '']
    .filter(Boolean).join('  ·  ');

  return { chinh: m.ten, phu, mo: Boolean(m.ganChoEmail) };
}

/**
 * Chữ cho một dòng NGƯỜI Ở CÂY KHÁC — b124a, `pages/person-edit.js` dùng khi
 * gõ ô "đã có trong phần mềm chưa" lúc thêm người. Cùng khuôn `dongNguoi()`,
 * thay `ganChoEmail` bằng `cacCay`: đây không phải chuyện tài khoản, mà là
 * chuyện người ấy đang đứng ở những cây nào.
 */
export function dongNguoiCayKhac(m) {
  const nam = (m.namSinh || m.namMat)
    ? '(' + (m.namSinh || '?') + '–' + (m.namMat || '') + ')'
    : '';

  const phu = [m.maNguoi, nam,
    m.cacCay ? 'đã có ở: ' + m.cacCay : '']
    .filter(Boolean).join('  ·  ');

  return { chinh: m.ten, phu, mo: false };
}
