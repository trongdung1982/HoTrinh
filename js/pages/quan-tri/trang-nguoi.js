// ============================================================
// giapha-supabase · js/pages/quan-tri/trang-nguoi.js
// Vai trò  : Trang con `#gia-pha/cay/<mã>/nguoi` — BẢNG PHẲNG mọi người của
//            một cây, như một trang tính: tìm, sắp xếp, phân trang, và cột
//            *Tài khoản* nói người ấy đang gắn với tài khoản nào.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb · services/hinh-dang · utils/text ·
//            quan-tri/trang-cay · quan-tri/o-bang
// Phiên bản: 0.1.0 · Cập nhật: 23/09/2026 (b125a)
// Sổ tay   : so-tay/trang-quan-tri.md
// ============================================================
//
// ⚠ Section `#tree-people` KHÔNG CÓ trong prototype quantri3 — dựng mới
//   23/09/2026 theo lối các section khác (detailbar · head · panel · table).
//
// ⚠ ĐỌC CẢ CÂY bằng `sb.layDong()`, không đẻ hàm máy chủ mới. Cây lớn nhất
//   681 người, một lần đọc ~0,4 giây; `doc_cay()` đã gác quyền xem sẵn bên
//   trong. Bảng này KHÔNG dựng chỉ mục quan hệ — nó chỉ kể về từng con người.
//
// ⚠ Bản này CHỈ XEM. Gắn tài khoản (b125b), sửa tại chỗ (b125c), sửa hàng
//   loạt (b125d), xuất Excel (b125e) là các bước sau — đừng nhét vào đây.

import { layDong, dsThanhVien } from '../../services/sb.js';
import { rapCay } from '../../services/hinh-dang.js';
import { fullName, removeDiacritics } from '../../utils/text.js';
import { timCay, cumCay, cayNho } from './trang-cay.js';
import { td, span, nutLink, dongTrong } from './o-bang.js';

/** Bao nhiêu dòng một trang. 50 vừa một màn cuộn, và 681 người ra 14 trang. */
const MOI_TRANG = 50;

/** Trạng thái của màn hình — giữ qua các lần nạp lại, xoá khi đổi cây. */
let cayDangXem = '';
let trang = 0;
let loc = '';
let hienXoa = false;
let sapTheo = 'id';
let sapNguoc = false;

/**
 * Cột của bảng. `lay` trả CHUỖI để hiện và để tìm; `so` (nếu có) trả số dùng
 * khi sắp xếp, nhờ đó "1890" không đứng sau "195" theo thứ tự chữ.
 */
const COT = [
  { ma: 'id',    chu: 'Mã',        lay: (p) => p.id || '' },
  { ma: 'ten',   chu: 'Họ và tên', lay: (p) => fullName(p) || '(chưa có tên)' },
  { ma: 'sex',   chu: 'Giới',      lay: (p) => ({ M: 'Nam', F: 'Nữ' }[p.sex] || '') },
  { ma: 'sinh',  chu: 'Sinh',      lay: (p) => moc(p.birth), so: (p) => nam(p.birth) },
  { ma: 'mat',   chu: 'Mất',       lay: (p) => moc(p.death), so: (p) => nam(p.death) },
  { ma: 'song',  chu: 'Còn sống',  lay: (p) => (p.living ? 'Còn sống' : '') },
  { ma: 'oDau',  chu: 'Nơi ở',     lay: (p) => p.residence || '' },
  { ma: 'nghe',  chu: 'Nghề',      lay: (p) => p.occupation || '' },
  { ma: 'hoc',   chu: 'Học vấn',   lay: (p) => p.education || '' },
  { ma: 'ton',   chu: 'Tôn giáo',  lay: (p) => p.religion || '' },
  { ma: 'dan',   chu: 'Dân tộc',   lay: (p) => p.nationality || '' },
  { ma: 'chuc',  chu: 'Chức danh', lay: (p) => p.title || '' },
  { ma: 'tk',    chu: 'Tài khoản', lay: (p) => p.emailGan || '' },
  { ma: 'ghi',   chu: 'Ghi chú',   lay: (p) => p.note || '' },
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

export async function mountTrangNguoi(sec, ctx, hashLuc) {
  const $ = (id) => sec.querySelector('#' + id);
  const tb = $('tp-tbody');

  if (cayDangXem !== ctx.thamSo) { cayDangXem = ctx.thamSo; trang = 0; loc = ''; }

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

  const emailTheoMa = new Map();
  if (kqTV.ok) for (const t of kqTV.ds) if (t.maNguoi) emailTheoMa.set(t.maNguoi, t.email);

  const moi = rapCay(kq.dong).persons.map((p) => ({ ...p, emailGan: emailTheoMa.get(p.id) || '' }));

  const ve = () => veBang(sec, moi, kqTV.ok, () => ve());
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

function veBang(sec, ds, docDuocTK, ve) {
  const $ = (id) => sec.querySelector('#' + id);
  const hop = locVaSap(ds);

  const soTrang = Math.max(1, Math.ceil(hop.length / MOI_TRANG));
  if (trang > soTrang - 1) trang = soTrang - 1;
  const dau = trang * MOI_TRANG;
  const phan = hop.slice(dau, dau + MOI_TRANG);

  $('tp-dem').textContent = ds.length + ' người trong cây'
    + (docDuocTK ? '' : ' · không đọc được cột Tài khoản');
  $('tp-loc-dem').textContent = hop.length === ds.length
    ? '' : 'Lọc còn ' + hop.length + ' người';
  $('tp-trang-thai').textContent = 'Chỉ xem';

  veDau(sec, ve);

  const tb = $('tp-tbody');
  if (!phan.length) {
    dongTrong(tb, COT.length, loc ? 'Không ai khớp “' + loc + '”.' : 'Cây này chưa có người nào.');
  } else {
    tb.innerHTML = '';
    for (const p of phan) {
      const tr = document.createElement('tr');
      for (const c of COT) {
        const chu = c.lay(p);
        tr.append(c.ma === 'ten' && p.deleted
          ? td(span('name', chu), span('sub', 'đã xoá'))
          : td(c.ma === 'ten' ? span('name', chu) : chu));
      }
      tb.append(tr);
    }
  }

  $('tp-vi-tri').textContent = hop.length
    ? 'Đang xem ' + (dau + 1) + '–' + Math.min(dau + MOI_TRANG, hop.length)
      + ' / ' + hop.length + ' người · trang ' + (trang + 1) + '/' + soTrang
    : '';
  $('tp-truoc').disabled = trang === 0;
  $('tp-sau').disabled = trang >= soTrang - 1;
}

/** Hàng tiêu đề — bấm một cột là sắp theo cột ấy, bấm lại là đảo chiều. */
function veDau(sec, ve) {
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
}
