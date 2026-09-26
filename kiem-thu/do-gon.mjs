// ============================================================
// giapha-supabase · kiem-thu/do-gon.mjs
// Vai trò  : Đo RÁC và cỡ những file tốn token — phép 10 của /kiem-tra.
//            Luật và lý do: QUY-TAC-GON.md. Trần: bảng TRAN + DAU_PHIEN dưới.
// Chạy     : node supabase/kiem-thu/do-gon.mjs             (từ Claude_Code)
//            node supabase/kiem-thu/do-gon.mjs --tat-ca    (in hết nợ cũ)
//            node supabase/kiem-thu/do-gon.mjs --ha-moc    (nợ đã giảm → khoá mức mới)
//            node supabase/kiem-thu/do-gon.mjs --lap-moc   (chỉ chạy được khi chưa có sổ)
// Phiên bản: 0.2.1 · Cập nhật: 26/09/2026 22:42 — nới trần CLAUDE.md 17500→18500
// ============================================================
//
// LỖI    — vượt trần mà không có trong sổ nợ, hoặc nợ cũ TĂNG. Thoát mã 1.
// NỢ CŨ  — vượt trần từ trước ngày lập sổ, chưa tăng. Không chặn, trả dần.
// XEM    — chỉ để biết, không có trần.
//
// Sổ nợ `moc-gon.json` chỉ được HẠ: --ha-moc xoá khoản đã về dưới trần và hạ
// khoản đã giảm; không bao giờ thêm khoản mới hay nâng khoản cũ. Muốn nâng là
// muốn nới trần — sửa bảng dưới đây và ghi lý do vào lời commit.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DAY = path.dirname(fileURLToPath(import.meta.url));   // supabase/kiem-thu
const REPO = path.resolve(DAY, '..');                        // supabase
const GOC = path.resolve(REPO, '..');                        // Claude_Code
const SO_NO = path.join(DAY, 'moc-gon.json');

const TRAN = {
  dauFile: 30,     // dòng ghi chú liền nhau từ dòng 1, mỗi file trong js/
  dongIndex: 250,  // ký tự mỗi dòng nhat-ky/INDEX.md
  maDai: 1500,     // dòng một file mã — chỉ XEM
  nhatKy: 43,      // số file nhat-ky/b*.md — ĐÓNG 15/09/2026, không được tăng
  soTay: 12000,    // byte mỗi so-tay/*.md — vượt thì tách chức năng nhỏ hơn
};

// File nạp ở đầu MỌI phiên: [đường dẫn từ Claude_Code, trần dòng, trần byte, trần ký tự/dòng]
const DAU_PHIEN = [
  ['CLAUDE.md', 300, 18500, 250],
  ['.claude/memory/MEMORY.md', 100, 8000, 250],
  ['supabase/CHI-DAN.md', 80, 8000, 400],
  ['supabase/KE-HOACH.md', 250, 15000, 500],
];

// 10 file domains chép nguyên từ bản Apps Script — phép 9 bắt giống hệt từng
// byte, nên ghi chú đầu file của chúng cũng không được cắt.
const CHEP_NGUYEN = new Set(['bloodline', 'excel', 'gedcom', 'layout', 'media',
  'person', 'purge', 'render', 'union', 'validate']);

const BO_QUA = new Set(['.git', 'vendor', 'node_modules']);

const docChu = (p) => fs.readFileSync(p, 'utf8');
// Dấu xuống dòng cuối file không mở thêm một dòng — đếm khớp `wc -l`.
const cacDong = (s) => s.replace(/\r?\n$/, '').split(/\r?\n/);
// Bỏ `\r` trước khi đếm byte: git trên Windows đổi LF ↔ CRLF lúc checkout, nội
// dung không đổi mà mỗi dòng nặng thêm 1 byte — không được thành "nợ tăng".
const soByte = (s) => Buffer.byteLength(s.replace(/\r/g, ''));
const tuongDoi = (p) => path.relative(REPO, p).split(path.sep).join('/');

/** Mọi file dưới `thu`, bỏ .git / vendor. Cây thư mục không có vòng (không theo liên kết). */
function duyet(thu) {
  const kq = [];
  for (const muc of fs.readdirSync(thu, { withFileTypes: true })) {
    if (BO_QUA.has(muc.name)) continue;
    const p = path.join(thu, muc.name);
    if (muc.isDirectory()) kq.push(...duyet(p));
    else if (muc.isFile()) kq.push(p);
  }
  return kq;
}

const laChepNguyen = (rel) =>
  rel.startsWith('js/domains/') && CHEP_NGUYEN.has(path.basename(rel, '.js'));

// ── Đo ──────────────────────────────────────────────────────
const doDuoc = [];   // { khoa, nhan, gt, tran, dv }
const xem = [];

const fileJs = duyet(path.join(REPO, 'js')).filter((p) => p.endsWith('.js'));
const troSai = [];

// 1. Ghi chú đầu file + dòng `Sổ tay:` phải trỏ tới file có thật
for (const p of fileJs) {
  const rel = tuongDoi(p);
  const dong = cacDong(docChu(p));
  let n = 0;
  while (n < dong.length && dong[n].startsWith('//')) n++;
  for (const d of dong.slice(0, n)) {
    const m = d.match(/^\/\/\s*Sổ tay\s*:\s*(\S+)/);
    if (m && !fs.existsSync(path.join(REPO, m[1]))) troSai.push(`${rel} → ${m[1]}`);
  }
  if (laChepNguyen(rel)) continue;
  doDuoc.push({ khoa: `dau-file:${rel}`, nhan: `ghi chú đầu file · ${rel}`, gt: n, tran: TRAN.dauFile, dv: 'dòng' });
  if (dong.length > TRAN.maDai) xem.push(`${dong.length} dòng · ${rel} (cân nhắc tách — V6)`);
}
doDuoc.push({ khoa: 'so-tay:tro-sai', nhan: `dòng "Sổ tay:" trỏ tới file không có: ${troSai.join(' · ') || '—'}`, gt: troSai.length, tran: 0, dv: 'dòng' });

// 2. File nạp đầu phiên
for (const [rel, tDong, tByte, tDai] of DAU_PHIEN) {
  const p = path.join(GOC, rel);
  if (!fs.existsSync(p)) { xem.push(`không thấy ${rel} — bỏ qua`); continue; }
  const chu = docChu(p);
  const dong = cacDong(chu);
  const dai = Math.max(...dong.map((d) => d.length));
  doDuoc.push({ khoa: `${rel}:dong`, nhan: `${rel} — số dòng`, gt: dong.length, tran: tDong, dv: 'dòng' });
  doDuoc.push({ khoa: `${rel}:byte`, nhan: `${rel} — cỡ file`, gt: soByte(chu), tran: tByte, dv: 'byte' });
  doDuoc.push({ khoa: `${rel}:dai`, nhan: `${rel} — dòng dài nhất`, gt: dai, tran: tDai, dv: 'ký tự' });
}

// 3. Nhật ký theo phiên — đã đóng: không thêm file; INDEX không thêm dòng dài
{
  const thu = path.join(REPO, 'nhat-ky');
  const soFile = fs.readdirSync(thu).filter((t) => /^b.*\.md$/.test(t)).length;
  doDuoc.push({ khoa: 'nhat-ky:so-file', nhan: 'nhat-ky/b*.md — ĐÓNG 15/09/2026, bài học ghi vào so-tay/', gt: soFile, tran: TRAN.nhatKy, dv: 'file' });
  const dong = cacDong(docChu(path.join(thu, 'INDEX.md')));
  const n = dong.filter((d) => d.length > TRAN.dongIndex).length;
  doDuoc.push({ khoa: 'index:dong-dai', nhan: `nhat-ky/INDEX.md — số dòng dài quá ${TRAN.dongIndex} ký tự`, gt: n, tran: 0, dv: 'dòng' });
}

// 4. Sổ tay — mỗi sổ một trần byte
{
  const thu = path.join(REPO, 'so-tay');
  if (fs.existsSync(thu)) {
    for (const t of fs.readdirSync(thu).filter((x) => x.endsWith('.md'))) {
      const b = soByte(docChu(path.join(thu, t)));
      doDuoc.push({ khoa: `so-tay:${t}:byte`, nhan: `so-tay/${t} — cỡ file`, gt: b, tran: TRAN.soTay, dv: 'byte' });
    }
  }
}

// 5. Tài liệu ở gốc repo sai quy ước tên
{
  const sai = fs.readdirSync(REPO).filter((t) => t.endsWith('.md') && (/_V\d+/.test(t) || t.includes(' ')));
  doDuoc.push({ khoa: 'ten-sai', nhan: `tài liệu sai quy ước tên: ${sai.join(' · ') || '—'}`, gt: sai.length, tran: 0, dv: 'file' });
}

// 6. File mã không ai nhắc tên
{
  const kho = duyet(REPO)
    .filter((p) => /\.(js|mjs|html)$/.test(p))
    .map((p) => [p, docChu(p)]);
  const khongAi = fileJs.filter((p) => {
    const ten = path.basename(p);
    const mau = new RegExp(`[/'"\`]${ten.replace(/[.-]/g, '\\$&')}`);
    return !kho.some(([q, chu]) => q !== p && mau.test(chu));
  }).map(tuongDoi);
  doDuoc.push({ khoa: 'khong-ai-dung', nhan: `file mã không ai nhắc tên: ${khongAi.join(' · ') || '—'}`, gt: khongAi.length, tran: 0, dv: 'file' });
}

// 7. Dấu TẠM — chỉ XEM
{
  const noi = [...fileJs, path.join(REPO, 'QuanTri.html'), path.join(REPO, 'quan-tri.css')].filter(fs.existsSync);
  let coBuoc = 0, khongBuoc = 0;
  for (const p of noi) {
    for (const d of cacDong(docChu(p))) {
      if (!d.includes('TẠM')) continue;
      if (/TẠM\s*\(b\d+/.test(d)) coBuoc++; else khongBuoc++;
    }
  }
  xem.push(`dấu TẠM: ${coBuoc} dòng ghi bước gỡ · ${khongBuoc} dòng không ghi (V5 — có thể chỉ là chữ thường)`);
}

// ── Sổ nợ ───────────────────────────────────────────────────
const soNo = fs.existsSync(SO_NO) ? JSON.parse(docChu(SO_NO)).no : null;
const bayGio = () => {
  const d = new Date(), h = (x) => String(x).padStart(2, '0');
  return `${h(d.getDate())}/${h(d.getMonth() + 1)}/${d.getFullYear()} ${h(d.getHours())}:${h(d.getMinutes())}`;
};
const ghiSo = (no, ghiChu) => fs.writeFileSync(SO_NO,
  JSON.stringify({ capNhat: bayGio(), ghiChu, no }, null, 2) + '\n');
const cheDo = process.argv[2] || '';

if (cheDo === '--lap-moc') {
  if (soNo) { console.log('TỪ CHỐI: sổ nợ đã có. Sổ chỉ được hạ — dùng --ha-moc.'); process.exit(2); }
  const no = Object.fromEntries(doDuoc.filter((m) => m.gt > m.tran).map((m) => [m.khoa, m.gt]));
  ghiSo(no, 'Lập sổ — mọi chỗ vượt trần tại thời điểm này. Chỉ được hạ bằng --ha-moc.');
  console.log(`Đã lập sổ nợ: ${Object.keys(no).length} khoản.`);
  process.exit(0);
}

if (cheDo === '--ha-moc') {
  if (!soNo) { console.log('TỪ CHỐI: chưa có sổ nợ.'); process.exit(2); }
  const moi = { ...soNo }, doiGi = [];
  const theoKhoa = new Map(doDuoc.map((m) => [m.khoa, m]));
  for (const k of Object.keys(moi)) {
    const m = theoKhoa.get(k);
    if (!m || m.gt <= m.tran) { delete moi[k]; doiGi.push(`đã trả · ${k}`); }
    else if (m.gt < moi[k]) { doiGi.push(`${moi[k]} → ${m.gt} · ${k}`); moi[k] = m.gt; }
  }
  if (!doiGi.length) { console.log('Không khoản nào giảm — sổ giữ nguyên.'); process.exit(0); }
  ghiSo(moi, 'Hạ bằng --ha-moc.');
  console.log(`Đã hạ sổ nợ (${Object.keys(moi).length} khoản còn lại):\n  ` + doiGi.join('\n  '));
  process.exit(0);
}

// ── Báo cáo ─────────────────────────────────────────────────
const loi = [], no = [], daGiam = [];
for (const m of doDuoc) {
  const moc = soNo?.[m.khoa];
  if (m.gt <= m.tran) { if (moc !== undefined) daGiam.push(`đã trả · ${m.nhan}`); continue; }
  if (moc !== undefined && m.gt <= moc) {
    no.push(m);
    if (m.gt < moc) daGiam.push(`${moc} → ${m.gt} ${m.dv} · ${m.nhan}`);
    continue;
  }
  loi.push({ ...m, moc });
}

const dong = (m) => `${String(m.gt).padStart(6)} ${m.dv} (trần ${m.tran}) · ${m.nhan}`;
console.log('ĐO GỌN · phép 10 /kiem-tra');
if (!soNo) console.log('⚠ chưa có sổ nợ moc-gon.json — mọi chỗ vượt trần đều là LỖI');
console.log(`\nLỖI: ${loi.length}`);
for (const m of loi) console.log(`  ${dong(m)}${m.moc !== undefined ? ` — nợ cũ ${m.moc}, đã TĂNG` : ''}`);

no.sort((a, b) => b.gt / Math.max(b.tran, 1) - a.gt / Math.max(a.tran, 1));
const soIn = process.argv.includes('--tat-ca') ? no.length : 6;
console.log(`\nNỢ CŨ: ${no.length} khoản (chưa tăng → ĐẠT)`);
for (const m of no.slice(0, soIn)) console.log(`  ${dong(m)}`);
if (no.length > soIn) console.log(`  … còn ${no.length - soIn} khoản — thêm --tat-ca để in hết`);

if (daGiam.length) {
  console.log('\nĐÃ GIẢM — chạy --ha-moc để khoá mức mới:');
  for (const d of daGiam) console.log(`  ${d}`);
}
if (xem.length) {
  console.log('\nXEM:');
  for (const d of xem) console.log(`  ${d}`);
}
console.log(`\nKẾT QUẢ: ${loi.length ? 'LỖI' : 'ĐẠT'}`);
process.exit(loi.length ? 1 : 0);
