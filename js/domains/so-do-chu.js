// ============================================================
// giapha · js/domains/so-do-chu.js
// Vai trò  : Chế độ vẽ CHỈ CHỮ — chọn hàng nào chữ NGANG, hàng nào chữ DỌC,
//            và kích thước ô từng hàng; xếp chỗ vẫn là `computeLayout()`.
// Lớp      : domains — được gọi bởi: pages · được phép gọi: utils, config
// Phụ thuộc: domains/layout.js · utils/text.js · config (O_CHU)
// Phiên bản: 0.5.0 · Cập nhật: 30/09/2026 18:30
// Sổ tay   : so-tay/ve-so-do.md
// ============================================================
//
// Luật chủ dự án (30/09/2026): đời ĐÔNG NGƯỜI NHẤT chữ quay dọc; đời khác đủ
// rộng thì chữ ngang, không đủ thì dọc. "Đủ rộng" đo bằng chính bộ xếp BA
// KHỐI: đổi một hàng sang ngang rồi xếp lại, bề ngang sơ đồ KHÔNG tăng so với
// lúc mọi hàng dọc thì nhận. Thử hàng ít người trước. Không viết cách xếp thứ
// hai — mọi luật chỗ đứng, nét, nốt cụt vẫn ở `layout.js`.
//
// ⚠ KHÔNG NỐT CỤT (chủ dự án 30/09/2026): gọi layout với `stubPoints = []`,
// nên mất cả nốt lẫn đoạn thanh ngang kéo dài chừa chỗ cho nốt.
//
// `doRong(chuoi, coChu)` do nơi gọi đưa vào: trình duyệt đo bằng canvas
// (`beRong()` ở render.js), bài kiểm đo bằng bảng Chrome chụp sẵn. Hàm thuần.

import { O_CHU } from '../config.js';
import { dongOChu } from '../utils/text.js';
import { computeLayout } from './layout.js';

/**
 * Ngắt TÊN thành nhiều dòng, mỗi dòng không dài quá `tran` — ngắt ở khoảng
 * trắng, tham lam từ trái. Một chữ đơn dài quá trần thì để nguyên dòng ấy
 * (render bóp bằng `textLength`).
 */
function ngatTen(ten, co, tran, doRong) {
  const tu = String(ten).split(/\s+/).filter(Boolean);
  if (tu.length <= 1) return [String(ten)];
  const ra = [];
  let dong = tu[0];
  for (let i = 1; i < tu.length; i++) {
    const thu = dong + ' ' + tu[i];
    if (doRong(thu, co) <= tran) dong = thu;
    else { ra.push(dong); dong = tu[i]; }
  }
  ra.push(dong);
  return ra;
}

/**
 * @param {function} doRong   `(chuoi, coChu) → px`
 * @param {boolean} hienGio   công tắc ngày giỗ — thêm dòng "Giỗ: …" cho ai có
 * @returns {{layout:object,
 *            hang:Map<number,{ngang:boolean,w:number,h:number,net:number,soNguoi:number}>,
 *            nguoi:Map<string,{dong:Array<{loai,chu}>, day:number}>,
 *            soLanXep:number}}
 *   `nguoi` — dòng ĐÃ NGẮT của từng ô và bề DÀY riêng của ô (chiều vuông góc
 *   với chữ). `render.js` vẽ đúng các dòng này, không tự ngắt lại.
 */
export function xepCheDoChu(index, focus, visible, scope, doRong, hienGio) {
  const tran = doRong(O_CHU.tenChuan, O_CHU.dong.ten.co);
  const nguoi = new Map();
  const doChu = (id) => {
    if (nguoi.has(id)) return nguoi.get(id);
    const dong = [];
    for (const d of dongOChu(index.personById.get(id), id, hienGio)) {
      if (d.loai !== 'ten') { dong.push(d); continue; }
      for (const s of ngatTen(d.chu, O_CHU.dong.ten.co, tran, doRong)) dong.push({ loai: 'ten', chu: s });
    }
    let dai = 0, day = 2 * O_CHU.le;
    for (const d of dong) {
      dai = Math.max(dai, doRong(d.chu, O_CHU.dong[d.loai].co));
      day += O_CHU.dong[d.loai].cao;
    }
    const v = { dong, dai, day };
    nguoi.set(id, v);
    return v;
  };

  const ngang = new Set();
  let hang = new Map();
  const oHang = (m, ids) => {
    // CHIỀU DÀI chung cả hàng = dòng dài nhất, trần là tên chuẩn. BỀ DÀY riêng
    // từng ô: hàng dọc → mỗi ô một bề rộng (`rieng`); hàng ngang → layout lấy
    // ô dày nhất làm cao hàng, render vẽ khung theo bề dày riêng.
    let dai = 0, dayMax = 0;
    for (const id of ids) {
      const v = doChu(id);
      if (v.dai > dai) dai = v.dai;
      if (v.day > dayMax) dayMax = v.day;
    }
    const beDai = Math.ceil(Math.min(dai, tran)) + 2 * O_CHU.le;
    let o;
    if (ngang.has(m)) {
      o = { ngang: true, w: beDai, h: dayMax };
    } else {
      o = { ngang: false, w: dayMax, h: beDai, rieng: new Map(ids.map((id) => [id, doChu(id).day])) };
    }
    o.net = o.h / 2;
    o.soNguoi = ids.length;
    hang.set(m, o);
    return o;
  };

  let soLanXep = 0;
  const xep = () => {
    hang = new Map();
    soLanXep++;
    return computeLayout(index, focus, visible, scope, [], { oHang, khe: O_CHU });
  };
  const beNgang = (l) => l.bounds.maxX - l.bounds.minX;

  let layout = xep();
  let hangChot = hang;
  const W0 = beNgang(layout);

  const ds = [...hangChot.entries()].map(([m, o]) => ({ m, n: o.soNguoi }));
  let dongNhat = ds[0];
  for (const d of ds) if (d.n > dongNhat.n || (d.n === dongNhat.n && d.m > dongNhat.m)) dongNhat = d;
  const thu = ds.filter((d) => d !== dongNhat).sort((a, b) => (a.n - b.n) || (a.m - b.m));

  for (const d of thu) {
    ngang.add(d.m);
    const l = xep();
    if (beNgang(l) <= W0 + 0.5) { layout = l; hangChot = hang; }
    else ngang.delete(d.m);
  }
  return { layout, hang: hangChot, nguoi, soLanXep };
}
