-- ============================================================
-- giapha-supabase · luoc-do/57-nguoi-da-xoa-moi-cay.sql
-- Vai trò  : Hàm ĐỌC `ds_nguoi_da_xoa()` — người mang cờ `deleted` của MỌI
--            cây, cho bảng *Người đã xoá* ở tab Thùng rác của Quản trị hệ
--            thống (b159b). Chỉ QTHT nhận dòng; người khác nhận bảng rỗng.
-- Cần có   : `26` (tree_persons) · `11` (la_quan_tri_he_thong) · `16` (cột
--            da_xoa_luc trên trees).
-- ⚠ CHỈ ĐỌC. Khôi phục / xoá vĩnh viễn KHÔNG có hàm riêng — trình duyệt nạp
--   đúng cây ấy rồi ghi qua `luu_cay()` như trang sơ đồ, để cửa ghi vẫn là
--   MỘT (kiểm duyệt, chụp ảnh hoàn tác, chống ghi đè đều giữ nguyên).
-- ⚠ Người xuyên cây: một dòng cho MỖI cây giữ người ấy (cờ `deleted` nằm trên
--   dòng người, chung mọi cây). Cây đang trong thùng rác thì bỏ qua — người
--   của nó đi theo cây.
-- ⚠ "Ngày xoá" = `meta.updatedAt` / `meta.updatedBy` — `softDeletePerson()`
--   ghi hai khoá ấy lúc xoá. Người bị sửa sau khi xoá thì ngày lệch theo.
-- JS      : `sb.js` `dsNguoiDaXoa()`. Mã JS chạy được cả khi chưa dán file
--           này (bảng báo "chưa dán 57").
-- Đo      : ../kiem-thu/ban-thu-sql/do-b159b.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 29/09/2026 (b159b)
-- ============================================================

begin;

do $$
begin
  if to_regclass('public.tree_persons') is null then
    raise exception 'DỪNG: chưa dán 26-mot-nguoi-mot-ban-ghi.sql (thiếu tree_persons).';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'trees'
                    and column_name = 'da_xoa_luc') then
    raise exception 'DỪNG: chưa dán 16-thung-rac-cay.sql (thiếu trees.da_xoa_luc).';
  end if;
end $$;

drop function if exists public.ds_nguoi_da_xoa();

create function public.ds_nguoi_da_xoa()
returns table(tree_id uuid, ten_cay text, ma_cay text, person_id text,
              ten text, nam_sinh text, nam_mat text, gioi text,
              xoa_luc text, xoa_boi text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select t.id, t.name, t.tree_code, p.id,
         coalesce(nullif(public.ten_day_du(p.names), ''), p.id),
         coalesce(left(nullif(p.birth->>'iso', ''), 4),
                  substring(coalesce(p.birth->>'raw', '') from '\d{4}'), ''),
         coalesce(left(nullif(p.death->>'iso', ''), 4),
                  substring(coalesce(p.death->>'raw', '') from '\d{4}'), ''),
         p.sex,
         coalesce(p.meta->>'updatedAt', ''),
         coalesce(p.meta->>'updatedBy', '')
    from public.persons p
    join public.tree_persons tp on tp.person_id = p.id
    join public.trees t on t.id = tp.tree_id
   where p.deleted
     and t.da_xoa_luc is null
     and public.la_quan_tri_he_thong()
   order by t.name, p.id;
$$;

revoke all on function public.ds_nguoi_da_xoa() from public, anon;
grant execute on function public.ds_nguoi_da_xoa() to authenticated;

-- ------------------------------------------------------------
-- Tự kiểm
-- ------------------------------------------------------------
select 'ds_nguoi_da_xoa có mặt' as phep,
       case when to_regprocedure('public.ds_nguoi_da_xoa()') is not null
            then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 'anon KHÔNG gọi được',
       case when not has_function_privilege('anon', 'public.ds_nguoi_da_xoa()', 'execute')
            then 'ĐẠT' else 'HỎNG' end;

commit;
