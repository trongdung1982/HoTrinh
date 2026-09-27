// ============================================================
// giapha-supabase · js/pages/quan-tri/xuat-excel.js
// Vai trò  : Xuất bảng người của một cây ra Excel — HAI định dạng chọn được:
//            bảng phẳng cột ĐỘNG (thêm cột khi ai đó có nhiều cha mẹ/vợ
//            chồng, không bỏ sót như bản cũ) và hai sheet tách người/gia
//            đình (không giới hạn số hôn nhân/số con một người).
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: utils/{text,date} · config (nhãn quan hệ, trạng thái cặp) ·
//            vendor/xlsx.mjs (nạp bằng import() động)
// Phiên bản: 0.2.0 · Cập nhật: 27/09/2026 (b125f)
// ============================================================
//
// ⚠ KHÔNG đặt các hàm này trong `domains/`: `excel.js` (đọc) nằm trong mười
//   file `domains/` phải giống hệt bit-với-bit giữa hai nhánh (`/kiem-tra`
//   phép 9) — thêm hàm xuất vào đó kéo theo phải sửa cả bản Apps Script.
//
// ⚠ CẢ HAI định dạng KHÔNG nạp lại được qua màn Nhập GEDCOM/Excel — số cột
//   đổi theo từng lần xuất, sheet2 tách bảng khác hẳn khuôn `domains/excel.js`
//   đọc. Chỉ để xem/sửa tay/báo cáo (chốt 27/09/2026, KE-HOACH.md mục b125f).
//
// ⚠ Bỏ hẳn cột "Mã số" (mã Excel gốc thời trước app) và "Tiểu sử" (gộp vào
//   "Thông tin khác"). "ID mới" giữ TÊN CŨ nhưng là `p.id` thật, không đánh
//   lại — xem lý do ở KE-HOACH.md mục b125f.
//
// ⚠ Một NHÓM cột động (một loại quan hệ cha/mẹ, hoặc một cuộc hôn nhân) chỉ
//   mang SỐ THỨ TỰ khi cả cây có người có từ hai nhóm cùng loại trở lên —
//   nhưng LUÔN đủ hết mọi nhóm của mỗi người, không bỏ sót cặp thứ hai như
//   lỗi bản trước (`dungHangExcel` cũ). Xem `gomTheoNguoi()`/`dungCotDong()`.

import { fullName } from '../../utils/text.js';
import { formatDate } from '../../utils/date.js';
import { nhanQuanHeCon, nhanTrangThaiCap } from '../../config.js';

const TEN_SHEET_PHANG = 'BangPhang';
const TEN_SHEET_NGUOI = 'ThongTinNguoi';
const TEN_SHEET_GIADINH = 'GiaDinh';

// Nhãn NGẮN cho tên cột "ID cha <nhãn> <số>"/"ID mẹ <nhãn> <số>" — rút gọn từ
// `config.QUAN_HE_CON_NHAN` (ở đó nhãn ghép chung "Cha mẹ …", ở đây cần tách
// cha/mẹ riêng cột nên không dùng thẳng được). `birth` để rỗng — không hiện
// chữ, cùng quy ước với `chuThichQuanHe()`: con đẻ là lệ thường, không cần gọi tên.
const NHAN_NGAN = { birth: '', adopted: 'nuôi', step: 'kế', foster: 'nuôi dưỡng', thua_tu: 'thừa tự' };
const THU_TU_QUAN_HE = ['birth', 'adopted', 'step', 'foster', 'thua_tu'];

function chuGioiTinh(sex) { return sex === 'M' ? 'Nam' : sex === 'F' ? 'Nữ' : ''; }
function chuTinhTrang(living) { return living === false ? 'Đã mất' : 'Còn sống'; }

// ============================================================
// Cột THÔNG TIN NGƯỜI — dùng chung cho cả hai định dạng, KHÔNG có cột quan hệ
// ============================================================

const COT_NGUOI_TINH = [
  'ID', 'Đời', 'Tên húy', 'Biệt danh', 'Giới tính', 'Ngày sinh', 'Tình trạng',
  'Nơi sinh', 'Ngày mất', 'Ngày giỗ', 'Mộ tại', 'Chức tước', 'Nghề nghiệp',
  'Học vấn', 'Tôn giáo', 'Nơi ở', 'Dân tộc', 'Thông tin khác',
];

function hangNguoiTinh(p) {
  const bietDanh = (p.names || []).find((n) => n && n.type === 'thuong_goi');
  return [
    p.id,
    (p.vn && p.vn.generation) || '',
    fullName(p),
    bietDanh ? fullName(bietDanh) : '',
    chuGioiTinh(p.sex),
    formatDate(p.birth),
    chuTinhTrang(p.living),
    (p.birth && p.birth.place) || '',
    formatDate(p.death),
    (p.vn && p.vn.gio) || '',
    p.burialPlace || '',
    p.title || '',
    p.occupation || '',
    p.education || '',
    p.religion || '',
    p.residence || '',
    p.nationality || '',
    p.note || '',
  ];
}

// ============================================================
// Gom quan hệ theo NGƯỜI — nền chung cho bảng phẳng cột động
// ============================================================

/**
 * Với mỗi người: MỌI lần người ấy là con (theo từng loại quan hệ riêng) và
 * MỌI lần người ấy là vợ/chồng trong một union còn sống (chưa xoá mềm).
 * Quét MỘT LƯỢT `unionsSong`, không đoán, không bỏ sót — khác lỗi bản cũ chỉ
 * nhớ union ĐẦU TIÊN.
 */
function gomTheoNguoi(personsAll, unionsSong) {
  const theoId = new Map((personsAll || []).map((p) => [p.id, p]));
  const chaMeCuaNguoi = new Map();  // id -> Map(relation -> [{idCha,idMe,order}])
  const honNhanCuaNguoi = new Map(); // id -> union[]

  for (const u of unionsSong) {
    for (const c of u.children || []) {
      const relation = c.relation || 'birth';
      let idCha = '', idMe = '';
      for (const pid of u.partners || []) {
        if (pid === c.personId) continue;
        const kia = theoId.get(pid);
        if (kia && kia.sex === 'F') { if (!idMe) idMe = pid; else if (!idCha) idCha = pid; }
        else { if (!idCha) idCha = pid; else if (!idMe) idMe = pid; }
      }
      if (!chaMeCuaNguoi.has(c.personId)) chaMeCuaNguoi.set(c.personId, new Map());
      const theoLoai = chaMeCuaNguoi.get(c.personId);
      if (!theoLoai.has(relation)) theoLoai.set(relation, []);
      theoLoai.get(relation).push({ idCha, idMe, order: c.order || '' });
    }
    for (const pid of u.partners || []) {
      if (!honNhanCuaNguoi.has(pid)) honNhanCuaNguoi.set(pid, []);
      honNhanCuaNguoi.get(pid).push(u);
    }
  }
  return { chaMeCuaNguoi, honNhanCuaNguoi };
}

function soCotToiDa(map, persons) {
  let max = 0;
  for (const p of persons) max = Math.max(max, (map.get(p.id) || []).length);
  return max;
}

function soCotToiDaTheoLoai(chaMeCuaNguoi, persons) {
  const max = new Map();
  for (const p of persons) {
    const theoLoai = chaMeCuaNguoi.get(p.id);
    if (!theoLoai) continue;
    for (const [loai, ds] of theoLoai) max.set(loai, Math.max(max.get(loai) || 0, ds.length));
  }
  return max;
}

/**
 * Danh sách NHÓM cột động thật sự cần cho cây này — bỏ hẳn loại quan hệ
 * không ai dùng (không xuất cột rỗng), và chỉ đánh số khi cần (xem cảnh báo
 * đầu file).
 */
function dungCotDong(chaMeCuaNguoi, honNhanCuaNguoi, persons) {
  const maxTheoLoai = soCotToiDaTheoLoai(chaMeCuaNguoi, persons);
  const nhomChaMe = [];
  for (const loai of THU_TU_QUAN_HE) {
    const max = maxTheoLoai.get(loai) || 0;
    if (max === 0) continue;
    const coSo = max > 1;
    for (let i = 1; i <= max; i++) nhomChaMe.push({ loai, idx: i, coSo });
  }

  const maxHonNhan = soCotToiDa(honNhanCuaNguoi, persons);
  const coSoHonNhan = maxHonNhan > 1;
  const nhomHonNhan = [];
  for (let i = 1; i <= maxHonNhan; i++) nhomHonNhan.push({ idx: i, coSo: coSoHonNhan });

  return { nhomChaMe, nhomHonNhan };
}

function tenCotNhomChaMe(nhom) {
  const hau = nhom.coSo ? ' ' + nhom.idx : '';
  const qual = NHAN_NGAN[nhom.loai] ? ' ' + NHAN_NGAN[nhom.loai] : '';
  return {
    cha: 'ID cha' + qual + hau,
    me: 'ID mẹ' + qual + hau,
    thuTu: 'Số thứ tự con' + qual + hau,
  };
}

function tenCotNhomHonNhan(nhom) {
  const hau = nhom.coSo ? ' ' + nhom.idx : '';
  return { id: 'ID phối ngẫu' + hau, thuTu: 'Số thứ tự hôn nhân' + hau };
}

// ============================================================
// Định dạng 1 — BẢNG PHẲNG, cột động theo cây
// ============================================================

/**
 * Dựng mảng-của-mảng cho sheet `BangPhang` — một dòng một người CÒN SỐNG
 * trong dữ liệu (bỏ người đã xoá mềm), cột động theo cây (xem đầu file).
 * Hàm THUẦN — không chạm DOM, không nạp thư viện đọc/ghi Excel.
 *
 * @param {object[]} persons
 * @param {object[]} unions
 * @returns {Array[]}
 */
export function dungBangPhang(persons, unions) {
  const unionsSong = (unions || []).filter((u) => !u.deleted);
  const conSong = (persons || []).filter((p) => !p.deleted);
  const { chaMeCuaNguoi, honNhanCuaNguoi } = gomTheoNguoi(persons, unionsSong);
  const { nhomChaMe, nhomHonNhan } = dungCotDong(chaMeCuaNguoi, honNhanCuaNguoi, conSong);

  const dau = [...COT_NGUOI_TINH];
  for (const n of nhomChaMe) { const t = tenCotNhomChaMe(n); dau.push(t.cha, t.me, t.thuTu); }
  for (const n of nhomHonNhan) { const t = tenCotNhomHonNhan(n); dau.push(t.id, t.thuTu); }

  const hang = conSong.map((p) => {
    const dong = hangNguoiTinh(p);
    const theoLoai = chaMeCuaNguoi.get(p.id) || new Map();
    for (const n of nhomChaMe) {
      const muc = (theoLoai.get(n.loai) || [])[n.idx - 1];
      dong.push(muc ? muc.idCha : '', muc ? muc.idMe : '', muc ? muc.order : '');
    }
    const honNhan = honNhanCuaNguoi.get(p.id) || [];
    for (const n of nhomHonNhan) {
      const u = honNhan[n.idx - 1];
      if (!u) { dong.push('', ''); continue; }
      const idKia = (u.partners || []).find((pid) => pid !== p.id) || '';
      const rank = (u.ranks && u.ranks[p.id] > 1) ? u.ranks[p.id] : '';
      dong.push(idKia, rank);
    }
    return dong;
  });

  return [dau, ...hang];
}

// ============================================================
// Định dạng 2 — HAI SHEET, tách người / gia đình
// ============================================================

/**
 * Dựng hai bảng: `ThongTinNguoi` (thuộc tính cá nhân thuần, không quan hệ) và
 * `GiaDinh` (một dòng một cuộc hôn nhân — vợ/chồng, loại quan hệ với TỪNG
 * con, không giới hạn số con). Hàm THUẦN.
 *
 * @param {object[]} persons
 * @param {object[]} unions
 * @returns {{nguoi: Array[], giaDinh: Array[]}}
 */
export function dungHaiSheet(persons, unions) {
  const conSong = (persons || []).filter((p) => !p.deleted);
  const theoId = new Map((persons || []).map((p) => [p.id, p]));
  const unionsSong = (unions || []).filter((u) => !u.deleted);

  const sheetNguoi = [COT_NGUOI_TINH, ...conSong.map(hangNguoiTinh)];

  const dauGiaDinh = [
    'ID hôn nhân', 'ID vợ/chồng 1', 'Số thứ tự hôn nhân (vợ/chồng 1)',
    'ID vợ/chồng 2', 'Số thứ tự hôn nhân (vợ/chồng 2)',
    'Tình trạng hôn nhân', 'Ngày cưới', 'Các con (mã — quan hệ)', 'Ghi chú',
  ];
  const hangGiaDinh = unionsSong.map((u) => {
    const p1 = (u.partners || [])[0] || '';
    const p2 = (u.partners || [])[1] || '';
    const rank1 = (u.ranks && p1 && u.ranks[p1] > 1) ? u.ranks[p1] : '';
    const rank2 = (u.ranks && p2 && u.ranks[p2] > 1) ? u.ranks[p2] : '';
    const con = [...(u.children || [])]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .filter((c) => theoId.has(c.personId) && !theoId.get(c.personId).deleted)
      .map((c) => c.personId + ' — ' + nhanQuanHeCon(c.relation || 'birth', 'con'))
      .join('; ');
    return [
      u.id, p1, rank1, p2, rank2,
      nhanTrangThaiCap(u.status), formatDate(u.marriage), con, u.note || '',
    ];
  });

  return { nguoi: sheetNguoi, giaDinh: [dauGiaDinh, ...hangGiaDinh] };
}

// ============================================================
// Ghi file .xlsx và tự tải về
// ============================================================

/**
 * Ghi file `.xlsx` và tự tải về — gọi từ một cú bấm chuột (`trang-nguoi.js`).
 *
 * @param {object[]} persons
 * @param {object[]} unions
 * @param {string} tenFile  không kèm đuôi `.xlsx`
 * @param {'phang'|'hai-sheet'} kieu  mặc định `'phang'`
 * @returns {Promise<{ok:boolean, loi?:string}>}
 */
export async function xuatExcelNguoi(persons, unions, tenFile, kieu) {
  let XLSX;
  try {
    // Cùng thư viện với `domains/excel.js` (đọc), nạp riêng ở đây vì đây là
    // chỗ DUY NHẤT của `pages/quan-tri/` cần GHI Excel — domains/ không được
    // đụng (xem cảnh báo đầu file).
    XLSX = await import('../../vendor/xlsx.mjs');
  } catch (e) {
    return { ok: false, loi: 'Không nạp được thư viện ghi Excel (js/vendor/xlsx.mjs). ' +
      'Thử tải lại trang. ' + (e && e.message ? e.message : String(e)) };
  }

  let wb;
  try {
    wb = XLSX.utils.book_new();
    if (kieu === 'hai-sheet') {
      const { nguoi, giaDinh } = dungHaiSheet(persons, unions);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(nguoi), TEN_SHEET_NGUOI);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(giaDinh), TEN_SHEET_GIADINH);
    } else {
      const aoa = dungBangPhang(persons, unions);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), TEN_SHEET_PHANG);
    }
  } catch (e) {
    return { ok: false, loi: 'Không dựng được file: ' + (e && e.message ? e.message : String(e)) };
  }

  try {
    XLSX.writeFile(wb, tenFile + '.xlsx');
  } catch (e) {
    return { ok: false, loi: 'Không tải file về được: ' + (e && e.message ? e.message : String(e)) };
  }
  return { ok: true };
}
