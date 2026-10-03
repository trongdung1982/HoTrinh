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
