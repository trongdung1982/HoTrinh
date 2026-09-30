-- ============================================================
-- giapha-supabase · luoc-do/67-sao-luu-thay-mo-coi.sql
-- Vai trò  : b166c — máy sao lưu thấy cả dữ liệu MỒ CÔI (người/cặp đã ra
--            khỏi mọi cây mà chưa xoá hẳn) ở bốn bảng dùng chung: `persons`
--            · `unions` · `union_children` · `media`.
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `53` và `66`. Dán lại nhiều lần được.
--            Không định nghĩa lại hàm/luật nào của file khác → không kéo chuỗi
--            dán lại; dán lại `26`/`53` sau này cũng không xoá luật ở đây
--            (khác tên). KHÔNG cần thay `SaoLuu.gs`.
-- Sổ tay   : so-tay/sao-luu.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b166.mjs (nhóm M)
-- Phiên bản: 0.1.0 · Cập nhật: 30/09/2026 (b166c)
-- ============================================================
--
-- ═══ VÌ SAO ═══
--
-- Luật đọc bốn bảng (`26`, bản hàm `53`) đi theo CÂY: thấy người thuộc cây
-- mình xem được. Người mồ côi không thuộc cây nào → máy sao lưu không thấy →
-- `sao_luu_dem_that()` (`45`) đếm được nhiều hơn → file tự khai THIẾU. Hệ quả
-- không nhỏ: nút Khôi phục TỪ CHỐI file ấy, bản cũ không được dọn, mỗi đêm
-- một thư cảnh báo. Đo thật 30/09/2026: `persons` máy chủ 1487, đọc được 1486.
--
-- ⚠ Cùng khuôn `05` mục 3: THÊM một luật SELECT riêng, không sửa luật cũ —
--   Postgres cộng các luật `select` bằng HOẶC, nên chỉ nới cho vai `sao_luu`,
--   không bớt của ai. Vai ấy vẫn KHÔNG ghi được gì.
-- ⚠ Hàng rào hỏi thẳng `tree_members.role = 'sao_luu'` (cùng lý lẽ `44`), bọc
--   `(select …)` để Postgres tính MỘT lần mỗi câu, không mỗi dòng.
-- ⚠ Máy sao lưu thấy cả người bị che (người còn sống, `50`/`53`) — đúng ý:
--   bản sao lưu che bớt là bản khôi phục mất dữ liệu.

begin;

do $$
begin
  if to_regprocedure('public.ds_nguoi_xem_duoc()') is null then
    raise exception 'DỪNG: chưa dán 26-mot-nguoi-mot-ban-ghi.sql (thiếu ds_nguoi_xem_duoc).';
  end if;
end $$;

create or replace function public.la_tai_khoan_sao_luu()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.tree_members m
                  where m.user_id = auth.uid() and m.role = 'sao_luu');
$$;

revoke all on function public.la_tai_khoan_sao_luu() from public, anon;
grant execute on function public.la_tai_khoan_sao_luu() to authenticated;

drop policy if exists doc_persons_sao_luu on public.persons;
create policy doc_persons_sao_luu on public.persons
  for select to authenticated
  using ((select public.la_tai_khoan_sao_luu()));

drop policy if exists doc_unions_sao_luu on public.unions;
create policy doc_unions_sao_luu on public.unions
  for select to authenticated
  using ((select public.la_tai_khoan_sao_luu()));

drop policy if exists doc_union_children_sao_luu on public.union_children;
create policy doc_union_children_sao_luu on public.union_children
  for select to authenticated
  using ((select public.la_tai_khoan_sao_luu()));

drop policy if exists doc_media_sao_luu on public.media;
create policy doc_media_sao_luu on public.media
  for select to authenticated
  using ((select public.la_tai_khoan_sao_luu()));

commit;

-- ============================================================
-- TỰ KIỂM — hình dạng. Ai thấy gì: bàn thử `do-b166.mjs` nhóm M.
-- ============================================================
select 1 as stt, 'hàm la_tai_khoan_sao_luu(): authenticated gọi được, anon không' as ten_kiem,
  case when has_function_privilege('authenticated', 'public.la_tai_khoan_sao_luu()', 'execute')
        and not has_function_privilege('anon', 'public.la_tai_khoan_sao_luu()', 'execute')
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'đủ bốn luật đọc *_sao_luu, đều chỉ SELECT',
  case when (select count(*) from pg_policies
              where schemaname = 'public' and cmd = 'SELECT'
                and policyname in ('doc_persons_sao_luu', 'doc_unions_sao_luu',
                                   'doc_union_children_sao_luu', 'doc_media_sao_luu')) = 4
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'luật đọc cũ theo cây vẫn còn (không bị thay)',
  case when (select count(*) from pg_policies
              where schemaname = 'public'
                and policyname in ('doc_persons', 'doc_unions', 'doc_union_children', 'doc_media')) = 4
       then 'ĐẠT' else 'HỎNG' end
order by stt;
