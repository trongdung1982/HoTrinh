// ============================================================
// giapha-supabase · sao-luu/SaoLuu.gs
// Vai trò  : Trigger Apps Script chạy nền — chép toàn bộ cơ sở dữ liệu
//            Supabase ra một file JSON trên Google Drive, mỗi ngày một lần.
//            Kiêm luôn việc GIỮ SỐNG: gói miễn phí Supabase tự tạm dừng sau
//            7 ngày không có yêu cầu nào, và mỗi lần sao lưu là một yêu cầu.
// Lớp      : ngoài bậc thang phân lớp của app — mã này chạy trên máy chủ
//            Google, không nằm trong trình duyệt, không import file nào của repo.
// Phụ thuộc: Script Properties — SUPABASE_URL · KHOA_CONG_KHAI ·
//            EMAIL_SAO_LUU · MAT_KHAU_SAO_LUU (bắt buộc),
//            THU_MUC_DRIVE · SO_BAN_GIU (tuỳ chọn) ·
//            EMAIL_KHOI_PHUC · MAT_KHAU_KHOI_PHUC · KHOI_PHUC_CAY (chỉ điền
//            tạm khi chạy `khoiPhucAnh`, xong thì xoá)
//            SQL — luoc-do/05-sao-luu.sql phải chạy trước
// Phiên bản: 0.10.0 · Cập nhật: 29/09/2026 (b155e) — web app thêm việc
//            `sao-luu-ngay` (nút Sao lưu ngay). 0.9.0: WEB APP (`doPost`) —
//            liệt kê/tải bản sao lưu + khôi phục ảnh, chỉ QTHT.
//            0.8.0: báo dấu vân tay SHA-256 mỗi file ghi (`luoc-do/54`).
//            Ảnh (b154): chép sang Drive `Anh/<mã cây>/`, `khoiPhucAnh` tải
//            ngược lên. Ảnh trên Drive KHÔNG xoá theo app.
// Sổ tay   : so-tay/sao-luu.md
// ============================================================
//
// ⚠ ĐÂY KHÔNG PHẢI dự án Apps Script cũ. Dự án cũ (`giapha/gas/`) vẫn đang
//   phục vụ app mà người trong họ dùng hằng ngày và ĐÃ ĐÓNG BĂNG. File này
//   thuộc một dự án Apps Script RIÊNG, chỉ chạy nền, không có web app, không
//   có ai bấm vào.
//
// ⚠ KHÔNG MẬT KHẨU, KHÔNG KHOÁ NÀO NẰM TRONG FILE NÀY. Repo
//   `giapha-supabase` để Public, nên mọi chữ trong file này đều đi lên mạng —
//   kể cả sau khi xoá, vì lịch sử git giữ lại. Bốn giá trị cấu hình cất ở
//   **Script Properties**, xem `HUONG-DAN-SAO-LUU.md`.
//
// ═══ SAO LƯU KHÔNG DÙNG KHOÁ BÍ MẬT — đọc trước khi định "cho gọn" ═══
//
// Bản 0.1.0 dùng khoá bí mật, vì `luoc-do/02-rls.sql` cho mỗi người chỉ đọc
// được phần của mình ở hai bảng (`user_settings`, `branch_access`), nên một
// tài khoản thường sẽ chép thiếu **trong im lặng**. Lý lẽ ấy đúng, nhưng cách
// giải thì sai, và ngày 03/09/2026 nó đâm vào tường:
//
//   • Supabase chặn khoá `sb_secret_…` khi `User-Agent` giống trình duyệt;
//     Apps Script thì luôn gửi `Mozilla/5.0 (compatible; Google-Apps-Script;
//     …)` và Google không cho đổi. Hai luật đụng nhau, không bên nào nhường.
//   • Đường vòng duy nhất là khoá `service_role` đời cũ (`eyJ…`) — mà
//     Supabase khai tử loại ấy cuối 2026. Đi đường ấy là hẹn ngày hỏng.
//
// Bản 0.2.0 giải đúng chỗ: thay vì tìm một cái chìa vượt được RLS, thì **mở
// RLS cho đúng ba chỗ nó từng chặn** (`luoc-do/05-sao-luu.sql`) rồi đăng nhập
// như một người thường mang vai `sao_luu`.
//
// Vai `sao_luu` đọc được mọi dòng nhưng **không ghi được dòng nào**: cửa ghi
// duy nhất là `luu_cay()`, hàm ấy hỏi `co_the_sua()` = `role in ('chu','sua')`
// → false. Nên mật khẩu này lọt ra ngoài cũng không ai sửa được gia phả, khác
// hẳn khoá bí mật — thứ cầm được là ghi được mọi thứ ở mọi cây, mãi mãi.
// Tức bản mới vừa **chặt hơn** vừa không có hạn dùng.

// ------------------------------------------------------------
// Danh sách bảng và cột dùng để sắp thứ tự khi đọc theo trang
// ------------------------------------------------------------
// ⚠ Phải khớp ĐÚNG danh sách bảng dựng trong `luoc-do/` — không thiếu, không
//   thừa. `kiem-thu/kiem-sao-luu.mjs` phép 1 đọc thẳng CẢ thư mục SQL ấy và so
//   với bảng dưới đây, nên ngày ai đó thêm một bảng mà quên sao lưu nó thì bộ
//   kiểm đỏ ngay, chứ không phải phát hiện vào ngày cần khôi phục. Bảng cố ý
//   CHƯA sao lưu (hai bảng nhật ký) nêu đích danh ở `CHUA_SAO_LUU` của bộ kiểm.
//
// Vì sao phải nêu cột sắp thứ tự: đọc theo trang (`limit`/`offset`) mà không
// sắp thứ tự thì Postgres không hứa hai trang liên tiếp không trùng nhau và
// không bỏ sót. Với 681 người thì một trang là đủ và lỗi ấy không bao giờ lộ
// ra — cho tới ngày `change_log` vượt một nghìn dòng. Cột nêu ở đây là khoá
// chính của từng bảng, tức thứ tự luôn xác định.
//
// ⚠ Bốn bảng dùng chung BỎ `tree_id` ở `luoc-do/26` (b121) — khoá của chúng
//   nay chỉ còn mã bản ghi, và bảng MỚI `tree_persons` giữ "ai thuộc cây nào".
//   Để nguyên `tree_id,id` thì Supabase từ chối câu `order` vì cột không tồn
//   tại, và bản sao lưu đêm hỏng lặng lẽ — sai đúng vào thứ chỉ lộ ra ngày
//   cần khôi phục. Thiếu `tree_persons` thì bản sao lưu có đủ người mà không
//   biết người nào của cây nào.
var THU_TU_DOC = {
  trees:          'id',
  tree_members:   'tree_id,user_id',
  branches:       'tree_id,id',
  branch_access:  'tree_id,user_id,branch_id',
  tree_persons:   'tree_id,person_id',
  persons:        'id',
  unions:         'id',
  union_children: 'union_id,person_id',
  media:          'id',
  sources:        'tree_id,id',
  change_log:     'id',
  imports:        'id',
  user_settings:  'user_id,tree_id'
};

// ------------------------------------------------------------
// Sáu bảng CẤP HỆ THỐNG — đọc qua MỘT hàm, không qua REST từng bảng (b137)
// ------------------------------------------------------------
// ⚠ Bảng này không theo cây nên RLS của vai `sao_luu` (`05`) không với tới;
//   mở luật đọc trên `tai_khoan` (giữ cờ QTHT) là thêm cửa vào đúng bảng từng
//   thủng ở b102. Nên `luoc-do/44` dựng `sao_luu_bang_he_thong()`: một hàng
//   rào, trả trọn sáu bảng một lần. Danh sách dưới đây phải khớp ĐÚNG các khoá
//   hàm ấy trả — bộ kiểm phép 1 đếm cả hai danh sách.
// ⚠ Hàm hỏng (chưa dán `44`, mạng chập) thì KHÔNG làm hỏng cả bản sao lưu:
//   mười ba bảng gia phả vẫn ghi, file mang thêm `loiBangHeThong`.
var BANG_HE_THONG = ['cau_hinh', 'tai_khoan', 'doi_ma_toan_cuc',
                     'de_xuat_gan_nguoi', 'de_nghi_quan_he', 'de_xuat_dong_ho'];

var SO_DONG_MOI_TRANG = 1000;
var TEN_THU_MUC_MAC_DINH = 'Sao luu gia pha (Supabase)';
var SO_BAN_GIU_MAC_DINH = 30;
var KHUON_TEN_FILE = 'giapha-sao-luu-';

// Ảnh (b154). Apps Script cắt mọi lượt chạy ở 6 phút; chép ảnh dừng ở 4,5
// phút TÍNH TỪ ĐẦU LƯỢT (gồm cả lúc đọc bảng), phần còn lại để đêm sau.
// Dừng nửa chừng không hỏng gì: đêm sau so lại với Drive rồi chép tiếp.
var TEN_THU_MUC_ANH = 'Anh';
var GIAY_CHEP_ANH_TOI_DA = 270;
// Hỏng liền năm tấm thì thôi thử — gần như chắc là hỏng chung (mất quyền,
// mạng), thử tiếp chỉ đốt thời gian của lượt chạy.
var SO_LOI_LIEN_TIEP_TOI_DA = 5;

// ============================================================
// BA VIỆC CHỦ DỰ ÁN BẤM — cộng `khoiPhucAnh` (mục ẢNH), chỉ dùng ngày mất ảnh
// ============================================================

/**
 * Kiểm tra kết nối. KHÔNG ghi gì vào Drive, không đụng vào bản sao lưu nào.
 * Chạy hàm này trước tiên: nó nói được ngay là khoá đúng chưa, và mỗi bảng
 * hiện có bao nhiêu dòng.
 */
function kiemTraKetNoi() {
  var cauHinh = docCauHinh_();
  var dong = ['Kết nối tới: ' + cauHinh.url, ''];
  var tong = 0;
  var demDoc = {};
  Object.keys(THU_TU_DOC).forEach(function (bang) {
    var n = demDong_(cauHinh, bang);
    demDoc[bang] = n;
    tong += n;
    dong.push('  ' + bang + ': ' + n + ' dòng');
  });
  var heThong = docBangHeThong_(cauHinh);
  if (heThong.loi) {
    dong.push('  (sáu bảng hệ thống): LỖI — ' + heThong.loi);
  } else {
    BANG_HE_THONG.forEach(function (bang) {
      dong.push('  ' + bang + ': ' + heThong.bang[bang].length + ' dòng');
    });
  }
  var nguoi = docNguoiDung_(cauHinh);
  dong.push('  (tài khoản đăng nhập): ' + nguoi.length + ' người');
  dong.push('');
  dong.push('Tổng cộng ' + tong + ' dòng dữ liệu gia phả.');

  var demThat = docDemThat_(cauHinh);
  dong.push('');
  dong.push(demThat.loi
    ? 'Đối chiếu với máy chủ: LỖI — ' + demThat.loi
    : (soVoiMayChu_(demDoc, demThat.dem) ||
       'Đối chiếu với máy chủ: ĐỦ — đọc được mọi dòng máy chủ đang có.'));
  var ket = dong.join('\n');
  Logger.log(ket);
  return ket;
}

/**
 * Chép toàn bộ cơ sở dữ liệu ra một file JSON trên Drive. Đây là hàm mà
 * trigger hằng ngày gọi; chủ dự án cũng bấm tay được bất cứ lúc nào.
 */
function saoLuuNgay() {
  var cauHinh = null;
  try {
    cauHinh = docCauHinh_();
    var banSao = gomSaoLuu_(cauHinh);

    // ⚠ Cảnh báo sụt giảm phải chạy TRƯỚC khi ghi, nhưng KHÔNG được chặn việc
    //   ghi. Dữ liệu ít đi có thể là thật (dọn thùng rác), nên từ chối ghi là
    //   tự tay bỏ mất bản sao lưu của một ngày. Việc đúng là ghi, rồi hét lên.
    var loiCanhBao = soVoiLanTruoc_(banSao.dem);

    var thuMuc = layThuMuc_(cauHinh);
    var ten = KHUON_TEN_FILE + cauHinh.dauThoiGian + '.json';
    var noiDung = JSON.stringify(banSao, null, 1);
    var file = thuMuc.createFile(ten, noiDung, 'application/json');
    // Dấu vân tay tính trên ĐÚNG chuỗi vừa ghi — nút Khôi phục (`luoc-do/54`)
    // chỉ nhận file khớp dấu này.
    var loiDau = baoDauVanTay_(cauHinh, noiDung, ten);

    nhoDemLanNay_(banSao.dem);

    // ⚠ Nghi ngờ thì KHÔNG dọn. Nếu dữ liệu vừa mất thật, bản cũ đang là thứ
    //   duy nhất cứu được — dọn nó đi đúng lúc ấy là hỏng không sửa lại được.
    var daXoa = (loiCanhBao || banSao.thieuSoVoiMayChu) ? 0 : donBanCu_(thuMuc, cauHinh.soBanGiu);

    if (banSao.thieuSoVoiMayChu) {
      guiThu_('[Gia phả] ⛔ Bản sao lưu THIẾU dữ liệu so với máy chủ',
              banSao.thieuSoVoiMayChu + '\n\nFile vẫn đã được ghi: ' + ten +
              '\nBản sao lưu cũ CHƯA bị dọn — lần này bỏ qua bước dọn.');
    }
    if (loiCanhBao) {
      guiThu_('[Gia phả] ⚠ Bản sao lưu hôm nay ít dữ liệu hơn hẳn lần trước',
              loiCanhBao + '\n\nFile vẫn đã được ghi: ' + ten +
              '\nVà bản sao lưu cũ CHƯA bị dọn — lần này bỏ qua bước dọn.');
    }

    // Ảnh chép SAU khi file JSON đã nằm yên trên Drive: hỏng hay hết giờ ở
    // đây thì bản sao lưu dữ liệu chữ vẫn nguyên.
    var anh = chepAnhAnToan_(cauHinh, thuMuc, banSao.khoAnh.tep);

    var ketQua = 'Đã ghi ' + ten + ' (' + file.getSize() + ' byte). ' +
                 'Xoá ' + daXoa + ' bản cũ. Ảnh: chép thêm ' + anh.chepThem +
                 ', còn ' + anh.chuaChep + ' tấm chưa chép' +
                 (anh.loi ? ' — ' + anh.loi : '') + '.';
    // ⚠ Số ảnh KHÔNG vào `banSao.dem`: `nhoDemLanNay_` đã cất dem ấy để so
    //   sụt giảm đêm sau, mà "chưa chép" từ 300 về 0 là tin tốt, không phải
    //   dữ liệu mất.
    var demBao = {};
    Object.keys(banSao.dem).forEach(function (k) { demBao[k] = banSao.dem[k]; });
    demBao.anh_chep_them = anh.chepThem;
    demBao.anh_chua_chep = anh.chuaChep;
    baoNhatKy_(cauHinh, {
      ok: true, tenFile: ten, soByte: file.getSize(), daXoa: daXoa,
      canhBao: [loiCanhBao || '', anh.loi ? 'Chép ảnh: ' + anh.loi : '', loiDau]
        .filter(Boolean).join('\n'),
      thieu: banSao.thieuSoVoiMayChu || '', dem: demBao
    });
    Logger.log(ketQua);
    return ketQua;

  } catch (loi) {
    // Trigger chạy nền: hỏng mà không ai biết là kiểu hỏng tệ nhất của cả cơ
    // chế này — người ta chỉ phát hiện vào đúng ngày cần khôi phục.
    if (cauHinh) {
      baoNhatKy_(cauHinh, { ok: false, loi: loi && loi.message ? loi.message : String(loi) });
    }
    guiThu_('[Gia phả] ⛔ SAO LƯU HỎNG',
            'Bản sao lưu hằng ngày không chạy được.\n\n' +
            'Lỗi: ' + (loi && loi.message ? loi.message : String(loi)) + '\n\n' +
            'Mở script.google.com → dự án sao lưu → bấm chạy hàm ' +
            '`kiemTraKetNoi` để xem hỏng ở đâu.');
    throw loi;   // ném tiếp để Google cũng ghi vào sổ lỗi của trigger
  }
}

/**
 * Đặt lịch chạy tự động: mỗi ngày một lần, khoảng 2 giờ sáng.
 * Bấm lại nhiều lần cũng an toàn — lịch cũ bị gỡ trước khi đặt lịch mới.
 */
function datLichSaoLuu() {
  goLichSaoLuu();
  ScriptApp.newTrigger('saoLuuNgay').timeBased().everyDays(1).atHour(2).create();
  var ket = 'Đã đặt lịch: mỗi ngày một lần, khoảng 2 giờ sáng.';
  Logger.log(ket);
  return ket;
}

/** Gỡ lịch chạy tự động. Sao lưu bấm tay vẫn chạy được. */
function goLichSaoLuu() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'saoLuuNgay') {
      ScriptApp.deleteTrigger(t);
      n++;
    }
  });
  Logger.log('Đã gỡ ' + n + ' lịch cũ.');
  return n;
}

// ============================================================
// GOM BẢN SAO LƯU
// ============================================================

/**
 * Đọc mọi thứ và dựng thành object sẽ ghi ra file.
 *
 * Hình file là **bản chép thô từng bảng**, không phải hình `tree` mà trình
 * duyệt dùng. Lý do: bản sao lưu phải trả lại ĐÚNG thứ đã có. Hình `tree`
 * cắt `change_log` xuống còn mỗi trường `target` (`DU-LIEU.md` mục 7), tức
 * khôi phục từ nó là mất sạch lịch sử ai sửa gì lúc nào. Muốn xem bản sao
 * lưu dưới hình `tree` thì đưa nó qua `hinh-dang.rapCay()`; chiều ngược lại
 * thì không có.
 */
function gomSaoLuu_(cauHinh) {
  // ⚠ Đếm thật TRƯỚC khi đọc: dòng thêm trong lúc đọc thì số đọc được lớn
  //   hơn số đếm — không báo oan. Chỉ dòng mất trong lúc đọc mới báo, và mất
  //   dòng lúc 2 giờ sáng là chuyện đáng có thư.
  var demThat = docDemThat_(cauHinh);
  var bang = {};
  var dem = {};
  Object.keys(THU_TU_DOC).forEach(function (ten) {
    var dong = docBang_(cauHinh, ten);
    bang[ten] = dong;
    dem[ten] = dong.length;
  });

  var heThong = docBangHeThong_(cauHinh);
  if (!heThong.loi) {
    BANG_HE_THONG.forEach(function (ten) {
      bang[ten] = heThong.bang[ten];
      dem[ten] = heThong.bang[ten].length;
    });
  }

  var nguoiDung = docNguoiDung_(cauHinh);
  dem.nguoiDung = nguoiDung.length;

  var khoAnh = docKhoAnh_(cauHinh);
  dem.anh = khoAnh.tep.length;

  return {
    khuon: 'giapha-sao-luu',
    phienBanKhuon: 1,
    taoLuc: cauHinh.taoLuc,
    taoLucVn: cauHinh.taoLucVn,
    nguon: cauHinh.url,
    // ⚠ ĐIỀU FILE NÀY KHÔNG CHỨA, và phải nói ra chứ không để người khôi phục
    //   tự phát hiện: mật khẩu. Supabase không cho đọc mật khẩu ra dù bằng
    //   khoá bí mật (nó chỉ giữ bản băm). Khôi phục sang một project khác thì
    //   mọi người phải đặt lại mật khẩu — dữ liệu gia phả về đủ, đường vào thì
    //   không.
    khongChua: 'Mật khẩu tài khoản (Supabase không cho đọc) và tệp ảnh ' +
               '(ảnh chép riêng vào thư mục con "' + TEN_THU_MUC_ANH +
               '" cạnh file này; khoAnh chỉ là danh sách).',
    dem: dem,
    bang: bang,
    nguoiDung: nguoiDung,
    khoAnh: khoAnh,
    // Trống = sáu bảng hệ thống đã chép đủ. Có chữ = thiếu cả sáu, lý do đây.
    loiBangHeThong: heThong.loi || '',
    // Số dòng THẬT trên máy chủ lúc bắt đầu chép (`luoc-do/45`). Trống thì
    // `loiDemThat` nói vì sao không đối chiếu được.
    demMayChu: demThat.dem || null,
    loiDemThat: demThat.loi || '',
    // Trống = đọc đủ. Có chữ = RLS giấu bớt dòng, bản này KHÔNG đủ để khôi phục.
    thieuSoVoiMayChu: demThat.dem ? (soVoiMayChu_(dem, demThat.dem) || '') : ''
  };
}

/**
 * Số dòng thật của mười ba bảng gia phả, qua `sao_luu_dem_that()`.
 * KHÔNG ném lỗi — chưa dán `45` thì bản sao lưu vẫn ghi, chỉ không đối chiếu.
 */
function docDemThat_(cauHinh) {
  try {
    var kq = goi_(cauHinh, cauHinh.url + '/rest/v1/rpc/sao_luu_dem_that', 'đếm số dòng thật', {});
    if (!kq || kq.ok !== true || !kq.dem) {
      return { loi: (kq && kq.loi) || 'Máy chủ không trả số dòng thật (đã dán luoc-do/45 chưa?).' };
    }
    return { dem: kq.dem };
  } catch (e) {
    return { loi: String(e && e.message ? e.message : e).slice(0, 300) };
  }
}

/**
 * So số dòng đọc được với số thật. Trả câu cảnh báo, hoặc `null` nếu đủ.
 *
 * ⚠ Đây là chuông cho đúng lỗ b142a: máy sao lưu đọc qua RLS, cây nào nó
 *   không giữ vai thì RLS giấu SẠCH — file vẫn đẹp, số `dem` trong file vẫn
 *   khớp chính nó. Chỉ số đếm từ phía máy chủ mới lộ ra chỗ thiếu.
 */
function soVoiMayChu_(demDoc, demThat) {
  var loi = [];
  Object.keys(THU_TU_DOC).forEach(function (ten) {
    var that = Number(demThat[ten]);
    var doc = Number(demDoc[ten]) || 0;
    if (!isNaN(that) && doc < that) {
      loi.push('  ' + ten + ': máy chủ có ' + that + ', sao lưu đọc được ' + doc);
    }
  });
  if (!loi.length) return null;
  return 'Đối chiếu với máy chủ: THIẾU — máy sao lưu không được thấy hết dữ liệu:\n\n' +
         loi.join('\n') + '\n\n' +
         'Thường do một cây chưa có tài khoản sao lưu. Dán lại luoc-do/45-sao-luu-du-cay.sql ' +
         '(nó bù cho mọi cây) rồi chạy lại saoLuuNgay.';
}

/**
 * Báo kết quả lần chạy này vào Nhật ký hệ thống (`ghi_sao_luu_dem()`,
 * `luoc-do/49`) — trang Quản trị đọc nó cho bảng *Lịch sử sao lưu* và thẻ
 * *Sao lưu* ở Tổng quan, vì trình duyệt không tự đọc được Drive.
 *
 * ⚠ KHÔNG BAO GIỜ ném lỗi, và KHÔNG gửi thư khi hỏng: nhật ký là phần phụ.
 *   Chưa dán `49`, mạng chập, hay chính lần đăng nhập vừa hỏng — bản sao lưu
 *   (hoặc thư báo hỏng) vẫn phải đi tiếp như chưa có hàm này.
 */
function baoNhatKy_(cauHinh, ketQua) {
  try {
    goi_(cauHinh, cauHinh.url + '/rest/v1/rpc/ghi_sao_luu_dem', 'ghi nhật ký sao lưu',
         { p_ket_qua: ketQua });
  } catch (e) {
    Logger.log('Không ghi được nhật ký sao lưu (bỏ qua): ' +
               String(e && e.message ? e.message : e).slice(0, 300));
  }
}

/**
 * Báo dấu vân tay SHA-256 của file vừa ghi (`ghi_bam_sao_luu()`, `luoc-do/54`).
 * Trả '' nếu được, không thì câu cảnh báo — KHÔNG ném: hỏng ở đây thì bản sao
 * lưu vẫn còn nguyên, chỉ là nút Khôi phục trên trang Quản trị sẽ không nhận
 * file này (vẫn khôi phục được bằng `khoi-phuc.mjs`).
 */
function baoDauVanTay_(cauHinh, noiDung, ten) {
  try {
    var byte = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, noiDung,
                                       Utilities.Charset.UTF_8);
    var hex = byte.map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
    var kq = goi_(cauHinh, cauHinh.url + '/rest/v1/rpc/ghi_bam_sao_luu', 'ghi dấu vân tay',
                  { p_bam: hex, p_ten_file: ten, p_tao_luc_vn: cauHinh.taoLucVn });
    if (!kq || kq.ok !== true) throw new Error((kq && kq.loi) || 'máy chủ không nhận');
    return '';
  } catch (e) {
    return 'Chưa ghi được dấu vân tay (đã dán luoc-do/54 chưa?) — nút Khôi phục sẽ ' +
           'không nhận file này. ' + String(e && e.message ? e.message : e).slice(0, 200);
  }
}

/**
 * Sáu bảng cấp hệ thống, qua `sao_luu_bang_he_thong()` (`luoc-do/44`).
 * KHÔNG ném lỗi — trả `{loi}` để bản sao lưu gia phả vẫn ghi được.
 */
function docBangHeThong_(cauHinh) {
  try {
    var url = cauHinh.url + '/rest/v1/rpc/sao_luu_bang_he_thong';
    var kq = goi_(cauHinh, url, 'đọc sáu bảng hệ thống', {});
    if (!kq || kq.ok !== true || !kq.bang) {
      return { loi: (kq && kq.loi) || 'Máy chủ không trả sáu bảng hệ thống.' };
    }
    var thieu = BANG_HE_THONG.filter(function (t) { return !Array.isArray(kq.bang[t]); });
    if (thieu.length) return { loi: 'Máy chủ thiếu bảng: ' + thieu.join(', ') };
    return { bang: kq.bang };
  } catch (e) {
    return { loi: String(e && e.message ? e.message : e).slice(0, 300) };
  }
}

// ============================================================
// ĐỌC TỪ SUPABASE
// ============================================================

/** Đọc trọn một bảng, đi theo trang cho tới hết. */
function docBang_(cauHinh, ten) {
  var tatCa = [];
  var offset = 0;
  for (;;) {
    var url = cauHinh.url + '/rest/v1/' + ten +
              '?select=*&order=' + encodeURIComponent(THU_TU_DOC[ten]) +
              '&limit=' + SO_DONG_MOI_TRANG + '&offset=' + offset;
    var trang = goi_(cauHinh, url, 'đọc bảng ' + ten);
    if (!trang.length) break;
    tatCa = tatCa.concat(trang);
    if (trang.length < SO_DONG_MOI_TRANG) break;
    offset += SO_DONG_MOI_TRANG;
  }
  return tatCa;
}

/** Đếm số dòng mà không tải cả bảng về. Dùng cho `kiemTraKetNoi`. */
function demDong_(cauHinh, ten) {
  var url = cauHinh.url + '/rest/v1/' + ten + '?select=*&limit=1';
  var res = goiTho_(cauHinh, url, 'đếm bảng ' + ten, { Prefer: 'count=exact' });
  // PostgREST trả tổng số ở header `content-range`, khuôn `0-0/681`.
  var dai = String(res.getHeaders()['content-range'] ||
                   res.getHeaders()['Content-Range'] || '');
  var sau = dai.split('/')[1];
  return sau && sau !== '*' ? Number(sau) : 0;
}

/**
 * Danh sách tài khoản đăng nhập. Không đọc được qua REST thường — `auth.users`
 * không nằm trong schema mà PostgREST phục vụ — nên phải đi cửa Admin API.
 *
 * Vì sao phải sao lưu cả danh sách này: `tree_members.user_id` trỏ vào
 * `auth.users(id)`. Khôi phục bảng `tree_members` mà không có danh sách người
 * thì mọi dòng phân quyền trỏ vào hư không, và không có gì báo lỗi — chỉ là
 * chẳng ai vào được app.
 */
function docNguoiDung_(cauHinh) {
  // ⚠ Bản 0.1.0 đi cửa `/auth/v1/admin/users`, mà cửa ấy **bắt buộc khoá bí
  //   mật** — thứ bản này đã bỏ. Nay hỏi hàm `ds_tai_khoan()` dựng ở
  //   `luoc-do/05-sao-luu.sql`: hàm `security definer` nên với tới
  //   `auth.users`, còn ai gọi được thì chính thân hàm quyết.
  //
  //   Khác một điểm có chủ ý: hàm chỉ trả về người có chân trong những cây mà
  //   tài khoản sao lưu đang giữ vai, chứ không trả về TOÀN BỘ `auth.users`
  //   như bản cũ. Bản cũ làm thế chỉ vì khoá bí mật cho phép, không phải vì
  //   sao lưu cần thế.
  var url = cauHinh.url + '/rest/v1/rpc/ds_tai_khoan';
  var duLieu = goi_(cauHinh, url, 'đọc danh sách tài khoản', {});
  var ds = Array.isArray(duLieu) ? duLieu : [];
  return ds.map(function (u) {
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at
    };
  });
}

/**
 * Liệt kê tệp trong kho ảnh. **Chỉ liệt kê, không tải ảnh về** — xem
 * `KE-HOACH.md` phần còn treo. Danh sách này tồn tại để lỗ hổng ấy ĐO ĐƯỢC:
 * mở file sao lưu ra là biết đang có bao nhiêu tấm ảnh chưa được chép đi đâu.
 *
 * Đường dẫn trong kho theo quy ước `<tree_id>/<media_id>-nho.jpg`, tức đúng
 * hai bậc, nên chỉ cần liệt kê hai bậc.
 */
function docKhoAnh_(cauHinh) {
  var tep = [];
  var tongByte = 0;
  var thuMuc = lietKeKho_(cauHinh, '');
  thuMuc.forEach(function (muc) {
    if (muc.id) return;                 // id === null nghĩa là thư mục
    lietKeKho_(cauHinh, muc.name + '/').forEach(function (t) {
      if (!t.id) return;
      var co = (t.metadata && t.metadata.size) || 0;
      tongByte += co;
      tep.push({ ten: muc.name + '/' + t.name, byte: co, capNhat: t.updated_at });
    });
  });
  return { kho: cauHinh.khoAnh, tep: tep, tongByte: tongByte };
}

function lietKeKho_(cauHinh, tienTo) {
  var ra = [];
  var offset = 0;
  for (;;) {
    var url = cauHinh.url + '/storage/v1/object/list/' + cauHinh.khoAnh;
    var trang = goi_(cauHinh, url, 'liệt kê kho ảnh', {
      prefix: tienTo,
      limit: SO_DONG_MOI_TRANG,
      offset: offset,
      sortBy: { column: 'name', order: 'asc' }
    });
    if (!trang.length) break;
    ra = ra.concat(trang);
    if (trang.length < SO_DONG_MOI_TRANG) break;
    offset += SO_DONG_MOI_TRANG;
  }
  return ra;
}

/** Gọi một địa chỉ, trả về JSON đã phân tích. `than` có thì gửi POST. */
function goi_(cauHinh, url, viec, than) {
  var res = goiTho_(cauHinh, url, viec, null, than);
  var chu = res.getContentText();
  try {
    return JSON.parse(chu);
  } catch (e) {
    throw new Error('Máy chủ trả về thứ không phải JSON khi ' + viec + ': ' +
                    chu.slice(0, 200));
  }
}

/**
 * Đăng nhập bằng email + mật khẩu, lấy phiếu (`access_token`) để đọc dữ liệu.
 *
 * ⚠ ĐÂY LÀ THAY ĐỔI GỐC CỦA BẢN 0.2.0, và lý do nằm ở `luoc-do/05-sao-luu.sql`
 *   phần đầu: khoá bí mật đời mới bị Supabase chặn khi gọi từ Apps Script
 *   (nó thấy `User-Agent` giống trình duyệt), còn khoá đời cũ thì bị khai tử
 *   cuối 2026. Nên sao lưu bỏ hẳn khoá bí mật và đăng nhập như một người
 *   thường mang vai `sao_luu` — vai chỉ đọc, không ghi được một dòng nào.
 *
 * Phiếu sống khoảng một giờ; một lần sao lưu chỉ mất vài phút nên xin một
 * lần cho cả lượt là đủ, không cần gia hạn giữa chừng.
 */
function dangNhap_(cauHinh) {
  if (cauHinh.phieu) return cauHinh.phieu;
  cauHinh.phieu = xinPhieu_(cauHinh, cauHinh.email, cauHinh.matKhau,
    'Không đăng nhập được tài khoản sao lưu. ' +
    'Kiểm EMAIL_SAO_LUU và MAT_KHAU_SAO_LUU trong Script Properties. ' +
    'Tài khoản này tạo ở Supabase → Authentication → Users, và phải được ' +
    'thêm vào bảng tree_members với role = sao_luu — xem luoc-do/05-sao-luu.sql.');
  return cauHinh.phieu;
}

/** Đổi email + mật khẩu lấy phiếu. `cauLoi` là câu nói khi đăng nhập hỏng. */
function xinPhieu_(cauHinh, email, matKhau, cauLoi) {
  var res = UrlFetchApp.fetch(
    cauHinh.url + '/auth/v1/token?grant_type=password',
    {
      method: 'post',
      contentType: 'application/json',
      headers: { apikey: cauHinh.khoaCongKhai },
      payload: JSON.stringify({ email: email, password: matKhau }),
      muteHttpExceptions: true
    });

  var ma = res.getResponseCode();
  var chu = res.getContentText();
  if (ma < 200 || ma >= 300) {
    // ⚠ Không chép `chu` nguyên văn vào câu lỗi: thân phản hồi của cửa đăng
    //   nhập có thể vọng lại email vừa gửi lên.
    throw new Error(cauLoi + ' (mã ' + ma + ')');
  }

  var duLieu;
  try { duLieu = JSON.parse(chu); } catch (e) { duLieu = null; }
  if (!duLieu || !duLieu.access_token) {
    throw new Error('Cửa đăng nhập trả về thứ không có access_token. ' +
                    'Kiểm KHOA_CONG_KHAI có đúng project không.');
  }
  return duLieu.access_token;
}

function goiTho_(cauHinh, url, viec, themDau, than) {
  // `apikey` nói *"tôi là khách của project này"*; `Authorization` nói
  // *"và tôi đã đăng nhập, đây là phiếu"*. RLS đọc phiếu để biết `auth.uid()`
  // là ai, rồi mới quyết cho thấy dòng nào.
  var dau = {
    apikey: cauHinh.khoaCongKhai,
    Authorization: 'Bearer ' + dangNhap_(cauHinh)
  };
  if (themDau) Object.keys(themDau).forEach(function (k) { dau[k] = themDau[k]; });

  var chonLua = { method: than ? 'post' : 'get', headers: dau,
                  muteHttpExceptions: true };
  if (than) {
    chonLua.contentType = 'application/json';
    chonLua.payload = JSON.stringify(than);
  }

  var res = UrlFetchApp.fetch(url, chonLua);
  var ma = res.getResponseCode();
  if (ma >= 200 && ma < 300) return res;

  // ⚠ Câu lỗi KHÔNG được chép lại `url` nguyên văn, và tuyệt đối không chép
  //   khoá — thư báo lỗi đi qua Gmail và nằm lại trong sổ lỗi của Apps Script.
  //   Thân phản hồi của Supabase thì chép được: nó không bao giờ chứa khoá.
  var than = '';
  try { than = String(res.getContentText() || '').slice(0, 300); } catch (e) { than = ''; }

  var giaiThich;
  if (ma === 401 || ma === 403) {
    // ⚠ VẾT SẸO 03/09/2026 — để lại đây làm biển báo. Bản 0.1.0 dùng khoá bí
    //   mật, và Supabase chặn khoá `sb_secret_…` khi thấy `User-Agent` giống
    //   trình duyệt; Apps Script thì luôn gửi "Mozilla/5.0 (compatible;
    //   Google-Apps-Script; …)" và Google không cho đổi. Ai đó thấy cách đăng
    //   nhập bên dưới rườm rà mà định "cho gọn" bằng cách quay lại khoá bí
    //   mật thì sẽ đâm vào đúng bức tường ấy — nên phép thử này giữ nguyên.
    giaiThich = /in browser|secret API key/i.test(than)
      ? 'Đang dùng khoá BÍ MẬT, mà Supabase chặn loại khoá ấy khi gọi từ Apps ' +
        'Script. Sao lưu bản này KHÔNG dùng khoá bí mật nữa: điền ' +
        'KHOA_CONG_KHAI (sb_publishable_…) cùng EMAIL_SAO_LUU và ' +
        'MAT_KHAU_SAO_LUU, rồi xoá hẳn KHOA_BI_MAT. Xem luoc-do/05-sao-luu.sql.'
      : 'Bị từ chối dù đã đăng nhập. Nhiều khả năng tài khoản sao lưu chưa ' +
        'được thêm vào bảng tree_members với role = sao_luu, hoặc file ' +
        'luoc-do/05-sao-luu.sql chưa chạy. Máy chủ nói: ' + than;
  } else if (ma === 404) {
    giaiThich = 'Không tìm thấy. Có thể bảng chưa dựng — bốn file trong ' +
                'luoc-do/ đã chạy đủ chưa?';
  } else {
    giaiThich = 'Máy chủ trả mã ' + ma + '. Máy chủ nói: ' + than;
  }
  throw new Error('Hỏng khi ' + viec + '. ' + giaiThich);
}

// ============================================================
// GHI RA DRIVE
// ============================================================

function layThuMuc_(cauHinh) {
  if (cauHinh.thuMucId) return DriveApp.getFolderById(cauHinh.thuMucId);
  var co = DriveApp.getFoldersByName(TEN_THU_MUC_MAC_DINH);
  if (co.hasNext()) return co.next();
  return DriveApp.createFolder(TEN_THU_MUC_MAC_DINH);
}

/**
 * Dọn bản cũ. Giữ `soBanGiu` bản gần nhất, VÀ giữ vĩnh viễn một bản cho mỗi
 * tháng (bản muộn nhất còn lại của tháng ấy).
 *
 * Vì sao có vế thứ hai: chỉ giữ 30 bản gần nhất thì một hỏng hóc không ai
 * nhận ra trong 31 ngày là mất hẳn — mà kiểu hỏng nguy hiểm nhất trong gia
 * phả đúng là kiểu không ai nhận ra (`DU-LIEU.md` mục 7 nói về cấp lại mã đã
 * dùng: "không có gì báo lỗi, chỉ là mọi câu chuyện cũ lặng lẽ dính sang một
 * người khác"). Một bản mỗi tháng là mười hai file một năm — rẻ tới mức không
 * đáng bàn, so với thứ nó cứu.
 */
function donBanCu_(thuMuc, soBanGiu) {
  var ds = [];
  var it = thuMuc.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    var ten = f.getName();
    if (ten.indexOf(KHUON_TEN_FILE) === 0) ds.push({ ten: ten, file: f });
  }
  // Tên file mang dấu thời gian `yyyy-MM-dd-HHmm` nên xếp theo chữ cái là xếp
  // đúng theo thời gian. Không đọc ngày sửa file của Drive: chép file hay khôi
  // phục từ thùng rác đều làm ngày ấy nhảy lung tung.
  ds.sort(function (a, b) { return a.ten < b.ten ? 1 : a.ten > b.ten ? -1 : 0; });

  var thangDaGiu = {};
  var daXoa = 0;
  ds.forEach(function (m, i) {
    var thang = m.ten.slice(KHUON_TEN_FILE.length, KHUON_TEN_FILE.length + 7);
    if (i < soBanGiu) { thangDaGiu[thang] = true; return; }
    if (!thangDaGiu[thang]) { thangDaGiu[thang] = true; return; }
    m.file.setTrashed(true);
    daXoa++;
  });
  return daXoa;
}

// ============================================================
// ẢNH — chép sang Drive mỗi đêm, tải ngược lên khi cần (b154)
// ============================================================
//
// Drive giữ `Anh/<mã cây>/<tên tệp>` — đúng đường dẫn trong kho Supabase, nên
// khôi phục là tải về đúng chỗ cũ, không cần bảng tra nào.
//
// ⚠ Ảnh trên Drive KHÔNG BAO GIỜ bị xoá theo app. App xoá ảnh là xoá THẬT
//   khỏi kho (`xoaAnhThat()`: dọn thùng rác, xoá hẳn gia phả) — nên nếu Drive
//   xoá theo thì khôi phục dữ liệu về hôm qua sẽ có người mà mất ảnh. Cái giá:
//   thư mục `Anh` chỉ lớn lên. Ảnh đã nén (bản nhỏ 400px + bản lớn 1600px),
//   15 GB của Drive là rất xa.
//
// ⚠ Đọc ảnh qua cửa `/object/authenticated/` bằng phiếu của vai `sao_luu`
//   (luật `liet_ke_anh`, `luoc-do/05`), KHÔNG qua đường công khai — để ngày
//   kho ảnh chuyển sang kín (`KIEN-TRUC.md` mục 7) thì sao lưu vẫn chạy.

/** Như `chepAnhSangDrive_` nhưng KHÔNG BAO GIỜ ném — ảnh hỏng không kéo bản sao lưu chữ theo. */
function chepAnhAnToan_(cauHinh, thuMucGoc, dsTep) {
  try {
    return chepAnhSangDrive_(cauHinh, thuMucGoc, dsTep);
  } catch (e) {
    return { chepThem: 0, chuaChep: dsTep.length,
             loi: String(e && e.message ? e.message : e).slice(0, 300) };
  }
}

/**
 * Chép những tấm Drive chưa có (hoặc có mà khác cỡ — app tải đè cùng tên).
 * Trả `{ chepThem, chuaChep, loi }`; `chuaChep` gồm tấm hỏng + tấm để đêm sau.
 */
function chepAnhSangDrive_(cauHinh, thuMucGoc, dsTep) {
  var kq = { chepThem: 0, chuaChep: 0, loi: '' };
  if (!dsTep.length) return kq;

  var goc = thuMucCon_(thuMucGoc, TEN_THU_MUC_ANH, true);
  var theoCay = {};
  var loiLienTiep = 0;

  for (var i = 0; i < dsTep.length; i++) {
    var t = dsTep[i];
    var cat = t.ten.indexOf('/');
    var cay = t.ten.slice(0, cat);
    var ten = t.ten.slice(cat + 1);
    if (!theoCay[cay]) theoCay[cay] = docThuMucAnh_(thuMucCon_(goc, cay, true));
    var o = theoCay[cay];
    var cu = o.co[ten];
    // Kho không báo cỡ (0) thì tin tên: chép lại mỗi đêm vì một con số thiếu
    // là đốt hết thời gian của lượt chạy.
    if (cu && (!t.byte || cu.getSize() === t.byte)) continue;

    if (hetGio_(cauHinh) || loiLienTiep >= SO_LOI_LIEN_TIEP_TOI_DA) { kq.chuaChep++; continue; }
    try {
      var blob = taiAnhVe_(cauHinh, t.ten).setName(ten);
      var moi = o.thuMuc.createFile(blob);
      if (cu) cu.setTrashed(true);   // bản đè cũ vào thùng rác Drive, còn 30 ngày
      o.co[ten] = moi;
      kq.chepThem++;
      loiLienTiep = 0;
    } catch (e) {
      kq.chuaChep++;
      loiLienTiep++;
      if (!kq.loi) kq.loi = t.ten + ': ' + String(e && e.message ? e.message : e).slice(0, 250);
    }
  }
  return kq;
}

function taiAnhVe_(cauHinh, duong) {
  var url = cauHinh.url + '/storage/v1/object/authenticated/' + cauHinh.khoAnh + '/' +
            duong.split('/').map(encodeURIComponent).join('/');
  return goiTho_(cauHinh, url, 'tải ảnh ' + duong).getBlob();
}

function hetGio_(cauHinh) {
  return Date.now() - cauHinh.batDauMs > GIAY_CHEP_ANH_TOI_DA * 1000;
}

/** Thư mục con theo tên; `taoNeuThieu` false thì trả `null` khi chưa có. */
function thuMucCon_(cha, ten, taoNeuThieu) {
  var co = cha.getFoldersByName(ten);
  if (co.hasNext()) return co.next();
  return taoNeuThieu ? cha.createFolder(ten) : null;
}

/** `{ thuMuc, co: { tên tệp → File } }` — bỏ qua tệp đang nằm thùng rác. */
function docThuMucAnh_(thuMuc) {
  var co = {};
  var it = thuMuc.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    if (f.isTrashed()) continue;
    co[f.getName()] = f;
  }
  return { thuMuc: thuMuc, co: co };
}

/**
 * KHÔI PHỤC ẢNH — tải những tấm có trên Drive mà kho Supabase đang thiếu.
 * Chạy sau khi đã khôi phục dữ liệu chữ (`sao-luu/khoi-phuc.mjs`), hoặc bất cứ
 * lúc nào thấy ảnh mất. Tấm đã có trong kho thì bỏ qua, nên chạy lại bao nhiêu
 * lần cũng được — hết giờ thì bấm chạy lại, nó làm tiếp phần còn thiếu.
 *
 * ⚠ Cần một tài khoản GHI ĐƯỢC ảnh, vì vai `sao_luu` cố ý không ghi được gì:
 *   điền tạm EMAIL_KHOI_PHUC + MAT_KHAU_KHOI_PHUC (Quản trị hệ thống, hoặc
 *   Quản trị gia phả của đúng cây cần khôi phục — luật `ghi_anh`, `02-rls`).
 *   Xong thì XOÁ hai dòng ấy. KHOI_PHUC_CAY (mã cây, uuid) để trống = mọi cây.
 * ⚠ Cây đang nằm thùng rác thì máy chủ từ chối (`co_the_sua()` = false) —
 *   phục hồi cây trong app trước.
 * ⚠ CHỈ tải tấm còn có dòng `media` trỏ tới (`drive_file_id` hoặc
 *   `drive_file_id_lon` = đúng đường dẫn trong kho) — kể cả dòng đang nằm
 *   thùng rác, vì phục hồi người thì ảnh phải về theo. Tấm Drive giữ mà không
 *   dòng nào trỏ tới là ảnh app đã dọn hẳn (`purge.js`: xoá dòng rồi mới xoá
 *   tệp); tải nó lên là đẻ ảnh mồ côi. Khôi phục dữ liệu chữ TRƯỚC, ảnh SAU:
 *   làm ngược thì bảng `media` chưa về, không tấm nào được coi là cần.
 */
function khoiPhucAnh() {
  var cauHinh = docCauHinh_();
  var kho = PropertiesService.getScriptProperties();
  var email = (kho.getProperty('EMAIL_KHOI_PHUC') || '').trim();
  var matKhau = kho.getProperty('MAT_KHAU_KHOI_PHUC') || '';
  var chiCay = (kho.getProperty('KHOI_PHUC_CAY') || '').trim();
  if (!email || !matKhau) {
    throw new Error('Chưa điền tài khoản khôi phục. Mở Project Settings → ' +
      'Script Properties, thêm EMAIL_KHOI_PHUC và MAT_KHAU_KHOI_PHUC của một ' +
      'tài khoản Quản trị hệ thống. Chạy xong thì xoá hai dòng ấy. ' +
      '(Có web app rồi thì khỏi: trang Quản trị tự khôi phục ảnh.)');
  }
  // Kiểm Drive TRƯỚC khi đăng nhập — không có gì để làm thì khỏi gọi mạng.
  if (!thuMucCon_(layThuMuc_(cauHinh), TEN_THU_MUC_ANH, false)) {
    throw new Error('Trên Drive chưa có thư mục "' + TEN_THU_MUC_ANH +
      '" — sao lưu đêm chưa chép tấm ảnh nào, không có gì để khôi phục.');
  }
  var phieuGhi = xinPhieu_(cauHinh, email, matKhau,
    'Không đăng nhập được tài khoản khôi phục. Kiểm EMAIL_KHOI_PHUC và ' +
    'MAT_KHAU_KHOI_PHUC trong Script Properties.');
  var kq = khoiPhucAnhBang_(cauHinh, phieuGhi, chiCay);
  var ket = cauKhoiPhucAnh_(kq) +
            (kq.conLai ? '\nBấm chạy lại khoiPhucAnh để làm tiếp.'
                       : '\nXONG. Nhớ xoá EMAIL_KHOI_PHUC và MAT_KHAU_KHOI_PHUC.');
  Logger.log(ket);
  return ket;
}

function cauKhoiPhucAnh_(kq) {
  return 'Khôi phục ảnh: tải lên ' + kq.taiLen + ' tấm, ' + kq.daCo +
         ' tấm kho đã có sẵn, bỏ qua ' + kq.moCoi + ' tấm không còn ai dùng' +
         ', còn ' + kq.conLai + ' tấm chưa tải.' +
         (kq.loi ? '\nLỗi đầu tiên: ' + kq.loi : '');
}

/**
 * Lõi khôi phục ảnh, dùng chung cho `khoiPhucAnh` (tài khoản điền tạm) và web
 * app (vé của chính người bấm trên trang Quản trị). `phieuGhi` = phiếu của tài
 * khoản GHI ảnh; liệt kê kho + đọc `media` vẫn đi bằng tài khoản sao lưu.
 * Trả `{ taiLen, daCo, moCoi, conLai, loi }`.
 */
function khoiPhucAnhBang_(cauHinh, phieuGhi, chiCay) {
  var goc = thuMucCon_(layThuMuc_(cauHinh), TEN_THU_MUC_ANH, false);
  if (!goc) return { taiLen: 0, daCo: 0, moCoi: 0, conLai: 0,
                     loi: 'Trên Drive chưa có thư mục "' + TEN_THU_MUC_ANH + '".' };

  // Tấm nào kho đang có: hỏi bằng tài khoản SAO LƯU (luật `liet_ke_anh` chỉ
  // cho vai ấy và Quản trị hệ thống liệt kê).
  var coSan = {};
  docKhoAnh_(cauHinh).tep.forEach(function (t) { coSan[t.ten] = true; });

  // Tấm nào dữ liệu gia phả còn cần. Giá trị không có '/' là mã tệp Google
  // Drive từ thời bản Apps Script — không nằm trong kho này, bỏ qua.
  var canDung = {};
  docBang_(cauHinh, 'media').forEach(function (m) {
    [m.drive_file_id, m.drive_file_id_lon].forEach(function (d) {
      if (d && String(d).indexOf('/') > 0) canDung[d] = true;
    });
  });

  var kq = { taiLen: 0, daCo: 0, moCoi: 0, conLai: 0, loi: '' };
  var loiLienTiep = 0;
  var cacCay = goc.getFolders();
  while (cacCay.hasNext()) {
    var thuMucCay = cacCay.next();
    var cay = thuMucCay.getName();
    if (chiCay && cay !== chiCay) continue;
    var tep = docThuMucAnh_(thuMucCay).co;
    Object.keys(tep).forEach(function (ten) {
      var duong = cay + '/' + ten;
      if (coSan[duong]) { kq.daCo++; return; }
      if (!canDung[duong]) { kq.moCoi++; return; }
      if (hetGio_(cauHinh) || loiLienTiep >= SO_LOI_LIEN_TIEP_TOI_DA) { kq.conLai++; return; }
      var loi = taiAnhLen_(cauHinh, phieuGhi, duong, tep[ten].getBlob());
      if (loi === '') { kq.taiLen++; loiLienTiep = 0; return; }
      if (loi === 'da_co') { kq.daCo++; loiLienTiep = 0; return; }
      kq.conLai++;
      loiLienTiep++;
      if (!kq.loi) kq.loi = duong + ': ' + loi;
    });
  }
  return kq;
}

// ============================================================
// WEB APP — trang Quản trị gọi thẳng (b155d)
// ============================================================
// Triển khai: Deploy → New deployment → Web app · Execute as: **Me** · Who has
// access: **Anyone**. Địa chỉ dán vào `js/cau-hinh.js` `SAO_LUU_WEB_APP`.
//
// ⚠⚠ "Anyone" nghĩa là ai có địa chỉ cũng gọi được, và web app chạy bằng
//   quyền Drive CỦA CHỦ DỰ ÁN. Hàng rào duy nhất là `xacMinhQtht_`: mỗi yêu
//   cầu mang vé đăng nhập Supabase của người bấm; Supabase xác nhận vé thật
//   VÀ người ấy là Quản trị hệ thống, không thì không làm gì cả.
// ⚠ `tai` chỉ đưa ra file NẰM TRONG thư mục sao lưu và đúng khuôn tên — không
//   thành cửa đọc file bất kỳ trên Drive bằng mã file.
// ⚠ Sửa mã này xong phải **Manage deployments → Edit → Version: New version**,
//   không thì web app vẫn chạy mã cũ (Save không đủ).
// ⚠ Gửi vé trong THÂN yêu cầu (POST `text/plain`), không trên địa chỉ — địa
//   chỉ nằm lại trong nhật ký. `text/plain` để trình duyệt không hỏi CORS trước.

/** Chỉ để thử địa chỉ có sống không — không trả dữ liệu nào. */
function doGet() {
  return traJson_({ ok: true, may: 'giapha-sao-luu', phienBan: '0.10.0' });
}

function doPost(e) {
  var ra;
  try {
    var yc = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var cauHinh = docCauHinh_();
    xacMinhQtht_(cauHinh, yc.ve);
    if (yc.viec === 'danh-sach') {
      ra = { ok: true, ds: dsBanSaoLuu_(cauHinh) };
    } else if (yc.viec === 'tai') {
      ra = taiBanSaoLuu_(cauHinh, yc.id);
    } else if (yc.viec === 'sao-luu-ngay') {
      // Y như lịch đêm (kể cả thư báo hỏng, nhật ký, chép ảnh). Hỏng thì
      // `saoLuuNgay` ném — khối catch dưới trả câu lỗi cho trang.
      ra = { ok: true, cau: saoLuuNgay() };
    } else if (yc.viec === 'khoi-phuc-anh') {
      var kq = khoiPhucAnhBang_(cauHinh, yc.ve, '');
      ra = { ok: true, taiLen: kq.taiLen, daCo: kq.daCo, moCoi: kq.moCoi, conLai: kq.conLai,
             loi: kq.loi, cau: cauKhoiPhucAnh_(kq) };
    } else {
      ra = { ok: false, loi: 'Máy sao lưu không biết việc "' + String(yc.viec).slice(0, 40) + '".' };
    }
  } catch (err) {
    ra = { ok: false, loi: String(err && err.message ? err.message : err).slice(0, 500) };
  }
  return traJson_(ra);
}

function traJson_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Vé Supabase phải thật VÀ của một Quản trị hệ thống. Không thì ném. */
function xacMinhQtht_(cauHinh, ve) {
  if (!ve || typeof ve !== 'string') throw new Error('Thiếu vé đăng nhập — hãy đăng nhập lại app.');
  var dau = { apikey: cauHinh.khoaCongKhai, Authorization: 'Bearer ' + ve };
  var ai = UrlFetchApp.fetch(cauHinh.url + '/auth/v1/user',
                             { method: 'get', headers: dau, muteHttpExceptions: true });
  if (ai.getResponseCode() !== 200) {
    throw new Error('Vé đăng nhập không hợp lệ hoặc đã hết hạn — đăng xuất rồi đăng nhập lại app.');
  }
  var la = UrlFetchApp.fetch(cauHinh.url + '/rest/v1/rpc/la_quan_tri_he_thong', {
    method: 'post', headers: dau, contentType: 'application/json', payload: '{}',
    muteHttpExceptions: true });
  if (la.getResponseCode() !== 200 || la.getContentText().trim() !== 'true') {
    throw new Error('Chỉ Quản trị hệ thống mới dùng được máy sao lưu.');
  }
}

/** Các file sao lưu trong thư mục, mới nhất trước. Không kèm nội dung. */
function dsBanSaoLuu_(cauHinh) {
  var ds = [];
  var it = layThuMuc_(cauHinh).getFiles();
  while (it.hasNext()) {
    var f = it.next();
    if (f.isTrashed() || !laTenBanSaoLuu_(f.getName())) continue;
    ds.push({ id: f.getId(), ten: f.getName(), byte: f.getSize() });
  }
  ds.sort(function (a, b) { return a.ten < b.ten ? 1 : a.ten > b.ten ? -1 : 0; });
  return ds.slice(0, 400);
}

function laTenBanSaoLuu_(ten) {
  return /^giapha-sao-luu-\d{4}-\d{2}-\d{2}-\d{4}\.json$/.test(ten);
}

/** Nguyên văn một file sao lưu — CHỈ file trong thư mục sao lưu, đúng khuôn tên. */
function taiBanSaoLuu_(cauHinh, id) {
  var f;
  try { f = DriveApp.getFileById(String(id || '')); } catch (e) { f = null; }
  if (!f || f.isTrashed() || !laTenBanSaoLuu_(f.getName())) {
    return { ok: false, loi: 'Không có bản sao lưu này.' };
  }
  var thuMucId = layThuMuc_(cauHinh).getId();
  var trong = false;
  var cha = f.getParents();
  while (cha.hasNext()) { if (cha.next().getId() === thuMucId) { trong = true; break; } }
  if (!trong) return { ok: false, loi: 'Không có bản sao lưu này.' };
  // Nguyên văn UTF-8 — máy chủ so dấu vân tay trên từng byte (`luoc-do/54`).
  return { ok: true, ten: f.getName(), noiDung: f.getBlob().getDataAsString('UTF-8') };
}

/** Tải một tấm lên kho. Trả '' nếu được, 'da_co' nếu kho đã có tấm cùng tên, còn lại là câu lỗi. */
function taiAnhLen_(cauHinh, phieu, duong, blob) {
  var url = cauHinh.url + '/storage/v1/object/' + cauHinh.khoAnh + '/' +
            duong.split('/').map(encodeURIComponent).join('/');
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: { apikey: cauHinh.khoaCongKhai, Authorization: 'Bearer ' + phieu,
               'x-upsert': 'false' },
    contentType: blob.getContentType() || 'image/jpeg',
    payload: blob.getBytes(),
    muteHttpExceptions: true
  });
  var ma = res.getResponseCode();
  if (ma >= 200 && ma < 300) return '';
  var than = '';
  try { than = String(res.getContentText() || '').slice(0, 200); } catch (e) { than = ''; }
  if (ma === 409 || /already exists|Duplicate/i.test(than)) return 'da_co';
  if (ma === 401 || ma === 403 || /row-level security/i.test(than)) {
    return 'bị từ chối — tài khoản khôi phục phải là Quản trị hệ thống (hoặc ' +
           'Quản trị gia phả của cây này), và cây không được nằm thùng rác. ' +
           'Máy chủ nói: ' + than;
  }
  return 'mã ' + ma + ': ' + than;
}

// ============================================================
// CẢNH BÁO
// ============================================================

/**
 * So số dòng lần này với lần trước. Trả về câu cảnh báo, hoặc `null` nếu bình
 * thường. Số lần trước cất trong Script Properties chứ không đọc lại file sao
 * lưu cũ — đọc một file vài megabyte mỗi ngày chỉ để lấy mấy con số là phí,
 * và nó thêm một chỗ hỏng được.
 */
function soVoiLanTruoc_(dem) {
  var kho = PropertiesService.getScriptProperties();
  var thoChu = kho.getProperty('DEM_LAN_TRUOC');
  if (!thoChu) return null;
  var truoc;
  try { truoc = JSON.parse(thoChu); } catch (e) { return null; }

  var loi = [];
  Object.keys(truoc).forEach(function (bang) {
    var cu = Number(truoc[bang]) || 0;
    var moi = Number(dem[bang]) || 0;
    if (cu >= 10 && moi < cu / 2) {
      loi.push('  ' + bang + ': ' + cu + ' → ' + moi + ' dòng');
    }
  });
  if (!loi.length) return null;
  return 'Số dòng tụt hơn một nửa so với lần sao lưu trước:\n\n' +
         loi.join('\n') + '\n\n' +
         'Có thể là thật (ai đó dọn thùng rác), có thể là dữ liệu đã mất. ' +
         'Mở app kiểm bằng mắt trước khi để bản sao lưu cũ bị dọn đi.';
}

function nhoDemLanNay_(dem) {
  PropertiesService.getScriptProperties()
    .setProperty('DEM_LAN_TRUOC', JSON.stringify(dem));
}

function guiThu_(tieuDe, than) {
  try {
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), tieuDe, than);
  } catch (e) {
    Logger.log('Không gửi được thư: ' + e);   // không để việc gửi thư làm hỏng sao lưu
  }
}

// ============================================================
// CẤU HÌNH
// ============================================================

/**
 * Đọc Script Properties và kiểm ngay tại chỗ. Thiếu hay sai thì phải hỏng ở
 * đây, bằng một câu tiếng Việt nói rõ phải làm gì — chứ không hỏng ở tận
 * trong một lệnh gọi mạng với mã 401 không giải thích gì.
 */
function docCauHinh_() {
  var kho = PropertiesService.getScriptProperties();
  var url = (kho.getProperty('SUPABASE_URL') || '').trim().replace(/\/+$/, '');
  var khoaCongKhai = (kho.getProperty('KHOA_CONG_KHAI') || '').trim();
  var email = (kho.getProperty('EMAIL_SAO_LUU') || '').trim();
  var matKhau = kho.getProperty('MAT_KHAU_SAO_LUU') || '';

  // ⚠ Mật khẩu KHÔNG `.trim()`. Khoảng trắng đầu/cuối là ký tự hợp lệ trong
  //   mật khẩu, và cắt lén đi thì lỗi hiện ra là "sai mật khẩu" — câu lỗi dẫn
  //   người ta đi tìm sai chỗ đúng một lần nữa.

  if (!url || !khoaCongKhai || !email || !matKhau) {
    throw new Error('Chưa điền đủ cấu hình. Mở Project Settings → Script ' +
      'Properties và thêm BỐN dòng: SUPABASE_URL · KHOA_CONG_KHAI · ' +
      'EMAIL_SAO_LUU · MAT_KHAU_SAO_LUU. ' +
      'Hướng dẫn từng bước ở sao-luu/HUONG-DAN-SAO-LUU.md.');
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) {
    throw new Error('SUPABASE_URL trông không đúng khuôn. Phải có dạng ' +
      'https://xxxxxxxx.supabase.co — không có dấu / ở cuối.');
  }

  // ⚠ PHÉP KIỂM NÀY ĐÃ ĐẢO CHIỀU Ở BẢN 0.2.0 — đọc kỹ trước khi "sửa lại cho
  //   giống cũ". Bản 0.1.0 BẮT BUỘC khoá bí mật và cấm khoá công khai. Nay
  //   ngược hẳn: khoá bí mật là thứ không được có.
  //
  //   Vì sao đảo: khoá bí mật vượt RLS, nên chỉ cần nó là đọc được mọi thứ —
  //   nhưng Supabase chặn nó khi gọi từ Apps Script (xem `goiTho_`), và loại
  //   đời cũ thì bị khai tử cuối 2026. Bản này đọc bằng phiếu đăng nhập của
  //   một tài khoản mang vai `sao_luu`, nên khoá bí mật vừa vô dụng vừa nguy
  //   hiểm: để nó ở đây là cất một chìa vạn năng trong một dự án Apps Script.
  //
  //   Và không còn nỗi lo cũ *"khoá công khai thì RLS lọc bớt dòng mà vẫn
  //   chạy xanh"*: `05-sao-luu.sql` mở đúng ba chỗ RLS từng chặn, còn phép
  //   đối chiếu số bản ghi ở `soVoiLanTruoc_()` bắt được nếu vẫn thiếu.
  if (/^sb_secret_|service_role/.test(khoaCongKhai)) {
    throw new Error('KHOA_CONG_KHAI đang là khoá BÍ MẬT. Bản sao lưu này ' +
      'không dùng khoá bí mật nữa — Supabase chặn nó khi gọi từ Apps Script, ' +
      'và loại đời cũ sắp bị khai tử. Chép đúng dòng "Publishable key" ' +
      '(sb_publishable_…) ở Project Settings → API Keys.');
  }
  if (!/^(sb_publishable_|eyJ)/.test(khoaCongKhai)) {
    throw new Error('KHOA_CONG_KHAI không đúng khuôn. Khoá công khai của ' +
      'Supabase bắt đầu bằng "sb_publishable_" (bản mới) hoặc "eyJ" ' +
      '(khoá anon đời cũ).');
  }

  var bay = new Date();
  return {
    url: url,
    khoaCongKhai: khoaCongKhai,
    email: email,
    matKhau: matKhau,
    phieu: null,
    khoAnh: (kho.getProperty('KHO_ANH') || 'anh').trim(),
    thuMucId: (kho.getProperty('THU_MUC_DRIVE') || '').trim(),
    soBanGiu: Number(kho.getProperty('SO_BAN_GIU')) || SO_BAN_GIU_MAC_DINH,
    batDauMs: bay.getTime(),
    taoLuc: bay.toISOString(),
    taoLucVn: Utilities.formatDate(bay, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm'),
    dauThoiGian: Utilities.formatDate(bay, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd-HHmm')
  };
}
