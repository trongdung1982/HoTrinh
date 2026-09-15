// ============================================================
// giapha-supabase · js/pages/quan-tri/khu-tai-khoan.js
// Vai trò  : Khu 2 của trang Quản trị — TÀI KHOẢN CỦA TÔI: hồ sơ · quyền cấp
//            hệ thống · các gia phả tôi tham gia (kèm nút Đề xuất mã người) ·
//            đổi mật khẩu.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb, config, quan-tri/khu-thanh-vien (mẩu vẽ + đơn đề
//            xuất), quan-tri/trang-chi-tiet
// Phiên bản: 0.2.0 · Cập nhật: 15/09/2026 (b118)
//            0.2.0 Chip *Toàn hệ thống* rời khỏi khu này, sang khu Quản trị
//            hệ thống riêng (`khu-quan-tri-he-thong.js`) —
//            `THIET-KE-QUAN-TRI.md` 9.1 đã hẹn "tạm ở khu 2 tới b118". Khu
//            này giờ chỉ còn MỘT thứ để vẽ nên bỏ luôn hàng chip, `chipDangMo`
//            và `napHeThong()` — một khu một thứ thì không cần tấm lọc.
// ============================================================
//
// ═══ VÌ SAO KHU NÀY ĐỔI RUỘT ═══
//
// Tới b116, khu 2 là bảng *"tài khoản trong MỘT cây"* kèm ô chọn cây. b116 đã
// đưa đúng bảng ấy — nguyên vẹn, cùng `veBang()` — vào trang chi tiết một cây
// (`#gia-pha/cay/<mã>/thanh-vien` · `loi-moi` · `don-xin-vao`), nên để nó ở
// đây nữa là hai chỗ đổi quyền cho cùng một cây, tức hai chỗ để lệch nhau.
// Bản đồ đã chốt ở b114 (`THIET-KE-QUAN-TRI.md` 9.1) đặt khu này đúng như
// prototype quantri3 `#tai-khoan`: **tài khoản của chính người đang xem.**
//
// ⚠ **Không còn ô chọn cây — và luật 5a không mất gì.** Ô ấy tồn tại để một
//   bảng "của một cây" khỏi ngầm định cây đang mở. Bảng ở đây liệt kê MỌI
//   cây, mỗi dòng mang tên cây của nó, nên câu *"cây nào"* tự tan khi người
//   ta bấm vào một dòng — đúng lý lẽ 5b② đã dùng cho cột xuyên cây. Không có
//   dòng nào ở file này đọc `phien.treeId`.
//
// ⚠ **Khu này MỞ CHO MỌI NGƯỜI**, không riêng quản trị. Nó chỉ hỏi máy chủ
//   những câu về chính người hỏi (`ds_gia_pha()` · dòng `tree_members` của
//   mình), nên không cần hàng rào nào mới. Đó cũng là chỗ trả nợ b111c: một
//   Thành viên thường trước đây không có đường nộp đơn đề xuất mã người, vì
//   khu cũ gác bằng `co_the_kiem_duyet()`.
//
// ⚠ **Không `alert()`, không `confirm()`.** Cả app không dùng ở đâu cả.

import {
  layPhien, layDanhSachGiaPha, chanCuaToi, doiMatKhau, dangXuat,
} from '../../services/sb.js';
import { vaiTroBangChu } from '../../config.js';
import {
  bangDeXuatCuaToi, nutHaiNhip, dongBao, huyHieu, nut, veLoi, o,
  capChieuCao, CSS_DAU_BANG,
} from './khu-thanh-vien.js';
import { duongDan } from './trang-chi-tiet.js';

/**
 * Cây đang mở khung Đề xuất — giữ qua `napLai()`. Nộp đơn xong thì cả khu vẽ
 * lại; không giữ thì khung đóng sập đúng lúc người ta cần đọc *"Đang chờ
 * xét"*, và trông như cú bấm chẳng làm gì.
 */
let deXuatDangMo = null;

// ============================================================
// Cửa vào
// ============================================================

/**
 * @param {HTMLElement} el     thân trang, đã dọn sạch
 * @param {object} [phienVao]  kết quả `sb.layPhien()`; thiếu thì tự hỏi
 */
export async function mountKhuTaiKhoan(el, phienVao) {
  el.innerHTML = '';

  const h = document.createElement('h2');
  h.className = 'qt-tua';
  h.textContent = 'Tài khoản';

  // ⚠ Dòng danh tính đứng TRƯỚC mọi thứ (b109e) — trang này là chỗ đọc quyền
  //   cấp hệ thống của chính mình, nhầm tài khoản đang đăng nhập ở đó là
  //   nhầm ở chỗ dễ hiểu sai nhất app.
  const ai = document.createElement('p');
  ai.className = 'qt-danh-tinh';

  const than = document.createElement('div');
  than.className = 'qt-cho';
  than.textContent = 'Đang đọc tài khoản…';

  el.append(h, ai, than);

  const phien = phienVao || await layPhien();
  if (phien.loi) {
    than.innerHTML = '';
    than.append(veLoi(phien.loi, () => mountKhuTaiKhoan(el, null)));
    return;
  }

  ai.textContent = dongDanhTinh(phien);
  veThan(than, phien);
}

/** *"Bạn đang đăng nhập bằng <tên> · <email> · mã <mã>."* — trống thì không vẽ. */
function dongDanhTinh(phien) {
  const phan = [];
  if (phien.hoTen) phan.push(phien.hoTen);
  if (phien.email) phan.push(phien.email);
  if (phien.maNgan) phan.push('mã ' + phien.maNgan);
  return phan.length ? 'Bạn đang đăng nhập bằng ' + phan.join(' · ') + '.' : '';
}

function veThan(than, phien) {
  than.innerHTML = '';
  than.className = '';
  veCuaToi(than, phien, () => veThan(than, phien));
}

// ============================================================
// Tài khoản của tôi
// ============================================================

async function veCuaToi(than, phien, napLai) {
  const cho = document.createElement('div');
  cho.className = 'qt-cho';
  cho.textContent = 'Đang đọc các gia phả của bạn…';

  const hai = document.createElement('div');
  hai.className = 'qt-hai-cot';
  hai.append(veKhoiHoSo(phien), veKhoiQuyenHeThong(phien));

  const oCay = veKhoi('Các gia phả tôi đang tham gia',
    'Vai trò và vị trí của bạn trong từng sơ đồ');
  oCay.append(cho);

  than.append(hai, oCay, veKhoiMatKhau());

  // ⚠ Hai câu hỏi đi CÙNG LƯỢT, và chúng không thay được cho nhau:
  //   `ds_gia_pha()` biết cả đơn chờ lẫn lời mời nhưng không biết mã người;
  //   `chanCuaToi()` biết mã người nhưng chỉ thấy chân ĐÃ DUYỆT (RLS).
  const hashLuc = window.location.hash;
  const [kqCay, kqChan] = await Promise.all([layDanhSachGiaPha(), chanCuaToi()]);
  // Người bấm sang khu khác trong lúc chờ thì `than` đã rời màn hình.
  if (window.location.hash !== hashLuc || !than.isConnected) return;

  cho.remove();
  veBangCay(oCay, kqCay, kqChan, napLai);
}

/** Một khối có tựa — cùng hình với `panel` của prototype. */
function veKhoi(tua, phu) {
  const khoi = document.createElement('section');
  khoi.className = 'qt-khoi';
  const dau = document.createElement('div');
  dau.className = 'qt-khoi-dau';
  const h = document.createElement('h3');
  h.className = 'qt-khoi-tua';
  h.textContent = tua;
  dau.append(h);
  if (phu) {
    const s = document.createElement('span');
    s.className = 'qt-ghi';
    s.textContent = phu;
    dau.append(s);
  }
  khoi.append(dau);
  return khoi;
}

/** Bảng nhãn · giá trị. Giá trị trống thì KHÔNG vẽ hàng đó (`CLAUDE.md` mục 7). */
function veBangTT(dong) {
  const dl = document.createElement('dl');
  dl.className = 'qt-tt';
  for (const [nhan, giaTri] of dong) {
    if (!giaTri) continue;
    const hang = document.createElement('div');
    hang.className = 'qt-tt-dong';
    const dt = document.createElement('dt');
    dt.textContent = nhan;
    const dd = document.createElement('dd');
    dd.textContent = giaTri;
    hang.append(dt, dd);
    dl.append(hang);
  }
  return dl;
}

function veKhoiHoSo(phien) {
  const khoi = veKhoi('Hồ sơ');
  khoi.append(veBangTT([
    ['Họ tên', phien.hoTen],
    ['Email', phien.email],
    ['Mã tài khoản', phien.maNgan],
  ]));
  return khoi;
}

/**
 * Hai cờ cấp TÀI KHOẢN — hai thứ DUY NHẤT trên cả trang không hỏi "cây nào"
 * (ngoại lệ của luật 5a, và nhãn phải tự khai điều đó).
 *
 * ⚠ Chỉ để ĐỌC. Không ai tự đặt quyền cho mình — cửa thứ sáu và thứ bảy —
 *   nên ở đây không có nút nào, kể cả khi người xem là Quản trị hệ thống.
 */
function veKhoiQuyenHeThong(phien) {
  const khoi = veKhoi('Quyền cấp hệ thống', 'Áp dụng toàn phần mềm, không riêng cây nào');
  const laQT = Boolean(phien.laQuanTriHeThong);
  khoi.append(veBangTT([
    ['Quản trị hệ thống', laQT ? 'Có' : 'Không'],
    ['Được dựng gia phả mới', !phien.duocTaoCay ? 'Không'
      : laQT ? 'Có — đi kèm cờ Quản trị hệ thống' : 'Có'],
  ]));

  const ghi = document.createElement('p');
  ghi.className = 'qt-ghi qt-ghi-khoi';
  // ⚠ Câu cuối nói thẳng phần CHƯA có. `THIET-KE-NHIEU-CAY.md` 11.9 đã chốt
  //   bổ nhiệm Quản trị hệ thống bằng hai chữ ký (mời rồi tự nhận), nhưng máy
  //   chủ tới b118b vẫn đặt thẳng một chữ ký — vẽ nút *Chấp nhận* lúc này là
  //   vẽ một cái nút không nối vào đâu.
  ghi.textContent =
    'Hai cờ này chỉ một Quản trị hệ thống KHÁC đổi được — không ai tự đặt ' +
    'quyền cho mình. Lời mời nhận vai Quản trị hệ thống (hai chữ ký) chưa có ở ' +
    'máy chủ, làm ở bước b118b.';
  khoi.append(ghi);
  return khoi;
}

// ============================================================
// Các gia phả tôi đang tham gia
// ============================================================

/**
 * Ba trạng thái loại trừ nhau, xét theo đúng thứ tự `veOThaoTac()` của khu
 * Gia phả: **lời mời đứng TRƯỚC** (bài học b111c — xem được cây không có
 * nghĩa là có chân trong cây).
 *
 * ⚠ Cây chỉ XEM ĐƯỢC mà không có chân (Quản trị hệ thống thấy mọi cây; cây mặc
 *   định mở cho người lạ) KHÔNG vào bảng này. Bảng trả lời *"tôi tham gia
 *   đâu"*, không trả lời *"tôi đọc được đâu"* — câu sau là khu Gia phả.
 *
 * @returns {'duocmoi'|'thanhvien'|'donxin'|null}
 */
function trangThaiCuaToi(c) {
  if (c.duocMoi) return 'duocmoi';
  if (c.vaiCuaToi || c.toiLaChu) return 'thanhvien';
  if (c.daNopDon) return 'donxin';
  return null;
}

function veBangCay(khoi, kqCay, kqChan, napLai) {
  if (!kqCay.ok) {
    khoi.append(veLoi(kqCay.loi || 'Không đọc được danh sách gia phả.', napLai));
    return;
  }

  // Lỗi đọc mã người KHÔNG làm hỏng cả bảng — vai và trạng thái vẫn đúng. Nhưng
  // phải nói ra, và phải thu nút Đề xuất lại: không biết mình đã gắn với ai thì
  // chưa biết có cần đề xuất hay không.
  const chan = new Map((kqChan.ok ? kqChan.ds : []).map((r) => [r.treeId, r]));
  if (!kqChan.ok) {
    const n = document.createElement('p');
    n.className = 'qt-ghi qt-ghi-loi';
    n.textContent = 'Không đọc được bạn đang gắn với ai trong sơ đồ: ' +
      (kqChan.loi || 'lỗi không rõ') + '.';
    khoi.append(n);
  }

  const ds = (kqCay.ds || [])
    .filter((c) => !c.daXoaLuc && trangThaiCuaToi(c));

  if (!ds.length) {
    const r = document.createElement('div');
    r.className = 'qt-chua-lam';
    r.append(document.createTextNode(
      'Bạn chưa có chân trong gia phả nào. Xin vào một gia phả, hoặc nhận lời ' +
      'mời, ở khu Gia phả.'));
    const a = document.createElement('a');
    a.className = 'qt-di-toi';
    a.href = '#gia-pha';
    a.textContent = 'Mở khu Gia phả';
    r.append(document.createElement('br'), a);
    khoi.append(r);
    return;
  }

  const khung = document.createElement('div');
  khung.className = 'qt-cuon-ngang';
  capChieuCao(khung, ds.length);

  const bang = document.createElement('table');
  bang.className = 'qt-bang';
  bang.append(veDauBang());

  const ruot = document.createElement('tbody');
  const oViec = document.createElement('div');
  for (const c of ds) {
    ruot.append(veDongCay(c, chan.get(c.fileId), kqChan.ok, napLai));
  }
  bang.append(ruot);
  khung.append(bang);
  khoi.append(khung);

  // Nói "kéo ngang" CHỈ KHI nó đúng — đo, không đoán (b106).
  requestAnimationFrame(() => {
    if (khung.scrollWidth > khung.clientWidth + 4) {
      const n = document.createElement('p');
      n.className = 'qt-ghi';
      n.textContent = 'Màn hình hẹp hơn bảng — kéo ngang trong bảng để thấy cột cuối.';
      khung.after(n);
    }
  });

  // Khung Đề xuất đứng NGOÀI bảng, rộng bằng cả khối — bài học b106: nhét vào
  // một ô bảng thì trên điện thoại ba ô nhập bị cắt mất nửa phải.
  khoi.append(oViec);
  const dangMo = deXuatDangMo && ds.find((c) => c.fileId === deXuatDangMo);
  if (dangMo) moDeXuat(oViec, dangMo, napLai);
}

function veDauBang() {
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  for (const chu of ['Gia phả', 'Mã cây', 'Vai trò của tôi',
                     'Tôi được gắn với ai trong sơ đồ?', 'Trạng thái', '']) {
    const th = document.createElement('th');
    th.style.cssText = CSS_DAU_BANG;
    th.textContent = chu;
    tr.append(th);
  }
  thead.append(tr);
  return thead;
}

function veDongCay(c, chan, docDuocChan, napLai) {
  const trangThai = trangThaiCuaToi(c);
  const tr = document.createElement('tr');

  // — Gia phả: tên bấm sang trang chi tiết cây (b116) —
  const oTen = o('', '');
  const a = document.createElement('a');
  a.className = 'qt-lk';
  a.href = '#' + duongDan('gia-pha', 'cay', c.treeCode);
  a.textContent = c.ten || c.treeCode;
  oTen.append(a);
  if (c.toiLaChu) oTen.append(huyHieu('Chủ gia phả', true));

  // `nowrap`: `.qt-bang td` cho gãy chữ ở mọi chỗ (email dài), và mã cây bảy
  // ký tự gãy thành "NPGQ8C / 9" — ảnh kq-4 bắt được. Mã phải đọc liền một hơi.
  const oMa = o(c.treeCode, 'font-family:ui-monospace,monospace;font-size:12px;' +
    'color:#5b4533;white-space:nowrap;overflow-wrap:normal');

  // — Vai trò: người được mời mang `xem` cho tới lúc Nhận, nên hiện vai SẼ nhận —
  const vai = trangThai === 'duocmoi'
    ? 'Sẽ là ' + vaiTroBangChu(c.moiVai)
    : trangThai === 'thanhvien'
    ? vaiTroBangChu((chan && chan.vai) || c.vaiCuaToi)
    : '';
  const oVai = o(vai, 'white-space:nowrap');

  // — Người được gắn: chỉ có nghĩa với chân đã duyệt —
  const oNguoi = o('', '');
  if (trangThai === 'thanhvien' && docDuocChan) {
    if (chan && chan.maNguoi) {
      const ten = document.createElement('div');
      ten.style.fontWeight = '600';
      ten.textContent = chan.tenNguoi || chan.maNguoi;
      oNguoi.append(ten);
      if (chan.tenNguoi) {
        const ma = document.createElement('div');
        ma.className = 'qt-ghi';
        ma.textContent = 'Mã: ' + chan.maNguoi;
        oNguoi.append(ma);
      }
    } else {
      const s = document.createElement('span');
      s.className = 'qt-ghi';
      s.textContent = 'Chưa gắn người';
      oNguoi.append(s);
    }
  }

  const oTrang = o(trangThai === 'duocmoi'
    ? 'Được mời — bấm Nhận ở khu Gia phả'
    : trangThai === 'donxin' ? 'Đơn xin vào đang chờ duyệt' : 'Đã vào', '');

  const oThao = o('', 'text-align:right');

  // ⚠ NÚT ĐỀ XUẤT CHỈ TRÊN CHÂN ĐÃ DUYỆT CHƯA GẮN AI (9.2②). Đơn còn chờ và
  //   lời mời chưa nhận thì `nop_de_xuat_gan()` từ chối (đo Q4, Q5) — vẽ nút ở
  //   đó là mời người ta bấm để nghe từ chối.
  // ⚠ Nút này KHÔNG gắn gì. Nó mở khung nộp ĐƠN, và một quản trị KHÁC xét ở
  //   `#gia-pha/cay/<mã>/de-xuat-gan` — cửa thứ TÁM, gác ở máy chủ.
  if (trangThai === 'thanhvien' && docDuocChan && !(chan && chan.maNguoi)) {
    const dangMo = deXuatDangMo === c.fileId;
    const b = nut(dangMo ? 'Thu lại' : 'Đề xuất mã người', false);
    b.addEventListener('click', () => {
      deXuatDangMo = dangMo ? null : c.fileId;
      napLai();
    });
    oThao.append(b);
  }

  tr.append(oTen, oMa, oVai, oNguoi, oTrang, oThao);
  return tr;
}

function moDeXuat(oViec, c, napLai) {
  const cay = { treeId: c.fileId, ten: c.ten || '', maCay: c.treeCode || '' };
  oViec.className = 'qt-khung-viec';
  // `t` rỗng: khung một việc này chỉ cần biết CÂY — người nộp là chính người
  // đang đăng nhập, máy chủ đọc `auth.uid()`, không nhận ai từ trình duyệt.
  oViec.append(bangDeXuatCuaToi({}, cay, napLai));
}

// ============================================================
// Bảo mật — đổi mật khẩu · đăng xuất
// ============================================================

function veKhoiMatKhau() {
  const khoi = veKhoi('Bảo mật và đổi mật khẩu');

  const form = document.createElement('div');
  form.className = 'qt-form';

  const oCu = oMatKhau('Mật khẩu hiện tại', 'current-password');
  const oMoi = oMatKhau('Mật khẩu mới', 'new-password');
  const oLai = oMatKhau('Gõ lại mật khẩu mới', 'new-password');
  form.append(oCu.nhan, oMoi.nhan, oLai.nhan);

  const bao = dongBao();

  const bDoi = nut('Cập nhật mật khẩu', true);
  bDoi.addEventListener('click', async () => {
    bao.style.color = '#a83220';
    // Ba phép dưới đây chỉ để khỏi gửi một yêu cầu chắc chắn vô ích. Luật độ
    // dài là của Supabase — câu từ chối của nó hiện nguyên văn.
    if (!oCu.o.value || !oMoi.o.value) {
      bao.textContent = 'Gõ đủ mật khẩu hiện tại và mật khẩu mới.';
      return;
    }
    if (oMoi.o.value !== oLai.o.value) {
      bao.textContent = 'Hai lần gõ mật khẩu mới không khớp nhau.';
      return;
    }
    if (oMoi.o.value === oCu.o.value) {
      bao.textContent = 'Mật khẩu mới trùng mật khẩu hiện tại.';
      return;
    }
    bDoi.disabled = true;
    bDoi.textContent = 'Đang đổi…';
    const kq = await doiMatKhau(oCu.o.value, oMoi.o.value);
    bDoi.disabled = false;
    bDoi.textContent = 'Cập nhật mật khẩu';
    if (!kq.ok) { bao.textContent = kq.loi || 'Không đổi được mật khẩu.'; return; }
    oCu.o.value = ''; oMoi.o.value = ''; oLai.o.value = '';
    bao.style.color = '#2f6b3a';
    bao.textContent = 'Đã đổi mật khẩu. Lần đăng nhập sau dùng mật khẩu mới.';
  });

  // Đăng xuất đi hai nhịp: một cú bấm lỡ tay là phải gõ lại mật khẩu.
  const bRa = nutHaiNhip('Đăng xuất', 'Bấm lần nữa để đăng xuất', false, async () => {
    const kq = await dangXuat();
    if (kq && kq.ok) { window.location.reload(); return true; }
    bao.style.color = '#a83220';
    bao.textContent = (kq && kq.loi) || 'Không đăng xuất được.';
    return false;
  }, true);

  const hang = document.createElement('div');
  hang.className = 'qt-hang-nut';
  hang.append(bDoi, bRa);

  form.append(hang, bao);
  khoi.append(form);
  return khoi;
}

function oMatKhau(chu, tuDien) {
  const nhan = document.createElement('label');
  nhan.className = 'qt-nhan-o';
  nhan.textContent = chu;
  const o = document.createElement('input');
  o.type = 'password';
  o.className = 'qt-o-nhap';
  // `autocomplete` đúng tên là thứ khiến trình quản lý mật khẩu điền hộ ô cũ
  // và đề nghị lưu ô mới — cùng lý do `dang-nhap.js` đặt nó.
  o.autocomplete = tuDien;
  nhan.append(o);
  return { nhan, o };
}
