# Sổ tay · phân quyền

Gồm      : `luoc-do/11-quyen-he-thong.sql` — bảng `tai_khoan`, hai cờ · `13-quan-ly-thanh-vien.sql` — `co_the_quan_tri` · `la_chinh_minh` · `la_chu_cay` · `14-loi-moi.sql` — mời vào cây · `16-thung-rac-cay.sql` — xoá cây · `18-hai-chu-ky.sql` — vá bốn cửa · `21-de-xuat-gan-nguoi.sql` · `23-bon-luat-moi.sql` — **bản đứng CUỐI của 13 hàm**
Liên quan: `THIET-KE-NHIEU-CAY.md` mục 11 · `DU-LIEU.md` mục 2 · `HUONG-DAN-PHAN-QUYEN.md` · bàn thử: `../kiem-thu/ban-thu-sql/do-b102`→`do-b118b`

## Luật chung

- **Bốn hạng, đừng gộp**: Quản trị hệ thống = cờ `tai_khoan` · Chủ cây = cột
  `trees.chu_so_huu` · Quản trị gia phả = `tree_members.role='quan_tri'`, **chỉ
  sửa + duyệt nội dung, KHÔNG đổi quyền** · Được dựng cây = cờ `duoc_tao_cay`,
  **không mẩu quyền nào** trên cây đang có.
- **Không ai đặt quyền cho chính mình.** Mọi cửa đổi quyền hỏi `la_chinh_minh()`.
- **Từ b94, admin duyệt là hàng rào THẬT; luật trực hệ chỉ còn là bộ lọc** giúp
  admin đỡ phải đọc những đề nghị chắc chắn bị từ chối. Câu này hay bị mô tả
  ngược — đừng viết ngược lại.
- **Hàm gác cửa viết dạng KHẲNG ĐỊNH và bọc `coalesce(…, false)`.** Không có
  dòng thì `select` trả `null`, và `null` trong `and`/`or` cho ra `null` chứ
  không cho ra `false`. Lỗ leo quyền 04/09 sinh ra đúng từ đó, 57 phép kiểm báo
  xanh suốt.
- **`drop function` xoá cả `grant`.** Dựng lại hàm đã có thì chép theo cả dòng
  `grant`, không thì nó rơi về mặc định Postgres *ai cũng gọi được, kể cả `anon`*.
- **`05` phải đứng TRƯỚC `06`.** `05` đặt lại ràng buộc vai **thiếu `quan_tri`**
  (nó có trước khi vai ấy ra đời), `06` mới thêm vào. Đảo hai file là tự tay bỏ
  vai quản trị viên khỏi danh sách hợp lệ.
- **Dán lại riêng `06` hay `07` sẽ âm thầm mở rộng `quan_tri` trở lại** — `08`
  mục 8 định nghĩa lại ba hàm của hai file ấy cho hẹp hơn. Dán lại chúng thì dán
  lại cả `08`, rồi `18`, rồi `23`.
- **`23` đứng CUỐI mọi chuỗi dán lại.** Dán lại `11`/`14`/`16`/`18`/`20` mà quên
  `23` là mở lại khoá mềm, mở lại lời mời QTHT thành quyền thật, mở lại cây đã
  xoá — cả ba đều **im lặng**.

### Chuỗi dán lại — bản DUY NHẤT

Dán lại file bên trái thì phải dán tiếp các file bên phải, đúng thứ tự:

- `11`/`10`→`14`→`16`→`18`→**`23`** · `13`/`14`→`15`→`20`→**`23`** · `08`→`18`
- `21`/`13`/`18`/`27`→**`29`** — `29` giữ bản cuối của `duyet_de_xuat_gan()` và
  `gan_nguoi_cho_thanh_vien()`.
- `03`/`06`/`08`/`13`→`25`→`27`→**`28`** — `28` giữ bản cuối của `luu_cay()` và
  `tu_choi_thay_doi()`, khác `27` chín chỗ. Dán lại `27` sau `28` là mất cả
  chín, **không một lời báo**.
- **Sau `26` KHÔNG dán lại `02`/`11`** — luật đọc trên bảng người của chúng hỏi
  `tree_id` đã bỏ; bản đứng cuối của bốn luật ấy ở `26` mục 5.
- `34`→`35`→`36`→`37`→`38` (b126) — một chuỗi (`35` bỏ `p_tree` ở ba hàm đơn
  gắn mã `sb.js` còn gọi). `36` giữ bản cuối của `duyet_de_xuat_gan()` +
  `gan_nguoi_tai_khoan()`. `38` sửa `ds_tai_khoan_he_thong()`, một mã.

### File phụ thuộc cột mới phải tự chặn khi dán sai thứ tự (26/09)

Dán `37` trước `34` thì Postgres chỉ nói *"column … does not exist"*; dòng
*"Chạy SAU …"* không ai đọc lúc dán. Nay `35`/`36`/`37` mở đầu bằng khối
`do $$` hỏi thứ mình cần, thiếu thì `raise` câu tiếng Việt chỉ file phải dán
trước — trong `begin`, cả file lùi. Đo: `do-b126c.mjs` Q1–Q5.

## Nới hẹp luật tự duyệt — `29` (b124c, 23/09/2026)

Luật mới, một câu: **người nộp đơn gắn mã cho chính mình tự duyệt được khi và
chỉ khi họ đã là chủ cây, hoặc `quan_tri` của chính cây ấy.** Mọi ca khác —
gồm QTHT ở cây họ chưa có vai — vẫn cần chữ ký thứ hai. Lý lẽ và ba hướng đã
cân: `THIET-KE-NHIEU-CAY.md` 11.10.

- Hàm mới `la_quan_tri_cay(p_tree, p_user)` đọc thẳng `trees.chu_so_huu` +
  `tree_members`. ⚠ **KHÔNG được hỏi `vai_tro()`**: nó trả `'quan_tri_he_thong'`
  ở nhánh ĐẦU TIÊN, nên một QTHT không có chân trong cây vẫn "là quản trị cây
  ấy" — đúng cái nhầm 11.10 cảnh báo, và nó bỏ chữ ký thứ hai ở MỌI cây.
- Phải nới **cả hai lớp**: `duyet_de_xuat_gan()` (cửa thứ tám) và
  `gan_nguoi_cho_thanh_vien()` — cửa thứ tám cố ý đi qua hàm sau, nới một lớp
  là hỏng nửa vời, kèm câu từ chối nói về chuyện khác.
- `tu_choi_de_xuat_gan()` **không** nới: tự rút đơn đã là đường có sẵn.
- Trình duyệt hỏi `sb.laQuanTriCay()`, KHÔNG suy từ `coTheQuanTri()` — hàm ấy
  bật cho cả QTHT.
- ⚠ **Nhánh `quan_tri` chưa với tới được**, nói thẳng: hai hàm vẫn mở đầu bằng
  `co_the_quan_tri()`, mà hàm ấy chỉ nhận QTHT hoặc chủ cây. Giữ nhánh là giữ
  đúng câu đã chốt và giữ sẵn cho ngày `co_the_quan_tri()` được nới — **đừng
  viết vào báo cáo rằng nó đã đo**. Muốn quản trị gia phả xét được đơn gắn mã
  là một việc KHÁC, chưa chốt. Đo: `do-b124c.mjs` B6b.
- ⚠ **`21` không dán lại một mình được nữa** (đo 23/09): `ds_de_xuat_gan()` của
  nó còn nối `persons.tree_id`, cột `26` đã bỏ — lỗi to tiếng, `27` là chỗ vá.
  Bài đo dựng lại ĐÚNG MỘT hàm bản cũ thay vì dán lại cả file.

## Bài học

### Gốc phạm vi trực hệ phải THUỘC CÂY (b122a)

`pham_vi_sua()` bản `06` nhận `p_goc` vô điều kiện — an toàn khi khoá ngoại
`(tree_id, person_id)` của `tree_members` bảo đảm gốc nằm trong cây. `26` bỏ khoá
ấy, nên gốc trỏ sang người cây khác thì chính người đó lọt vào phạm vi sửa từ cây
này. `27` chữa ở hai đầu: `pham_vi_sua` gốc ngoài cây → rỗng, và bốn cửa gắn mã
(`moi_vao_cay` · `gan_nguoi_cho_thanh_vien` · `duyet_thanh_vien` ·
`nop_de_xuat_gan`) hỏi `tree_persons`. ⚠ Bỏ một khoá ngoại là phải đi tìm mọi
hàm từng dựa vào nó — `moi_vao_cay` không có trong danh sách 20 hàm của b121.
Đo: `do-b122.mjs` L9 · G1–G5.

### Luật đọc gọi hàm cho TỪNG DÒNG là chậm — viết `cột in (select ds_…())`

Hàm `security definer` viết bằng SQL không được Postgres gộp vào câu truy vấn,
nên `using (co_the_xem_cay(tree_id))` lập kế hoạch lại mỗi dòng (~8ms trên bàn
thử). Bản đầu của `26`: đọc cây 740 người 11 giây, luật hôn nhân nối bằng `or`
treo **15 phút** — mà đúng về kết quả, bảng tự kiểm vẫn 8/8. `26` chữa bằng hàm
trả DANH SÁCH (`ds_cay_xem_duoc` · `ds_nguoi_xem_duoc` · `ds_hon_nhan_xem_duoc`):
không phụ thuộc dòng nên tính một lần mỗi câu → 1,2 giây. ⚠ Bảy luật của `11`
trên `trees` · `sources` · `change_log`… vẫn gọi-từng-dòng — chưa đo, đừng coi
là nhanh. Gác: `do-b121.mjs` R7.

### Một nới ở hàm nền móng chỉ an toàn nhờ một hàng rào ở ĐẦU KIA

`23` thêm `not bi_khoa()` vào `la_thanh_vien()` — đúng hàm mà `16` dặn *"đừng
động vào"*, vì bản sao lưu đêm đi qua nó. Thêm được là nhờ **`khoa_tai_khoan()`
từ chối khoá tài khoản mang vai `sao_luu`**: máy sao lưu không bao giờ bị khoá
nên mệnh đề mới vĩnh viễn không chạm tới nó.

⚠ Hai thứ ấy là **một cặp**. Ai bỏ hàng rào `sao_luu` ở `khoa_tai_khoan()` sau
này sẽ mở lại lỗ hổng b102 ở một file khác, cách đó 400 dòng: bản sao lưu đêm
vẫn chạy, vẫn sinh file, vẫn đủ chín bảng, chỉ là rỗng. Bàn thử canh bằng Q5 +
Q6 của `do-b118b.mjs` — **phải chạy cả hai**, Q5 một mình không nói gì.

### Phép "không tắt người cuối cùng" phải TRỪ người đang bị đụng ra

Bản `14` đếm `count(*) where la_quan_tri_he_thong = true`, kể cả chính người
sắp bị hạ cờ. Cộng với luật khoá mềm thì nó đẻ ra một lời **từ chối SAI**, đo
được: QT1 và QT2 đều là QTHT, QT1 khoá QT2 → chỉ QT1 còn đứng; nay QT1 muốn hạ
nốt cờ của QT2 *(người đang bị khoá, không phục vụ gì)* thì phép đếm trả về 1
và chặn — trong khi hạ xong vẫn còn nguyên QT1. `so_qtht_dung_tru(p_user)` chữa
đúng chỗ đó (`do-b118b.mjs` Q8).

⚠ **Và nói thẳng điều bàn thử KHÔNG chứng minh được:** nhánh từ chối ấy hôm nay
**không với tới được** — người gọi bắt buộc là QTHT còn đứng và không trỏ vào
chính mình được, nên phép đếm luôn ≥ 1. Giữ nó là giữ một đai an toàn cho ngày
hàng rào người gọi bị nới, **không phải** một hàng rào đã được đo. Đừng viết
vào báo cáo rằng nó đã đo.

### Bảng tự kiểm cuối file SQL cũng hỏng được, và nó hỏng theo hướng tệ

`information_schema.columns` **không liệt kê cột trả về của hàm trả bảng** — nó
trả 0 dòng. Phép 13 của `23` viết theo bảng ấy báo **HỎNG trong khi hàm hoàn
toàn đúng**: một phép kiểm sai đẩy người đọc đi sửa thứ không hỏng, tệ hơn là
không có phép kiểm. Đếm cột hàm trả bảng bằng `pg_proc.proallargtypes`.

Cùng họ với bài học `14` mục 7 *(bảng tự kiểm 5/5 ĐẠT che một hàm hỏng hẳn vì
nó chỉ hỏi "hàm có tồn tại không")*: **bảng tự kiểm hỏi hình dạng, bàn thử hỏi
hành vi.** Không cái nào thay được cái nào.

### Hai chữ ký thi hành bằng HÌNH DẠNG DỮ LIỆU, không bằng mệnh đề

Lỗ hổng b110c thủng ở bốn cửa một lúc vì luật *"lời mời chưa nhận không mang
quyền"* nằm ở bốn mệnh đề `if` rời nhau, và bốn chỗ ấy đều quên được.

`23` đặt lời mời QTHT ở **hai cột riêng** (`qtht_moi_luc` · `qtht_moi_boi`),
tách hẳn khỏi cờ thật `la_quan_tri_he_thong`. Nên `la_quan_tri_he_thong()` vẫn
chỉ đọc đúng một cột như cũ và **không có đường nào** để một lời mời lọt vào
đó — không phải nhờ ai nhớ viết thêm một mệnh đề. `do-b118b.mjs` Q14a–Q14e đo
đúng câu ấy.

### Khoá mềm: không đẻ cột `khoa_den`

60 ngày là một **phép tính** trên `khoa_luc`, y như `16` không giữ cột "ngày dọn
được". Hai chỗ ghi cùng một hạn là hai chỗ để lệch nhau, và chỗ lệch ấy không ai
đọc ra bằng mắt. ⚠ Và hết 60 ngày **không tự mở khoá** — khoá đứng tới khi có
người mở tay hoặc xoá hẳn; 60 ngày chỉ là lúc cánh cửa xoá hẳn mở ra.

### Đổi luật ở SQL là đổi hành vi của nút đang chạy, không phải lỗi

`23` giữ tên `xin_xoa_cay()` · `huy_xin_xoa_cay()` nhưng đổi hẳn nghĩa, và
`dat_quan_tri_he_thong(x, true)` nay **không bật cờ nữa** — nó gửi lời mời.
Màn hình cũ đọc `ok:true` rồi vẽ *"đã bật"* là **nói dối**, và không có gì báo
lỗi. Bảng bốn nút ấy nằm ở mục `b118c` của `KE-HOACH.md`; dán `23` lên máy chủ
THẬT trước khi làm b118c là tự tay dựng ra bốn màn hình nói sai.
