// ============================================================
// giapha · js/domains/so-do-chu.js
// Vai trò  : Chế độ vẽ CHỈ CHỮ — chọn hàng nào chữ NGANG, hàng nào chữ DỌC,
//            và kích thước ô từng hàng; xếp chỗ vẫn là `computeLayout()`.
// Lớp      : domains — được gọi bởi: pages · được phép gọi: utils, config
// Phụ thuộc: domains/layout.js · utils/text.js · config (O_CHU)
// Phiên bản: 0.1.0 · Cập nhật: 30/09/2026 16:38
// Sổ tay   : so-tay/ve-so-do.md
// ============================================================
//
// Luật chủ dự án (30/09/2026): đời ĐÔNG NGƯỜI NHẤT chữ quay dọc; đời khác đủ
// rộng thì chữ ngang, không đủ thì dọc. "Đủ rộng" đo bằng chính bộ xếp BA
// KHỐI: đổi một hàng sang ngang rồi xếp lại, bề ngang sơ đồ KHÔNG tăng so với
// lúc mọi hàng dọc thì nhận. Thử hàng ít người trước. Không viết cách xếp thứ
// hai — mọi luật chỗ đứng, nét, nốt cụt vẫn ở `layout.js`.
//
// `doRong(chuoi, coChu)` do nơi gọi đưa vào: trình duyệt đo bằng canvas
// (`beRong()` ở render.js), bài kiểm đo bằng bảng Chrome chụp sẵn. Hàm thuần.

import { O_CHU } from '../config.js';
import { fullName, doiSongNguoi } from '../utils/text.js';
import { computeLayout } from './layout.js';

/**
 * @returns {{layout:object, hang:Map<number,{ngang:boolean,w:number,h:number,net:number,soNguoi:number}>,
 *            soLanXep:number}}
 */
export function xepCheDoChu(index, focus, visible, scope, stubs, doRong) {
  const chu = new Map();                   // id → {ten, nam, dai}
  const doChu = (id) => {
    if (chu.has(id)) return chu.get(id);
    const p = index.personById.get(id);
    const ten = fullName(p) || id;
    const nam = doiSongNguoi(p);
    const v = { ten, nam, dai: Math.max(doRong(ten, O_CHU.chuTen), nam ? doRong(nam, O_CHU.chuNam) : 0) };
    chu.set(id, v);
    return v;
  };

  const ngang = new Set();
  let hang = new Map();
  const oHang = (m, ids) => {
    let dai = 0, coNam = false;
    for (const id of ids) {
      const v = doChu(id);
      if (v.dai > dai) dai = v.dai;
      if (v.nam) coNam = true;
    }
    const beDay = O_CHU.dongTen + (coNam ? O_CHU.dongNam : 0) + 2 * O_CHU.le;   // bề dày hai dòng
    const beDai = Math.ceil(dai) + 2 * O_CHU.le;                                // bề dài chữ
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
    return computeLayout(index, focus, visible, scope, stubs, { oHang });
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
