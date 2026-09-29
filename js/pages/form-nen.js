// ============================================================
// giapha · js/pages/form-nen.js
// Vai trò  : NỀN DÙNG CHUNG của mọi form/hộp việc — trạng thái lớp phủ `N` ·
//            bảng ô `o` · kiểu dáng · hộp trắng/chọn/báo · nút · ô nhập ·
//            ghi bản ghi qua `luuCay` · tra tên · hỏi cặp · hỏi thứ bậc
// Lớp      : pages — được gọi bởi: pages/person-edit, pages/form-*.js ·
//            được phép gọi: state, domains/union, services/repo, utils, config
// Phụ thuộc: state, domains/union, services/repo, utils/{text,date}, config
// Phiên bản: 1.0.0 · Cập nhật: 29/09/2026 17:45 (b158, đợt 7 tách person-edit.js)
// ============================================================
//
// Dời nguyên văn từ `person-edit.js` (đợt 7 của `tai-lieu/BAN-DO-TACH_V01.md`).
// Ba chỗ đổi, còn lại không đổi một chữ:
//   · `closePersonForm()` gọi các hàm dọn ĐÃ ĐĂNG KÝ (`dangKyDonDep`), không
//     nhập tám hàm `donDep*` nữa;
//   · `veChan(chayLuu, luuDuoc, chuNut)` — nơi gọi truyền hàm lưu vào;
//   · `xoaThuBacNhap()` thay cho `thuBacNhap = []` ở `person-edit.js`.
//
// ⚠ File này KHÔNG nhập `person-edit.js` hay file `form-*.js` nào — thêm một
//   dòng như thế là dựng lại vòng nhập vừa gỡ. Cần gì của chúng thì nhận qua
//   tham số (như `veChan`) hoặc qua `dangKyDonDep`.
// ⚠ Đừng thêm màn hình vào đây — thêm một file `form-*.js`.

import { state } from '../state.js';
import { getParentUnions, getPartnerUnions, rankCua } from '../domains/union.js';
import { luuCay, suaDuoc } from '../services/repo.js';
import { fullName, coGiaTri } from '../utils/text.js';
import { formatDate, parseLooseDate } from '../utils/date.js';
import { rongHop, caoHop, leLopPhu, RONG_NUT_TOI_DA } from '../config.js';

// --- TRẠNG THÁI CỦA LỚP PHỦ, gom vào MỘT object -------------------------
//
// ⚠ Bảy thứ này là trạng thái dùng chung của MỌI màn hình trong file — và từ
// việc tách file (27/08/2026) là của mọi màn hình trong CẢ NHÓM `form-*.js`.
// Chúng phải nằm trong một object chứ không phải bảy biến rời: ES Modules gốc
// KHÔNG cho hai file cùng ghi vào một biến `let` của nhau, nhưng thuộc tính
// của một object thì dùng chung được. Đây là điều kiện để tách file mà không
// dựng ra bản trạng thái thứ hai.
const N = {
  lopPhu:       null,   // lớp phủ đang mở, hoặc null
  khoiKetQua:   null,   // chỗ hiện lỗi, cảnh báo, lời máy chủ
  nutLuu:       null,
  xuLyNgoai:    {},
  dangLuu:      false,
  daXemCanhBao: false,  // đã hiện cảnh báo và người dùng vẫn muốn lưu
  // 'sua' · 'themCon' · 'themChaMe' · 'themBanDoi' · 'xoa' · 'chon' · 'noi' · 'go'
  // · 'suaCap' (bước 29) · 'sapThuTu' (21/08/2026) · 'chuyenCon' (22/08/2026)
  // · 'giaDinh' · 'chonNguoi' · 'doiNguoi' (màn hình Sửa thông tin gia đình)
  cheDo:        'sua',
};

// Các ô nhập, tra theo tên trường. KHÔNG BAO GIỜ gán lại object này — nơi dọn
// (`closePersonForm`) xoá từng khoá, để mọi file cùng nhìn đúng một cái bảng.
const o = {};

// THỨ BẬC HỎI LÚC NHẬP (luật 12). Mỗi mục là { mocId, input } — một cái ô, và
// NGƯỜI làm mốc cho con số trong ô ấy. Mảng, không phải một ô: nối hai người
// đều đã có cặp thì hộp hỏi cả hai phía.
//
// ⚠ Giữ THAM CHIẾU tới ô, không đọc ngược từ `document`. `hienNhan()` xoá sạch
// `N.khoiKetQua` mỗi lần nó nói một câu mới, nên sau khối cảnh báo thì mấy cái ô
// này không còn nằm trong trang nữa — nhưng tham chiếu vẫn sống và vẫn giữ
// đúng con số người dùng đã gõ. Cùng cơ chế mà `o.quanHe` đã sống nhờ.
let thuBacNhap = [];
/** Bỏ mọi ô thứ bậc đang giữ — khi khối ấy vẽ lại, ô cũ đã rời khỏi trang. */
function xoaThuBacNhap() { thuBacNhap = []; }

/**
 * Đăng ký một hàm dọn trạng thái RIÊNG của một màn hình — gọi ở TOP-LEVEL của
 * file ấy. `closePersonForm()` dọn nền rồi gọi lần lượt mọi hàm đã đăng ký.
 *
 * ⚠ Vì sao đăng ký chứ không nhập: nền nhập từ tám file con là dựng lại đúng
 * vòng nhập mà đợt 7 sinh ra để gỡ. ES Modules gốc không cho file này với tới
 * biến `let` của file khác, nên mỗi file tự đưa hàm dọn của mình tới đây.
 * Quên đăng ký thì trạng thái đang làm dở của màn hình ấy sống sót qua lần
 * đóng hộp — và hiện lại ở lần mở sau, giữa một việc khác.
 *
 * ⚠ `export function` (khai báo, được nâng lên đầu) + mảng khởi tạo LƯỜI:
 * file con gọi hàm này lúc nó được nạp, và một `const` top-level ở đây mà
 * chưa chạy tới là lỗi TDZ. Nay file này không nhập file con nào nên nó luôn
 * chạy xong trước — nhưng đừng dựa vào điều đó.
 */
export function dangKyDonDep(fn) {
  if (!dangKyDonDep.ds) dangKyDonDep.ds = [];
  if (!dangKyDonDep.ds.includes(fn)) dangKyDonDep.ds.push(fn);
}

function closePersonForm() {
  if (N.lopPhu) N.lopPhu.remove();
  N.lopPhu       = null;
  for (const k of Object.keys(o)) delete o[k];
  N.khoiKetQua   = null;
  N.nutLuu       = null;
  N.dangLuu      = false;
  N.daXemCanhBao = false;
  N.cheDo        = 'sua';
  thuBacNhap     = [];
  for (const fn of (dangKyDonDep.ds || [])) fn();
}

/**
 * Lý do không cho lưu, biết TRƯỚC khi người dùng gõ chữ nào. Trả về null nếu
 * lưu được.
 *
 * Nói ngay lúc mở form, không đợi tới lúc bấm Lưu: gõ xong cả bản ghi rồi mới
 * nghe "bạn không có quyền" là mất trắng công của người ta.
 */
function canTroLuu() {
  if (!suaDuoc()) {
    // ⚠ Câu này TỪNG nói "không ghi xuống Google Drive" và "đổi quyền trên
    //   Drive" — đúng với bản Apps Script, sai hẳn trên nền Supabase: Drive
    //   không còn dính dáng gì, quyền do vai trò trong `tree_members` và Row
    //   Level Security quyết, ở tầng máy chủ. Sửa 08/09/2026 (b103).
    return 'Bạn chỉ có quyền xem gia phả nên chưa lưu được. Xem và sửa thử thì ' +
           'vẫn được, chỉ là bấm Lưu sẽ bị máy chủ từ chối. Cần sửa thật thì ' +
           'nhờ người quản lý gia phả cấp quyền cho tài khoản của bạn.';
  }
  if (state.daLocNguoiConSong) {
    return 'Bản gia phả trong máy đang bị ẩn bớt chi tiết người còn sống, nên ' +
           'không được phép lưu đè lên bản gốc.';
  }
  return null;
}

/** Tên những người đang đứng trong một cặp. Cặp một người thì ra đúng một tên. */
function keTenPartner(unionId) {
  const u = state.index && state.index.unionById.get(unionId);
  const ds = (Array.isArray(u && u.partners) ? u.partners : [])
    .filter((id) => id && state.index.personById.has(id))
    .map(tenNguoi);
  return ds.length > 0 ? ds.join('  và  ') : '(cặp chưa có ai)';
}

function tenNguoi(personId) {
  const p = state.index && state.index.personById.get(personId);
  const ten = p ? fullName(p) : '';
  return coGiaTri(ten) ? ten : '(chưa có tên)';
}

function veNhan(chu) {
  const d = document.createElement('div');
  d.textContent = chu;
  d.style.cssText =
    'margin-top:16px;margin-bottom:6px;font-size:12px;font-weight:600;' +
    'letter-spacing:.04em;color:var(--sd-chu-phu,#8a8078)';
  return d;
}

/**
 * Tên người kia trong cặp. Cặp MỘT NGƯỜI (`U0024` là ca thật) thì không có
 * người kia — nói thẳng ra thay vì để trống, vì một hàng không tên trông y hệt
 * một lỗi nạp dữ liệu.
 */
function tenBanDoiTrongCap(index, u, personId) {
  const ds = (Array.isArray(u.partners) ? u.partners : [])
    .filter((id) => id && id !== personId && index.personById.has(id))
    .map(tenNguoi);
  // ⚠ Chữ thay thế phải đúng ở CẢ HAI nơi gọi. Bản cũ ghi *"(cặp mới có một
  // người)"* — đọc lọt tai trong khối Quan hệ, nhưng ở danh sách *"Đang có:"*
  // của ô thứ bậc thì nó nói dối: cặp ấy là cặp CŨ, có khi đã mang mấy người
  // con. Bước 65 làm chỗ ấy hiện ra thường xuyên nên lỗi lộ ngay.
  return ds.length > 0 ? ds.join('  và  ') : '(chưa có tên người kia)';
}

/** Một ô nhập một dòng. `phan` là tỷ lệ bề rộng khi nằm cùng hàng với ô khác. */
function oChu(khoa, nhan, giaTri, goiY, phan) {
  const boc = document.createElement('div');
  boc.style.cssText = 'margin-top:6px;' + (phan ? 'flex:' + phan + ' 1 0;min-width:0' : '');

  const input = document.createElement('input');
  input.type = 'text';
  input.value = coGiaTri(giaTri) ? String(giaTri) : '';
  input.placeholder = goiY || '';
  input.setAttribute('aria-label', nhan);
  input.style.cssText = KIEU_O;
  o[khoa] = input;

  boc.append(input);
  if (!phan) {
    // Ô đứng một mình thì cần nhãn nhỏ phía trên, vì placeholder biến mất ngay
    // khi người ta gõ chữ đầu tiên — và lúc quay lại sửa thì không còn gì nói
    // cho biết ô này hỏi cái gì.
    boc.prepend(veNhanO(nhan));
  }
  return boc;
}

function oNhieuDong(khoa, giaTri, goiY) {
  const t = document.createElement('textarea');
  t.value = coGiaTri(giaTri) ? String(giaTri) : '';
  t.placeholder = goiY || '';
  t.rows = 4;
  t.style.cssText = KIEU_O + 'resize:vertical;line-height:1.5';
  o[khoa] = t;
  return t;
}

function veNhanO(chu) {
  const d = document.createElement('div');
  d.textContent = chu;
  d.style.cssText = 'font-size:11px;color:var(--sd-chu-mo,#b3aaa0);margin-bottom:3px';
  return d;
}

/**
 * Ô ngày, kèm một dòng nói MÁY ĐỌC ĐƯỢC GÌ từ chữ vừa gõ.
 *
 * Dòng ấy là chỗ duy nhất người dùng nhìn thấy `parseLooseDate()` làm việc, và
 * nó tồn tại vì một lý do cụ thể: gõ "khoảng 1890" thì app lưu năm 1890 vào
 * `iso` để sắp xếp và tính tuổi, nhưng vẫn giữ nguyên chữ "khoảng 1890" để
 * hiển thị. Không nói ra thì người dùng không biết app hiểu mình thế nào, và
 * cũng không biết vì sao thẻ thông tin lại hiện "khoảng 74 tuổi".
 */
function oNgay(khoa, khoiNgay, nhanRieng) {
  const boc = document.createElement('div');
  boc.style.cssText = 'margin-top:6px';

  // Nhãn suy từ khoá cho hai ô đã có từ đầu; ô nào mọc sau thì tự mang nhãn
  // của mình. Thêm một nhánh `khoa === '…'` nữa vào chuỗi ba ngôi là dựng một
  // bảng tra ngầm nằm rải trong thân hàm.
  const nhan = nhanRieng || (khoa === 'birth' ? 'Ngày sinh' : 'Ngày mất');

  const cu = khoiNgayCua(khoiNgay);
  const input = document.createElement('input');
  input.type = 'text';
  input.value = coGiaTri(cu.raw) ? String(cu.raw) : '';
  input.placeholder = '1948  ·  12/3/1948  ·  khoảng 1948';
  input.setAttribute('aria-label', nhan);
  input.style.cssText = KIEU_O;
  o[khoa] = input;

  const doc = document.createElement('div');
  doc.style.cssText = 'font-size:11px;line-height:1.45;color:var(--sd-chu-phu,#8a8078);margin-top:4px';

  const capNhat = () => { doc.textContent = mayDocDuocGi(input.value); };
  input.addEventListener('input', capNhat);
  capNhat();

  boc.append(veNhanO(nhan), input, doc);
  return boc;
}

/** Câu giải thích dưới ô ngày. Chuỗi rỗng thì không nói gì cả. */
function mayDocDuocGi(chu) {
  const s = typeof chu === 'string' ? chu.trim() : '';
  if (s === '') return '';

  const kq = parseLooseDate(s);
  if (!kq.iso) {
    return 'Máy chưa đọc ra năm nào trong chữ này. Vẫn lưu được, và vẫn hiện ' +
           'đúng chữ bạn gõ — chỉ là app không dùng nó để tính tuổi được.';
  }
  const dep = formatDate({ iso: kq.iso, raw: '' });
  if (kq.confident) return 'Máy đọc được: ' + dep + '.';
  return 'Máy đoán là ' + dep + ', nhưng không chắc. Chữ bạn gõ vẫn giữ nguyên.';
}

/**
 * Hàng nút chân của form: nút chính + Huỷ.
 * @param {function} chayLuu  việc của nút chính — nơi gọi truyền vào (đợt 7:
 *        trước đó hàm này tự chọn một trong năm hàm lưu theo `N.cheDo`, nên
 *        nền phải biết tên của cả năm)
 * @param {boolean} luuDuoc
 * @param {string} [chuNut]
 */
function veChan(chayLuu, luuDuoc, chuNut = 'Lưu') {
  const chan = document.createElement('div');
  chan.style.cssText =
    'display:flex;gap:8px;margin-top:18px;position:sticky;bottom:-18px;' +
    'padding:10px 0;background:var(--sd-giay,#fffdf9);justify-content:center';

  N.nutLuu = document.createElement('button');
  N.nutLuu.type = 'button';
  N.nutLuu.textContent = chuNut;
  N.nutLuu.disabled = !luuDuoc;
  N.nutLuu.style.cssText = KIEU_NUT_CHAN +
    'flex:1 1 auto;max-width:' + RONG_NUT_TOI_DA + ';' +
    (luuDuoc
      ? 'background:var(--sd-nut,#2a2622);color:var(--sd-nut-chu,#fffdf9);border:1px solid var(--sd-nut,#2a2622);font-weight:600'
      : 'background:var(--sd-nut,#2a2622);color:var(--sd-nut-chu,#fffdf9);border:1px solid var(--sd-nut,#2a2622);opacity:.45;cursor:not-allowed');
  if (luuDuoc) {
    N.nutLuu.addEventListener('click', () => chayLuu());
  }

  const huy = document.createElement('button');
  huy.type = 'button';
  huy.textContent = 'Huỷ';
  huy.style.cssText = KIEU_NUT_CHAN +
    'flex:0 0 auto;background:var(--sd-nen,#faf8f5);color:var(--sd-chu,#2a2622);border:1px solid var(--sd-vien,#e6e0d8)';
  huy.addEventListener('click', () => closePersonForm());

  chan.append(N.nutLuu, huy);
  return chan;
}

function gopRaSoat(a, b) {
  const ra = {
    canSave: a.canSave && b.canSave,
    errors: [], warnings: [], skipped: [],
    counts: { total: 0, ok: 0, error: 0, warning: 0, skip: 0 },
  };

  for (const ten of ['errors', 'warnings', 'skipped']) {
    const daThay = new Set();
    for (const muc of a[ten].concat(b[ten])) {
      const khoa = muc.check + '|' + muc.message;
      if (daThay.has(khoa)) continue;
      daThay.add(khoa);
      ra[ten].push(muc);
    }
  }
  for (const khoa of Object.keys(ra.counts)) {
    ra.counts[khoa] = (a.counts[khoa] || 0) + (b.counts[khoa] || 0);
  }
  return ra;
}

/** Một nút trong khối kết quả. `chinh` = nút được khuyên dùng. */
function nutChon(chu, chinh, chay) {
  const nut = document.createElement('button');
  nut.type = 'button';
  nut.textContent = chu;
  nut.style.cssText = KIEU_NUT_CHAN + 'width:100%;text-align:center;' +
    (chinh
      ? 'background:var(--sd-nut,#2a2622);color:var(--sd-nut-chu,#fffdf9);border:1px solid var(--sd-nut,#2a2622);font-weight:600'
      : 'background:var(--sd-nen,#faf8f5);color:var(--sd-chu,#2a2622);border:1px solid var(--sd-vien,#e6e0d8)');
  nut.addEventListener('click', chay);
  return nut;
}

/** Tên một người đọc từ CÂY ĐANG DỰNG — người vừa thêm chưa có trong `index`. */
function tenTrongCay(cay, personId) {
  const p = (cay && Array.isArray(cay.persons))
    ? cay.persons.find((x) => x && x.id === personId) : null;
  const ten = p ? fullName(p) : '';
  return coGiaTri(ten) ? ten : personId;
}

function docO(khoa) {
  const el = o[khoa];
  if (!el) return '';
  if (typeof el.doc === 'function') return el.doc();
  return typeof el.value === 'string' ? el.value : '';
}

/** @param {string[]} [dong] mỗi dòng một lời của bộ rà soát */
function hienNhan(chu, laLoi, dong) {
  if (!N.khoiKetQua) return;
  N.khoiKetQua.innerHTML = '';

  const d = document.createElement('div');
  d.textContent = chu;
  d.style.cssText =
    'margin-top:14px;padding:9px 11px;font-size:12px;line-height:1.5;border-radius:8px;' +
    (laLoi
      ? 'color:var(--sd-do,#8a3a2a);background:var(--sd-do-nen,#fbf0ec);border:1px solid var(--sd-do-vien,#f0d8d0)'
      : 'color:var(--sd-chu-phu,#8a8078);background:var(--sd-nen,#faf8f5);border:1px solid var(--sd-vien-nhat,#f0ebe4)');
  N.khoiKetQua.append(d);

  for (const chuDong of (dong || [])) {
    const m = document.createElement('div');
    m.textContent = '• ' + chuDong;
    m.style.cssText =
      'margin-top:6px;padding:7px 10px;font-size:12px;line-height:1.5;' +
      'border-radius:8px;background:var(--sd-nen,#faf8f5);border:1px solid var(--sd-vien-nhat,#f0ebe4);color:var(--sd-chu-vua,#5c554e)';
    N.khoiKetQua.append(m);
  }
}

function khoiNgayCua(khoi) {
  if (!khoi || typeof khoi !== 'object') return { iso: null, raw: '', place: '' };
  return khoi;
}

const KIEU_O =
  'width:100%;box-sizing:border-box;padding:9px 10px;font-size:15px;' +
  'font-family:inherit;color:var(--sd-chu,#2a2622);background:var(--sd-giay,#fff);border:1px solid var(--sd-vien,#e6e0d8);' +
  'border-radius:8px;outline-color:var(--sd-vang,#8a6a3a);';

const KIEU_NUT_CHON =
  'flex:1 1 0;min-height:40px;padding:0 8px;font-size:14px;font-family:inherit;' +
  'border-radius:9px;cursor:pointer;touch-action:manipulation;';

const KIEU_NUT_CHAN =
  'min-height:44px;padding:0 16px;font-size:14px;font-family:inherit;' +
  'border-radius:9px;cursor:pointer;touch-action:manipulation;';

// Lớp phủ và hộp trắng: MỘT chỗ định nghĩa cho cả file. Trước bước 26 đoạn này
// được chép ba lần, và ba bản ấy chỉ cần lệch nhau một con số `z-index` là có
// hai hộp của cùng file này chồng lên nhau mà không ai biết vì sao.
const KIEU_LOP_PHU =
  'position:fixed;inset:0;background:rgba(42,38,34,.35);z-index:35;' +
  'display:flex;align-items:center;justify-content:center;' +
  'padding:' + leLopPhu() + ';' +
  'font-family:system-ui,sans-serif;color:var(--sd-chu,#2a2622)';

const KIEU_HOP =
  'background:var(--sd-giay,#fffdf9);border-radius:14px;padding:18px;box-sizing:border-box;' +
  'width:100%;max-width:' + rongHop(380, 640) + ';' +
  'max-height:' + caoHop(86) + ';overflow:auto;' +
  'box-shadow:0 8px 32px rgba(42,38,34,.28);' +
  '-webkit-overflow-scrolling:touch';

/**
 * Thay đúng MỘT bản ghi người trong cây, qua `repo.luuCay()`.
 *
 * Không tìm thấy mã ấy thì NÉM LỖI thay vì im lặng bỏ qua: hàm sửa chạy trên
 * bản sao của cây LÚC LƯU, khác cây lúc mở hộp. Lặng lẽ không làm gì thì máy chủ
 * vẫn gật, `revision` vẫn tăng, và màn hình báo "đã xoá" cho một việc chưa hề
 * xảy ra.
 */
async function ghiMotNguoi(nguoiMoi, moTa) {
  try {
    return await luuCay((cay) => {
      const ds = Array.isArray(cay.persons) ? cay.persons : [];
      const i = ds.findIndex((p) => p && p.id === nguoiMoi.id);
      if (i < 0) {
        throw new Error('Không còn ai mang mã ' + nguoiMoi.id +
                        ' trong bản trên Drive. Tải lại trang rồi làm lại.');
      }
      ds[i] = JSON.parse(JSON.stringify(nguoiMoi));
    }, moTa);
  } catch (e) {
    return { ok: false, loi: e && e.message ? e.message : String(e) };
  }
}

/**
 * Lời báo khi máy chủ từ chối. `hienTrang` nói rõ dữ liệu đang ở trạng thái nào.
 *
 * ⚠ `hienTrang` LUÔN được ghép vào, kể cả khi máy chủ đã có câu giải thích
 * riêng. Bản cũ chỉ dùng nó ở nhánh "không nói rõ vì sao", và đó là một lỗ:
 * câu của máy chủ giải thích *vì sao hỏng*, còn `hienTrang` trả lời câu hỏi
 * khác hẳn — *bây giờ dữ liệu đang ra sao*. Với đường xoá thật thì câu thứ hai
 * mới là câu người dùng cần: họ vừa bấm một nút không lùi được và phải biết
 * ngay là nó đã chạy hay chưa.
 */
function hienLoiGhi(ketQua, hienTrang) {
  if (ketQua && ketQua.lyDo === 'xungdot') {
    hienNhan('Người khác vừa sửa đúng bản ghi này trong lúc hộp này đang mở — ' +
             'có thể từ một gia phả khác cùng chứa người ấy — nên app KHÔNG ' +
             'ghi đè lên bản của họ. ' + hienTrang + ' Tải lại trang rồi làm lại.', true);
    return;
  }
  const cua = (ketQua && ketQua.loi) || 'Máy chủ không nói rõ vì sao.';
  hienNhan(hienTrang + ' ' + cua, true);
}

/** Nút của hộp xoá. `nguyHiem` = nút màu đỏ, chỉ dùng cho đúng nút xoá. */
function nutChanXoa(chu, nguyHiem, chay) {
  const nut = document.createElement('button');
  nut.type = 'button';
  nut.textContent = chu;
  nut.style.cssText = KIEU_NUT_CHAN + 'flex:1 1 45%;text-align:center;' +
    (nguyHiem
      ? 'background:var(--sd-do-dac,#8a3a2a);color:var(--sd-nut-chu,#fffdf9);border:1px solid var(--sd-do,#8a3a2a);font-weight:600'
      : 'background:var(--sd-nen,#faf8f5);color:var(--sd-chu,#2a2622);border:1px solid var(--sd-vien,#e6e0d8)');
  nut.addEventListener('click', chay);
  return nut;
}

/**
 * Dựng lớp phủ + hộp trắng + khối kết quả + hàng nút chân.
 * @returns {HTMLElement} hàng nút chân, để nơi gọi append tiếp vào đó.
 */
function moHopTrang(che, xuLy, tieuDe, phu) {
  closePersonForm();
  N.xuLyNgoai = xuLy || {};
  N.cheDo     = che;

  N.lopPhu = document.createElement('div');
  N.lopPhu.style.cssText = KIEU_LOP_PHU;

  const hop = document.createElement('div');
  hop.id = 'giapha-hop-viec';   // mốc cho bài kiểm hành vi, xem kiem-noi-go.mjs
  hop.style.cssText = KIEU_HOP;

  const t = document.createElement('div');
  t.textContent = tieuDe;
  t.style.cssText = 'font-size:19px;font-weight:600';
  hop.append(t);

  if (coGiaTri(phu)) {
    const d = document.createElement('div');
    d.textContent = phu;
    d.style.cssText =
      'font-size:12px;color:var(--sd-chu-mo,#b3aaa0);margin-top:3px;letter-spacing:.03em;line-height:1.45';
    hop.append(d);
  }

  N.khoiKetQua = document.createElement('div');
  hop.append(N.khoiKetQua);

  const chan = document.createElement('div');
  chan.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:18px';
  hop.append(chan);

  N.lopPhu.append(hop);
  document.body.append(N.lopPhu);
  return chan;
}

/**
 * Một dòng bấm được: dòng trên là việc, dòng dưới là chi tiết.
 *
 * Cả dòng là MỘT đích chạm, không bao giờ hai nút cạnh nhau — cùng luật với
 * `pages/person-list.js`: trên điện thoại hai đích sát nhau trong một dòng cao
 * 44px là mời bấm nhầm.
 */
function nutMuc(muc) {
  const nut = document.createElement('button');
  nut.type = 'button';
  nut.dataset.muc = muc.ma || '';
  nut.style.cssText =
    'display:block;width:100%;text-align:left;padding:10px 12px;font-family:inherit;' +
    'font-size:14px;border-radius:9px;cursor:pointer;touch-action:manipulation;' +
    (muc.nguyHiem
      ? 'color:var(--sd-do,#8a3a2a);border:1px solid var(--sd-do-vien,#f0d8d0);background:var(--sd-do-nen,#fbf0ec)'
      : 'color:var(--sd-chu,#2a2622);border:1px solid var(--sd-vien,#e6e0d8);background:var(--sd-giay,#fff)');

  const d1 = document.createElement('div');
  d1.textContent = muc.chu;
  nut.append(d1);

  if (coGiaTri(muc.phu)) {
    const d2 = document.createElement('div');
    d2.textContent = muc.phu;
    d2.style.cssText = 'font-size:12px;color:var(--sd-chu-phu,#8a8078);margin-top:2px;line-height:1.4';
    nut.append(d2);
  }

  nut.addEventListener('click', muc.chay);
  return nut;
}

/** Hộp trắng + một câu hỏi + danh sách nút dọc + nút Huỷ. */
function moHopChon(che, xuLy, c) {
  const chan = moHopTrang(che, xuLy, c.tieuDe, c.phu);
  hienNhan(c.cauMo, false, c.cacDong);

  const hang = document.createElement('div');
  hang.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-top:10px';
  for (const m of c.cacMuc) hang.append(nutMuc(m));
  N.khoiKetQua.append(hang);

  chan.append(nutChanXoa(c.chuHuy || 'Huỷ', false, () => closePersonForm()));
}

/**
 * Gài mấy phần tử vào hộp việc, NGAY TRÊN hàng nút.
 *
 * ⚠ Vì sao không `N.khoiKetQua.append()` như ô "con nuôi" vẫn làm: `hienNhan()`
 * XOÁ SẠCH `N.khoiKetQua` mỗi lần nó nói một câu mới. Với ô thứ bậc thì đó là
 * một cái bẫy — câu app nói ra chính là *"ô ấy gõ sai, sửa lại đi"*, mà lúc
 * người dùng đọc được câu ấy thì cái ô đã bị chính nó xoá mất. Nên ô này sống
 * NGOÀI tầm với của `hienNhan`.
 *
 * (Ô "con nuôi" vẫn nằm trong `N.khoiKetQua` và vẫn biến mất sau một lời cảnh
 * báo. Không đúng, nhưng khác việc: ở đó lời cảnh báo không bao giờ nói về
 * chính cái ô ấy. Ghi lại ở nhật ký bước này, chưa sửa trong cùng phiên.)
 */
function gaiTruocChan(chan, cacEl) {
  const hop = chan && chan.parentElement;
  if (!hop) return;
  for (const el of cacEl) hop.insertBefore(el, chan);
}

/** Hộp chỉ để báo một câu rồi đóng. Dùng cho mọi ngõ cụt. */
function moHopBao(tieuDe, cau, laLoi, dong) {
  const chan = moHopTrang('chon', {}, tieuDe, '');
  hienNhan(cau, !!laLoi, dong);
  chan.append(nutChanXoa('Đóng', false, () => closePersonForm()));
}

/** Số người đang đứng trong `partners` — ĐẾM TRÊN BẢN GHI, để khớp `addPartner`. */
function soPartner(u) {
  return (Array.isArray(u && u.partners) ? u.partners : []).filter(Boolean).length;
}

/** Một dòng mô tả cặp, dùng lại ở cả bốn hộp chọn. */
function moTaCap(u) {
  const soCon = (Array.isArray(u.children) ? u.children : []).length;
  return [soCon > 0 ? soCon + ' con' : 'chưa có con', u.id]
    .filter(coGiaTri).join('  ·  ');
}

/**
 * Hỏi mối nối này treo vào CẶP nào, rồi gọi tiếp `tiep(unionId)`.
 * `unionId` rỗng nghĩa là *"tạo một cặp mới"*.
 *
 * @param {'chaMe'|'banDoi'|'con'} vaiTro  vai trò của NGƯỜI SẮP ĐƯỢC NỐI VÀO
 * @param {string} mocId  người đang đứng giữa việc này
 * @param {string} [doiTacId]  người kia của đường NỐI — xem mục dưới
 *
 * --- ⚠ QUAN HỆ VỢ CHỒNG ĐỐI XỨNG, MÃ THÌ TỪNG KHÔNG (vá 22/08/2026) ------
 *
 * Bản cũ chỉ nhìn cặp của `mocId`. Hệ quả đo được bằng
 * `kiem-thu/chan-doan-gia-dinh.mjs`: nối vợ–chồng từ thẻ CHỒNG thì app hỏi và
 * kể rõ *"1 con · U0026"*; từ thẻ VỢ thì nó **im lặng dựng cặp mới**, dù cặp
 * kia đang có con và còn đúng một chỗ trống. Cùng hai con người, cùng một mối
 * nối, hai kết quả khác nhau — chỉ vì người dùng mở thẻ nào trước.
 *
 * Nay `'banDoi'` gom cặp của **cả hai phía**. Một cặp chỉ nhận được khi nó còn
 * chỗ trống, và người điền vào chỗ ấy là người CHƯA đứng trong cặp — `dungCayNoi`
 * tự tìm ra, không cần truyền thêm gì.
 *
 * --- Khi nào đi thẳng, khi nào phải hỏi ---------------------------------
 *
 * Ba nhánh, và nhánh giữa là chỗ dễ làm ẩu nhất:
 *
 *   · KHÔNG có cặp nào nhận được  → tạo cặp mới, đi thẳng, không hỏi. Hỏi một
 *     câu chỉ có một câu trả lời là bắt người ta đọc để rồi bấm cái duy nhất.
 *   · ĐÚNG MỘT cặp nhận được, và người ấy không có cặp nào khác cùng loại →
 *     đi thẳng vào cặp ấy.
 *   · còn lại                     → PHẢI HỎI. Đoán hộ ở đây là nối vào nhầm
 *     đời vợ, và cái sai ấy nằm im trong dữ liệu cho tới lúc có người xem sơ đồ
 *     quanh đúng người ấy. `U0004`/`U0005` — hai đời vợ ông Cương — là ca thật
 *     đang có sẵn trong dữ liệu làm việc.
 *
 * ⚠ Riêng `'banDoi'` KHÔNG có nhánh giữa: hễ có một cặp một người nhận được là
 * hỏi. Lý do là hệ quả, không phải sự cẩn thận suông — thêm vợ/chồng vào một
 * cặp ĐANG CÓ CON thì người mới đồng thời thành cha/mẹ của mấy người con ấy
 * (luật 9). Một việc kéo theo một việc khác thì không được làm lặng lẽ.
 */
function chonCap(vaiTro, mocId, xuLy, tiep, doiTacId = '') {
  const index = state.index;
  if (!index) return;

  let tatCa = (vaiTro === 'chaMe')
    ? getParentUnions(index, mocId)
    : getPartnerUnions(index, mocId);

  // Cặp của người KIA, chỉ ở vai vợ/chồng. Cặp nào cả hai đã cùng đứng thì
  // không kể — `quanHeDaCo()` đã chặn đường ấy từ trước khi tới đây.
  if (vaiTro === 'banDoi' && doiTacId) {
    const daCo = new Set(tatCa.map((u) => u.id));
    for (const u of getPartnerUnions(index, doiTacId)) {
      if (!daCo.has(u.id)) { daCo.add(u.id); tatCa = tatCa.concat([u]); }
    }
  }

  // 'con' nhận mọi cặp của người ấy; hai vai kia cần một chỗ trống trong hàng
  // vợ/chồng, vì người sắp nối vào sẽ đứng ở đó.
  const nhanDuoc = (vaiTro === 'con') ? tatCa : tatCa.filter((u) => soPartner(u) < 2);

  // Đi thẳng CHỈ khi người ấy chưa có cặp nào cùng loại. Có cặp mà cặp nào cũng
  // đã đủ người thì VẪN PHẢI HỎI: lặng lẽ dựng thêm một cặp thứ hai là lặng lẽ
  // khẳng định "đây là cha mẹ NUÔI / KẾ", hoặc "đây là cuộc hôn nhân thứ hai" —
  // hai điều lớn mà người dùng chưa nói câu nào.
  if (tatCa.length === 0) { tiep(''); return; }
  if (vaiTro !== 'banDoi' && nhanDuoc.length === 1 && tatCa.length === 1) {
    tiep(nhanDuoc[0].id);
    return;
  }

  const cacMuc = nhanDuoc.map((u) => ({
    ma: u.id,
    chu: (vaiTro === 'chaMe' || vaiTro === 'banDoi')
      ? 'Đứng chung cặp với ' + keTenPartner(u.id)
      : 'Con của ' + keTenPartner(u.id),
    phu: moTaCap(u),
    chay: () => tiep(u.id),
  }));

  // Cặp một người có con là ca dễ chọn nhầm nhất: bước vào đó là đồng thời
  // nhận mấy người con ấy làm con mình (luật 9). Nói ngay trên chính cái nút.
  if (vaiTro === 'banDoi') {
    for (const m of cacMuc) {
      const u = nhanDuoc.find((x) => x.id === m.ma);
      const soCon = (u && Array.isArray(u.children)) ? u.children.length : 0;
      if (soCon > 0) {
        m.phu = m.phu + '  ·  ⚠ bước vào cặp này là nhận luôn ' + soCon +
                ' người con ấy làm con mình';
      }
    }
  }

  cacMuc.push({
    ma: 'moi',
    chu: vaiTro === 'chaMe' ? 'Tạo một cặp cha mẹ MỚI' : 'Tạo một cặp MỚI',
    phu: vaiTro === 'chaMe'
      ? 'Dùng khi đây là cha mẹ nuôi / kế, khác với cặp đã có ở trên.'
      : 'Dùng khi đây là một cuộc hôn nhân khác, không phải cặp đã có ở trên.',
    chay: () => tiep(''),
  });

  // Kể cả những cặp KHÔNG nhận được, chỉ để đọc. Không kể thì người dùng nhìn
  // danh sách thiếu mất cặp họ đang nghĩ tới và tưởng app quên mất nó.
  const dayRoi = tatCa.filter((u) => nhanDuoc.indexOf(u) < 0);
  const cacDong = dayRoi.map((u) =>
    'Cặp ' + u.id + ' (' + keTenPartner(u.id) + ') đã đủ hai người nên không ' +
    'nhận thêm được — trong gia phả này nhiều vợ / nhiều chồng là NHIỀU CẶP, ' +
    'không phải một cặp ba người.');

  moHopChon('chon', xuLy, {
    tieuDe: 'Nối vào cặp nào?',
    phu:    doiTacId
      ? tenNguoi(mocId) + '  ←→  ' + tenNguoi(doiTacId)
      : tenNguoi(mocId) + '  ·  ' + mocId,
    cauMo:  nhanDuoc.length === 0
      ? (vaiTro === 'chaMe'
        ? tenNguoi(mocId) + ' đã có đủ cha mẹ trong gia phả, nên người này sẽ ' +
          'thành một cặp cha mẹ THỨ HAI — cha mẹ nuôi hoặc cha mẹ kế.'
        : tenNguoi(mocId) + ' đã có đủ vợ/chồng trong mọi cặp đang có, nên đây ' +
          'sẽ là một cuộc hôn nhân KHÁC.')
      : (vaiTro === 'chaMe'
        ? 'Cha mẹ của ' + tenNguoi(mocId) + ' được ghi theo CẶP. Chọn cặp:'
        : (vaiTro === 'banDoi'
          ? (doiTacId
            ? 'Hai người này đứng chung cặp nào? Cặp kể dưới đây là cặp của ' +
              'CẢ HAI phía, và cặp nào cũng còn đúng một chỗ trống.'
            : 'Chọn chỗ đứng cho người vợ / chồng này:')
          : 'Người con này thuộc về cặp nào của ' + tenNguoi(mocId) + '?')),
    cacDong,
    cacMuc,
  });
}

/**
 * Ô hỏi *"đây là cặp thứ mấy của X?"* cho một cuộc hôn nhân SẮP TẠO RA.
 *
 * @param {string} mocId       người làm mốc cho con số
 * @param {string} [boQuaCapId] cặp đang được nối vào — không tính vào số cặp
 *        đang có, vì nó chính là cặp sắp thành cặp mới của người ấy
 * @returns {HTMLElement[]} rỗng khi KHÔNG phải hỏi (người ấy chưa có cặp nào)
 *
 * Khác `oThuBac()` ở form Sửa cặp đúng một chỗ, và chỗ ấy quan trọng: ở kia có
 * một cặp thật để `rankCua()` đọc ra con số đang lưu, ở đây thì chưa có gì cả
 * nên app phải GỢI Ý. Vì thế hai hàm không gộp được, và cũng không nên gộp.
 */
function khoiHoiThuBac(mocId, boQuaCapId) {
  const index = state.index;
  if (!index || !mocId || !index.personById.has(mocId)) return [];

  const dsCap = getPartnerUnions(index, mocId).filter((u) => u.id !== boQuaCapId);
  if (dsCap.length === 0) return [];   // cặp đầu tiên của người này: không hỏi

  const goiY = dsCap.length + 1;
  const ten  = tenNguoi(mocId);

  const boc = document.createElement('div');
  boc.style.cssText = 'margin-top:6px';

  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'numeric';
  input.value = String(goiY);
  input.dataset.thuBacCua = mocId;   // mốc cho bài kiểm, xem kiem-thu-bac-nhap.mjs
  input.setAttribute('aria-label', 'Đây là cặp thứ mấy của ' + ten + '?');
  input.style.cssText = KIEU_O;

  const nhac = document.createElement('div');
  nhac.textContent =
    '1 là vợ cả / chồng đầu, 2 là vợ thứ hai… tính riêng theo phía ' + ten +
    '. App điền sẵn ' + goiY + ' vì ' + ten + ' đang có ' + dsCap.length +
    ' cặp, nhưng SỬA ĐƯỢC: gia phả cũ chép thứ bậc theo lệ chứ không theo thứ ' +
    'tự nhập liệu, có nhà bà cưới sau vẫn là chính thất.';
  nhac.style.cssText = 'font-size:11px;line-height:1.45;color:var(--sd-chu-phu,#8a8078);margin-top:4px';

  // Kể ra những cặp đang có, kèm thứ bậc ĐANG LƯU của chính người này. Không kể
  // thì con số gợi ý là một lời khẳng định không có căn cứ nhìn thấy được, và
  // người dùng không có cách nào kiểm nó đúng hay sai trước khi bấm.
  //
  // Kể tên NGƯỜI KIA, không gọi `keTenPartner()`: câu ấy kể cả cặp, tức đọc lên
  // thành *"Đang có: Ông A và Bà B"* trong khi mốc chính là Ông A. Người đọc
  // cần biết *"đã có với AI"*, còn tên mình thì đang nằm ngay trên nhãn.
  const dsCu = document.createElement('div');
  dsCu.textContent = 'Đang có: ' + dsCap
    .map((u) => tenBanDoiTrongCap(index, u, mocId) +
                ' (thứ ' + rankCua(u, mocId) + ')')
    .join('  ·  ');
  dsCu.style.cssText = 'font-size:11px;line-height:1.45;color:var(--sd-chu-phu,#8a8078);margin-top:3px';

  thuBacNhap.push({ mocId, input });
  boc.append(input, nhac, dsCu);

  return [veNhan('Đây là cặp thứ mấy của ' + ten + '?'), boc];
}

/**
 * Bảng `ranks` đọc từ những ô vừa hỏi, đúng khuôn `createUnion`/`updateUnion`.
 *
 * Giá trị 1 và mọi thứ gõ sai đều KHÔNG sinh ra khoá — vắng khoá đã có nghĩa là
 * 1 (`union.locRanks`). Chỗ nói ra chuyện gõ sai là `loiThuBacGoSai()`, không
 * phải ở đây: hàm này chỉ đọc, không mắng.
 */
function docThuBacNhap() {
  const ra = {};
  for (const m of thuBacNhap) {
    const n = Number(String(m.input.value || '').trim());
    if (Number.isFinite(n) && n > 1) ra[m.mocId] = Math.floor(n);
  }
  return ra;
}

/**
 * Lời nhắc khi ô thứ bậc mang thứ không đọc ra số được — một dòng cho mỗi ô.
 *
 * Cùng luật với ô Đời (bước 32): app KHÔNG đoán hộ, và form phải NÓI RA rằng
 * mình không đoán. Im lặng ghi thứ 1 cho một ô người dùng vừa gõ nhầm là đúng
 * cái lỗi mà cả việc này sinh ra để chữa.
 */
function loiThuBacGoSai() {
  const ra = [];
  for (const m of thuBacNhap) {
    const chu = String(m.input.value || '').trim();
    const n   = Number(chu);
    if (chu !== '' && Number.isFinite(n) && n >= 1 && Math.floor(n) === n) continue;
    ra.push('Ô "đây là cặp thứ mấy của ' + tenNguoi(m.mocId) + '" đang mang "' +
            chu + '", không phải một số nguyên từ 1 trở lên. App sẽ ghi là ' +
            'thứ 1. Muốn con số khác thì sửa lại ô ấy rồi bấm lần nữa.');
  }
  return ra;
}

const TEN_QUAN_HE = { parent: 'cha / mẹ', spouse: 'vợ / chồng', child: 'con' };

/**
 * Thay/thêm một người và nhiều cặp trong CÙNG MỘT lần `luuCay()` — luật 4.
 *
 * Không tìm thấy mã người cần THÊM mà nó đã có sẵn thì NÉM LỖI thay vì ghi đè:
 * hàm sửa chạy trên bản sao của cây LÚC LƯU, khác cây lúc mở hộp, và hai người
 * trùng mã thì `buildIndex()` ném lỗi — lúc ấy app không mở lại được nữa.
 *
 * Cặp thì ngược lại, được phép ghi đè: mọi đường đi tới đây đều vừa đọc cặp ấy
 * ra khỏi `state.tree` và sửa trên bản sao của nó, nên bản mang xuống là bản
 * đầy đủ chứ không phải một mảnh. Người khác sửa cặp ấy cùng lúc thì dấu vân
 * tay của `luuCay()` chặn lại, không phải chỗ này.
 */
async function ghiBanGhi(nguoiThem, cacUnion, moTa, anh) {
  try {
    return await luuCay((cay) => {
      if (!Array.isArray(cay.persons)) cay.persons = [];
      if (!Array.isArray(cay.unions))  cay.unions  = [];

      if (nguoiThem) {
        if (cay.persons.some((p) => p && p.id === nguoiThem.id)) {
          throw new Error('Mã ' + nguoiThem.id + ' vừa được dùng cho một người ' +
                          'khác. Tải lại trang rồi làm lại.');
        }
        cay.persons.push(JSON.parse(JSON.stringify(nguoiThem)));
      }

      for (const u of (cacUnion || [])) {
        if (!u || !u.id) continue;
        const i = cay.unions.findIndex((x) => x && x.id === u.id);
        if (i >= 0) cay.unions[i] = JSON.parse(JSON.stringify(u));
        else        cay.unions.push(JSON.parse(JSON.stringify(u)));
      }

      // ẢNH — cùng hai vòng lặp với `handleSave`, cùng chốt chặn mã trùng.
      if (anh) {
        if (!Array.isArray(cay.media)) cay.media = [];
        for (const m of anh.themVao) {
          if (cay.media.some((x) => x && x.id === m.id)) {
            throw new Error('Mã ảnh ' + m.id + ' vừa được dùng cho một tấm khác. ' +
                            'Tải lại trang rồi gắn ảnh lại.');
          }
          cay.media.push(JSON.parse(JSON.stringify(m)));
        }
        for (const m of anh.goRa) {
          const k = cay.media.findIndex((x) => x && x.id === m.id);
          if (k >= 0) cay.media[k] = JSON.parse(JSON.stringify(m));
        }
      }
    }, moTa);
  } catch (e) {
    return { ok: false, loi: e && e.message ? e.message : String(e) };
  }
}

/**
 * Thứ tự một người con trong hàng anh chị em. Thiếu số thì XUỐNG CUỐI, không
 * lên đầu — cùng phép với thẻ gia đình: chưa ai xếp họ thì họ đứng sau người
 * đã được xếp.
 *
 * ⚠ Ở lại NỀN khi `form-sua-con.js` tách ra (27/08/2026): thẻ gia đình và
 * `form-gia-dinh.js` cũng đọc nó.
 */
function thuTuCon(c) {
  const n = Number(c && c.order);
  return Number.isFinite(n) ? n : 9999;
}

/**
 * Mã trạng thái đang lưu của một cặp, đã chuẩn hoá.
 *
 * Cùng đúng phép mà `docQuanHe` và `handleSaveUnion` dùng: thiếu `status` thì
 * coi là `married`, nhưng một mã LẠ thì giữ nguyên chứ không ép về `married` —
 * ép là lặng lẽ đổi một thứ gia phả đã chép.
 */
function maTrangThaiCap(u) {
  return u && u.status === 'divorced' ? 'divorced' : ((u && u.status) || 'married');
}

/** Nút chân màu đậm — việc CHÍNH của hộp. `nutChanXoa` chỉ có nhạt và đỏ. */
function nutChanDam(chu, chay) {
  const nut = document.createElement('button');
  nut.type = 'button';
  nut.textContent = chu;
  nut.style.cssText = KIEU_NUT_CHAN + 'flex:1 1 45%;text-align:center;' +
    'background:var(--sd-nut,#2a2622);color:var(--sd-nut-chu,#fffdf9);border:1px solid var(--sd-nut,#2a2622);font-weight:600';
  nut.addEventListener('click', chay);
  return nut;
}

function timNguoiTrongCay(personId) {
  const ds = (state.tree && Array.isArray(state.tree.persons)) ? state.tree.persons : [];
  return ds.find((p) => p && p.id === personId) || null;
}

function timCapTrongCay(unionId) {
  const ds = (state.tree && Array.isArray(state.tree.unions)) ? state.tree.unions : [];
  return ds.find((u) => u && u.id === unionId) || null;
}

export { N, o, KIEU_O, KIEU_NUT_CHON, KIEU_NUT_CHAN, KIEU_LOP_PHU, KIEU_HOP,
         TEN_QUAN_HE,
         closePersonForm, canTroLuu, moHopTrang, moHopChon, moHopBao, hienNhan, hienLoiGhi,
         nutChon, nutChanXoa, nutChanDam, nutMuc, gaiTruocChan, veNhan, veNhanO,
         oChu, oNhieuDong, oNgay, khoiNgayCua, docO, mayDocDuocGi, veChan, gopRaSoat,
         ghiBanGhi, ghiMotNguoi, tenNguoi, tenTrongCay, keTenPartner,
         tenBanDoiTrongCap, soPartner, moTaCap, thuTuCon, maTrangThaiCap,
         chonCap, khoiHoiThuBac, docThuBacNhap, loiThuBacGoSai, xoaThuBacNhap,
         timNguoiTrongCay, timCapTrongCay };
