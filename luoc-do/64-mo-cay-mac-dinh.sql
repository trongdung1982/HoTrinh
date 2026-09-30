-- ============================================================
-- giapha-supabase · luoc-do/64-mo-cay-mac-dinh.sql
-- Vai trò  : b145 vá — người ĐÃ có chân ở cây khác bấm mở cây mặc định thì
--            `dat_cay_dang_mo()` báo "new row violates row-level security
--            policy for table user_settings". Luật ghi `user_settings` (`02`
--            mục 4) đòi `la_thanh_vien(tree_id)`, mà cây mặc định là cửa
--            DUY NHẤT đọc được cây không cần chân (`THIET-KE-NHIEU-CAY.md`
--            mục 3) — đọc được mà không được ghi "tôi đang mở cây này".
-- Sửa      : tách luật `for all` làm bốn. Thêm dòng: cây mình là thành viên
--            HOẶC xem được (`co_the_xem_cay`). Sửa dòng: như thế, hoặc dòng
--            không mang cờ `dang_mo` — để TẮT cờ ở một cây vừa thôi là mặc
--            định vẫn được (không thì đổi cây hỏng mãi).
-- ⚠ Không lộ gì: dòng `user_settings` chỉ chủ của nó đọc (và máy sao lưu
--   của cây ấy, `05`). Nó là con trỏ riêng, không mở thêm dòng dữ liệu nào.
-- Đi cặp   : `55` 0.2.0 (`mo_phien` nhận cờ `dang_mo` trỏ vào cây mặc
--            định) + `sb.js` `layPhien()` (vai `xem` khi không có chân).
-- Đo       : ../kiem-thu/ban-thu-sql/do-b145c.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 30/09/2026 (b145c)
-- ============================================================

begin;

drop policy if exists rieng_user_settings      on public.user_settings;
drop policy if exists rieng_user_settings_doc  on public.user_settings;
drop policy if exists rieng_user_settings_them on public.user_settings;
drop policy if exists rieng_user_settings_sua  on public.user_settings;
drop policy if exists rieng_user_settings_xoa  on public.user_settings;

create policy rieng_user_settings_doc on public.user_settings
  for select to authenticated
  using (user_id = auth.uid());

create policy rieng_user_settings_them on public.user_settings
  for insert to authenticated
  with check (user_id = auth.uid()
              and (public.la_thanh_vien(tree_id) or public.co_the_xem_cay(tree_id)));

create policy rieng_user_settings_sua on public.user_settings
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid()
              and (dang_mo is not true
                   or public.la_thanh_vien(tree_id) or public.co_the_xem_cay(tree_id)));

create policy rieng_user_settings_xoa on public.user_settings
  for delete to authenticated
  using (user_id = auth.uid());

commit;

-- ------------------------------------------------------------
-- Tự kiểm — mọi dòng phải ĐẠT
-- ------------------------------------------------------------
select 1 as stt, 'luật cũ rieng_user_settings đã bỏ' as phep,
  case when not exists (select 1 from pg_policies where tablename = 'user_settings'
                           and policyname = 'rieng_user_settings')
  then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'đủ bốn luật mới (đọc · thêm · sửa · xoá)',
  case when (select count(*) from pg_policies where tablename = 'user_settings'
               and policyname like 'rieng_user_settings_%') = 4
  then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'luật thêm có co_the_xem_cay',
  case when (select with_check from pg_policies where tablename = 'user_settings'
               and policyname = 'rieng_user_settings_them') like '%co_the_xem_cay%'
  then 'ĐẠT' else 'HỎNG' end
order by 1;
