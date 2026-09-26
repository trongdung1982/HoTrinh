// ============================================================
// giapha-supabase · js/pages/quan-tri/trang-nguoi.js
// Vai trò  : Trang con `#gia-pha/cay/<mã>/nguoi` — BẢNG PHẲNG mọi người của
//            một cây, như một trang tính: tìm, sắp xếp, phân trang, sửa tại
//            chỗ từng ô rồi Lưu theo DÒNG qua `luu_cay()`. Cột *Tài khoản*
//            chỉ để XEM ai đang gắn với người này (b126d).
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb · services/hinh-dang · domains/person ·
//            utils/{text,date} · quan-tri/trang-cay · quan-tri/o-bang
// Phiên bản: 0.2.0 · Cập nhật: 26/09/2026 (b125c) — sửa tại chỗ + Lưu theo dòng
// Sổ tay   : so-tay/trang-quan-tri.md · so-tay/luu-mot-dong-quan-tri.md
// ============================================================
//
// ⚠ Section `#tree-people` + ô nhập/nút Lưu KHÔNG có trong prototype quantri3
//   — dựng mới 23/09 (b125a), sửa tại chỗ thêm ở b125c.
//
// ⚠ Vì sao đi thẳng `sb.luuCay()`/`hinh-dang` thay vì `repo.luuCay()`, vì sao
//   khoá cả bảng lúc đang Lưu, vì sao tách "Họ và tên" kiểu HỌ-đầu/TÊN-cuối:
//   `so-tay/luu-mot-dong-quan-tri.md`.
//
// ⚠ Quyền sửa CẢ CÂY đọc từ `cay.suaDuoc`; trực hệ hẹp hơn do MÁY CHỦ tự chặn
//   lúc Lưu — trang không tính trước, chỉ hiện đúng câu máy chủ trả về.

import { layDong, dsThanhVien, luuCay } from '../../services/sb.js';
import { rapCay, soSanh, coGiDeGhi, tangSoSauKhiLuu } from '../../services/hinh-dang.js';
import { updatePerson } from '../../domains/person.js';
import { fullName, removeDiacritics } from '../../utils/text.js';
import { stampNow } from '../../utils/date.js';
import { timCay, cumCay, cayNho } from './trang-cay.js';
import { td, span, nutLink, nutNho, dongTrong, datHuyHieu } from './o-bang.js';

/** Bao nhiêu dòng một trang. 50 vừa một màn cuộn, và 681 người ra 14 trang. */
const MOI_TRANG = 50;

/** Trạng thái của màn hình — giữ qua các lần nạp lại, xoá khi đổi cây. */
let cayDangXem = '';
let trang = 0;
let loc = '';
let hienXoa = false;
let sapTheo = 'id';
let sapNguoc = false;

// --- Ba biến của đường GHI (b125c) — cùng đời sống với `cayDangXem` --------
let treeId = '';
let treeRevision = 0;
/** Mã người → bản ghi GỐC (camelCase, có `revision`) — nền để so khi Lưu. */
let goc = new Map();
/** Đang có một lần Lưu chạy dở — chặn mọi nút Lưu khác trong lúc đó. */
let dangLuu = false;
/** `{bLuu, kiemDoi}` của mọi dòng đang vẽ — khoá/mở lại đồng loạt lúc Lưu. */
let moiDong = [];

/** Trường tự do đổi tên thẳng: cột bảng → khoá của `changes` (`domains/person.js`). */
const TRUONG_DOI = {
  oDau: 'residence', nghe: 'occupation', hoc: 'education',
  ton: 'religion', dan: 'nationality', chuc: 'title', ghi: 'note',
};

/**
 * Cột của bảng. `lay` trả CHUỖI để hiện và để tìm; `so` (nếu có) trả số dùng
 * khi sắp xếp, nhờ đó "1890" không đứng sau "195" theo thứ tự chữ. `sua`
 * đánh dấu cột sửa được tại chỗ: `'ten'` · `'sex'` · `'bool'` · `'text'`.
 * Cột `id` (mã, khoá) và `tk` (tài khoản, chuyện của Hồ sơ cá nhân — b126d)
 * không có `sua`: mãi mãi chỉ xem ở bảng này.
 */
const COT = [
  { ma: 'id',    chu: 'Mã',        lay: (p) => p.id || '' },
  { ma: 'ten',   chu: 'Họ và tên', lay: (p) => fullName(p) || '(chưa có tên)', sua: 'ten' },
  { ma: 'sex',   chu: 'Giới',      lay: (p) => ({ M: 'Nam', F: 'Nữ' }[p.sex] || ''), sua: 'sex' },
  { ma: 'sinh',  chu: 'Sinh',      lay: (p) => moc(p.birth), so: (p) => nam(p.birth), sua: 'text' },
  { ma: 'mat',   chu: 'Mất',       lay: (p) => moc(p.death), so: (p) => nam(p.death), sua: 'text' },
  { ma: 'song',  chu: 'Còn sống',  lay: (p) => (p.living ? 'Còn sống' : ''), sua: 'bool' },
  { ma: 'oDau',  chu: 'Nơi ở',     lay: (p) => p.residence || '', sua: 'text' },
  { ma: 'nghe',  chu: 'Nghề',      lay: (p) => p.occupation || '', sua: 'text' },
  { ma: 'hoc',   chu: 'Học vấn',   lay: (p) => p.education || '', sua: 'text' },
  { ma: 'ton',   chu: 'Tôn giáo',  lay: (p) => p.religion || '', sua: 'text' },
  { ma: 'dan',   chu: 'Dân tộc',   lay: (p) => p.nationality || '', sua: 'text' },
  { ma: 'chuc',  chu: 'Chức danh', lay: (p) => p.title || '', sua: 'text' },
  { ma: 'tk',    chu: 'Tài khoản', lay: (p) => p.emailGan || '' },
  { ma: 'ghi',   chu: 'Ghi chú',   lay: (p) => p.note || '', sua: 'text' },
];

/** `1890` · `12/03/1890` · chữ người ta gõ — ngày trống thì ô trống. */
function moc(d) {
  if (!d) return '';
  const raw = String(d.raw || '').trim();
  if (raw) return raw;
  return String(d.iso || '').trim();
}

/** Năm để SẮP XẾP. Không có năm thì đẩy xuống cuối, không đẩy lên đầu. */
function nam(d) {
  const m = /\d{4}/.exec(moc(d) || '');
  return m ? Number(m[0]) : Number.POSITIVE_INFINITY;
}

/**
 * "Nguyễn Trọng Dũng" → `{surname, middle, given}`. Người Việt đọc HỌ · ĐỆM ·
 * TÊN, tên riêng là chữ CUỐI — đúng quy ước đã dùng ở `domains/gedcom.js`.
 * Một chữ duy nhất (biệt hiệu, tên gọi) thì coi là TÊN, không phải HỌ — gõ
 * "Bống" vào ô này không nên hoá ra một người họ "Bống".
 */
function tachHoTen(chuoi) {
  const manh = String(chuoi || '').trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  if (!manh.length) return { surname: '', middle: '', given: '' };
  if (manh.length === 1) return { surname: '', middle: '', given: manh[0] };
  return { surname: manh[0], middle: manh.slice(1, -1).join(' '), given: manh[manh.length - 1] };
}

export async function mountTrangNguoi(sec, ctx, hashLuc) {
  const $ = (id) => sec.querySelector('#' + id);
  const tb = $('tp-tbody');

  if (cayDangXem !== ctx.thamSo) {
    cayDangXem = ctx.thamSo; trang = 0; loc = '';
    goc = new Map(); treeId = ''; treeRevision = 0;
  }
  dangLuu = false; moiDong = [];

  $('tp-dau').innerHTML = '';
  dongTrong(tb, COT.length, 'Đang đọc danh sách người…');

  const { cay, loi } = await timCay(ctx);
  if (window.location.hash !== hashLuc) return;
  if (!cay) { dongTrong(tb, COT.length, loi); return; }

  for (const x of sec.querySelectorAll('[data-tree-context]')) x.textContent = cumCay(cayNho(cay));

  // Hai lời gọi song song: cây (người) và danh sách tài khoản (cột *Tài
  // khoản*). Danh sách tài khoản hỏng thì bảng người VẪN hiện — nói ra ở ô
  // đếm, đừng bỏ trắng cả bảng vì một cột.
  const [kq, kqTV] = await Promise.all([layDong(cay.fileId), dsThanhVien(cay.fileId)]);
  if (window.location.hash !== hashLuc) return;

  if (!kq.ok) {
    dongTrong(tb, COT.length, kq.loi || 'Không đọc được gia phả này.',
      () => mountTrangNguoi(sec, ctx, window.location.hash));
    return;
  }

  treeId = cay.fileId;
  treeRevision = (kq.dong.tree && Number(kq.dong.tree.revision)) || 0;

  const emailTheoMa = new Map();
  if (kqTV.ok) for (const t of kqTV.ds) if (t.maNguoi) emailTheoMa.set(t.maNguoi, t.email);

  // `goc` = bản GỐC từng người, camelCase với `revision` đi tròn — nền so
  // sánh của mọi lần Lưu. `ds` là bản HIỆN trên bảng, thêm cột `emailGan`;
  // sửa `p` (phần tử của `ds`) tại chỗ sau khi Lưu xong để khỏi đọc lại mạng.
  goc = new Map();
  const dsNguoi = rapCay(kq.dong).persons;
  for (const p of dsNguoi) goc.set(p.id, p);
  const ds = dsNguoi.map((p) => ({ ...p, emailGan: emailTheoMa.get(p.id) || '' }));

  const ve = () => veBang(sec, ds, kqTV.ok, cay, ctx, () => ve());
  ganThanhCong(sec, ve);
  ve();
}

/** Ô tìm · ô "hiện cả người đã xoá" · hai nút trang — gắn một lần mỗi lần mount. */
function ganThanhCong(sec, ve) {
  const $ = (id) => sec.querySelector('#' + id);
  const oTim = $('tp-tim');
  oTim.value = loc;
  oTim.oninput = () => { loc = oTim.value; trang = 0; ve(); };

  const oXoa = $('tp-hien-xoa');
  oXoa.checked = hienXoa;
  oXoa.onchange = () => { hienXoa = oXoa.checked; trang = 0; ve(); };

  $('tp-truoc').onclick = () => { if (trang > 0) { trang -= 1; ve(); } };
  $('tp-sau').onclick   = () => { trang += 1; ve(); };
}

function locVaSap(ds) {
  const chuoi = removeDiacritics(String(loc || '').trim().toLowerCase());
  const hop = ds.filter((p) => {
    if (!hienXoa && p.deleted) return false;
    if (!chuoi) return true;
    const soi = removeDiacritics((fullName(p) + ' ' + (p.id || '')).toLowerCase());
    return soi.includes(chuoi);
  });

  const c = COT.find((x) => x.ma === sapTheo) || COT[0];
  hop.sort((a, b) => {
    const kq = c.so
      ? c.so(a) - c.so(b)
      : String(c.lay(a)).localeCompare(String(c.lay(b)), 'vi');
    return sapNguoc ? -kq : kq;
  });
  return hop;
}

function veBang(sec, ds, docDuocTK, cay, ctx, ve) {
  const $ = (id) => sec.querySelector('#' + id);
  const hop = locVaSap(ds);
  const capSua = Boolean(cay.suaDuoc);
  const soCot = COT.length + (capSua ? 1 : 0);

  const soTrang = Math.max(1, Math.ceil(hop.length / MOI_TRANG));
  if (trang > soTrang - 1) trang = soTrang - 1;
  const dau = trang * MOI_TRANG;
  const phan = hop.slice(dau, dau + MOI_TRANG);

  $('tp-dem').textContent = ds.length + ' người trong cây'
    + (docDuocTK ? '' : ' · không đọc được cột Tài khoản');
  $('tp-loc-dem').textContent = hop.length === ds.length
    ? '' : 'Lọc còn ' + hop.length + ' người';
  datHuyHieu($('tp-trang-thai'), capSua ? 'Sửa được' : 'Chỉ xem', capSua ? '' : 'wait');

  veDau(sec, ve, capSua);

  const tb = $('tp-tbody');
  moiDong = [];
  if (!phan.length) {
    dongTrong(tb, soCot, loc ? 'Không ai khớp “' + loc + '”.' : 'Cây này chưa có người nào.');
  } else {
    tb.innerHTML = '';
    for (const p of phan) tb.append(dongNguoi(p, capSua, ctx));
  }

  $('tp-vi-tri').textContent = hop.length
    ? 'Đang xem ' + (dau + 1) + '–' + Math.min(dau + MOI_TRANG, hop.length)
      + ' / ' + hop.length + ' người · trang ' + (trang + 1) + '/' + soTrang
    : '';
  $('tp-truoc').disabled = trang === 0;
  $('tp-sau').disabled = trang >= soTrang - 1;
}

/** Hàng tiêu đề — bấm một cột là sắp theo cột ấy, bấm lại là đảo chiều. */
function veDau(sec, ve, capSua) {
  const hang = sec.querySelector('#tp-dau');
  hang.innerHTML = '';
  for (const c of COT) {
    const o = document.createElement('th');
    o.append(nutLink(c.chu + (sapTheo === c.ma ? (sapNguoc ? ' ▾' : ' ▴') : ''), () => {
      if (sapTheo === c.ma) sapNguoc = !sapNguoc;
      else { sapTheo = c.ma; sapNguoc = false; }
      ve();
    }));
    hang.append(o);
  }
  if (capSua) {
    const o = document.createElement('th');
    o.textContent = 'Lưu';
    hang.append(o);
  }
}

/** Một dòng — CHỈ XEM (chữ thường) hoặc SỬA TẠI CHỖ (ô nhập + nút Lưu). */
function dongNguoi(p, capSua, ctx) {
  const tr = document.createElement('tr');
  const oControls = {};

  for (const c of COT) {
    if (!capSua || !c.sua) {
      const chu = c.lay(p);
      const o = (c.ma === 'ten' && p.deleted)
        ? td(span('name', chu), span('sub', 'đã xoá'))
        : td(c.ma === 'ten' ? span('name', chu) : chu);
      if (c.ma === 'ghi') o.className = 'col-ghi';
      tr.append(o);
      continue;
    }
    const el = taoOSua(c, p);
    oControls[c.ma] = el;
    const o = td(el);
    if (c.ma === 'ghi') o.className = 'col-ghi';
    tr.append(o);
  }

  if (capSua) tr.append(taoOLuu(p, oControls, ctx));
  return tr;
}

/** Ô sửa của một cột — input/select/checkbox, giá trị ban đầu = giá trị hiện có. */
function taoOSua(c, p) {
  if (c.sua === 'sex') {
    const el = document.createElement('select');
    el.className = 'o-sua';
    for (const [v, chu] of [['M', 'Nam'], ['F', 'Nữ'], ['U', 'Không rõ']]) {
      const o = document.createElement('option');
      o.value = v; o.textContent = chu;
      el.append(o);
    }
    el.value = p.sex || 'U';
    return el;
  }
  if (c.sua === 'bool') {
    const el = document.createElement('input');
    el.type = 'checkbox';
    el.checked = p.living !== false;
    return el;
  }
  const el = document.createElement('input');
  el.type = 'text';
  el.className = 'o-sua' + (c.ma === 'ghi' ? ' o-sua-rong' : c.ma === 'ten' ? ' o-sua-ten' : '');
  el.value = c.ma === 'ten' ? fullName(p) : c.lay(p);
  if (c.ma === 'ten') el.placeholder = '(chưa có tên)';
  if (c.ma === 'sinh' || c.ma === 'mat') el.placeholder = 'vd: 12/03/1954';
  return el;
}

/** Giá trị trong ô có còn khớp bản GỐC không — quyết định nút Lưu mờ hay sáng. */
function daDoi(c, el, p) {
  if (c.sua === 'bool') return el.checked !== (p.living !== false);
  if (c.sua === 'sex') return el.value !== (p.sex || 'U');
  const gocChu = c.ma === 'ten' ? fullName(p) : c.lay(p);
  return el.value.trim() !== String(gocChu || '').trim();
}

/** Ô cuối dòng: nút Lưu (mờ khi chưa đổi gì) + một dòng chữ báo kết quả. */
function taoOLuu(p, oControls, ctx) {
  const oTrangThai = span('sub', '');
  const bLuu = nutNho('Lưu');
  bLuu.disabled = true;

  const kiemDoi = () => {
    if (dangLuu) return;
    bLuu.disabled = !Object.keys(oControls).some((ma) => {
      const c = COT.find((x) => x.ma === ma);
      return daDoi(c, oControls[ma], p);
    });
  };
  for (const el of Object.values(oControls)) {
    el.addEventListener('input', kiemDoi);
    el.addEventListener('change', kiemDoi);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !bLuu.disabled) { e.preventDefault(); bLuu.click(); }
    });
  }
  moiDong.push({ bLuu, kiemDoi });

  bLuu.addEventListener('click', async () => {
    dangLuu = true;
    for (const d of moiDong) d.bLuu.disabled = true;
    oTrangThai.textContent = 'Đang lưu…';

    const kq = await luuHang(p, oControls, ctx);

    dangLuu = false;
    if (kq.ok) {
      oTrangThai.textContent = kq.khongDoi ? ''
        : kq.trangThai === 'cho' ? 'Đã lưu — đang chờ quản trị duyệt.' : 'Đã lưu.';
    } else {
      oTrangThai.textContent = kq.loi || 'Không lưu được — thử lại.';
    }
    for (const d of moiDong) d.kiemDoi();
  });

  return td(bLuu, oTrangThai);
}

/**
 * Lưu MỘT dòng — mượn bốn bước của `repo.luuCay()` nhưng chỉ trên một người:
 * so bản gốc với bản vừa sửa (`domains/person.js`), gửi khác biệt, máy chủ
 * gật thì tăng số chống ghi đè và cập nhật thẳng vào `p` (đang hiển thị) —
 * không đọc lại mạng, đúng lý lẽ đã có ở `so-tay/luu-du-lieu.md`.
 */
async function luuHang(p, oControls, ctx) {
  const truoc = goc.get(p.id);
  if (!truoc) return { ok: false, loi: 'Không thấy bản ghi gốc — tải lại trang rồi thử lại.' };

  const changes = {};
  if (oControls.ten)  changes.name   = tachHoTen(oControls.ten.value);
  if (oControls.sex)  changes.sex    = oControls.sex.value;
  if (oControls.sinh) changes.birth  = { raw: oControls.sinh.value };
  if (oControls.mat)  changes.death  = { raw: oControls.mat.value };
  if (oControls.song) changes.living = oControls.song.checked;
  for (const [ma, khoa] of Object.entries(TRUONG_DOI)) {
    if (oControls[ma]) changes[khoa] = oControls[ma].value;
  }

  const email = (ctx.phien && ctx.phien.email) || '';
  const kqSua = updatePerson({ persons: [truoc] }, p.id, changes,
    { luc: stampNow(), boi: email });
  if (!kqSua || !kqSua.thayDoi) return { ok: true, khongDoi: true };

  const ops = soSanh({ persons: [truoc] }, { persons: [kqSua.person] });
  if (!coGiDeGhi(ops)) return { ok: true, khongDoi: true };

  let kq;
  try {
    kq = await luuCay(treeId, treeRevision, ops, {
      action: 'update', target: p.id,
      note: 'Sửa ' + (fullName(kqSua.person) || p.id) + ' tại bảng Danh sách người.',
      diff: kqSua.diff,
    });
  } catch (e) {
    return { ok: false, loi: 'Không gọi được máy chủ. ' + (e && e.message ? e.message : String(e)) };
  }
  if (!kq)    return { ok: false, loi: 'Máy chủ không trả lời.' };
  if (!kq.ok) return kq;   // máy chủ đã viết sẵn câu giải thích trong kq.loi

  treeRevision = kq.revision;
  tangSoSauKhiLuu({ persons: [kqSua.person] }, ops);
  goc.set(p.id, kqSua.person);
  Object.assign(p, kqSua.person);   // `p` là phần tử đang hiển thị — sửa tại chỗ

  return kq;
}
