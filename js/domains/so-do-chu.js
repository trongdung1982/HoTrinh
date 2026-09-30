// ============================================================
// giapha · js/domains/so-do-chu.js
// Vai trò  : Chế độ vẽ CHỈ CHỮ — chọn hàng nào chữ NGANG, hàng nào chữ DỌC,
//            và kích thước ô từng hàng; xếp chỗ vẫn là `computeLayout()`.
// Lớp      : domains — được gọi bởi: pages · được phép gọi: utils, config
// Phụ thuộc: domains/layout.js · utils/text.js · config (O_CHU)
// Phiên bản: 0.4.0 · Cập nhật: 30/09/2026 18:07
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
 * @param {function} doRong   `(chuoi, coChu) → px`
 * @param {boolean} hienGio   công tắc ngày giỗ — thêm dòng "Giỗ: …" cho ai có
 * @returns {{layout:object, hang:Map<number,{ngang:boolean,w:number,h:number,net:number,soNguoi:number}>,
 *            soLanXep:number}}
 */
export function xepCheDoChu(index, focus, visible, scope, doRong, hienGio) {
  const chu = new Map();                   // id → {loai:Set, dai}
  const doChu = (id) => {
    if (chu.has(id)) return chu.get(id);
    const dong = dongOChu(index.personById.get(id), id, hienGio);
    let dai = 0;
    for (const d of dong) dai = Math.max(dai, doRong(d.chu, O_CHU.dong[d.loai].co));
    const v = { loai: dong.map((d) => d.loai), dai };
    chu.set(id, v);
    return v;
  };

  const ngang = new Set();
  let hang = new Map();
  const oHang = (m, ids) => {
    // Bề DÀY hàng = đủ chỗ cho mọi loại dòng CÓ ở ít nhất một ô; từng ô tự
    // căn giữa số dòng thật của nó trong bề dày ấy (render.js).
    let dai = 0;
    const loai = new Set();
    for (const id of ids) {
      const v = doChu(id);
      if (v.dai > dai) dai = v.dai;
      for (const l of v.loai) loai.add(l);
    }
    let beDay = 2 * O_CHU.le;
    for (const l of loai) beDay += O_CHU.dong[l].cao;
    const beDai = Math.ceil(dai) + 2 * O_CHU.le;
    const o = ngang.has(m)
      ? { ngang: true,  w: beDai, h: beDay }
      : { ngang: false, w: beDay, h: beDai };
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
  return { layout, hang: hangChot, soLanXep };
}
