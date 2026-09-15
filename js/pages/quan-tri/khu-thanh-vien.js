// ============================================================
// giapha-supabase · js/pages/quan-tri/khu-thanh-vien.js
// Vai trò  : THƯ VIỆN bảng "tài khoản của MỘT cây" — `veBang()`, năm việc đổi
//            quyền, hai việc duyệt đơn, đơn đề xuất gắn mã người, và mấy mẩu
//            vẽ chung. Không còn tự vẽ khu nào: `trang-cay.js` ·
//            `khu-tai-khoan.js` · `khu-tai-khoan-he-thong.js` dùng lại.
// Lớp      : pages — được phép gọi mọi lớp dưới
// Phụ thuộc: services/sb, config, quan-tri/o-goi-y
// Phiên bản: 0.13.0 · Cập nhật: 15/09/2026 (b117)
//            0.13.0 GỠ phần KHU: `mountKhuThanhVien()` · ô chọn cây · ba tấm
//            lọc *Đang chờ · Đã duyệt · Tất cả* · chỗ nạp tấm *Toàn hệ thống*.
//            Cùng bảng ấy đã sống ở trang chi tiết một cây từ b116; giữ cả hai
//            là hai chỗ đổi quyền cho cùng một cây. Khu 2 nay là *Tài khoản
//            của tôi* (`khu-tai-khoan.js`). `veNhacChiXem()` xuất ra cho trang
//            cây. Mọi hàm còn lại KHÔNG đổi một dòng. Lịch sử phần đã gỡ (vì
//            sao có ô chọn cây, vì sao danh tính hiện ở cả bốn tấm): `git log
//            -p` bản 0.12.0.
//            0.12.0 `veBang()` (bảng tài khoản của một cây) nay XUẤT RA —
//            `trang-cay.js` dùng lại nguyên vẹn cho ba mục *Thành viên &
//            quyền · Lời mời · Đơn xin vào*. Không đổi hành vi một dòng nào.
//            0.11.0 (b111c) ĐƠN ĐỀ XUẤT gắn mã người. Dòng của chính
//            mình đổi từ **khoá câm** sang **khoá kèm nút Đề xuất**, và
//            khu mọc thêm khối XÉT ĐƠN theo cây đang chọn. ⚠ Luật "không
//            ai đặt quyền cho chính mình" KHÔNG đổi một chữ — đơn đi
//            đường hai chữ ký, `duyet_de_xuat_gan()` là cửa thứ TÁM.
//            0.10.0 hai việc chủ dự án chốt 10/09/2026, cùng một gốc: **khu
//            này thôi ngầm định cây đang mở, và cột *Người được gắn* thôi chỉ
//            để đọc.**
//              ① Dòng *"Đang xét quyền trong: …"* trở thành **Ô CHỌN CÂY**.
//                 Trước bản này nó khoá cứng vào `phien.treeId` — cây đang mở
//                 trên trình duyệt — nên muốn sửa quyền ở cây khác thì phải
//                 rời trang, sang khu Gia phả đổi cây, rồi quay lại. Đó là
//                 chỗ cuối cùng còn sót của luật b110b *"không màn hình nào
//                 được ngầm định cây đang hoạt động"*.
//                 ⚠ Ô này **KHÔNG đổi cây đang mở của cả app** — nó chỉ đổi
//                 câu hỏi của riêng khu này. Đổi cây làm việc là việc của khu
//                 Gia phả, và trộn hai thứ ấy vào một chỗ bấm là để người ta
//                 tưởng mình vừa xem một danh sách trong khi vừa đổi cả phiên.
//              ② Cột **Người được gắn** bấm được, mở thẳng hàng *Mã người
//                 trong sơ đồ* của đúng cây đang xét. Trước bản này nó là ô
//                 chữ chết, và đường duy nhất tới chỗ gắn mã người đi vòng qua
//                 nút *Sửa quyền* ở cột cuối — cột đầu tiên rơi khỏi mép màn
//                 hình khi màn hình hẹp.
//            0.9.0 ⚠ **BA TẤM LỌC CÂY NAY PHÂN BIỆT ĐƯỢC LỜI MỜI VỚI ĐƠN XIN
//            VÀO.** Chủ dự án báo lỗ hổng 10/09/2026: mời một tài khoản rồi
//            *"vào kiểm duyệt thêm được người này luôn và đổi được quyền cho
//            họ mà không đợi họ đồng ý"*. Hàng rào thật đã vá ở máy chủ
//            (`luoc-do/18-hai-chu-ky.sql`, bốn cửa + `la_thanh_vien()`);
//            phần ở đây là **thôi mời người ta bấm một thứ chắc chắn bị từ
//            chối** — dòng lời mời nay mang huy hiệu *Được mời — chờ họ bấm
//            Nhận*, nút mở bảng việc **khoá sẵn kèm lý do**, và cột Vai trò
//            hiện đúng vai họ SẼ nhận (`moiVai`) thay vì `xem`.
//            Ba trạng thái phân biệt bằng `moiLuc` (`sb.js` 0.15.0) — đúng
//            cách `veDongVaiTro()` đã làm từ b109c, nay dùng chung một hàm
//            `trangThaiDong()` để hai chỗ không lệch nhau.
//            0.8.0 ⚠ **KHÔNG CÒN CHỖ NÀO ĐỔI QUYỀN MÀ KHÔNG GỌI TÊN CÂY.**
//            Chủ dự án chốt 09/09/2026: *"một người chủ cây gia phả có thể
//            tạo nhiều cây gia phả, vì vậy khi gán quyền không nên ngầm định
//            gán quyền cho cây đang hoạt động mà cần luôn luôn xác định người
//            nào, cây nào, quyền gì"*. Ba việc theo sau:
//              ① `veBangViec()` và `veXetDon()` thôi nhận `treeId` trần, nay
//                 nhận cả một **đối tượng `cay`** `{treeId, ten, maCay}`. Đây
//                 là chỗ sửa THẬT: một chuỗi uuid không tự nói nó là cây nào,
//                 nên chừng nào tham số còn là `treeId` thì màn hình còn phải
//                 tự bịa ra một cái nhãn — và nó đã bịa: chuỗi *"Gia phả đang
//                 mở"* ở bản 0.7.0. Đổi hình dạng tham số thì **không viết
//                 được lời gọi thiếu tên cây nữa**.
//              ② Mọi bảng việc mở ra đều có `dongCay()` ở dòng đầu — tên cây
//                 và mã cây, nền đậm, đứng trên cả năm việc.
//              ③ Câu giải thích của việc *Gỡ* và *Bàn giao* gọi đúng tên cây,
//                 thay cho hai chữ "gia phả" trống không.
//            Tên cây tới đây từ `layPhien()` (`sb.js` 0.14.0), không tốn thêm
//            vòng mạng nào.
//            0.7.0 dòng danh tính (`dongDanhTinh()`, b109d) nay hiện Ở CẢ BỐN
//            TẤM LỌC, không riêng *Toàn hệ thống* — chủ dự án chỉ ra bất nhất
//            ngay sau khi bấm thử b109d: ba tấm *Đang chờ · Đã duyệt · Tất cả*
//            vẫn không nói ai đang xem, dù rủi ro "nhầm tài khoản đang đăng
//            nhập khi đổi quyền" giống hệt ở cả bốn. Tách thành hai `<p>` độc
//            lập: dòng danh tính cố định, câu dẫn theo tấm lọc (`DAN_CAY`) chỉ
//            hiện ở ba tấm cây, ẩn hẳn ở *Toàn hệ thống*.
//            0.6.0 câu dẫn của tấm *Toàn hệ thống* đổi hẳn: không còn mô tả
//            khu này liệt kê gì, mà nói **CHÍNH MÌNH đang đăng nhập bằng tài
//            khoản nào** — tên, email, mã. Chủ dự án bấm thử b109c trên máy
//            chủ thật rồi đổi ý cùng ngày: cờ Quản trị hệ thống có thể cấp
//            cho nhiều tài khoản, và đây là màn hình sửa được cờ ấy cho người
//            khác — nhầm tài khoản đang đăng nhập ở đây là nhầm chỗ nguy
//            hiểm nhất app. `layPhien()` (`sb.js` 0.12.0) nay mang thêm
//            `hoTen`, đọc thẳng bảng `tai_khoan` qua RLS sẵn có, không hàm mới.
//            0.5.0 cột **Vai trò** của ba tấm lọc cây nay BẤM ĐƯỢC: nó mở
//            `veBangVaiTroTungCay()` — một bảng hai cột *gia phả · vai trò*,
//            bấm tiếp vào vai trò là vào thẳng bảng sửa quyền của cây ấy. Cùng
//            hàm ấy phục vụ cột Vai trò của tấm *Toàn hệ thống*. Cộng: bảng
//            dài quá tám dòng thì tự cuộn TRONG khung (bảng việc ở dưới không
//            còn bị đẩy xuống sâu), và câu dẫn tấm *Toàn hệ thống* rút gọn.
//            0.4.0 ô *Mã người trong sơ đồ* nay có gợi ý (`o-goi-y.js`) — gõ
//            tên là ra người, kèm năm sinh–mất và câu "đã gắn cho ai". Và cột
//            *Người được gắn* từ nay hiện được TÊN: `ds_thanh_vien()` trước
//            b109b đọc `vn->>'name'` (luôn null) nên luôn rơi xuống mã người.
//            0.3.0 (b109) tấm lọc thứ tư **Toàn hệ thống**, chỉ hiện cho người
//            có cờ Quản trị hệ thống · sáu hàm việc nhận thẳng `treeId` thay
//            cho cả `phien` (chúng vốn chỉ đọc đúng trường ấy) nên bảng sâu
//            của file bên cạnh gọi lại được chúng theo TỪNG CÂY, không phải
//            chỉ cây đang mở · xuất mấy mẩu vẽ chung.
//            0.2.0 sau lần chủ dự án bấm thử đầu tiên: bảng việc ra NGOÀI
//            bảng (trước nó nằm trong khung 860px nên việc thứ ba trở đi rơi
//            khỏi mép màn hình) · nút *Sửa quyền* khoá sẵn ở dòng không đổi
//            được gì · cờ `tin_cay` trên màn hình gọi đúng là **Tin cậy**.
// ============================================================
//
// ═══ CHỮ "TÀI KHOẢN", KHÔNG PHẢI "THÀNH VIÊN" ═══
//
// Bảng dưới máy chủ tên là `tree_members` và hàm tên `ds_thanh_vien`, nhưng
// thứ liệt kê ở đây là **tài khoản đăng nhập**, không phải người trong sơ đồ
// gia phả. Hai cột khác hẳn nhau và nhầm chúng là hiểu sai cả khu này:
//
//   · `userId`  → tài khoản trong phần mềm. **Vai trò gắn vào đây.**
//   · `maNguoi` → mã người trong cây (`P0012`), có thể trống. Chỉ dùng để tính
//                 phạm vi sửa trực hệ khi vai là `sua`.
//
// Nghĩa là chủ cây phong `quan_tri` cho một tài khoản bất kỳ — người ấy không
// cần có mặt trong gia phả, không cần là con cháu trong họ. Chủ dự án nhắc
// thẳng chỗ này 08/09/2026; `luoc-do/13` mục 7 ghi nguyên văn.
//
// ═══ AI ĐỔI ĐƯỢC QUYỀN — VÀ VÌ SAO KHU NÀY CÓ HAI HẠNG NGƯỜI XEM ═══
//
// `THIET-KE-NHIEU-CAY.md` mục 11.3, chốt 08/09/2026:
//
//   · **Quản trị hệ thống** (cờ `tai_khoan`) — đổi được ở mọi cây.
//   · **Chủ cây** (cột `trees.chu_so_huu`) — đổi được ở cây mình.
//   · **Quản trị gia phả** (`quan_tri` được phong) — **chỉ sửa + duyệt NỘI
//     DUNG. Không đổi quyền, và không duyệt đơn xin vào cây** — nhận một người
//     vào cây là cấp quyền ĐỌC, đó là đổi quyền chứ không phải kiểm một lần Lưu.
//
// Hạng thứ ba vẫn **thấy** bảng này (máy chủ gác `ds_thanh_vien` bằng
// `co_the_kiem_duyet`, cố ý — `02-rls.sql` vốn đã cho mọi thành viên đọc
// `tree_members`, gác chặt hơn ở đó là diễn kịch). Nên khu này phải phân biệt
// *xem được* với *đổi được*, và câu trả lời cho vế thứ hai hỏi máy chủ bằng
// `coTheQuanTri()` — **không suy từ `phien.vaiTro`**: chủ cây nhận quyền qua
// một CỘT, không qua mã vai, nên mọi phép suy trong trình duyệt đều khoá tay
// đúng người có quyền nhất.
//
// ⚠ **Ẩn / mờ nút KHÔNG phải hàng rào.** Hàng rào nằm trong thân bảy hàm SQL
//   của `13`. Ở đây mờ nút chỉ để không mời người ta bấm một thứ chắc chắn bị
//   từ chối — `THIET-KE-QUAN-TRI.md` mục 5 câu cuối.
//
// ═══ HAI NHỊP, VÀ VÌ SAO MỜ SẴN NÚT TRÊN DÒNG CỦA CHÍNH MÌNH ═══
//
// Năm cửa đổi quyền đều từ chối khi người bị tác động **chính là người đang
// gọi** — luật *"không ai đặt quyền cho chính mình"*, không ngoại lệ, kể cả
// Quản trị hệ thống. Hai cửa trong đó không ai gọi là "quyền" mà vẫn là leo
// thang: tự **gắn mã người** cho mình vào một cụ tổ mở `pham_vi_sua()` ra cả
// cây; tự bật **ghi thẳng** là tự bỏ qua kiểm duyệt.
//
// Nên dòng của chính mình phải **mờ sẵn kèm một câu lý do**, đừng để bấm rồi
// mới nhận câu từ chối. Mờ chứ không ẩn: ẩn thì người ta đi tìm, và không có
// gì dạy họ luật ấy tồn tại.
//
// ⚠ **Không `alert()`, không `confirm()`.** Cả app chưa có chỗ nào dùng
//   (`khung.js` đầu file). Việc hỏng thì nói ngay tại dòng nó hỏng.

import {
  dsThanhVien,
  doiVaiThanhVien, ganNguoiChoThanhVien, datTinCayThanhVien,
  goThanhVien, doiChuCay, duyetThanhVien, tuChoiThanhVien,
  timNguoiTrongCay, dsCayCuaTaiKhoan,
  nopDeXuatGan, rutDeXuatGan, deXuatGanCuaToi,
  dsDeXuatGan, duyetDeXuatGan, tuChoiDeXuatGan,
} from '../../services/sb.js';
import { vaiTroBangChu } from '../../config.js';
import { ganGoiY, dongNguoi } from './o-goi-y.js';

/** Trần quyền cấp được cho tài khoản khác — `13` mục 8 chặn phần còn lại. */
const VAI_CAP_DUOC = ['quan_tri', 'sua', 'xem'];

/**
 * Câu nói thẳng cho người mang vai `quan_tri` **được phong**: xem được, không
 * đổi được. Đây là món nợ b105 trả ở đây — trước bước này họ thấy khối *Đơn
 * chờ duyệt* trong Cài đặt, bấm Duyệt rồi mới nghe máy chủ từ chối.
 */
export function veNhacChiXem() {
  const hop = document.createElement('div');
  hop.style.cssText =
    'margin-bottom:14px;padding:11px 13px;border:1px solid #e2d5bf;' +
    'border-radius:9px;background:#faf6ee;color:#7a5a28;font-size:13px;' +
    'line-height:1.55';
  hop.textContent =
    'Bạn xem được danh sách này nhưng không đổi được quyền của ai, và cũng ' +
    'không duyệt được đơn xin vào gia phả — nhận một người vào cây là cấp ' +
    'quyền đọc, việc ấy thuộc chủ gia phả. Bạn vẫn sửa và duyệt nội dung bình thường.';
  return hop;
}

// ============================================================
// Bảng
// ============================================================

/**
 * Bảng tài khoản của MỘT cây — cột đổi vai · gắn người · tin cậy · gỡ · bàn
 * giao, mỗi dòng thích ứng theo `trangThaiDong()`.
 *
 * ⚠ Xuất ra để `trang-cay.js` (b116) dùng lại nguyên vẹn cho ba mục *Thành
 *   viên & quyền · Lời mời · Đơn xin vào* — khác `mountKhuThanhVien()` (khu
 *   này), hàm ở đây KHÔNG có ô chọn cây hay tấm lọc *Toàn hệ thống*: người gọi
 *   tự lọc `ds` theo `trangThaiDong()` rồi truyền `cay` đã biết trước từ địa
 *   chỉ. Không viết bảng thứ hai — cùng năm việc, cùng luật khoá nút, cùng chỗ
 *   dễ vỡ (`veMotDong()` đã canh) chỉ nên có một bản.
 */
export function veBang(ds, phien, cay, duocDoiQuyen, napLai, bo) {
  // Bảng rộng phải tự cuộn TRONG khung của nó, không kéo phình cả lưới hai cột
  // của trang. Cùng cách hai khu kia làm.
  const khung = document.createElement('div');
  khung.style.cssText = 'overflow-x:auto;-webkit-overflow-scrolling:touch';
  capChieuCao(khung, ds.length);

  const bang = document.createElement('table');
  bang.style.cssText =
    'width:100%;min-width:860px;border-collapse:collapse;font-size:13px;' +
    'background:#fffdf9;border:1px solid #e6e0d8;border-radius:10px';

  bang.append(veDauBang());

  const ruot = document.createElement('tbody');
  for (const t of ds) veMotDong(ruot, t, phien, cay, duocDoiQuyen, napLai, bo);
  bang.append(ruot);

  khung.append(bang);
  return khung;
}

function veDauBang() {
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  tr.style.cssText = 'border-bottom:1px solid #e6e0d8;background:#faf8f5';

  const cot = [
    ['Tài khoản', ''],
    // ⚠ Cột này có việc thật, không phải trang trí: hai người trong họ trùng
    //   tên là chuyện thường ở gia phả, và mã ngắn là thứ chỉ đúng một tài
    //   khoản mà không phải đọc email lên. Màn Cài đặt hiện đúng mã ấy cho
    //   từng người tự đọc (`settings.js`, khối *Tài khoản và quyền*).
    ['Mã tài khoản', ''],
    // ⚠ Chú thích nhỏ *"bấm để gắn/đổi"* KHÔNG phải trang trí — cùng lý do đã
    //   phải thêm nó cho cột *Tài khoản* của tấm *Toàn hệ thống* (b109c): một
    //   ô bảng trông không giống nút, và không nói thì chỗ bấm ấy vô hình.
    ['Người được gắn', '', 'bấm để gắn/đổi'],
    ['Vai trò', '', 'bấm xem từng cây'],
    // ⚠ Trên màn hình gọi là **Tin cậy**, đúng tên cột `tree_members.tin_cay`
    //   và đúng chữ chủ dự án dùng khi hỏi. Bản đầu b106 gọi nó là *Ghi thẳng*
    //   — mô tả đúng cái nó làm, nhưng chủ dự án đi tìm chữ "tin cậy" và không
    //   thấy (08/09/2026). Chữ "ghi thẳng" vẫn ở nguyên trong câu giải thích,
    //   nơi nó có việc: nói ra HẬU QUẢ của việc bật.
    ['Tin cậy', 'text-align:center'],
    ['Tham gia', ''],
    ['', 'text-align:right'],
  ];
  for (const [chu, them, phu] of cot) {
    const th = document.createElement('th');
    th.style.cssText =
      'padding:9px 10px;text-align:left;font-weight:600;color:#6a625a;' +
      'font-size:12px;white-space:nowrap;' + CSS_DAU_BANG + them;
    th.append(document.createTextNode(chu));
    if (phu) {
      const d = document.createElement('div');
      d.textContent = phu;
      d.style.cssText = 'font-weight:400;font-size:11px;color:#8a8078';
      th.append(d);
    }
    tr.append(th);
  }
  thead.append(tr);
  return thead;
}

/**
 * Bảng dài thì tự cuộn TRONG khung, thay vì đẩy mọi thứ dưới nó xuống sâu.
 *
 * ⚠ ĐÂY LÀ MỘT LỖI ĐO ĐƯỢC, KHÔNG PHẢI SỞ THÍCH. Bảng việc đứng NGOÀI bảng
 *   (b106, có lý do riêng ở `moBangViec()`), nên nó nằm sau dòng cuối cùng.
 *   Ba chục tài khoản là bấm dòng thứ hai rồi phải cuộn qua hai mươi tám dòng
 *   mới thấy thứ vừa mở — chủ dự án nói đúng chữ ấy 09/09/2026. Kéo bảng việc
 *   lên trên bảng thì hỏng ngược lại: bấm dòng cuối phải cuộn NGƯỢC lên.
 *
 * ⚠ Chỉ cắt khi bảng thật sự dài. Bốn dòng mà nhốt trong khung cuộn là đẻ ra
 *   một thanh cuộn thứ hai chẳng để làm gì, và trên điện thoại `62vh` chỉ đủ
 *   bốn năm dòng — cắt sớm là làm hỏng đúng màn hình chật nhất.
 *
 * @param {HTMLElement} khung  ô có `overflow-x:auto` bọc ngoài bảng
 * @param {number} soDong      số dòng sắp vẽ
 */
export function capChieuCao(khung, soDong) {
  if (soDong <= 8) return;
  khung.style.overflowY = 'auto';
  khung.style.maxHeight = '62vh';
}

/**
 * Dòng tiêu đề DÍNH khi khung cuộn dọc — không có nó thì cuộn xuống dòng thứ
 * mười lăm là mất tên cột, và cột *Vai trò* với cột *Tin cậy* trông giống hệt
 * nhau khi cùng ghi "Có".
 *
 * `box-shadow` thay cho `border-bottom`: `border-collapse:collapse` gộp đường
 * viền vào hàng, và đường viền đã gộp thì **cuộn đi mất** cùng thân bảng.
 */
export const CSS_DAU_BANG =
  'position:sticky;top:0;z-index:1;background:#faf8f5;' +
  'box-shadow:inset 0 -1px 0 #e6e0d8;';

/**
 * Một dòng của bảng, cộng một cái nút mở bảng việc **ở dưới bảng** (`bo`).
 *
 * ⚠ Vì sao bảng việc đứng riêng chứ không nhồi năm nút vào cột cuối: ba trong
 *   năm việc cần một ô nhập hoặc một ô chọn đứng cạnh nút. Nhồi hết vào một ô
 *   bảng thì trên điện thoại chúng xếp chồng thành một cột hẹp không đọc nổi,
 *   còn trên máy tính thì bảng phình ngang tới mức phải cuộn mới thấy cột đầu.
 */
/**
 * Một dòng `tree_members` ở đúng MỘT trong ba trạng thái. Hàm này là chỗ
 * DUY NHẤT trả lời câu ấy, và đó là chủ ý.
 *
 * ⚠ **Phân biệt bằng `moiLuc`, KHÔNG bằng người mời.** `moi_boi` khai
 *   `on delete set null` (`14` mục 1), nên xoá tài khoản người mời sẽ biến một
 *   lời mời thành thứ trông y hệt đơn xin vào.
 *
 * ⚠ Trước b110c hàm này KHÔNG tồn tại ở tấm lọc cây, vì `ds_thanh_vien()`
 *   không trả `moiLuc` — nên màn hình vẽ chữ *"Đang chờ"* cộng nút *"Xét đơn"*
 *   lên cả lời mời, và bấm vào là đưa người ta vào cây khi họ chưa đồng ý.
 *   Đó đúng là lỗ hổng chủ dự án báo 10/09/2026. Máy chủ nay từ chối
 *   (`luoc-do/18`), và chỗ này thôi mời người ta bấm.
 *
 * @returns {'thanhvien'|'duocmoi'|'donxin'}
 */
export function trangThaiDong(t) {
  if (t.daDuyet) return 'thanhvien';
  return t.moiLuc ? 'duocmoi' : 'donxin';
}

function veMotDong(ruot, t, phien, cay, duocDoiQuyen, napLai, bo) {
  const trangThai = trangThaiDong(t);
  const tr = document.createElement('tr');
  tr.style.cssText = 'border-bottom:1px solid #f2eee8;vertical-align:top';

  // — Tài khoản: email + huy hiệu —
  const oTk = o('', 'padding:10px;color:#2a2622;word-break:break-all');
  const email = document.createElement('span');
  email.textContent = t.email || '(không rõ email)';
  email.style.fontWeight = '600';
  oTk.append(email);
  if (t.laChuCay) oTk.append(huyHieu('Chủ gia phả', true));
  if (t.laChinhToi) oTk.append(huyHieu('Bạn', false));
  // ⚠ HAI CÂU KHÁC HẲN NHAU, và bản trước gộp chúng thành một chữ "Đang chờ".
  //   *Đơn xin vào* chờ NGƯỜI QUẢN TRỊ bấm; *lời mời* chờ CHÍNH NGƯỜI ẤY bấm.
  //   Gộp lại là mời người quản trị đi làm hộ việc của người kia.
  if (trangThai === 'duocmoi') oTk.append(huyHieu('Được mời — chờ họ bấm Nhận', false));
  else if (trangThai === 'donxin') oTk.append(huyHieu('Đơn chờ duyệt', false));

  const oMa = o(t.maNgan || '—',
    'padding:10px;font-family:ui-monospace,monospace;font-size:12px;color:#5b4533');

  // ⚠ Ô này BẤM ĐƯỢC từ b111b — mở thẳng hàng *Mã người trong sơ đồ* của cây
  //   đang xét. Xem `veONguoiGan()`.
  const oNguoi = veONguoiGan(t, {
    css: 'padding:10px',
    // Đúng ba lý do khoá của nút *Sửa quyền* ngay cột cuối, và cùng nguồn:
    // `gan_nguoi_cho_thanh_vien()` từ chối cả ba (`18` mục 4).
    khoa: !duocDoiQuyen || t.laChinhToi || trangThai === 'duocmoi',
    lyDo: t.laChinhToi
      ? 'Dòng của chính bạn — không ai tự gắn mã người cho mình được. Tự gắn '
        + 'mình vào một cụ tổ là mở quyền sửa cho cả một nhánh.'
      : trangThai === 'duocmoi'
      ? 'Đây là lời mời đang chờ chính người ấy bấm Nhận. Gắn mã người hộ họ '
        + 'là bỏ mất chữ ký thứ hai.'
      : 'Bạn xem được danh sách này nhưng không đổi được quyền của ai.',
  });
  if (oNguoi.dat) {
    bo.oVai.push(oNguoi.dat);
    oNguoi.nut.addEventListener('click', () => moOChung(
      bo, 'gan:' + t.userId, oNguoi.dat,
      tieuDeGan(t, cay),
      () => bangGanNguoi(t, cay, duocDoiQuyen, napLai)));
  }

  // `nowrap`: tên vai dài nhất là *Thành viên họ tộc*, và để nó gãy làm hai
  //   dòng thì cột Vai trò cao gấp đôi mọi cột khác trên cùng một hàng — đo
  //   bằng ảnh chụp 1280px, không đoán.
  const oVai = veOVaiTro(t, phien, cay, duocDoiQuyen, napLai, bo);

  const oTin = o(t.tinCay ? 'Có' : 'Không',
    'padding:10px;text-align:center;color:' + (t.tinCay ? '#2f6b3a' : '#8a8078'));

  // Người đang chờ thì mốc đáng đọc là lúc họ NỘP ĐƠN, không phải lúc dòng
  // được tạo — hai mốc ấy trùng nhau hôm nay, nhưng câu chữ phải nói đúng cái
  // người duyệt cần biết.
  const oLuc = o(gioVietNam(t.daDuyet ? t.thamGia : (t.xinLuc || t.thamGia)),
    'padding:10px;color:#6a625a;font-size:12px;white-space:nowrap');

  const oThao = o('', 'padding:10px;text-align:right');

  tr.append(oTk, oMa, oNguoi.td, oVai, oTin, oLuc, oThao);
  ruot.append(tr);

  // — Nút mở bảng việc —
  //
  // ⚠ **Khoá sẵn, không mở ra rồi mới giải thích.** Chủ dự án bảo thẳng
  //   08/09/2026, sau khi bấm vào dòng của chính mình: *"nút chuyển sang màu
  //   xám và ở trạng thái khoá, không cần cho bấm vào rồi đi giải thích."*
  //
  //   Hai trường hợp khoá, và cả hai đều là *mọi việc bên trong đều bị máy chủ
  //   từ chối*, chứ không phải *phần lớn*:
  //     · dòng của chính mình — cả năm cửa của `luoc-do/13` đều từ chối khi
  //       người bị tác động là người đang gọi;
  //     · người chỉ xem được (`quan_tri` được phong) — không cửa nào mở.
  //
  //   Lý do vì sao khoá đã nằm sẵn trên màn hình mà không phải bấm gì: huy
  //   hiệu *Bạn* ngay cột đầu, và câu nhắc `veNhacChiXem()` ở đầu khu. `title`
  //   chỉ là lớp thứ hai cho người dùng chuột — đừng để nó thành chỗ DUY NHẤT
  //   nói ra lý do, điện thoại không có chuột.
  // ⚠ Dòng LỜI MỜI không có nút nào, đúng luật đã ghi ở `veDongVaiTro()` và
  //   ở `THIET-KE-QUAN-TRI.md` khu 2: *"Lời mời không có nút — nhận hộ người
  //   khác là bỏ mất chữ ký thứ hai"*. Bản trước áp luật ấy cho bảng sâu của
  //   tấm *Toàn hệ thống* mà quên ba tấm lọc cây, và chính chỗ quên ấy là
  //   đường chủ dự án đi vào khi báo lỗ hổng 10/09/2026.
  const chuDong = t.daDuyet ? 'Sửa quyền' : 'Xét đơn';
  const khoaMo = !duocDoiQuyen || t.laChinhToi || trangThai === 'duocmoi';

  const bMo = nut(trangThai === 'duocmoi' ? 'Chờ họ bấm Nhận' : chuDong, false);
  bMo.dataset.chuDong = chuDong;

  if (khoaMo) {
    bMo.disabled = true;
    bMo.style.opacity = '0.45';
    bMo.style.cursor = 'not-allowed';
    bMo.title = t.laChinhToi
      ? 'Dòng của chính bạn — không ai đặt quyền cho chính mình được. '
        + 'Muốn nhận mã người cho mình thì bấm Đề xuất mã người.'
      : trangThai === 'duocmoi'
      ? 'Đây là lời mời đang chờ chính người ấy bấm Nhận. Không ai nhận hộ '
        + 'được — vào gia phả luôn cần hai chữ ký. Muốn đổi ý thì gỡ lời mời '
        + 'rồi mời lại.'
      : 'Bạn xem được danh sách này nhưng không đổi được quyền của ai.';
  } else {
    // ⚠ `cay` là ĐỐI TƯỢNG, không phải `treeId` trần, và từ b111b nó tới đây
    //   từ **ô chọn cây** chứ không từ `phien` — cùng một lý do: chuỗi uuid
    //   không tự nói nó là cây nào, nên bảng việc mở ra sẽ phải tự bịa một cái
    //   nhãn, và bản 0.7.0 đã bịa đúng như thế. Xem khối đầu file.
    bo.nut.push(bMo);
    bMo.addEventListener('click', () => moBangViec(bo, t, bMo, cay, () => (t.daDuyet
      ? veBangViec(t, cay, duocDoiQuyen, napLai)
      : veXetDon(t, cay, duocDoiQuyen, napLai))));
  }

  oThao.append(bMo);

  // ⚠ NÚT THỨ HAI, CHỈ TRÊN DÒNG CỦA CHÍNH MÌNH (b111c) — *khoá kèm nút Đề
  //   xuất* thay cho *khoá câm*. Nút "Sửa quyền" bên trên vẫn xám, và luật
  //   *"không ai đặt quyền cho chính mình"* không đổi một chữ: nút này không
  //   gắn gì cả, nó nộp một lá đơn để **một quản trị khác** xét.
  //
  // ⚠ Chỉ hiện khi dòng ấy ĐÃ DUYỆT. Một người còn đang chờ duyệt (hay còn là
  //   lời mời chưa nhận) thì `nop_de_xuat_gan()` từ chối — họ chưa có chân
  //   trong cây (đo: Q4, Q5, cùng họ lỗ hổng b110c). Vẽ một cái nút chắc chắn
  //   bị từ chối là mời người ta bấm để nghe từ chối.
  if (t.laChinhToi && t.daDuyet) {
    const bDx = nut('Đề xuất mã người', false);
    bDx.dataset.chuDong = 'Đề xuất mã người';
    bDx.style.marginTop = '6px';
    bo.nut.push(bDx);
    bDx.addEventListener('click', () => moBangViec(
      bo, t, bDx, cay, () => bangDeXuatCuaToi(t, cay, napLai),
      'Đề xuất mã người của '));
    oThao.append(bDx);
  }
}

/**
 * Ô **Vai trò** của ba tấm lọc cây — bấm được, mở bảng *gia phả · vai trò*.
 *
 * ⚠ Ở tấm lọc này ô ấy trông như thừa: cả bảng vốn nói về ĐÚNG MỘT cây, nên
 *   bảng mở ra thường chỉ có một dòng. Nó vẫn có việc thật, và là việc chủ dự
 *   án đặt tên 09/09/2026: *"bấm vào cũng xuất hiện bảng tương tự"*. Quyền ở
 *   app này gắn với TỪNG cây, nên một chỗ bấm duy nhất — cùng hình, cùng chỗ,
 *   ở cả hai tấm lọc — dạy đúng một câu: **vai trò không phải thuộc tính của
 *   tài khoản.** Với Quản trị hệ thống thì bảng ấy dài ra thật.
 */
function veOVaiTro(t, phien, cay, duocDoiQuyen, napLai, bo) {
  // ⚠ Người được mời mang vai `xem` ở cột `role` cho tới lúc họ bấm Nhận —
  //   đó là cả điểm của cột `moi_vai` (`14` mục 4). Hiện đúng vai họ SẼ nhận,
  //   đừng hiện `xem`: người quản trị đọc "Khách" rồi đi đổi vai, và cú đổi
  //   vai ấy chính là đường vào lỗ hổng 10/09/2026.
  const vaiHien = trangThaiDong(t) === 'duocmoi' ? (t.moiVai || t.vai) : t.vai;
  const chu = vaiTroBangChu(vaiHien) || vaiHien || '';
  const td = o('', 'padding:0;white-space:nowrap');

  if (!chu) {
    const d = document.createElement('div');
    d.textContent = '—';
    d.style.cssText = 'padding:10px;color:#a89f94';
    td.append(d);
    return td;
  }

  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = chu;
  b.style.cssText =
    'display:block;width:100%;padding:10px;border:0;background:none;' +
    'font:inherit;color:inherit;text-align:left;cursor:pointer;border-radius:8px';
  td.append(b);

  const dat = (dangMo) => {
    b.style.background = dangMo ? '#f2ece2' : 'none';
    b.style.boxShadow = dangMo ? 'inset 0 0 0 1px #c9c0b4' : 'none';
  };
  bo.oVai.push(dat);

  b.addEventListener('click', () => moBangVaiTro(bo, t, dat, () =>
    veBangVaiTroTungCay(t, {
      // Chỉ Quản trị hệ thống đọc được cả sổ — hàng rào nằm trong thân
      // `ds_cay_cua_tai_khoan()`, xem khối chú thích của hàm ấy.
      docCaSo: Boolean(phien.laQuanTriHeThong),
      cayNay: {
        // ⚠ Cây ĐANG XÉT, không phải cây đang mở — từ b111b hai thứ ấy tách
        //   nhau ra được. Bảng một dòng này nói về đúng cái bảng bên trên nó,
        //   nên nó phải lấy cùng một nguồn; đọc `phien` ở đây là để bảng con
        //   nói về cây A trong khi bảng cha nói về cây B.
        treeId: cay.treeId,
        ten: cay.ten || '',
        maCay: cay.maCay || '',
        vai: t.vai,
        daDuyet: t.daDuyet,
        // ⚠ Từ b110c `ds_thanh_vien()` TRẢ `moi_luc` (`luoc-do/18` mục 6b),
        //   nên chỗ này thôi phải đoán. Bản trước truyền `null` cứng và nói
        //   thật rằng nó không biết — đúng, nhưng cái không biết ấy chính là
        //   thứ làm màn hình vẽ nút *Xét đơn* lên một dòng lời mời.
        moiLuc: t.moiLuc,
        nhanCho: t.moiLuc ? 'Được mời' : 'Đơn chờ duyệt',
        moiVai: t.moiVai || '',
        maNguoi: t.maNguoi,
        tenNguoi: t.tenNguoi,
        tinCay: t.tinCay,
        laChuCay: t.laChuCay,
      },
      duocDoiQuyen,
      napLai,
    })));

  return td;
}

/**
 * Mở bảng việc của một dòng, **bên NGOÀI bảng** — không phải một `<tr>` ẩn
 * ngay dưới dòng vừa bấm.
 *
 * ⚠ Bản đầu của b106 làm đúng kiểu `<tr>` ẩn ấy, và nó **hỏng thật**: ô mở
 *   rộng nằm TRONG cái bảng `min-width:860px`, nên việc thứ ba trở đi rơi ra
 *   ngoài mép màn hình. Chủ dự án sửa được vai (việc 1) và gỡ được tài khoản
 *   (việc 4) rồi vẫn hỏi *"bật tắt tin cậy ở đâu?"* — việc 3 nằm ngay đó, chỉ
 *   là không nhìn thấy. Đứng ngoài bảng thì bảng việc rộng đúng bằng khu.
 *
 * ⚠ Loại lỗi này bất biến văn bản không bắt được: 121 phép của
 *   `kiem-trang-quan-tri.mjs` đều xanh trong khi màn hình không dùng được.
 *   Phải nhìn bằng mắt, hoặc chụp ảnh ở đúng bề ngang thật.
 */
function moBangViec(bo, t, bMo, cay, veNoiDung, tieuChu) {
  const dangMoDongNay = bo.dangMo === 'viec:' + t.userId;

  dongHet(bo);

  if (dangMoDongNay) {
    bo.dangMo = null;
    return;
  }

  bo.dangMo = 'viec:' + t.userId;
  bMo.textContent = 'Thu lại';

  const hop = document.createElement('div');
  hop.style.cssText =
    'margin-top:14px;padding:0 14px 14px;border:1px solid #e6e0d8;' +
    'border-radius:10px;background:#faf8f5';

  // Bảng việc nay đứng tách khỏi dòng nên nó phải TỰ NÓI nó của ai — cột
  // *Mã tài khoản* có mặt ở đây đúng vì lý do ấy: hai người trùng tên trong
  // họ là chuyện thường.
  const tieu = document.createElement('div');
  tieu.style.cssText = 'padding:12px 0 0;font-size:13px;color:#2a2622';
  // ⚠ `tieuChu` không phải chỗ cho đẹp: từ b111c cùng một chỗ đứng chung mở ra
  //   được HAI loại khung khác hẳn nhau — sửa quyền của người khác, và nộp một
  //   lá đơn cho chính mình. Để mặc tiêu đề cũ thì khung đề xuất tự giới thiệu
  //   là *"Sửa quyền của <chính bạn>"*, tức nói ngược đúng cái luật cả bước này
  //   dựng ra để giữ. Thấy ở ảnh `kq-23.png` trước khi ai kịp bấm thật.
  tieu.append(document.createTextNode(
    tieuChu || (t.daDuyet ? 'Sửa quyền của ' : 'Xét đơn của ')));

  const ai = document.createElement('span');
  ai.textContent = t.email || '(không rõ email)';
  ai.style.cssText = 'font-weight:600;word-break:break-all';
  tieu.append(ai);

  if (t.maNgan) {
    const m = document.createElement('span');
    m.textContent = ' · ' + t.maNgan;
    m.style.cssText = 'font-family:ui-monospace,monospace;font-size:12px;color:#5b4533';
    tieu.append(m);
  }

  // ⚠ TÊN CÂY NẰM NGAY TRONG TIÊU ĐỀ, không chỉ ở dòng nhắc bên dưới. Đây là
  //   chỗ chủ dự án chỉ ra 09/09/2026: bảng việc này đứng TÁCH khỏi dòng vừa
  //   bấm (b106), nên nó đã phải tự nói nó của AI — và từ nay phải tự nói nó
  //   ở CÂY NÀO nữa, vì một tài khoản có chân ở nhiều cây và năm việc bên
  //   dưới chỉ đụng đúng một cây.
  if (cay && (cay.ten || cay.maCay)) {
    tieu.append(document.createTextNode(' — trong '));
    const c = document.createElement('span');
    c.textContent = cumCay(cay);
    c.style.fontWeight = '600';
    tieu.append(c);
  }

  hop.append(tieu, veNoiDung());
  bo.oViec.append(hop);

  // `nearest` chứ không phải `start`: cuộn vừa đủ để thấy, không hất cái bảng
  // ra khỏi màn hình — người đang so mấy dòng với nhau thì cần thấy cả hai.
  hop.scrollIntoView({ block: 'nearest' });
}

/**
 * Đóng mọi thứ đang mở ở chỗ đứng chung, kể cả khi sắp mở dòng khác.
 *
 * Trả **mọi** nút về chữ cũ là cách duy nhất để không còn cái nút nào ghi
 * "Thu lại" mà chẳng thu cái gì. `nut` và `oVai` phải đi riêng: nút thao tác
 * đổi chữ trên mình, ô Vai trò chỉ đổi nền — gán đè chữ lên ô Vai trò là xoá
 * mất huy hiệu bên trong nó.
 */
function dongHet(bo) {
  bo.oViec.innerHTML = '';
  for (const n of bo.nut) n.textContent = n.dataset.chuDong;
  for (const dat of bo.oVai || []) dat(false);
}

/** Cùng một chỗ đứng, cùng luật "mỗi lúc một thứ" của `moBangViec()`. */
function moBangVaiTro(bo, t, dat, veNoiDung) {
  const tieu = document.createElement('div');
  tieu.style.cssText = 'padding:12px 0 0;font-size:13px;color:#2a2622';
  tieu.append(document.createTextNode('Vai trò của '));

  const ai = document.createElement('span');
  ai.textContent = t.email || '(không rõ email)';
  ai.style.cssText = 'font-weight:600;word-break:break-all';
  tieu.append(ai, document.createTextNode(' ở từng gia phả'));

  moOChung(bo, 'vai:' + t.userId, dat, tieu, veNoiDung);
}

/**
 * Mở một ô bảng thành một khung ở chỗ đứng chung dưới bảng.
 *
 * ⚠ **MỘT CHỖ ĐỨNG, MỖI LÚC MỘT THỨ.** `moBangViec()` · `moBangVaiTro()` và
 *   ô *Người được gắn* đều đổ vào `bo.oViec`, nên mở cái này là đóng cái kia.
 *   Đó là chủ ý, không phải tiết kiệm mã: hai bảng cùng mở là hai ô nhập mã
 *   người nằm cạnh nhau không nói rõ ô nào của ai.
 *
 * @param {object} bo         `{oViec, dangMo, nut, oVai}`
 * @param {string} khoa       khoá nhận diện thứ đang mở, ví dụ `gan:<userId>`
 * @param {Function} dat      `dat(true|false)` — tô nền chỗ vừa bấm
 * @param {HTMLElement} tieu  dòng tiêu đề của khung
 */
function moOChung(bo, khoa, dat, tieu, veNoiDung) {
  const dangMoCaiNay = bo.dangMo === khoa;

  dongHet(bo);

  if (dangMoCaiNay) {
    bo.dangMo = null;
    return;
  }

  bo.dangMo = khoa;
  dat(true);

  const hop = document.createElement('div');
  hop.style.cssText =
    'margin-top:14px;padding:0 14px 14px;border:1px solid #e6e0d8;' +
    'border-radius:10px;background:#faf8f5';

  hop.append(tieu, veNoiDung());
  bo.oViec.append(hop);

  // `nearest` chứ không phải `start`: cuộn vừa đủ để thấy, không hất cái bảng
  // ra khỏi màn hình.
  hop.scrollIntoView({ block: 'nearest' });
}

// ============================================================
// Ô "NGƯỜI ĐƯỢC GẮN" — bấm được ở CẢ HAI tấm lọc (b111b)
// ============================================================
//
// ⚠ VÌ SAO CỘT NÀY PHẢI BẤM ĐƯỢC, chứ không để yên như một ô chữ:
//
// Gắn mã người là việc người quản trị làm nhiều nhất sau khi duyệt một tài
// khoản, và tới b111b nó chỉ có đúng MỘT đường vào — nút *Sửa quyền* ở cột
// cuối cùng. Cột cuối là cột đầu tiên rơi khỏi mép màn hình khi màn hình hẹp
// (bài học b106 và b109), nên trên điện thoại việc hay làm nhất nằm ở chỗ khó
// tới nhất. Ô này là đường thứ hai, và nó nằm ngay trên chính dữ liệu nó sửa.
//
// ⚠ **KHÔNG mở cả bảng năm việc.** Nó mở đúng một hàng — *Mã người trong sơ
//   đồ*. Bấm vào cột A mà ra bảng làm được cả năm chuyện là mời người ta đổi
//   vai trong lúc họ đang định gắn mã người.
//
// ⚠ Khoá thì **mờ sẵn kèm lý do**, không mở ra rồi mới giải thích — luật chủ
//   dự án chốt 08/09/2026. Và ba lý do khoá phải TRÙNG với ba lý do
//   `gan_nguoi_cho_thanh_vien()` từ chối (`18` mục 4), không được rộng hơn hay
//   hẹp hơn: rộng hơn là khoá tay người có quyền, hẹp hơn là mời người ta bấm
//   một thứ chắc chắn bị từ chối.

/**
 * Ô bảng **Người được gắn**: mã người + tên, hoặc chữ *"chưa gắn"*.
 *
 * @param {object} t  cần `maNguoi`, `tenNguoi`
 * @param {{css:string, khoa:boolean, lyDo:string}} opt
 * @returns {{td:HTMLElement, nut:HTMLElement|null, dat:Function|null}}
 *          `nut`/`dat` là `null` khi ô bị khoá — nơi gọi kiểm `dat` để biết
 *          có phải gắn bộ nghe hay không.
 */
export function veONguoiGan(t, opt) {
  const td = o('', 'padding:0');

  // Trường trống thì KHÔNG vẽ chữ thay thế kiểu "Không rõ" — `CLAUDE.md` mục
  // 7. Ở đây *"chưa gắn"* là một trạng thái hợp lệ và có thật, nên nó được nói
  // ra; nhưng TÊN người thì chỉ hiện khi có.
  const ruot = () => {
    const d = document.createDocumentFragment();
    if (t.maNguoi) {
      const ma = document.createElement('span');
      ma.textContent = t.maNguoi;
      ma.style.cssText =
        'font-family:ui-monospace,monospace;font-size:12px;color:#5b4533';
      d.append(ma);
      if (t.tenNguoi && t.tenNguoi !== t.maNguoi) {
        const ten = document.createElement('div');
        ten.textContent = t.tenNguoi;
        ten.style.cssText = 'font-size:12px;color:#6a625a';
        d.append(ten);
      }
    } else {
      const c = document.createElement('span');
      c.textContent = 'chưa gắn';
      c.style.cssText = 'color:#8a8078;font-style:italic';
      d.append(c);
    }
    return d;
  };

  if (opt.khoa) {
    const d = document.createElement('div');
    d.style.cssText = opt.css + ';color:#2a2622';
    d.append(ruot());
    // `title` là lớp thứ HAI, không phải chỗ duy nhất nói ra lý do — điện
    // thoại không có chuột. Lý do chính đã nằm ở huy hiệu cột đầu và ở câu
    // nhắc đầu khu.
    if (opt.lyDo) d.title = opt.lyDo;
    td.append(d);
    return { td, nut: null, dat: null };
  }

  // ⚠ Một `<button>` THẬT, không phải `<div>` gắn `onclick` — nó phải đi được
  //   bằng phím Tab và bấm được bằng Enter. Cùng lý do đã ghi ở ô *Tài khoản*
  //   của `khu-tai-khoan-he-thong.js`.
  const b = document.createElement('button');
  b.type = 'button';
  b.style.cssText =
    'display:block;width:100%;border:0;background:none;font:inherit;' +
    'color:inherit;text-align:left;cursor:pointer;border-radius:8px;' + opt.css;
  b.append(ruot());
  td.append(b);

  const dat = (dangMo) => {
    b.style.background = dangMo ? '#f2ece2' : 'none';
    b.style.boxShadow = dangMo ? 'inset 0 0 0 1px #c9c0b4' : 'none';
  };

  return { td, nut: b, dat };
}

/** Dòng tiêu đề của khung gắn mã người — nói rõ CỦA AI và Ở CÂY NÀO. */
export function tieuDeGan(t, cay) {
  const tieu = document.createElement('div');
  tieu.style.cssText = 'padding:12px 0 0;font-size:13px;color:#2a2622';
  tieu.append(document.createTextNode('Mã người của '));

  const ai = document.createElement('span');
  ai.textContent = t.email || '(không rõ email)';
  ai.style.cssText = 'font-weight:600;word-break:break-all';
  tieu.append(ai);

  if (cay && (cay.ten || cay.maCay)) {
    tieu.append(document.createTextNode(' — trong '));
    const c = document.createElement('span');
    c.textContent = cumCay(cay);
    c.style.fontWeight = '600';
    tieu.append(c);
  }
  return tieu;
}

/**
 * Khung mở ra khi bấm ô *Người được gắn*: **đúng một việc**, không phải cả năm.
 *
 * Dùng lại nguyên `viecGanNguoi()` — không đẻ ra bản thứ hai của cùng một
 * việc. Hai bản thì có ngày lệch nhau, và bản lệch sẽ là bản ít người bấm hơn.
 */
export function bangGanNguoi(t, cay, duocDoiQuyen, napLai) {
  const hop = document.createElement('div');
  hop.style.cssText =
    'display:flex;flex-direction:column;gap:12px;padding:12px 0 2px;' +
    'border-top:1px solid #ece6dd';

  // Dòng "cây nào" đứng TRƯỚC mọi thứ khác — cùng lý do như `veBangViec()`:
  // một tài khoản có chân ở nhiều cây, và mã người là khái niệm theo TỪNG cây.
  hop.append(dongCay(cay));
  hop.append(viecGanNguoi(t, cay, duocDoiQuyen, napLai));
  return hop;
}

// ============================================================
// Bảng VAI TRÒ THEO TỪNG CÂY — dùng chung cho cả hai tấm lọc
// ============================================================

/**
 * Một bảng hai cột: **một bên gia phả, một bên vai trò ở gia phả ấy**. Bấm
 * tiếp vào ô vai trò là mở đúng bảng sửa quyền của cây ấy, ngay dưới bảng.
 *
 * ⚠ VÌ SAO NÓ Ở FILE NÀY, không phải ở `khu-tai-khoan-he-thong.js` — nơi câu
 *   hỏi *"một người đứng ở đâu trong từng cây"* vốn thuộc về. File kia
 *   `import` file này (để dùng lại năm việc của `13`), nên chiều ngược lại chỉ
 *   đi được bằng `import()` ĐỘNG. Bắt một cú bấm chờ tải cả mô-đun sổ đăng ký
 *   để vẽ một bảng hai cột là đắt vô cớ, và với người KHÔNG phải Quản trị hệ
 *   thống thì đó còn là tải đúng cái mô-đun họ không có cửa dùng. Đặt ở đây
 *   thì cả hai bên `import` tĩnh theo đúng chiều đã có.
 *
 * ⚠ HAI NGƯỜI GỌI, HAI NGUỒN DỮ LIỆU — và khác nhau vì HÀNG RÀO MÁY CHỦ, chứ
 *   không phải vì tiện:
 *     · Quản trị hệ thống → `dsCayCuaTaiKhoan()`, trả MỌI cây.
 *     · Chủ cây / quản trị gia phả → đúng MỘT dòng, dựng từ dữ liệu đã có sẵn
 *       trong tay về cây đang mở, không gọi máy chủ thêm lần nào.
 *   Không phải bản rút gọn cho gọn: `ds_cay_cua_tai_khoan()` có
 *   `where public.la_quan_tri_he_thong()` ngay trong thân (`14` mục 9, `15`
 *   mục 5b) — chủ cây A gọi nó sẽ nhận về mảng RỖNG, vì họ không có quyền biết
 *   người kia còn chân ở cây B nào. Gọi rồi vẽ ra "chưa dính cây nào" là bịa
 *   một câu trả lời từ một lời từ chối.
 *
 * @param {object} t     tài khoản — cần `userId`, `email`, `maNgan`, `laChinhToi`
 * @param {object} opt   `{docCaSo, cayNay, duocDoiQuyen, napLai}`
 */
export function veBangVaiTroTungCay(t, opt) {
  const hop = document.createElement('div');
  hop.style.cssText = 'padding:12px 0 2px;border-top:1px solid #ece6dd';

  const than = document.createElement('div');
  than.textContent = 'Đang đọc…';
  than.style.cssText = 'color:#8a8078;font-size:12px';
  hop.append(than);

  const ve = (ds) => {
    than.innerHTML = '';
    than.style.cssText = '';

    if (!ds.length) {
      const d = document.createElement('div');
      d.textContent = 'Tài khoản này chưa dính tới gia phả nào.';
      d.style.cssText = 'font-size:12px;color:#8a8078';
      than.append(d);
      return;
    }

    const oSau = document.createElement('div');
    const bo = { oSau, dangMo: null, nut: [] };
    than.append(veBangHaiCot(ds, t, opt, bo), oSau);

    // Nói ra CHỈ KHI nó đúng: người không phải Quản trị hệ thống đang nhìn
    // đúng một cây, và họ phải biết đó không phải cả câu trả lời.
    if (!opt.docCaSo) {
      const n = document.createElement('div');
      n.textContent =
        'Chỉ có gia phả đang mở. Vai trò của tài khoản này ở những gia phả ' +
        'khác thuộc về chủ các cây ấy — chỉ Quản trị hệ thống xem được cả sổ.';
      n.style.cssText =
        'margin-top:8px;font-size:12px;color:#8a8078;line-height:1.5;max-width:640px';
      than.append(n);
    }
  };

  if (opt.docCaSo) {
    dsCayCuaTaiKhoan(t.userId).then((kq) => {
      if (!kq.ok) {
        than.innerHTML = '';
        than.style.cssText = '';
        than.append(veLoi(kq.loi || 'Không đọc được danh sách gia phả.', opt.napLai));
        return;
      }
      ve(kq.ds || []);
    });
  } else {
    ve(opt.cayNay ? [opt.cayNay] : []);
  }

  return hop;
}

function veBangHaiCot(ds, t, opt, bo) {
  const khung = document.createElement('div');
  khung.style.cssText = 'overflow-x:auto;-webkit-overflow-scrolling:touch';
  capChieuCao(khung, ds.length);

  const bang = document.createElement('table');
  // `max-width` chứ không `min-width`: hai cột mà kéo hết bề ngang khu thì cột
  // Vai trò trôi tít sang phải, cách tên cây cả gang tay — mắt phải bắc cầu
  // qua khoảng trống để ghép đúng hàng.
  bang.style.cssText =
    'width:100%;max-width:560px;border-collapse:collapse;font-size:13px;' +
    'background:#fffdf9;border:1px solid #e6e0d8;border-radius:10px';

  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  tr.style.cssText = 'border-bottom:1px solid #e6e0d8';
  for (const [chu, phu] of [['Gia phả', ''], ['Vai trò', 'bấm để sửa']]) {
    const th = document.createElement('th');
    th.style.cssText =
      'padding:8px 10px;text-align:left;font-weight:600;color:#6a625a;' +
      'font-size:12px;white-space:nowrap;' + CSS_DAU_BANG;
    th.append(document.createTextNode(chu));
    if (phu) {
      const d = document.createElement('div');
      d.textContent = phu;
      d.style.cssText = 'font-weight:400;font-size:11px;color:#8a8078';
      th.append(d);
    }
    tr.append(th);
  }
  thead.append(tr);
  bang.append(thead);

  const ruot = document.createElement('tbody');
  for (const c of ds) veDongVaiTro(ruot, c, t, opt, bo);
  bang.append(ruot);

  khung.append(bang);
  return khung;
}

function veDongVaiTro(ruot, c, t, opt, bo) {
  const tr = document.createElement('tr');
  tr.style.cssText = 'border-bottom:1px solid #f2eee8;vertical-align:top';

  // BA trạng thái, phân biệt bằng `moiLuc` chứ KHÔNG bằng người mời: `moi_boi`
  // khai `on delete set null`, nên xoá tài khoản người mời sẽ biến một lời mời
  // thành thứ trông y hệt đơn xin vào (`14` mục 1).
  const trangThai = c.daDuyet ? 'thanhvien' : (c.moiLuc ? 'duocmoi' : 'donxin');
  // Người được mời mang vai `xem` ở cột `role` cho tới lúc nhận — đó là cả
  // điểm của cột `moi_vai`. Hiện đúng vai họ SẼ nhận, đừng hiện `xem`.
  const vaiHien = trangThai === 'duocmoi' ? (c.moiVai || c.vai) : c.vai;

  const oCay = o('', 'padding:9px 10px;color:#2a2622');
  const ten = document.createElement('div');
  ten.textContent = c.ten || '(không tên)';
  ten.style.fontWeight = '600';
  oCay.append(ten);
  if (c.maCay) {
    const m = document.createElement('div');
    m.textContent = c.maCay;
    m.style.cssText = 'font-family:ui-monospace,monospace;font-size:11px;color:#5b4533';
    oCay.append(m);
  }

  const noiDung = () => {
    const d = document.createDocumentFragment();
    const v = document.createElement('span');
    v.textContent = vaiTroBangChu(vaiHien) || vaiHien || '—';
    d.append(v);
    if (c.laChuCay) d.append(huyHieu('Chủ gia phả', true));
    if (trangThai === 'duocmoi') d.append(huyHieu('Chờ họ bấm Nhận', false));
    else if (trangThai === 'donxin') d.append(huyHieu(c.nhanCho || 'Đơn chờ duyệt', false));
    return d;
  };

  const oVai = o('', 'padding:0');

  // ⚠ Lời mời KHÔNG bấm được, và đó là luật chứ không phải thiếu sót: sửa
  //   quyền hộ một lời mời chưa nhận là bỏ mất chữ ký thứ hai — đúng thứ `14`
  //   dựng cả cột `moi_vai` riêng để giữ.
  const khoa = trangThai === 'duocmoi' || t.laChinhToi || !opt.duocDoiQuyen;

  if (khoa) {
    const d = document.createElement('div');
    d.style.cssText = 'padding:9px 10px;white-space:nowrap';
    d.append(noiDung());
    if (t.laChinhToi) d.title = 'Tài khoản của chính bạn — không ai đặt quyền cho chính mình được.';
    oVai.append(d);
    tr.append(oCay, oVai);
    ruot.append(tr);
    return;
  }

  const b = document.createElement('button');
  b.type = 'button';
  b.style.cssText =
    'display:block;width:100%;padding:9px 10px;border:0;background:none;' +
    'font:inherit;color:inherit;text-align:left;cursor:pointer;' +
    'border-radius:8px;white-space:nowrap';
  b.append(noiDung());
  oVai.append(b);

  tr.append(oCay, oVai);
  ruot.append(tr);

  const dat = (dangMo) => {
    b.style.background = dangMo ? '#f2ece2' : 'none';
    b.style.boxShadow = dangMo ? 'inset 0 0 0 1px #c9c0b4' : 'none';
  };
  bo.nut.push(dat);

  // Hình dạng `t` mà năm việc của `13` chờ: quyền gắn vào TÀI KHOẢN, còn vai
  // và mã người thì theo TỪNG CÂY. Ghép hai nguồn ấy lại đúng ở đây.
  const tGhep = {
    userId: t.userId,
    email: t.email,
    maNgan: t.maNgan,
    laChinhToi: t.laChinhToi,
    vai: c.vai,
    daDuyet: c.daDuyet,
    maNguoi: c.maNguoi,
    tenNguoi: c.tenNguoi,
    tinCay: c.tinCay,
    laChuCay: c.laChuCay,
  };

  // `c` đã mang sẵn `treeId` · `ten` · `maCay` — đúng hình dạng `cay` mà năm
  // việc chờ. Không dựng lại, chỉ cắt đúng ba trường để nơi nhận không lỡ tay
  // đọc thêm thứ gì của dòng này.
  const cay = { treeId: c.treeId, ten: c.ten || '', maCay: c.maCay || '' };

  b.addEventListener('click', () => moSuaVai(bo, c, dat, () => (c.daDuyet
    ? veBangViec(tGhep, cay, opt.duocDoiQuyen, opt.napLai)
    : veXetDon(tGhep, cay, opt.duocDoiQuyen, opt.napLai))));
}

/** Cùng luật "một chỗ đứng chung, mỗi lúc một dòng" của `moBangViec()`. */
function moSuaVai(bo, c, dat, veNoiDung) {
  const dangMoDongNay = bo.dangMo === c.treeId;

  bo.oSau.innerHTML = '';
  for (const d of bo.nut) d(false);

  if (dangMoDongNay) {
    bo.dangMo = null;
    return;
  }

  bo.dangMo = c.treeId;
  dat(true);

  const hop = document.createElement('div');
  hop.style.cssText =
    'margin-top:12px;padding:0 12px 12px;border:1px solid #e6e0d8;' +
    'border-radius:9px;background:#fffdf9';

  const tieu = document.createElement('div');
  tieu.textContent = (c.daDuyet ? 'Sửa quyền trong ' : 'Xét đơn vào ') +
    nhanCay({ ten: c.ten, maCay: c.maCay });
  tieu.style.cssText = 'padding:10px 0 0;font-size:13px;color:#2a2622;font-weight:600';

  hop.append(tieu, veNoiDung());
  bo.oSau.append(hop);

  hop.scrollIntoView({ block: 'nearest' });
}

// ============================================================
// Bảng việc của một tài khoản ĐÃ DUYỆT — năm việc, đều hai nhịp
// ============================================================

/**
 * Năm việc đổi quyền của một tài khoản **trong đúng một cây**.
 *
 * ⚠ THAM SỐ THỨ HAI LÀ MỘT ĐỐI TƯỢNG, KHÔNG PHẢI MỘT CHUỖI `treeId` — đổi ở
 *   b110b, và đổi có chủ ý. Chừng nào nó còn là `treeId` trần thì mọi nơi gọi
 *   đều đứng trước cùng một cám dỗ: truyền cây đang mở rồi để màn hình tự bịa
 *   một cái nhãn. Bản 0.7.0 bịa đúng như thế (*"Gia phả đang mở"*). Đổi hình
 *   dạng tham số thì **lời gọi thiếu tên cây không viết ra được nữa**.
 *
 * @param {object} t    tài khoản — `userId`, `email`, `vai`, `maNguoi`…
 * @param {{treeId:string, ten:string, maCay:string}} cay  cây bị tác động
 * @param {boolean} duocDoiQuyen  máy chủ trả lời `co_the_quan_tri()`
 * @param {Function} napLai
 */
export function veBangViec(t, cay, duocDoiQuyen, napLai) {
  const hop = document.createElement('div');
  hop.style.cssText =
    'display:flex;flex-direction:column;gap:12px;padding:12px 0 2px;' +
    'border-top:1px solid #ece6dd';

  // ⚠ Dòng "cây nào" đứng TRƯỚC mọi thứ khác, kể cả trước câu giải thích vì
  //   sao nút mờ. Năm việc dưới đây đều chỉ đụng đúng cây này, và một tài
  //   khoản có chân ở nhiều cây — đọc nhầm dòng là đổi quyền nhầm chỗ.
  hop.append(dongCay(cay));

  // Vì sao nút mờ — nói MỘT lần ở đầu bảng việc, thay vì nhắc lại năm lần.
  const vuong = lyDoVuong(t, duocDoiQuyen);
  if (vuong) hop.append(dongNhac(vuong));

  hop.append(viecDoiVai(t, cay, duocDoiQuyen, napLai));
  hop.append(viecGanNguoi(t, cay, duocDoiQuyen, napLai));
  hop.append(viecTinCay(t, cay, duocDoiQuyen, napLai));
  hop.append(viecGo(t, cay, duocDoiQuyen, napLai));
  hop.append(viecBanGiao(t, cay, duocDoiQuyen, napLai));
  return hop;
}

/**
 * Một câu giải thích vì sao dòng này bị khoá tay. Ba lý do, và chúng không
 * loại trừ nhau — chọn lý do NẶNG NHẤT để nói, vì nói cả ba thì người đọc
 * phải tự xếp hạng.
 */
function lyDoVuong(t, duocDoiQuyen) {
  if (!duocDoiQuyen) {
    return 'Bạn không đổi được quyền trong gia phả này — việc ấy thuộc chủ gia phả ' +
           'và Quản trị hệ thống.';
  }
  if (t.laChinhToi) {
    return 'Đây là dòng của chính bạn. Không ai đặt quyền cho chính mình được — ' +
           'luật này không có ngoại lệ, kể cả Quản trị hệ thống, và nó gác cả ' +
           'việc tự gắn mã người lẫn việc tự bật ghi thẳng. Nhờ một quản trị khác làm.';
  }
  if (t.vai === 'sao_luu') {
    return 'Đây là tài khoản sao lưu tự động. Đổi vai hay gỡ nó là bản sao lưu ' +
           'đêm ra file rỗng mà không báo lỗi.';
  }
  return '';
}

/** Đổi vai — trần là `quan_tri`, và chủ cây thì không hạ vai được. */
export function viecDoiVai(t, cay, duocDoiQuyen, napLai) {
  const treeId = cay.treeId;
  const khoa = !duocDoiQuyen || t.laChinhToi || t.laChuCay || t.vai === 'sao_luu';

  const chon = document.createElement('select');
  chon.style.cssText =
    'padding:6px 9px;border:1px solid #dcd5cb;border-radius:7px;background:#fff;' +
    'font:inherit;font-size:13px;min-width:190px';
  for (const v of VAI_CAP_DUOC) {
    const m = document.createElement('option');
    m.value = v;
    m.textContent = vaiTroBangChu(v);
    chon.append(m);
  }
  chon.value = VAI_CAP_DUOC.includes(t.vai) ? t.vai : 'xem';
  chon.disabled = khoa;

  const bao = dongBao();
  const b = nutHaiNhip('Đổi vai', 'Bấm lần nữa để đổi vai', khoa, async () => {
    const kq = await doiVaiThanhVien(treeId, t.userId, chon.value);
    return xong(kq, bao, napLai, 'Không đổi được vai trò.');
  });

  // ⚠ Câu nào cũng gọi TÊN CÂY. Vai trò ở app này không phải thuộc tính của
  //   tài khoản — cùng một người có thể là Quản trị gia phả cây A và Khách ở
  //   cây B. Viết "vai trò của người này" trống không là nói sai chuyện ấy.
  const ghi = (t.laChuCay && duocDoiQuyen && !t.laChinhToi
    ? 'Chủ gia phả không hạ vai được. Muốn đổi chủ thì dùng Bàn giao gia phả bên dưới.'
    : 'Quyền cao nhất cấp được cho tài khoản khác là Quản trị gia phả.')
    + ' Vai này chỉ có hiệu lực trong ' + cumCay(cay) +
      ', không đụng tới cây nào khác.';

  // ⚠ NHÃN KHÔNG LẶP LẠI TÊN CÂY, câu giải thích thì có. Bảng việc đã có
  //   `dongCay()` đứng đầu và tiêu đề khung cũng gọi tên cây; nhắc lần thứ ba
  //   ngay trên nhãn là làm loãng đúng cái nó định nhấn. Ba việc *lùi lại
  //   được* dùng nhãn ngắn; hai việc **Gỡ** và **Bàn giao** thì giữ tên cây
  //   trong cả nhãn lẫn chữ trên nút — chúng không lùi lại được.
  return hangViec('Vai trò', [chon, b], ghi, bao);
}

/** Gắn / đổi / gỡ mã người. Để trống là GỠ, và đó là lựa chọn hợp lệ. */
export function viecGanNguoi(t, cay, duocDoiQuyen, napLai) {
  const treeId = cay.treeId;
  const khoa = !duocDoiQuyen || t.laChinhToi;

  const oNhap = document.createElement('input');
  oNhap.type = 'text';
  oNhap.value = t.maNguoi || '';
  oNhap.placeholder = 'gõ tên hoặc mã — để trống là gỡ gắn';
  oNhap.disabled = khoa;
  oNhap.autocomplete = 'off';
  oNhap.style.cssText =
    'padding:6px 9px;border:1px solid #dcd5cb;border-radius:7px;background:#fff;' +
    'font:inherit;font-size:13px;font-family:ui-monospace,monospace;min-width:190px';

  // ⚠ Ô GỢI Ý QUAN TRỌNG NHẤT TRONG BA Ô, vì hậu quả gõ nhầm ở đây nặng nhất:
  //   mã người quyết `pham_vi_sua()`, nên gắn nhầm là mở quyền sửa cho cả một
  //   nhánh — và máy chủ KHÔNG kiểm mã có thật hay không, gõ sai thì gắn treo
  //   mà không báo lỗi. Dòng gợi ý nói sẵn người ấy đã gắn cho ai chưa.
  //
  //   Không gỡ bộ nghe ở đây: hàng việc này sống cùng bảng, và mỗi lần
  //   `napLai()` là cả khu vẽ lại từ đầu nên `oNhap` bị vứt cùng lúc. Khác
  //   `veFormMoi()` — chỗ ấy đóng/mở form nhiều lần trên cùng một trang.
  if (!khoa) {
    ganGoiY(oNhap, {
      tim: async (chuoi) => (await timNguoiTrongCay(treeId, chuoi)).ds,
      ve: dongNguoi,
      giaTri: (m) => m.maNguoi,
    });
  }

  const bao = dongBao();
  const b = nutHaiNhip('Lưu mã người', 'Bấm lần nữa để lưu', khoa, async () => {
    const kq = await ganNguoiChoThanhVien(treeId, t.userId, oNhap.value);
    return xong(kq, bao, napLai, 'Không gắn được mã người.');
  });

  return hangViec('Mã người trong sơ đồ', [oNhap, b],
    'Mã này quyết định người ấy sửa được những ai TRONG ' + cumCay(cay) +
    ': bản thân, tổ tiên đường thẳng, toàn bộ con cháu, cộng vợ/chồng. ' +
    'Để trống thì chỉ xem. Một mã chỉ gắn cho MỘT tài khoản.', bao);
}

/** Bật / tắt **tin cậy** — cửa leo thang sắc nhất, nên nói thẳng nó làm gì. */
export function viecTinCay(t, cay, duocDoiQuyen, napLai) {
  const treeId = cay.treeId;
  const khoa = !duocDoiQuyen || t.laChinhToi;
  const bat = !t.tinCay;

  const bao = dongBao();
  const b = nutHaiNhip(
    bat ? 'Bật tin cậy' : 'Tắt tin cậy',
    'Bấm lần nữa để ' + (bat ? 'bật' : 'tắt'),
    khoa,
    async () => {
      const kq = await datTinCayThanhVien(treeId, t.userId, bat);
      return xong(kq, bao, napLai, 'Không đổi được chế độ tin cậy.');
    });

  return hangViec('Tin cậy', [b],
    'Đang ' + (t.tinCay ? 'BẬT' : 'TẮT') + '. Bật là cho người này ghi thẳng ' +
    'vào ' + cumCay(cay) + ': mỗi lần họ bấm Lưu là thành chính thức ' +
    'ngay, không qua hàng chờ kiểm duyệt. Cây khác không đổi theo.',
    bao);
}

/** Gỡ khỏi gia phả — chỉ xoá dòng trong cây, không xoá tài khoản. */
export function viecGo(t, cay, duocDoiQuyen, napLai) {
  const treeId = cay.treeId;
  const khoa = !duocDoiQuyen || t.laChinhToi || t.laChuCay || t.vai === 'sao_luu';

  const bao = dongBao();
  const b = nutHaiNhip('Gỡ khỏi ' + nhanCay(cay), 'Bấm lần nữa để gỡ', khoa,
    async () => {
      const kq = await goThanhVien(treeId, t.userId);
      return xong(kq, bao, napLai, 'Không gỡ được tài khoản.');
    }, true);

  return hangViec('Gỡ khỏi ' + cumCay(cay), [b],
    'Gỡ xong người này đọc 0 dòng của ' + cumCay(cay) + '. Tài khoản ' +
    'của họ vẫn còn, vẫn đăng nhập được, vẫn xin vào lại được, và chân của họ ' +
    'ở những gia phả KHÁC không suy suyển.', bao);
}

/**
 * Bàn giao gia phả. Việc **không có nút hoàn tác** — sau khi giao, người vừa
 * giao không giao ngược lại được; chỉ chủ mới (hoặc Quản trị hệ thống) làm
 * được. Nên câu cảnh báo phải đứng TRƯỚC nhịp thứ hai, không đứng sau.
 */
export function viecBanGiao(t, cay, duocDoiQuyen, napLai) {
  const treeId = cay.treeId;
  const khoa = !duocDoiQuyen || t.laChinhToi || t.laChuCay || t.vai === 'sao_luu';

  const bao = dongBao();
  const b = nutHaiNhip('Bàn giao ' + nhanCay(cay) + ' cho tài khoản này',
    'Bấm lần nữa để bàn giao — không hoàn tác được', khoa, async () => {
      const kq = await doiChuCay(treeId, t.userId);
      return xong(kq, bao, napLai, 'Không bàn giao được gia phả.');
    }, true);

  return hangViec('Bàn giao ' + cumCay(cay), [b],
    'Người này thành chủ ' + cumCay(cay) + ' và nhận toàn bộ quyền ' +
    'đổi quyền TRONG cây ấy. Bạn ở lại làm Quản trị gia phả — vẫn sửa và duyệt ' +
    'nội dung, nhưng thôi đổi được quyền của ai. Không có đường quay lại từ ' +
    'phía bạn. Những gia phả khác bạn đang làm chủ không đổi gì.', bao);
}

// ============================================================
// Xét đơn của một tài khoản ĐANG CHỜ
// ============================================================

/**
 * Duyệt đơn thuộc nhóm **đổi quyền**, không thuộc "duyệt nội dung": nhận một
 * người vào cây là cấp quyền ĐỌC. Nên nó gác bằng đúng `coTheQuanTri()` như
 * năm việc trên, chứ không bằng `coTheKiemDuyet()`.
 */
export function veXetDon(t, cay, duocDoiQuyen, napLai) {
  const treeId = cay.treeId;
  const hop = document.createElement('div');
  hop.style.cssText =
    'display:flex;flex-direction:column;gap:12px;padding:12px 0 2px;' +
    'border-top:1px solid #ece6dd';

  // Duyệt một lá đơn là CẤP QUYỀN ĐỌC cho đúng một cây. Nói tên cây ấy ra
  // trước, cùng lý do như `veBangViec()`.
  hop.append(dongCay(cay));

  if (t.loiNhan) {
    const ln = document.createElement('div');
    ln.textContent = '“' + t.loiNhan + '”';
    ln.style.cssText =
      'font-size:13px;line-height:1.55;color:#2a2622;padding:9px 11px;' +
      'background:#fffdf9;border:1px solid #ece6dd;border-radius:8px';
    hop.append(ln);
  }

  if (!duocDoiQuyen) {
    hop.append(dongNhac(
      'Bạn không duyệt được đơn xin vào gia phả — nhận một người vào cây là ' +
      'cấp quyền đọc, việc ấy thuộc chủ gia phả và Quản trị hệ thống.'));
  }

  const oNhap = document.createElement('input');
  oNhap.type = 'text';
  oNhap.placeholder = 'P0012 — để trống thì người này chỉ xem';
  oNhap.disabled = !duocDoiQuyen;
  oNhap.style.cssText =
    'padding:6px 9px;border:1px solid #dcd5cb;border-radius:7px;background:#fff;' +
    'font:inherit;font-size:13px;font-family:ui-monospace,monospace;min-width:220px';

  const bao = dongBao();

  const bDuyet = nutHaiNhip('Duyệt', 'Bấm lần nữa để duyệt', !duocDoiQuyen,
    async () => {
      const kq = await duyetThanhVien(treeId, t.email, oNhap.value.trim());
      return xong(kq, bao, napLai, 'Không duyệt được đơn.');
    });

  const bTuChoi = nutHaiNhip('Từ chối', 'Bấm lần nữa để từ chối', !duocDoiQuyen,
    async () => {
      const kq = await tuChoiThanhVien(treeId, t.email);
      return xong(kq, bao, napLai, 'Không từ chối được đơn.');
    }, true);

  hop.append(hangViec('Mã người trong sơ đồ', [oNhap],
    'Duyệt mà không gắn mã thì người ấy vào xem được nhưng không sửa được gì ' +
    '— để trống là một lựa chọn hợp lệ, không phải thiếu sót.', null));
  hop.append(hangViec('Quyết định — cho vào ' + cumCay(cay),
    [bDuyet, bTuChoi],
    'Duyệt là cấp quyền ĐỌC ' + cumCay(cay) + ', và chỉ cây ấy. ' +
    'Từ chối là XOÁ đơn, không phải đánh dấu. Người ấy nộp lại được.', bao));
  return hop;
}

// ============================================================
// GỌI TÊN CÂY — ba mẩu nhỏ, một luật
// ============================================================
//
// ⚠ **Luật b110b, chủ dự án chốt 09/09/2026:** không màn hình nào được ngầm
//   định "cây đang hoạt động". Mọi chỗ gán quyền phải nói rõ *người nào · cây
//   nào · quyền gì*. Ngoại lệ duy nhất là cờ **Quản trị hệ thống** và cờ
//   **Quyền dựng gia phả** — hai cờ ấy ở tầng TÀI KHOẢN, không thuộc cây nào,
//   nên hỏi "cây nào" ở đó là một câu hỏi không có câu trả lời. Cả hai nằm ở
//   `khu-tai-khoan-he-thong.js`.

/**
 * Cắt từ một `phien` ra đúng ba trường mô tả cây đang mở.
 *
 * ⚠ Trả một đối tượng chứ không trả `phien` nguyên: nơi nhận chỉ được biết
 *   cây nào, không được thò tay vào `phien.vaiTro` để tự dựng phân quyền
 *   trong trình duyệt (`THIET-KE-QUAN-TRI.md` mục 7 điều 5).
 */
// ============================================================
// b111c — ĐƠN ĐỀ XUẤT GẮN MÃ NGƯỜI (`luoc-do/21-de-xuat-gan-nguoi.sql`)
// ============================================================
//
// ⚠⚠ KHỐI NÀY KHÔNG MỞ KHOÁ LUẬT "KHÔNG AI ĐẶT QUYỀN CHO CHÍNH MÌNH".
//
// Đọc khối *"HAI NHỊP, VÀ VÌ SAO MỜ SẴN NÚT TRÊN DÒNG CỦA CHÍNH MÌNH"* ở đầu
// file trước. Luật ấy giữ nguyên từng chữ: `viecGanNguoi()` vẫn khoá, năm cửa
// của `13` vẫn từ chối, `gan_nguoi_cho_thanh_vien()` của `18` vẫn là hàng rào.
//
// Nhưng luật ấy để lại một người **không có đường nào** nói ra câu *"tôi chính
// là người này trong sơ đồ"* — kể cả Quản trị hệ thống, kể cả chủ cây. Trước
// b111c dòng của họ **khoá câm**: một cái nút xám kèm `title` giải thích vì sao
// không bấm được, và hết. Nay nó là **khoá kèm một nút Đề xuất**, và cái nút ấy
// đi đường hai chữ ký như mọi việc khác trong app này: người nộp ký một, một
// quản trị KHÁC ký hai.
//
// ⚠ `duyetDeXuatGan()` là **cửa thứ TÁM** của luật ấy, và nó nằm ở MÁY CHỦ.
//   Chỗ này làm mờ nút Duyệt trên đơn của chính mình chỉ để không mời người ta
//   bấm một thứ chắc chắn bị từ chối — `THIET-KE-QUAN-TRI.md` mục 5 câu cuối.
//   `do-b111c.mjs` phép KC1 đo bằng cách GỠ hàng rào máy chủ ra: gỡ cả hai lớp
//   thì tự duyệt chạy được và `person_id` bị ghi thật. Cửa ấy có thật, và nó
//   không nằm ở file này.
//
// ⚠ AI VÀO ĐƯỢC KHU NÀY: `ds_thanh_vien()` gác bằng `co_the_kiem_duyet()`, nên
//   **thành viên thường không mở được khu này** và không có đường nộp đơn ở
//   đây. Đó là đúng đối tượng của b111c — người bị luật khoá tay là người CÓ
//   quyền — nhưng nó cũng nghĩa là một Thành viên thường muốn tự nhận mã người
//   thì vẫn phải nhắn cho quản trị. Việc ấy còn treo, xem `KE-HOACH.md`.

/**
 * Hàng việc **Đề xuất gắn mã người cho chính mình**.
 *
 * ⚠ Hàng này KHÔNG dùng lại `viecGanNguoi()`, và đó là chủ ý chứ không phải
 *   quên: hai việc trông giống nhau (cùng một ô nhập mã người) mà đi hai cửa
 *   máy chủ khác nhau, và hậu quả khác hẳn — một cái gắn NGAY, một cái nộp đơn
 *   rồi chờ. Gộp lại là để một cái nút nói sai việc nó làm.
 *
 * ⚠ Nạp đơn hiện có bằng một vòng máy chủ RIÊNG (`deXuatGanCuaToi`), sau khi
 *   khối đã nằm trên màn hình. Không chờ nó rồi mới vẽ: người bấm nút đang
 *   nhìn một khung vừa mở ra, và một khung trắng chờ mạng thì trông như hỏng.
 */
export function viecDeXuatGan(t, cay, napLai) {
  const treeId = cay.treeId;

  const oNhap = document.createElement('input');
  oNhap.type = 'text';
  oNhap.placeholder = 'gõ tên hoặc mã người — ví dụ P0012';
  oNhap.autocomplete = 'off';
  oNhap.style.cssText =
    'padding:6px 9px;border:1px solid #dcd5cb;border-radius:7px;background:#fff;' +
    'font:inherit;font-size:13px;font-family:ui-monospace,monospace;min-width:190px';

  // Cùng ô gợi ý của `viecGanNguoi()`, cùng lý do: máy chủ lọc, trần 10 dòng,
  // trang này không giữ danh sách người nào trong bộ nhớ (cây thật 681 người).
  ganGoiY(oNhap, {
    tim: async (chuoi) => (await timNguoiTrongCay(treeId, chuoi)).ds,
    ve: dongNguoi,
    giaTri: (m) => m.maNguoi,
  });

  const oLyDo = document.createElement('input');
  oLyDo.type = 'text';
  oLyDo.placeholder = 'vì sao bạn là người này (không bắt buộc)';
  oLyDo.autocomplete = 'off';
  oLyDo.style.cssText =
    'padding:6px 9px;border:1px solid #dcd5cb;border-radius:7px;background:#fff;' +
    'font:inherit;font-size:13px;min-width:260px;flex:1';

  const bao = dongBao();

  // ⚠ Hai nhịp, như mọi việc đụng tới quyền. Nộp đơn thì lùi lại được (có nút
  //   Rút), nhưng nó gửi một việc sang bàn người khác — và một cú bấm lỡ tay
  //   gửi đi thì người kia đã đọc rồi.
  const b = nutHaiNhip('Nộp đề xuất', 'Bấm lần nữa để nộp', false, async () => {
    const kq = await nopDeXuatGan(treeId, oNhap.value, oLyDo.value);
    return xong(kq, bao, napLai, 'Không nộp được đề xuất.');
  });

  const hop = hangViec('Đề xuất mã người cho chính bạn', [oNhap, oLyDo, b],
    'Bạn KHÔNG tự gắn mã người cho mình được — luật này không có ngoại lệ, kể ' +
    'cả Quản trị hệ thống, vì tự trỏ mình vào một cụ tổ là mở quyền sửa ra cả ' +
    'một nhánh. Đường đi là nộp đề xuất ở đây, rồi MỘT QUẢN TRỊ KHÁC xét. ' +
    'Đơn chỉ có hiệu lực trong ' + cumCay(cay) + '.', bao);

  // Đơn đang chờ + lần bị từ chối gần nhất, nạp sau và vẽ vào đúng chỗ này.
  const oDon = document.createElement('div');
  oDon.style.cssText = 'margin-top:10px';
  hop.append(oDon);

  deXuatGanCuaToi(treeId).then((d) => {
    if (d && d.coDon) {
      oDon.append(veDonCuaToi(d, napLai));
      // Máy chủ coi nộp lần hai là SỬA đơn cũ, không đẻ đơn thứ hai — nói
      // thẳng điều đó trên nút, đừng để người ta sợ nộp trùng.
      b.dataset.chuDong = 'Sửa đề xuất';
      b.textContent = 'Sửa đề xuất';
      if (!oNhap.value) oNhap.value = d.maNguoi || '';
      if (!oLyDo.value) oLyDo.value = d.lyDo || '';
    }
    if (d && d.lanTuChoi) oDon.append(veLanTuChoi(d.lanTuChoi));
  });

  return hop;
}

/** Đơn của chính mình đang chờ xét — kèm nút Rút. */
function veDonCuaToi(d, napLai) {
  const hop = document.createElement('div');
  hop.style.cssText =
    'padding:10px 12px;border:1px solid #e0d8cc;border-radius:9px;background:#fffdf9';

  const dong = document.createElement('div');
  dong.style.cssText = 'font-size:13px;color:#2a2622';
  dong.append(document.createTextNode('Đang chờ xét: '));

  const ma = document.createElement('span');
  ma.textContent = d.maNguoi || '';
  ma.style.cssText = 'font-family:ui-monospace,monospace;font-weight:600';
  dong.append(ma);

  if (d.tenNguoi && d.tenNguoi !== d.maNguoi) {
    dong.append(document.createTextNode(' — ' + d.tenNguoi));
  }
  hop.append(dong);

  if (d.taoLuc) {
    const g = document.createElement('div');
    g.textContent = 'Nộp lúc ' + gioVietNam(d.taoLuc);
    g.style.cssText = 'margin-top:3px;font-size:12px;color:#8a8078';
    hop.append(g);
  }

  const bao = dongBao();
  const b = nutHaiNhip('Rút đơn', 'Bấm lần nữa để rút', false, async () => {
    const kq = await rutDeXuatGan(d.id);
    return xong(kq, bao, napLai, 'Không rút được đơn.');
  });

  const hang = document.createElement('div');
  hang.style.cssText = 'margin-top:8px';
  hang.append(b);
  hop.append(hang, bao);
  return hop;
}

/**
 * Lần bị từ chối gần nhất, **kèm lý do người xét đã ghi**.
 *
 * ⚠ Đây là nửa thứ hai của việc bắt buộc ghi lý do ở máy chủ (`21` mục 7, đo:
 *   Q14a). Máy chủ giữ câu trả lời mà màn hình không đọc ra thì luật ấy chỉ
 *   làm khó người xét chứ chẳng giúp ai: người nộp thấy đơn biến mất, không
 *   biết vì sao, và nộp lại y nguyên.
 */
function veLanTuChoi(l) {
  const hop = document.createElement('div');
  hop.style.cssText =
    'margin-top:8px;padding:9px 12px;border:1px solid #e6cfc6;border-radius:9px;' +
    'background:#fdf6f3';

  const d = document.createElement('div');
  d.style.cssText = 'font-size:12px;color:#8a3a2a;line-height:1.5';
  d.textContent = 'Lần trước bị từ chối'
    + (l.maNguoi ? ' (xin mã ' + l.maNguoi + ')' : '')
    + (l.xetLuc ? ' lúc ' + gioVietNam(l.xetLuc) : '') + ': ' + (l.loiXet || '');
  hop.append(d);
  return hop;
}

/**
 * Khung mở ra khi bấm nút **Đề xuất mã người** ở dòng của chính mình: đúng
 * MỘT việc, không phải cả năm — chép nếp `bangGanNguoi()` của b111b.
 */
export function bangDeXuatCuaToi(t, cay, napLai) {
  const hop = document.createElement('div');
  hop.style.cssText =
    'display:flex;flex-direction:column;gap:12px;padding:12px 0 2px;' +
    'border-top:1px solid #ece6dd';
  hop.append(dongCay(cay));
  hop.append(viecDeXuatGan(t, cay, napLai));
  return hop;
}

/**
 * Khối **duyệt đơn** của cây đang xét. Trả `null` khi không có đơn nào — một
 * khung rỗng mang tiêu đề *"Đơn đề xuất"* nói sai một câu: rằng đây là chỗ
 * thường có việc phải làm.
 *
 * ⚠ HỎI THEO `cay` NGƯỜI DÙNG ĐANG XÉT, không theo `phien.treeId` — luật 5a
 *   của `THIET-KE-QUAN-TRI.md`, và ô chọn cây của b111b là chỗ nó tới từ.
 */
export async function veKhoiDeXuatGan(cay, duocDoiQuyen, napLai) {
  const ds = await dsDeXuatGan(cay.treeId);
  if (!ds.length) return null;

  const hop = document.createElement('div');
  hop.style.cssText =
    'margin-top:18px;padding:0 14px 14px;border:1px solid #e6e0d8;' +
    'border-radius:10px;background:#faf8f5';

  const tieu = document.createElement('div');
  tieu.style.cssText = 'padding:13px 0 2px;font-size:13px;font-weight:600;color:#2a2622';
  tieu.textContent = 'Đơn đề xuất gắn mã người — ' + cumCay(cay)
    + ' (' + ds.length + ')';
  hop.append(tieu);

  const dan = document.createElement('div');
  dan.style.cssText = 'font-size:12px;color:#8a8078;line-height:1.5;max-width:720px';
  dan.textContent =
    'Mỗi đơn là một người tự nhận mình là ai trong sơ đồ. Duyệt là gắn mã ấy ' +
    'cho tài khoản họ, tức mở quyền sửa bản thân, tổ tiên đường thẳng và toàn ' +
    'bộ con cháu của người ấy. Đơn của chính bạn thì bạn không xét được — luật ' +
    'hai chữ ký, và máy chủ gác chứ không phải màn hình.';
  hop.append(dan);

  for (const d of ds) hop.append(veMotDon(d, duocDoiQuyen, napLai));
  return hop;
}

/** Một đơn: ai · tự nhận là ai · lý do · và hai (hoặc ba) cái nút. */
function veMotDon(d, duocDoiQuyen, napLai) {
  const hop = document.createElement('div');
  hop.style.cssText =
    'margin-top:10px;padding:11px 12px;border:1px solid #e0d8cc;' +
    'border-radius:9px;background:#fffdf9';

  const ai = document.createElement('div');
  ai.style.cssText = 'font-size:13px;color:#2a2622';
  const em = document.createElement('span');
  em.textContent = d.email || '(không rõ email)';
  em.style.cssText = 'font-weight:600;word-break:break-all';
  ai.append(em);
  if (d.maNgan) {
    const m = document.createElement('span');
    m.textContent = ' · ' + d.maNgan;
    m.style.cssText = 'font-family:ui-monospace,monospace;font-size:12px;color:#5b4533';
    ai.append(m);
  }
  if (d.laCuaToi) ai.append(huyHieu('Đơn của bạn', false));
  hop.append(ai);

  const nhan = document.createElement('div');
  nhan.style.cssText = 'margin-top:4px;font-size:13px;color:#2a2622';
  nhan.append(document.createTextNode('Tự nhận là '));
  const ma = document.createElement('span');
  ma.textContent = d.maNguoi || '';
  ma.style.cssText = 'font-family:ui-monospace,monospace;font-weight:600';
  nhan.append(ma);
  if (d.tenNguoi && d.tenNguoi !== d.maNguoi) {
    nhan.append(document.createTextNode(' — ' + d.tenNguoi));
  }
  hop.append(nhan);

  // Trường trống thì KHÔNG vẽ hàng đó (`CLAUDE.md` mục 7).
  if (d.lyDo) {
    const l = document.createElement('div');
    l.textContent = '“' + d.lyDo + '”';
    l.style.cssText =
      'margin-top:4px;font-size:12px;color:#6a625a;line-height:1.5;max-width:720px';
    hop.append(l);
  }

  if (d.taoLuc) {
    const g = document.createElement('div');
    g.textContent = 'Nộp lúc ' + gioVietNam(d.taoLuc);
    g.style.cssText = 'margin-top:3px;font-size:12px;color:#8a8078';
    hop.append(g);
  }

  // ⚠ NÓI TRƯỚC KHI AI BẤM: mã này đang gắn cho người khác thì máy chủ sẽ từ
  //   chối ở `gan_nguoi_cho_thanh_vien()` (một mã chỉ gắn cho MỘT tài khoản,
  //   đo: Q18). Để người xét bấm rồi mới đọc câu từ chối là bắt họ đoán xem
  //   mình vừa làm sai gì.
  if (d.maDangCo) {
    const c = document.createElement('div');
    c.textContent = 'Mã này hiện đang gắn cho ' + d.maDangCo
      + '. Duyệt sẽ bị máy chủ từ chối — gỡ mã ở tài khoản kia trước, hoặc từ '
      + 'chối đơn này kèm lý do.';
    c.style.cssText =
      'margin-top:6px;padding:7px 9px;border-radius:7px;background:#fdf6f3;' +
      'font-size:12px;color:#8a3a2a;line-height:1.5;max-width:720px';
    hop.append(c);
  }

  const bao = dongBao();

  // ⚠ KHOÁ SẴN KÈM LÝ DO, không mở ra rồi mới giải thích (chủ dự án,
  //   08/09/2026). Hai lý do khoá, và chúng khác hẳn nhau:
  //     · `laCuaToi` — **cửa thứ TÁM**, và đây là cả điểm của b111c;
  //     · `!duocDoiQuyen` — quản trị gia phả xem được đơn (máy chủ cho đọc) mà
  //       không xét được, vì xét đơn này là đổi quyền.
  const khoa = d.laCuaToi || !duocDoiQuyen;

  const bDuyet = nutHaiNhip('Duyệt', 'Bấm lần nữa để duyệt', khoa, async () => {
    const kq = await duyetDeXuatGan(d.id);
    return xong(kq, bao, napLai, 'Không duyệt được đơn này.');
  });
  if (khoa) {
    bDuyet.title = d.laCuaToi
      ? 'Đơn của chính bạn — người nộp không ký luôn chữ thứ hai. Nhờ một quản '
        + 'trị khác xét, hoặc rút đơn.'
      : 'Bạn xem được đơn này nhưng không xét được — việc ấy thuộc chủ gia phả '
        + 'và Quản trị hệ thống.';
  }

  const oLyDo = document.createElement('input');
  oLyDo.type = 'text';
  oLyDo.placeholder = 'lý do từ chối — bắt buộc';
  oLyDo.autocomplete = 'off';
  oLyDo.disabled = khoa;
  oLyDo.style.cssText =
    'padding:6px 9px;border:1px solid #dcd5cb;border-radius:7px;background:#fff;' +
    'font:inherit;font-size:13px;min-width:220px;flex:1';

  const bTuChoi = nutHaiNhip('Từ chối', 'Bấm lần nữa để từ chối', khoa, async () => {
    const kq = await tuChoiDeXuatGan(d.id, oLyDo.value);
    return xong(kq, bao, napLai, 'Không từ chối được đơn này.');
  }, true);

  const hang = document.createElement('div');
  hang.style.cssText =
    'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:9px';
  hang.append(bDuyet, oLyDo, bTuChoi);

  // Người nộp KHÔNG xét được đơn mình, nhưng vẫn rút được — và đó là đường
  // duy nhất họ tự đóng được đơn của mình.
  if (d.laCuaToi) {
    const bRut = nutHaiNhip('Rút đơn', 'Bấm lần nữa để rút', false, async () => {
      const kq = await rutDeXuatGan(d.id);
      return xong(kq, bao, napLai, 'Không rút được đơn.');
    });
    hang.append(bRut);
  }

  hop.append(hang, bao);
  return hop;
}

export function cayCuaPhien(phien) {
  return {
    treeId: (phien && phien.treeId) || null,
    ten: (phien && phien.tenCay) || '',
    maCay: (phien && phien.maCay) || '',
  };
}

/**
 * Tên cây để in ra: `Nguyễn Trọng Bắc · NTBK7R3`.
 *
 * ⚠ Thiếu tên thì rơi về MÃ cây, thiếu cả hai mới đành nói *"(gia phả không
 *   tên)"*. Trường trống không vẽ chữ thay thế — `CLAUDE.md` mục 7 — nhưng ở
 *   đây câu chữ ôm lấy nó (*"trong gia phả …"*) nên bỏ trắng là để lại một
 *   câu cụt. Mã cây luôn có thật, nên ca cuối gần như không xảy ra.
 */
export function nhanCay(cay) {
  if (!cay) return '(gia phả không tên)';
  const phan = [];
  if (cay.ten) phan.push(cay.ten);
  if (cay.maCay) phan.push(cay.maCay);
  return phan.length ? phan.join(' · ') : '(gia phả không tên)';
}

/**
 * Cụm *"gia phả X"* — nhưng KHÔNG thêm chữ ấy khi tên cây đã tự mang nó.
 *
 * ⚠ Không phải chuyện chải chuốt. Tên thật của cây đầu tiên trên máy chủ là
 *   *"Gia phả họ Nguyễn Trọng Bắc"*, nên câu ghép thẳng đọc ra thành *"gỡ
 *   khỏi gia phả Gia phả họ Nguyễn Trọng Bắc"*. Ảnh chụp b110b bắt được đúng
 *   chỗ ấy, sáu lần trong một bảng việc.
 */
export function cumCay(cay) {
  const nhan = nhanCay(cay);
  return /^gia\s*phả/i.test(nhan) ? nhan : 'gia phả ' + nhan;
}

/**
 * Dòng **cây nào** đứng đầu mỗi bảng việc. Nền đậm hơn `dongNhac()` một chút
 * vì nó không phải một lời nhắc — nó là chỗ neo của mọi nút bên dưới.
 */
export function dongCay(cay) {
  const d = document.createElement('div');
  d.style.cssText =
    'padding:9px 11px;border:1px solid #d8cfc0;border-radius:8px;' +
    'background:#f3ece2;color:#2a2622;font-size:12px;line-height:1.5';

  const nhan = document.createElement('span');
  nhan.textContent = 'Gia phả bị tác động: ';
  nhan.style.color = '#6a625a';

  const ten = document.createElement('span');
  ten.textContent = nhanCay(cay);
  ten.style.fontWeight = '600';

  d.append(nhan, ten);
  return d;
}

// ============================================================
// Mấy mẩu dùng chung
// ============================================================

/**
 * Một việc: nhãn · mấy thứ để bấm · một câu giải thích · chỗ báo kết quả.
 *
 * Câu giải thích KHÔNG phải trang trí. Cả năm việc ở đây đều đổi thứ người
 * dùng không nhìn thấy hậu quả ngay — quyền đọc, phạm vi sửa, đường đi qua
 * kiểm duyệt — nên chỗ duy nhất nói ra hậu quả là dòng chữ này.
 */
export function hangViec(nhanChu, dsPhanTu, giaiThich, bao) {
  const hop = document.createElement('div');

  const nhan = document.createElement('div');
  nhan.textContent = nhanChu;
  nhan.style.cssText = 'font-size:12px;font-weight:600;color:#6a625a;margin-bottom:5px';
  hop.append(nhan);

  const hang = document.createElement('div');
  hang.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center';
  for (const p of dsPhanTu) hang.append(p);
  hop.append(hang);

  if (giaiThich) {
    const g = document.createElement('div');
    g.textContent = giaiThich;
    g.style.cssText =
      'margin-top:5px;font-size:12px;line-height:1.5;color:#8a8078;max-width:720px';
    hop.append(g);
  }
  if (bao) hop.append(bao);
  return hop;
}

/**
 * Nút hai nhịp: bấm lần đầu đổi chữ và đổi màu, bấm lần nữa mới chạy.
 *
 * ⚠ **Không `confirm()`**, và không phải vì sở thích: trên điện thoại hộp
 *   thoại ấy hiện ra ở một chỗ chẳng liên quan gì tới nút vừa bấm. App này
 *   không dùng nó ở đâu cả.
 *
 * ⚠ Nhịp một tự huỷ sau 6 giây. Một cái nút đứng ở trạng thái *"bấm lần nữa"*
 *   vô thời hạn là cái bẫy: người ta cuộn đi, quay lại, bấm một cái tưởng là
 *   nhịp đầu — và việc chạy luôn.
 */
export function nutHaiNhip(chuDau, chuHoi, khoa, chay, nguyHiem) {
  const b = nut(chuDau, false);
  if (nguyHiem) b.style.color = '#8a3a2a';
  b.disabled = !!khoa;
  if (khoa) {
    b.style.opacity = '0.45';
    b.style.cursor = 'not-allowed';
  }

  let daHoi = false;
  let hen = 0;

  const veDauLai = () => {
    daHoi = false;
    b.textContent = chuDau;
    b.style.borderColor = '#dcd5cb';
    b.style.fontWeight = '400';
    if (hen) { clearTimeout(hen); hen = 0; }
  };

  b.addEventListener('click', async () => {
    if (b.disabled) return;
    if (!daHoi) {
      daHoi = true;
      b.textContent = chuHoi;
      b.style.borderColor = '#c98f80';
      b.style.fontWeight = '600';
      hen = setTimeout(veDauLai, 6000);
      return;
    }
    if (hen) { clearTimeout(hen); hen = 0; }
    b.disabled = true;
    b.textContent = 'Đang chạy…';
    const xongRoi = await chay();
    if (xongRoi) return;          // đã gọi napLai — cả bảng vẽ lại, nút này đi theo
    b.disabled = false;
    veDauLai();
  });

  return b;
}

/**
 * Xử lý một câu trả lời của máy chủ.
 *
 * ⚠ **Máy chủ từ chối thì in NGUYÊN VĂN câu của nó**, đừng chế câu khác: chỉ
 *   máy chủ mới biết đây là "chủ gia phả không hạ vai được" hay "mã ấy đã gắn
 *   cho tài khoản khác rồi". Cùng luật đã ghi ở `tuChoiThayDoi()` trong `sb.js`.
 *
 * @returns {boolean} `true` khi đã gọi `napLai()` — nơi gọi thôi động vào nút.
 */
export function xong(kq, bao, napLai, cauMacDinh) {
  if (kq && kq.ok) { napLai(); return true; }
  bao.textContent = (kq && kq.loi) || cauMacDinh;
  bao.style.color = '#a83220';
  return false;
}

export function dongBao() {
  const d = document.createElement('div');
  d.style.cssText = 'margin-top:6px;font-size:12px;line-height:1.45;min-height:0';
  return d;
}

export function dongNhac(chu) {
  const d = document.createElement('div');
  d.textContent = chu;
  d.style.cssText =
    'padding:9px 11px;border:1px solid #e2d5bf;border-radius:8px;' +
    'background:#faf6ee;color:#7a5a28;font-size:12px;line-height:1.5';
  return d;
}

export function o(chu, css) {
  const td = document.createElement('td');
  if (chu) td.textContent = chu;
  td.style.cssText = css;
  return td;
}

export function huyHieu(chu, dam) {
  const s = document.createElement('span');
  s.textContent = chu;
  // ⚠ `inline-block`, KHÔNG `inline`. Một `span` inline có `padding` mà bị
  //   xuống dòng thì nền của nó tràn lên đè chữ ở dòng trên — không phải lỗi
  //   trình duyệt, đó là cách hộp inline vỡ qua hai dòng. Ảnh chụp b109b bắt
  //   được: huy hiệu *Quản trị hệ thống* đè lên đúng địa chỉ email bên cạnh,
  //   và chỉ lộ ra khi ô hẹp lại đủ để huy hiệu phải xuống dòng.
  s.style.cssText =
    'display:inline-block;margin-left:7px;font-size:11px;font-weight:500;' +
    'padding:2px 7px;border-radius:10px;' +
    'white-space:nowrap;' +
    (dam ? 'background:#2a2622;color:#fffdf9'
         : 'background:#f3ece1;color:#7a5a28;border:1px solid #e2d5bf');
  return s;
}

export function nut(chu, dam) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = chu;
  b.style.cssText =
    'padding:6px 12px;border-radius:6px;font:inherit;font-size:12px;cursor:pointer;' +
    // `nowrap`: cột thao tác hẹp, và không có dòng này thì *Sửa quyền* gãy
    // thành hai dòng — ảnh chụp 1280px của b106 bắt đúng chỗ ấy.
    'touch-action:manipulation;white-space:nowrap;' +
    (dam ? 'border:1px solid #2a2622;background:#2a2622;color:#fffdf9'
         : 'border:1px solid #dcd5cb;background:#fffdf9;color:#2a2622');
  return b;
}

export function veLoi(chu, thuLai) {
  const hop = document.createElement('div');
  hop.style.cssText =
    'padding:14px 16px;border:1px solid #f1c0b9;background:#fdf2f0;' +
    'border-radius:9px;color:#8a3a2a';

  const p = document.createElement('div');
  p.textContent = chu;

  const b = nut('Thử lại', false);
  b.style.cssText += ';margin-top:8px';
  b.addEventListener('click', thuLai);

  hop.append(p, b);
  return hop;
}

/** `dd/mm/yyyy HH:mm` — khuôn thời gian duy nhất của dự án. */
export function gioVietNam(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const hai = (n) => String(n).padStart(2, '0');
  return hai(d.getDate()) + '/' + hai(d.getMonth() + 1) + '/' + d.getFullYear() +
         ' ' + hai(d.getHours()) + ':' + hai(d.getMinutes());
}
