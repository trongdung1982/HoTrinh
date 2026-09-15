// ============================================================
// giapha-supabase · js/pages/quan-tri/hop-thoai.js
// Vai trò  : Hộp hỏi / hộp báo của trang Quản trị — dùng CHÍNH khung
//            `#custom-modal` của prototype quantri3 (có sẵn trong QuanTri.html)
// Lớp      : pages — được gọi bởi: pages/quan-tri/* · được phép gọi: (không)
// Phụ thuộc: (không) — nơi gọi truyền việc cần làm vào
// Phiên bản: 0.1.0 · Cập nhật: 15/09/2026 (b118c)
// ============================================================
//
// ⚠ Không `alert()`, không `confirm()` — luật cả app. Prototype đã vẽ sẵn một
//   hộp (`modalConfirm` / `modalAlert` trong quantri3), nên dùng đúng hộp ấy
//   thay vì mỗi khu tự dựng một kiểu.
//
// ⚠ **Máy chủ từ chối thì nói NGAY TRONG HỘP, không đóng hộp.** Truyền `lam`
//   vào: hộp tự khoá nút, chờ, rồi hoặc đóng (khi `ok`) hoặc hiện câu từ chối
//   dưới phần mô tả. Đóng hộp rồi báo sau lưng là người bấm không biết việc
//   vừa rồi đã thành hay chưa.

let dangMo = null;   // hàm đóng của hộp đang mở — mỗi lúc chỉ một hộp

/**
 * Hỏi rồi mới làm.
 *
 * @param {object} o
 * @param {string} o.tua
 * @param {string} o.chu
 * @param {string} [o.nutOk]
 * @param {string} [o.nutHuy]
 * @param {'warm'|'primary'|'danger'} [o.kieuOk]
 * @param {{goiY?:string, nhieuDong?:boolean, giaTri?:string}} [o.oNhap]
 *        có thì hiện một ô nhập dưới phần mô tả
 * @param {(giaTri:string)=>Promise<{ok:boolean, loi?:string}>} [o.lam]
 * @returns {Promise<false|{giaTri:string, kq:any}>}
 */
export function hoi(o) {
  if (dangMo) dangMo(false);

  const nen = document.getElementById('custom-modal');
  const tua = document.getElementById('modal-title');
  const moTa = document.getElementById('modal-desc');
  const hang = document.getElementById('modal-actions');
  tua.textContent = o.tua || 'Xác nhận';
  moTa.textContent = o.chu || '';
  hang.innerHTML = '';

  let oNhap = null;
  if (o.oNhap) {
    oNhap = document.createElement(o.oNhap.nhieuDong ? 'textarea' : 'input');
    if (!o.oNhap.nhieuDong) oNhap.type = 'text';
    else oNhap.rows = 3;
    oNhap.placeholder = o.oNhap.goiY || '';
    oNhap.value = o.oNhap.giaTri || '';
    oNhap.maxLength = 500;
    moTa.after(oNhap);
  }

  const loi = document.createElement('span');
  loi.className = 'loi-dong';
  loi.hidden = true;
  hang.before(loi);

  const bHuy = document.createElement('button');
  bHuy.type = 'button';
  bHuy.className = 'btn';
  bHuy.textContent = o.nutHuy || 'Hủy bỏ';

  const bOk = document.createElement('button');
  bOk.type = 'button';
  bOk.className = 'btn ' + (o.kieuOk || 'warm');
  bOk.textContent = o.nutOk || 'Đồng ý';

  // `nutHuy: ''` = hộp chỉ báo tin, không có lối "Hủy bỏ".
  if (o.nutHuy !== '') hang.append(bHuy);
  hang.append(bOk);
  nen.hidden = false;
  (oNhap || bOk).focus();

  return new Promise((xong) => {
    let ban = false;

    function dong(kq) {
      document.removeEventListener('keydown', phim);
      nen.removeEventListener('click', bamNen);
      if (oNhap) oNhap.remove();
      loi.remove();
      nen.hidden = true;
      dangMo = null;
      xong(kq);
    }
    function phim(e) { if (e.key === 'Escape' && !ban) dong(false); }
    function bamNen(e) { if (e.target === nen && !ban) dong(false); }

    document.addEventListener('keydown', phim);
    nen.addEventListener('click', bamNen);
    bHuy.addEventListener('click', () => { if (!ban) dong(false); });

    bOk.addEventListener('click', async () => {
      const giaTri = oNhap ? oNhap.value : '';
      if (!o.lam) { dong({ giaTri, kq: null }); return; }

      ban = true;
      bOk.disabled = true; bHuy.disabled = true;
      const chuCu = bOk.textContent;
      bOk.textContent = 'Đang xử lý…';
      loi.hidden = true;

      let kq;
      try { kq = await o.lam(giaTri); } catch (e) {
        kq = { ok: false, loi: (e && e.message) || 'Lỗi không rõ.' };
      }

      if (kq && kq.ok === false) {
        ban = false;
        bOk.disabled = false; bHuy.disabled = false;
        bOk.textContent = chuCu;
        loi.textContent = kq.loi || kq.lyDo || 'Máy chủ từ chối.';
        loi.hidden = false;
        return;
      }
      dong({ giaTri, kq });
    });

    dangMo = dong;
  });
}

/** Chỉ báo tin, một nút Đóng. */
export function bao(tua, chu) {
  return hoi({ tua, chu, nutOk: 'Đóng', kieuOk: 'primary', nutHuy: '' })
    .then(() => undefined);
}
