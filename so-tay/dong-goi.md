# Sổ tay · Đóng gói bộ cài để bàn giao

*Mở từ b169 (03/10/2026). Ghi theo chức năng — bẫy gặp ở đâu thì ghi vào đây.*

Bộ cài là bản **RA RIÊNG**, nằm ở `Claude_Code/ban-giao/` (**ngoài repo**).
Repo `supabase/` giữ nguyên ghi chú để tiếp tục phát triển.
Người nhận **tự cài**, nhận **file zip** + hướng dẫn cài + hướng dẫn sử dụng.

## SQL một file — `ban-giao/cai-dat.sql`

Sinh bằng máy, **đừng sửa tay**. Thêm file `luoc-do/68…` thì chạy lại:

```
node kiem-thu/ban-thu-sql/dong-goi-sql.mjs      # dựng · kết xuất · cài · so (~1 phút)
node kiem-thu/ban-thu-sql/so-song-cai-dat.mjs   # chạy lại cả bộ do-*.mjs hai nền (~25 phút)
```

Hai công cụ ở `kiem-thu/ban-thu-sql/` (ngoài repo), cùng `lot-ghi-chu-sql.mjs`.
Thêm file thì đổi hằng `CUOI` ở **cả hai** công cụ (đang là `68`).

**Đạt nghĩa là:** kết xuất lược đồ + quyền + trigger `auth.users` + luật kho ảnh
của bản cài **trùng từng ký tự** với chuỗi `01→CUOI` (sau khi lột ghi chú cả hai);
chuỗi trống trùng chuỗi có dữ liệu; mọi hàm dựng lại được khi BẬT kiểm thân
hàm; cả bộ `do-*.mjs` ra **giống hệt từng dòng** trên hai nền cùng dữ liệu.

## Mã web đã lột — `ban-giao/web/`

Sinh bằng máy, **đừng sửa tay**. Sửa mã trong `supabase/` xong thì chạy lại:

```
node kiem-thu/dong-goi-web.mjs     # lột ra ban-giao/web/ + tự kiểm (~1 phút)
node kiem-thu/chay-ban-giao.mjs    # lột ra thư mục tạm, chạy cả bộ chay-supabase trên đó
```

Chỉ lấy file **git đang theo dõi**. Lột: `js/` · hai trang `.html` (cả
`<script>`/`<style>` trong trang) · bốn `.css` · `ham-may-chu/…/index.ts` ·
`sao-luu/SaoLuu.gs` · `sao-luu/khoi-phuc.mjs`. Chép nguyên: `js/vendor/` (giấy
phép thư viện phải đi theo) · `robots.txt`. Bỏ hết phần còn lại, kể cả
`DOC-VENDOR.md` và `HUONG-DAN-SAO-LUU.md` (viết cho chủ dự án — b171 viết lại
cho người nhận). `js/cau-hinh.js` giao đi với bốn giá trị **để trống** và đầu
file là hướng dẫn điền ngắn; `chay-ban-giao.mjs` giữ giá trị thật để chạy kiểm.

**Đạt nghĩa là:** công cụ tự kiểm qua (lột hai lần như một · bỏ khoảng trắng
của mã thì gốc trùng bản lột · `node --check`) VÀ `chay-ban-giao.mjs` ra
**giống hệt từng dòng** `chay-supabase.mjs` (03/10/2026: 464/464 dòng, 59/59
đạt; 2.382 KB → 1.250 KB). Đã chứng minh bộ kiểm đọc bản lột thật: cố ý làm
hỏng một hàm trong bản lột → bài Node và bài Chrome đều đỏ.

- ⚠ **Bộ kiểm không mở `index.html`/`QuanTri.html`** — hai trang chỉ được gác
  bằng tự kiểm khung xương. Đổi luật lột HTML thì mở tay bản lột một lần.
- ⚠ Ghi chú JS thay bằng cách (một dòng) / xuống dòng (nhiều dòng, giữ luật tự
  chèn `;`). HTML/CSS thay bằng rỗng — ghi chú CSS kẹp giữa hai ký tự
  (`0/*x*/auto`) thì công cụ báo, vì lột ra `0auto` là đổi nghĩa.
- ⚠ Regex hay dấu chia đoán theo token đứng trước; `/` ngay sau `}` thì báo
  "chỗ phải đoán" để xem tay (03/10/2026: không có chỗ nào).
- ⚠ Dropbox khoá `ban-giao/web/` vừa ghi → `EPERM` khi xoá; công cụ thử lại 15 lần.
- `sang-supabase.mjs` nhận `GIAPHA_JS_DICH` = thư mục `js/` khác để đo.

## Bẫy

- ⚠ **Quyền mặc định Supabase.** Bàn thử `00` không có nó → kết xuất quyền mất
  mọi `revoke` (revoke cái chưa cấp không để dấu). Công cụ chạy
  `alter default privileges … to anon, authenticated, service_role` trước, và
  file cài viết quyền **tường minh**: revoke cả bốn vai rồi cấp lại đúng.
  Nhờ vậy file cài không phụ thuộc dự án mới của người nhận có tự cấp hay không.
- ⚠ **`maintain` chỉ có từ Postgres 17.** Không bao giờ viết tên nó ra — đủ bộ
  thì `grant all`; thiếu vài quyền thì `grant all` + `revoke` phần thiếu.
- ⚠ **pg_dump 17** in `\restrict`, `SET transaction_timeout`, `CREATE SCHEMA
  public` — SQL Editor không nhận, công cụ bỏ. Dữ liệu đi bằng `INSERT`.
- ⚠ **pg_dump: có `-t` thì `-n` bị bỏ qua** — kết xuất dữ liệu phải hai lượt.
- ⚠ **Không chạy bài đo kiểu "dán tiếp chuỗi" trên bản cài.** Dán file cũ chồng
  lên bản cuối hỏng ở `24` · `25` · `47` (đo 03/10/2026). Vì thế so song song:
  hai mẫu đã ở trạng thái cuối, `luoc-do/*.sql` thay bằng câu rỗng.
  Bài cũ dựng trạng thái giữa chừng (cột `tree_members.person_id` đã bỏ ở `63`)
  dừng sớm ở **cả hai** bên — phép so vẫn đúng, chỉ phủ ít hơn.
- ⚠ **Dòng tự kiểm cuối của `62` vẫn báo HỎNG** khi đóng gói — đúng, không phải
  lỗi: lúc `62` chạy thì `anon` còn gọi được `duyet_thanh_vien` (`06` chỉ revoke
  `public`). `68` vá sau đó; tự kiểm của `68` mới là dòng phải ĐẠT.
  Bài học: hàm mới phải `revoke … from public, anon` — Supabase cấp thẳng cho
  `anon` qua quyền mặc định, revoke riêng `public` không đủ.

## Hai hướng dẫn cho người nhận — `ban-giao/HUONG-DAN-CAI-DAT.md` · `HUONG-DAN-SU-DUNG.md`

Viết TAY (không sinh bằng máy), nằm cạnh `cai-dat.sql` + `web/`. Mười bước cài: dự án
Supabase · dán SQL · `cau-hinh.js` · QTHT đầu tiên · Pages · URL Configuration · cây đầu
tiên · sao lưu · hàm `tao-tai-khoan` · tên miền riêng. Đổi tính năng chạm vào bước nào
thì sửa chữ ở đó.

## Cài thử thật — 03/10/2026, ĐẠT hết mười bước (chủ dự án làm theo chữ)

- SQL Editor **nhận** file 373 KB một lượt. Kết quả hiện ô **`set_config`** (kết quả dòng
  đầu file) — không phải lỗi. Trigger `auth.users` + luật kho ảnh tạo được ở dự án mới.
  Đo REST: đủ bảng · `anon` nhận `false` · `mo_phien` đúng.
- ⚠ **QTHT đầu tiên không có sẵn**: trigger chỉ tạo dòng `tai_khoan`; hướng dẫn bước 4b
  `update … la_quan_tri_he_thong = true`.
- ⚠ **Máy sao lưu vào cây SAU khi có cây** — trigger `them_may_sao_luu` chép từ dòng
  `sao_luu` đã có; hệ thống trống thì câu `insert` không thêm gì. Câu lệnh tra UID theo
  email (người nhận từng dán email vào chỗ UID → lỗi `uuid`).
- ⚠ Hai lỗi chỉ hiện ở bản cài MỚI, đã vá ở mã gốc: QTHT + chưa có cây → `napCay()` ném
  *"Chưa biết đang mở gia phả nào"* dưới tiêu đề lỗi mạng (nay màn *"chưa có gia phả
  nào"*) · hàm `tao-tai-khoan` chưa dán → 404 không kèm CORS → `fetch` ném TypeError, app
  báo "không nối được máy chủ" (nay nói thẳng "chưa dán Edge Function").
- ⚠ Bản cài thử là kho GitHub RIÊNG của người nhận — `git push` không tới; sửa mã thì
  chạy lại `dong-goi-web.mjs` và tải lên tay đúng file đổi, **giữ `cau-hinh.js` của họ**.
  Edge Function là bản chép riêng trên từng dự án Supabase — sửa `index.ts` thì dán lại
  ở CẢ app thật lẫn bản cài.
- ⚠ Hai công cụ chạy từ gốc `Claude_Code`: `node kiem-thu/dong-goi-web.mjs` (không phải
  `supabase/kiem-thu/`). Dropbox khoá có lúc làm nó dừng giữa chừng không báo rõ → chạy lại
  tới khi in `TỰ KIỂM ĐẠT`.

Chưa đo: dự án Postgres 15 (dự án mới là bản Supabase hiện hành).
