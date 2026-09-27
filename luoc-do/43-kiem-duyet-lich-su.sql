-- ============================================================
-- giapha-supabase · luoc-do/43-kiem-duyet-lich-su.sql
-- Vai trò  : b136 — `ds_kiem_duyet()` trả thêm NGƯỜI DUYỆT · LÚC DUYỆT · LÝ
--            DO TỪ CHỐI, để hai tab lịch sử của khu Kiểm duyệt hết để trống
--            ba cột. Ba cột có sẵn trong `change_log` từ `08`, chỉ hàm chưa đọc.
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `42`. Dán lại nhiều lần được.
-- Sổ tay   : so-tay/trang-quan-tri.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b136.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 28/09/2026
-- ============================================================
--
-- ⚠⚠ ĐÂY LÀ BẢN ĐỨNG CUỐI của `ds_kiem_duyet()` — bản trước ở `10` mục 4b
--    (và `08` mục 9). Dán lại `08` hoặc `10` sau file này là mất ba cột, và
--    màn hình lại để trống — không lỗi, im lặng. Chuỗi: `08`/`10` → `43`.
--
-- ⚠ Đổi kiểu trả về (thêm cột) thì `create or replace` KHÔNG được — phải
--   `drop` trước, và `drop` xoá luôn `grant`: chép lại cả hai dòng quyền ở
--   cuối, không thì hàm rơi về mặc định "ai cũng gọi được, kể cả anon".
--
-- Thân hàm chép NGUYÊN VĂN `10` mục 4b, thêm đúng ba cột cuối — hàng rào
-- `co_the_kiem_duyet(p_tree)` giữ nguyên chỗ cũ.

begin;

drop function if exists public.ds_kiem_duyet(uuid, text, integer);

create or replace function public.ds_kiem_duyet(
  p_tree       uuid,
  p_trang_thai text default 'cho',
  p_gioi_han   integer default 200
)
returns table (
  id            bigint,
  ts            timestamptz,
  by_email      text,
  action        text,
  target        text,
  note          text,
  revision      integer,
  trang_thai    text,
  so_nguoi      integer,
  so_honnhan    integer,
  so_quanhe     integer,
  duyet_boi     text,
  duyet_luc     timestamptz,
  ly_do_tu_choi text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select cl.id, cl.ts, cl.by_email, cl.action, cl.target, cl.note,
         cl.revision, cl.trang_thai,
         jsonb_array_length(coalesce(cl.truoc->'persons',  '[]'::jsonb)),
         jsonb_array_length(coalesce(cl.truoc->'unions',   '[]'::jsonb)),
         jsonb_array_length(coalesce(cl.truoc->'children', '[]'::jsonb)),
         cl.duyet_boi, cl.duyet_luc, cl.ly_do_tu_choi
    from public.change_log cl
   where cl.tree_id = p_tree
     and (p_trang_thai is null or cl.trang_thai = p_trang_thai)
     and public.co_the_kiem_duyet(p_tree)
   order by cl.id desc
   limit coalesce(p_gioi_han, 200);
$$;

revoke all on function public.ds_kiem_duyet(uuid, text, integer)    from public, anon;
grant execute on function public.ds_kiem_duyet(uuid, text, integer) to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — hình dạng. Hành vi (ai đọc được, cột đúng giá trị) ở bàn thử.
-- ⚠ Đếm cột hàm trả bảng bằng `pg_proc.proallargtypes` — `information_schema`
--   trả 0 dòng cho loại này (`so-tay/phan-quyen.md`).
-- ============================================================
select 1 as stt, 'ds_kiem_duyet trả 14 cột (11 cũ + 3 mới)' as ten_kiem,
  case when (select cardinality(p.proallargtypes) - p.pronargs
               from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'ds_kiem_duyet') = 14
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'authenticated gọi được, anon thì không',
  case when has_function_privilege('authenticated', 'public.ds_kiem_duyet(uuid, text, integer)', 'execute')
        and not has_function_privilege('anon', 'public.ds_kiem_duyet(uuid, text, integer)', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'chỉ MỘT bản ds_kiem_duyet (không nạp chồng)',
  case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'ds_kiem_duyet') = 1
       then 'ĐẠT' else 'HỎNG' end
order by stt;
