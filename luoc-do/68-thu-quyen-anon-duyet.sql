-- ============================================================
-- giapha-supabase · luoc-do/68-thu-quyen-anon-duyet.sql
-- Vai trò  : Thu quyền gọi `duyet_thanh_vien()` của vai `anon` (người chưa
--            đăng nhập). Dòng tự kiểm cuối của `62` hết báo HỎNG.
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `62`. Dán lại nhiều lần được.
--            Không định nghĩa lại hàm nào → không kéo chuỗi dán lại.
-- Sổ tay   : so-tay/dong-goi.md
-- Phiên bản: 0.1.0 · Cập nhật: 03/10/2026
-- ============================================================
--
-- ═══ VÌ SAO ═══
--
-- `06` chỉ `revoke … from public`. Supabase còn cấp thẳng cho `anon` qua
-- quyền mặc định, nên `anon` vẫn gọi được. Hàm tự kiểm người gọi và từ chối
-- (đo REST 03/10/2026: không lọt gì) — đây là đóng thêm lớp rào ngoài cửa.
-- ⚠ `create or replace` giữ nguyên quyền cũ, nên dán lại `06`/`08`/`18`/`27`/
--   `62` sau này KHÔNG mở lại cửa. Chỉ `drop function` rồi tạo lại mới mở —
--   khi ấy dán lại file này.

begin;

do $$
begin
  if to_regprocedure('public.duyet_thanh_vien(uuid, text, text, boolean)') is null then
    raise exception 'DỪNG: chưa có duyet_thanh_vien(uuid, text, text, boolean) — dán 62 trước.';
  end if;
end $$;

revoke all on function public.duyet_thanh_vien(uuid, text, text, boolean) from public, anon;
grant execute on function public.duyet_thanh_vien(uuid, text, text, boolean) to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM
-- ============================================================
select 1 as stt, 'duyet_thanh_vien: authenticated gọi được, anon không' as ten_kiem,
  case when has_function_privilege('authenticated', 'public.duyet_thanh_vien(uuid, text, text, boolean)', 'execute')
        and not has_function_privilege('anon', 'public.duyet_thanh_vien(uuid, text, text, boolean)', 'execute')
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'anon KHÔNG gọi được bốn hàm dựng lại ở 62',
  case when not has_function_privilege('anon', 'public.tim_tai_khoan(uuid, text)', 'execute')
        and not has_function_privilege('anon', 'public.tim_nguoi_trong_cay(uuid, text)', 'execute')
        and not has_function_privilege('anon', 'public.moi_vao_cay(uuid, text, text, text)', 'execute')
        and not has_function_privilege('anon', 'public.duyet_thanh_vien(uuid, text, text, boolean)', 'execute')
       then 'ĐẠT' else 'HỎNG' end
order by stt;
