// ============================================================
// giapha-supabase · kiem-thu/kiem-trang-quan-tri.mjs
// Vai trò  : Kiểm TRANG QUẢN TRỊ — `QuanTri.html`, `js/app-quan-tri.js`,
//            `js/pages/quan-tri/khung.js` · `khu-kiem-duyet.js` ·
//            `khu-thanh-vien.js` · `khu-tai-khoan-he-thong.js` ·
//            `khu-tai-khoan.js` · `khu-quan-tri-he-thong.js` ·
//            `trang-tai-khoan.js`, và những cửa của chúng trong
//            `js/services/sb.js` (b98 + b101 + b106 + b109 + b117 + b118).
// Chạy     : cd supabase/kiem-thu && node kiem-trang-quan-tri.mjs
// Phiên bản: 0.11.1 · Cập nhật: 18/09/2026 (b122b) — vá phép `layPhien()`
//            đứng đỏ từ b118c vì khớp cứng danh sách cột
//            0.11.0 Trang Quản trị nay dựng từ NGUYÊN FILE quantri3, không còn
//            `#khu-tam`: mọi khu và trang chi tiết vẽ vào section của nó. Chín
//            phép bám hình dạng cũ được đính chính theo đúng ĐIỀU phép canh
//            (ô nhập vào hộp hỏi · đếm từ dòng vừa đọc · nút Quay lại ở khung ·
//            so sánh với cây đang mở không phải chọn cây). PHẦN O mới gác mã
//            b118d. Hai file mã cũ và `QuanTri_cu.html` đã xoá (chủ dự án đồng
//            ý 16/09/2026): phép gác MÀN HÌNH của PHẦN H · I · J · K · M và G9 ·
//            G11–G13 · G15 · G16 · G19 trỏ sang file đang làm việc ấy; phép gác
//            SQL / sb.js giữ nguyên.
//            0.10.0 Trang Quản trị nay là HTML + CSS NGUYÊN VĂN của prototype
//            quantri3. Tám phép bám chỗ cũ được đính chính, không bỏ phép nào:
//            @media thanh trái (850px của quantri3) · thùng rác dời sang
//            JS_QTHT · chip Tạo gia phả (không tự lọc quyền) · hai dòng TRANG
//            có thêm `view:` · `.layout` gập · G6 bẻ `qt-canh-bao`.
//            0.9.0 Sổ tài khoản dời từ chip *Toàn hệ thống* của khu Tài
//            khoản sang khu RIÊNG *Quản trị hệ thống* (`khu-quan-tri-he-thong.js`,
//            khu thứ tư — thay chỗ khu `sao-luu` chưa từng viết). Đính chính
//            PHẦN I (ba phép nạp động) và trang chi tiết một tài khoản
//            (TRANG đổi khu cha) theo đúng chỗ mới.
//            0.8.0 PHẦN M — khu Tài khoản của tôi + trang chi tiết một tài
//            khoản; phép "sb-gia.mjs có đủ mọi tên trang Quản trị nhập từ
//            sb.js" (chỗ đã làm trắng cả bộ ảnh HAI lần). Đính chính bốn phép
//            trỏ vào phần KHU đã gỡ khỏi `khu-thanh-vien.js`: tấm lọc cây ·
//            chip Toàn hệ thống · nạp động · con số đơn chờ — xem từng chỗ.
//            0.7.1 Đính chính hai phép PHẦN L đã lỗi thời (đòi trang cây chỉ
//            nạp đúng MỘT cửa `sb.js`) — b116 điền ba mục thật + Vòng đời,
//            hợp lệ đụng nhiều cửa hơn. Thu hẹp lại đúng luật 5a: không đọc
//            `phien.treeId` để chọn cây. Không đổi số phép (256 → 256).
//            0.7.0 PHẦN L — lớp trang chi tiết: `trang-chi-tiet.js` ·
//            `trang-cay.js`, đăng ký trong `TRANG` của khung, luật 5a (tìm
//            cây theo mã trong địa chỉ), CSS gập thanh mục con. G20 · G21.
//            0.6.0 PHẦN K — lỗ hổng HAI CHỮ KÝ chủ dự án báo 10/09/2026:
//            bốn cửa của `13`/`08` ghi được vào một dòng lời mời chưa ai
//            nhận. Gác cả hai lớp của `18-hai-chu-ky.sql`, cộng phần màn
//            hình thôi vẽ nút *Xét đơn* lên dòng lời mời. G17 · G18 bẻ
//            hai phép quan trọng nhất.
//            0.5.0 PHẦN J mới — hai việc của b110b: cờ QUYỀN DỰNG GIA PHẢ
//            (`17-quyen-tao-cay.sql`, cửa thứ bảy) và luật **không chỗ nào
//            đổi quyền mà không gọi tên cây**. G14 · G15 · G16 bẻ ba phép
//            quan trọng nhất của phần ấy.
//            0.4.0 (b109) PHẦN I mới — tấm lọc *Toàn hệ thống*: bốn cửa của
//            `14-loi-moi.sql`, ranh giới "không nạp cây", và phép canh việc
//            CHÉP năm việc của `13` sang bản thứ hai. G12 · G13 bẻ hai phép ấy.
//            0.3.0 (b106) PHẦN H mới — khu Tài khoản & quyền; PHẦN E đổi
//            chiều lần thứ hai (khối Đơn chờ duyệt nay PHẢI đi).
// ============================================================
//
// ═══ BÀI KIỂM NÀY CHỨNG MINH ĐƯỢC GÌ, VÀ KHÔNG CHỨNG MINH ĐƯỢC GÌ ═══
//
// ⚠ **Không mở trình duyệt và không chạy SQL.** Nó đọc văn bản file. Nên nó
//   KHÔNG chứng minh được: bảng vẽ ra trông thế nào, bấm Duyệt có chạy không,
//   hay hoàn tác trả lại đúng dữ liệu. Ba điều ấy chỉ người bấm thử trên máy
//   chủ thật mới nói được — đúng như b94 đã làm cho phân quyền.
//
// Cái nó gác là **sáu chỗ hỏng câm**, tức hỏng mà không có câu lỗi nào:
//
//   1. **Tên tham số RPC lệch chữ ký SQL.** Gõ `p_trangthai` thay vì
//      `p_trang_thai` thì Supabase trả lỗi *"function not found"* mà `sb.js`
//      nuốt gọn thành mảng rỗng — màn hình hiện "Không có gì đang chờ duyệt",
//      y hệt lúc hàng chờ trống thật. Đây là chỗ nguy hiểm nhất của cả b98,
//      nên PHẦN D đối chiếu từng tên với chính file SQL.
//   2. **Tên file sai chữ hoa.** GitHub Pages phân biệt hoa với thường; nút
//      trỏ tới `quantri.html` ra trang 404, mà trên máy Windows thì mở vẫn
//      được — tức lỗi chỉ lộ ra sau khi đã đẩy lên mạng.
//   3. **Thứ tự hai thẻ `<script>`.** Bản UMD đặt `window.supabase`; module
//      chạy trước nó thì `services/sb.js` thấy `undefined` và app im lặng
//      không mở được, kèm một câu lỗi không nói gì về nguyên nhân.
//   4. **Trang mới gọi thẳng máy chủ**, phá luật một cửa của `CLAUDE.md`
//      mục 5.
//   5. **Lấy `vaiTro` phía trình duyệt làm hàng rào** thay vì hỏi máy chủ.
//   6. **Điểm khởi động kéo theo cả bộ vẽ sơ đồ** về máy người chỉ định đọc
//      một cái bảng.
//   7. **Tên class trong JS lệch tên class trong CSS** (b101). Khung vẽ ra
//      vẫn đủ chữ nhưng bố cục vỡ — không có lỗi nào, và trên máy người
//      viết mã thì nó thường vẫn *trông* tạm được. PHẦN F đối chiếu từng
//      class `qt-` trong `khung.js` với `quan-tri.css`.
//   8. **Hai bộ mã cho hai bề ngang màn hình** (b101). Hỏi `innerWidth`
//      trong JS rồi vẽ khác đi thì hôm nay đúng, và lệch dần từ lần sửa
//      thứ hai trở đi — vì hai chỗ ấy không ai bắt phải sửa cùng nhau.
//
// ⚠ Nguyên tắc giữ từ b94 và b97: **đừng hỏi đúng chữ, hãy hỏi đúng điều.**
//   PHẦN G ở cuối bẻ gãy chính mã này rồi kiểm lại — một phép "đạt" trên mã
//   hỏng là một phép vô dụng.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const DAY = dirname(fileURLToPath(import.meta.url));
const doc = (p) => readFileSync(resolve(DAY, p), 'utf8');

const HTML = doc('../QuanTri.html');
const CSS = doc('../quan-tri.css');
const JS_APP = doc('../js/app-quan-tri.js');
const JS_QT = doc('../js/pages/quan-tri/khu-kiem-duyet.js');
const JS_KH = doc('../js/pages/quan-tri/khung.js');
const JS_SB = doc('../js/services/sb.js');
const JS_ST = doc('../js/pages/settings.js');
// Đường vào trang Quản trị chuyển từ Cài đặt sang màn hình sơ đồ (b103).
const JS_TV = doc('../js/pages/tree-view.js');
const JS_GP = doc('../js/pages/quan-tri/khu-gia-pha.js');
// b117 — khu 2 · b118d — vẽ vào section `#tai-khoan` của quantri3.
const JS_KTK = doc('../js/pages/quan-tri/khu-tai-khoan.js');
const JS_TTK = doc('../js/pages/quan-tri/trang-tai-khoan.js');
// b118 — khu 4 (Quản trị hệ thống) · b118d — sổ tài khoản nằm ngay trong khu.
const JS_QTHT = doc('../js/pages/quan-tri/khu-quan-tri-he-thong.js');
// Đọc sớm ở đây (PHẦN L đọc lại): PHẦN H cần nó trước khi tới PHẦN L.
const JS_TC_SOM = doc('../js/pages/quan-tri/trang-cay.js');
// b118d — mọi ô nhập đổi quyền mở trong hộp hỏi của quantri3.
const JS_HOP = doc('../js/pages/quan-tri/hop-thoai.js');
const SQL_08 = boGhiChu(doc('../luoc-do/08-kiem-duyet.sql'));
const SQL_13 = boGhiChu(doc('../luoc-do/13-quan-ly-thanh-vien.sql'));
const SQL_14 = boGhiChu(doc('../luoc-do/14-loi-moi.sql'));
const SQL_16 = boGhiChu(doc('../luoc-do/16-thung-rac-cay.sql'));
const SQL_17 = boGhiChu(doc('../luoc-do/17-quyen-tao-cay.sql'));
const SQL_18 = boGhiChu(doc('../luoc-do/18-hai-chu-ky.sql'));

/** Tên file có thật ở gốc repo, giữ nguyên chữ hoa chữ thường. */
const FILE_GOC = readdirSync(resolve(DAY, '..'));

let dat = 0, hong = 0;

// ============================================================
// PHẦN A — trang QuanTri.html
// ============================================================
console.log('\nPHẦN A — trang QuanTri.html');

kiem('file mang đúng tên QuanTri.html (đúng cả chữ hoa)',
     FILE_GOC.includes('QuanTri.html'),
     'gốc repo có: ' + FILE_GOC.filter((f) => /quantri/i.test(f)).join(', '));

kiem('có thẻ nạp thư viện Supabase trong repo',
     /<script\s+src="js\/vendor\/supabase\.js"><\/script>/.test(HTML),
     'thiếu thẻ vendor');

kiem('thẻ vendor đứng TRƯỚC thẻ module (bẫy 3)',
     thuTuScriptDung(HTML), 'module chạy trước khi window.supabase có mặt');

kiem('điểm khởi động là js/app-quan-tri.js',
     /<script\s+type="module"\s+src="js\/app-quan-tri\.js"><\/script>/.test(HTML),
     'không thấy thẻ module đúng đường dẫn');

kiem('file điểm khởi động ấy có thật',
     existsSync(resolve(DAY, '../js/app-quan-tri.js')), 'thiếu file');

kiem('có meta robots noindex — gia phả không nằm trong kết quả tìm kiếm',
     /name="robots"\s+content="noindex/.test(HTML), 'thiếu thẻ robots');

kiem('có <title>', /<title>[^<]+<\/title>/.test(HTML), 'thiếu title');

// CSS của khung nằm ở FILE RIÊNG chứ không nhúng, để bản giả dùng để nhìn
// bằng mắt (`kiem-thu/trang-quan-tri-gia.html`) nạp đúng một nguồn ấy.
kiem('nạp quan-tri.css — bố cục khung bốn khu',
     // `?v=1.1.2` là CỐ Ý — ép trình duyệt bỏ bản CSS cũ trong bộ nhớ đệm
     // (b122d). Bài kiểm chấp nhận có hay không có phần `?v=`.
     /<link\s+rel="stylesheet"\s+href="quan-tri\.css(\?v=[\w.]+)?">/.test(HTML),
     'thiếu thẻ link tới quan-tri.css');

kiem('file quan-tri.css có thật',
     existsSync(resolve(DAY, '../quan-tri.css')), 'thiếu file');

kiem('có đường về trang chính khi không nạp được mã',
     /href="index\.html"/.test(HTML), 'không có lối về index.html');

// `CLAUDE.md` mục 3: thư viện nằm trong repo, không nạp từ CDN.
kiem('không nạp mã từ máy chủ ngoài',
     !/src="https?:/.test(HTML), 'có thẻ script trỏ ra ngoài');

// ============================================================
// PHẦN B — điểm khởi động
// ============================================================
console.log('\nPHẦN B — js/app-quan-tri.js');

kiem('nạp khung quản trị',
     /from '\.\/pages\/quan-tri\/khung\.js'/.test(JS_APP),
     'không import pages/quan-tri/khung.js');

kiem('vẽ vào #app', /getElementById\('app'\)/.test(JS_APP), 'không tìm #app');

// Cả điểm của việc có HAI điểm khởi động: trang duyệt không kéo theo bộ vẽ.
kiem('KHÔNG kéo theo bộ vẽ sơ đồ (bẫy 6)',
     khongKeoTheoSoDo(JS_APP), 'import tree-view/khoi-dong — kéo cả bộ vẽ về');

// ============================================================
// PHẦN C — khu Kiểm duyệt js/pages/quan-tri/khu-kiem-duyet.js
// ============================================================
console.log('\nPHẦN C — khu Kiểm duyệt js/pages/quan-tri/khu-kiem-duyet.js');

kiem('không chạm window.supabase — luật MỘT CỬA (bẫy 4)',
     motCua(JS_QT), 'gọi thẳng máy chủ, phá luật một cửa của CLAUDE.md mục 5');

kiem('hỏi máy chủ ai được duyệt, không tự suy từ vaiTro (bẫy 5)',
     /coTheKiemDuyet/.test(JS_QT) && !/vaiTro\s*===/.test(JS_QT),
     'lấy vaiTro phía trình duyệt làm hàng rào');

// ⚠ Đính chính b118d: khu này nay đọc MỌI cây người xem kiểm duyệt được
//   (quantri3 *"Tất cả gia phả bạn quản lý"*), nên con số trên ba tab đếm
//   thẳng từ các dòng vừa đọc — `demChoKiemDuyet()` (đếm MỘT cây) thôi dùng ở
//   đây. Cửa chi tiết TRƯỚC/SAU thay chỗ nó trong danh sách.
for (const cua of ['dsKiemDuyet', 'duyetThayDoi', 'tuChoiThayDoi', 'chiTietKiemDuyet']) {
  kiem('gọi cửa ' + cua + '()', new RegExp('\\b' + cua + '\\s*\\(').test(JS_QT),
       'không dùng cửa này');
}

kiem('số trên ba tab đếm từ chính các dòng vừa đọc (không đếm riêng cây đang mở)',
     /\$\(DEM\[tt\]\)\.textContent = String\(theo\[tt\]\.length\)/.test(JS_QT),
     'con số lấy từ nguồn khác bảng — hai thứ có ngày lệch nhau');

// Máy chủ viết sẵn câu tiếng Việt cho cả bốn ca không hoàn tác được
// (`dabisuatiep` · `keotheo` · `khongcoanhchup` · `vuongkhoangoai`). Chỉ nó
// mới biết AI đã sửa tiếp và sửa LÚC NÀO — tự chế câu khác là bỏ mất điều ấy.
// ⚠ Đính chính b118d: lời gọi đi qua `lam` của hộp hỏi, và CHÍNH hộp hỏi in
//   `kq.loi` nguyên văn ngay trong hộp (`hop-thoai.js`) — soi cả hai đầu.
kiem('in thẳng câu giải thích của máy chủ, không tự chế câu khác',
     /lam:\s*\(lyDo\)\s*=>\s*tuChoiThayDoi\(/.test(JS_QT) &&
     /loi\.textContent = kq\.loi/.test(JS_HOP) && /\(ct && ct\.loi\)/.test(JS_QT),
     'không thấy đường đưa câu của máy chủ lên màn hình');

// Duyệt hay gạt đều đổi con số trên tấm lọc, và gạt còn đổi cả dữ liệu mà
// những dòng khác đang nói về. Giữ bảng cũ là để người duyệt quyết định dựa
// trên một bức tranh đã cũ.
// ⚠ Đính chính b118d: hai việc nhận hàm nạp lại làm `sauKhiXong`.
kiem('vẽ lại cả bảng sau mỗi lần bấm',
     (JS_QT.match(/if \(kq\) sauKhiXong\(\)/g) || []).length >= 2 &&
     /hoiDuyet\(d, napLai\)/.test(JS_QT) && /hoiTuChoi\(d, napLai\)/.test(JS_QT),
     'không thấy đủ chỗ nạp lại');

// Nút gạt phải nói ra hậu quả TRƯỚC khi bấm: gạt không phải bỏ qua, nó hoàn
// tác dữ liệu về ảnh chụp trước lần Lưu.
kiem('nút từ chối nói rõ nó HOÀN TÁC dữ liệu',
     /Từ chối và hoàn tác/.test(JS_QT), 'chữ trên nút không nói ra hậu quả');

// App này không dùng confirm() ở đâu cả — trên điện thoại hộp thoại ấy hiện ra
// ở một chỗ chẳng liên quan gì tới nút vừa bấm.
kiem('không dùng confirm() — hỏi lại bằng hai nhịp',
     !/\bconfirm\s*\(/.test(boGhiChuJs(JS_QT)), 'còn dùng confirm()');

// ⚠ Đính chính b118d: ô lý do là ô nhiều dòng TRONG hộp hỏi của quantri3.
kiem('có ô lý do khi gạt — câu ấy lưu vào nhật ký',
     /nhieuDong:\s*true/.test(JS_QT) && /tuChoiThayDoi\([^)]*lyDo\)/.test(JS_QT),
     'gạt mà không gửi lý do lên');

for (const [ten, ma] of [['khu-kiem-duyet.js', JS_QT], ['khung.js', JS_KH],
                         ['app-quan-tri.js', JS_APP]]) {
  kiem(ten + ' có ghi chú đầu file đúng khuôn', ghiChuDauFile(ma), 'thiếu dòng');
}

// ============================================================
// PHẦN D — năm cửa mới trong sb.js, đối chiếu CHỮ KÝ SQL
// ============================================================
console.log('\nPHẦN D — sb.js gọi đúng chữ ký của 08-kiem-duyet.sql (bẫy 1)');

const CUA = [
  { js: 'coTheKiemDuyet',  sql: 'co_the_kiem_duyet' },
  { js: 'dsKiemDuyet',     sql: 'ds_kiem_duyet' },
  { js: 'demChoKiemDuyet', sql: 'dem_cho_kiem_duyet' },
  { js: 'duyetThayDoi',    sql: 'duyet_thay_doi' },
  { js: 'tuChoiThayDoi',   sql: 'tu_choi_thay_doi' },
];

for (const c of CUA) {
  kiem('sb.js xuất hàm ' + c.js + '()',
       new RegExp('export\\s+async\\s+function\\s+' + c.js + '\\b').test(JS_SB),
       'không thấy');

  const lech = lechThamSo(JS_SB, SQL_08, c.sql);
  kiem('  ' + c.sql + '() — tên tham số khớp chữ ký SQL',
       lech !== null && lech.length === 0,
       lech === null ? 'không tìm thấy lời gọi hoặc chữ ký' : lech.join('; '));

  // Đóng sẵn cửa vẫn hơn tin vào một phép kiểm trong thân hàm.
  kiem('  ' + c.sql + '() được cấp cho authenticated',
       coCapQuyen(SQL_08, c.sql), 'thiếu grant execute … to authenticated');
}

// `sb.js` là file DUY NHẤT được chạm `window.supabase` — nên phép trên chỉ có
// nghĩa nếu năm hàm ấy thật sự đi qua `layKhach()`, không dựng máy khách riêng.
kiem('năm cửa mới đều đi qua layKhach() chung',
     (JS_SB.match(/const k = layKhach\(\);/g) || []).length >= 5 + 10,
     'có hàm tự dựng máy khách riêng');

// ============================================================
// PHẦN E — đường vào trang, từ màn hình Cài đặt
// ============================================================
console.log('\nPHẦN E — đường vào trang (settings.js)');

// ⚠ PHẦN NÀY ĐỔI CHIỀU 08/09/2026 (b103). Tới b102 nó canh *"Cài đặt có nút
//   mở trang Duyệt nội dung"*; nay khối ấy đã DỜI hẳn sang khu 3 của trang
//   Quản trị, nên phép cũ canh một thứ cố ý không còn.
//
//   Nhưng KHÔNG bỏ phần này đi. Dời một khối đi mà quên đường vào mới thì
//   người dùng mất hẳn chức năng, và không có gì báo lỗi — đúng kiểu hỏng câm
//   mà cả bộ kiểm này sinh ra để bắt. Nên phép mới hỏi ba câu:
//   khối cũ đã đi chưa · đường vào mới có thật không · tên file đúng chữ hoa
//   chưa (bẫy 2 vẫn nguyên giá trị, chỉ đổi chỗ đứng).

kiem('Cài đặt KHÔNG còn khối Duyệt nội dung (đã dời sang khu 3)',
     !/veKhoiKiemDuyet/.test(JS_ST), 'khối cũ còn nằm lại — nay có hai đường vào');

// ⚠ PHẦN NÀY ĐỔI CHIỀU LẦN THỨ HAI, cùng ngày 14/09/2026 (b113). Khối Gia phả
//   từng bị gỡ ở b103 (08/09) rồi phép ở đây canh *"đã gỡ chưa"* — đúng một
//   phiên sau, chủ dự án xác nhận khối này CẦN CÓ (lối tắt đổi cây, đứng CẠNH
//   khu 1 chứ không thay thế). Nên chiều đúng từ nay là NGƯỢC LẠI: khối phải
//   CÒN. Phép cũ (canh *"đã gỡ"*) từng bị AGY 12/09 lách qua bằng cách đổi tên
//   hàm (`veKhoiGiaPha` → `veKhoiChonGiaPha`) mà không ai biết — bài học giữ
//   lại bằng cách canh CẢ tên hàm LẪN chữ trên nút, không chỉ một trong hai.
kiem('Cài đặt CÒN khối Gia phả — lối tắt đổi cây, cạnh khu 1 (b113)',
     /function veKhoiChonGiaPha/.test(JS_ST) && /'Chọn gia phả khác'/.test(JS_ST) &&
     /veKhoiChonGiaPha\(hop\)/.test(JS_ST),
     'khối bị gỡ, hoặc còn hàm mà quên gọi trong openSettings()');

// ⚠ PHÉP NÀY ĐỔI CHIỀU LẦN THỨ HAI 08/09/2026 (b106). Tới b105 nó canh *"khối
//   Đơn chờ duyệt PHẢI CÒN"* — gỡ trước khi có chỗ nhận là cắt đứt đường duyệt
//   đơn. Nay khu 2 đã viết xong, nên chiều đúng là ngược lại: còn lại thì có
//   HAI đường duyệt đơn, và hai đường thì có ngày lệch nhau.
kiem('  và khối Đơn chờ duyệt đã dời sang khu 2 (b106)',
     !/veKhoiChoDuyet/.test(JS_ST),
     'khối cũ còn nằm lại — nay có hai đường duyệt đơn');

// Gỡ một khối mà quên gỡ hàm nó gọi thì `import` treo lại một cái tên không ai
// dùng; không hỏng gì, nhưng lần sau đọc file sẽ tưởng khối ấy còn.
kiem('  Cài đặt thôi import ba cửa duyệt đơn của sb.js',
     !/\bdsChoDuyet\b/.test(JS_ST) && !/\bduyetThanhVien\b/.test(JS_ST) &&
     !/\btuChoiThanhVien\b/.test(JS_ST),
     'còn import hàm của khối đã gỡ');

kiem('đường vào trang Quản trị đúng tên file có thật, đúng cả chữ hoa (bẫy 2)',
     tenFileTrongMaCoThat(JS_TV, FILE_GOC) || tenFileTrongMaCoThat(JS_ST, FILE_GOC),
     'không mã nào trỏ tới một tên file có thật ở gốc repo');

// ============================================================
// PHẦN F — khung điều hướng bốn khu (b101)
// ============================================================
console.log('\nPHẦN F — khung js/pages/quan-tri/khung.js');

// Khung không phải hàng rào (hàng rào ở Postgres), nhưng nó vẫn phải theo
// luật một cửa: mọi lời gọi máy chủ đi qua `services/sb.js`.
kiem('khung không chạm window.supabase — luật MỘT CỬA',
     motCua(JS_KH), 'khung gọi thẳng máy chủ');

kiem('khung KHÔNG kéo theo bộ vẽ sơ đồ',
     khongKeoTheoSoDo(JS_KH), 'khung import tree-view/khoi-dong');

kiem('khung không tự lọc quyền bằng vaiTro phía trình duyệt',
     !/vaiTro\s*===/.test(boGhiChuJs(JS_KH)), 'khung tự cấp quyền');

// Bốn khu, và `ma` của chúng là giao kèo với người dùng: nó đi vào `#` của
// địa chỉ, nên đổi một chữ là mọi link đã gửi đi hỏng.
for (const ma of ['gia-pha', 'thanh-vien', 'kiem-duyet', 'quan-tri-he-thong']) {
  kiem('có khu ' + ma, new RegExp("ma: '" + ma + "'").test(JS_KH),
       'thiếu khu này trong danh sách KHU');
}

// Luật 3 của khung: khu đang mở ghi vào `#`, và cú bấm lẫn nút Back đều đi
// qua đúng một đường là `hashchange`.
kiem('khu đang mở ghi vào # của địa chỉ',
     /location\.hash/.test(JS_KH) && /'hashchange'/.test(JS_KH),
     'không thấy đường đi qua hashchange');

// `#` lạ thì phải sửa thanh địa chỉ bằng replaceState. Gán `location.hash`
// trong hàm vẽ đẻ ra một hashchange nữa (vẽ hai lần) và thêm một mục vào
// lịch sử — nút Back quay về đúng cái `#` hỏng vừa bỏ đi.
kiem('# lạ được sửa bằng replaceState, không gán lại location.hash',
     suaHashBangReplaceState(JS_KH),
     'hàm vẽ khu gán location.hash — vẽ hai lần và kẹt nút Back');

// Luật 2: mỗi lần chỉ vẽ MỘT khu, và chỉ khu ấy gọi máy chủ. Khung chỉ được
// gọi hai hàm ĐẾM; đọc dữ liệu của một khu là việc của chính khu ấy.
kiem('khung chỉ gọi hai hàm đếm, không đọc dữ liệu khu nào',
     /dsChoDuyet/.test(JS_KH) && /demChoKiemDuyet/.test(JS_KH) &&
     !/\bdsKiemDuyet\s*\(/.test(boGhiChuJs(JS_KH)),
     'khung đọc luôn dữ liệu của một khu');

// `CLAUDE.md` mục 7: trường trống thì không vẽ hàng đó. Huy hiệu "0" nói
// *có việc đấy* trong khi sự thật là không có việc nào.
kiem('số 0 thì không vẽ huy hiệu',
     /if\s*\(!nut\s*\|\|\s*!so\)\s*return/.test(JS_KH),
     'vẽ cả số 0');

// Bốn khu phải nói thẳng khu nào chưa viết — bảng trống nói "không có dữ
// liệu", mà sự thật là "chưa ai viết màn hình này". Con số này giảm dần theo
// từng bước, và nó phải giảm ĐÚNG LÚC: một khu đã viết mà vẫn còn `chuaLam`
// thì `veKhu()` vẽ câu "chưa làm" đè lên màn hình vừa viết xong.
// ⚠ b118: khu thứ tư đổi tên `sao-luu` → `quan-tri-he-thong` VÀ được viết
//   luôn (sổ tài khoản dời sang) — không còn khu nào mang câu `chuaLam` nữa.
//   *Sao lưu* lùi thành một việc con bên trong khu này, làm ở b119.
kiem('không còn khu nào ở trạng thái "chưa làm"',
     (JS_KH.match(/chuaLam:/g) || []).length === 0, 'sai số khu chưa làm');

// ⚠ Regex phải dừng ở dấu `}` của chính mục ấy. Bản đầu quét 120 ký tự bất
//   kể ranh giới, nên nó vớ luôn `chuaLam` của MỤC SAU và báo hỏng oan —
//   thước đo sai, không phải vật đo sai. Mất một vòng vì chuyện này 08/09.
kiem('khu Gia phả đã nối vào khung, không còn câu "chưa làm"',
     /mountKhuGiaPha/.test(JS_KH) &&
     !/'gia-pha'[^}]*chuaLam/.test(JS_KH),
     'khu 1 chưa nối, hoặc còn câu chưa làm đè lên nó');

kiem('khu Tài khoản đã nối vào khung, không còn câu "chưa làm"',
     /mountKhuTaiKhoan/.test(JS_KH) &&
     !/'thanh-vien'[^}]*chuaLam/.test(JS_KH),
     'khu 2 chưa nối, hoặc còn câu chưa làm đè lên nó');

// b118 — khu thứ tư đổi tên và được viết.
kiem('khu Quản trị hệ thống đã nối vào khung, không còn câu "chưa làm"',
     /mountKhuQuanTriHeThong/.test(JS_KH) &&
     !/'quan-tri-he-thong'[^}]*chuaLam/.test(JS_KH),
     'khu 4 chưa nối, hoặc còn câu chưa làm đè lên nó');

// ⚠ `ma` là giao kèo trong `#` của địa chỉ, chữ trên thanh là thứ người đọc.
//   b106 tách hai thứ ấy có chủ ý: `thanh-vien` giữ nguyên để link cũ không
//   hỏng, còn chữ đổi sang *Tài khoản* vì khu ấy liệt kê tài khoản đăng nhập,
//   không liệt kê người trong sơ đồ. Phép này canh đúng cặp ấy đứng cùng nhau.
kiem('khu 2 mang mã thanh-vien nhưng hiện chữ "Tài khoản"',
     /ma:\s*'thanh-vien',\s*chu:\s*'Tài khoản'/.test(JS_KH),
     'chữ trên thanh lệch khỏi thoả thuận b106');

// Luật "một danh sách khu, hai cách vẽ": chỗ biết bề ngang màn hình nằm
// TRỌN trong @media của QuanTri.html.
kiem('khung không hỏi bề ngang màn hình trong JS (chỗ hỏng câm 8)',
     motBoMa(JS_KH), 'khung có nhánh riêng theo innerWidth/matchMedia');

// ⚠ Đổi b118c: CSS nay là bản chép nguyên văn quantri3 — thanh trái gập
//   thành hàng thẻ ngang ở `@media(max-width:850px)` (`.app{display:block}`
//   + `nav{display:flex;overflow:auto}`), không còn `.qt-dieu-huong` ở 680px.
kiem('quan-tri.css có @media đổi thanh trái thành hàng thẻ ngang',
     /@media\(max-width:850px\)\{\.app\{display:block\}[\s\S]{0,300}nav\{display:flex/.test(CSS),
     'thiếu @media(max-width:850px) của quantri3 chuyển nav sang hàng ngang');

// Chỗ hỏng câm 7: class trong JS lệch class trong CSS.
{
  const thieu = classThieuTrongCss(JS_KH, CSS);
  kiem('mọi class qt- dùng trong khung đều có trong quan-tri.css',
       thieu.length === 0, 'thiếu định nghĩa: ' + thieu.join(', '));
}

kiem('khu Kiểm duyệt được nhúng vào khung, không còn là cả trang',
     /mountKhuKiemDuyet/.test(JS_KH) &&
     /export\s+async\s+function\s+mountKhuKiemDuyet/.test(JS_QT),
     'khung không gọi được khu Kiểm duyệt');

// ============================================================
// PHẦN H — khu Tài khoản & quyền (b106)
// ============================================================
console.log('\nPHẦN H — bảng quyền một cây js/pages/quan-tri/trang-cay.js (b106 → b118d)');

// ⚠ Đính chính b118d: bốn phép cấp file của `khu-thanh-vien.js` (ghi chú đầu
//   file · một cửa · không kéo bộ vẽ · không alert) đã sang PHẦN O cho
//   `trang-cay.js` — file ấy xoá, bảng quyền một cây sống ở trang cây.

// ⚠ ĐÂY LÀ PHÉP ĐÁNG TIỀN NHẤT CỦA PHẦN NÀY. `vai_tro()` trong trình duyệt
//   KHÔNG trả lời được câu "ai đổi được quyền": chủ cây nhận quyền qua CỘT
//   `trees.chu_so_huu`, không qua mã vai (`13` mục 4, và cả bài học b105 —
//   *khi phải nâng quyền cho một thứ để nó chạy được, hãy nghi ngờ hàng rào
//   chứ đừng nghi ngờ cái quyền*). Suy ở đây là khoá tay đúng người có quyền
//   nhất, và không có gì báo lỗi.
// ⚠ Đính chính b117: lời gọi `coTheQuanTri()` rời `khu-thanh-vien.js` cùng
//   phần khu đã gỡ; nơi hỏi câu ấy trước khi vẽ bảng nay là trang cây. Luật
//   không đổi — chỉ đổi chỗ đứng của lời hỏi.
kiem('bảng tài khoản một cây hỏi máy chủ ai đổi được quyền, không suy từ vaiTro',
     /coTheQuanTri\s*\(/.test(boGhiChuJs(JS_TC_SOM)) &&
     !/vaiTro\s*===/.test(boGhiChuJs(JS_TC_SOM)),
     'tự quyết quyền bằng JavaScript');

// Bảy cửa của `13`, đối chiếu CHỮ KÝ SQL — đúng bẫy số 1: sai một chữ trong
// tên tham số thì Supabase trả "function not found", `sb.js` nuốt gọn thành
// mảng rỗng, và màn hình hiện y hệt lúc không có dữ liệu.
const CUA_13 = [
  { js: 'coTheQuanTri',          sql: 'co_the_quan_tri' },
  { js: 'dsThanhVien',           sql: 'ds_thanh_vien' },
  { js: 'doiVaiThanhVien',       sql: 'doi_vai_thanh_vien' },
  { js: 'ganNguoiChoThanhVien',  sql: 'gan_nguoi_cho_thanh_vien' },
  { js: 'datTinCayThanhVien',    sql: 'dat_tin_cay_thanh_vien' },
  { js: 'goThanhVien',           sql: 'go_thanh_vien' },
  { js: 'doiChuCay',             sql: 'doi_chu_cay' },
];

for (const c of CUA_13) {
  kiem('sb.js xuất hàm ' + c.js + '()',
       new RegExp('export\\s+async\\s+function\\s+' + c.js + '\\b').test(JS_SB),
       'không thấy');

  const lech = lechThamSo(JS_SB, SQL_13, c.sql);
  kiem('  ' + c.sql + '() — tên tham số khớp chữ ký SQL',
       lech !== null && lech.length === 0,
       lech === null ? 'không tìm thấy lời gọi hoặc chữ ký' : lech.join('; '));

  kiem('  ' + c.sql + '() được cấp cho authenticated',
       coCapQuyen(SQL_13, c.sql), 'thiếu grant execute … to authenticated');
}

// `ds_thanh_vien` là hàm trả BẢNG, và `13` đã học bài 42P13: phải `drop` trước.
// Phép này canh chính chỗ đã làm hỏng lần dán sáng 08/09.
kiem('ds_thanh_vien() có drop function trước create (bài học 42P13)',
     /drop\s+function\s+if\s+exists\s+public\.ds_thanh_vien/i.test(SQL_13),
     'create or replace không đổi được danh sách cột trả về');

// Năm việc đổi quyền + hai việc xét đơn, tất cả đều phải đi qua `sb.js`.
// ⚠ Đính chính b118d: gọi trong hộp hỏi dùng chung của trang cây.
for (const ten of ['doiVaiThanhVien', 'ganNguoiChoThanhVien',
                   'datTinCayThanhVien', 'goThanhVien', 'doiChuCay',
                   'duyetThanhVien', 'tuChoiThanhVien']) {
  kiem('  trang cây gọi ' + ten + '()',
       new RegExp('\\b' + ten + '\\s*\\(').test(boGhiChuJs(JS_TC_SOM)),
       'thiếu việc này trên màn hình');
}

// ⚠ Đính chính b117: ba tấm lọc *Đang chờ · Đã duyệt · Tất cả* đã thành ba
//   MỤC của trang chi tiết một cây (b116) — cùng câu hỏi, cây nằm trong địa
//   chỉ thay vì trong ô chọn. Cộng mục thứ tư, nơi khối xét đơn đề xuất về ở.
// ⚠ Đính chính b118d: *Lời mời* thôi là một mục — nút ấy trên thanh mục của
//   quantri3 đi thẳng sang trang Mời gia nhập, nơi bảng *Lời mời đã gửi* ở.
//   Hai địa chỉ cho một bảng là hai chỗ để lệch nhau.
for (const ma of ['thanh-vien', 'don-xin-vao', 'de-xuat-gan']) {
  kiem('  trang cây có mục ' + ma, new RegExp("ma: '" + ma + "'").test(JS_TC_SOM),
       'thiếu mục này');
}
kiem('  nút Lời mời của thanh mục đi sang trang Mời gia nhập của đúng cây',
     /ma === 'loi-moi'\s*\?\s*duongDan\('gia-pha', 'moi', ctx\.thamSo\)/.test(JS_TC_SOM),
     'nút Lời mời không nối vào đâu');

// ⚠ Không `confirm()`. Đính chính b118d: không còn nút hai nhịp — mọi việc
//   đổi quyền hỏi lại bằng hộp của quantri3, và lời gọi cửa chỉ đứng trong
//   `lam` của hộp ấy. Lời gọi nằm ngoài `lam` là việc chạy ngay từ cú bấm đầu.
{
  const lenh = boGhiChuJs(JS_TC_SOM);
  const ngoai = [];
  for (const c of ['doiVaiThanhVien', 'ganNguoiChoThanhVien', 'datTinCayThanhVien',
    'goThanhVien', 'doiChuCay', 'duyetThanhVien', 'tuChoiThanhVien']) {
    for (const m of lenh.matchAll(new RegExp('\\b' + c + '\\s*\\(', 'g'))) {
      if (!lenh.slice(Math.max(0, m.index - 160), m.index).includes('lam:')) ngoai.push(c);
    }
  }
  kiem('mọi việc đổi quyền đi qua hộp hỏi lại (lam của hoi)',
       ngoai.length === 0, 'chạy ngay từ cú bấm đầu: ' + ngoai.join(', '));
}

// `laChinhToi` phải tính bằng `user_id` của phiên, KHÔNG bằng email: email đổi
// được và trùng được, `user_id` thì không. Phép tính ấy nằm ở `sb.js`.
kiem('laChinhToi tính bằng user_id trong sb.js, không so email ở màn hình',
     /laChinhToi:\s*Boolean\(toi && r\.user_id === toi\)/.test(JS_SB) &&
     !/laChinhToi\s*=[^=]/.test(boGhiChuJs(JS_TC_SOM + '\n' + JS_TTK + '\n' + JS_QTHT)),
     'màn hình tự suy "đây là tôi"');

// Chủ cây không hạ vai và không gỡ được — kể cả Quản trị hệ thống.
kiem('chủ cây được mờ việc Đổi vai · Bàn giao · Xóa (laChuCay)',
     (boGhiChuJs(JS_TC_SOM).match(/laChuCay/g) || []).length >= 3,
     'chưa chặn hạ vai / gỡ chủ cây');

// ============================================================
// PHẦN I — tấm lọc Toàn hệ thống (b109)
// ============================================================
console.log('\nPHẦN I — sổ tài khoản khu-quan-tri-he-thong.js · trang-tai-khoan.js (b109 → b118d)');

// ⚠ Đính chính b118d: `khu-tai-khoan-he-thong.js` đã xoá — sổ tài khoản là bảng
//   quantri3 trong `khu-quan-tri-he-thong.js` (PHẦN N gác cấp file), trang một
//   tài khoản ở `trang-tai-khoan.js`. Các phép dưới canh HAI file ấy.
const JS_SO = boGhiChuJs(JS_QTHT + '\n' + JS_TTK);

// ⚠ PHÉP ĐÁNG TIỀN NHẤT CỦA PHẦN NÀY: việc đổi quyền trong cây KHÔNG được chép
//   sang bản thứ hai — hai bản lệch dần từ lần sửa thứ hai.
kiem('việc đổi quyền trong cây KHÔNG chép sang sổ tài khoản — dùng hộp hỏi của trang cây',
     !['doiVaiThanhVien', 'ganNguoiChoThanhVien', 'datTinCayThanhVien', 'goThanhVien',
       'doiChuCay', 'duyetThanhVien', 'tuChoiThanhVien']
       .some((t) => new RegExp('\\b' + t + '\\b').test(JS_SO)),
     'sổ tài khoản tự gọi cửa đổi quyền — bản thứ hai');

// ⚠ RANH GIỚI của THIET-KE-QUAN-TRI.md mục 1: trang Quản trị KHÔNG nạp cây.
kiem('không nạp cây gia phả — ranh giới của trang Quản trị',
     !/persons/.test(JS_SO) && !/from\s+'\.\.\/\.\.\/(domains|services\/repo)/.test(JS_SO),
     'đọc dữ liệu người trong cây');

// Lời mời có HAI chữ ký. Nhận hộ người khác là bỏ mất chữ ký thứ hai.
kiem('không có đường nhận lời mời hộ người khác',
     !/nhanLoiMoi/.test(JS_SO), 'gọi nhanLoiMoi');

// Ô "gõ lại email" chỉ có nghĩa khi phép so hỏi HÀNG SẮP BỊ XOÁ, ở máy chủ.
kiem('email xác nhận KHÔNG so ở trình duyệt',
     !/===\s*t\.email/.test(JS_SO) && /xoaTaiKhoan\(t\.userId, v\.email\.trim\(\)/.test(JS_QTHT),
     'tự so email trước khi gọi máy chủ');

kiem('xoá tài khoản hỏi lại trong hộp, nút đỏ',
     /lam: \(v\) => xoaTaiKhoan\(/.test(JS_QTHT) &&
     /tua: 'Xóa tài khoản'[\s\S]{0,700}?kieuOk: 'danger'/.test(JS_QTHT),
     'việc phá huỷ chạy ngay từ cú bấm đầu');

// Bốn cửa của `14`, đối chiếu CHỮ KÝ SQL — bẫy số 1, khác file.
const CUA_14 = [
  { js: 'dsTaiKhoanHeThong',  sql: 'ds_tai_khoan_he_thong' },
  { js: 'dsCayCuaTaiKhoan',   sql: 'ds_cay_cua_tai_khoan' },
  { js: 'datQuanTriHeThong',  sql: 'dat_quan_tri_he_thong' },
  { js: 'xoaTaiKhoan',        sql: 'xoa_tai_khoan' },
];

for (const c of CUA_14) {
  kiem('sb.js xuất hàm ' + c.js + '()',
       new RegExp('export\\s+async\\s+function\\s+' + c.js + '\\b').test(JS_SB),
       'không thấy');

  // ⚠ `ds_tai_khoan_he_thong()` KHÔNG có tham số nào, nên `lechThamSo()` —
  //   hàm đi tìm cái khối `{ p_… }` trong lời gọi — không có gì để so và trả
  //   `null`. Đó là *không áp dụng được*, không phải *hỏng*. Phép đúng cho ca
  //   này là chiều ngược lại: lời gọi cũng phải KHÔNG gửi tham số nào, vì gửi
  //   thừa một khoá là Supabase không tìm thấy hàm — đúng bẫy số 1.
  const thamSo = thamSoSql(SQL_14, c.sql);
  if (thamSo && thamSo.length === 0) {
    kiem('  ' + c.sql + '() — hàm không tham số, lời gọi cũng không gửi gì',
         new RegExp("\\.rpc\\(\\s*'" + c.sql + "'\\s*\\)").test(JS_SB),
         'lời gọi gửi kèm tham số cho một hàm không nhận tham số nào');
  } else {
    const lech = lechThamSo(JS_SB, SQL_14, c.sql);
    kiem('  ' + c.sql + '() — tên tham số khớp chữ ký SQL',
         lech !== null && lech.length === 0,
         lech === null ? 'không tìm thấy lời gọi hoặc chữ ký' : lech.join('; '));
  }

  kiem('  ' + c.sql + '() được cấp cho authenticated',
       coCapQuyen(SQL_14, c.sql), 'thiếu grant execute … to authenticated');

  kiem('  màn hình gọi ' + c.js + '()',
       new RegExp('\\b' + c.js + '\\s*\\(').test(JS_SO),
       'cửa có ở sb.js mà chưa lộ ra màn hình nào');
}

// Hai hàm trả BẢNG của `14` — cùng bài học 42P13 đã trả giá ở `ds_thanh_vien`.
for (const ten of ['ds_tai_khoan_he_thong', 'ds_cay_cua_tai_khoan']) {
  kiem(ten + '() có drop function trước create (bài học 42P13)',
       new RegExp('drop\\s+function\\s+if\\s+exists\\s+public\\.' + ten, 'i').test(SQL_14),
       'create or replace không đổi được danh sách cột trả về');
}

// ⚠ Đính chính b118 cho ba phép dưới: sổ Toàn hệ thống không còn là chip của
//   `khu-tai-khoan.js` — nó là khu RIÊNG trên thanh điều hướng
//   (`khu-quan-tri-he-thong.js`), và app này không tự lọc nav bằng cờ (cùng
//   luật `khu-kiem-duyet.js`) — máy chủ lọc, `mountToanHeThong()` đã tự nói
//   rõ "máy chủ không trả về tài khoản nào" khi người xem không có cờ ấy. Nên
//   không còn phép "chỉ hiện cho người có cờ" ở lớp giao diện.
//
// ⚠ NẠP ĐỘNG vẫn giữ nguyên: chỉ một hạng người có việc thật ở khu này, nạp
//   sẵn cho mọi người là bắt họ tải 1.300 dòng họ không có cửa dùng.
// ⚠ Đính chính b118d: điều phép canh là *"không bắt mọi người tải 1.300 dòng
//   chỉ Quản trị hệ thống dùng"*. Sổ tài khoản nay là bảng quantri3 ~150 dòng
//   ngay trong khu, và thư viện cũ không còn ai nạp — canh đúng điều ấy.
kiem('khu Quản trị hệ thống không còn nạp thư viện sổ tài khoản cũ',
     !/khu-tai-khoan-he-thong\.js/.test(boGhiChuJs(JS_QTHT)),
     'vẫn nạp khu-tai-khoan-he-thong.js — mọi người tải phần không dùng');

kiem('sổ tài khoản đọc hỏng thì NÓI RA, không đứng im ở chữ "Đang đọc…"',
     /dongTrong\(tb, 8, tk\.loi/.test(JS_QTHT),
     'không nói lỗi đọc sổ tài khoản');

kiem('khu Tài khoản KHÔNG còn chip/đường nạp Toàn hệ thống (dời hẳn sang khu riêng)',
     !/khu-tai-khoan-he-thong\.js/.test(JS_KTK), 'khu Tài khoản còn giữ lại đường nạp cũ');

// ============================================================
// PHẦN F2 — THÙNG RÁC GIA PHẢ (b110, `16-thung-rac-cay.sql`)
// ============================================================
console.log('\nPHẦN F2 — thùng rác gia phả');

// Năm cửa của `16`, đối chiếu CHỮ KÝ SQL — bẫy số 1, khác file.
const CUA_16 = [
  { js: 'xinXoaCay',    sql: 'xin_xoa_cay' },
  { js: 'huyXinXoaCay', sql: 'huy_xin_xoa_cay' },
  { js: 'duyetXoaCay',  sql: 'duyet_xoa_cay' },
  { js: 'phucHoiCay',   sql: 'phuc_hoi_cay' },
  { js: 'donThungRac',  sql: 'don_thung_rac' },
];

for (const c of CUA_16) {
  kiem('sb.js xuất hàm ' + c.js + '()',
       new RegExp('export\\s+async\\s+function\\s+' + c.js + '\\b').test(JS_SB),
       'không thấy');

  const lech = lechThamSo(JS_SB, SQL_16, c.sql);
  kiem('  ' + c.sql + '() — tên tham số khớp chữ ký SQL',
       lech !== null && lech.length === 0,
       lech === null ? 'không tìm thấy lời gọi hoặc chữ ký' : lech.join('; '));

  kiem('  ' + c.sql + '() được cấp cho authenticated',
       coCapQuyen(SQL_16, c.sql), 'thiếu grant execute … to authenticated');

  kiem('  màn hình gọi ' + c.js + '()',
       // b118c: khối Thùng rác dời sang tab của khu Quản trị hệ thống.
       new RegExp('\\b' + c.js + '\\s*\\(').test(boGhiChuJs(JS_GP + '\n' + JS_QTHT)),
       'cửa có ở sb.js mà chưa lộ ra màn hình nào');
}

// `tin_thung_rac()` là hàm nội bộ của `sb.js` (không xuất ra), nhưng lời gọi
// vẫn đi qua RPC nên vẫn dính bẫy số 1 — tên tham số sai một chữ thì Supabase
// không tìm thấy hàm, và `tinThungRac()` nuốt lỗi để trả `{}`. Hỏng đúng theo
// hướng dễ chịu: cây đã xoá lại mở ra một sơ đồ trống.
{
  const lech = lechThamSo(JS_SB, SQL_16, 'tin_thung_rac');
  kiem('tin_thung_rac() — tên tham số khớp chữ ký SQL',
       lech !== null && lech.length === 0,
       lech === null ? 'không tìm thấy lời gọi hoặc chữ ký' : lech.join('; '));
}

kiem('tin_thung_rac() được cấp cho authenticated',
     coCapQuyen(SQL_16, 'tin_thung_rac'),
     'thiếu grant execute … to authenticated');

// ⚠ `tin_thung_rac()` là `security definer`. Thiếu mệnh đề gác thì người lạ
//   dò được tên mọi gia phả từng bị xoá kèm email hai người liên quan — cùng
//   hình dạng Bẫy 3 của `11` (lộ email cả họ).
kiem('tin_thung_rac() tự gác bằng la_thanh_vien hoặc cờ Quản trị hệ thống',
     /create\s+or\s+replace\s+function\s+public\.tin_thung_rac[\s\S]{0,900}?la_thanh_vien[\s\S]{0,200}?la_quan_tri_he_thong/i
       .test(SQL_16),
     'người lạ dò được tên mọi gia phả đã xoá và email người liên quan');

// Chủ dự án chốt 09/09/2026: *"không hiện cây trong thùng rác"*. Bản 0.1.0
// thêm nhánh `la_thanh_vien` vào `where` của `ds_gia_pha()`; nhánh ấy đã gỡ.
//
// ⚠ Phải CẮT LẤY THÂN HÀM rồi mới tìm, không quét bằng một biểu thức mở.
//   Bản đầu của phép này viết `ds_gia_pha[\s\S]*?la_thanh_vien` và báo HỎNG
//   trên một file đúng: dấu `*?` tuy lười vẫn chạy tiếp qua hết thân hàm để
//   bắt chữ `la_thanh_vien` nằm trong `tin_thung_rac()` ở mục 5b ngay sau đó.
//   Cùng họ bài học "thứ mình dùng để đo cũng hỏng được".
{
  const than = thanHamSql(SQL_16, 'ds_gia_pha');
  kiem('ds_gia_pha() KHÔNG hiện cây trong thùng rác cho người thường',
       than !== null && !/la_thanh_vien/.test(than),
       than === null ? 'không tìm thấy thân hàm ds_gia_pha'
         : 'cây đã xoá vẫn nằm trong bảng chọn — mời người ta bấm vào thứ không mở được');
}

// Màn hình khởi động phải có nhánh riêng, và phải kể ĐÍCH DANH. Không có nó
// thì thành viên của cây vừa bị xoá đi thẳng vào `mountTreeView()` và nhìn
// một sơ đồ trống — đúng thứ chủ dự án gọi là "màn hình trắng".
{
  const js = boGhiChuJs(doc('../js/pages/khoi-dong.js'));
  kiem('màn hình khởi động có nhánh riêng cho cây đã bị xoá',
       /daxoa/.test(js),
       'người có đủ quyền sẽ thấy sơ đồ trống hoặc câu "chưa được cấp quyền"');
  kiem('lời nhắn kể đích danh tên cây và người xoá',
       /tenCay/.test(js) && /emailXinXoa/.test(js) && /emailDuyet/.test(js),
       'câu "gia phả đã bị xoá" trống không vẫn là một ngõ cụt');
}

// ⚠⚠ PHÉP ĐẮT NHẤT CỦA CẢ PHẦN NÀY, và nó canh một chỗ hỏng IM LẶNG: sáu
//    bảng nội dung gác bằng `co_the_xem_cay()`, nên khoá thùng rác ở đó mà
//    không chừa lối cho vai `sao_luu` thì bản sao lưu đêm vẫn chạy, vẫn sinh
//    file đủ chín bảng, chỉ **thiếu đúng cái cây đang mong manh nhất** — và
//    không có gì báo lỗi. Đúng họ với lỗ hổng b102.
kiem('co_the_xem_cay() chừa lối cho máy sao lưu đọc cây trong thùng rác',
     /create\s+or\s+replace\s+function\s+public\.co_the_xem_cay[\s\S]{0,700}?la_may_sao_luu/i
       .test(SQL_16),
     'sao lưu đêm sẽ ra file THIẾU cây trong thùng rác, không báo lỗi');

kiem('co_the_xem_cay() thật sự hỏi tới thùng rác',
     /create\s+or\s+replace\s+function\s+public\.co_the_xem_cay[\s\S]{0,700}?trong_thung_rac/i
       .test(SQL_16),
     'cây trong thùng rác vẫn đọc được');

kiem('co_the_sua() khoá chiều ghi vào cây trong thùng rác',
     /create\s+or\s+replace\s+function\s+public\.co_the_sua\s*\(p_tree[\s\S]{0,600}?trong_thung_rac/i
       .test(SQL_16),
     'cây trong thùng rác vẫn ghi được');

// `la_thanh_vien()` gác `tree_members` · `change_log` · `imports` ·
// `user_settings` — bốn bảng sao lưu vẫn phải chép được. Đụng vào là lặp lại
// đúng lỗ hổng b102.
kiem('16 KHÔNG định nghĩa lại la_thanh_vien()',
     !/create\s+or\s+replace\s+function\s+public\.la_thanh_vien/i.test(SQL_16),
     'đụng vào hàm nền móng mà b102 đã trả giá một lần để giữ');

kiem('16 KHÔNG định nghĩa lại vai_tro()',
     !/create\s+or\s+replace\s+function\s+public\.vai_tro/i.test(SQL_16),
     'vai_tro() là nền móng, và 05-sao-luu.sql dùng nó ở hai luật');

// Hàm trả BẢNG — cùng bài học 42P13 đã trả giá trên máy chủ thật 08/09/2026.
kiem('ds_gia_pha() có drop function trước create (bài học 42P13)',
     /drop\s+function\s+if\s+exists\s+public\.ds_gia_pha/i.test(SQL_16),
     'create or replace không đổi được danh sách cột trả về');

// Xoá cứng là việc duy nhất trong app không lùi được. `anon` gọi được nó là
// mở cửa cho cả internet — `revoke` phải đứng trước `grant`.
kiem('don_thung_rac() có revoke khỏi public, anon',
     /revoke\s+all\s+on\s+function\s+public\.don_thung_rac[^;]*from\s+public,\s*anon/i
       .test(SQL_16),
     'mặc định Postgres cho MỌI vai gọi, kể cả người chưa đăng nhập');

// `delete from public.trees` chỉ được có ở ĐÚNG MỘT chỗ trong cả lược đồ.
{
  const moiFile = [SQL_08, SQL_13, SQL_14, SQL_16];
  const dem = moiFile.reduce((t, f) =>
    t + (f.match(/delete\s+from\s+public\.trees/gi) || []).length, 0);
  kiem('chỉ có ĐÚNG MỘT lệnh delete from public.trees trong lược đồ',
       dem === 1, 'đếm được ' + dem + ' lệnh — cửa xoá cứng phải là duy nhất');
}

// Màn hình phải đọc `boQua` và `dsAnh`. Bỏ `boQua` là người bấm tưởng đã dọn
// xong cả loạt; bỏ `dsAnh` là để lại file mồ côi vĩnh viễn trong kho ảnh.
kiem('màn hình xoá ảnh mồ côi sau khi dọn thùng rác',
     /dsAnh/.test(boGhiChuJs(JS_QTHT)) && /xoaAnhThat\s*\(/.test(boGhiChuJs(JS_QTHT)),
     'ảnh trong kho không đi theo delete của Postgres');

// Đơn xin xoá KHÔNG khoá cây — hàng rào ở máy chủ, nhưng màn hình cũng không
// được tự đóng sớm hơn máy chủ.
kiem('màn hình KHÔNG tự đóng cây khi mới có đơn xin xoá',
     !/xinXoaLuc\s*\)\s*return/.test(boGhiChuJs(JS_GP)) &&
     /!c\.daXoaLuc/.test(boGhiChuJs(JS_GP)),
     'màn hình đóng sớm hơn máy chủ — biến một lá đơn thành một lệnh');

// ============================================================
// PHẦN J — b110b: quyền dựng cây tách riêng, và không đâu ngầm định cây
// ============================================================
//
// Hai việc chủ dự án chốt 09/09/2026, và chúng hỏng theo hai kiểu khác nhau:
//
//   ① **Quyền dựng cây** bị gộp vào vai Quản trị gia phả → người được phong
//      quản trị một cây dựng được cây riêng, rồi trong cây ấy họ là chủ. Đó
//      là leo thang, và nó KHÔNG có triệu chứng nào trên màn hình.
//   ② **Ngầm định "cây đang hoạt động"** → bảng sửa quyền không nói nó đang
//      đụng cây nào. Với một cây thì vô hại; với nhiều cây thì đổi quyền
//      nhầm chỗ, và cũng không có gì báo.
console.log('\nPHẦN J — quyền dựng cây · gọi tên cây (b110b)');

// — Cửa máy chủ —

kiem('`17-quyen-tao-cay.sql` có hàm dat_duoc_tao_cay()',
     /create\s+or\s+replace\s+function\s+public\.dat_duoc_tao_cay/i.test(SQL_17),
     'thiếu hàm — cột duoc_tao_cay lại không có đường nào đặt');

kiem('hàm ấy gác bằng la_quan_tri_he_thong()',
     /la_quan_tri_he_thong/.test(thanHamSql(SQL_17, 'dat_duoc_tao_cay') || ''),
     'ai cũng cấp được quyền dựng cây');

// ⚠ Cửa thứ BẢY của luật *không ai tự đặt quyền cho mình*.
kiem('hàm ấy gác bằng la_chinh_minh() — cửa thứ bảy',
     /la_chinh_minh/.test(thanHamSql(SQL_17, 'dat_duoc_tao_cay') || ''),
     'tự bật cờ cho mình được');

// ⚠ KHÔNG có `p_tree`, và đó là cả điểm của hàm: cờ ở tầng TÀI KHOẢN.
kiem('hàm ấy KHÔNG nhận p_tree — cờ tài khoản, không hỏi cây',
     !(thamSoSql(SQL_17, 'dat_duoc_tao_cay') || []).some((x) => x.ten === 'p_tree'),
     'cờ tài khoản mà hỏi cây — nói dối về phạm vi');

kiem('anon bị revoke, authenticated được grant',
     /revoke\s+all\s+on\s+function\s+public\.dat_duoc_tao_cay[^;]*from[^;]*anon/i.test(SQL_17) &&
     coCapQuyen(SQL_17, 'dat_duoc_tao_cay'),
     'quên revoke là mở cửa cho cả internet gọi một hàm security definer');

// — Cầu nối —

kiem('sb.js có datDuocTaoCay() gọi RPC dat_duoc_tao_cay',
     /export\s+async\s+function\s+datDuocTaoCay[\s\S]{0,400}rpc\(\s*'dat_duoc_tao_cay'/
       .test(JS_SB),
     'chưa nối được ô tích với máy chủ');

{
  const lech = lechThamSo(JS_SB, SQL_17, 'dat_duoc_tao_cay');
  kiem('tên tham số RPC khớp chữ ký SQL (bẫy 1)',
       lech !== null && lech.length === 0,
       lech === null ? 'không tìm thấy một trong hai bên' : lech.join(' · '));
}

kiem('chỉ sb.js gọi RPC ấy',
     !/\.rpc\(\s*'dat_duoc_tao_cay'/.test(JS_SO),
     'trang gọi thẳng máy chủ — phá luật một cửa');

// — Màn hình —

kiem('sổ đăng ký có cột Tạo gia phả',
     /<th>Tạo gia phả<\/th>/.test(HTML), 'không có chỗ bấm');

// ⚠ Đính chính b118d: thôi ô tích — quantri3 vẽ nút *Cấp quyền / Thu hồi*, hỏi
//   lại trong hộp. Máy chủ từ chối thì câu từ chối hiện TRONG hộp và bảng
//   không đổi — không còn trạng thái "đã tích mà máy chủ từ chối" để nói dối.
//   Dòng của chính mình không có nút cờ nào: PHẦN O.
kiem('nút cờ Tạo gia phả gọi datDuocTaoCay() trong hộp hỏi lại',
     /lam: \(\) => datDuocTaoCay\(t\.userId, bat\)/.test(JS_QTHT),
     'nút không nối với máy chủ, hoặc chạy ngay từ cú bấm đầu');

// ⚠ Đổi b118c. Bản cũ canh CÂU CHỮ trong hộp Dựng gia phả (câu b110b gộp nhầm
//   hai hạng). Chip *Tạo gia phả mới* của quantri3 không có câu giải thích
//   nào — nên không còn câu nào để gộp nhầm. Điều cốt lõi của b110b vẫn phải
//   giữ: chip KHÔNG ẩn/khoá theo vai hay theo cờ phía trình duyệt; hàng rào
//   là `duoc_tao_cay()` ở máy chủ, và câu từ chối của máy chủ được hiện ra.
kiem('chip Tạo gia phả không tự lọc theo quyền dựng cây ở trình duyệt',
     /taoGiaPhaMoi\s*\(/.test(boGhiChuJs(JS_GP)) &&
     !/duocTaoCay/.test(boGhiChuJs(JS_GP)) &&
     /kq\.loi/.test(boGhiChuJs(JS_GP)),
     'chip tự giấu/khoá theo cờ dựng cây, hoặc nuốt câu từ chối của máy chủ');

// — Không đâu ngầm định cây —

// ⚠ PHÉP QUAN TRỌNG NHẤT CỦA PHẦN NÀY. Chừng nào tham số còn là một `treeId`
//   trần thì nơi gọi bị cám dỗ truyền cây đang mở rồi tự bịa nhãn. Đính chính
//   b118d: bảng việc cũ đã xoá; hộp hỏi đổi quyền nhận ĐỐI TƯỢNG cây, và PHẦN
//   O canh từng hộp gọi tên cây.
kiem('hộp hỏi đổi quyền nhận ĐỐI TƯỢNG cây, không nhận treeId trần',
     ['hoiDoiVai', 'hoiGanNguoi', 'hoiTinCay', 'hoiGo', 'hoiDuyetDon', 'hoiTuChoiDon']
       .every((t) => new RegExp('export async function ' + t + '\\(t, cay, napLai\\)').test(JS_TC_SOM)),
     'còn nhận treeId trần — hộp mở ra không gọi được tên cây');

kiem('không lời gọi nào truyền thẳng .treeId vào các hộp ấy',
     !/hoi(DoiVai|GanNguoi|TinCay|Go|DuyetDon|TuChoiDon)\([^)]*\.treeId/
       .test(JS_SO + '\n' + boGhiChuJs(JS_TC_SOM)),
     'có chỗ truyền uuid trần');

// `layPhien()` là nguồn DUY NHẤT của tên cây trên trang này — không có nó thì
// mọi câu trên lại rơi về một chuỗi thay thế.
kiem('layPhien() mang tên cây về ở mọi nhánh đọc được cây',
     /tenCay:\s*\(cay\s*&&\s*cay\.name\)/.test(JS_SB) &&
     /from\('trees'\)\s*\.select\('name,\s*tree_code'\)/.test(JS_SB),
     'trang Quản trị không có đường nào biết tên cây đang mở');

// ⚠ Ô chọn gia phả ở form Mời phải mở ra ở MỤC TRỐNG — chọn sẵn cây đầu danh
//   sách là đúng thứ "ngầm định" chủ dự án bác bỏ. Đính chính b118d: form ở
//   hộp *Thêm tài khoản vào gia phả khác* của `trang-tai-khoan.js`.
kiem('form Mời mở ra ở mục trống, không chọn sẵn cây nào',
     /\['', '— chọn gia phả —'\]/.test(JS_TTK) && /giaTri: ''/.test(JS_TTK),
     'mời được mà chưa hề chọn cây');

kiem('chưa chọn cây thì không gửi — nói lý do ngay trong hộp',
     /v\.cay \? moiVaoCay\(/.test(JS_TTK),
     'gửi lời mời vào một cây không ai chọn');

// ⚠ Hai cờ cấp TÀI KHOẢN phải tự nói rằng chúng KHÔNG hỏi cây nào.
kiem('hai cờ cấp tài khoản nói rõ chúng không chọn cây',
     /cả hệ thống, không chọn cây/.test(JS_QTHT) &&
     /cả hệ thống, không riêng cây nào/.test(JS_QTHT),
     'người đọc tưởng màn hình quên hỏi cây');

// ============================================================
// PHẦN K — b110c: hai chữ ký không bỏ được (lỗ hổng 10/09/2026)
// ============================================================
//
// Chủ dự án báo: *"mời tài khoản khach@io.vn vào làm thành viên, sau đó vào
// kiểm duyệt thêm được người này luôn và có thể đổi quyền cho tài khoản này
// mà không đợi khach@io.vn đồng ý."*
//
// Tái hiện được, bốn cửa: `duyet_thanh_vien` · `doi_vai_thanh_vien` ·
// `gan_nguoi_cho_thanh_vien` · `dat_tin_cay_thanh_vien`. Không cửa nào hỏi
// dòng mình đang ghi có phải một LỜI MỜI CHƯA NHẬN hay không.
//
// ⚠ Phép đo thật là `ban-thu-sql/do-b110c.mjs` (48 phép, chạy trên Postgres
//   thật). Phần này chỉ gác **văn bản** — nó bắt được ngày ai đó dán đè một
//   bản `13` cũ lên và mất hàng rào, thứ mà phép đo kia không chạy hằng ngày.
console.log('\nPHẦN K — hai chữ ký (b110c)');

kiem('`18-hai-chu-ky.sql` có hàm la_loi_moi_cho_nhan()',
     /create\s+or\s+replace\s+function\s+public\.la_loi_moi_cho_nhan/i.test(SQL_18),
     'thiếu hàm — bốn cửa không có gì để hỏi');

// ⚠ Phân biệt bằng `moi_boi`, KHÔNG bằng `moi_vai`: một lời mời mang vai `xem`
//   trông y hệt một đơn xin vào nếu chỉ nhìn cột vai.
kiem('hàm ấy phân biệt bằng moi_boi, không bằng moi_vai',
     /moi_boi is not null/.test(thanHamSql(SQL_18, 'la_loi_moi_cho_nhan') || ''),
     'phân biệt sai cột — lời mời vẫn lọt');

for (const ten of ['duyet_thanh_vien', 'doi_vai_thanh_vien',
                   'gan_nguoi_cho_thanh_vien', 'dat_tin_cay_thanh_vien']) {
  kiem('cửa `' + ten + '()` hỏi la_loi_moi_cho_nhan()',
       /la_loi_moi_cho_nhan/.test(thanHamSql(SQL_18, ten) || ''),
       'cửa này còn ghi được vào một lời mời chưa ai nhận');
}

// ⚠ LỚP HAI. Kể cả khi có ngày ai đó viết cửa thứ năm mà quên lớp một, một
//   dòng `approved=false` có `moi_boi` vẫn không được mở cây.
kiem('LỚP HAI · la_thanh_vien() thu hẹp đường tắt theo vai',
     /moi_boi is null/.test(thanHamSql(SQL_18, 'la_thanh_vien') || ''),
     'đường tắt còn nguyên — đặt role là mở cây ngay');

// ⚠⚠ VÀ ĐƯỜNG SAO LƯU PHẢI CÒN. b102 sửa gọn một dòng ở hàm này và bản sao
//    lưu đêm ra file RỖNG, không báo lỗi.
kiem('⚠ nhưng VẪN giữ đường tắt cho sao_luu — không vá quá tay',
     /sao_luu/.test(thanHamSql(SQL_18, 'la_thanh_vien') || ''),
     'sao lưu đêm sẽ ra file rỗng — đúng lỗi b102');

kiem('go_thanh_vien() KHÔNG bị chặn — rút lời mời vẫn phải được',
     !/la_loi_moi_cho_nhan/.test(thanHamSql(SQL_18, 'go_thanh_vien') || ''),
     'chặn nhầm chiều lùi: một lời mời gửi nhầm thành thứ không gỡ được');

// — Hai hàm ĐỌC: màn hình phải phân biệt được, không chỉ máy chủ —

kiem('ds_thanh_vien() trả moi_luc để màn hình tách hai trạng thái',
     /moi_luc\s+timestamptz/.test(SQL_18),
     'màn hình lại vẽ nút Xét đơn lên một dòng lời mời');

kiem('ds_cho_duyet() thôi đếm lời mời',
     /moi_boi is null/.test(thanHamSql(SQL_18, 'ds_cho_duyet') || ''),
     'con số trên thanh điều hướng nói "có đơn phải duyệt" khi không có');

// ⚠ Hai hàm ấy bị `drop` (đổi danh sách cột / bỏ `default`), nên `drop` xoá cả
//   quyền gọi. Quên cấp lại là khu Tài khoản đọc ra mảng rỗng — một lời nói
//   dối trông y hệt sự thật.
kiem('hai hàm bị drop được cấp lại quyền gọi',
     coCapQuyen(SQL_18, 'ds_thanh_vien') && coCapQuyen(SQL_18, 'ds_cho_duyet'),
     'drop xoá grant mà không ai cấp lại');

// ⚠ Chỗ này KHÔNG thuộc lỗ hổng, tìm ra lúc đang vá nó: `08` định nghĩa
//   `ds_cho_duyet()` bản CŨ, đoán cây bằng `limit 1` không `order by` — đúng
//   Hỏng 3 của `THIET-KE-NHIEU-CAY.md` mục 8. Dán lại `08` là mở lại.
kiem('⚠ `18` chốt lại Hỏng 3 — ds_cho_duyet() thôi đoán cây bằng limit 1',
     !/trees limit 1/.test(thanHamSql(SQL_18, 'ds_cho_duyet') || ''),
     'dán lại `08` sẽ duyệt nhầm hàng chờ của cây khác, im lặng');

// — Màn hình —

// ⚠ Đính chính b118d: `khu-thanh-vien.js` (hàm `trangThaiDong`) đã xoá. Nơi tách ba
//   trạng thái nay là bảng Thành viên / Đơn xin vào của trang cây (PHẦN O) và
//   bảng các cây của một tài khoản — canh nơi thứ hai ở đây.
kiem('trang một tài khoản phân biệt ba trạng thái bằng moiLuc',
     /const tt = c\.daDuyet \? 'thanhvien' : c\.moiLuc \? 'duocmoi' : 'donxin';/.test(JS_TTK),
     'phân biệt bằng người mời thì lời mời mồ côi thành đơn xin vào');

kiem('dòng LỜI MỜI không có việc đổi quyền nào — chỉ Thu hồi',
     /\} else \{\s*\n(\s*\/\/[^\n]*\n)*\s*ds\.push\(mucMenu\('Thu hồi lời mời'/.test(JS_TTK),
     'còn mời người ta bấm một thứ chắc chắn bị từ chối');

kiem('và nói ra lý do ngay trên dòng',
     /Được mời — chờ họ bấm Nhận/.test(JS_TTK),
     'khoá mà không nói vì sao');

kiem('cột Vai trò hiện vai SẼ nhận, không hiện `xem`',
     /const vaiHien = tt === 'duocmoi' \? \(c\.moiVai \|\| c\.vai\) : c\.vai;/.test(JS_TTK),
     'người quản trị đọc "Khách" rồi đi đổi vai — đúng đường vào lỗ hổng');

// ⚠ Đính chính b117: con số đếm ở trình duyệt đi theo tấm lọc đã gỡ. Con số
//   còn lại trên màn hình là huy hiệu của khung, đếm bằng `ds_cho_duyet()` —
//   máy chủ đã thôi đếm lời mời ở `18` mục 6c. Phép này canh nó đứng cạnh
//   khu CÓ chỗ xét đơn: số đứng cạnh một khu không xử lý được nó là dẫn người
//   ta đi tìm một cái nút không có ở đó.
kiem('huy hiệu đơn chờ duyệt đứng ở nút Gia phả, nơi xét đơn (b117)',
     /themSo\(nutTheoMa\.get\('gia-pha'\)[\s\S]{0,90}'đơn chờ duyệt'/.test(JS_KH),
     'con số đứng cạnh một khu không xét được đơn');

kiem('sb.js đọc moiLuc · moiVai từ ds_thanh_vien()',
     /moiLuc: r\.moi_luc/.test(JS_SB) && /moiVai: r\.moi_vai/.test(JS_SB),
     'cầu nối nuốt mất hai cột — màn hình lại mù');

// ============================================================
// PHẦN L — b115: lớp TRANG CHI TIẾT dưới bốn khu
// ============================================================
console.log('\nPHẦN L — trang chi tiết: trang-chi-tiet.js · trang-cay.js');

const JS_CT = doc('../js/pages/quan-tri/trang-chi-tiet.js');
const JS_TC = doc('../js/pages/quan-tri/trang-cay.js');

for (const [ten, ma] of [['trang-chi-tiet.js', JS_CT], ['trang-cay.js', JS_TC]]) {
  kiem(ten + ' có khối ghi chú đầu file đúng khuôn',
       ghiChuDauFile(ma), 'thiếu Vai trò / Lớp / Phụ thuộc / Phiên bản');
  kiem(ten + ' không chạm window.supabase — luật MỘT CỬA',
       motCua(ma), 'gọi thẳng máy chủ');
  kiem(ten + ' KHÔNG kéo theo bộ vẽ sơ đồ',
       !/from\s+'\.\.\/(tree-view|khoi-dong)\.js'/.test(boGhiChuJs(ma)),
       'import bộ vẽ — trang này cố ý không nạp cây');
  kiem(ten + ' không hỏi bề ngang màn hình trong JS',
       motBoMa(ma), 'có nhánh riêng theo innerWidth/matchMedia');
  kiem(ten + ' không dùng alert/confirm',
       !/\b(alert|confirm)\s*\(/.test(boGhiChuJs(ma)),
       'app này không dùng hộp thoại của trình duyệt ở đâu cả');
  const thieu = classThieuTrongCss(ma, CSS);
  kiem('mọi class qt- của ' + ten + ' có trong quan-tri.css',
       thieu.length === 0, 'thiếu định nghĩa: ' + thieu.join(', '));
}

// Trang chi tiết là lớp THỨ HAI của cùng một khung, không phải trang thứ ba:
// khung đăng ký nó, khung đọc `#`, khung sửa `#` lạ.
kiem('khung đăng ký trang chi tiết một cây dưới khu gia-pha',
     // b118c: dòng đăng ký có thêm `view:` (section vẽ vào) giữa `ma` và `mount`.
     /khu:\s*'gia-pha',\s*ma:\s*'cay',[^}]*mount:\s*mountTrangCay/.test(JS_KH),
     'không thấy dòng đăng ký trong TRANG');

kiem('khung dựng # của trang chi tiết bằng duongDan(), một chỗ ghép chuỗi',
     /import\s*\{\s*duongDan\s*\}\s*from\s*'\.\/trang-chi-tiet\.js'/.test(JS_KH) &&
     /duongDan\(/.test(boGhiChuJs(JS_KH)),
     'khung tự ghép chuỗi # — hai chỗ ghép là hai chỗ lệch');

// Người mở trang chi tiết bằng link được gửi cho thì `history.back()` đưa họ
// RA KHỎI trang Quản trị. Nút ghi "Quay lại Gia phả" thì phải về Gia phả.
// ⚠ Đính chính b118d: nút "← …" là `.backbtn[data-back]` của quantri3 nằm
//   sẵn trong HTML; khung gắn việc cho TẤT CẢ. Canh đúng điều ấy ở khung, và
//   mọi nút Quay lại đều mang `data-back` — trừ trang Thông tin công khai,
//   section chưa có lối vào (máy chủ chưa có công khai theo trường).
kiem('nút Quay lại về khu cha bằng location.hash, không history.back()',
     /location\.hash = b\.dataset\.back/.test(JS_KH) &&
     !/history\.back\s*\(/.test(boGhiChuJs(JS_KH) + boGhiChuJs(JS_CT)) &&
     (HTML.match(/class="backbtn"(?![^>]*data-back)/g) || []).length === 1 &&
     /class="backbtn" id="pid-back-btn">/.test(HTML),
     'có nút Quay lại không mang data-back, hoặc đi đường khác');

// Luật 5a: không màn hình nào ngầm định cây đang mở.
kiem('trang cây tìm cây theo MÃ trong địa chỉ, không theo cây đang mở',
     trangCayTheoMa(JS_TC), 'trang cây đọc phien.treeId / rơi về cây đang mở');

// ⚠ Đính chính b116: bản 0.7.0 (b115) đòi trang cây chỉ nạp ĐÚNG MỘT cửa
//   `layDanhSachGiaPha` — đúng cho lúc ấy ("b115 dựng KHUNG, chưa đổi ruột"),
//   nhưng b116 điền ba mục thật (Thành viên & quyền · Lời mời · Đơn xin vào,
//   dùng lại `veBang()` của khu Tài khoản) và mục Vòng đời (Bàn giao · Xoá) —
//   cả hai đụng nhiều cửa `sb.js` hơn MỘT, đúng ý đồ đã ghi ở `KE-HOACH.md`
//   b116. Luật thật không phải "chỉ một cửa" mà là luật 5a bên trên: KHÔNG
//   BAO GIỜ chọn cây bằng `phien.treeId`. Phép này đo đúng luật ấy.
// ⚠ Đính chính b118d: SO SÁNH với cây đang mở (*"cây này đang hiện ở trang sơ
//   đồ chưa?"*) không phải CHỌN cây — khu Gia phả làm đúng phép so ấy từ
//   b118c. Cấm mọi chỗ khác đọc `phien.treeId`.
kiem('trang cây (b116) không đọc phien.treeId để chọn cây, dù đã điền nhiều cửa sb.js hơn',
     !/phien\.treeId/.test(boPhepSoCayDangMo(boGhiChuJs(JS_TC))),
     'trang cây đọc phien.treeId ở đâu đó — luật 5a bị phá');

kiem('kết quả máy chủ về muộn không đè lên trang vừa mở',
     /location\.hash\s*!==\s*hashLuc/.test(JS_TC),
     'không so lại địa chỉ sau khi chờ máy chủ');

kiem('quan-tri.css: thanh mục con thành một cột khi hẹp',
     layoutGapKhiHep(CSS), 'thiếu @media gập .qt-layout');

// ============================================================
// PHẦN M — b117: khu Tài khoản của tôi · trang chi tiết một tài khoản
// ============================================================
console.log('\nPHẦN M — khu-tai-khoan.js · trang-tai-khoan.js (b117)');

for (const [ten, ma] of [['khu-tai-khoan.js', JS_KTK], ['trang-tai-khoan.js', JS_TTK]]) {
  kiem(ten + ' có khối ghi chú đầu file đúng khuôn',
       ghiChuDauFile(ma), 'thiếu Vai trò / Lớp / Phụ thuộc / Phiên bản');
  kiem(ten + ' không chạm window.supabase — luật MỘT CỬA',
       motCua(ma), 'gọi thẳng máy chủ');
  kiem(ten + ' KHÔNG kéo theo bộ vẽ sơ đồ',
       !/from\s+'\.\.\/(tree-view|khoi-dong)\.js'/.test(boGhiChuJs(ma)),
       'import bộ vẽ — trang này cố ý không nạp cây');
  kiem(ten + ' không hỏi bề ngang màn hình trong JS',
       motBoMa(ma), 'có nhánh riêng theo innerWidth/matchMedia');
  kiem(ten + ' không dùng alert/confirm',
       !/\b(alert|confirm)\s*\(/.test(boGhiChuJs(ma)),
       'app này không dùng hộp thoại của trình duyệt ở đâu cả');
  // Luật 5a: bảng liệt kê mọi cây, mỗi dòng gọi tên cây — không có "cây đang mở".
  kiem(ten + ' không đọc phien.treeId (luật 5a)',
       khongDocCayDangMo(ma), 'ngầm định cây đang mở');
  kiem(ten + ': kết quả máy chủ về muộn không đè lên trang vừa mở',
       /location\.hash\s*!==\s*hashLuc/.test(ma), 'không so lại địa chỉ');
  const thieu = classThieuTrongCss(ma, CSS);
  kiem('mọi class qt- của ' + ten + ' có trong quan-tri.css',
       thieu.length === 0, 'thiếu định nghĩa: ' + thieu.join(', '));
}

// ⚠ Đính chính b118: khu cha đổi từ `thanh-vien` sang `quan-tri-he-thong` —
//   sổ tài khoản (nơi mở trang chi tiết này ra) đã dời sang khu ấy.
kiem('khung đăng ký trang chi tiết một tài khoản dưới khu quan-tri-he-thong',
     /khu:\s*'quan-tri-he-thong',\s*ma:\s*'tai-khoan',[^}]*mount:\s*mountTrangTaiKhoan/.test(JS_KH),
     'không thấy dòng đăng ký trong TRANG');

kiem('trang tài khoản tìm tài khoản theo MÃ NGẮN trong địa chỉ',
     /t\.maNgan\s*===\s*ctx\.thamSo/.test(JS_TTK), 'không tìm theo mã trong địa chỉ');

// ⚠ Luật 5b②: quyền trong MỘT cây chỉ sửa ở bảng của cây ấy. Trang tài khoản
//   gọi một cửa ghi là dựng chỗ thứ ba để năm việc đổi quyền lệch nhau.
// ⚠ Đính chính b118d: trang này nay là `#sys-account-trees` của quantri3 —
//   menu *Chọn ▾* ĐỔI VAI · GỠ theo từng dòng cây, đúng bảng 9.3 của
//   `THIET-KE-QUAN-TRI.md` (*"✓ đúng luật 5b②"*: mỗi dòng mang tên cây). Điều
//   phép này canh vẫn giữ: KHÔNG có bản thứ ba của việc đổi quyền — trang gọi
//   đúng hộp hỏi dùng chung với bảng Thành viên của trang cây, không tự gọi cửa.
{
  const ghi = ['doiVaiThanhVien', 'ganNguoiChoThanhVien', 'datTinCayThanhVien',
    'goThanhVien', 'doiChuCay', 'datQuanTriHeThong', 'datDuocTaoCay', 'xoaTaiKhoan']
    .filter((t) => new RegExp('\\b' + t + '\\b').test(boGhiChuJs(JS_TTK)));
  kiem('trang tài khoản không có BẢN THỨ BA của việc đổi quyền — dùng hộp hỏi của trang cây',
       ghi.length === 0 && /from '\.\/trang-cay\.js'/.test(JS_TTK) &&
       /hoiDoiVai\(t, cay, napLai\)/.test(JS_TTK),
       'tự gọi cửa ghi: ' + ghi.join(', '));
}

// Lời mời đứng TRƯỚC (bài học b111c): xem được cây không có nghĩa là có chân.
kiem('bảng "các gia phả tôi tham gia" xét lời mời TRƯỚC vai',
     /if \(c\.duocMoi\) return 'duocmoi';\s*\n\s*if \(c\.vaiCuaToi/.test(JS_KTK),
     'Quản trị hệ thống lại không thấy lời mời của mình');

kiem('nút Đề xuất mã người chỉ trên chân ĐÃ DUYỆT chưa gắn ai (9.2②)',
     /trangThai === 'thanhvien' && docDuocChan && !\(chan && chan\.maNguoi\)/.test(JS_KTK),
     'nút mọc trên đơn chờ / lời mời — máy chủ chắc chắn từ chối');

// ⚠ Đính chính b118d: khối xét đơn vẽ bằng bảng quantri3 ngay trong trang cây.
kiem('khối xét đơn đề xuất về trang cây, không còn "chuyển sang đây ở b117"',
     /dsDeXuatGan\(/.test(boGhiChuJs(JS_TC_SOM)) && /duyetDeXuatGan\(/.test(boGhiChuJs(JS_TC_SOM)) &&
     !/hienNay:/.test(JS_TC_SOM),
     'mục Đề xuất gắn người vẫn là chỗ trống');

// ⚠ Giữ nguyên ① của KE-HOACH b117 — cửa thứ TÁM, mờ sẵn kèm lý do.
kiem('nút Duyệt trên đơn của CHÍNH MÌNH vẫn khoá sẵn',
     /const khoa = d\.laCuaToi\s*\?/.test(JS_TC_SOM),
     'mời người nộp tự ký chữ ký thứ hai');

// — sb.js —
for (const ten of ['doiMatKhau', 'chanCuaToi']) {
  kiem('sb.js xuất hàm ' + ten + '()',
       new RegExp('export\\s+async\\s+function\\s+' + ten + '\\b').test(JS_SB), 'không thấy');
}

kiem('doiMatKhau() đăng nhập lại bằng mật khẩu cũ TRƯỚC khi đổi',
     matKhauCuTruoc(JS_SB), 'ai ngồi vào máy đang mở sẵn là đổi được mật khẩu');

kiem('chanCuaToi() chỉ đọc chân ĐÃ DUYỆT của chính mình',
     /from\('tree_members'\)[\s\S]{0,200}\.eq\('user_id', nguoi\.id\)\.eq\('approved', true\)/.test(JS_SB),
     'đọc cả dòng chưa duyệt — RLS thật không trả, bản giả sẽ nói dối');

kiem('layPhien() mang userId · duocTaoCay, không thêm vòng mạng',
     /userId: nguoi\.id, duocTaoCay/.test(JS_SB) &&
     // ⚠ Khớp LỎNG phần đuôi: `khoa_ly_do` nhập bọn vào câu này ở b118c và
     //   phép kiểm đứng đỏ từ đó mà không ai thấy. Điều phép này hỏi là "còn
     //   đi chung một câu truy vấn không", không phải danh sách cột.
     /select\('ho_ten, duoc_tao_cay[^']*'\)/.test(JS_SB),
     'thiếu trường, hoặc hỏi thêm một vòng');

// ⚠⚠ PHÉP ĐẮT NHẤT CỦA PHẦN NÀY. Thiếu một tên ở `sb-gia.mjs` là `SyntaxError`
//    lúc nạp mô-đun — CẢ BỘ ẢNH ra nền trơn, kể cả khu chẳng liên quan. Đã xảy
//    ra HAI lần (b110b, b111) và cả hai lần không bộ kiểm văn bản nào kêu.
//    File giả nằm NGOÀI repo, nên máy không có nó (máy thứ hai chưa chép) thì
//    bỏ qua có báo, không báo đạt.
{
  const GIA = resolve(DAY, '../../kiem-thu/sb-gia.mjs');
  if (!existsSync(GIA)) {
    console.log('  BỎ QUA sb-gia.mjs không có trên máy này');
  } else {
    const thieu = tenThieuTrongGia(tenNhapTuSb(), readFileSync(GIA, 'utf8'));
    kiem('sb-gia.mjs có đủ mọi tên trang Quản trị nhập từ sb.js',
         thieu.length === 0, 'thiếu: ' + thieu.join(', '));
  }
}

// ============================================================
// PHẦN N — b118: khu Quản trị hệ thống (khu-quan-tri-he-thong.js)
// ============================================================
console.log('\nPHẦN N — khu Quản trị hệ thống js/pages/quan-tri/khu-quan-tri-he-thong.js');

kiem('file có khối ghi chú đầu file đúng khuôn',
     ghiChuDauFile(JS_QTHT), 'thiếu Vai trò / Lớp / Phụ thuộc / Phiên bản');

kiem('file không chạm window.supabase — luật MỘT CỬA',
     motCua(JS_QTHT), 'file gọi thẳng máy chủ');

kiem('file không dùng alert/confirm',
     !/\b(alert|confirm)\s*\(/.test(boGhiChuJs(JS_QTHT)),
     'app này không dùng hộp thoại của trình duyệt ở đâu cả');

kiem('file KHÔNG kéo theo bộ vẽ sơ đồ',
     !/from\s+'\.\.\/(tree-view|khoi-dong)\.js'/.test(boGhiChuJs(JS_QTHT)),
     'import bộ vẽ — trang Quản trị cố ý không nạp cây');

kiem('file không hỏi bề ngang màn hình trong JS',
     motBoMa(JS_QTHT), 'có nhánh riêng theo innerWidth/matchMedia');

{
  const thieu = classThieuTrongCss(JS_QTHT, CSS);
  kiem('mọi class qt- dùng trong file đều có trong quan-tri.css',
       thieu.length === 0, 'thiếu định nghĩa: ' + thieu.join(', '));
}

// ============================================================
// PHẦN O — b118d: cả trang dựng từ NGUYÊN FILE quantri3
// ============================================================
console.log('\nPHẦN O — b118d: nguyên file quantri3, không còn #khu-tam');

{
  const PROTO_SECTION = ['gia-pha', 'tree-members', 'tree-invite', 'tree-requests', 'tree-detail',
    'tai-khoan', 'account-detail', 'kiem-duyet', 'kiem-duyet-chitiet', 'quan-tri-he-thong',
    'sys-account-trees', 'public-info-detail', 'sys-default-tree-selector'];
  const thieu = PROTO_SECTION.filter((id) => !HTML.includes('<section id="' + id + '"'));
  kiem('QuanTri.html có ĐỦ 13 section của quantri3, không chép lắt nhắt',
       thieu.length === 0, 'thiếu: ' + thieu.join(', '));
}

kiem('không còn ô vẽ tạm (#khu-tam · data-tam · data-ban-mau)',
     !/id="khu-tam"|data-tam|data-ban-mau/.test(HTML) && !/'khu-tam'/.test(JS_KH),
     'còn chỗ vẽ tạm');

{
  const MAU = ['Thử H9', 'TH957', 'chu@gia-pha.vn', 'Ghi chú cho Claude Code', 'mô phỏng', 'ACC-0'];
  // Soi phần NHÌN THẤY — khối chú thích đầu file được phép kể lại đã bỏ gì.
  const thayDuoc = HTML.replace(/<!--[\s\S]*?-->/g, '');
  const con = MAU.filter((m) => thayDuoc.includes(m));
  kiem('QuanTri.html không còn dữ liệu mẫu hay ghi chú của prototype',
       con.length === 0, 'còn: ' + con.join(' | '));
}

{
  const JS_TC_MUC = doc('../js/pages/quan-tri/trang-cay.js');
  const view = [...(JS_KH + JS_TC_MUC).matchAll(/view:\s*'([a-z0-9-]+)'/g)].map((m) => m[1]);
  const thieu = [...new Set(view)].filter((id) => !HTML.includes('<section id="' + id + '"'));
  kiem('mọi view khai trong khung và MUC_TRANG_CAY đều có section trong QuanTri.html',
       view.length >= 8 && thieu.length === 0, 'không có section: ' + thieu.join(', '));
}

kiem('bảng Thành viên chỉ có người ĐÃ DUYỆT; đơn = chưa duyệt VÀ không phải lời mời',
     /kq\.ds\.filter\(\(t\) => t\.daDuyet\)/.test(JS_TC_SOM) &&
     /kq\.ds\.filter\(\(t\) => !t\.daDuyet && !t\.moiLuc\)/.test(JS_TC_SOM),
     'lời mời lẫn vào bảng — mời người quản trị nhận hộ');

kiem('trang cây hỏi máy chủ ai đổi được quyền, không suy từ vaiTro',
     /coTheQuanTri\(cay\.fileId\)/.test(JS_TC_SOM) && !/vaiTro/.test(boGhiChuJs(JS_TC_SOM)),
     'suy quyền trong trình duyệt — khoá tay chủ cây');

kiem('dòng của CHÍNH MÌNH khoá sẵn mọi việc đổi quyền, kèm lý do (trang cây)',
     /mucMenu\('Gắn \/ đổi mã người', cuaMinh/.test(JS_TC_SOM) &&
     /mucMenu\(t\.tinCay \? 'Tắt tin cậy \(ghi thẳng\)' : 'Bật tin cậy \(ghi thẳng\)', cuaMinh/.test(JS_TC_SOM) &&
     /mucMenu\('Bàn giao chủ sở hữu',\s*cuaMinh/.test(JS_TC_SOM) &&
     /mucMenu\('Xóa khỏi gia phả',\s*cuaMinh/.test(JS_TC_SOM) &&
     /const khoaVai = khongQuyen \|\| cuaMinh/.test(JS_TC_SOM),
     'một việc đổi quyền trên dòng của mình không khoá');

kiem('dòng của CHÍNH MÌNH khoá sẵn mọi việc đổi quyền (trang một tài khoản)',
     /mucMenu\('Gắn \/ đổi mã người', cuaMinh/.test(JS_TTK) &&
     /mucMenu\('Đổi vai trò trong cây',\s*cuaMinh/.test(JS_TTK) &&
     /mucMenu\('Gỡ khỏi gia phả',\s*cuaMinh/.test(JS_TTK),
     'một việc đổi quyền trên tài khoản của mình không khoá');

{
  const hop = ['hoiDoiVai', 'hoiGanNguoi', 'hoiTinCay', 'hoiGo', 'hoiDuyetDon', 'hoiTuChoiDon', 'hoiDeXuatGan'];
  const khong = hop.filter((ten) => {
    const m = JS_TC_SOM.match(new RegExp('export async function ' + ten + '\\([\\s\\S]*?\\n}\\n'));
    return !m || !/cumCay\(cay\)/.test(m[0]);
  });
  kiem('mọi hộp hỏi đổi quyền GỌI TÊN CÂY (luật 5a)',
       khong.length === 0, 'không gọi tên cây: ' + khong.join(', '));
}

kiem('lời mời chưa nhận không có việc NHẬN HỘ ở trang một tài khoản',
     /mucMenu\('Thu hồi lời mời'/.test(JS_TTK) && !/nhanLoiMoi/.test(JS_TTK),
     'nhận hộ người khác — mất chữ ký thứ hai');

kiem('hộp hỏi gỡ bộ nghe ô gợi ý khi đóng (ganGoiY treo lên window)',
     /typeof d\.go === 'function'\) d\.go\(\)/.test(JS_HOP),
     'mỗi lần mở hộp để lại một bộ nghe cuộn/resize');

kiem('sổ tài khoản: dòng của chính mình không có nút cờ nào, không khoá/xoá',
     (JS_QTHT.match(/if \(!t\.laChinhToi\)/g) || []).length >= 3 &&
     /Không tự khóa\/xóa/.test(JS_QTHT),
     'mời người ta tự đặt quyền cho mình');

for (const [ten, ma] of [['khu-kiem-duyet.js', JS_QT], ['trang-tai-khoan.js', JS_TTK]]) {
  kiem(ten + ' không đọc phien.treeId để chọn cây (luật 5a)',
       !/phien\.treeId/.test(boPhepSoCayDangMo(boGhiChuJs(ma))), 'ngầm định cây đang mở');
}

for (const [ten, ma] of [['hop-thoai.js', JS_HOP], ['trang-cay.js', JS_TC_SOM]]) {
  kiem(ten + ' có khối ghi chú đầu file đúng khuôn', ghiChuDauFile(ma), 'thiếu dòng');
  kiem(ten + ' không chạm window.supabase — luật MỘT CỬA', motCua(ma), 'gọi thẳng máy chủ');
  kiem(ten + ' không dùng alert/confirm', !/\b(alert|confirm)\s*\(/.test(boGhiChuJs(ma)), 'dùng hộp thoại trình duyệt');
}

// ⚠ b118d: hai file mã cũ (b106–b118) và `QuanTri_cu.html` đã XOÁ theo lời chủ dự
//   án 16/09/2026. Phép này canh không file nào nạp lại hay nhắc lại tên ấy.
{
  const thuMuc = resolve(DAY, '../js/pages/quan-tri');
  const conNhac = readdirSync(thuMuc).filter((f) => f.endsWith('.js'))
    .filter((f) => /khu-thanh-vien\.js|khu-tai-khoan-he-thong\.js/.test(readFileSync(resolve(thuMuc, f), 'utf8')));
  kiem('mã cũ đã xoá hẳn, không file nào còn nhắc tới',
       !existsSync(resolve(thuMuc, 'khu-thanh-vien.js')) &&
       !existsSync(resolve(thuMuc, 'khu-tai-khoan-he-thong.js')) &&
       !FILE_GOC.includes('QuanTri_cu.html') && conNhac.length === 0,
       'còn: ' + conNhac.join(', '));
}

// ============================================================
// PHẦN G — KIỂM CHỨNG NGƯỢC: bẻ gãy mã rồi xem bài kiểm có bắt được không
// ============================================================
console.log('\nPHẦN G — kiểm chứng ngược (bẻ gãy có chủ ý)');

// G1 — đổi một chữ trong tên tham số. Đây là bẫy số 1, và là ca duy nhất
// hỏng mà màn hình vẫn trông bình thường.
{
  const hong1 = JS_SB.replace("p_trang_thai:", "p_trangthai:");
  const lech = lechThamSo(hong1, SQL_08, 'ds_kiem_duyet');
  kiem('bắt được tên tham số sai một chữ', lech !== null && lech.length > 0,
       'không bắt được — phép ở PHẦN D vô dụng');
}

// G2 — tên file mất chữ hoa. Trên Windows vẫn mở được, trên GitHub Pages thì 404.
{
  const hong2 = JS_ST.replace(/'QuanTri\.html'/, "'quantri.html'");
  kiem('bắt được tên file sai chữ hoa',
       !tenFileTrongMaCoThat(hong2, FILE_GOC), 'không bắt được');
}

// G3 — trang duyệt tự gọi thẳng máy chủ.
{
  const hong3 = JS_QT + '\nconst k = window.supabase.createClient(1, 2);\n';
  kiem('bắt được lời gọi thẳng window.supabase', !motCua(hong3), 'không bắt được');
}

// G4 — đảo thứ tự hai thẻ script.
{
  const hong4 = HTML
    .replace('<script src="js/vendor/supabase.js"></script>', '@@VENDOR@@')
    .replace('<script type="module" src="js/app-quan-tri.js"></script>',
             '<script src="js/vendor/supabase.js"></script>')
    .replace('@@VENDOR@@',
             '<script type="module" src="js/app-quan-tri.js"></script>');
  kiem('bắt được thứ tự hai thẻ script bị đảo', !thuTuScriptDung(hong4),
       'không bắt được');
}

// G5 — điểm khởi động kéo theo bộ vẽ sơ đồ.
{
  const hong5 = JS_APP + "\nimport { mountTreeView } from './pages/tree-view.js';\n";
  kiem('bắt được điểm khởi động kéo theo bộ vẽ', !khongKeoTheoSoDo(hong5),
       'không bắt được');
}

// G6 — đổi tên một class trong JS mà quên đổi trong CSS. Đây là chỗ hỏng câm
// số 7: chữ vẫn đủ, bố cục vỡ, không có lỗi nào.
{
  // b118c: khung chỉ còn MỘT class `qt-` (`qt-canh-bao`) — bẻ đúng class ấy.
  const hong6 = JS_KH.replace("'qt-canh-bao'", "'qt-canh-bao-moi'");
  kiem('bắt được class trong JS không có trong CSS',
       classThieuTrongCss(hong6, CSS).length > 0, 'không bắt được');
}

// G7 — khung tự hỏi bề ngang màn hình, tức bắt đầu có bộ mã thứ hai.
{
  const hong7 = JS_KH + "\nif (window.innerWidth < 680) veHangThe();\n";
  kiem('bắt được nhánh riêng theo bề ngang màn hình', !motBoMa(hong7),
       'không bắt được');
}

// G8 — sửa `#` lạ bằng cách gán lại location.hash: vẽ hai lần, kẹt nút Back.
{
  const hong8 = JS_KH.replace(/window\.history\.replaceState\([^;]*;/,
                              "window.location.hash = khu.ma;");
  kiem('bắt được # lạ bị sửa bằng cách gán lại location.hash',
       !suaHashBangReplaceState(hong8), 'không bắt được');
}

// G9 — trang cây tự quyết quyền bằng `vaiTro` thay vì hỏi máy chủ (hỏng câm 5 —
// khoá tay đúng CHỦ CÂY). b118d: gieo vào `trang-cay.js`.
{
  const hong9 = JS_TC_SOM + "\nconst duoc = phien.vaiTro === 'quan_tri';\n";
  kiem('bắt được trang cây tự suy quyền từ vaiTro',
       /vaiTro\s*===/.test(boGhiChuJs(hong9)), 'không bắt được');
}

// G10 — sai một chữ trong tên tham số của một cửa `13`. Cùng bẫy G1, khác file.
{
  const hong10 = JS_SB.replace('p_user_moi:', 'p_usermoi:');
  const lech = lechThamSo(hong10, SQL_13, 'doi_chu_cay');
  kiem('bắt được tên tham số sai một chữ ở cửa doi_chu_cay',
       lech !== null && lech.length > 0, 'không bắt được — phép ở PHẦN H vô dụng');
}

// G11 — quên khoá việc gắn mã người trên dòng của chính mình. Neo vào TÊN mục
// (bài học G19), không neo thứ tự dòng.
{
  const hong11 = JS_TC_SOM.replace("mucMenu('Gắn / đổi mã người', cuaMinh", "mucMenu('Gắn / đổi mã người', ''");
  kiem('bắt được việc bỏ khoá trên dòng của chính mình',
       !/mucMenu\('Gắn \/ đổi mã người', cuaMinh/.test(hong11), 'không bắt được');
}

// G12 — chép việc đổi quyền sang bản thứ hai ở trang một tài khoản thay vì
// dùng hộp hỏi chung. b118d: gieo vào `trang-tai-khoan.js`.
{
  const hong12 = JS_TTK + "\nconst x = await doiVaiThanhVien(a, b, c);\n";
  const lenh = boGhiChuJs(hong12);
  const tuGoi = ['doiVaiThanhVien', 'goThanhVien', 'doiChuCay']
    .filter((t) => new RegExp('\\b' + t + '\\b').test(lenh));
  kiem('bắt được việc chép việc đổi quyền sang bản thứ hai',
       tuGoi.length > 0, 'không bắt được — phép ở PHẦN M vô dụng');
}

// G13 — nạp lại mã sổ tài khoản cũ vào khu Quản trị hệ thống.
{
  const hong13 = "import { mountToanHeThong } from './khu-tai-khoan-he-thong.js';\n" + JS_QTHT;
  kiem('bắt được việc nạp lại mã sổ tài khoản cũ',
       /khu-tai-khoan-he-thong\.js/.test(boGhiChuJs(hong13)),
       'không bắt được — phép ở PHẦN I vô dụng');
}


// G14 — bỏ cửa thứ BẢY khỏi `dat_duoc_tao_cay()`. Không có phép này thì Quản
// trị hệ thống tự bật cờ cho mình được — chính lỗ hổng b102 đã bắt được một
// lần, ở một cột khác.
{
  const hong14 = SQL_17.replace(/la_chinh_minh/g, 'la_khach_la');
  kiem('bắt được việc bỏ cửa thứ bảy khỏi dat_duoc_tao_cay()',
       !/la_chinh_minh/.test(thanHamSql(hong14, 'dat_duoc_tao_cay') || ''),
       'không bắt được — phép ở PHẦN J vô dụng');
}

// G15 — hộp hỏi đổi quyền thôi gọi tên cây. Hỏng CÂM nhất của b110b: hộp vẫn
// mở, chỉ không nói đang đổi ở cây nào. b118d: bẻ `hoiDoiVai`.
{
  const hong15 = JS_TC_SOM.replace(/(export async function hoiDoiVai\([\s\S]*?)cumCay\(cay\)/, '$1nhanCay(cay)');
  const m = hong15.match(/export async function hoiDoiVai\([\s\S]*?\n}\n/);
  kiem('bắt được hộp đổi vai thôi gọi tên cây',
       Boolean(m) && !/cumCay\(cay\)/.test(m[0]), 'không bắt được — phép ở PHẦN O vô dụng');
}

// G16 — hộp Mời quay lại chọn sẵn cây đầu danh sách. Hỏng câm: lời mời vẫn gửi
// được, chỉ là gửi vào một cây không ai chọn.
{
  const hong16 = JS_TTK.replace("[['', '— chọn gia phả —'],", '[');
  kiem('bắt được việc form Mời chọn sẵn cây đầu danh sách',
       !/\['', '— chọn gia phả —'\]/.test(hong16),
       'không bắt được — phép ở PHẦN J vô dụng');
}


// G17 — bỏ cửa lời mời khỏi một trong bốn cửa. Đây là chỗ hỏng CÂM nhất của
// b110c: mã vẫn chạy, nút vẫn bấm được, chỉ là người chưa đồng ý đã vào cây.
{
  const than = thanHamSql(SQL_18, 'doi_vai_thanh_vien') || '';
  const hong17 = SQL_18.replace(than, than.replace(/la_loi_moi_cho_nhan/g, 'la_chinh_minh'));
  kiem('bắt được việc bỏ cửa lời mời khỏi doi_vai_thanh_vien()',
       !/la_loi_moi_cho_nhan/.test(thanHamSql(hong17, 'doi_vai_thanh_vien') || ''),
       'không bắt được — phép ở PHẦN K vô dụng');
}

// G18 — vá quá tay: bỏ luôn `sao_luu` khỏi đường tắt của `la_thanh_vien()`.
// Đây đúng lỗi b102, và nó không báo gì cả — bản sao lưu đêm chỉ ra file rỗng.
{
  const than = thanHamSql(SQL_18, 'la_thanh_vien') || '';
  const hong18 = SQL_18.replace(than, than.replace(/'sao_luu'/g, "'khong_co_vai_nay'"));
  kiem('bắt được việc vá quá tay, gạt sao_luu khỏi đường tắt',
       !/sao_luu/.test(thanHamSql(hong18, 'la_thanh_vien') || ''),
       'không bắt được — sao lưu đêm hỏng mà bài kiểm vẫn xanh');
}

// G19 — màn hình quay lại mời người ta NHẬN HỘ một lời mời. Neo vào TÊN mục —
// bài học cũ của phép này: `replace` không cờ `g` là phép đo neo vào thứ tự dòng.
{
  const hong19 = JS_TTK.replace("mucMenu('Thu hồi lời mời'",
    "mucMenu('Nhận hộ', '', () => nhanLoiMoi(c.treeId)), mucMenu('Thu hồi lời mời'");
  kiem('bắt được việc nhận hộ lời mời của người khác',
       /nhanLoiMoi/.test(boGhiChuJs(hong19)),
       'không bắt được — phép ở PHẦN I vô dụng');
}

// G20 — trang cây rơi về cây đang mở khi không tìm thấy mã. Neo vào TÊN
// (`c.treeCode === ctx.thamSo`), không neo vào thứ tự dòng — xem G19.
{
  const hong20 = JS_TC.replace(/c\.treeCode\s*===\s*ctx\.thamSo/g,
                               'c.fileId === ctx.phien.treeId');
  kiem('bắt được trang cây ngầm định cây đang mở',
       !trangCayTheoMa(hong20), 'không bắt được — phép ở PHẦN L vô dụng');
}

// G21 — bỏ chỗ gập thanh mục con. b118c: bẻ đúng `.layout{grid-template-columns:1fr}`
// trong `@media(max-width:850px)` của quantri3 (không còn `.qt-layout`).
{
  const hong21 = CSS.replace(
    /(\.layout\s*\{\s*grid-template-columns:\s*)1fr\s*\}/g,
    '$1205px 1fr}');
  kiem('bắt được thanh mục con không gập khi hẹp',
       !layoutGapKhiHep(hong21), 'không bắt được — phép ở PHẦN L vô dụng');
}

// G22 — quên một cửa ở `sb-gia.mjs`. Neo vào TÊN cửa (xem G19), cắt đúng dòng
// `export` của nó chứ không cắt "lần xuất hiện đầu tiên".
{
  const GIA = resolve(DAY, '../../kiem-thu/sb-gia.mjs');
  if (existsSync(GIA)) {
    const hong22 = readFileSync(GIA, 'utf8')
      .replace(/export\s+async\s+function\s+chanCuaToi\b/g, 'async function chanCuaToiCu');
    kiem('bắt được sb-gia.mjs thiếu một cửa',
         tenThieuTrongGia(tenNhapTuSb(), hong22).includes('chanCuaToi'),
         'không bắt được — phép ở PHẦN M vô dụng');
  }
}

// G23 — khu Tài khoản ngầm định cây đang mở.
{
  const hong23 = JS_KTK + '\nconst cay = phien.treeId;\n';
  kiem('bắt được khu Tài khoản đọc phien.treeId',
       !khongDocCayDangMo(hong23), 'không bắt được — phép ở PHẦN M vô dụng');
}

// G24 — đổi mật khẩu mà không hỏi lại mật khẩu cũ.
{
  const hong24 = JS_SB.replace(/await k\.auth\.signInWithPassword\(\{\s*email: nguoi\.email,/g,
                               'await Promise.resolve({ email: nguoi.email,');
  kiem('bắt được doiMatKhau() bỏ bước hỏi mật khẩu cũ',
       !matKhauCuTruoc(hong24), 'không bắt được — phép ở PHẦN M vô dụng');
}

// ------------------------------------------------------------
console.log('\n' + (hong === 0 ? 'TẤT CẢ ĐẠT' : 'CÓ PHÉP HỎNG') +
            ' — ' + dat + ' đạt, ' + hong + ' hỏng.');
process.exitCode = hong === 0 ? 0 : 1;

/**
 * Trang cây tìm cây theo mã trong địa chỉ, và KHÔNG đọc `treeId` ở đâu cả —
 * luật 5a: không màn hình nào ngầm định cây đang mở.
 */
function trangCayTheoMa(js) {
  const lenh = boGhiChuJs(js);
  // ⚠ Đính chính b116: từng cấm bare `treeId` xuất hiện ở BẤT CỨ ĐÂU trong
  //   file — quá tay, vì nó bắt nhầm cả biến địa phương `const treeId =
  //   cay.fileId` và khoá `{treeId, ten, maCay}` của đối tượng `cay` truyền
  //   cho `veBang()` (đúng hình dạng `khu-thanh-vien.js` đã dùng). Luật thật
  //   chỉ cấm đúng MỘT thứ: lấy `phien.treeId` làm cây đang xem.
  return /c\.treeCode\s*===\s*ctx\.thamSo/.test(lenh) &&
    !/phien\.treeId/.test(boPhepSoCayDangMo(lenh));
}

/**
 * Bỏ những phép SO SÁNH với cây đang mở (`=== phien.treeId`) — đó là câu
 * *"cây này có đang hiện ở sơ đồ không"*, không phải chọn cây (luật 5a).
 */
function boPhepSoCayDangMo(lenh) {
  return lenh.replace(/[!=]==\s*(ctx\.)?phien\.treeId/g, '');
}


/** Không dòng LỆNH nào đọc `phien.treeId` — luật 5a. */
function khongDocCayDangMo(js) {
  return !/phien\.treeId/.test(boGhiChuJs(js));
}

/** Trong thân `doiMatKhau()`, `signInWithPassword` đứng trước `updateUser`. */
function matKhauCuTruoc(sb) {
  const m = sb.match(/export async function doiMatKhau\([\s\S]*?\n}\n/);
  if (!m) return false;
  const vao = m[0].indexOf('signInWithPassword');
  const doi = m[0].indexOf('updateUser');
  return vao > -1 && doi > -1 && vao < doi;
}

/**
 * Mọi tên mà trang Quản trị (và màn hình đăng nhập nó nhúng) nhập từ `sb.js`.
 * Đọc thẳng thư mục, không liệt kê tay — liệt kê tay là quên đúng file mới.
 */
function tenNhapTuSb() {
  const thuMuc = resolve(DAY, '../js/pages/quan-tri');
  const ds = readdirSync(thuMuc).filter((f) => f.endsWith('.js'))
    .map((f) => readFileSync(resolve(thuMuc, f), 'utf8'));
  ds.push(doc('../js/pages/dang-nhap.js'));
  const ten = new Set();
  for (const js of ds) {
    for (const m of js.matchAll(/import\s*\{([^}]*)\}\s*from\s*'(?:\.\.\/)+services\/sb\.js'/g)) {
      for (const t of m[1].split(',').map((x) => x.trim()).filter(Boolean)) ten.add(t);
    }
  }
  return [...ten];
}

function tenThieuTrongGia(dsTen, jsGia) {
  const co = new Set([...jsGia.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+(\w+)/g)]
    .map((m) => m[1]));
  return dsTen.filter((t) => !co.has(t));
}

/**
 * Có một `@media (max-width…)` gập `.qt-layout` thành một cột. Tách theo
 * `@media` rồi soi từng khúc, để quy tắc gốc (205px + 1fr) không khớp nhầm.
 */
// ⚠ Đổi b118c: vỏ trang chi tiết dùng `.layout` › `.subnav` của quantri3, gập
//   thành một cột ở `@media(max-width:850px)` bằng `.layout{grid-template-columns:1fr}`.
function layoutGapKhiHep(css) {
  return css.split('@media').slice(1).some((k) =>
    /^\s*\(max-width/.test(k) &&
    /\.layout\s*\{[^}]*grid-template-columns:\s*1fr/.test(k));
}

// ============================================================
// Hàm phụ
// ============================================================

function kiem(ten, dieuKien, chiTiet) {
  if (dieuKien) { dat++; console.log('  ĐẠT  ' + ten); }
  else { hong++; console.log('  HỎNG ' + ten + '  →  ' + chiTiet); }
}

/** Bỏ mọi dòng ghi chú `--` để phép soi không "đạt" nhờ chính lời giải thích. */
function boGhiChu(sql) {
  return sql.split('\n').filter((d) => !/^\s*--/.test(d)).join('\n');
}

/** Thẻ vendor phải đứng trước thẻ module — nếu không, `window.supabase` chưa có. */
function thuTuScriptDung(html) {
  // ⚠ Tìm chính THẺ, không tìm tên file trần: tên `js/vendor/supabase.js` còn
  //   nằm trong khối #loi ở đầu trang (câu *"Thiếu file …"*), và bắt trúng chỗ
  //   ấy thì phép này luôn "đạt" dù hai thẻ có đảo chỗ cho nhau. PHẦN G bẻ ra
  //   đúng cái bẫy ấy, và lần đầu chạy nó đã bắt được bản viết vội này.
  const v = html.search(/<script\s+src="js\/vendor\/supabase\.js">/);
  const m = html.search(/<script\s+type="module"/);
  return v > -1 && m > -1 && v < m;
}

/**
 * Luật một cửa: chỉ `services/sb.js` được chạm `window.supabase`, và không
 * file nào ngoài nó được gọi `.rpc(`.
 * ⚠ Bỏ ghi chú `//` trước khi soi — nhắc TÊN trong ghi chú thì không tính,
 *   đúng như `/kiem-tra` phép 2 quy định.
 */
function motCua(js) {
  const lenh = boGhiChuJs(js);
  return !/window\.supabase/.test(lenh) && !/\.rpc\s*\(/.test(lenh);
}

/**
 * Bỏ mọi dòng ghi chú `//` và `*` trước khi soi LỆNH.
 *
 * ⚠ Không bỏ thì phép nào cũng "đạt" — hoặc "hỏng" — nhờ chính đoạn ghi chú
 *   giải thích nó. Bẫy này đã có tiền lệ ở `kiem-sao-luu.mjs`, và nó vồ đúng
 *   file này ngay lần chạy đầu: câu ghi chú *"app này không dùng confirm()"*
 *   trong `quan-tri.js` làm phép cấm `confirm(` báo hỏng trên một file không
 *   hề gọi `confirm` một lần nào.
 */
function boGhiChuJs(js) {
  return js.split('\n').filter((d) => !/^\s*(\/\/|\*|\/\*)/.test(d)).join('\n');
}

/** Điểm khởi động chỉ được kéo theo màn hình của chính nó. */
function khongKeoTheoSoDo(js) {
  const lenh = boGhiChuJs(js);
  return !/from\s+'\.\/pages\/(tree-view|khoi-dong)\.js'/.test(lenh);
}

/** Khối ghi chú sáu dòng của `CLAUDE.md` mục 6. */
function ghiChuDauFile(js) {
  const dau = js.slice(0, 700);
  return /Vai trò\s+:/.test(dau) && /Lớp\s+:/.test(dau) &&
         /Phụ thuộc:/.test(dau) && /Phiên bản:/.test(dau);
}

/** Tham số của một hàm SQL: `[{ ten, coMacDinh }]`, hoặc `null` nếu không thấy. */
function thamSoSql(sql, ten) {
  const re = new RegExp('create\\s+or\\s+replace\\s+function\\s+public\\.' +
                        ten + '\\s*\\(([\\s\\S]*?)\\)\\s*returns', 'i');
  const m = sql.match(re);
  if (!m) return null;
  return m[1].split(',').map((p) => p.trim()).filter(Boolean).map((p) => ({
    ten: (p.match(/^([a-z_]+)/i) || [])[1] || '',
    coMacDinh: /\bdefault\b/i.test(p),
  }));
}

/** Tên các khoá truyền vào một lời gọi `.rpc('<ten>', { … })`. */
function khoaRpc(js, ten) {
  const m = js.match(new RegExp("\\.rpc\\(\\s*'" + ten + "'\\s*,\\s*\\{([\\s\\S]*?)\\}"));
  if (!m) return null;
  return [...m[1].matchAll(/(p_[a-z_]+)\s*:/g)].map((x) => x[1]);
}

/**
 * So khoá trình duyệt gửi lên với tham số hàm SQL nhận vào. Trả mảng lời kể
 * chỗ lệch — rỗng là khớp, `null` là không tìm thấy một trong hai bên.
 *
 * Hai chiều đều phải soát:
 *   · khoá thừa  → Supabase không tìm thấy hàm nào có chữ ký ấy → lỗi câm.
 *   · thiếu tham số KHÔNG có `default` → cùng một kiểu hỏng.
 */
function lechThamSo(js, sql, ten) {
  const cua = thamSoSql(sql, ten);
  const goi = khoaRpc(js, ten);
  if (!cua || !goi) return null;

  const tenCua = cua.map((p) => p.ten);
  const loi = [];
  for (const k of goi) {
    if (!tenCua.includes(k)) loi.push('gửi thừa/sai tên ' + k);
  }
  for (const p of cua) {
    if (!p.coMacDinh && !goi.includes(p.ten)) loi.push('thiếu tham số bắt buộc ' + p.ten);
  }
  return loi;
}

function coCapQuyen(sql, ten) {
  return new RegExp('grant\\s+execute\\s+on\\s+function\\s+public\\.' + ten +
                    '\\s*\\([^)]*\\)\\s*to\\s+authenticated', 'i').test(sql);
}

/**
 * Mọi chuỗi `'<gì đó>.html'` trong mã phải trỏ tới một file CÓ THẬT ở gốc
 * repo, đúng từng chữ hoa. Đây là phép duy nhất bắt được lỗi chữ hoa trên máy
 * Windows — nơi `quantri.html` vẫn mở ra đúng file.
 */
function tenFileTrongMaCoThat(js, dsFile) {
  const ds = [...js.matchAll(/'([A-Za-z0-9_-]+\.html)'/g)].map((m) => m[1]);
  return ds.length > 0 && ds.every((f) => dsFile.includes(f));
}

/**
 * Hàm vẽ khu phải sửa `#` lạ bằng `replaceState`, KHÔNG bằng cách gán lại
 * `location.hash`. Gán vào nó đẻ ra một `hashchange` nữa — vẽ hai lần — và
 * thêm một mục vào lịch sử, khiến nút Back quay về đúng cái `#` vừa bỏ đi.
 *
 * ⚠ Chỉ soi trong THÂN hàm `veKhu`. Chỗ khác gán `location.hash` là đúng:
 *   cú bấm vào nút điều hướng chính là phải gán nó.
 */
function suaHashBangReplaceState(js) {
  const m = js.match(/function veKhu\([\s\S]*?\n}\n/);
  if (!m) return false;
  const than = boGhiChuJs(m[0]);
  return /replaceState/.test(than) && !/location\.hash\s*=/.test(than);
}

/**
 * Cắt lấy THÂN của một hàm SQL — từ `create … function public.<tên>` tới dấu
 * `$$;` đóng đầu tiên. Trả `null` nếu không thấy.
 *
 * ⚠ Có hàm này vì một biểu thức `<tên>[\s\S]*?<chữ cần tìm>` **không dừng ở
 *   cuối hàm**: dấu `*?` lười thì lười, nhưng nếu chữ ấy không có trong thân
 *   hàm nó vẫn chạy tiếp sang hàm sau để tìm cho ra. Phép *"ds_gia_pha() không
 *   còn nhánh la_thanh_vien"* báo HỎNG trên một file đúng đúng vì lẽ đó.
 */
function thanHamSql(sql, ten) {
  const m = new RegExp(
    'create\\s+(?:or\\s+replace\\s+)?function\\s+public\\.' + ten + '\\s*\\(',
    'i').exec(sql);
  if (!m) return null;
  const ket = sql.indexOf('$$;', m.index);
  return sql.slice(m.index, ket === -1 ? sql.length : ket);
}

/**
 * Một danh sách khu, hai cách vẽ đổi bằng `@media` — chứ không phải hai bộ
 * mã. File khung không được hỏi màn hình rộng bao nhiêu.
 */
function motBoMa(js) {
  const lenh = boGhiChuJs(js);
  return !/innerWidth/.test(lenh) && !/matchMedia/.test(lenh);
}

/**
 * Mọi class `qt-…` mà `khung.js` gán vào DOM phải có mặt trong
 * `quan-tri.css`. Trả mảng những class thiếu.
 *
 * Đây là phép duy nhất bắt được chỗ hỏng câm số 7 — đổi tên class một bên
 * mà quên bên kia thì trang vẫn hiện đủ chữ, chỉ là bố cục vỡ, và không có
 * một câu lỗi nào ở đâu cả.
 */
function classThieuTrongCss(js, css) {
  const dung = new Set();
  for (const m of js.matchAll(/'(qt-[a-z-]+)'/g)) dung.add(m[1]);
  const co = new Set();
  for (const m of css.matchAll(/\.(qt-[a-z-]+)/g)) co.add(m[1]);
  return [...dung].filter((c) => !co.has(c));
}
