// ============================================================
// giapha · js/domains/excel.js
// Vai trò  : Đọc file Excel "một bảng" (đặc tả DAC-TA-LOI, sheet `DuLieu`
//            kiểu phần mềm gia phả trên nền Excel) thành bản XEM TRƯỚC —
//            CÙNG KHUÔN với `parseGedcom()` để đi chung đường "tạo gia phả
//            mới" đã có (`mergeImported(tree, kq, {che:'moi'})`). Không có
//            `DuLieu` mà có `BangPhang` thì đọc khuôn Xuất Excel (b160).
// Lớp      : domains — được gọi bởi: pages · được phép gọi: utils, config
// Phụ thuộc: utils/date · config · vendor/xlsx.mjs (SheetJS), đọc `.xlsb`/`.xlsx`
// Phiên bản: 0.5.0 · Cập nhật: 29/09/2026 23:10
// Sổ tay   : so-tay/nhap-xuat.md
// ============================================================
//
// ⚠ HÀM `parseExcel` KHÔNG THUẦN TUYỆT ĐỐI như `parseGedcom`: nó nạp một thư
// viện đọc Excel (SheetJS) vì `.xlsb` là định dạng nhị phân nén, trình duyệt
// không tự đọc được như đọc chữ thuần của `.ged`. Đây là chỗ duy nhất trong
// tầng `domains` làm vậy — chủ dự án đã chọn đường này (30/08/2026) thay vì
// bắt xuất trước sang CSV.
//
// Từ 01/09/2026 thư viện ấy nằm **trong repo** (`js/vendor/xlsx.mjs`), không
// còn nạp từ `cdn.sheetjs.com`. Nhờ vậy app, bộ kiểm và Node đều chạy đúng một
// bản, và chức năng nhập không chết theo một máy chủ của người lạ. Xem
// `js/vendor/DOC-VENDOR.md` — ở đó có mã băm, giấy phép và cách nâng cấp.
//
// --- VÌ SAO DỰNG UNION TỪ DÒNG NGƯỜI, KHÔNG TỪ DÒNG "FAM" NHƯ GEDCOM -------
//
// GEDCOM có bản ghi FAM riêng cho từng cặp. Bảng Excel này KHÔNG có — quan hệ
// nằm ở CHÍNH DÒNG NGƯỜI: `ID cha` · `ID mẹ` · `ID phối ngẫu 1/2`. Phải tự
// suy ra từng cặp bằng cách gom các dòng lại. Đã đo trên dữ liệu thật (681
// người, chốt 30/08/2026): 375/375 cặp (cha, mẹ) khớp ĐÚNG với danh sách vợ
// chồng tự khai — không một ca lệch nào — nên phép suy này an toàn, không
// phải đoán mò.
//
// Ba loại union sinh ra:
//   1. CẶP KHAI RÕ — từ `ID phối ngẫu 1/2`, có thể có con hoặc không (20/133
//      cặp không con — hôn nhân không con, vẫn là union thật).
//   2. CẶP CÓ CON, một bên KHÔNG RÕ — dòng con chỉ có `ID cha` (172 ca) hoặc
//      chỉ `ID mẹ` (2 ca). Phần lớn (138/172) vì cha chỉ có một vợ ĐÃ TỪNG
//      qua đời/không lưu riêng; số còn lại (34/172) vì cha có NHIỀU vợ mà
//      dòng con không nói rõ vợ nào — cả hai ca đều xếp vào một "cặp" chỉ có
//      MỘT người, KHÔNG suy đoán người kia là ai. Đây là ứng dụng đúng luật
//      "trường trống thì không vẽ hàng đó": không đủ căn cứ thì để trống,
//      không bịa.
//
// `Số thứ tự hôn nhân` (ghi ở dòng người có thứ bậc khác 1 — thường là vợ)
// khớp thẳng `union.ranks[personId]`; `Số thứ tự con` khớp thẳng
// `children[].order`. Đo trên cặp đông con nhất (9 con): thứ tự ra đúng
// 1..9 liên tục — không cần tự đếm lại.

import { parseLooseDate } from '../utils/date.js';
import { nhanQuanHeCon } from '../config.js';

const TEN_SHEET = 'DuLieu';
// Khuôn thứ hai (b160): BẢNG PHẲNG của bản Xuất Excel — xem `docBangPhang()`.
const TEN_SHEET_PHANG = 'BangPhang';

const COT = {
  doi: 'Đời', maSoCu: 'Mã số', tenHuy: 'Tên húy', bietDanh: 'Biệt danh',
  gioiTinh: 'Giới tính', ngaySinh: 'Ngày sinh', tinhTrang: 'Tình trạng',
  noiSinh: 'Nơi sinh', ngayMat: 'Ngày mất', ngayGio: 'Ngày giỗ',
  moTai: 'Mộ tại', tieuSu: 'Tiểu sử', thongTinKhac: 'Thông tin khác',
  idMoi: 'ID mới', idCha: 'ID cha', idMe: 'ID me',
  ps1: 'ID phối ngẫu 1', ps2: 'ID phối ngẫu 2',
  soThuTuHonNhan: 'Số thứ tự hôn nhân', soThuTuCon: 'Số thứ tự con',
  // Bảy cột KHÔNG có trong khuôn mẫu — file nào có (chép từ bản Xuất Excel,
  // `pages/quan-tri/xuat-excel.js`) thì đọc, không có thì thôi.
  title: 'Chức tước', occupation: 'Nghề nghiệp', education: 'Học vấn',
  religion: 'Tôn giáo', residence: 'Nơi ở', nationality: 'Dân tộc', contact: 'Liên hệ',
};
// Tên thứ hai của cùng một cột. "ID me" không dấu là tên gốc của khuôn, nhưng
// người điền gõ "ID mẹ" là chuyện tự nhiên — trước b160 cột ấy bị bỏ qua IM
// LẶNG, cả file mất hết mẹ mà bản xem trước vẫn báo đọc được.
const COT_TEN_KHAC = { idMe: ['ID mẹ'] };
const COT_THONG_TIN = ['title', 'occupation', 'education', 'religion', 'residence',
  'nationality', 'contact'];

// ============================================================
// Thư viện đọc Excel — nằm trong repo, nạp chậm
// ============================================================

let _xlsxDaNap = null;

async function layThuVienXlsx() {
  // SheetJS Community Edition (Apache-2.0) đọc được `.xlsb`/`.xlsx`/`.xls`/
  // `.csv`… Bản 0.20.3, chép nguyên vào `js/vendor/` ngày 01/09/2026.
  //
  // `import()` ĐỘNG chứ không phải `import` ở đầu file: 1 MB này chỉ tải khi
  // người dùng thật sự bấm nhập Excel, đường khởi động app không đụng tới.
  // Đường dẫn tương đối nên chạy đúng cả trên GitHub Pages lẫn trong Node.
  if (!_xlsxDaNap) _xlsxDaNap = await import('../vendor/xlsx.mjs');
  return _xlsxDaNap;
}

// ============================================================
// Đọc bảng thô
// ============================================================

/**
 * Đọc `arrayBuffer` của file `.xlsb`/`.xlsx` thành bản xem trước.
 *
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<object>} cùng khuôn với kết quả `parseGedcom()`.
 */
export async function parseExcel(arrayBuffer) {
  const canhBao = [];
  let XLSX;
  try {
    XLSX = await layThuVienXlsx();
  } catch (e) {
    return ketQuaLoi('Không nạp được thư viện đọc Excel (file ' +
      'js/vendor/xlsx.mjs của chính ứng dụng). Thử tải lại trang. ' +
      (e && e.message ? e.message : String(e)));
  }

  let wb;
  try {
    wb = XLSX.read(arrayBuffer, { type: 'array' });
  } catch (e) {
    return ketQuaLoi('Không đọc được file này — có thể không phải file Excel ' +
      'hợp lệ, hoặc file có mật khẩu MỞ FILE (khác mật khẩu VBA). ' +
      (e && e.message ? e.message : String(e)));
  }

  const sheet = wb.Sheets[TEN_SHEET];
  if (!sheet && wb.Sheets[TEN_SHEET_PHANG]) return docBangPhang(XLSX, wb.Sheets[TEN_SHEET_PHANG]);
  if (!sheet) {
    return ketQuaLoi('File không có sheet "' + TEN_SHEET + '" (khuôn nhập mẫu) hay "' +
      TEN_SHEET_PHANG + '" (bản Xuất Excel dạng bảng phẳng). Khuôn hai sheet ' +
      '"Nguoi" + "GiaDinh" chưa nhập được.');
  }

  const hang = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
  if (hang.length < 2) return ketQuaLoi('Sheet "' + TEN_SHEET + '" không có dòng dữ liệu nào.');

  const header = hang[0];
  const idx = {};
  const tieuDe = header.map((c) => chu(c));
  for (const [k, ten] of Object.entries(COT)) {
    idx[k] = [ten, ...(COT_TEN_KHAC[k] || [])].map((t) => tieuDe.indexOf(t))
      .find((i) => i >= 0) ?? -1;
  }
  if (idx.idMoi === -1) {
    return ketQuaLoi('Không tìm thấy cột "ID mới" — đây có phải đúng khuôn ' +
      'file gia phả một bảng không?');
  }

  // --- Lọc dòng THẬT: bỏ hàng nghìn dòng trống của khung mẫu -------------
  const dongThat = hang.slice(1).filter((r) => coGiaTriO(r, idx.idMoi));

  // --- Dựng bản thô cho từng người, khoá theo "ID mới" gốc trong file -----
  const nguoiTho = new Map();
  for (const r of dongThat) {
    const rawId = String(layO(r, idx.idMoi)).trim();
    if (!rawId || nguoiTho.has(rawId)) continue; // trùng ID mới: giữ dòng đầu
    nguoiTho.set(rawId, docDongNguoi(r, idx, rawId));
  }

  // --- Union: suy từ ID cha/mẹ/phối ngẫu -----------------------------------
  const { unionsTho, soCaMoHoMe } = xepUnion(nguoiTho);

  if (soCaMoHoMe > 0) {
    canhBao.push({
      muc: 'nhe',
      chu: soCaMoHoMe + ' người con có cha nhiều vợ nhưng dòng con không nói ' +
           'rõ là con bà nào — đã xếp riêng, KHÔNG đoán là con của người vợ ' +
           'nào. Xem lại bằng tay sau khi nhập nếu cần.',
    });
  }
  // Chỉ nói khi file THẬT SỰ có mấy cột ấy. File mẫu do app phát ra không có
  // chúng, mà một lời cảnh báo về cột không tồn tại thì người đọc phải đi tìm
  // xem mình đã làm sai gì — mất lòng tin vào cả những cảnh báo thật.
  if (header.some((c) => /^Đời \d+$/.test(String(c).trim()))) {
    canhBao.push({
      muc: 'nhe',
      chu: 'Hai mươi cột "Đời 1..Đời 20" của file (tên dòng trưởng từng nhánh, ' +
           'để hiển thị) KHÔNG được nhập — app tự tính lại quan hệ từ cha/mẹ/' +
           'vợ chồng, không cần bảng ấy.',
    });
  }

  return ketQuaTuTho(nguoiTho, unionsTho, canhBao);
}

/** Cấp mã P/U (theo Đời rồi thứ tự trong file) và dựng kết quả — chung hai khuôn. */
function ketQuaTuTho(nguoiTho, unionsTho, canhBao) {
  // Sắp ỔN ĐỊNH: cùng Đời thì giữ thứ tự dòng trong file.
  const thuTuNguoi = [...nguoiTho.values()].sort((a, b) => (a.doi || 9999) - (b.doi || 9999));
  const maNguoi = new Map();
  thuTuNguoi.forEach((p, i) => maNguoi.set(p.rawId, 'P' + String(i + 1).padStart(4, '0')));
  const maUnion = new Map();
  unionsTho.forEach((u, i) => maUnion.set(u.key, 'U' + String(i + 1).padStart(4, '0')));

  const persons = thuTuNguoi.map((p) => dungNguoi(p, maNguoi.get(p.rawId)));
  const unions = unionsTho.map((u) => dungUnion(u, maUnion, maNguoi));

  return {
    persons, unions, sources: [],
    tenCay: '', nguonXuat: '', maNguon: 'EXCEL',
    thongKe: {
      soNguoi: persons.length, soCap: unions.length, soNguon: 0,
      soAnhBoQua: 0, soDongHong: 0, soDongBoQua: 0, soAn: 0, soDoiMa: 0,
    },
    theLa: [], doiMa: [], anhBoQua: [], canhBao,
  };
}

// ============================================================
// Khuôn BẢNG PHẲNG — chính file "Xuất Excel ▾ → Bảng phẳng" (b160)
// ============================================================
//
// Tên cột phải khớp TỪNG CHỮ `pages/quan-tri/xuat-excel.js` (bảng `CHA_ME`
// và `chuCon()` ở đó) — đổi tên cột bên xuất thì đổi cả ở đây.
//
// Khác khuôn `DuLieu`: cha/mẹ theo NĂM loại quan hệ (`ID cha nuôi`, `ID mẹ
// kế`…, có thể đánh số khi một người có hai cặp cùng loại) · phối ngẫu 1…N
// không giới hạn · KHÔNG có cột số thứ tự: thứ tự con lấy từ vị trí trong
// `ID con 1…N` của cha/mẹ; phối ngẫu thứ k (k ≥ 2) mang thứ bậc k — chủ dự
// án: *"id phối ngẫu 1 hiển nhiên là hôn nhân 1"* (b125f).
// Khuôn này KHÔNG mang: ngày/nơi cưới, tình trạng hôn nhân, nơi mất, tên
// phụ ngoài biệt danh — nhập vào thì các trường ấy trống.

const THU_TU_QUAN_HE = ['birth', 'adopted', 'step', 'foster', 'thua_tu'];
const CHA_ME_PHANG = {
  birth: ['cha', 'mẹ'], adopted: ['cha nuôi', 'mẹ nuôi'], step: ['cha dượng', 'mẹ kế'],
  foster: ['cha nuôi dưỡng', 'mẹ nuôi dưỡng'], thua_tu: ['cha thừa tự', 'mẹ thừa tự'],
};
function tenConPhang(loai) {
  return loai === 'birth' ? 'con' : nhanQuanHeCon(loai, 'con').toLowerCase();
}

/** Phân loại các cột quan hệ của bảng phẳng theo tiêu đề. */
function docCotQuanHe(tieuDe) {
  const chaMe = [];     // {i, loai, vai: 0 cha | 1 mẹ, nhom}
  const phoiNgau = [];  // {i, so}
  const con = [];       // {i, loai, so}
  tieuDe.forEach((t, i) => {
    let m = t.match(/^ID phối ngẫu (\d+)$/);
    if (m) { phoiNgau.push({ i, so: Number(m[1]) }); return; }
    for (const loai of THU_TU_QUAN_HE) {
      for (let vai = 0; vai < 2; vai++) {
        m = t.match(new RegExp('^ID ' + CHA_ME_PHANG[loai][vai] + '(?: (\\d+))?$'));
        if (m) { chaMe.push({ i, loai, vai, nhom: m[1] ? Number(m[1]) : 1 }); return; }
      }
      m = t.match(new RegExp('^ID ' + tenConPhang(loai) + ' (\\d+)$'));
      if (m) { con.push({ i, loai, so: Number(m[1]) }); return; }
    }
  });
  phoiNgau.sort((a, b) => a.so - b.so);
  con.sort((a, b) => a.so - b.so);
  return { chaMe, phoiNgau, con };
}

function docBangPhang(XLSX, sheet) {
  const hang = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
  if (hang.length < 2) return ketQuaLoi('Sheet "' + TEN_SHEET_PHANG + '" không có dòng dữ liệu nào.');

  const tieuDe = hang[0].map((c) => chu(c));
  const idx = {};
  for (const [k, ten] of Object.entries(COT)) idx[k] = tieuDe.indexOf(ten);
  idx.idMoi = tieuDe.indexOf('ID');
  if (idx.idMoi === -1) {
    return ketQuaLoi('Sheet "' + TEN_SHEET_PHANG + '" không có cột "ID" — đây có phải ' +
      'file do nút Xuất Excel (Bảng phẳng) tạo ra không?');
  }
  // Cột quan hệ của khuôn `DuLieu` không dùng ở đây — `ID cha` đọc lại bên dưới.
  for (const k of ['idCha', 'idMe', 'ps1', 'ps2', 'soThuTuHonNhan', 'soThuTuCon']) idx[k] = -1;
  const cot = docCotQuanHe(tieuDe);

  const nguoiTho = new Map();
  for (const r of hang.slice(1)) {
    const rawId = chu(layO(r, idx.idMoi));
    if (!rawId || nguoiTho.has(rawId)) continue;
    const p = docDongNguoi(r, idx, rawId);
    // Cột Đời của bản xuất là số máy chủ TÍNH (`tree_persons.doi`), không phải
    // số ghi tay — không cất vào `vn.generation`; chỉ dùng để xếp mã.
    if (p.vn) { delete p.vn.generation; if (Object.keys(p.vn).length === 0) p.vn = undefined; }
    // Ô tên TRỐNG là người chưa có tên trong app — không phải "tên lạ cần
    // ghi lại", nên bỏ dòng "Tên húy trong Excel: (trống)" khỏi ghi chú.
    if (chu(layO(r, idx.tenHuy)) === '') {
      p.note = p.note.split('\n').filter((l) => l !== 'Tên húy trong Excel: (trống)').join('\n');
    }
    p.chaMe = cot.chaMe.map((c) => ({ ...c, id: chu(layO(r, c.i)) })).filter((c) => c.id);
    p.phoiNgau = cot.phoiNgau.map((c) => chu(layO(r, c.i))).filter(Boolean);
    p.con = cot.con.map((c) => ({ loai: c.loai, id: chu(layO(r, c.i)) })).filter((c) => c.id);
    nguoiTho.set(rawId, p);
  }

  const unionsTho = xepUnionPhang(nguoiTho);
  return ketQuaTuTho(nguoiTho, unionsTho, [{
    muc: 'nhe',
    chu: 'Đọc theo khuôn Bảng phẳng (bản Xuất Excel). Khuôn này không có ngày ' +
         'cưới, tình trạng hôn nhân, nơi mất — các trường ấy sẽ trống. Thứ tự ' +
         'vợ/chồng lấy theo cột "ID phối ngẫu 1, 2…".',
  }]);
}

function xepUnionPhang(nguoiTho) {
  const co = (id) => id && nguoiTho.has(id);
  const unionMap = new Map();
  const layHoacTao = (ids) => {
    const key = ids.length === 2 ? [...ids].sort().join('|') : 'MOT:' + ids[0];
    let u = unionMap.get(key);
    if (!u) {
      // Nam đứng trước, như khuôn `DuLieu`.
      const ps = ids.length === 2 && nguoiTho.get(ids[1]).sex === 'M' &&
        nguoiTho.get(ids[0]).sex !== 'M' ? [ids[1], ids[0]] : ids.slice();
      u = { key, partners: ps, children: [] };
      unionMap.set(key, u);
    }
    return u;
  };

  // 1. Vợ chồng từ `ID phối ngẫu 1…N`, theo thứ tự cột.
  for (const p of nguoiTho.values()) {
    for (const sp of p.phoiNgau) if (co(sp) && sp !== p.rawId) layHoacTao([p.rawId, sp]);
  }

  // 2. Con — mỗi (loại, nhóm) cha/mẹ trên dòng người con là MỘT cặp sinh ra/nuôi họ.
  for (const p of nguoiTho.values()) {
    const nhom = new Map();
    for (const c of p.chaMe) {
      const k = c.loai + '#' + c.nhom;
      if (!nhom.has(k)) nhom.set(k, { loai: c.loai, ids: [null, null] });
      nhom.get(k).ids[c.vai] = c.id;
    }
    for (const g of nhom.values()) {
      const ids = g.ids.filter((id) => co(id) && id !== p.rawId);
      if (ids.length === 0) continue;
      const u = layHoacTao(ids);
      if (!u.children.some((c) => c.rawId === p.rawId)) u.children.push({ rawId: p.rawId, loai: g.loai });
    }
  }

  // 3. Thứ tự con: vị trí trong `ID <loại con> 1…N` của cha/mẹ, loại trước.
  for (const u of unionMap.values()) {
    const viTri = (c) => {
      let tot = Infinity;
      for (const id of u.partners) {
        const ds = nguoiTho.get(id).con.filter((x) => x.loai === c.loai).map((x) => x.id);
        const i = ds.indexOf(c.rawId);
        if (i >= 0 && i < tot) tot = i;
      }
      return THU_TU_QUAN_HE.indexOf(c.loai) * 100000 + (tot === Infinity ? 99999 : tot);
    };
    u.children.sort((a, b) => viTri(a) - viTri(b));
  }

  // 4. Thứ bậc: người đứng ở `ID phối ngẫu k` (k ≥ 2) của ai thì mang bậc k
  //    trong cặp ấy — cùng nghĩa `union.ranks[personId]` của khuôn `DuLieu`.
  for (const p of nguoiTho.values()) {
    p.phoiNgau.filter((sp) => co(sp) && sp !== p.rawId).forEach((sp, i) => {
      if (i === 0) return;
      const u = unionMap.get([p.rawId, sp].sort().join('|'));
      if (!u.ranks) u.ranks = {};
      u.ranks[sp] = i + 1;
    });
  }

  return [...unionMap.values()];
}

function ketQuaLoi(loi) {
  return {
    persons: [], unions: [], sources: [],
    tenCay: '', nguonXuat: '', maNguon: 'EXCEL',
    thongKe: { soNguoi: 0, soCap: 0, soNguon: 0, soAnhBoQua: 0, soDongHong: 0,
               soDongBoQua: 0, soAn: 0, soDoiMa: 0 },
    theLa: [], doiMa: [], anhBoQua: [],
    canhBao: [{ muc: 'nang', chu: loi }],
  };
}

// ============================================================
// Một dòng người
// ============================================================

function layO(r, i) { return i >= 0 && i < r.length ? r[i] : ''; }
function coGiaTriO(r, i) {
  const v = layO(r, i);
  return v !== null && v !== undefined && String(v).trim() !== '';
}
function chu(v) { return v === null || v === undefined ? '' : String(v).trim(); }

/** Ô có/không: `true`/`false`, chuỗi "TRUE"/"FALSE", hoặc chữ trong hai danh sách. Khác thì `null`. */
function docCo(v, chuCo, chuKhong) {
  if (v === true || v === false) return v;
  const t = chu(v).toLowerCase();
  if (t === 'true' || chuCo.includes(t)) return true;
  if (t === 'false' || chuKhong.includes(t)) return false;
  return null;
}

/** Ô ngày kiểu " __/__/____" hoặc " __/__" — chỗ trống của khuôn Excel, không phải chữ. */
function laNgayTrong(s) {
  return s === '' || s.indexOf('_') >= 0;
}

const TEN_KHONG_RO = new Set(['không rõ', '..', '...', '.']);

/** Bỏ số thứ tự app tự đánh đứng đầu tên: "1 Nguyễn…", "Bà 2. …", "Bà 1: …". */
function boSoThuTuDauTen(s) {
  let t = s.replace(/^\d+\s+/, '');
  t = t.replace(/^Bà\s*\d+\s*[.:]?\s*/i, '');
  return t.trim();
}

function laTenRong(s) {
  const t = s.trim();
  return t === '' || TEN_KHONG_RO.has(t.toLowerCase()) || /^_+$/.test(t);
}

/** Tách "Nguyễn Phúc Giáo" -> {surname:'Nguyễn', middle:'Phúc', given:'Giáo'}. */
function tachHoTen(s) {
  const manh = s.split(/\s+/).filter(Boolean);
  if (manh.length === 0) return { surname: '', middle: '', given: '' };
  if (manh.length === 1) return { surname: '', middle: '', given: manh[0] };
  return { surname: manh[0], middle: manh.slice(1, -1).join(' '), given: manh[manh.length - 1] };
}

function docNgay(raw) {
  const s = chu(raw);
  if (laNgayTrong(s)) return { iso: '', raw: '', place: '' };
  const d = parseLooseDate(s);
  // Đọc ra số nhưng KHÔNG chắc ("khoảng 1890") thì giữ nguyên văn ở `raw` —
  // bỏ đi là mất chữ "khoảng" (CLAUDE.md mục 7: không ghi đè `raw`).
  return { iso: d.iso || '', raw: d.iso && d.confident ? '' : s, place: '' };
}

function docDongNguoi(r, idx, rawId) {
  const tenHuyGoc = chu(layO(r, idx.tenHuy));
  const tenSauKhiBo = boSoThuTuDauTen(tenHuyGoc);
  const tenRong = laTenRong(tenSauKhiBo);
  const bietDanh = chu(layO(r, idx.bietDanh));

  const names = [];
  names.push(Object.assign(
    { type: 'chinh' },
    tenRong ? { surname: '', middle: '', given: '' } : tachHoTen(tenSauKhiBo),
  ));
  if (bietDanh) names.push(Object.assign({ type: 'thuong_goi' }, tachHoTen(bietDanh)));

  // Khuôn ghi TRUE/FALSE, nhưng ô định dạng chữ cho ra chuỗi "TRUE", và người
  // điền hay gõ "Nam"/"Nữ", "Còn sống"/"Đã mất" (đúng chữ bản Xuất Excel ghi).
  const gioiTinhO = docCo(layO(r, idx.gioiTinh), ['nam'], ['nữ', 'nu']);
  const sex = gioiTinhO === true ? 'M' : gioiTinhO === false ? 'F' : 'U';

  const tinhTrangO = docCo(layO(r, idx.tinhTrang), ['còn sống', 'con song', 'sống'],
    ['đã mất', 'da mat', 'mất']);
  const living = tinhTrangO === true ? true : tinhTrangO === false ? false : true;

  const maSoCu = chu(layO(r, idx.maSoCu));
  const ngayGio = chu(layO(r, idx.ngayGio));
  const ghiChu = [];
  if (maSoCu) ghiChu.push('Mã số cũ: ' + maSoCu);
  if (tenSauKhiBo !== tenHuyGoc.trim() || tenRong) {
    ghiChu.push('Tên húy trong Excel: ' + (tenHuyGoc || '(trống)'));
  }
  const tieuSu = chu(layO(r, idx.tieuSu));
  const thongTinKhac = chu(layO(r, idx.thongTinKhac));
  if (tieuSu) ghiChu.push(tieuSu);
  if (thongTinKhac) ghiChu.push(thongTinKhac);

  const doiRaw = layO(r, idx.doi);
  const doi = Number.isFinite(Number(doiRaw)) && Number(doiRaw) > 0 ? Math.round(Number(doiRaw)) : 0;

  const vn = {};
  if (doi > 0) vn.generation = doi;
  if (ngayGio && !laNgayTrong(ngayGio)) vn.gio = ngayGio;

  const soThuTuHonNhanRaw = layO(r, idx.soThuTuHonNhan);
  const soThuTuConRaw = layO(r, idx.soThuTuCon);

  const thongTin = {};
  for (const k of COT_THONG_TIN) thongTin[k] = chu(layO(r, idx[k]));

  return {
    rawId, doi,
    thongTin,
    names,
    sex,
    living,
    birth: docNgay(layO(r, idx.ngaySinh)),
    death: docNgay(layO(r, idx.ngayMat)),
    burialPlace: chu(layO(r, idx.moTai)),
    note: ghiChu.join('\n'),
    vn: Object.keys(vn).length > 0 ? vn : undefined,
    birthPlace: chu(layO(r, idx.noiSinh)),
    idCha: chu(layO(r, idx.idCha)),
    idMe: chu(layO(r, idx.idMe)),
    ps1: chu(layO(r, idx.ps1)),
    ps2: chu(layO(r, idx.ps2)),
    soThuTuHonNhan: Number.isFinite(Number(soThuTuHonNhanRaw)) ? Number(soThuTuHonNhanRaw) : 0,
    soThuTuCon: Number.isFinite(Number(soThuTuConRaw)) ? Number(soThuTuConRaw) : null,
  };
}

// ============================================================
// Union — suy từ dòng người, xem ghi chú đầu file
// ============================================================

function xepUnion(nguoiTho) {
  const pairKey = (a, b) => [a, b].sort().join('|');
  const unionMap = new Map();
  const layHoacTao = (key, partners) => {
    let u = unionMap.get(key);
    if (!u) { u = { key, partners: partners.slice(), children: [] }; unionMap.set(key, u); }
    return u;
  };

  // 1. Cặp vợ chồng khai rõ ở ID phối ngẫu 1/2.
  for (const p of nguoiTho.values()) {
    for (const sp of [p.ps1, p.ps2]) {
      if (!sp || !nguoiTho.has(sp) || sp === p.rawId) continue;
      const key = pairKey(p.rawId, sp);
      if (unionMap.has(key)) continue;
      const pb = nguoiTho.get(sp);
      const partners = (pb.sex === 'M' && p.sex !== 'M') ? [sp, p.rawId] : [p.rawId, sp];
      layHoacTao(key, partners);
    }
  }

  // 2. Gán con — đủ cả hai, hoặc chỉ một bên (không đoán bên kia).
  let soCaMoHoMe = 0;
  for (const p of nguoiTho.values()) {
    const coCha = p.idCha && nguoiTho.has(p.idCha);
    const coMe = p.idMe && nguoiTho.has(p.idMe);
    if (coCha && coMe) {
      const u = layHoacTao(pairKey(p.idCha, p.idMe), [p.idCha, p.idMe]);
      u.children.push(p);
    } else if (coCha) {
      const u = layHoacTao('CHA:' + p.idCha, [p.idCha]);
      u.children.push(p);
      // Cha có ≥2 vợ mà dòng con không nói rõ vợ nào — ca mơ hồ thật sự, khác
      // ca cha chỉ có một vợ (0 vợ ghi nhận trong file cũng tính là "không mơ
      // hồ": không có gì để chọn nhầm).
      const soVo = [...unionMap.values()]
        .filter((u2) => u2.partners.length === 2 && u2.partners.indexOf(p.idCha) >= 0).length;
      if (soVo >= 2) soCaMoHoMe++;
    } else if (coMe) {
      const u = layHoacTao('ME:' + p.idMe, [p.idMe]);
      u.children.push(p);
    }
  }

  // 3. Trong mỗi union: sắp con theo "Số thứ tự con", đánh số lại liền mạch.
  for (const u of unionMap.values()) {
    u.children.sort((a, b) => {
      const oa = a.soThuTuCon === null ? Infinity : a.soThuTuCon;
      const ob = b.soThuTuCon === null ? Infinity : b.soThuTuCon;
      return oa - ob;
    });
  }

  // 4. Thứ bậc — "Số thứ tự hôn nhân" ghi ở dòng NGƯỜI có thứ bậc khác 1
  //    (thường là vợ), khớp thẳng `union.ranks[personId]`. Vắng khoá nghĩa
  //    là 1, nên chỉ ghi khi số ấy thật sự > 1 — đúng quy ước b46.
  for (const u of unionMap.values()) {
    if (u.partners.length !== 2) continue;
    const ranks = {};
    for (const rawId of u.partners) {
      const p = nguoiTho.get(rawId);
      if (p && p.soThuTuHonNhan > 1) ranks[rawId] = p.soThuTuHonNhan;
    }
    if (Object.keys(ranks).length > 0) u.ranks = ranks;
  }

  return { unionsTho: [...unionMap.values()], soCaMoHoMe };
}

function dungUnion(u, maUnion, maNguoi) {
  const partners = u.partners.map((rawId) => maNguoi.get(rawId));
  const children = u.children.map((p, i) => ({
    personId: maNguoi.get(p.rawId), relation: p.loai || 'birth', order: i + 1,
  }));
  const ranks = {};
  if (u.ranks) {
    for (const rawId of Object.keys(u.ranks)) ranks[maNguoi.get(rawId)] = u.ranks[rawId];
  }
  const out = {
    id: '', uid: '', xrefGoc: '',
    partners, partnerOrder: partners.slice(),
    status: 'married',
    marriage: { iso: '', raw: '', place: '' },
    children, note: '', deleted: false,
  };
  if (Object.keys(ranks).length > 0) out.ranks = ranks;
  out.id = maUnion.get(u.key);
  return out;
}

function dungNguoi(p, id) {
  return {
    id, uid: '', xrefGoc: '',
    names: p.names,
    sex: p.sex,
    birth: Object.assign({}, p.birth, { place: p.birthPlace || p.birth.place }),
    death: p.death,
    burialPlace: p.burialPlace,
    ...p.thongTin,
    living: p.living,
    photoFileId: '',
    note: p.note,
    deleted: false,
    meta: { createdAt: '', updatedAt: '', updatedBy: '' },
    vn: p.vn,
  };
}
