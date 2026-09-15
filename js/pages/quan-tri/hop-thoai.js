// ============================================================
// giapha-supabase · js/pages/quan-tri/hop-thoai.js
// Vai trò  : Hộp hỏi / hộp báo của trang Quản trị — dùng CHÍNH khung
//            `#custom-modal` của prototype quantri3 (có sẵn trong QuanTri.html)
// Lớp      : pages — được gọi bởi: pages/quan-tri/* · được phép gọi: (không)
// Phụ thuộc: (không) — nơi gọi truyền việc cần làm vào
// Phiên bản: 0.2.0 · Cập nhật: 16/09/2026 (b118d)
// Sổ tay   : so-tay/trang-quan-tri.md
// ============================================================
//
// ⚠ Không `alert()`, không `confirm()` — luật cả app. Prototype đã vẽ sẵn một
//   hộp (`modalConfirm` / `modalAlert` trong quantri3), nên dùng đúng hộp ấy.
//
// ⚠ **Máy chủ từ chối thì nói NGAY TRONG HỘP, không đóng hộp.** Truyền `lam`
//   vào: hộp tự khoá nút, chờ, rồi hoặc đóng (khi `ok`) hoặc hiện câu từ chối
//   dưới phần mô tả. Đóng hộp rồi báo sau lưng là người bấm không biết việc
//   vừa rồi đã thành hay chưa.
//
// ⚠ Từ b118d bảng quantri3 không còn chỗ đứng cho ô nhập (đổi vai, gắn mã
//   người, lý do từ chối…) — mọi ô ấy mở ra TRONG hộp này (`truong`). Ô gợi ý
//   gắn qua `ganVao` và PHẢI trả hàm gỡ: `ganGoiY` treo bộ nghe lên `window`.

let dangMo = null;   // hàm đóng của hộp đang mở — mỗi lúc chỉ một hộp

/**
 * Hỏi rồi mới làm.
 *
 * @param {object} o
 * @param {string} o.tua
 * @param {string} o.chu
 * @param {string} [o.nutOk]
 * @param {string} [o.nutHuy]      `''` = hộp chỉ báo tin, không có lối "Hủy bỏ"
 * @param {'warm'|'primary'|'danger'} [o.kieuOk]
 * @param {{goiY?:string, nhieuDong?:boolean, giaTri?:string}} [o.oNhap]
 *        MỘT ô nhập — `lam` nhận chuỗi
 * @param {Array<{ma:string, nhan?:string, goiY?:string, nhieuDong?:boolean,
 *   giaTri?:string, chon?:Array<[string,string]>,
 *   ganVao?:(el:HTMLElement)=>(()=>void)|void}>} [o.truong]
 *        NHIỀU ô — `lam` nhận `{ma: giá trị}`; `chon` có thì vẽ `<select>`
 * @param {{chu:string, kieu?:string, lam:Function}} [o.nutThem]
 *        nút thứ ba bên trái (ví dụ *Rút đơn*), chạy việc riêng của nó
 * @param {(giaTri:any)=>Promise<{ok:boolean, loi?:string}>} [o.lam]
 * @returns {Promise<false|{giaTri:any, kq:any, nut:string}>}
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

  const dsTruong = o.truong || (o.oNhap ? [{ ma: '', ...o.oNhap }] : []);
  const oDung = [];
  let sau = moTa;
  for (const t of dsTruong) {
    let el;
    if (t.chon) {
      el = document.createElement('select');
      el.className = 'role-select';
      for (const [giaTri, chu] of t.chon) {
        const op = document.createElement('option');
        op.value = giaTri;
        op.textContent = chu;
        el.append(op);
      }
      el.value = t.giaTri == null ? (t.chon[0] ? t.chon[0][0] : '') : t.giaTri;
    } else {
      el = document.createElement(t.nhieuDong ? 'textarea' : 'input');
      if (t.nhieuDong) el.rows = 3; else el.type = 'text';
      el.placeholder = t.goiY || '';
      el.value = t.giaTri || '';
      el.maxLength = 500;
      el.autocomplete = 'off';
    }
    let boc = el;
    if (t.nhan) {
      boc = document.createElement('label');
      boc.className = 'sub';
      boc.textContent = t.nhan;
      boc.append(el);
    }
    sau.after(boc);
    sau = boc;
    const go = t.ganVao ? t.ganVao(el) : null;
    oDung.push({ ma: t.ma, el, boc, go });
  }

  const loi = document.createElement('span');
  loi.className = 'loi-dong';
  loi.hidden = true;
  hang.before(loi);

  const taoNut = (chu, kieu) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn' + (kieu ? ' ' + kieu : '');
    b.textContent = chu;
    return b;
  };
  const bHuy = taoNut(o.nutHuy || 'Hủy bỏ', '');
  const bOk = taoNut(o.nutOk || 'Đồng ý', o.kieuOk || 'warm');
  const bThem = o.nutThem ? taoNut(o.nutThem.chu, o.nutThem.kieu || '') : null;

  if (bThem) { bThem.style.marginRight = 'auto'; hang.append(bThem); }
  if (o.nutHuy !== '') hang.append(bHuy);
  hang.append(bOk);
  nen.hidden = false;
  (oDung[0] ? oDung[0].el : bOk).focus();

  const docGiaTri = () => {
    if (!o.truong) return oDung[0] ? oDung[0].el.value : '';
    const v = {};
    for (const d of oDung) v[d.ma] = d.el.value;
    return v;
  };

  return new Promise((xong) => {
    let ban = false;
    const moiNut = [bOk, bHuy, bThem].filter(Boolean);

    function dong(kq) {
      document.removeEventListener('keydown', phim);
      nen.removeEventListener('click', bamNen);
      for (const d of oDung) {
        if (typeof d.go === 'function') d.go();
        d.boc.remove();
      }
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

    async function chay(nutBam, lam, tenNut) {
      const giaTri = docGiaTri();
      if (!lam) { dong({ giaTri, kq: null, nut: tenNut }); return; }

      ban = true;
      moiNut.forEach((b) => { b.disabled = true; });
      const chuCu = nutBam.textContent;
      nutBam.textContent = 'Đang xử lý…';
      loi.hidden = true;

      let kq;
      try { kq = await lam(giaTri); } catch (e) {
        kq = { ok: false, loi: (e && e.message) || 'Lỗi không rõ.' };
      }

      if (kq && kq.ok === false) {
        ban = false;
        moiNut.forEach((b) => { b.disabled = false; });
        nutBam.textContent = chuCu;
        loi.textContent = kq.loi || kq.lyDo || 'Máy chủ từ chối.';
        loi.hidden = false;
        return;
      }
      dong({ giaTri, kq, nut: tenNut });
    }

    bOk.addEventListener('click', () => chay(bOk, o.lam, 'ok'));
    if (bThem) bThem.addEventListener('click', () => chay(bThem, o.nutThem.lam, 'them'));

    dangMo = dong;
  });
}

/** Chỉ báo tin, một nút Đóng. */
export function bao(tua, chu) {
  return hoi({ tua, chu, nutOk: 'Đóng', kieuOk: 'primary', nutHuy: '' })
    .then(() => undefined);
}
