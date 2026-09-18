// ============================================================
// giapha-supabase · kiem-thu/kiem-hinh-dang.mjs
// Vai trò  : Kiểm `services/hinh-dang.js` bằng gia phả thật, chạy trong Node.
//            Không cần Supabase, không cần mạng, không cần trình duyệt.
// Chạy     : cd supabase/kiem-thu && node kiem-hinh-dang.mjs
// Phiên bản: 0.3.0 · Cập nhật: 18/09/2026 (b122b)
// ============================================================
//
// ═══ BỐN CÂU HỎI BÀI KIỂM NÀY TRẢ LỜI ═══
//
// 1. **Bảng tên có sót trường nào không?** `boCay()` rồi `rapCay()` phải ra
//    lại đúng cây ban đầu. Sót một trường thì dữ liệu của trường ấy im lặng
//    biến mất ở lần lưu đầu tiên — không có lỗi nào báo, không có gì đỏ lên,
//    chỉ là ngày sinh của một ông cụ bỗng trống.
//
// 2. **So một cây với chính nó có ra RỖNG không?** Đây là câu quan trọng
//    nhất, và cũng là câu dễ trượt nhất. `soSanh` mà trả về "cả 681 người
//    đều đổi" thì app vẫn chạy, vẫn lưu được, vẫn đúng dữ liệu — chỉ có điều
//    mỗi lần lưu sẽ ghi lại cả cây, và ngày bật giới hạn theo nhánh thì MỌI
//    người biên tập đều bị từ chối MỌI lần lưu. Cái hỏng ấy nằm im hàng
//    tháng rồi mới lộ ra, đúng lúc khó truy nhất.
//
// 3. **Sửa một chỗ có ra đúng một chỗ không?** Không thừa, không thiếu.
//
// 4. **Lưu hai lần liền nhau có được không?** (b122b) Số chống ghi đè của
//    từng bản ghi phải đi tròn một vòng và được đặt lại sau mỗi lần Lưu, nếu
//    không thì lần thứ hai bị máy chủ từ chối bằng một câu nói sai sự thật:
//    *"người khác vừa sửa"*. Phép 5 ở cuối file.
//
// ⚠ Bài kiểm đọc `tai-lieu/giapha-nguyen-trong-bac.json` — gia phả đang dùng
//   để dựng và kiểm phần mềm. Dữ liệu trong đó **toàn bộ là GIẢ**
//   (`CLAUDE.md` mục 9). Bài kiểm CHỈ ĐỌC, không ghi gì vào file ấy.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { rapCay, boCay, soSanh, coGiDeGhi, tangSoSauKhiLuu } from '../js/services/hinh-dang.js';

const DAY = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(DAY, '../../tai-lieu/giapha-nguyen-trong-bac.json');
const MA_CAY_THU = '00000000-0000-4000-8000-000000000001';

let dat = 0;
let hong = 0;

function kiem(ten, dung, chiTiet) {
  if (dung) { dat++; console.log('  ĐẠT  ' + ten); }
  else { hong++; console.log('  HỎNG ' + ten + (chiTiet ? '\n        ' + chiTiet : '')); }
}

// ------------------------------------------------------------
// Dựng bối cảnh: file JSON thật → dòng → cây
// ------------------------------------------------------------
//
// ⚠ `tai-lieu/` CỐ Ý nằm NGOÀI repo này (chủ dự án chốt 03/09/2026). Nó là
//   bản sao Knowledge Base dùng chung cho cả hai nhánh, và repo này để Public
//   nên đẩy 87 bước nhật ký thiết kế lên đó là việc không gỡ lại được.
//
//   Hệ quả: ai tải repo về từ GitHub sẽ KHÔNG có file dữ liệu, và bài kiểm
//   này chết bằng một câu `ENOENT` chẳng nói được gì. Nên bắt trước, và nói
//   rõ đây là chuyện bình thường chứ không phải bộ kiểm hỏng.
if (!existsSync(FILE)) {
  console.log('BỎ QUA — không tìm thấy file gia phả thử:\n  ' + FILE + '\n');
  console.log('Đây KHÔNG phải lỗi của bộ kiểm. Thư mục `tai-lieu/` cố ý nằm');
  console.log('ngoài repo `giapha-supabase`, nên bài kiểm này chỉ chạy được');
  console.log('trên máy chủ dự án, nơi có sẵn `Claude_Code/tai-lieu/`.');
  process.exit(0);
}

const goc = JSON.parse(readFileSync(FILE, 'utf8'));

// File trên Drive không có `imports` nếu lập trước 29/08/2026, và `changeLog`
// của nó mang đủ ngày giờ. Chuẩn hoá về đúng hình mà `rapCay` sinh ra, để
// phép so khứ hồi so đúng thứ đáng so.
for (const ten of ['persons', 'unions', 'media', 'sources', 'changeLog', 'imports']) {
  if (!Array.isArray(goc[ten])) goc[ten] = [];
}

const dong = boCay(goc, MA_CAY_THU);

// `rapCay` chờ đúng hình mà `sb.layDong()` trả về — trong đó nhật ký đã rút
// gọn còn một cột mã. Rút ở đây cho khớp.
dong.maNhatKy = [];
for (const m of goc.changeLog) {
  if (m && m.target) dong.maNhatKy.push(m.target);
  if (m && m.diff) for (const k of Object.keys(m.diff)) dong.maNhatKy.push(k);
}
dong.tree.created_at = new Date().toISOString();
dong.tree.updated_at = new Date().toISOString();

const lai = rapCay(dong);

console.log('Gia phả thử: ' + goc.persons.length + ' người, ' +
            goc.unions.length + ' hôn nhân, ' +
            goc.media.length + ' ảnh\n');

// ------------------------------------------------------------
// 1. Khứ hồi — không được rơi rụng trường nào
// ------------------------------------------------------------
console.log('1. Khứ hồi cây → dòng → cây');

kiem('số người giữ nguyên', lai.persons.length === goc.persons.length,
     goc.persons.length + ' → ' + lai.persons.length);
kiem('số hôn nhân giữ nguyên', lai.unions.length === goc.unions.length);
kiem('số ảnh giữ nguyên', lai.media.length === goc.media.length);

// So từng người trên từng trường. Không so bằng `JSON.stringify` cả mảng: khi
// hỏng thì nó chỉ nói "khác nhau" mà không nói khác ở đâu, và với 59 người
// thì đi tìm bằng mắt là một buổi tối.
const cheoLech = [];
const theoMa = new Map(lai.persons.map((p) => [p.id, p]));
for (const p of goc.persons) {
  const q = theoMa.get(p.id);
  if (!q) { cheoLech.push(p.id + ': mất hẳn'); continue; }
  for (const k of Object.keys(p)) {
    const a = JSON.stringify(p[k] === undefined ? null : p[k]);
    const b = JSON.stringify(q[k] === undefined ? null : q[k]);
    if (a !== b) cheoLech.push(p.id + '.' + k + ': ' + a + ' → ' + b);
  }
}
kiem('mọi trường của mọi người về nguyên vẹn', cheoLech.length === 0,
     cheoLech.slice(0, 8).join('\n        '));

const conGoc = goc.unions.reduce((t, u) => t + (u.children || []).length, 0);
const conLai = lai.unions.reduce((t, u) => t + (u.children || []).length, 0);
kiem('số quan hệ cha mẹ–con giữ nguyên', conGoc === conLai,
     conGoc + ' → ' + conLai);

// Con phải về đúng cặp, đúng quan hệ, đúng thứ tự.
const lechCon = [];
const unionLai = new Map(lai.unions.map((u) => [u.id, u]));
for (const u of goc.unions) {
  const v = unionLai.get(u.id);
  if (!v) { lechCon.push(u.id + ': mất hẳn'); continue; }
  const a = (u.children || []).map((c) => c.personId + '/' + (c.relation || 'birth')).sort();
  const b = (v.children || []).map((c) => c.personId + '/' + (c.relation || 'birth')).sort();
  if (JSON.stringify(a) !== JSON.stringify(b)) lechCon.push(u.id + ': ' + a + ' → ' + b);
}
kiem('con về đúng cặp và đúng quan hệ', lechCon.length === 0,
     lechCon.slice(0, 5).join('\n        '));

// ------------------------------------------------------------
// 2. So cây với chính nó — phải RỖNG
// ------------------------------------------------------------
console.log('\n2. So một cây với chính nó');

const opsRong = soSanh(lai, JSON.parse(JSON.stringify(lai)));
kiem('không có gì để ghi', !coGiDeGhi(opsRong), keOps(opsRong));

// ⚠ Phép so thật sự đắt giá: cây RÁP TỪ DÒNG so với cây ĐỌC TỪ FILE. Hai bản
//   này có cùng nội dung nhưng thứ tự khoá khác nhau — bản đầu theo bảng tên,
//   bản sau theo cách `domains/person.js` dựng ra. Nếu `bangNhau()` lỡ so
//   bằng `JSON.stringify` thì đúng chỗ này lộ ra, và chỉ đúng chỗ này.
const opsCheo = soSanh(lai, goc);
kiem('cây ráp từ dòng và cây đọc từ file là MỘT',
     !coGiDeGhi(opsCheo), keOps(opsCheo));

// ------------------------------------------------------------
// 3. Sửa một chỗ — phải ra đúng một chỗ
// ------------------------------------------------------------
console.log('\n3. Sửa một chỗ');

const sua = JSON.parse(JSON.stringify(lai));
sua.persons[0].note = 'ghi chú thử ' + Date.now();
const ops1 = soSanh(lai, sua);
kiem('đổi ghi chú một người → đúng 1 dòng persons',
     ops1.persons.luu.length === 1 && ops1.persons.xoa.length === 0,
     keOps(ops1));
kiem('và không đụng bảng nào khác',
     ops1.unions.luu.length === 0 && ops1.children.luu.length === 0 &&
     ops1.media.luu.length === 0 && ops1.sources.luu.length === 0,
     keOps(ops1));
kiem('dòng gửi lên mang tên cột snake_case',
     Object.prototype.hasOwnProperty.call(ops1.persons.luu[0], 'photo_file_id') &&
     !Object.prototype.hasOwnProperty.call(ops1.persons.luu[0], 'photoFileId'),
     Object.keys(ops1.persons.luu[0]).join(', '));

// Xoá mềm phải đi đường `luu`, không đi đường `xoa`.
const xoaMem = JSON.parse(JSON.stringify(lai));
xoaMem.persons[1].deleted = true;
const ops2 = soSanh(lai, xoaMem);
kiem('xoá MỀM đi đường luu, không đi đường xoa',
     ops2.persons.luu.length === 1 && ops2.persons.xoa.length === 0,
     keOps(ops2));

// Xoá thật (dọn thùng rác) mới sinh ra `xoa`.
const xoaThat = JSON.parse(JSON.stringify(lai));
const maBoDi = xoaThat.persons[2].id;
xoaThat.persons.splice(2, 1);
const ops3 = soSanh(lai, xoaThat);
kiem('xoá THẬT sinh ra đúng một mã trong xoa',
     ops3.persons.xoa.length === 1 && ops3.persons.xoa[0] === maBoDi,
     keOps(ops3));

// Đổi thứ tự con phải sinh ra dòng con, không sinh ra dòng hôn nhân.
const doiCon = JSON.parse(JSON.stringify(lai));
const uCoCon = doiCon.unions.find((u) => (u.children || []).length > 0);
if (uCoCon) {
  uCoCon.children[0].order = (uCoCon.children[0].order || 1) + 100;
  const ops4 = soSanh(lai, doiCon);
  kiem('đổi thứ tự một người con → 1 dòng children, 0 dòng unions',
       ops4.children.luu.length === 1 && ops4.unions.luu.length === 0,
       keOps(ops4));
} else {
  console.log('  BỎ QUA  không có cặp nào có con để thử');
}

// ------------------------------------------------------------
// 4. Cột `not null` không bao giờ được nhận `null`
// ------------------------------------------------------------
//
// ⚠ PHÉP KIỂM NÀY SINH RA TỪ MỘT LỖI THẬT (03/09/2026). Lần thêm người đầu
//   tiên trên app thật báo:
//     null value in column "vn" of relation "persons" violates not-null
//   `domains/person.js` dựng người mới không có khoá `vn` — đúng, vì `vn`
//   chỉ mọc ra khi người dùng điền Đời / Chi / ngày giỗ. `veBang()` khi ấy
//   đổi mọi khoá thiếu thành `null`, và `default` của Postgres không cứu:
//   `luu_cay()` đi qua `jsonb_populate_recordset`, nơi khoá thiếu cho ra
//   `null` chứ không cho ra `default`.
//
// Danh sách cột đọc THẲNG từ `luoc-do/01-bang.sql`, không chép tay. Chép tay
// thì ngày ai đó thêm một cột `not null` mới, bộ kiểm vẫn xanh — mà đó đúng
// là ngày cần nó đỏ.
console.log('\n4. Cột not null không nhận null');

const FILE_SQL = resolve(DAY, '../luoc-do/01-bang.sql');
const sql = readFileSync(FILE_SQL, 'utf8');

/** Tên các cột `not null` của một bảng, đọc từ file SQL. */
function cotBatBuoc(tenBang) {
  const m = sql.match(new RegExp('create table if not exists public\\.' +
                                 tenBang + '\\s*\\(([\\s\\S]*?)\\n\\);'));
  if (!m) return null;
  const ra = [];
  for (const dong of m[1].split('\n')) {
    const sach = dong.replace(/--.*$/, '').trim();
    if (!/not null/i.test(sach)) continue;
    const ten = sach.match(/^([a-z_]+)\s+/);
    if (!ten) continue;                       // primary key / foreign key / constraint
    if (['primary', 'foreign', 'constraint', 'unique', 'check'].includes(ten[1])) continue;
    if (ten[1] === 'tree_id') continue;        // `luu_cay()` tự gắn, không đi qua veBang
    ra.push(ten[1]);
  }
  // Cột `not null` THÊM VÀO hay BỎ ĐI sau `01`. Đọc các file theo ĐÚNG thứ tự
  // số, vì thứ tự chính là lịch sử: `25` thêm `noi_ve`, `26` bỏ nó đi — đọc
  // ngược thì bộ kiểm đòi một cột đã chết.
  //
  // ⚠ Chỉ đọc `add column` thì lỗi đi theo chiều kia: bộ kiểm bắt `hinh-dang.js`
  //   khai một cột máy chủ không còn, tức bắt app ghi rác. Đã xảy ra ở b122b.
  const dsFile = readdirSync(dirname(FILE_SQL))
    .filter((x) => x.endsWith('.sql')).sort();
  for (const f of dsFile) {
    const van = readFileSync(resolve(dirname(FILE_SQL), f), 'utf8');
    const re = new RegExp('alter table public\\.' + tenBang + '\\s+([^;]*);', 'g');
    for (const khoi of van.matchAll(re)) {
      for (const c of khoi[1].matchAll(/add column if not exists ([a-z_]+)([^,]*)/g)) {
        if (/not null/i.test(c[2]) && !ra.includes(c[1])) ra.push(c[1]);
      }
      for (const c of khoi[1].matchAll(/drop column (?:if exists )?([a-z_]+)/g)) {
        const i = ra.indexOf(c[1]);
        if (i !== -1) ra.splice(i, 1);
      }
    }
  }
  return ra;
}

// Người mới TOANH, dựng đúng như `domains/person.js` dựng: không có `vn`,
// không có `branchId`. Đây chính là bản ghi đã làm hỏng app thật.
const nguoiMoiToanh = {
  id: 'P9999',
  uid: 'THU_P9999',
  names: [], sex: 'U',
  birth: { iso: null, raw: '', place: '' },
  death: { iso: null, raw: '', place: '' },
  burialPlace: '', title: '', occupation: '', education: '',
  religion: '', residence: '', nationality: '',
  living: true, photoFileId: '', note: '', deleted: false,
  meta: { createdAt: '', updatedAt: '', updatedBy: '' },
};

const cayThemNguoi = JSON.parse(JSON.stringify(lai));
cayThemNguoi.persons.push(nguoiMoiToanh);
const opsThem = soSanh(lai, cayThemNguoi);

kiem('thêm một người → đúng 1 dòng persons',
     opsThem.persons.luu.length === 1, keOps(opsThem));

// Quét CẢ BỐN bảng, không chỉ `persons`. Cùng một cái sai nằm sẵn ở `unions`
// (`ranks`, `partner_order`), chỉ là chưa ai chạm tới nó.
const BANG = [
  ['persons',  'persons'],
  ['unions',   'unions'],
  ['media',    'media'],
  ['sources',  'sources'],
];

// ⚠ PHÉP KIỂM CỦA PHÉP KIỂM. `cotBatBuoc()` đọc file SQL bằng biểu thức
//   chính quy; hỏng biểu thức ấy thì nó trả về danh sách RỖNG, và phép quét
//   dưới đây sẽ "đạt" mà chẳng kiểm gì cả. Một bộ kiểm xanh vì không kiểm gì
//   còn tệ hơn không có bộ kiểm, nên đếm luôn ở đây.
const demCot = BANG.map(([t]) => t + '=' + (cotBatBuoc(t) || []).length).join(' · ');
kiem('đọc được danh sách cột not null từ 01-bang.sql',
     (cotBatBuoc('persons') || []).length >= 15 &&
     (cotBatBuoc('unions')  || []).length >= 7 &&
     (cotBatBuoc('media')   || []).length >= 6 &&
     (cotBatBuoc('sources') || []).length >= 3,
     demCot);

const nullSai = [];
for (const [tenBang, tenOps] of BANG) {
  const batBuoc = cotBatBuoc(tenBang);
  if (batBuoc === null) { nullSai.push(tenBang + ': không đọc được lược đồ'); continue; }

  // Mọi dòng sinh ra trong bài kiểm này: dòng của `boCay` (cả cây) và dòng
  // của `soSanh` (chỉ phần đổi). Cả hai đường đều phải sạch.
  const dsDong = (dong[tenBang] || []).concat(opsThem[tenOps] ? opsThem[tenOps].luu : []);
  for (const d of dsDong) {
    for (const c of batBuoc) {
      if (d[c] === null || d[c] === undefined) {
        nullSai.push(tenBang + '.' + c + ' = null  (dòng ' + (d.id || '?') + ')');
      }
    }
  }
}

kiem('cột not null thêm sau 01 cũng được đọc (persons.revision của 26)',
     (cotBatBuoc('persons') || []).includes('revision'), demCot);

// Chiều ngược, và nó cũng đắt như chiều kia: đòi một cột máy chủ đã bỏ nghĩa
// là bắt `hinh-dang.js` ghi rác xuống. `25` thêm `noi_ve`, `26` bỏ đi.
kiem('cột đã bị bỏ sau đó thì thôi đòi (persons.noi_ve bỏ ở 26)',
     !(cotBatBuoc('persons') || []).includes('noi_ve'), demCot);

kiem('không dòng nào có null ở cột not null', nullSai.length === 0,
     [...new Set(nullSai)].slice(0, 8).join('\n        '));

// Và mỗi người mới phải mang một object `vn` RIÊNG, không dùng chung.
if (opsThem.persons.luu.length === 1) {
  const a = opsThem.persons.luu[0];
  const cayHaiNguoi = JSON.parse(JSON.stringify(cayThemNguoi));
  cayHaiNguoi.persons.push({ ...nguoiMoiToanh, id: 'P9998', uid: 'THU_P9998' });
  const hai = soSanh(lai, cayHaiNguoi).persons.luu;
  kiem('hai người mới không dùng chung một object vn',
       hai.length === 2 && hai[0].vn !== hai[1].vn && hai[0].birth !== hai[1].birth,
       'số dòng = ' + hai.length);
  kiem('vn của người mới là {} chứ không phải null',
       a.vn !== null && typeof a.vn === 'object' && Object.keys(a.vn).length === 0,
       JSON.stringify(a.vn));
}

// ------------------------------------------------------------
// 5. Số chống ghi đè — LƯU HAI LẦN LIỀN NHAU
// ------------------------------------------------------------
//
// ⚠ ĐÂY LÀ PHÉP CANH ĐIỂM DỪNG CỦA b122b. Máy chủ `luoc-do/26` tăng `revision`
//   của từng dòng nó vừa ghi. `repo.luuCay()` CỐ Ý không nạp lại cây, nên bản
//   sao trong tay còn mang số CŨ — gửi lên lần thứ hai là `GP409`, và màn hình
//   nói "người khác vừa sửa" trong khi không có người khác nào cả.
//
//   Bài kiểm dựng lại đúng vòng ấy mà không cần Supabase: lưu → giả lập máy
//   chủ tăng số → `tangSoSauKhiLuu()` → so lại. Số trong tay phải KHỚP số máy
//   chủ đang giữ, không thì lần lưu thứ hai hỏng.
console.log('\n5. Số chống ghi đè qua hai lần lưu');

/** Đúng hai luật của trigger `chan_ghi_de_ban_ghi`, không hơn. */
function mayChuGhi(kho, khoa, dong) {
  const cu = kho.get(khoa);
  if (cu === undefined) {           // dòng mới: gửi 0, lưu thành 1
    kho.set(khoa, 1);
    return dong.revision === 0;
  }
  if (dong.revision !== cu) return false;   // GP409 — số cũ hoặc thiếu
  kho.set(khoa, cu + 1);
  return true;
}

{
  // Kho số của "máy chủ": mọi bản ghi đang có, theo đúng số cây thử mang sẵn.
  const kho = new Map();
  for (const p of lai.persons) kho.set('p:' + p.id, p.revision);
  for (const u of lai.unions) {
    kho.set('u:' + u.id, u.revision);
    for (const c of u.children || []) kho.set('c:' + u.id + '|' + c.personId, c.revision);
  }

  const trongTay = JSON.parse(JSON.stringify(lai));
  const uCon = trongTay.unions.find((u) => (u.children || []).length > 0);

  const motLuot = (n) => {
    const sua = JSON.parse(JSON.stringify(trongTay));
    sua.persons[0].note = 'ghi chú lượt ' + n;
    const u = sua.unions.find((x) => uCon && x.id === uCon.id);
    if (u) u.children[0].order = (u.children[0].order || 1) + n;

    const ops = soSanh(trongTay, sua);
    let mayChuGat = true;
    for (const d of ops.persons.luu)  if (!mayChuGhi(kho, 'p:' + d.id, d)) mayChuGat = false;
    for (const d of ops.unions.luu)   if (!mayChuGhi(kho, 'u:' + d.id, d)) mayChuGat = false;
    for (const d of ops.children.luu) {
      if (!mayChuGhi(kho, 'c:' + d.union_id + '|' + d.person_id, d)) mayChuGat = false;
    }
    if (mayChuGat) tangSoSauKhiLuu(sua, ops);
    // Máy chủ gật thì bản sao mới thành bản đang giữ — đúng `repo.luuCay()`.
    if (mayChuGat) { trongTay.persons = sua.persons; trongTay.unions = sua.unions; }
    return { ops, mayChuGat };
  };

  const l1 = motLuot(1);
  kiem('lượt 1 — máy chủ nhận', l1.mayChuGat, keOps(l1.ops));
  kiem('lượt 1 — có gửi kèm số chống ghi đè',
       l1.ops.persons.luu.length > 0 &&
       Number.isFinite(l1.ops.persons.luu[0].revision),
       JSON.stringify(l1.ops.persons.luu[0] && l1.ops.persons.luu[0].revision));

  const l2 = motLuot(2);
  kiem('lượt 2 — máy chủ VẪN nhận (không xungdot)', l2.mayChuGat, keOps(l2.ops));

  if (uCon) {
    kiem('con cũng mang số qua được hai lượt',
         l2.ops.children.luu.length === 1 &&
         Number.isFinite(l2.ops.children.luu[0].revision),
         keOps(l2.ops));
  }

  // Người MỚI phải gửi `0` — giao ước "dòng này chưa ai giữ".
  const themMoi = JSON.parse(JSON.stringify(trongTay));
  themMoi.persons.push({ id: 'P9998', names: [], sex: 'U' });
  const opsMoi = soSanh(trongTay, themMoi).persons.luu.find((d) => d.id === 'P9998');
  kiem('người mới gửi revision = 0', opsMoi && opsMoi.revision === 0,
       opsMoi ? String(opsMoi.revision) : 'không thấy dòng P9998');

  // Và chiều ngược: KHÔNG đặt lại số thì lượt sau phải HỎNG. Không có phép
  // này thì phép trên có thể xanh vì một lý do chẳng liên quan gì.
  const kho2 = new Map(kho);
  const banCu = JSON.parse(JSON.stringify(trongTay));
  const suaTiep = JSON.parse(JSON.stringify(banCu));
  suaTiep.persons[0].note = 'ghi chú lượt 3';
  const ops5 = soSanh(banCu, suaTiep);
  for (const d of ops5.persons.luu) mayChuGhi(kho2, 'p:' + d.id, d);   // máy chủ tăng số
  const suaNua = JSON.parse(JSON.stringify(suaTiep));                   // KHÔNG tangSoSauKhiLuu
  suaNua.persons[0].note = 'ghi chú lượt 4';
  const ops6 = soSanh(suaTiep, suaNua);
  let hongNhuMongDoi = false;
  for (const d of ops6.persons.luu) if (!mayChuGhi(kho2, 'p:' + d.id, d)) hongNhuMongDoi = true;
  kiem('bỏ bước đặt lại số thì lượt sau HỎNG (kiểm chứng ngược)', hongNhuMongDoi,
       'máy chủ vẫn nhận — nghĩa là phép kiểm trên không chứng minh được gì');
}

// ------------------------------------------------------------
console.log('\n' + (hong === 0 ? 'TẤT CẢ ĐẠT' : 'CÓ PHÉP HỎNG') +
            ' — ' + dat + ' đạt, ' + hong + ' hỏng.');
process.exitCode = hong === 0 ? 0 : 1;

function keOps(ops) {
  const phan = [];
  for (const ten of ['persons', 'unions', 'children', 'media', 'sources']) {
    const o = ops[ten];
    if (o && (o.luu.length || o.xoa.length)) {
      phan.push(ten + ' luu=' + o.luu.length + ' xoa=' + o.xoa.length);
    }
  }
  if (ops.tree) phan.push('khối cây đổi');
  return phan.length ? phan.join(' · ') : '(rỗng)';
}
