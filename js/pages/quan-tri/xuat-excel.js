// ============================================================
// giapha-supabase · js/pages/quan-tri/xuat-excel.js
// Vai trò  : Xuất bảng Danh sách người (trang-nguoi.js) ra file Excel một
//            bảng, sheet `DuLieu` — CÙNG KHUÔN CỘT với `domains/excel.js`
//            (đường NHẬP đã có, b125e).
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: utils/{text,date} · vendor/xlsx.mjs (nạp bằng import() động)
// Phiên bản: 0.1.0 · Cập nhật: 27/09/2026 (b125e)
// ============================================================
//
// ⚠ **Tên 20 cột dưới đây PHẢI khớp `COT` của `domains/excel.js`** — đó là
//   nơi đọc lại. KHÔNG đặt hàm này trong `domains/`: `excel.js` nằm trong
//   mười file `domains/` phải giống hệt bit-với-bit giữa hai nhánh (`/kiem-tra`
//   phép 9) — thêm hàm xuất vào đó là buộc sửa cả bản Apps Script đã đóng
//   băng. Giữ khuôn cột trùng nhau bằng tay là đủ, không cần dùng chung hằng số.
//
// ⚠ Định dạng này vốn dựng cho việc NHẬP (mỗi người một dòng, quan hệ suy từ
//   ID cha/mẹ/phối ngẫu) — chỉ chứa được TỐI ĐA HAI vợ/chồng một người trên
//   một dòng. Ai có từ ba hôn nhân trở lên thì hai hôn nhân sau bị bỏ, IM
//   LẶNG — chấp nhận được ở bản đầu (điểm dừng b125e chỉ là "mở được bằng
//   Excel"), nhưng đừng dùng file này làm bản sao lưu đầy đủ.

import { fullName } from '../../utils/text.js';
import { formatDate } from '../../utils/date.js';

const TEN_SHEET = 'DuLieu';

// Đúng thứ tự và đúng chữ với `COT` của `domains/excel.js`.
const CỘT = [
  'Đời', 'Mã số', 'Tên húy', 'Biệt danh', 'Giới tính', 'Ngày sinh',
  'Tình trạng', 'Nơi sinh', 'Ngày mất', 'Ngày giỗ', 'Mộ tại', 'Tiểu sử',
  'Thông tin khác', 'ID mới', 'ID cha', 'ID me', 'ID phối ngẫu 1',
  'ID phối ngẫu 2', 'Số thứ tự hôn nhân', 'Số thứ tự con',
];

/**
 * Dựng mảng-của-mảng cho sheet `DuLieu`, từ `persons`/`unions` hình dạng
 * `rapCay()` (`services/hinh-dang.js`). Hàm THUẦN — không chạm DOM, không
 * nạp thư viện đọc/ghi Excel.
 *
 * @param {object[]} persons
 * @param {object[]} unions
 * @returns {Array[]} hàng đầu là tiêu đề `CỘT`, sau đó một hàng mỗi người
 *   CÒN SỐNG trong dữ liệu (bỏ người đã xoá mềm — xuất ra để nhập lại thì
 *   không nên kéo theo người đã xoá).
 */
export function dungHangExcel(persons, unions) {
  const theoId = new Map(persons.map((p) => [p.id, p]));

  // Cha/mẹ + số thứ tự con: quét MỘT LƯỢT mọi union, chỉ nhớ union ĐẦU TIÊN
  // làm cha mẹ cho mỗi người con (một người chỉ có một union sinh ra).
  const laConCua = new Map();  // personId -> {union, order}
  // Vợ/chồng: một người có thể là partner của NHIỀU union (tái hôn) — giữ cả
  // mảng, xuất tối đa hai (xem cảnh báo đầu file).
  const laVoChongCua = new Map();  // personId -> union[]

  for (const u of unions || []) {
    for (const c of u.children || []) {
      if (!laConCua.has(c.personId)) laConCua.set(c.personId, { union: u, order: c.order });
    }
    for (const pid of u.partners || []) {
      if (!laVoChongCua.has(pid)) laVoChongCua.set(pid, []);
      laVoChongCua.get(pid).push(u);
    }
  }

  const hang = persons.filter((p) => !p.deleted).map((p) => {
    let idCha = '', idMe = '', soThuTuCon = '';
    const laCon = laConCua.get(p.id);
    if (laCon) {
      soThuTuCon = laCon.order || '';
      for (const pid of laCon.union.partners || []) {
        if (pid === p.id) continue;
        const kia = theoId.get(pid);
        if (kia && kia.sex === 'F') { if (!idMe) idMe = pid; }
        else if (!idCha) idCha = pid;
        else if (!idMe) idMe = pid;
      }
    }

    const doiHonNhan = (laVoChongCua.get(p.id) || []).slice(0, 2);
    const idPhoiNgau = doiHonNhan.map((u) => (u.partners || []).find((pid) => pid !== p.id) || '');
    let soThuTuHonNhan = '';
    for (const u of doiHonNhan) {
      if (u.ranks && u.ranks[p.id] > 1) { soThuTuHonNhan = u.ranks[p.id]; break; }
    }

    const bietDanh = (p.names || []).find((n) => n && n.type === 'thuong_goi');

    return [
      (p.vn && p.vn.generation) || '',
      '',                                      // Mã số cũ — không có ở dữ liệu hiện hành
      fullName(p),
      bietDanh ? fullName(bietDanh) : '',
      p.sex === 'M' ? true : p.sex === 'F' ? false : '',
      formatDate(p.birth),
      p.living !== false,
      (p.birth && p.birth.place) || '',
      formatDate(p.death),
      (p.vn && p.vn.gio) || '',
      p.burialPlace || '',
      '',                                      // Tiểu sử — gộp vào Thông tin khác bên dưới
      p.note || '',
      p.id,
      idCha, idMe,
      idPhoiNgau[0] || '', idPhoiNgau[1] || '',
      soThuTuHonNhan, soThuTuCon,
    ];
  });

  return [CỘT, ...hang];
}

/**
 * Ghi file `.xlsx` và tự tải về — gọi từ một cú bấm chuột (`trang-nguoi.js`).
 *
 * @param {object[]} persons
 * @param {object[]} unions
 * @param {string} tenFile  không kèm đuôi `.xlsx`
 * @returns {Promise<{ok:boolean, loi?:string}>}
 */
export async function xuatExcelNguoi(persons, unions, tenFile) {
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
    const aoa = dungHangExcel(persons, unions);
    const sheet = XLSX.utils.aoa_to_sheet(aoa);
    wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, TEN_SHEET);
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
