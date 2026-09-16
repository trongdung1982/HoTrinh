# Sổ tay · phân quyền

Gồm      : `luoc-do/11-quyen-he-thong.sql` — bảng `tai_khoan`, hai cờ · `13-quan-ly-thanh-vien.sql` — `co_the_quan_tri` · `la_chinh_minh` · `la_chu_cay` · `14-loi-moi.sql` — mời vào cây · `16-thung-rac-cay.sql` — xoá cây · `18-hai-chu-ky.sql` — vá bốn cửa · `21-de-xuat-gan-nguoi.sql` · `23-bon-luat-moi.sql` — **bản đứng CUỐI của 13 hàm**
Liên quan: `THIET-KE-NHIEU-CAY.md` mục 11 · `DU-LIEU.md` mục 2 · `HUONG-DAN-PHAN-QUYEN.md` · bàn thử: `../kiem-thu/ban-thu-sql/do-b102`→`do-b118b`

## Luật chung

- **Bốn hạng, đừng gộp**: Quản trị hệ thống = cờ `tai_khoan` · Chủ cây = cột
  `trees.chu_so_huu` · Quản trị gia phả = `tree_members.role='quan_tri'`, **chỉ
  sửa + duyệt nội dung, KHÔNG đổi quyền** · Được dựng cây = cờ `duoc_tao_cay`,
  **không mẩu quyền nào** trên cây đang có.
- **Không ai đặt quyền cho chính mình.** Mọi cửa đổi quyền hỏi `la_chinh_minh()`.
- **Hàm gác cửa viết dạng KHẲNG ĐỊNH và bọc `coalesce(…, false)`.** Không có
  dòng thì `select` trả `null`, và `null` trong `and`/`or` cho ra `null` chứ
  không cho ra `false`. Lỗ leo quyền 04/09 sinh ra đúng từ đó, 57 phép kiểm báo
  xanh suốt.
- **`drop function` xoá cả `grant`.** Dựng lại hàm đã có thì chép theo cả dòng
  `grant`, không thì nó rơi về mặc định Postgres *ai cũng gọi được, kể cả `anon`*.
- **`23` đứng CUỐI mọi chuỗi dán lại.** Dán lại `11`/`14`/`16`/`18`/`20` mà quên
  `23` là mở lại khoá mềm, mở lại lời mời QTHT thành quyền thật, mở lại cây đã
  xoá — cả ba đều **im lặng**.

## Bài học

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
