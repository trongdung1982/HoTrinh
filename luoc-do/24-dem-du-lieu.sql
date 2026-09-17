-- ============================================================
-- giapha-supabase · luoc-do/24-dem-du-lieu.sql
-- Vai trò  : b119 — MỘT hàm RPC rẻ, trả 5 số đếm của một cây, để màn hình
--            Quản trị hệ thống · Sao lưu đối chiếu bằng mắt với khối "dem"
--            trong file sao lưu đêm gần nhất (`sao-luu/SaoLuu.gs`).
-- Chạy ở   : Supabase → SQL Editor. Chạy SAU `11-quyen-he-thong.sql`
--            (cần `la_quan_tri_he_thong()`). Không đụng hàm nào của chuỗi
--            dán lại ở `CHI-DAN.md` mục 3, nên KHÔNG nằm trong chuỗi ấy.
-- Phiên bản: 0.1.0 · Cập nhật: 17/09/2026 (b119)
-- ============================================================
--
-- ═══ VÌ SAO NĂM CON SỐ NÀY, VÀ VÌ SAO ĐẾM THÔ ═══
--
-- `THIET-KE-QUAN-TRI.md` Khu 4: "con chim hoàng yến trong hầm mỏ" — cả dự án
-- này kiểm chứng di dời dữ liệu bằng đúng một bảng đối chiếu số đếm
-- (`09-doi-ma-vai.sql`, di dời 04/09). Khu Sao lưu dùng lại đúng cách ấy cho
-- việc đối chiếu với bản sao lưu đêm.
--
-- Năm bảng chọn ở đây khớp đúng năm bảng lớn nhất mà `SaoLuu.gs` liệt vào
-- `dem` — không lọc `deleted`, không lọc `trang_thai`: hàm này phải đếm
-- ĐÚNG những gì `docBang_()` bên Apps Script đếm (`select count(*)`), không
-- thì hai cột "Hiện tại" và "Bản sao lưu" không bao giờ khớp dù dữ liệu y hệt.
--
-- ═══ AI ĐỌC ĐƯỢC ═══
--
-- Chỉ Quản trị hệ thống (`THIET-KE-QUAN-TRI.md` bảng quyền, dòng "Khu 4 · xem
-- trạng thái sao lưu"). Theo đúng nếp `ds_tai_khoan_he_thong()` (`14` mục 8):
-- phép kiểm nằm trong chính câu lệnh, không phải một `if` đứng trước — hàm
-- `sql` thì đây là cách gọn nhất, không có nhánh nào để lọt qua.

create or replace function public.dem_du_lieu(p_tree uuid)
returns table (
  persons        integer,
  unions         integer,
  union_children integer,
  tree_members   integer,
  change_log     integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select (select count(*) from public.persons        where tree_id = p_tree)::integer,
         (select count(*) from public.unions         where tree_id = p_tree)::integer,
         (select count(*) from public.union_children where tree_id = p_tree)::integer,
         (select count(*) from public.tree_members   where tree_id = p_tree)::integer,
         (select count(*) from public.change_log     where tree_id = p_tree)::integer
   where public.la_quan_tri_he_thong();
$$;

-- ⚠ `revoke` đứng trước `grant` — mặc định Postgres cấp EXECUTE cho `public`,
--   tức cả `anon` (bài học nhắc lại ở mọi file từ `07` trở đi).
revoke all     on function public.dem_du_lieu(uuid) from public, anon;
grant  execute on function public.dem_du_lieu(uuid) to authenticated;

-- ============================================================
-- BẢNG TỰ KIỂM — đọc sau khi dán
-- ============================================================
-- Chỉ hỏi *"có đúng hình dạng không"*. Câu hỏi *"có chặn được người không phải
-- QTHT không"* đo bằng phép mượn danh: `kiem-thu/ban-thu-sql/do-b119.mjs`.

select ten_kiem as "Kiểm", ket_qua as "Kết quả"
from (
  select 1 as stt, 'Hàm dem_du_lieu(uuid) tồn tại' as ten_kiem,
    case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                       where n.nspname = 'public' and p.proname = 'dem_du_lieu')
         then 'ĐẠT' else 'HỎNG — thiếu hàm' end as ket_qua
  union all
  select 2, 'anon KHÔNG gọi được',
    case when not has_function_privilege('anon', 'public.dem_du_lieu(uuid)', 'execute')
         then 'ĐẠT' else 'HỎNG — quên revoke' end
  union all
  select 3, 'authenticated gọi được',
    case when has_function_privilege('authenticated', 'public.dem_du_lieu(uuid)', 'execute')
         then 'ĐẠT' else 'HỎNG — màn hình sẽ báo lỗi quyền' end
) t order by stt;
