// ============================================================
// giapha · js/domains/layout.js
// Vai trò  : Tính TOẠ ĐỘ các ô người, đường nối và nốt cụt. Không vẽ gì cả.
// Lớp      : domains — HÀM THUẦN. Không gọi services, không chạm DOM.
// Phụ thuộc: config (LAYOUT, PHOTO) · domains/union.js · domains/render.js (VE)
// Phiên bản: 2.4.0 · Cập nhật: 30/09/2026 19:08
// ⚠ Chỉ còn MỘT cách xếp: BA KHỐI `datBaKhoi()` (mục 4b, b128b). Cách cũ
//   `datMoiKhoi()` đã gỡ 30/09/2026. Ô rộng/cao THEO HÀNG khi có `tuyChon.oHang` (chế độ chữ).
// Sổ tay   : so-tay/ve-so-do.md
// ============================================================
//
// Tách khỏi render.js có chủ ý: chỉnh giao diện (màu, phông, bo góc) không
// được đụng vào thuật toán bố trí. Ngược lại, MỌI phép tính toạ độ nằm ở đây
// — render.js chỉ nhận mảng điểm rồi vẽ, không tự tính lấy một pixel nào.
//
// Chiều cao ô CỐ ĐỊNH (LAYOUT.nodeHeight), dù người đó có một dòng hay hai.
// Để ô co theo nội dung thì các ô cùng một đời sẽ so le, sơ đồ nhìn gãy.
//
// ============================================================
// BỐN RÀNG BUỘC ĐÃ BIẾT TRƯỚC KHI VIẾT — đừng "đơn giản hoá" mất cái nào
// ============================================================
//
// 1. KHÔNG ĐƯỢC GIẢ ĐỊNH VỢ CHỒNG CÙNG MỘT HÀNG — NHƯNG CŨNG KHÔNG ĐƯỢC ĐỂ
//    HỌ LỆCH HÀNG BỪA. Đây là hai nửa của một luật, và chat 1.6 chỉ có nửa đầu.
//
//    Nét chéo CHỈ đúng khi hai người KẾT HÔN TRONG HỌ, tức có tổ tiên chung.
//    U0023: ông "11" (P0044, đời 4) cưới bà "29" (P0053, đời 5), chung cụ
//    P0034 — hai người mỗi người đứng dưới cha mẹ mình, nét vợ chồng vẽ CHÉO.
//    Đó là sự thật về gia đình ấy, phải vẽ ra.
//
//    Hai người KHÁC dòng họ thì phải CÙNG HÀNG, dù mỗi người có bao nhiêu đời
//    tổ tiên trong sơ đồ. Ca thật: ông Dũng (P0012) cưới bà Hương Lan (P0020),
//    không một tổ tiên chung nào; nhánh ông có 3 đời, nhánh bà có 6, và trước
//    chat 1.7 hai người bị vẽ lệch nhau ĐÚNG 3 hàng với một nét chéo cắt ngang
//    cả sơ đồ. Xem canNhanh().
//
//    ⚠ Luật này đã nằm trong `KE-HOACH` từ 16/08 (mục "Bẫy khi đo lệch đời":
//    *chỉ báo lệch đời khi hai người có tổ tiên chung*), nhưng chỉ được nghĩ
//    cho phía RÀ SOÁT DỮ LIỆU, không ai cài cho phía VẼ HÌNH. Cùng một luật,
//    hai phía.
//
// 2. ĐỜI = ĐƯỜNG ĐI DÀI NHẤT, không phải ngắn nhất. Xem ganMucDoi().
//    Đây là lý do layout.js KHÔNG dùng lại bfsLevels() của chat 1.2 —
//    bfsLevels cho đường NGẮN NHẤT.
//
// 3. NỐT CỤT NEO VÀO unionId, KHÔNG NEO VÀO NGƯỜI. Ông Cương có hai đời vợ;
//    cắt bớt một bà thì nốt cụt phải nằm cạnh ĐÚNG cái hôn nhân bị cắt. Mỗi
//    union có mức nét riêng, nên hai nốt cụt cùng hướng ngang không đè nhau.
//
// 4. KHÔNG NHÂN BẢN Ô NGƯỜI. Hai nhánh cưới nhau thì người đó vẫn chỉ có một
//    ô; đường nối dài ra chứ ô không nhân đôi. Bài kiểm tra của dự án đếm SỐ
//    NGƯỜI — có ô nhân bản là số đếm mất nghĩa.
//
// ============================================================
// AI ĐỨNG Ở ĐÂU — ba luật quyết định toàn bộ bố cục
// ============================================================
//
// A. NGƯỜI CÓ CHA MẸ HIỂN THỊ thì đứng dưới cha mẹ mình, không bao giờ bị kéo
//    vào dải của vợ/chồng. Nếu không, họ bị tách khỏi anh chị em ruột.
//    Người có HAI bộ cha mẹ (con nuôi P0010) đứng dưới bộ ĐẺ; bộ nuôi nối tới
//    bằng một đường dài, nét đứt. Quy tắc này bỏ hẳn tính phụ thuộc thứ tự —
//    kết quả không đổi dù duyệt từ đâu.
//
// B. NGƯỜI KHÔNG CÓ CHA MẸ HIỂN THỊ (dâu/rể lấy vào, nút biên) được HẤP THỤ
//    vào dải của bạn đời — đứng kề bên, cùng hàng.
//
// C. CHIỀU TRÁI/PHẢI theo giới tính, không theo huyết thống: nam trái, nữ
//    phải (QUY-TAC-VE §2). Quy tắc theo huyết thống KHÔNG ổn định — đổi người
//    trung tâm là một nửa số cặp đảo chỗ. Cùng giới hoặc thiếu giới thì theo
//    `partnerOrder`.
//
// ============================================================
// ĐẦU RA — render.js chỉ việc vẽ, không tính gì thêm
// ============================================================
//
//   nodes  [{ id, x, y, w, h, kind, gen, laTrungTam }]   x,y = GÓC TRÊN TRÁI
//   unions [{ id, x, y, busY, kieu, neoId, partnerIds }] điểm treo chùm con
//   links  [{ kind, relation, points, from, to, unionId, dai, cheo }]
//   stubs  [{ personId, unionId, direction, hiddenCount, x, y, x1, y1,
//             angle, nguon }]                            x,y = TÂM NỐT TRÒN
//   bounds { minX, minY, maxX, maxY }
//
// `points` là mảng [[x,y], …] — đường gấp khúc vẽ thẳng, không phải đường
// cong. Ba loại nét cố định (QUY-TAC-VE §8) đọc từ `kind` + `relation`:
//   kind 'spouse'                  → nét liền mảnh
//   kind 'child', relation 'birth' → nét liền
//   kind 'child', relation khác    → nét ĐỨT (con nuôi)
//   nốt cụt                        → nét gạch-chấm, do render.js lo

import { LAYOUT, PHOTO } from '../config.js';
import { rankCua } from './union.js';
import { VE } from './render.js';

const RONG = LAYOUT.nodeWidth;
const DEM  = 24;                  // lề quanh sơ đồ khi tính bounds

/**
 * Chiều cao ô ĐANG DÙNG.
 *
 * ⚠ **`let`, không phải `const`, và `computeLayout()` gán lại nó ở dòng đầu
 * tiên mỗi lần chạy.** Trước bước 28 đây là `const CAO = LAYOUT.nodeHeight`,
 * chụp một lần lúc nạp module — và cái bẫy ấy đã sập thật: phép đo
 * `kiem-thu/do-o-co-anh.mjs` đổi `LAYOUT.nodeHeight` rồi gọi lại
 * `computeLayout`, nhận về **+0% cho cả bốn phương án**, một kết quả trông rất
 * gọn gàng mà sai hoàn toàn.
 *
 * Từ bước 28 nó phải đọc lại thật, vì công tắc *"Ngày giỗ"* đổi chiều cao ô
 * ngay lúc chạy: bật thì mọi ô cao thêm một hàng chữ.
 *
 * Mọi hàm phụ trong file này đều chạy BÊN TRONG `computeLayout()`, nên đến lúc
 * chúng đọc `CAO` thì giá trị đã đúng.
 */
let CAO = LAYOUT.nodeHeight;

/**
 * MỨC NÉT VỢ CHỒNG bên trong ô — đo từ nóc ô xuống.
 *
 * ⚠ **Đúng bằng TÂM VÒNG ẢNH, không phải tâm ô.** Đây là chỗ mọi nét vợ chồng
 * bám vào, và cũng là chỗ chùm con treo lên.
 *
 * Trước bước 28 nó là `CAO / 2` — tâm ô — và lúc ấy đúng, vì ô có VIỀN và có
 * NỀN ĐẶC nên nét chỉ lộ ra ở khe 16px giữa hai ô, ngang tầm mắt nhìn. Bước 28
 * bỏ viền ô (chủ dự án: *"khung bao quanh tên và ảnh làm app rất xấu"*), và
 * lúc đó `CAO / 2` rơi đúng vào DÒNG TÊN: đoạn nét ngắn nối hai người sẽ chạy
 * ngang giữa hai cái tên. Ở tâm vòng ảnh thì nét nối hai khuôn mặt — đúng thứ
 * Quick Family Tree làm, và đọc ra ngay không phải học.
 *
 * Lấy từ `PHOTO` chứ không gõ lại con số: hai hằng số phải khớp nhau mà nằm
 * hai nơi thì sớm muộn cũng lệch, và lúc lệch thì nét vợ chồng cắt ngang mặt
 * người chứ không có gì báo lỗi.
 */
const MUC_NET = PHOTO.leTrenO + PHOTO.banKinhTrenO;

/**
 * HÌNH HỌC THEO HÀNG — chế độ CHỈ CHỮ (việc 1, 30/09/2026).
 *
 * `null` = chế độ ẢNH: mọi hàng `RONG × CAO`, nét vợ chồng ở `MUC_NET`, đúng
 * từng pixel như trước. Có giá trị thì là `Map(đời → {w, h, net})` do
 * `tuyChon.oHang` trả về, và MỌI phép đo dưới đây hỏi hàng của người ấy thay
 * vì hằng số. Đặt lại ở đầu mỗi `computeLayout()`, như `CAO`.
 *
 * ⚠ Giữ nguyên HÌNH phép tính khi thay hằng số (`(a + b) / 2 + w / 2`, không
 * viết lại thành `(a + w/2 + b + w/2) / 2`): chế độ ảnh phải ra giống TỪNG
 * BYTE — gác bằng `../kiem-thu/chup-bo-cuc.mjs`.
 */
let HANG = null;
let KHONG_ANH = false;
// Ba KHE — chế độ ảnh đọc `LAYOUT`, chế độ chữ đọc `tuyChon.khe` (O_CHU):
// hết nốt cụt thì khe không còn bị nốt ngang/nốt dọc chặn, nên hẹp được.
let KHE    = LAYOUT.hGap;        // giữa hai người không phải vợ chồng
let KHE_VC = LAYOUT.spouseGap;   // giữa hai vợ chồng đứng kề nhau
let KHE_DOC = LAYOUT.vGap;       // giữa hai hàng
// Chế độ chữ: vợ chồng nối bằng VÒNG CUNG trên đầu ô, con treo dưới ô CHA
// (`chaCua()`) — `{cao, buoc, tran}` từ O_CHU. Chế độ ảnh: null.
let CUNG = null;
const rongHang = (m) => (HANG && HANG.has(m) ? HANG.get(m).w : RONG);
const netHang  = (m) => (HANG && HANG.has(m) ? HANG.get(m).net : MUC_NET);
// Ô RIÊNG một bề rộng (`oHang` trả `rieng: Map(id → w)`) thắng bề rộng của hàng.
let RIENG = null;
const rongId   = (ct, id) => (RIENG && RIENG.has(id) ? RIENG.get(id) : rongHang(ct.muc.get(id)));
const netNut   = (nut) => netHang(nut.gen);
/**
 * Khoảng từ MÉP Ô tới MÉP VÒNG ẢNH theo chiều ngang (vòng ảnh nằm giữa ô) —
 * để nét vợ chồng chạm được vào khuôn mặt, xem `themNetVoChong()`. Không ảnh
 * thì 0: nét chạm mép ô chữ. ⚠ Tính từ `PHOTO.banKinhTrenO`, đừng gõ lại con
 * số — bán kính đổi ở bước 80 và nét từng trôi lơ lửng cách mặt 14px.
 */
const leAnh    = (nut) => (KHONG_ANH ? 0 : nut.w / 2 - PHOTO.banKinhTrenO);

/**
 * Bố trí toàn bộ sơ đồ quanh một người trung tâm.
 *
 * `stubPoints` là tham số THÊM so với chữ ký công bố ở khung mã, để trống thì
 * chỉ mất phần nốt cụt chứ không hỏng gì. Lý do truyền vào chứ không tự gọi:
 * `findStubPoints()` nằm ở `domains/bloodline.js`, mà theo luật lớp thì
 * `domains` chỉ được gọi `utils` và `config`. Nơi gọi (pages/tree-view.js)
 * làm ba bước liền nhau:
 *
 *   const visible = computeVisibleSet(index, focus, scope);
 *   const stubs   = findStubPoints(index, visible, scope);
 *   const layout  = computeLayout(index, focus, visible, scope, stubs);
 *
 * @param {object} index                     từ utils/graph.buildIndex
 * @param {string} focusPersonId
 * @param {Map<string,'full'|'edge'>} visibleSet   từ computeVisibleSet
 * @param {object} [scope]                   chưa dùng — giữ cho khớp chữ ký
 * @param {Array<object>} [stubPoints]       từ findStubPoints
 * @param {{hienNgayGio?:boolean, oHang?:function}} [tuyChon]
 *        `hienNgayGio` — CHỪA CHỖ cho hàng ngày giỗ, tức mọi ô cao thêm một
 *        hàng chữ. Phải khớp với cờ cùng tên đưa vào `renderTree()`: chỗ này
 *        chừa chỗ, chỗ kia vẽ. Lệch nhau thì hàng giỗ hoặc tràn ra khỏi ô,
 *        hoặc để lại một khoảng trống không ai giải thích được.
 *        `oHang(đời, [personId]) → {w, h, net}` — chế độ CHỈ CHỮ: kích thước
 *        ô từng hàng, gọi SAU khi biết đời. Có nó thì bỏ vòng ảnh — xem `HANG`.
 *        `khe: {hGap, spouseGap, vGap}` — chỉ đọc khi có `oHang`.
 * @returns {{nodes:Array, unions:Array, links:Array, stubs:Array,
 *            bounds:{minX:number,minY:number,maxX:number,maxY:number}}}
 */
export function computeLayout(index, focusPersonId, visibleSet, scope, stubPoints, tuyChon) { // eslint-disable-line no-unused-vars
  // Đọc lại chiều cao ô TRƯỚC MỌI THỨ KHÁC — xem ghi chú `CAO` ở đầu file.
  CAO = (tuyChon && tuyChon.hienNgayGio)
    ? LAYOUT.nodeHeightNgayGio
    : LAYOUT.nodeHeight;
  HANG = null;
  RIENG = null;
  KHONG_ANH = !!(tuyChon && typeof tuyChon.oHang === 'function');
  const khe = (KHONG_ANH && tuyChon.khe) || {};
  KHE     = khe.hGap      ?? LAYOUT.hGap;
  KHE_VC  = khe.spouseGap ?? LAYOUT.spouseGap;
  KHE_DOC = khe.vGap      ?? LAYOUT.vGap;
  CUNG = KHONG_ANH ? { cao: khe.cungCao ?? 6, buoc: khe.cungBuoc ?? 3, tran: khe.cungTran ?? 12 } : null;

  const rong = {
    nodes: [], unions: [], links: [], stubs: [],
    bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
  };
  if (!index || !index.personById || !visibleSet || visibleSet.size === 0) return rong;

  const ct = dungNguCanh(index, visibleSet);
  if (ct.dsNguoi.length === 0) return rong;
  ct.tamId = focusPersonId || null;

  ganMucDoi(ct);
  hapThuCapTrongHo(ct);            // PHẢI sau ganMucDoi — nó cần biết đời
  const yHang = KHONG_ANH ? dungHang(ct, tuyChon.oHang) : null;
  const viTriX = datBaKhoi(ct);

  const nodes = [];
  const nodeById = new Map();
  for (const id of ct.dsNguoi) {
    const gen = ct.muc.get(id) || 0;
    const nut = {
      id,
      x: viTriX.has(id) ? viTriX.get(id) : 0,
      y: yHang ? yHang.get(gen) : gen * (CAO + KHE_DOC),
      w: rongId(ct, id),
      h: HANG ? HANG.get(gen).h : CAO,
      kind: visibleSet.get(id) || 'full',
      gen,
      laTrungTam: id === focusPersonId,
    };
    nodes.push(nut);
    nodeById.set(id, nut);
  }
  ct.nodeById = nodeById;

  // Phải chạy SAU khi mọi `x` đã chốt: nó đo khoảng cách thật tới hàng xóm.
  ganRongTenToiDa(nodes);

  const unions = dungDiemTreo(ct, stubPoints);
  const links  = dungDuongNoi(ct, unions);
  ct.links = links;          // nốt cụt sát ô phải né nét đã vẽ — `netNgangCat()`
  const stubs  = dungNotCut(ct, unions, stubPoints);

  return { nodes, unions, links, stubs, bounds: tinhBounds(nodes, links, stubs) };
}

/**
 * Chế độ CHỈ CHỮ: hỏi `oHang` kích thước ô từng hàng, ghi vào `HANG`, trả
 * `Map(đời → y nóc hàng)`. Hàng cao khác nhau nên `y` CỘNG DỒN, không nhân.
 * Đời trống ở giữa (hiếm) vẫn giữ một khe `vGap`, không để hai hàng dính nhau.
 */
function dungHang(ct, oHang) {
  const theoDoi = new Map();
  for (const id of ct.dsNguoi) {
    const m = ct.muc.get(id) || 0;
    if (!theoDoi.has(m)) theoDoi.set(m, []);
    theoDoi.get(m).push(id);
  }
  HANG = new Map();
  RIENG = new Map();
  for (const [m, ids] of theoDoi) {
    const o = oHang(m, ids);
    HANG.set(m, o);
    if (o.rieng) for (const [id, w] of o.rieng) RIENG.set(id, w);
  }

  const yHang = new Map();
  const ds = [...theoDoi.keys()].sort((a, b) => a - b);
  let y = 0;
  for (let m = ds[0]; m <= ds[ds.length - 1]; m++) {
    yHang.set(m, y);
    y += (HANG.has(m) ? HANG.get(m).h : 0) + KHE_DOC;
  }
  return yHang;
}

/**
 * BỀ RỘNG TỐI ĐA CỦA BẢNG TÊN, tính riêng cho từng ô — thêm ở bước 80, việc E.
 *
 * ⚠ **Vì sao con số này nằm ở `layout.js` chứ không ở `render.js`.** Nó là một
 * phép đo KHOẢNG CÁCH GIỮA HAI Ô, mà toàn bộ toạ độ ô chỉ file này biết
 * (QUY-TAC-VE §11: *"Mọi phép tính toạ độ nằm ở `layout.js`; `render.js` chỉ
 * vẽ"*). `render.js` đọc con số ra rồi tự trừ lề bảng của nó.
 *
 * Nghĩa của con số: **bề rộng ô DÀNH CHO BẢNG TÊN**, tính cả lề bảng, căn giữa
 * theo tâm ô. Không nới được thì nó đúng bằng `w` — nên `render.js` viết
 * `node.rongTenToiDa || node.w` là chạy đúng cả với layout cũ.
 *
 * Cách đo: hàng xóm gần nhất CÙNG MỘT ĐỜI, bên trái và bên phải. Khe giữa hai
 * ô chia đôi cho hai bên, sau khi đã chừa `kheBangTen`. Người ngoài cùng một
 * hàng không có hàng xóm ở phía ấy, nhưng vẫn bị `noiTenToiDa` chặn — nếu
 * không thì một người đứng lẻ giữa sơ đồ nhận một cái bảng dài ngoẵng.
 *
 * ⚠ Chỉ xét CÙNG ĐỜI. Ô hai đời khác nhau không bao giờ đè bảng tên nhau: bảng
 * tên nằm trong dải `y` riêng của ô mình, mà hai đời cách nhau `vGap`.
 *
 * ⚠ Bảng nới ra ĐƯỢC PHÉP đè lên đoạn nét kẻ dọc — luật vẽ hai lượt (§7) lo
 * phần che, và nốt cụt vẽ ở lượt 3 nên không bao giờ bị bảng tên nuốt mất.
 */
function ganRongTenToiDa(nodes) {
  const theoHang = new Map();
  for (const n of nodes) {
    if (!theoHang.has(n.gen)) theoHang.set(n.gen, []);
    theoHang.get(n.gen).push(n);
  }

  const tran = LAYOUT.noiTenToiDa;
  for (const [, ds] of theoHang) {
    ds.sort((a, b) => a.x - b.x);
    for (let i = 0; i < ds.length; i++) {
      const n = ds[i];
      let khe = Infinity;
      if (i > 0)              khe = Math.min(khe, n.x - (ds[i - 1].x + ds[i - 1].w));
      if (i < ds.length - 1)  khe = Math.min(khe, ds[i + 1].x - (n.x + n.w));

      const noi = Number.isFinite(khe)
        ? Math.max(0, (khe - LAYOUT.kheBangTen) / 2)
        : tran;
      n.rongTenToiDa = n.w + 2 * Math.min(noi, tran);
    }
  }
}

// ============================================================
// 1 · NGỮ CẢNH — lọc dữ liệu thô về đúng tập đang hiển thị
// ============================================================

/**
 * Mọi hàm phía dưới chỉ đọc `ct`, không đọc thẳng `index` nữa. Nhờ vậy không
 * bao giờ lỡ tay bố trí một người không nằm trong tập hiển thị.
 */
function dungNguCanh(index, visibleSet) {
  const ct = {
    index,
    visibleSet,
    dsNguoi:       [],           // mảng, để thứ tự duyệt luôn xác định
    unionHT:       new Map(),    // unionId -> { id, partners[], children[] } đã lọc
    unionLamVo:    new Map(),    // personId -> [unionId] làm vợ/chồng, sắp theo
                                  // rankCua(u, personId) — mốc là CHÍNH personId
                                  // của khoá này, không phải người bạn đời
    unionLamCon:   new Map(),    // personId -> [unionId] làm con, chỉ union hiển thị
    unionSoHuu:    new Map(),    // personId -> unionId ĐẶT CHỖ cho người này
    hapThuBoi:     new Map(),    // personId -> { unionId, neoId }
    roiChoCha:     new Set(),    // người CÓ cha mẹ hiển thị mà vẫn bị hấp thụ
                                  // vào dải bạn đời (hôn nhân trong họ, b81):
                                  // cha mẹ ruột thôi ĐẶT CHỖ, nhưng vẫn là cha
                                  // mẹ ruột — nét nối giữ nguyên loại
    dai:           new Map(),    // neoId -> mô tả dải (xem layDai)
    muc:           new Map(),
    toTien:        new Map(),    // personId -> Set tổ tiên hiển thị (đệm, xem toTienDong)
    cumCon:        new Map(),    // unionId -> [personId] cả cụm con cháu đặt dưới union đó
    tamId:         null,         // người trung tâm — `datBaKhoi()` dựng lõi quanh họ
    daDat:         new Set(),
  };

  for (const id of visibleSet.keys()) {
    if (index.personById.has(id)) ct.dsNguoi.push(id);
  }
  ct.dsNguoi.sort();
  const trongTap = new Set(ct.dsNguoi);

  // --- Union nào được vẽ ---------------------------------------------------
  // Cần ít nhất một partner hiển thị, và cần có thứ để nối: hoặc partner thứ
  // hai, hoặc một người con. Union chỉ còn một partner mà không con thì không
  // vẽ gì cả — phần "còn ai đó bị ẩn" đã do nốt cụt lo.
  for (const [uid, u] of index.unionById) {
    const partners = [];
    for (const pid of Array.isArray(u.partners) ? u.partners : []) {
      if (trongTap.has(pid) && partners.indexOf(pid) === -1) partners.push(pid);
    }
    if (partners.length === 0) continue;

    const children = [];
    for (const con of Array.isArray(u.children) ? u.children : []) {
      const cid = con && con.personId;
      if (!cid || !trongTap.has(cid)) continue;
      if (children.some((c) => c.personId === cid)) continue;
      children.push({
        personId: cid,
        relation: con.relation || 'birth',
        order:    Number.isFinite(Number(con.order)) ? Number(con.order) : 9999,
      });
    }
    if (partners.length < 2 && children.length === 0) continue;

    children.sort((a, b) => (a.order - b.order) || (a.personId < b.personId ? -1 : 1));
    ct.unionHT.set(uid, { id: uid, partners, children });
  }

  // --- Bảng tra ngược ------------------------------------------------------
  for (const id of ct.dsNguoi) { ct.unionLamVo.set(id, []); ct.unionLamCon.set(id, []); }
  for (const [uid, u] of ct.unionHT) {
    for (const pid of u.partners) ct.unionLamVo.get(pid).push(uid);
    for (const c of u.children)   ct.unionLamCon.get(c.personId).push(uid);
  }
  // Mốc PHẢI là người đang sắp (`id`, khoá của chính vòng lặp này), không phải
  // một con số chung của union — đây đúng là chỗ lỗi VẼ mà DAC-TA-RANK mục 1.2
  // chỉ ra: mốc lệch thì vợ cả bị vẽ ra ngoài vợ thứ. Đọc `rankCua` từ union
  // THẬT qua `index.unionById`, không phải từ `ct.unionHT` — bản trong `ct` đã
  // lọc bớt trường, không còn `ranks`/`rank`.
  for (const [id, ds] of ct.unionLamVo) {
    ds.sort((a, b) =>
      (rankCua(index.unionById.get(a), id) - rankCua(index.unionById.get(b), id)) ||
      (a < b ? -1 : 1));
  }

  // --- Luật A: union nào ĐẶT CHỖ cho một người con -------------------------
  // Ưu tiên bộ cha mẹ ĐẺ. Con nuôi còn cha mẹ đẻ thì đứng dưới cha mẹ đẻ, bộ
  // nuôi nối tới bằng đường dài nét đứt (KE-HOACH: "vẽ cả hai đường dẫn lên").
  for (const id of ct.dsNguoi) {
    const ds = ct.unionLamCon.get(id);
    if (ds.length === 0) continue;
    const deIsBirth = ds.find((uid) =>
      ct.unionHT.get(uid).children.some((c) => c.personId === id && c.relation === 'birth'));
    ct.unionSoHuu.set(id, deIsBirth || ds.slice().sort()[0]);
  }

  // --- Luật B: ai bị hấp thụ vào dải của ai --------------------------------
  // `tuDung` = người tự có chỗ đứng riêng. Người có cha mẹ hiển thị luôn tự
  // đứng. Cặp mà cả hai đều không cha mẹ thì một người được chọn làm neo.
  const tuDung = new Set();
  for (const id of ct.dsNguoi) if (ct.unionSoHuu.has(id)) tuDung.add(id);

  const dsUnionSapXep = [...ct.unionHT.keys()].sort();
  for (const uid of dsUnionSapXep) {
    const u = ct.unionHT.get(uid);
    if (u.partners.length < 2) continue;

    let neoU = u.partners.find((p) => tuDung.has(p) && !ct.hapThuBoi.has(p));
    if (!neoU) {
      const ungVien = u.partners.filter((p) => !ct.hapThuBoi.has(p));
      if (ungVien.length === 0) continue;   // cả cặp đã bị hấp thụ nơi khác → nét dài
      // Cả cặp đều không có cha mẹ hiển thị. NGƯỜI CÓ NHIỀU BẠN ĐỜI giữ dải.
      // Ca thật: bà "2" (P0034) hai đời chồng. Lấy bừa người đầu danh sách thì
      // bà bị hấp thụ vào dải ông chồng thứ nhất, ông thứ hai văng ra xa nối
      // bằng nét dài — trong khi QUY-TAC-VE §3 nói các ô bạn đời xếp ra xa dần
      // Ô NGƯỜI ĐÓ, tức người đó mới là người giữ dải.
      neoU = ungVien.reduce((a, b) =>
        (ct.unionLamVo.get(b).length > ct.unionLamVo.get(a).length ? b : a));
      tuDung.add(neoU);
    }
    for (const p of u.partners) {
      if (p === neoU || tuDung.has(p) || ct.hapThuBoi.has(p)) continue;
      ct.hapThuBoi.set(p, { unionId: uid, neoId: neoU });   // mỗi người MỘT lần
    }
  }

  // ⚠ Ca "CẢ HAI vợ chồng đều tự đứng được" KHÔNG xử ở đây — nó cần biết ĐỜI,
  // mà đời thì `ganMucDoi()` chạy sau. Xem `hapThuCapTrongHo()`.
  return ct;
}

// soRank() đã BỎ (Vòng 2 của DAC-TA-RANK_V01) — đọc thứ bậc nay đi qua
// `rankCua()` nhập từ `./union.js`, đúng MỘT cửa cho cả app.

// ============================================================
// 2 · ĐỜI — đường đi dài nhất, rồi cân bằng lại
// ============================================================

/**
 * Xếp mỗi người vào một HÀNG. Hai ràng buộc, nới dần từ 0 tới khi hết đổi:
 *
 *   (a) mọi người trong CÙNG MỘT DẢI phải cùng hàng — dâu/rể lấy vào không có
 *       cha mẹ trong tập vẽ nên tự thân họ ở mức 0;
 *   (b) con LUÔN nằm dưới mọi người cha mẹ hiển thị của nó.
 *
 * Hai vế phải nới XEN KẼ, không làm tuần tự được: (a) kéo bà mẹ lấy vào xuống
 * đời 3, thì con của bà với một người chồng KHÔNG hiển thị vẫn còn kẹt ở đời 1
 * cho tới khi (b) chạy lại.
 *
 * Vì mức chỉ TĂNG và bị chặn trên bởi số người, vòng lặp chắc chắn dừng. Điểm
 * dừng của nó chính là **đời = độ dài đường đi DÀI NHẤT** — nghiệm nhỏ nhất
 * thoả (b) — nên không ai bị vẽ nằm trên tổ tiên của chính mình. Đó là ràng
 * buộc số 2 ở đầu file, và là lý do KHÔNG dùng `bfsLevels()`: nó cho đường
 * NGẮN nhất, và con của cặp kết hôn trong họ sẽ bị vẽ ngang hàng với mẹ nó.
 *
 * ⚠ Riêng vòng NỚI DẦN không phải một phép duyệt đồ thị, nên không phá luật
 * "chỉ `utils/graph.js` được viết vòng lặp duyệt": nó chỉ nới đi nới lại trên
 * các danh sách đã dựng sẵn ở `dungNguCanh()`, không đi tìm đường, không cần
 * tập `visited`.
 *
 * ⚠ NHƯNG `toTienDong()` thêm ở chat 1.7 thì CÓ đi tìm đường, và nó **bắt buộc
 * có `visited`** — bản dữ liệu làm việc có sẵn hai vòng. Nó vẫn nằm ở đây chứ
 * không chuyển sang `utils/graph.js` vì nó đi lên bằng `ct.unionSoHuu`, tức
 * theo ĐÚNG BỘ CHA MẸ ĐÃ ĐẶT CHỖ cho từng người — một khái niệm chỉ có nghĩa
 * bên trong phép bố trí này, không phải một phép duyệt gia phả dùng chung.
 *
 * ⚠ Đã thử khởi tạo bằng một hàm sắp thứ tự tô-pô trong `utils/graph.js` cho
 * hội tụ nhanh. Đo trên cây bịa tới 2046 người: kết quả **giống hệt** trên cả
 * 89 sơ đồ của hai file dữ liệu, mà lại **chậm hơn 10–20%** — cây gia phả chỉ
 * sâu 8–9 đời nên vòng này vốn đã hội tụ sau chừng ấy vòng, còn sắp tô-pô thì
 * tốn hơn phần tiết kiệm được. Đã gỡ bỏ. Đừng thêm lại.
 *
 * `tran` chỉ là dây bảo hiểm cho dữ liệu hỏng có vòng có hướng (ai đó là tổ
 * tiên của chính mình) — một hàm bố trí sơ đồ không được phép treo trình duyệt
 * vì dữ liệu xấu.
 */
function ganMucDoi(ct) {
  const muc = new Map();
  for (const id of ct.dsNguoi) muc.set(id, 0);

  let m = canNhanh(ct, noiDan(ct, muc));

  // Kéo các GỐC TRÔI xuống sát ngay trên con của họ, rồi nới lại. Mỗi lượt chỉ
  // ĐẨY XUỐNG nên vòng này đơn điệu và chắc chắn dừng; `tran` là dây bảo hiểm.
  const tran = ct.dsNguoi.length + 2;
  for (let vong = 0; vong < tran; vong++) {
    const mKeo = keoGocTroiXuong(ct, m);
    if (!mKeo) break;
    m = canNhanh(ct, noiDan(ct, mKeo));
  }

  ct.muc = m;
}

/**
 * GỐC TRÔI: người không có cha mẹ hiển thị, không bị hấp thụ vào dải ai, mà
 * con của họ lại nằm sâu tít dưới. Kéo họ xuống đúng một hàng trên người con
 * NÔNG NHẤT của mình.
 *
 * --- Ca đã sinh ra luật này (18/08/2026, chủ dự án nhìn ảnh) --------------
 *
 * Bà Hương Lan (`P0020`) có hai bộ cha mẹ: bộ ĐẺ `U0013` và bộ NUÔI `U0025`
 * (ông Vượng, bà Loan). Luật A cho bà đứng dưới bộ ĐẺ, ở đời 6. Ông Vượng và bà
 * Loan thì **không có một tổ tiên nào trong sơ đồ**, nên vòng nới dần — vốn chỉ
 * biết ĐẨY XUỐNG — để nguyên hai người ở đời 0, ngang hàng cụ tổ sinh năm 1850.
 * Ràng buộc *"con phải sâu hơn cha mẹ"* vẫn thoả (6 > 0), nên **không bất biến
 * nào kêu**: sơ đồ đúng, chỉ là xấu và nói sai về gia đình ấy — nét đứt chạy
 * suốt sáu đời khiến người xem tưởng hai người là tổ tiên xa của cả họ.
 *
 * Luật: **đời của một người không có tổ tiên hiển thị thì do CON họ quyết
 * định, không phải do đỉnh sơ đồ.** Cùng tinh thần với luật B (người không có
 * cha mẹ hiển thị được hấp thụ vào dải bạn đời) — chỉ khác là ở đây không có
 * bạn đời nào để bám, nên bám vào con.
 *
 * Lấy người con NÔNG NHẤT (`min`), không phải sâu nhất: có nhiều con thì phải
 * đứng trên **tất cả**, và `min - 1` là hàng thấp nhất còn thoả điều đó.
 *
 * @returns {Map|null} bản đồ mức mới, hoặc null khi không ai phải dịch.
 */
function keoGocTroiXuong(ct, mucVao) {
  const muc = new Map(mucVao);
  let coDoi = false;

  for (const id of ct.dsNguoi) {
    if (ct.unionSoHuu.has(id)) continue;   // có cha mẹ hiển thị → đã có chỗ neo thật
    if (ct.hapThuBoi.has(id))  continue;   // đã bám vào dải bạn đời → luật B lo

    let nongNhat = Infinity;
    for (const uid of ct.unionLamVo.get(id) || []) {
      const u = ct.unionHT.get(uid);
      if (!u) continue;
      for (const c of u.children) {
        const mc = muc.get(c.personId);
        if (mc !== undefined && mc < nongNhat) nongNhat = mc;
      }
    }
    if (!Number.isFinite(nongNhat)) continue;   // chưa có người con nào hiển thị

    if (nongNhat - 1 > (muc.get(id) || 0)) { muc.set(id, nongNhat - 1); coDoi = true; }
  }

  return coDoi ? muc : null;
}

/**
 * Vòng nới dần: đẩy mọi người xuống cho tới khi hết ràng buộc bị vi phạm.
 *
 * Hai ràng buộc, cả hai chỉ ĐẨY XUỐNG, không bao giờ kéo lên — nhờ vậy vòng
 * lặp đơn điệu và chắc chắn dừng:
 *   - con phải sâu hơn MỌI cha mẹ đúng một bậc trở lên (luật A)
 *   - người bị hấp thụ đứng cùng hàng người neo (luật B)
 */
function noiDan(ct, mucVao) {
  const muc  = new Map(mucVao);
  const tran = ct.dsNguoi.length + 2;

  for (let vong = 0; vong < tran; vong++) {
    let coDoi = false;

    for (const [pid, ht] of ct.hapThuBoi) {
      const m = Math.max(muc.get(pid) || 0, muc.get(ht.neoId) || 0);
      if ((muc.get(pid) || 0) !== m)      { muc.set(pid, m);      coDoi = true; }
      if ((muc.get(ht.neoId) || 0) !== m) { muc.set(ht.neoId, m); coDoi = true; }
    }

    for (const [, u] of ct.unionHT) {
      let mCha = -1;
      for (const pid of u.partners) mCha = Math.max(mCha, muc.get(pid) || 0);
      if (mCha < 0) continue;
      for (const c of u.children) {
        if ((muc.get(c.personId) || 0) <= mCha) { muc.set(c.personId, mCha + 1); coDoi = true; }
      }
    }

    if (!coDoi) break;
  }
  return muc;
}

/**
 * Tổ tiên hiển thị của một người, KỂ CẢ chính người đó.
 *
 * Đi lên bằng `unionSoHuu` — đúng một bộ cha mẹ mỗi người, chính bộ đã ĐẶT CHỖ
 * cho họ ở luật A. Con nuôi còn cha mẹ đẻ thì đi theo bộ ĐẺ, khớp với chỗ họ
 * thật sự đứng trên sơ đồ.
 *
 * ⚠ CÓ `visited` — gia phả là đồ thị, bản dữ liệu làm việc có sẵn hai vòng.
 *
 * Kết quả không phụ thuộc `muc`, nên nhớ đệm lại một lần cho cả lượt bố trí:
 * `canNhanh()` gọi hàm này nhiều lần trên cùng một người.
 */
function toTienDong(ct, start) {
  if (ct.toTien.has(start)) return ct.toTien.get(start);

  const visited = new Set([start]);
  const hangDoi = [start];
  while (hangDoi.length) {
    const id  = hangDoi.shift();
    const uid = ct.unionSoHuu.get(id);
    if (!uid) continue;
    for (const p of ct.unionHT.get(uid).partners) {
      if (visited.has(p)) continue;
      visited.add(p);
      hangDoi.push(p);
    }
  }

  ct.toTien.set(start, visited);
  return visited;
}

/** Hai người này có tổ tiên chung không — tức có phải KẾT HÔN TRONG HỌ không. */
function chungDongHo(ct, a, b) {
  const ttA = toTienDong(ct, a);
  const ttB = toTienDong(ct, b);
  // Duyệt tập NHỎ HƠN: một bên thường chỉ có vài người, bên kia có thể cả nhánh.
  const [nho, lon] = ttA.size <= ttB.size ? [ttA, ttB] : [ttB, ttA];
  for (const x of nho) if (lon.has(x)) return true;
  return false;
}

/**
 * Căn hai nhánh KHÁC dòng họ về cùng một hàng (chat 1.7).
 *
 * Cặp CÓ tổ tiên chung thì để yên — nét chéo của họ là sự thật, xem luật 1 ở
 * đầu file. Cặp KHÔNG có tổ tiên chung mà đang lệch hàng thì dịch cả NHÁNH TỔ
 * TIÊN của người nông hơn xuống cho bằng người kia.
 *
 * Dịch cả nhánh chứ không dịch mỗi một người: kéo riêng ông Dũng xuống 3 hàng
 * thì mẹ ông vẫn đứng nguyên và nét dọc nối hai người dài suốt 4 đời. Cái phải
 * dịch là cả nhánh ông ấy đi lên.
 *
 * Dịch xong CHẠY LẠI `noiDan()`: cha mẹ xuống thì con cháu phải theo kịp. Vòng
 * nới dần chỉ đẩy xuống nên nó phục hồi được luật A mà không phá cái vừa căn —
 * hai người vừa cho bằng nhau thì không ai bị đẩy riêng ra nữa.
 *
 * Lặp tới khi ổn định. Mỗi lần dịch đưa đúng một cặp về chênh lệch 0, và số
 * cặp là hữu hạn, nên vòng lặp dừng; `tran` chỉ là lưới an toàn cho dữ liệu lạ.
 */
function canNhanh(ct, mucVao) {
  let muc = mucVao;
  const tran = ct.unionHT.size + 4;

  for (let vong = 0; vong < tran; vong++) {
    let coDoi = false;

    for (const [, u] of ct.unionHT) {
      if (u.partners.length < 2) continue;

      for (let i = 0; i < u.partners.length; i++) {
        for (let j = i + 1; j < u.partners.length; j++) {
          const a = u.partners[i];
          const b = u.partners[j];
          if (muc.get(a) === muc.get(b)) continue;
          if (chungDongHo(ct, a, b)) continue;

          const nong = muc.get(a) < muc.get(b) ? a : b;
          const buoc = Math.abs(muc.get(a) - muc.get(b));
          for (const x of toTienDong(ct, nong)) muc.set(x, muc.get(x) + buoc);
          coDoi = true;
        }
      }
    }

    if (!coDoi) break;
    muc = noiDan(ct, muc);
  }

  // Kéo hàng trên cùng về 0. Đời là THỨ TỰ HÀNG, không phải con số tuyệt đối —
  // và `tinhBounds()` ở cuối tính lề từ toạ độ thật, nên bỏ bước này thì cả sơ
  // đồ trôi xuống đúng bằng số hàng vừa dịch.
  let min = Infinity;
  for (const v of muc.values()) if (v < min) min = v;
  if (min !== 0 && Number.isFinite(min)) {
    for (const id of ct.dsNguoi) muc.set(id, muc.get(id) - min);
  }
  return muc;
}

/**
 * HÔN NHÂN TRONG HỌ — kéo cặp về đứng LIỀN NHAU. Thêm ở bước 81.
 *
 * ⚠ **Ca này trước bước 81 không ai được hấp thụ, và đó là lỗi chủ dự án chỉ
 * ra khi xem app thật:** *"bản chất Trọng Dũng và Hương Lan là 1 cặp, tại sao
 * cứ bị lỗi hoài vậy?"* Luật B cho *"người có cha mẹ hiển thị thì tự đứng"*,
 * nên khi CẢ HAI vợ chồng đều có cha mẹ trên hình thì không ai nhường ai —
 * mỗi người đứng dưới cha mẹ mình, và cặp bị tách ra hai đầu sơ đồ.
 *
 * Đo trên ba cây (`kiem-thu/do-cap-roi-nhau.mjs`): ca này hiếm — 4 cặp trong
 * cây hợp nhất 73 người, **2 cặp trong cả cây Nguyễn Phúc 681 người**. Nhưng
 * hễ gặp thì sai rất lộ, vì nó tách đúng cái cặp mà mắt người tìm đầu tiên.
 *
 * ⚠ **CÁI GIÁ, và nó KHÔNG tránh được:** một người chỉ đứng được MỘT chỗ. Kéo
 * bà về cạnh chồng thì **nét từ cha mẹ RUỘT của bà thành nét đi xa**. Không có
 * cách bố trí nào giữ ngắn cả ba mối nối cùng lúc — gia phả là ĐỒ THỊ, và hôn
 * nhân trong họ chính là chỗ đồ thị lộ ra là không phải cây.
 *
 * ⚠ **BA RÀO CHẮN. Bỏ bớt một là hỏng một luật khác, cả ba đều có ca kiểm:**
 *
 *   1. **CÙNG ĐỜI.** Lệch đời thì để nguyên — `QUY-TAC-VE §9` LUẬT LỆCH HÀNG.
 *      Ca kiểm: `U0023`, ông "11" (`P0044`, đời 4) cưới bà "29" (`P0053`, đời
 *      5). Bản đầu của bước 81 bỏ quên rào này và **kéo bà lên ngang hàng
 *      ông** — bốn bất biến của `chay.mjs` đỏ ngay. Thứ bậc đời trong gia phả
 *      Việt là thông tin thật, không phải chi tiết trình bày.
 *      ⚠ Vì rào này mà hàm phải chạy SAU `ganMucDoi()`, chứ không gộp được
 *      vào Luật B trong `dungNguCanh()`: lúc ấy chưa ai biết đời.
 *   2. **NGƯỜI BỊ KÉO chỉ có ĐÚNG MỘT union hiển thị.** Người nhiều bạn đời là
 *      NGƯỜI GIỮ DẢI của chính họ (§3); kéo họ sang dải người khác thì những
 *      union kia mất neo và chùm con của chúng rơi vào lưới an toàn của
 *      `datBaKhoi()`, tức đứng lạc chỗ.
 *   3. **ĐÚNG HAI người trong union.** Ba người trở lên thì "ai nhường ai"
 *      không còn một câu trả lời; để nguyên cách cũ.
 *
 * Ai giữ dải: người có NHIỀU bạn đời hơn (cùng lý lẽ với Luật B), hoà thì lấy
 * người đứng trước trong `partners` — thứ tự ấy đến từ `partnerOrder`, tức thứ
 * người dùng hoán được bằng tay.
 */
function hapThuCapTrongHo(ct) {
  for (const uid of [...ct.unionHT.keys()].sort()) {
    const u = ct.unionHT.get(uid);
    if (u.partners.length !== 2) continue;                       // rào 3

    const [a, b] = u.partners;
    if (!ct.unionSoHuu.has(a) || !ct.unionSoHuu.has(b)) continue;  // không phải ca này
    if (ct.hapThuBoi.has(a) || ct.hapThuBoi.has(b)) continue;      // đã yên chỗ
    if (ct.muc.get(a) !== ct.muc.get(b)) continue;                 // rào 1

    const soA = (ct.unionLamVo.get(a) || []).length;
    const soB = (ct.unionLamVo.get(b) || []).length;
    const neo = soB > soA ? b : a;
    const kia = neo === a ? b : a;
    if ((ct.unionLamVo.get(kia) || []).length !== 1) continue;     // rào 2

    ct.roiChoCha.add(kia);        // cha mẹ ruột thôi ĐẶT CHỖ, vẫn là cha mẹ ruột
    ct.hapThuBoi.set(kia, { unionId: uid, neoId: neo });
  }
}

// ============================================================
// 3 · DẢI — một người cùng mọi bạn đời được hấp thụ, trên MỘT hàng
// ============================================================

/**
 * QUY-TAC-VE §3: khung tên luôn cùng một hàng đời, không xếp dọc. Các ô bạn
 * đời xếp RA XA DẦN ô người neo theo `rankCua(u, neoId)` — mốc luôn là CHÍNH
 * người neo của dải này; nam thì vợ cả sát bên phải, nữ
 * thì soi gương lại, chồng cả sát bên trái.
 *
 * Trả về toạ độ TƯƠNG ĐỐI trong dải (mép trái dải = 0), nên tính một lần rồi
 * dùng lại được ở cả bước đặt khối lẫn bước dựng đường nối.
 *
 * `khe` là điểm treo chùm con của từng union — QUY-TAC-VE §4: tâm khe hở giữa
 * ô người neo và ô bạn đời thứ k. Union không có bạn đời nào trong dải (hôn
 * nhân một người — ông Thục ở U0024) thì điểm treo là TÂM Ô người duy nhất,
 * tuyệt đối không bịa thêm một ô "không rõ" làm người phối ngẫu.
 */
function layDai(ct, neoId) {
  if (ct.dai.has(neoId)) return ct.dai.get(neoId);

  const w        = rongId(ct, neoId);
  const dsUnion  = (ct.unionLamVo.get(neoId) || []).filter((uid) => ct.unionHT.has(uid));
  const banDoi   = [];
  for (const uid of dsUnion) {
    for (const sid of ct.unionHT.get(uid).partners) {
      if (sid === neoId) continue;
      const ht = ct.hapThuBoi.get(sid);
      if (ht && ht.neoId === neoId && ht.unionId === uid) banDoi.push({ unionId: uid, spouseId: sid });
    }
  }

  const huong = tinhHuong(ct, neoId, banDoi);
  const n     = banDoi.length;
  // Ô mỗi người một bề rộng (chế độ chữ: tên dài xuống dòng thì ô dày hơn) —
  // nên CỘNG DỒN từ ô người neo ra, không nhân `(i + 1) × bước`. Ô bằng nhau
  // (chế độ ảnh) thì ra đúng từng số như phép nhân cũ: toàn số nguyên.
  const wS    = banDoi.map((bd) => rongId(ct, bd.spouseId));
  let tong = 0;
  for (const v of wS) tong += v + KHE_VC;
  const dxP   = huong > 0 ? 0 : tong;

  const dx     = new Map([[neoId, dxP]]);
  const khe    = new Map();
  const mucNet = new Map();
  let mep = huong > 0 ? w : dxP;            // mép ngoài của ô vừa đặt
  banDoi.forEach((bd, i) => {
    const x = huong > 0 ? mep + KHE_VC : mep - KHE_VC - wS[i];
    dx.set(bd.spouseId, x);
    if (CUNG) khe.set(bd.unionId, chaCua(ct, neoId, bd.spouseId) === neoId ? dxP + w / 2 : x + wS[i] / 2);
    else khe.set(bd.unionId, huong > 0 ? mep + KHE_VC / 2 : mep - KHE_VC / 2);
    mep = huong > 0 ? x + wS[i] : x;
    mucNet.set(bd.unionId, i);
  });
  for (const uid of dsUnion) {
    if (khe.has(uid)) continue;
    khe.set(uid, dxP + w / 2);
    mucNet.set(uid, 0);
  }

  // Độ cao mỗi nấc — chia đều, đừng cộng dồn. Cộng dồn cứng 8px thì đến người
  // thứ tư nét tràn ra khỏi khung.
  const buocNet = n > 1
    ? Math.min(LAYOUT.spouseStepMax, (netHang(ct.muc.get(neoId)) - LAYOUT.spouseStepPadTop) / (n - 1))
    : 0;

  const kq = {
    neoId, huong, n, dx, khe, mucNet, dxP, buocNet,
    rong: w + tong,
    thuTuUnion: dsUnion,
    banDoi,
  };
  ct.dai.set(neoId, kq);
  return kq;
}

/**
 * QUY-TAC-VE §2 — NAM TRÁI, NỮ PHẢI. Trả +1 nghĩa là bạn đời xếp sang PHẢI ô
 * người neo (người neo là nam), -1 là sang TRÁI (người neo là nữ).
 *
 * Cùng giới, hoặc thiếu giới tính (`sex: "U"` — hai ô xám "7b" và "28" trong
 * dữ liệu thử), thì rơi về `partnerOrder`, đúng thứ người dùng hoán được tay.
 */
function tinhHuong(ct, neoId, banDoi) {
  const gt = gioiTinh(ct, neoId);
  if (banDoi.length === 0) return gt === 'F' ? -1 : 1;

  const gtS = gioiTinh(ct, banDoi[0].spouseId);
  if (gt === 'M' && gtS === 'F') return 1;
  if (gt === 'F' && gtS === 'M') return -1;

  const u  = ct.index.unionById.get(banDoi[0].unionId);
  const po = (u && Array.isArray(u.partnerOrder) && u.partnerOrder.length)
    ? u.partnerOrder
    : ((u && u.partners) || []);
  const iP = po.indexOf(neoId);
  const iS = po.indexOf(banDoi[0].spouseId);
  if (iP >= 0 && iS >= 0) return iS > iP ? 1 : -1;
  return gt === 'F' ? -1 : 1;
}

function gioiTinh(ct, id) {
  const p = ct.index.personById.get(id);
  return (p && p.sex) || 'U';
}

/**
 * Chế độ chữ: con của cặp `neoId` + `spouseId` treo dưới ô NÀO — luôn là CHA
 * (chủ dự án 30/09/2026). Không ai là nam (cặp đồng giới, thiếu giới tính)
 * thì người neo dải. Con riêng của mẹ không đi qua đây: union ấy không có bạn
 * đời trong dải, treo từ tâm ô mẹ như cũ.
 */
function chaCua(ct, neoId, spouseId) {
  return gioiTinh(ct, neoId) !== 'M' && gioiTinh(ct, spouseId) === 'M' ? spouseId : neoId;
}

// ============================================================
// 4 · KIỂM CHỒNG Ô — và căn chùm con của cặp đứng rời nhau
// ============================================================

/** Đặt khối `k` ở toạ độ `x` thì có ô nào đè lên ô đã đặt không? */
function deChoNay(ct, viTri, k, x) {
  for (const it of k.items) {
    const m = ct.muc.get(it.id);
    const t = it.x + x, p = t + rongId(ct, it.id);
    for (const [kh, xk] of viTri) {
      if (ct.muc.get(kh) !== m) continue;
      if (t < xk + rongId(ct, kh) + KHE && xk < p + KHE) return true;
    }
  }
  return false;
}

/**
 * Căn chùm con vào GIỮA HAI VỢ CHỒNG khi hai người đứng rời nhau (chat 1.7).
 *
 * `khoiDuoi()` đặt chùm con ngay dưới dải của người NEO, vì lúc đệ quy nó
 * chưa biết người kia sẽ nằm ở đâu — người kia thuộc một nhánh khác, do một
 * lượt đệ quy khác đặt chỗ. Với cặp kề nhau thì không sao: người kia nằm ngay
 * trong dải. Với cặp RỜI NHAU, chùm con dính hẳn về phía một người và trông
 * như con của riêng người ấy.
 *
 * Chạy cuối `datBaKhoi()` vì lúc đó mới biết đủ toạ độ cả hai vợ chồng.
 *
 * Dịch cả CỤM con cháu, không dịch riêng mấy ô con: dịch mỗi hàng con thì cháu
 * chắt ở dưới đứng nguyên và nét nối gãy chéo hết.
 *
 * ⚠ Dịch xong phải KIỂM CHỒNG Ô rồi mới nhận. Khoảng trống giữa hai nhánh
 * không phải lúc nào cũng đủ rộng, và bất biến "không ô nào chồng ô nào" đứng
 * trên tính thẩm mỹ: thà chùm con lệch còn hơn hai cái tên đè lên nhau.
 */
function canChumConVaoGiua(ct, viTriX) {
  for (const uid of [...ct.unionHT.keys()].sort()) {
    const u = ct.unionHT.get(uid);
    if (u.partners.length < 2) continue;

    const ids = ct.cumCon.get(uid);
    if (!ids || ids.length === 0) continue;

    // Cặp kề nhau (một người bị hấp thụ vào dải người kia) đã đúng chỗ rồi.
    const ht = ct.hapThuBoi.get(u.partners[0]) || ct.hapThuBoi.get(u.partners[1]);
    if (ht && ht.unionId === uid) continue;

    const xa = viTriX.get(u.partners[0]);
    const xb = viTriX.get(u.partners[1]);
    if (xa === undefined || xb === undefined) continue;
    const giua = (xa + xb) / 2 + rongId(ct, u.partners[0]) / 2;

    let trai = Infinity, phai = -Infinity;
    for (const id of ids) {
      const x = viTriX.get(id);
      if (x === undefined) continue;
      if (x < trai) trai = x;
      if (x + rongId(ct, id) > phai) phai = x + rongId(ct, id);
    }
    if (!Number.isFinite(trai)) continue;

    const d = giua - (trai + phai) / 2;
    if (Math.abs(d) < 1) continue;

    const cum = new Set(ids);
    if (deLenNhau(ct, viTriX, cum, d)) continue;
    for (const id of ids) viTriX.set(id, viTriX.get(id) + d);
  }
}

/** Dịch cụm đi `d` thì có ô nào của cụm đè lên ô ngoài cụm không (cùng hàng)? */
function deLenNhau(ct, viTriX, cum, d) {
  for (const id of cum) {
    const x = viTriX.get(id);
    if (x === undefined) continue;
    const m = ct.muc.get(id);
    const t = x + d, p = t + rongId(ct, id);
    for (const kh of ct.dsNguoi) {
      if (cum.has(kh)) continue;
      if (ct.muc.get(kh) !== m) continue;
      const xk = viTriX.get(kh);
      if (xk === undefined) continue;
      if (t < xk + rongId(ct, kh) + KHE && xk < p + KHE) return true;
    }
  }
  return false;
}

// ============================================================
// 4b · BA KHỐI — cách xếp duy nhất (b128b; cách cũ gỡ 30/09/2026)
// ============================================================
//
// Thuật toán chủ dự án tả (KE-HOACH b128b): từ người trung tâm truy lên.
//   khối 3 · dải cha mẹ + anh chị em + con cháu người trung tâm — `khoiDuoi()`
//   khối 1 · tổ tiên bên cha, khối 2 · tổ tiên bên mẹ           — `khoiTren()`
// và luật ấy ĐỆ QUY: quanh mỗi cặp tổ tiên lại có hai khối tổ tiên của hai
// người. Khối tính TỪ DƯỚI LÊN, xong khối nào biết ngay điểm nối cạnh dưới
// (`noi`) — khối trên chỉ việc căn theo điểm ấy, không cần lượt vá nào sau.
//
// Khác cách cũ ở hai chỗ — ghép theo VIỀN TỪNG HÀNG, và dải nhiều bạn đời
// được GIÃN — lý do và ca thật: `so-tay/ve-so-do.md`.
//
// Khối = { items:[{id,x}], vien: Map(đời → [trái, phải]), + các mốc x }.
// Mọi toạ độ tương đối cho tới khi ghép xong; `dich()` dời cả khối lẫn mốc.

const MOC_KHOI = ['neoX', 'noi', 'mepTrai', 'mepPhai'];

function khoiRong() { return { items: [], vien: new Map() }; }

function themVien(vien, m, lo, hi) {
  const v = vien.get(m);
  if (!v) vien.set(m, [lo, hi]);
  else { if (lo < v[0]) v[0] = lo; if (hi > v[1]) v[1] = hi; }
}

function themO(ct, k, id, x) {
  const w = rongId(ct, id);
  k.items.push({ id, x, w });
  themVien(k.vien, ct.muc.get(id), x, x + w);
}

function dich(k, d) {
  if (!d) return;
  for (const it of k.items) it.x += d;
  for (const v of k.vien.values()) { v[0] += d; v[1] += d; }
  for (const m of MOC_KHOI) if (typeof k[m] === 'number') k[m] += d;
}

function gop(vao, k) {
  for (const it of k.items) vao.items.push(it);
  for (const [m, [lo, hi]] of k.vien) themVien(vao.vien, m, lo, hi);
}

/**
 * Khối `phai` phải dời ÍT NHẤT bao nhiêu để đứng bên phải khối `trai`, cách
 * `khe` ở MỌI hàng hai khối cùng có. Không chung hàng nào → `-Infinity`.
 */
function canhPhai(vTrai, vPhai, khe) {
  let d = -Infinity;
  for (const [m, v] of vTrai) {
    const p = vPhai.get(m);
    if (p) d = Math.max(d, v[1] + khe - p[0]);
  }
  return d;
}

function mepCua(k, phai) {
  let x = phai ? -Infinity : Infinity;
  for (const v of k.vien.values()) x = phai ? Math.max(x, v[1]) : Math.min(x, v[0]);
  return x;
}

/**
 * Xếp các khối con từ trái sang phải, khít theo viền. `tamTruoc` giữ thứ tự
 * người neo: khối sau không bao giờ chui sang trái khối trước, kể cả khi hai
 * khối không chung hàng nào (con bị đẩy xuống đời sâu hơn).
 */
function xepKhit(ds, khe) {
  const acc = khoiRong();
  let tamTruoc = -Infinity, wTruoc = 0;
  for (const k of ds) {
    let d = 0;
    if (acc.items.length) {
      d = canhPhai(acc.vien, k.vien, khe);
      if (!Number.isFinite(d)) d = mepCua(acc, true) + khe - mepCua(k, false);
      if (typeof k.neoX === 'number') d = Math.max(d, tamTruoc + (wTruoc + k.neoW) / 2 + khe - k.neoX);
    }
    dich(k, d);
    gop(acc, k);
    if (typeof k.neoX === 'number') { tamTruoc = k.neoX; wTruoc = k.neoW; }
  }
  if (!canVaoKhoangTrong(ds, khe)) return acc;
  const moi = khoiRong();                 // viền của `acc` là bản sao — dựng lại
  for (const k of ds) gop(moi, k);
  return moi;
}

/**
 * Khối ở GIỮA còn trống cả hai bên (hàng sâu của hai khối kề nhau đã giữ khoảng
 * cách) thì đứng giữa khoảng trống, không dính sát bên trái. Ca bà Ảo P0349
 * (tâm P0228, cây 681): ghép viền đẩy bà sát bà Sang, trống 456px về phía ông
 * Huấn; cách cũ ghép hộp chữ nhật nên bà đứng giữa — chủ dự án chọn cách cũ.
 * Sửa `ds` tại chỗ; trả `true` nếu có khối bị dời.
 */
function canVaoKhoangTrong(ds, khe) {
  let coDoi = false;
  for (let i = 1; i < ds.length - 1; i++) {
    const k = ds[i];
    const trai = khoiRong(), phai = khoiRong();
    for (let j = 0; j < i; j++) gop(trai, ds[j]);
    for (let j = i + 1; j < ds.length; j++) gop(phai, ds[j]);
    const lui = -canhPhai(trai.vien, k.vien, khe);     // dời trái được bấy nhiêu
    const tien = -canhPhai(k.vien, phai.vien, khe);    // dời phải được bấy nhiêu
    if (!Number.isFinite(lui) || !Number.isFinite(tien)) continue;
    let d = (tien - lui) / 2;
    if (typeof k.neoX === 'number') {
      const neoTrai = ds[i - 1].neoX, neoPhai = ds[i + 1].neoX;
      if (typeof neoTrai === 'number') d = Math.max(d, neoTrai + (ds[i - 1].neoW + k.neoW) / 2 + khe - k.neoX);
      if (typeof neoPhai === 'number') d = Math.min(d, neoPhai - (ds[i + 1].neoW + k.neoW) / 2 - khe - k.neoX);
    }
    if (Math.abs(d) > 0.5) { dich(k, d); coDoi = true; }
  }
  return coDoi;
}

/**
 * KHỐI CON CHÁU của một dải: dải + mọi hậu duệ nó đặt chỗ (`daDat` chặn
 * đặt hai lần, bỏ qua `roiChoCha`). Trả `null` nếu người này đã đứng chỗ khác.
 */
function khoiDuoi(ct, neoId) {
  if (ct.daDat.has(neoId)) return null;
  ct.daDat.add(neoId);
  const dai = layDai(ct, neoId);
  for (const id of dai.dx.keys()) ct.daDat.add(id);

  // Ô của dải theo thứ tự trái → phải, và khe của mỗi union nằm ở đâu:
  // `{khe: j}` = giữa ô j và ô j+1 · `{o: j}` = tâm ô j (union không có bạn
  // đời trong dải).
  const oX = [...dai.dx.keys()].sort((a, b) => dai.dx.get(a) - dai.dx.get(b));
  const p0 = oX.map((id) => dai.dx.get(id));
  const viTriKhe = new Map();
  const dsUnion = [...dai.thuTuUnion];
  for (const uid of dsUnion) {
    const bd = dai.banDoi.find((b) => b.unionId === uid);
    if (!bd) { viTriKhe.set(uid, { o: oX.indexOf(neoId) }); continue; }
    const j = oX.indexOf(bd.spouseId);
    // Chế độ chữ: thả từ TÂM Ô CHA, không từ khe giữa hai vợ chồng.
    if (CUNG) viTriKhe.set(uid, { o: oX.indexOf(chaCua(ct, neoId, bd.spouseId)) });
    else viTriKhe.set(uid, { khe: dai.huong > 0 ? j - 1 : j });
  }
  // Union RIÊNG của người được hấp thụ (U0180: bà P0313 có con ghi một mình
  // bà) cũng thuộc dải này — thả từ tâm ô bà, như `dungDiemTreo()` kiểu 'don'.
  // Cách cũ bỏ sót, đàn con rơi vào lưới an toàn và đứng lạc tít bên phải.
  for (const id of oX) {
    if (id === neoId) continue;
    for (const uid of ct.unionLamVo.get(id) || []) {
      if (viTriKhe.has(uid) || !ct.unionHT.get(uid).partners.every((p) => dai.dx.has(p))) continue;
      dsUnion.push(uid);
      viTriKhe.set(uid, { o: oX.indexOf(id) });
    }
  }
  const w = rongId(ct, neoId);
  const wO = oX.map((id) => rongId(ct, id));      // mỗi ô một bề rộng (chế độ chữ)
  const kheTu = (p, uid) => {
    const v = viTriKhe.get(uid);
    return v.khe !== undefined ? (p[v.khe] + wO[v.khe] + p[v.khe + 1]) / 2 : p[v.o] + wO[v.o] / 2;
  };

  const chum = [];
  dsUnion.forEach((uid, i) => {
    const khoi = [];
    for (const c of ct.unionHT.get(uid).children) {
      if (ct.unionSoHuu.get(c.personId) !== uid) continue;   // bộ cha mẹ kia đặt chỗ
      if (ct.roiChoCha.has(c.personId)) continue;            // theo bạn đời sang dải khác (b81)
      const k = khoiDuoi(ct, c.personId);
      if (k) { k.conId = c.personId; khoi.push(k); }
    }
    if (khoi.length) chum.push({ unionId: uid, khoi, goc: kheTu(p0, uid), i: dai.huong > 0 ? i : -i });
  });

  const kq = khoiRong();
  if (chum.length === 0) {
    oX.forEach((id, j) => themO(ct, kq, id, p0[j]));
    kq.neoX = dai.dxP + w / 2;
    kq.neoW = w;
    return kq;
  }

  // Chùm con theo thứ tự khe trái → phải — nét treo con của bà thứ không bắc
  // chéo qua nét treo con của bà cả.
  chum.sort((a, b) => (a.goc - b.goc) || (a.i - b.i));
  const dsKhoi = [];
  for (const c of chum) for (const k of c.khoi) dsKhoi.push(k);
  gop(kq, xepKhit(dsKhoi, KHE));
  for (const c of chum) {
    c.lo = c.khoi[0].neoX;
    c.hi = c.khoi[c.khoi.length - 1].neoX;
    c.tam = (c.lo + c.hi) / 2;
    const ids = [];
    for (const k of c.khoi) for (const it of k.items) ids.push(it.id);
    ct.cumCon.set(c.unionId, ids);
  }

  let p;
  const dau = chum[0], cuoi = chum[chum.length - 1];
  if (chum.length === 1 && dau.khoi.length === 1) {
    // Một người con: con đứng THẲNG dưới điểm thả, nét không gãy chữ Z.
    // Chủ dự án bác luật gãy khuỷu kiểu QFT (§9b, b85b/e) ngày 25/09/2026.
    p = p0.map((v) => v + dau.lo - kheTu(p0, dau.unionId));
  } else {
    const lMuon = (dau.tam + cuoi.tam) / 2 - (kheTu(p0, dau.unionId) + kheTu(p0, cuoi.unionId)) / 2;
    // Chế độ chữ, mọi chùm cùng thả từ MỘT ô cha (ông nhiều vợ): không có
    // cách giãn dải nào cho mỗi chùm một điểm thả — cha đứng giữa cả đàn con.
    const motCho = CUNG && new Set(chum.map((c) => kheTu(p0, c.unionId))).size === 1;
    p = motCho ? p0.map((v) => v + lMuon) : xepDai(p0, chum, viTriKhe, kheTu, lMuon);
  }
  oX.forEach((id, j) => themO(ct, kq, id, p[j]));
  kq.neoX = p[oX.indexOf(neoId)] + w / 2;
  kq.neoW = w;

  // Nét thả từ khe xuống thanh ngang gom con thuộc về khối này: tính vào viền
  // hàng con, để khối bên cạnh không ghé vào làm hai thanh ngang bắc chéo.
  for (const c of chum) {
    const m = ct.muc.get(c.khoi[0].conId);
    const x = kheTu(p, c.unionId);
    themVien(kq.vien, m, x, x);
  }

  // Dải đã giãn → ghi lại cho `dungDiemTreo()` / `themNetVoChong()`, vốn đọc
  // khe theo toạ độ TƯƠNG ĐỐI trong dải.
  const l0 = p[0] - p0[0];
  if (p.some((v, j) => Math.abs(v - p0[j] - l0) > 0.01)) {
    const dx = new Map(), khe = new Map();
    oX.forEach((id, j) => dx.set(id, p[j] - p[0]));
    for (const uid of dai.thuTuUnion) khe.set(uid, kheTu(p, uid) - p[0]);
    ct.dai.set(neoId, { ...dai, dx, khe, dxP: dx.get(neoId), rong: p[p.length - 1] - p[0] + wO[wO.length - 1] });
  }
  return kq;
}

/**
 * Đặt các ô của một dải nhiều chùm con. Luật: điểm thả (khe) của MỌI chùm
 * phải nằm TRONG khoảng các con của chùm ấy — chùm một con thì đúng trên
 * đầu con (chủ dự án bác gãy khuỷu §9b, 25/09/2026).
 *
 * Bước 1 — không giãn: tìm độ dời chung thoả mọi chùm, chọn cái gần cách căn
 * cũ nhất (trung điểm hai chùm ngoài cùng). Bước 2 — không có độ dời nào như
 * thế: khe đầu đặt ở CON PHẢI NHẤT của chùm đầu, rồi mỗi khe sau giãn dải
 * đúng phần thiếu để chạm CON TRÁI NHẤT chùm của nó. Dời ô `t` trở đi: khe
 * nằm giữa ô j, j+1 mà chỉ dời được từ ô j+1 thì phải dời GẤP ĐÔI mới đẩy
 * khe đi đủ, vì khe là trung điểm.
 */
function xepDai(p0, chum, viTriKhe, kheTu, lMuon) {
  const rang = chum;
  let lo = -Infinity, hi = Infinity;
  for (const c of rang) {
    const k = kheTu(p0, c.unionId);
    lo = Math.max(lo, c.lo - k);
    hi = Math.min(hi, c.hi - k);
  }
  if (lo <= hi) {
    const l = Math.min(hi, Math.max(lo, lMuon));
    return p0.map((v) => v + l);
  }

  let p = p0.map((v) => v + rang[0].hi - kheTu(p0, rang[0].unionId));
  const trong = (q, c) => { const k = kheTu(q, c.unionId); return k >= c.lo - 0.01 && k <= c.hi + 0.01; };
  rang.forEach((c, i) => {
    const k = kheTu(p, c.unionId);
    if (k >= c.lo) return;
    const v = viTriKhe.get(c.unionId);
    const cach = v.khe !== undefined
      ? [[v.khe + 1, 2 * (c.lo - k)], [v.khe, c.lo - k]]
      : [[v.o, c.lo - k]];
    for (const [t, buoc] of cach) {
      const q = p.map((x, j) => (j >= t ? x + buoc : x));
      if (rang.slice(0, i).every((c2) => trong(q, c2))) { p = q; break; }
    }
  });
  return p;
}

/** Dải của một người: neo là chính họ, hoặc người đã hấp thụ họ. */
function neoDai(ct, id) {
  const ht = ct.hapThuBoi.get(id);
  return ht ? ht.neoId : id;
}

/** Tâm ô của `id` trong khối `k`, hoặc `undefined`. */
function tamTrong(k, id) {
  for (const it of k.items) if (it.id === id) return it.x + it.w / 2;
  return undefined;
}

/**
 * Điểm thả của union `uid` khi các ô đã đứng trong khối `k` — cùng công thức
 * `dungDiemTreo()`: cặp kề nhau thì khe của dải, không thì trung điểm.
 */
function noiCua(ct, k, uid) {
  const u = ct.unionHT.get(uid);
  for (const p of u.partners) {
    const ht = ct.hapThuBoi.get(p);
    if (!ht || ht.unionId !== uid) continue;
    const dai = ct.dai.get(ht.neoId);
    const x = tamTrong(k, ht.neoId);
    if (dai && x !== undefined) return x - rongId(ct, ht.neoId) / 2 - dai.dxP + dai.khe.get(uid);
  }
  const xs = u.partners.map((p) => tamTrong(k, p)).filter((x) => x !== undefined);
  return xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : undefined;
}

/**
 * KHỐI TỔ TIÊN của `X`: hàng cha mẹ X, cùng hai khối tổ tiên của cha và của
 * mẹ treo lên trên (đệ quy). `noi` = điểm thả xuống X. `null` nếu X không có
 * cha mẹ hiển thị, hoặc cha mẹ đã đứng chỗ khác (hai nhánh cưới nhau — nét
 * dài, y như `khoiDuoi()` trả `null`).
 */
function khoiTren(ct, X) {
  const uid = ct.unionSoHuu.get(X);
  if (!uid) return null;
  const u = ct.unionHT.get(uid);

  const dsNeo = [];
  for (const p of u.partners) {
    const n = neoDai(ct, p);
    if (!dsNeo.includes(n)) dsNeo.push(n);
  }
  if (dsNeo.some((n) => ct.daDat.has(n))) return null;

  // Nam trái, nữ phải (§2) khi hai người không chung dải.
  dsNeo.sort((a, b) => (gioiTinh(ct, a) === 'M' ? 0 : 1) - (gioiTinh(ct, b) === 'M' ? 0 : 1));
  const dsDai = dsNeo.map((n) => {
    ct.daDat.add(n);
    const dai = layDai(ct, n);
    const k = khoiRong();
    for (const [id, dx] of dai.dx) { ct.daDat.add(id); themO(ct, k, id, dx); }
    k.neoW = rongId(ct, n);
    k.neoX = dai.dxP + k.neoW / 2;
    return k;
  });
  const hang = xepKhit(dsDai, KHE);
  hang.noi = noiCua(ct, hang, uid);

  const xs = hang.items.map((it) => it.x + it.w / 2);
  hang.mepTrai = Math.min(...xs);
  hang.mepPhai = Math.max(...xs);

  const doiTac = u.partners.filter((p) => tamTrong(hang, p) !== undefined)
    .sort((a, b) => tamTrong(hang, a) - tamTrong(hang, b));
  return treoToTien(ct, hang, doiTac, hang.noi);
}

/**
 * Treo khối tổ tiên của từng người trong `doiTac` (trái → phải) lên trên khối
 * `k`, căn vào điểm nối `noi` của `k`.
 *
 *   · Đủ hai bên: xếp khít, TRUNG ĐIỂM hai điểm nối rơi đúng `noi` (b86b —
 *     đo trên ảnh QFT `so do 3 khoi.png`, lệch nửa pixel).
 *   · Chỉ một bên: điểm nối của hàng cha mẹ đứng thẳng trên đầu con.
 *
 * Hai khối tổ tiên thường không chung hàng nào với `k`; lỡ chung (dữ liệu có
 * hôn nhân trong họ) thì đẩy ra hai bên cho tới khi hết chồng.
 */
function treoToTien(ct, k, doiTac, noi) {
  const co = [];
  for (const p of doiTac) {
    const t = khoiTren(ct, p);
    if (t) co.push({ p, t, j: doiTac.indexOf(p) });
  }
  if (co.length === 0) return k;

  if (co.length === 1) {
    // Điểm thả của cha mẹ đứng THẲNG trên đầu con — không gãy chữ Z
    // (chủ dự án bác lối căn mép b85e, 25/09/2026).
    const { p, t } = co[0];
    dich(t, tamTrong(k, p) - t.noi);
  } else {
    const acc = khoiRong();
    for (const o of co) {
      if (acc.items.length) {
        let d = canhPhai(acc.vien, o.t.vien, KHE);
        if (!Number.isFinite(d)) d = mepCua(acc, true) + KHE - mepCua(o.t, false);
        dich(o.t, d);
      }
      gop(acc, o.t);
    }
    const giua = (co[0].t.noi + co[co.length - 1].t.noi) / 2;
    for (const o of co) dich(o.t, noi - giua);
  }

  // Né khối dưới nếu lỡ chung hàng: bên trái dời trái, bên phải dời phải.
  let dTrai = 0, dPhai = 0;
  for (const o of co) {
    const benTrai = o.t.noi < noi || (co.length === 1 && o.j === 0 && doiTac.length > 1);
    if (benTrai) dTrai = Math.max(dTrai, canhPhai(o.t.vien, k.vien, KHE));
    else         dPhai = Math.max(dPhai, canhPhai(k.vien, o.t.vien, KHE));
  }
  for (const o of co) {
    const benTrai = o.t.noi < noi || (co.length === 1 && o.j === 0 && doiTac.length > 1);
    dich(o.t, benTrai ? -dTrai : dPhai);
    gop(k, o.t);
  }
  return k;
}

function datBaKhoi(ct) {
  const viTri = new Map();
  const ghi = (k) => { for (const it of k.items) viTri.set(it.id, it.x); };

  // --- Lõi: khối 3 và hai khối tổ tiên ------------------------------------
  const tam = ct.tamId && ct.dsNguoi.includes(ct.tamId) ? ct.tamId : ct.dsNguoi[0];
  const neoTam = neoDai(ct, tam);
  const pu = ct.roiChoCha.has(neoTam) ? null : ct.unionSoHuu.get(neoTam);

  let loi = null, doiTac = [], noi;
  if (pu) {
    const n = neoDai(ct, ct.unionHT.get(pu).partners[0]);
    loi = khoiDuoi(ct, n);
    if (loi) {
      doiTac = ct.unionHT.get(pu).partners.filter((p) => tamTrong(loi, p) !== undefined);
      noi = noiCua(ct, loi, pu);
    }
  }
  if (!loi) {
    loi = khoiDuoi(ct, neoTam);
    if (loi) {
      doiTac = [...layDai(ct, neoTam).dx.keys()];
      const xs = doiTac.map((p) => tamTrong(loi, p));
      noi = (Math.min(...xs) + Math.max(...xs)) / 2;
    }
  }
  if (loi) {
    doiTac.sort((a, b) => tamTrong(loi, a) - tamTrong(loi, b));
    ghi(treoToTien(ct, loi, doiTac, noi));
  }

  // --- Lưới an toàn: ai chưa đứng (cha mẹ nuôi, nhánh cưới nhau…) ----------
  // Leo lên tổ tiên CHƯA ĐẶT cao nhất, dựng khối con cháu của người ấy, rồi
  // đặt vào chỗ trống gần người nó nối tới nhất. Thà lệch chỗ còn hơn mất ô.
  for (const id of ct.dsNguoi) {
    if (ct.daDat.has(id)) continue;
    let goc = neoDai(ct, id);
    const daLeo = new Set([goc]);
    for (;;) {
      const uid = ct.unionSoHuu.get(goc);
      if (!uid || ct.roiChoCha.has(goc)) break;
      const len = neoDai(ct, ct.unionHT.get(uid).partners[0]);
      if (ct.daDat.has(len) || daLeo.has(len)) break;
      daLeo.add(len);
      goc = len;
    }
    const k = khoiDuoi(ct, goc);
    if (!k) { ct.daDat.add(id); continue; }
    const x0 = mocLuoi(ct, viTri, k, goc);
    ghi(datGanNhat(ct, viTri, k, x0));
  }
  for (const id of ct.dsNguoi) if (!viTri.has(id)) viTri.set(id, 0);

  canChumConVaoGiua(ct, viTri);

  let min = Infinity;
  for (const x of viTri.values()) if (x < min) min = x;
  if (Number.isFinite(min) && min !== 0) for (const [id, x] of viTri) viTri.set(id, x - min);
  return viTri;
}

/**
 * Khối lưới an toàn muốn đứng đâu (độ dời muốn có): dưới điểm thả của cha mẹ
 * nếu cha mẹ đã đứng; không thì trên đầu người con đứng ngoài khối (cha mẹ
 * nuôi); không thì cạnh bạn đời. Không nối với ai → sau mép phải sơ đồ.
 */
function mocLuoi(ct, viTri, k, goc) {
  const trong = new Set(k.items.map((it) => it.id));
  const uid = ct.unionSoHuu.get(goc);
  if (uid) {
    const xs = ct.unionHT.get(uid).partners.map((p) => viTri.get(p)).filter((x) => x !== undefined);
    if (xs.length) return (Math.min(...xs) + Math.max(...xs)) / 2 + rongId(ct, ct.unionHT.get(uid).partners[0]) / 2 - k.neoX;
  }
  for (const it of k.items) {
    for (const u2 of ct.unionLamVo.get(it.id) || []) {
      const u = ct.unionHT.get(u2);
      for (const c of u.children) {
        if (!trong.has(c.personId) && viTri.has(c.personId)) return viTri.get(c.personId) - it.x;
      }
      for (const p of u.partners) {
        if (!trong.has(p) && viTri.has(p)) return viTri.get(p) - it.x;
      }
    }
  }
  let phai = -Infinity;
  for (const [id, x] of viTri) phai = Math.max(phai, x + rongId(ct, id));
  return Number.isFinite(phai) ? phai + LAYOUT.blockGap - mepCua(k, false) : 0;
}

/** Dời khối tới chỗ KHÔNG ĐÈ Ô nào gần `x0` nhất, quét dần ra hai bên. */
function datGanNhat(ct, viTri, k, x0) {
  for (let b = 0; b <= 20000; b += 4) {
    for (const d of (b === 0 ? [x0] : [x0 + b, x0 - b])) {
      if (!deChoNay(ct, viTri, k, d)) { dich(k, d); return k; }
    }
  }
  let phai = -Infinity;
  for (const [id, x] of viTri) phai = Math.max(phai, x + rongId(ct, id));
  dich(k, phai + LAYOUT.blockGap - mepCua(k, false));
  return k;
}

// ============================================================
// 5 · ĐIỂM TREO CHÙM CON — mỗi union một điểm, không gộp chùm
// ============================================================

/**
 * QUY-TAC-VE §5: `n` union thì `n` chùm con, không gộp. Gộp là mất thông tin
 * mẹ — các ô con giống hệt nhau, không ai đọc được con bà nào.
 *
 * Ba kiểu điểm treo:
 *   'khe'  — cặp đứng kề nhau: tâm khe hở giữa hai ô
 *   'don'  — hôn nhân một người: tâm ô người duy nhất
 *   'cheo' — hai người đứng RỜI NHAU: TRUNG ĐIỂM nét nối, và chùm con thả
 *            xuống từ hàng của người SÂU HƠN
 *
 * ⚠ Tên `'cheo'` có từ chat 1.3, khi hai người đứng rời nhau thì bao giờ cũng
 * lệch hàng nên nét nối bao giờ cũng chéo. Từ chat 1.7 KHÔNG còn đúng: hai
 * nhánh khác dòng họ nay được căn về cùng hàng, nên nét nối của họ là nét
 * NGANG dài đi vòng dưới hai ô, dù kiểu điểm treo vẫn mang tên `'cheo'`.
 * Công thức không đổi (trung điểm vẫn là trung điểm, hàng sâu hơn vẫn là hàng
 * sâu hơn — nay hai hàng bằng nhau), chỉ cái tên là hẹp hơn sự thật.
 */
/**
 * Union này có người phối ngẫu bị ẩn không?
 *
 * ⚠ Đọc từ dữ liệu GỐC chứ không đọc `unionHT` — `unionHT` đã lọc mất đúng
 * những người đang bị ẩn, hỏi nó thì bao giờ cũng nghe "đủ cả".
 */
function soBanDoiAn(ct, unionId) {
  const uGoc = ct.index.unionById.get(unionId);
  const ds = (uGoc && Array.isArray(uGoc.partners)) ? uGoc.partners : [];
  return ds.filter((pid) => pid && ct.index.personById.has(pid) && !ct.visibleSet.has(pid)).length;
}
function thieuBanDoiCua(ct, unionId) { return soBanDoiAn(ct, unionId) > 0; }

/** Có đoạn kẻ NGANG nào chạm nốt tròn tâm (x, y) không — chừa thêm 2px. */
function netNgangCat(ct, x, y) {
  const r = LAYOUT.stubRadius + 2;
  for (const l of ct.links || []) {
    const p = l.points || [];
    for (let i = 1; i < p.length; i++) {
      const [x0, y0] = p[i - 1], [x2, y2] = p[i];
      if (Math.abs(y0 - y2) > 0.5 || Math.abs(y0 - y) > r) continue;
      if (x >= Math.min(x0, x2) - r && x <= Math.max(x0, x2) + r) return true;
    }
  }
  return false;
}

/** Số con của union đang bị ẩn. Đọc dữ liệu GỐC, như trên. */
function soConAn(ct, unionId) {
  const uGoc = ct.index.unionById.get(unionId);
  const ds = (uGoc && Array.isArray(uGoc.children)) ? uGoc.children : [];
  return ds.filter((c) => c && c.personId && ct.index.personById.has(c.personId) &&
                          !ct.visibleSet.has(c.personId)).length;
}
function conAnCua(ct, unionId) { return soConAn(ct, unionId) > 0; }

/**
 * NHỮNG UNION SẼ MỌC NỐT CỤT "CẶP ĐỦ, THIẾU CON" — trả `Map<unionId, hướng>`.
 *
 * ⚠ **Vì sao `xepMucThanhNgang()` phải biết trước.** Nốt cụt ấy nối tiếp thanh
 * ngang gom con và chạy thêm ra ngoài ô con ngoài cùng (b83), tức nó KÉO DÀI
 * thanh ngang thêm `RONG/2 + hGap` px về phía ấy. Không đếm phần kéo dài thì
 * phép xếp mức tưởng hai thanh không đè nhau, mà trên hình thì có: bài kiểm
 * `kiem-buoc-80.mjs` nhóm 10 bắt được đúng ca này (P0631, U0072 ∩ U0180 chồng
 * 40px) trong khi phép đo chỉ nhìn đường nối nói 0 cặp.
 *
 * Điều kiện phải KHỚP `viTriNotCut()`, nếu không hai nơi tính hai hình khác
 * nhau — xem nếp 68 của b83.
 */
function unionCoNotNeXuong(ct, stubPoints) {
  const ra = new Map();
  if (!Array.isArray(stubPoints)) return ra;

  for (const sp of stubPoints) {
    if (!sp || sp.direction === 'up') continue;
    const u = ct.unionHT.get(sp.unionId);
    if (!u || !conAnCua(ct, sp.unionId)) continue;
    if (!u.children.some((c) => ct.nodeById.has(c.personId))) continue;
    const dai = ct.dai.get(sp.personId);
    ra.set(sp.unionId, dai ? dai.huong : 1);
  }
  return ra;
}

/**
 * BỀ NGANG THANH NGANG GOM CON của một union — trả `null` nếu union ấy không
 * vẽ đoạn ngang nào (con duy nhất nằm đúng dưới điểm treo, hoặc chưa con nào
 * hiển thị).
 *
 * ⚠ Bỏ qua con của BỘ CHA MẸ THỨ HAI (`netDai`): đoạn ngang của họ chạy cao
 * hơn `lechNetDai` pixel, tức đã ở một mức khác rồi.
 */
/**
 * ĐOẠN NGANG CỦA NỐT CỤT "cặp đủ, thiếu con" — nó nối tiếp thanh ngang gom con
 * nên phải tính chung với thanh ngang ở mọi phép đo.
 *
 * ⚠ **Một chỗ tính, hai chỗ dùng.** `viTriNotCut()` dùng để VẼ, còn
 * `nhipThanhNgang()` dùng để XẾP MỨC. Trước b85 hai chỗ tự tính riêng, và khi
 * luật đặt nốt đổi thì phép xếp mức vẫn đo theo luật cũ — hai thanh ngang lại
 * đè nhau, đúng cái lỗi bước 84 vừa dẹp xong.
 *
 * @returns {{goc:number, x:number}|null}  `goc` = chỗ rẽ ra khỏi thanh ngang,
 *          `x` = toạ độ ngang của nốt. `null` khi cặp chưa vẽ được con nào.
 */
function nhipNotCut(ct, u, xTreo, huong) {
  let lo = xTreo, hi = xTreo, coCon = false, wCon = RONG;
  for (const c of u.children) {
    const con = ct.nodeById.get(c.personId);
    if (!con) continue;
    coCon = true;
    wCon = con.w;
    const cx = con.x + con.w / 2;
    if (cx < lo) lo = cx;
    if (cx > hi) hi = cx;
  }
  if (!coCon) return null;

  let ra, goc;
  if (xTreo >= hi - 0.5)      { ra =  1; goc = hi; }
  else if (xTreo <= lo + 0.5) { ra = -1; goc = lo; }
  else                        { ra = huong; goc = huong > 0 ? hi : lo; }

  return { goc, x: goc + ra * (wCon / 2 + KHE) };
}

function nhipThanhNgang(ct, t, neXuong) {
  const u = ct.unionHT.get(t.id);
  if (!u) return null;

  let a = t.x, b = t.x, co = false;
  for (const c of u.children) {
    const con = ct.nodeById.get(c.personId);
    if (!con) continue;
    if (ct.unionSoHuu.get(c.personId) !== t.id) continue;   // netDai → mức khác
    const cx = con.x + con.w / 2;
    if (Math.abs(t.x - cx) <= 0.5) continue;                // nét thả thẳng
    a = Math.min(a, cx);
    b = Math.max(b, cx);
    co = true;
  }

  // Nốt cụt "cặp đủ, thiếu con" kéo thanh ngang chạy thêm ra ngoài — xem
  // `unionCoNotNeXuong()`. Đo bằng ĐÚNG hàm mà `viTriNotCut()` dùng để vẽ.
  if (neXuong && neXuong.has(t.id)) {
    const nhip = nhipNotCut(ct, u, t.x, neXuong.get(t.id));
    if (nhip) {
      a = Math.min(a, nhip.goc, nhip.x);
      b = Math.max(b, nhip.goc, nhip.x);
      co = true;
    }
  }

  return co ? { a, b } : null;
}

/**
 * XẾP MỨC CHO THANH NGANG GOM CON — bước 84, chỉ đụng union nào THẬT SỰ đè
 * nhau. Sửa `busY` tại chỗ.
 *
 * ⚠ **Lỗi được sửa.** Hai union của cùng một người có hai chùm con xếp cạnh
 * nhau, nhưng cái DẢI (ông cùng các bà) lại được căn vào GIỮA cả hai chùm —
 * nên hai điểm treo nằm sát nhau ở giữa, còn hai chùm con toả ra hai bên. Hai
 * thanh ngang vì thế **bắc chéo qua nhau**, và vì cùng một mức nên chúng chồng
 * lên nhau thành MỘT nét liền: đo được **770 cặp** trên cây Nguyễn Phúc 681
 * người, chỗ trùm dài nhất **608px** (NK-B83 mục 2.3). Người xem đọc ra một
 * chùm con chung, tức mất đúng thông tin mẹ mà QUY-TAC-VE §5 sinh ra để giữ.
 *
 * ⚠ **Xếp theo BỀ NGANG THẬT, không theo "người này có mấy vợ".** Bản đầu của
 * bước 84 phát mức theo thứ tự các bà trong dải, và nó **sót một ca**: bà
 * P0313 vừa là vợ trong dải của ông P0311 (U0072) vừa có cuộc hôn nhân riêng
 * U0180 nằm NGOÀI dải ấy — hai union không chung một dải nên không ai phát mức
 * cho chúng, mà thanh ngang thì vẫn trùm nhau 228px. Hỏi thẳng *"hai đoạn này
 * có đè nhau không"* thì mọi ca đều lọt, kể cả ca chưa ai nghĩ ra.
 *
 * ⚠ **Union không đè ai thì KHÔNG bị hạ.** Người một vợ — 99% số ca — giữ
 * nguyên từng pixel như trước bước 84. Hạ cả những union đang đứng yên chỗ tốt
 * là bắt cả sơ đồ trả giá cho một ca hiếm.
 *
 * Cách xếp là tô màu đồ thị khoảng: sắp theo mép trái rồi lấy mức thấp nhất
 * còn trống. Với đồ thị khoảng, cách tham lam này cho SỐ MỨC ÍT NHẤT có thể.
 *
 * ⚠ Bước tự CO khi một hàng cần từ ba mức — xem ghi chú `buocThanhNgang` ở
 * `config.js`. Đó là van an toàn, không phải thiết kế: ba đường cách nhau 4px
 * là *"bóng đôi"* chủ dự án đã bác ở b80. Ca ấy chưa từng xảy ra trên dữ liệu
 * thật.
 */
function xepMucThanhNgang(ct, unions, neXuong) {
  // Trần: mép TRÊN của nốt cụt hướng lên mọc từ hàng dưới, trừ 2px hở.
  // Chế độ chữ không có nốt cụt, nhưng có VÒNG CUNG vợ chồng đội trên đầu ô.
  const tran = KHONG_ANH ? KHE_DOC - CUNG.cao - 3
    : KHE_DOC - LAYOUT.stubLength - LAYOUT.stubRadius - 2;

  const theoHang = new Map();              // busY gốc -> các thanh ngang cùng mức
  for (const t of unions) {
    const nhip = nhipThanhNgang(ct, t, neXuong);
    if (!nhip) continue;
    const khoa = Math.round(t.busY);
    if (!theoHang.has(khoa)) theoHang.set(khoa, []);
    theoHang.get(khoa).push({ t, a: nhip.a, b: nhip.b, muc: 0 });
  }

  for (const [, ds] of theoHang) {
    ds.sort((p, q) => (p.a - q.a) || (p.t.id < q.t.id ? -1 : 1));

    const daXep = [];                      // mức -> các thanh đã nhận mức ấy
    let caoNhat = 0;
    for (const it of ds) {
      let m = 0;
      while (daXep[m] && daXep[m].some(
        (k) => Math.min(it.b, k.b) - Math.max(it.a, k.a) > 0.5)) m += 1;
      if (!daXep[m]) daXep[m] = [];
      daXep[m].push(it);
      it.muc = m;
      if (m > caoNhat) caoNhat = m;
    }
    if (caoNhat === 0) continue;

    const buoc = Math.min(LAYOUT.buocThanhNgang,
                          (tran - LAYOUT.khoangSatChu) / caoNhat);
    for (const it of ds) it.t.busY += it.muc * buoc;
  }
}

function dungDiemTreo(ct, stubPoints) {
  const neoTheoUnion = new Map();          // unionId -> neoId, dựng một lần
  for (const [, ht] of ct.hapThuBoi) neoTheoUnion.set(ht.unionId, ht.neoId);

  const ra = [];
  for (const uid of [...ct.unionHT.keys()].sort()) {
    const u = ct.unionHT.get(uid);
    let neoId = neoTheoUnion.get(uid) || null;

    let x, y, busY, kieu;
    if (neoId && ct.dai.has(neoId)) {
      const dai = ct.dai.get(neoId);
      const nut = ct.nodeById.get(neoId);
      x    = nut.x - dai.dxP + dai.khe.get(uid);
      // Chế độ chữ: thả từ TRONG ô cha (nền ô che đoạn đầu) — không có nét
      // vợ chồng ngang giữa ô nào để treo vào nữa.
      y    = CUNG ? nut.y + 1 : nut.y + netNut(nut) - (dai.mucNet.get(uid) || 0) * dai.buocNet;
      busY = nut.y + nut.h + LAYOUT.khoangSatChu;
      kieu = dai.n > 0 ? 'khe' : 'don';
    } else if (u.partners.length === 1) {
      const nut = ct.nodeById.get(u.partners[0]);
      x    = nut.x + nut.w / 2;
      y    = CUNG ? nut.y + 1 : nut.y + netNut(nut);
      busY = nut.y + nut.h + LAYOUT.khoangSatChu;
      kieu = 'don';
      neoId = u.partners[0];
    } else {
      const a = ct.nodeById.get(u.partners[0]);
      const b = ct.nodeById.get(u.partners[1]);
      x    = (a.x + b.x) / 2 + a.w / 2;
      // Hai người RỜI NHAU mà CÙNG HÀNG thì nét vợ chồng không đi tâm → tâm,
      // nó VÕNG xuống dưới hai ô (xem themNetVoChong). Điểm treo chùm con phải
      // nằm đúng trên cái võng ấy, chứ không phải ở tâm hàng: tại trung điểm
      // giữa hai ô không có ô nào che, nên đoạn kẻ từ tâm hàng xuống sẽ thò
      // hẳn ra ngoài và treo lơ lửng phía trên nét vợ chồng.
      y    = a.y === b.y ? mucVong(a, b) : (a.y + b.y) / 2 + netNut(a);
      busY = Math.max(a.y + a.h, b.y + b.h) + LAYOUT.khoangSatChu;
      kieu = 'cheo';
      neoId = u.partners[0];
    }

    ra.push({ id: uid, x, y, busY, kieu, neoId, partnerIds: u.partners.slice() });
  }

  // Mọi `busY` mới xong ở MỨC GỐC; giờ mới hạ những thanh đang đè nhau.
  xepMucThanhNgang(ct, ra, unionCoNotNeXuong(ct, stubPoints));
  return ra;
}

// ============================================================
// 6 · ĐƯỜNG NỐI
// ============================================================

function dungDuongNoi(ct, unions) {
  const links = [];
  const treoCua = new Map(unions.map((t) => [t.id, t]));

  for (const uid of [...ct.unionHT.keys()].sort()) {
    const u   = ct.unionHT.get(uid);
    const treo = treoCua.get(uid);

    // --- Nét vợ chồng ------------------------------------------------------
    for (let i = 1; i < u.partners.length; i++) {
      themNetVoChong(ct, links, uid, u.partners[0], u.partners[i]);
    }

    // --- Nét cha mẹ – con --------------------------------------------------
    for (const c of u.children) {
      const con = ct.nodeById.get(c.personId);
      if (!con) continue;

      // Bộ cha mẹ THỨ HAI (con nuôi còn cha mẹ đẻ) phải né đường của bộ đặt
      // chỗ, nếu không hai nét chồng khít lên nhau ở đoạn cuối và người xem chỉ
      // thấy MỘT đường. Né hai chiều, đúng như chủ dự án chỉ ra khi xem ảnh:
      //   - đoạn DỌC lệch sang bên, về phía bộ cha mẹ ấy đang đứng;
      //   - đoạn NGANG chạy cao hơn, ở một phần tư khe thay vì giữa khe.
      // Vào ô ở 1/4 hay 3/4 bề ngang chứ không vào chính giữa: chỗ ấy vẫn nằm
      // trên nóc ô nên nét không hụt ra ngoài, mà mắt nhìn ra ngay là hai
      // đường khác nhau.
      const netDai = ct.unionSoHuu.get(c.personId) !== uid;
      const cxGiua = con.x + con.w / 2;
      const cx   = netDai ? (treo.x > cxGiua ? con.x + con.w * 0.75 : con.x + con.w * 0.25)
                          : cxGiua;
      const busY = netDai
        ? Math.min(treo.busY - LAYOUT.lechNetDai, con.y - 1)
        : Math.min(treo.busY, con.y - 1);

      const points = [[treo.x, treo.y]];
      if (Math.abs(treo.x - cx) > 0.5) { points.push([treo.x, busY]); points.push([cx, busY]); }
      points.push([cx, con.y + chamVongAnh(cx - cxGiua)]);

      links.push({
        kind: 'child',
        relation: c.relation,
        unionId: uid,
        from: uid,
        to: c.personId,
        points,
        netDai,                                          // bộ cha mẹ thứ hai
        cheo: false,
      });
    }
  }

  return links;
}

/**
 * NÉT ĐI TỪ TRÊN XUỐNG CHẠM VÀO ĐÂU — thêm ở bước 80, việc A.
 *
 * Trả về khoảng cách từ NÓC Ô xuống chỗ nét chạm vào VÒNG ẢNH, khi nét vào ô
 * lệch tâm `dx` pixel.
 *
 * ⚠ **Đây là lỗi việc A, và nó không tự khỏi khi vòng ảnh to lên.** §10b bảo
 * nét của bộ cha mẹ thứ hai vào ô ở 1/4 hay 3/4 bề ngang, kèm lý do: *"chỗ ấy
 * vẫn nằm trên nóc ô nên nét không hụt ra ngoài"*. Câu ấy đúng cho tới bước 28
 * — rồi bước 28 **bỏ viền ô**, và từ đó "nóc ô" chỉ còn là một toạ độ, không
 * còn là một đường kẻ ai nhìn thấy. Thứ mắt thấy ở đầu ô nay là VÒNG ẢNH, mà
 * vòng ảnh là hình TRÒN: ở chỗ lệch tâm 30px nó thấp hơn nóc ô hẳn 18px.
 *
 *     lệch  0px  →  chạm ngay nóc ô          (nét treo con thường, không đổi)
 *     lệch 30px, R = 34  →  34 − √(34²−30²) = 34 − 16 = 18px dưới nóc ô
 *     lệch 30px, R = 26  →  30 > 26, không có vòng ảnh nào ở đó cả
 *
 * Dòng cuối là bản trước bước 80: nét kết thúc giữa khoảng không, cách vòng
 * ảnh một quãng — đúng chỗ hở chủ dự án chỉ ra ở ca Nguyễn Thị Hương Lan
 * (`P0020`, union cha mẹ nuôi `U0025`). Vòng ảnh to lên **thu hẹp** chỗ hở từ
 * "hụt hẳn" xuống 18px, nên nhìn qua tưởng đã khỏi — đo mới thấy còn.
 *
 * Lệch quá bán kính thì kẹp về mép vòng: thà chạm ngang hông vòng ảnh còn hơn
 * treo lơ lửng. Nay không xảy ra (30 < 34) nhưng hạ `banKinhTrenO` là xảy ra
 * ngay, và lúc ấy không có gì báo.
 */
function chamVongAnh(dx) {
  if (KHONG_ANH) return 0;                 // ô chữ: nét chạm thẳng nóc ô
  const R = PHOTO.banKinhTrenO;
  const d = Math.min(Math.abs(dx), R);
  return PHOTO.leTrenO + R - Math.sqrt(R * R - d * d);
}

/**
 * Hai ca khác hẳn nhau:
 *
 * KỀ NHAU — bạn đời được hấp thụ vào dải: nét ngang ở đúng mức nấc của union
 * đó, chạy từ mép ô này sang mép ô kia. Với bà thứ hai trở đi nét CHUI SAU ô
 * bà trước; luật vẽ hai lượt (QUY-TAC-VE §7 — hết đường nối rồi mới đến ô,
 * nền ô đặc) lo phần che.
 *
 * RỜI NHAU — hai nhánh trong họ cưới nhau, mỗi người đứng dưới cha mẹ mình:
 *   - khác đời  → nét CHÉO tâm → tâm, tự chạy ra ngoài dải khung
 *   - cùng đời  → nét tâm → tâm sẽ trông y hệt nét nấc của người nhiều vợ,
 *                 nên cho VÕNG xuống dưới dải khung rồi vòng lên. Luật đọc
 *                 bằng mắt: nét trong dải = cặp kề nhau, nét ngoài dải = kết
 *                 hôn trong họ.
 *
 * Nét chéo có thể rất dài và KHÔNG rút ngắn được: thứ tự anh em đã bị `order`
 * khoá, thứ tự các nhánh đã bị `ranks` khoá. Chấp nhận nét dài.
 */
function themNetVoChong(ct, links, uid, aId, bId) {
  const a = ct.nodeById.get(aId);
  const b = ct.nodeById.get(bId);
  if (!a || !b) return;

  const htA = ct.hapThuBoi.get(aId);
  const htB = ct.hapThuBoi.get(bId);
  const keNhau = (htA && htA.unionId === uid) || (htB && htB.unionId === uid);

  if (keNhau) {
    const neoId = htA && htA.unionId === uid ? htA.neoId : htB.neoId;
    const dai   = ct.dai.get(neoId);
    const neo   = ct.nodeById.get(neoId);
    const kia   = neoId === aId ? b : a;
    if (CUNG) {
      // VÒNG CUNG trên đầu hai ô (chủ dự án 30/09/2026). Chân cung ở 3/4 ô
      // phía trong, không ở tâm: tâm nóc ô là chỗ nét từ cha mẹ cắm xuống.
      // Vợ thứ k cung cao hơn, các cung lồng nhau thay vì cắt nhau.
      const muc = dai.mucNet.get(uid) || 0;
      const x1 = neo.x + neo.w * (dai.huong > 0 ? 0.75 : 0.25);
      const x2 = kia.x + kia.w * (dai.huong > 0 ? 0.25 : 0.75);
      links.push({ kind: 'spouse', relation: null, unionId: uid, from: neoId, to: kia.id,
                   points: [[x1, neo.y], [x2, kia.y]], netDai: false, cheo: false,
                   cung: Math.min(CUNG.tran, CUNG.cao + muc * CUNG.buoc) });
      return;
    }
    const y     = neo.y + netNut(neo) - (dai.mucNet.get(uid) || 0) * dai.buocNet;
    // Nét chạy từ MÉP VÒNG ẢNH sang mép vòng ảnh, không từ mép ô sang mép ô.
    //
    // ⚠ Trước bước 28 hai thứ ấy là một, vì mép ô có viền và đó là chỗ mắt
    // nhìn thấy ô kết thúc. Bỏ viền rồi thì mép ô nằm cách khuôn mặt 40px về
    // mỗi bên, và nét vợ chồng thành một đoạn 16px trôi lơ lửng ở khoảng giữa,
    // không chạm vào ai. Ảnh chụp phóng to bắt được; ở cỡ thật thì nó chỉ
    // trông như sơ đồ hơi rời rạc.
    const x1    = dai.huong > 0 ? neo.x + neo.w - leAnh(neo) : neo.x + leAnh(neo);
    const x2    = dai.huong > 0 ? kia.x + leAnh(kia)     : kia.x + kia.w - leAnh(kia);
    links.push({ kind: 'spouse', relation: null, unionId: uid, from: neoId, to: kia.id,
                 points: [[x1, y], [x2, y]], netDai: false, cheo: false });
    return;
  }

  const ax = a.x + a.w / 2, ay = a.y + netNut(a);
  const bx = b.x + b.w / 2, by = b.y + netNut(b);

  if (a.gen !== b.gen) {
    links.push({ kind: 'spouse', relation: null, unionId: uid, from: aId, to: bId,
                 points: [[ax, ay], [bx, by]], netDai: true, cheo: true });
    return;
  }

  const vong = mucVong(a, b);
  links.push({ kind: 'spouse', relation: null, unionId: uid, from: aId, to: bId,
               points: [[ax, ay], [ax, vong], [bx, vong], [bx, by]], netDai: true, cheo: false });
}

/**
 * Mức nét vợ chồng VÕNG xuống, khi hai người cùng hàng mà đứng rời nhau.
 *
 * Một công thức, HAI nơi dùng: `themNetVoChong()` vẽ nét, `dungDiemTreo()` đặt
 * điểm treo chùm con lên đúng nét đó. Tách ra làm hằng số dùng chung vì hai
 * chỗ ấy lệch nhau đúng một lần là sinh ra đoạn kẻ treo lơ lửng giữa sơ đồ —
 * lỗi thật của chat 1.7, chủ dự án nhìn ảnh mới thấy.
 *
 * ⚠ **BA con số trong hai ngày, và cả ba đều do chủ dự án nhìn app thật.**
 *
 *     tới b80   `CAO + vGap × 0,3` = CAO + 10,2, còn thanh ngang ở CAO + 17
 *               → HAI đường kẻ song song cách nhau 7px, chủ dự án gọi là
 *                 bóng đôi (ảnh `loi ke ngang trong dung - huong lan…jpg`)
 *     b80       gộp làm một: `CAO + khoangSatChu`
 *               → **hỏng kiểu khác**: nét vợ chồng biến mất vào đúng thanh
 *                 ngang gom con, cặp đọc ra thành hai nét dọc rời rạc.
 *                 *"thiếu nét kẻ từ Trọng Dũng sang Hương Lan"*
 *     b81       mức RIÊNG `CAO + khoangNetVong` = CAO + 5
 *               → nằm lọt giữa hàng chữ (CAO − 1,6) và thanh ngang (CAO + 12)
 *
 * ⚠ Bài học đứng sau ba con số ấy: **gộp hai đường kẻ vì chúng "gần nhau quá"
 * là chữa triệu chứng.** Hai đường ấy mang hai nghĩa khác nhau — một là *"hai
 * người này là vợ chồng"*, một là *"đây là các con của họ"* — nên chúng phải ở
 * hai mức, chỉ là mức phải chọn cho đúng. Cái sai ban đầu không phải khoảng
 * cách, mà là **cả hai đều quá xa hàng chữ** vì `nodeHeight` thừa chỗ.
 *
 * ⚠ Từ b81, nét này chỉ còn dùng cho cặp mà **một người đã bị hấp thụ vào dải
 * ở nơi khác** — điển hình là người có hai đời chồng/vợ. Ca *"cả hai đều có
 * cha mẹ hiển thị"* nay không rơi vào đây nữa: Luật B kéo một người về đứng
 * cạnh bạn đời. Xem `dungNguCanh()`.
 */
function mucVong(a, b) {
  return Math.max(a.y + a.h, b.y + b.h) + LAYOUT.khoangNetVong;
}

// ============================================================
// 7 · NỐT CỤT
// ============================================================

/**
 * `findStubPoints()` nói CÁI GÌ bị ẩn; chỗ này nói NÓ NẰM Ở ĐÂU.
 *
 *   'up'   — còn một bộ cha mẹ chưa vẽ  → mọc thẳng lên từ nóc ô
 *   'side' — union bị cắt bớt, hai ca khác nhau:
 *              thiếu hẳn người phối ngẫu → mọc NGANG ra khỏi mép ngoài dải,
 *                ở đúng mức nấc của union đó, nên hai đời vợ bị cắt thì hai
 *                nốt không đè lên nhau (đây là lý do nốt cụt neo vào unionId)
 *              cặp đủ nhưng thiếu con    → mọc XUỐNG, tránh sang bên cạnh
 *                chùm con đang vẽ để khỏi đè lên nét treo con
 *
 * QUY-TAC-VE §8: nhiều nốt cụt rơi đúng một điểm thì GỘP thành một nốt kèm số
 * đếm. Ca thật: người có hai bộ cha mẹ mà cả hai bộ đều còn thiếu người —
 * hai nốt 'up' cùng nằm trên nóc một ô. `nguon` giữ đủ từng mục để render
 * dựng danh sách chọn người trung tâm mới khi bấm vào nốt.
 */
function dungNotCut(ct, unions, stubPoints) {
  if (!Array.isArray(stubPoints) || stubPoints.length === 0) return [];
  const treoCua = new Map(unions.map((t) => [t.id, t]));
  const gop = new Map();

  // Một union 'side' thiếu CẢ vợ/chồng LẪN con → HAI nốt: ngang cho vợ/chồng,
  // xuống cho con, mỗi nốt đếm phần của mình (chủ dự án 25/09/2026).
  const ds = [];
  for (const sp of stubPoints) {
    if (!sp || sp.direction === 'up') { ds.push(sp); continue; }
    const nBd = soBanDoiAn(ct, sp.unionId), nCon = soConAn(ct, sp.unionId);
    if (nBd > 0) ds.push({ ...sp, ep: 'ngang', hiddenCount: nCon > 0 ? nBd : sp.hiddenCount });
    if (nCon > 0) ds.push({ ...sp, ep: 'xuong', hiddenCount: nBd > 0 ? nCon : sp.hiddenCount });
    if (nBd === 0 && nCon === 0) ds.push(sp);
  }

  for (const sp of ds) {
    // Nốt LÊN thừa khi cha hoặc mẹ của bộ ấy đang vẽ đầy đủ: người bị ẩn đã
    // có nốt NGANG cạnh bạn đời (ca bỏ chọn dâu/rể — mọi con đều mọc nốt lên
    // đè thanh ngang, chủ dự án 25/09/2026).
    if (sp && sp.direction === 'up') {
      const u = ct.index.unionById.get(sp.unionId);
      if (u && (u.partners || []).some((p) => ct.visibleSet.get(p) === 'full')) continue;
    }
    const nut = ct.nodeById.get(sp && sp.personId);
    if (!nut) continue;
    const diem = viTriNotCut(ct, treoCua, sp, nut);
    if (!diem) continue;

    const khoa = Math.round(diem.x) + '|' + Math.round(diem.y);
    if (gop.has(khoa)) {
      const cu = gop.get(khoa);
      cu.hiddenCount += sp.hiddenCount || 0;
      cu.nguon.push({ personId: sp.personId, unionId: sp.unionId,
                      direction: sp.direction, hiddenCount: sp.hiddenCount });
      continue;
    }
    gop.set(khoa, {
      personId: sp.personId,
      unionId:  sp.unionId,
      direction: sp.direction,
      hiddenCount: sp.hiddenCount || 0,
      x: diem.x, y: diem.y, x1: diem.x1, y1: diem.y1, angle: diem.angle,
      duong: diem.duong || null,      // đường gấp khúc, chỉ có ở nốt đã né
      nguon: [{ personId: sp.personId, unionId: sp.unionId,
                direction: sp.direction, hiddenCount: sp.hiddenCount }],
    });
  }

  return [...gop.values()];
}

function viTriNotCut(ct, treoCua, sp, nut) {
  const L = LAYOUT.stubLength;

  if (sp.direction === 'up') {
    const x = nut.x + nut.w / 2;
    return { x, y: nut.y - L, x1: x, y1: nut.y, angle: -90 };
  }

  const u    = ct.unionHT.get(sp.unionId);
  const treo = treoCua.get(sp.unionId);
  const dai  = ct.dai.get(sp.personId);

  // `ep` do `dungNotCut()` định: NGANG là chỗ của vợ/chồng, XUỐNG là chỗ của
  // con (P0413 cây 681; TH957 — chủ dự án 25/09/2026).
  const thieuBanDoi = sp.ep ? sp.ep === 'ngang' : thieuBanDoiCua(ct, sp.unionId);

  // `!u` = mọi con đều ẩn nên union không có trong `unionHT`: thả thẳng từ
  // đáy ô người ấy, KHÔNG có nghĩa là thiếu bạn đời.
  // Nét bắt đầu ngay ĐÁY BẢNG TÊN (một dòng), nốt nằm sát đáy ô — cao hơn
  // thanh ngang gom con (CAO + khoangSatChu) để không bị xâu vào dây.
  // Có nét ngang chạy qua chỗ ấy (nét bộ cha mẹ thứ hai chạy ngay dưới đáy ô,
  // ca P0007 tâm P0010) thì lùi về đáy khe như trước.
  if (!u && !thieuBanDoi) {
    const x = nut.x + nut.w / 2;
    const dayTen = KHONG_ANH ? nut.h
      : PHOTO.leTrenO + 2 * PHOTO.banKinhTrenO - VE.deLenAnh +
        VE.leTrongBang * 2 + VE.buocDongTen;
    let yNot = Math.min(nut.y + nut.h + LAYOUT.stubRadius - 3,
                        nut.y + nut.h + LAYOUT.khoangSatChu - LAYOUT.stubRadius - 2);
    if (netNgangCat(ct, x, yNot)) yNot = nut.y + nut.h + KHE_DOC - LAYOUT.stubRadius - 2;
    return { x, y: yNot, x1: x, y1: nut.y + dayTen, angle: 90 };
  }

  if (thieuBanDoi) {
    // HAI thứ phải đúng cùng lúc, thiếu một là nốt tròn nằm đè lên ô người
    // bên cạnh (16/08/2026, chat 1.4 — đo được 14/120 nốt hỏng, đúng bằng
    // TOÀN BỘ số nốt nằm ngang; sáu bất biến của chat 1.3 chỉ xét ô với ô nên
    // không bắt được, lỗi chỉ lộ ra khi xem ảnh chụp):
    //
    // 1. ĐỘ DÀI RIÊNG. Chiều dọc có vGap = 90px để mọc ra, chiều ngang chỉ có
    //    hGap = 28px giữa hai khối anh em. Dùng chung stubLength = 34 thì nốt
    //    rơi hẳn sang khối bên cạnh.
    // 2. MỌC RA TỪ MÉP NGOÀI CỦA CẢ DẢI, không phải mép ô người đó. Người bị
    //    HẤP THỤ vào dải của bạn đời thì ngay cạnh họ là ô bạn đời, chỉ cách
    //    spouseGap = 16px — hẹp hơn cả hGap.
    const LN = LAYOUT.stubLengthNgang;

    const ht     = ct.hapThuBoi.get(sp.personId);
    const neoId  = ct.dai.has(sp.personId) ? sp.personId : (ht ? ht.neoId : null);
    const daiNg  = neoId ? ct.dai.get(neoId) : null;
    const nutNeo = neoId ? ct.nodeById.get(neoId) : null;

    const huong = daiNg ? daiNg.huong : (gioiTinh(ct, sp.personId) === 'F' ? -1 : 1);
    const mepDai = (daiNg && nutNeo)
      ? (huong > 0 ? nutNeo.x - daiNg.dxP + daiNg.rong : nutNeo.x - daiNg.dxP)
      : (huong > 0 ? nut.x + nut.w : nut.x);
    const y = dai
      ? nut.y + netNut(nut) - (dai.mucNet.get(sp.unionId) || 0) * dai.buocNet
      : nut.y + netNut(nut);
    // Mọc từ MÉP VÒNG ẢNH, không từ mép ô — ô rộng hơn vòng ảnh `LE_ANH` mỗi
    // bên, nét bắt đầu ở mép ô thì hở một khoảng (chủ dự án 25/09/2026).
    // Chỉ khi người đứng NGOÀI CÙNG dải là chính chủ nốt: sát vòng ảnh bạn đời
    // thì mắt đọc thành nốt của bạn đời (bà Hoài, tâm P0010), nên giữ mép ô.
    let ngoaiCung = sp.personId;
    if (daiNg) {
      let dxMep = null;
      for (const [id, d] of daiNg.dx) {
        if (dxMep === null || (huong > 0 ? d > dxMep : d < dxMep)) { dxMep = d; ngoaiCung = id; }
      }
    }
    const R  = KHONG_ANH ? 0 : PHOTO.banKinhTrenO;
    const dy = Math.min(Math.abs(y - nut.y - netNut(nut)), R);
    let x1 = ngoaiCung === sp.personId
      ? mepDai - huong * (leAnh(nut) + R - Math.sqrt(R * R - dy * dy))
      : mepDai;
    if (x1 !== mepDai && netNgangCat(ct, x1 + huong * LN, y)) x1 = mepDai;
    return { x: x1 + huong * LN, y, x1, y1: y, angle: huong > 0 ? 0 : 180 };
  }

  // Cặp đủ, thiếu con.
  //
  // ⚠ **NỐT CỤT LÀ MỘT CHỖ CON NỮA NỐI TIẾP THANH NGANG: CHẠY NGANG RA KHỎI
  // ĐẦU NGOÀI CỦA THANH NGANG, RỒI MỚI THẢ DỌC XUỐNG NỐT.**
  //
  // Chốt ở bước 85, theo đúng hình chủ dự án vẽ lại bằng Photoshop:
  // `tai-lieu/anh/net cut - con.jpg` — bản phần mềm vẽ nằm bên TRÁI, bản chủ
  // dự án vẽ lại nằm bên PHẢI (đoạn tô đỏ chính là nét cụt phải vẽ thế nào).
  //
  // Luật cũ đặt nốt **cạnh ô con NGOÀI CÙNG theo chiều dải**, cách một chỗ
  // `RONG/2 + hGap`. Nó đúng khi điểm treo và ô con nằm gần nhau, và sai hẳn
  // khi **điểm treo ở xa hẳn một bên chùm con**: lúc ấy thanh ngang gom con
  // trải dài từ ô con tới tận điểm treo, mà chỗ né lại rơi vào **KHOẢNG GIỮA**
  // đoạn ấy:
  //
  //     SAI (tới b84)                     ĐÚNG (b85)
  //
  //     Trác ⎯⎯ Thịnh                     Trác ⎯⎯ Thịnh
  //        ┌───────┘                         ┌──────┼──────┐
  //        │   ╵ ●3                          │      (khuỷu) ╵ ●3
  //      Bích                              Bích
  //
  // Nốt mọc ra từ **giữa một nét liền** thì mắt đọc thành *"chỗ này rẽ đi đâu
  // đó"*, chứ không đọc ra *"cặp còn 3 người con chưa vẽ"*.
  //
  // Luật mới, một câu: **đoạn ngang của nốt cụt nối tiếp thanh ngang từ ĐẦU
  // NGOÀI của nó, đi tiếp một chỗ con nữa (`RONG/2 + hGap`), rồi thả dọc.**
  // Thanh ngang tính cả điểm treo, nên đầu ngoài thường CHÍNH LÀ điểm treo —
  // khi ấy hình ra đúng như bản vẽ tay: nét ngang chạy quá điểm treo một đoạn
  // rồi mới có nét dọc cụt.
  const huong = dai ? dai.huong : 1;
  const xTreo = treo ? treo.x : nut.x + nut.w / 2;
  const y1    = treo ? treo.y : nut.y + netNut(nut);
  const busY  = treo ? treo.busY : nut.y + netNut(nut);

  // ⚠ **NỐT PHẢI NẰM GỌN TRONG KHE GIỮA HAI ĐỜI.** Công thức cũ là
  // `CAO + vGap/2 + L` và nó đúng suốt từ chat 1.4 — nhưng chỉ đúng khi
  // `vGap/2 + L <= vGap`, tức khi `L <= vGap/2`. Với bộ số cũ (vGap 90,
  // L 34) thì thoả, nên không ai thấy gì.
  //
  // Bước 28b hạ vGap xuống 48 mà giữ L = 34: 24 + 34 = 58 > 48, và nốt thò
  // **10px vào hàng dưới**. Đo được 6/538 nốt đè lên ô người khác — chỉ 6, nên
  // nhìn ảnh chụp một sơ đồ thường không gặp; `kiem-thu/do-not-de-o.mjs` quét
  // cả hai file dữ liệu × bốn nấc `ancestors` mới lôi ra được.
  //
  // Nay chặn thẳng bằng trần: mép DƯỚI của nốt tròn phải còn cách nóc ô hàng
  // dưới ít nhất 2px. Chặn ở đây chứ không chặn bằng cách bắt người chỉnh
  // config phải nhớ một bất đẳng thức — cái phải nhớ thì sớm muộn cũng quên.
  //
  // ⚠ **Bước 84: nốt này nằm SÁT SÀN khe, không còn treo `stubLength` dưới
  // thanh ngang.** Hai công thức ấy cho cùng một kết quả suốt từ b28 tới b83
  // vì trần luôn thắng (`khoangSatChu 12 + L 14 = 26 = vGap 34 − r 6 − 2`),
  // nên không ai phải chọn. `vGap` nới lên 42 thì chúng tách ra, và bài kiểm
  // nhóm 8 chỉ ngay chỗ sai: giữ công thức cũ thì nốt đứng ở CAO + 26, mà
  // thanh ngang MỨC 1 của một union khác chạy qua đúng CAO + 20 — nốt lại bị
  // xâu vào dây, đúng lỗi b82 vừa sửa xong.
  //
  // Chọn sàn vì nghĩa của nốt: nó **thay cho một người con chưa vẽ**, mà con
  // thì ở hàng dưới. Bám sàn thì mọi thứ trong khe giữ nguyên khoảng cách tới
  // hàng dưới dù `vGap` có nới bao nhiêu, và nốt tự tránh được mọi mức thanh
  // ngang — mức sâu nhất còn cách mép trên nốt 8px.
  const tranY = nut.y + nut.h + KHE_DOC - LAYOUT.stubRadius - 2;
  const yDay  = tranY;

  // Mọi phép đo đoạn ngang của nốt cụt đều đi qua `nhipNotCut()` — xem ghi chú
  // ở hàm đó: trước b85 chỗ Vẽ và chỗ XẾP MỨC tự tính riêng, và chúng đã lệch nhau.
  const nhip = nhipNotCut(ct, u, xTreo, huong);

  // Ca chưa vẽ được người con nào: không có thanh ngang, nên đoạn kẻ đi thẳng
  // từ ĐIỂM TREO giữa hai vòng ảnh xuống nốt — lúc này chính nó thay cho cả
  // chùm con.
  if (!nhip) return { x: xTreo, y: yDay, x1: xTreo, y1, angle: 90 };

  return {
    x: nhip.x, y: yDay, x1: nhip.goc, y1: busY, angle: 90,
    duong: [[nhip.goc, busY], [nhip.x, busY], [nhip.x, yDay]],
  };
}

// ============================================================
// 8 · KHUNG BAO
// ============================================================

function tinhBounds(nodes, links, stubs) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const nhet = (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  for (const n of nodes) { nhet(n.x, n.y); nhet(n.x + n.w, n.y + n.h); }
  for (const l of links) for (const p of l.points) nhet(p[0], p[1]);
  for (const s of stubs) {
    nhet(s.x - LAYOUT.stubRadius, s.y - LAYOUT.stubRadius);
    nhet(s.x + LAYOUT.stubRadius, s.y + LAYOUT.stubRadius);
  }

  if (minX === Infinity) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX: minX - DEM, minY: minY - DEM, maxX: maxX + DEM, maxY: maxY + DEM };
}
