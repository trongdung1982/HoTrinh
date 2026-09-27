// ============================================================
// giapha-supabase · js/pages/quan-tri/trang-nguoi.js
// Vai trò  : Trang con `#gia-pha/cay/<mã>/nguoi` — BẢNG PHẲNG mọi người của
//            một cây, như một trang tính: tìm, sắp xếp, phân trang, sửa tại
//            chỗ từng ô rồi Lưu theo DÒNG qua `luu_cay()`. Cột *Tài khoản*
//            (đang Chỉnh sửa) gắn/gỡ liên kết tài khoản ↔ người (b129c).
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb · services/hinh-dang · domains/person ·
//            utils/{text,date} · quan-tri/{trang-cay,o-goi-y,o-bang}
// Phiên bản: 0.5.0 · Cập nhật: 27/09/2026 (b129c) — gộp cột Tài khoản, bốn hạng
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
//   `capSua` còn nhân thêm `cheDoSua` (b129): cây cho sửa KHÔNG có nghĩa là
//   bảng đang sửa — phải bấm "Chỉnh sửa" trước, mặc định luôn TẮT.

import {
  layDong, dsThanhVien, luuCay, dsLienKetCay, timTaiKhoanTrongCay,
  deXuatGanHo, deXuatGoHo, ganThangTaiKhoan, goGanTaiKhoanCuaToi,
} from '../../services/sb.js';
import { rapCay, soSanh, coGiDeGhi, tangSoSauKhiLuu } from '../../services/hinh-dang.js';
import { updatePerson } from '../../domains/person.js';
import { fullName, removeDiacritics } from '../../utils/text.js';
import { stampNow } from '../../utils/date.js';
import { timCay, cumCay, cayNho, wireTabsTrangCay, datSoDon } from './trang-cay.js';
import { ganGoiY } from './o-goi-y.js';
import { hoi } from './hop-thoai.js';
import { TEN_VAI, td, span, nutLink, nutNho, dongTrong, datHuyHieu } from './o-bang.js';

/** Bao nhiêu dòng một trang. 50 vừa một màn cuộn, và 681 người ra 14 trang. */
const MOI_TRANG = 50;

/** Trạng thái của màn hình — giữ qua các lần nạp lại, xoá khi đổi cây. */
let cayDangXem = '';
let trang = 0;
let loc = '';
let hienXoa = false;
let sapTheo = 'id';
let sapNguoc = false;
/** Mặc định KHÔNG cho sửa — phải bấm "Chỉnh sửa" mới bật (b129), TẮT lại mỗi
 *  lần mở trang này, kể cả cùng một cây, để khỏi sửa nhầm lúc chỉ định xem. */
let cheDoSua = false;

// --- Ba biến của đường GHI (b125c) — cùng đời sống với `cayDangXem` --------
let treeId = '';
let treeRevision = 0;
/** Mã người → bản ghi GỐC (camelCase, có `revision`) — nền để so khi Lưu. */
let goc = new Map();
/** Đang có một lần Lưu chạy dở — chặn mọi nút Lưu khác trong lúc đó. */
let dangLuu = false;
/** `{bLuu, kiemDoi}` của mọi dòng đang vẽ — khoá/mở lại đồng loạt lúc Lưu. */
let moiDong = [];
/** Hàm GỠ của mọi ô gợi ý *Gắn tài khoản* đang vẽ (b129c) — `ganGoiY()` gắn
 *  bộ nghe `window.scroll`/`resize` NGAY khi gọi, không chờ popup mở. Bảng
 *  vẽ lại cả tbody mỗi lần tìm/sắp/đổi trang; quên gọi hết mảng này trước khi
 *  xoá `tbody` là mỗi lượt vẽ lại cộng dồn thêm một bộ nghe treo mãi. */
let goiYDangMo = [];

/** Trường tự do đổi tên thẳng: cột bảng → khoá của `changes` (`domains/person.js`). */
const TRUONG_DOI = {
  oDau: 'residence', nghe: 'occupation', hoc: 'education',
  ton: 'religion', dan: 'nationality', chuc: 'title', ghi: 'note',
};

/**
 * Cột của bảng. `lay` trả CHUỖI để hiện và để tìm; `so` (nếu có) trả số dùng
 * khi sắp xếp, nhờ đó "1890" không đứng sau "195" theo thứ tự chữ. `sua`
 * đánh dấu cột sửa được tại chỗ: `'ten'` · `'sex'` · `'bool'` · `'text'`.
 * Cột `id` (mã, khoá) không bao giờ sửa. Cột `tk` không có `sua` vì nó KHÔNG
 * đi qua Lưu dòng — đang Chỉnh sửa thì `oTaiKhoan()` vẽ riêng (b129c).
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
  for (const go of goiYDangMo) go();
  goiYDangMo = [];
  cheDoSua = false;   // mặc định KHÔNG cho sửa mỗi lần mở trang này (b129)

  wireTabsTrangCay(sec, ctx);
  $('tp-dau').innerHTML = '';
  dongTrong(tb, COT.length, 'Đang đọc danh sách người…');

  const { cay, loi } = await timCay(ctx);
  if (window.location.hash !== hashLuc) return;
  if (!cay) { dongTrong(tb, COT.length, loi); return; }

  for (const x of sec.querySelectorAll('[data-tree-context]')) x.textContent = cumCay(cayNho(cay));

  // Ba lời gọi song song: cây (người) · liên kết tài khoản ↔ người (cột *Tài
  // khoản*, `luoc-do/39`) · danh sách thành viên (chỉ để đếm đơn xin vào ở
  // tab). Hai cái sau hỏng thì bảng người VẪN hiện — nói ra ở ô đếm.
  const [kq, kqLK, kqTV] = await Promise.all([
    layDong(cay.fileId), dsLienKetCay(cay.fileId), dsThanhVien(cay.fileId),
  ]);
  if (window.location.hash !== hashLuc) return;

  if (!kq.ok) {
    dongTrong(tb, COT.length, kq.loi || 'Không đọc được gia phả này.',
      () => mountTrangNguoi(sec, ctx, window.location.hash));
    return;
  }

  treeId = cay.fileId;
  treeRevision = (kq.dong.tree && Number(kq.dong.tree.revision)) || 0;

  if (kqTV.ok) datSoDon(sec, kqTV.ds.filter((t) => !t.daDuyet && !t.moiLuc).length);
  const lkTheoMa = new Map();
  if (kqLK.ok) for (const l of kqLK.ds) lkTheoMa.set(l.maNguoi, l);

  // b129c — ai làm được gì ở cột *Tài khoản* khi bảng đang Chỉnh sửa. Chỉ
  // để vẽ đúng nút; hàng rào thật ở `39`. Người trong bảng chắc chắn thuộc
  // cây đang xem, nên vai của CHÍNH cây này là đủ, tính một lần cho cả trang.
  const quyenTk = {
    laQTHT: Boolean(ctx.phien && ctx.phien.laQuanTriHeThong),
    deXuat: Boolean(cay.toiLaChu) || ['quan_tri', 'sua'].includes(cay.vaiCuaToi),
  };

  // `goc` = bản GỐC từng người, camelCase với `revision` đi tròn — nền so
  // sánh của mọi lần Lưu. `ds` là bản HIỆN trên bảng, thêm `lk` (liên kết)
  // và `emailGan`; sửa `p` tại chỗ sau khi Lưu/gắn/gỡ để khỏi đọc lại mạng.
  goc = new Map();
  const dsNguoi = rapCay(kq.dong).persons;
  for (const p of dsNguoi) goc.set(p.id, p);
  const ds = dsNguoi.map((p) => {
    const lk = lkTheoMa.get(p.id) || null;
    return { ...p, lk, emailGan: lk ? lk.email : '' };
  });

  const ve = () => veBang(sec, ds, kqLK.ok, cay, ctx, quyenTk, () => ve());
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

/** Nút "Chỉnh sửa"/"Xong" — mặc định TẮT, ẩn hẳn khi cây không cho sửa. */
function veNutSua(sec, cay, ve) {
  const b = sec.querySelector('#tp-sua-nut');
  if (!cay.suaDuoc) { b.hidden = true; return; }
  b.hidden = false;
  b.textContent = cheDoSua ? 'Xong' : 'Chỉnh sửa';
  b.onclick = () => { cheDoSua = !cheDoSua; ve(); };
}

function veBang(sec, ds, docDuocTK, cay, ctx, quyenTk, ve) {
  const $ = (id) => sec.querySelector('#' + id);
  const hop = locVaSap(ds);
  const capSua = Boolean(cay.suaDuoc) && cheDoSua;
  // Khách không bao giờ tới đây (cây không cho sửa → không có nút Chỉnh sửa),
  // nhưng vẫn gác: cột Tài khoản chỉ mở cho QTHT hoặc người được đề xuất.
  const capTk = capSua && (quyenTk.laQTHT || quyenTk.deXuat);
  const soCot = COT.length + (capSua ? 1 : 0);

  const soTrang = Math.max(1, Math.ceil(hop.length / MOI_TRANG));
  if (trang > soTrang - 1) trang = soTrang - 1;
  const dau = trang * MOI_TRANG;
  const phan = hop.slice(dau, dau + MOI_TRANG);

  $('tp-dem').textContent = ds.length + ' người trong cây'
    + (docDuocTK ? '' : ' · không đọc được cột Tài khoản');
  $('tp-loc-dem').textContent = hop.length === ds.length
    ? '' : 'Lọc còn ' + hop.length + ' người';
  veNutSua(sec, cay, ve);
  if (!cay.suaDuoc) datHuyHieu($('tp-trang-thai'), 'Chỉ xem', 'wait');
  else datHuyHieu($('tp-trang-thai'), cheDoSua ? 'Đang sửa' : 'Xem');

  veDau(sec, ve, capSua);

  const tb = $('tp-tbody');
  for (const go of goiYDangMo) go();
  goiYDangMo = [];
  moiDong = [];
  if (!phan.length) {
    dongTrong(tb, soCot, loc ? 'Không ai khớp “' + loc + '”.' : 'Cây này chưa có người nào.');
  } else {
    tb.innerHTML = '';
    for (const p of phan) tb.append(dongNguoi(p, capSua, capTk ? quyenTk : null, cay, ctx));
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
function dongNguoi(p, capSua, quyenTk, cay, ctx) {
  const tr = document.createElement('tr');
  const oControls = {};

  for (const c of COT) {
    if (c.ma === 'tk' && quyenTk) { tr.append(oTaiKhoan(p, cay, ctx, quyenTk)); continue; }
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

// ============================================================
// Cột *Tài khoản* khi đang Chỉnh sửa (b129c) — HÀNH ĐỘNG RIÊNG, không đi qua
// `luuHang()`/`luu_cay()`. Bốn hạng (chốt 27/09/2026, `luoc-do/39`):
//   · QTHT: gắn / gỡ THẲNG            · chủ/quản trị/thành viên: ĐỀ XUẤT
//   · dòng của chính mình: tự gỡ      · khách: không tới được đây
// Đã liên kết rồi thì phải GỠ trước mới gắn tài khoản khác — không "đổi".
// ============================================================

const HASH_HO_SO = '#thanh-vien';   // khu Tài khoản → panel Mã người & Dòng họ

function oTaiKhoan(p, cay, ctx, quyenTk) {
  const o = document.createElement('td');
  o.className = 'col-tk';
  veOTaiKhoan(o, p, cay, ctx, quyenTk, '');
  return o;
}

function tenNguoi(p) { return (fullName(p) || '(chưa có tên)') + ' (' + p.id + ')'; }

function veOTaiKhoan(o, p, cay, ctx, quyenTk, thongBao) {
  if (o.goGoiY) { o.goGoiY(); o.goGoiY = null; }
  o.innerHTML = '';
  const oTB = span('sub', thongBao || '');
  const veLai = (tb) => veOTaiKhoan(o, p, cay, ctx, quyenTk, tb);
  const phien = ctx.phien || {};

  // ── ĐÃ LIÊN KẾT ─────────────────────────────────────────
  if (p.lk) {
    o.append(span('name', p.lk.email));
    if (p.lk.hoTen) o.append(span('sub', p.lk.hoTen));
    let b;
    if (p.lk.userId === phien.userId) {
      b = nutNho('Gỡ liên kết của tôi', 'danger');
      b.addEventListener('click', async () => {
        const kq = await hoi({
          tua: 'Gỡ liên kết của tôi',
          chu: 'Tài khoản của bạn thôi gắn với ' + tenNguoi(p) + ' — có hiệu lực ngay. Bạn mất quyền ' +
            'sửa theo trực hệ của người này ở MỌI gia phả. Muốn gắn lại phải đề xuất ở Hồ sơ cá nhân.',
          nutOk: 'Gỡ', kieuOk: 'danger', lam: () => goGanTaiKhoanCuaToi(),
        });
        if (kq) { p.lk = null; p.emailGan = ''; veLai('Đã gỡ liên kết của bạn.'); }
      });
    } else if (quyenTk.laQTHT) {
      b = nutNho('Gỡ', 'danger');
      b.addEventListener('click', async () => {
        const kq = await hoi({
          tua: 'Gỡ liên kết',
          chu: p.lk.email + ' thôi gắn với ' + tenNguoi(p) + ' — có hiệu lực NGAY, không qua duyệt. ' +
            'Gỡ xong có thể gắn tài khoản khác cho người này.',
          nutOk: 'Gỡ', kieuOk: 'danger', lam: () => ganThangTaiKhoan(p.lk.userId, null),
        });
        if (kq) { p.lk = null; p.emailGan = ''; veLai('Đã gỡ — có thể gắn tài khoản khác.'); }
      });
    } else {
      b = nutNho('Đề xuất gỡ');
      b.addEventListener('click', async () => {
        const kq = await hoi({
          tua: 'Đề xuất gỡ liên kết',
          chu: 'Đề nghị gỡ ' + p.lk.email + ' khỏi ' + tenNguoi(p) + '. Quản trị hệ thống, hoặc chính ' +
            'người dùng tài khoản ấy, sẽ duyệt.',
          oNhap: { nhieuDong: true, goiY: 'Lý do (không bắt buộc)' },
          nutOk: 'Gửi đề xuất', kieuOk: 'warm', lam: (lyDo) => deXuatGoHo(p.lk.userId, lyDo),
        });
        if (kq) veLai('Đã gửi đề xuất gỡ — chờ Quản trị hệ thống hoặc chính người ấy duyệt.');
      });
    }
    o.append(b, oTB);
    return;
  }

  // ── CHƯA LIÊN KẾT — tìm trong người ĐÃ VÀO cây (khách trở lên) ──
  let daChon = null;
  const oNhap = document.createElement('input');
  oNhap.type = 'text';
  oNhap.className = 'o-sua o-sua-ten';
  oNhap.placeholder = 'Gõ tên hoặc email…';

  const bGui = nutNho(quyenTk.laQTHT ? 'Gắn' : 'Gửi đề xuất', 'warm');
  bGui.disabled = true;
  const oCanh = document.createElement('span');
  oCanh.className = 'sub tk-canh';

  /** Tài khoản đang chọn là của chính mình → không gắn ở đây, dẫn sang Hồ sơ cá nhân. */
  const canhChinhMinh = () => {
    oCanh.innerHTML = '';
    oCanh.append('Đây là tài khoản của bạn. Tự gắn mã người cho mình làm ở Hồ sơ cá nhân ' +
      '(Tài khoản → Mã người & Dòng họ), để được xét đúng luật. ');
    oCanh.append(nutLink('Mở Hồ sơ cá nhân →', () => { window.location.hash = HASH_HO_SO; }));
  };

  o.goGoiY = ganGoiY(oNhap, {
    tim: async (chuoi) => (await timTaiKhoanTrongCay(cay.fileId, chuoi)).ds,
    ve: (m) => ({
      chinh: m.email + (m.hoTen ? ' — ' + m.hoTen : ''),
      phu: m.userId === phien.userId ? 'Tài khoản của bạn — gắn ở Hồ sơ cá nhân'
        : m.lienKet ? 'Đã liên kết: ' + m.lienKet
        : (m.vai === 'chu' ? 'Chủ gia phả' : TEN_VAI[m.vai] || m.vai),
      mo: Boolean(m.lienKet) || m.userId === phien.userId,
    }),
    giaTri: (m) => m.email,
    khiChon: (m) => {
      daChon = m;
      oCanh.textContent = '';
      bGui.disabled = true;
      if (m.userId === phien.userId) { canhChinhMinh(); return; }
      if (m.lienKet) {
        oCanh.textContent = 'Tài khoản này đã liên kết với ' + m.lienKet + '. Hãy gỡ liên kết đó trước khi gắn.';
        return;
      }
      bGui.disabled = false;
    },
  });
  goiYDangMo.push(o.goGoiY);
  oNhap.addEventListener('input', () => {
    if (daChon && oNhap.value.trim() !== daChon.email) { daChon = null; bGui.disabled = true; oCanh.textContent = ''; }
  });

  bGui.addEventListener('click', async () => {
    if (!daChon || oNhap.value.trim() !== daChon.email) {
      oTB.textContent = 'Chọn đúng một tài khoản trong danh sách gợi ý.';
      return;
    }
    bGui.disabled = true;
    oTB.textContent = quyenTk.laQTHT ? 'Đang gắn…' : 'Đang gửi…';
    const m = daChon;
    const kq = quyenTk.laQTHT ? await ganThangTaiKhoan(m.userId, p.id) : await deXuatGanHo(m.userId, p.id);
    if (kq && kq.ok) {
      if (quyenTk.laQTHT) {
        p.lk = { userId: m.userId, email: m.email, hoTen: m.hoTen, maNgan: m.maNgan };
        p.emailGan = m.email;
        veLai('Đã gắn.');
      } else {
        veLai('Đã gửi đề xuất gắn ' + m.email + ' — chờ Quản trị hệ thống hoặc chính người ấy duyệt.');
      }
      return;
    }
    bGui.disabled = false;
    if (kq && kq.lyDo === 'chinhminh') { canhChinhMinh(); oTB.textContent = ''; return; }
    oTB.textContent = (kq && kq.loi) || 'Không làm được — thử lại.';
  });

  o.append(oNhap, bGui, oCanh, oTB);
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
