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
Sửa `CHUOI` trong `dong-goi-sql.mjs` và số `67` ở dòng đầu file cài khi thêm file.

**Đạt nghĩa là:** kết xuất lược đồ + quyền + trigger `auth.users` + luật kho ảnh
của bản cài **trùng từng ký tự** với chuỗi `01→67` (sau khi lột ghi chú cả hai);
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
- ⚠ **Dòng tự kiểm cuối của `62` báo HỎNG** trên bản dựng từ chuỗi: `anon` gọi được
  `duyet_thanh_vien` (`06` chỉ revoke `public`). Máy chủ thật **cũng thế** — đo
  REST 03/10/2026: hàm chạy và tự từ chối, không lọt gì. Bản cài giữ đúng như
  máy thật; vá thì làm file `68` (revoke `anon`) rồi đóng gói lại.

## Bàn thử KHÔNG đo được (phải cài thử trên Supabase thật — b171)

SQL Editor có nhận file ~360 KB một lượt không · tạo trigger trên `auth.users`
và luật trên `storage.objects` ở dự án MỚI · dự án Postgres 15.
