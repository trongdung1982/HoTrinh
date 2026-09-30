-- ============================================================
-- giapha-supabase · luoc-do/66-sao-luu-tree-persons.sql
-- Vai trò  : b166b — máy sao lưu đọc `tree_persons` qua MỘT hàm. Từ `56`
--            (khép cột Đời) `authenticated` chỉ còn quyền đọc hai cột
--            `tree_id` · `person_id`; máy sao lưu cũng là `authenticated`,
--            nên câu REST `select=*` bị từ chối và bản sao lưu đêm HỎNG.
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `56`. Dán lại nhiều lần được.
--            Không định nghĩa lại hàm nào của file khác → không kéo chuỗi dán lại.
--            ⚠ Đi cặp `sao-luu/SaoLuu.gs` 0.12.0 — bản cũ vẫn đọc REST, vẫn hỏng.
-- Sổ tay   : so-tay/sao-luu.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b166.mjs (nhóm T)
-- Phiên bản: 0.1.0 · Cập nhật: 30/09/2026 (b166b)
-- ============================================================
--
-- ⚠ KHÔNG sửa bằng cách cho máy sao lưu đọc hai cột được phép: file sao lưu
--   thiếu cột `doi`, và khôi phục đặt `doi` về mặc định (trống) cho MỌI
--   người — mất Đời im lặng. Hàm trả TRỌN cột.
-- ⚠ Không mở lại quyền cột `doi` cho `authenticated`: đó đúng là khe `56` khép.
-- ⚠ Cùng hàng rào với `44` · `65`: hỏi thẳng vai `sao_luu`. Máy sao lưu vốn đã
--   thấy mọi dòng `tree_persons` (`45` cho nó vai ở mọi cây), chỉ thiếu cột.

begin;

do $$
begin
  if to_regclass('public.tree_persons') is null then
    raise exception 'DỪNG: chưa dán 26-mot-nguoi-mot-ban-ghi.sql (thiếu tree_persons).';
  end if;
end $$;

create or replace function public.sao_luu_tree_persons()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.tree_members m
                  where m.user_id = auth.uid() and m.role = 'sao_luu') then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ tài khoản sao lưu tự động mới gọi được hàm này.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'dong', coalesce((select jsonb_agg(to_jsonb(x) order by x.tree_id, x.person_id)
                        from public.tree_persons x), '[]'::jsonb));
end;
$$;

revoke all on function public.sao_luu_tree_persons() from public, anon;
grant execute on function public.sao_luu_tree_persons() to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — hình dạng. Ai gọi được, trả đủ cột chưa: bàn thử `do-b166.mjs`.
-- ============================================================
select 1 as stt, 'hàm sao_luu_tree_persons() đã có' as ten_kiem,
  case when to_regprocedure('public.sao_luu_tree_persons()') is not null
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'authenticated gọi được, anon thì không',
  case when has_function_privilege('authenticated', 'public.sao_luu_tree_persons()', 'execute')
        and not has_function_privilege('anon', 'public.sao_luu_tree_persons()', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'cột doi vẫn KHÔNG mở cho authenticated (khe của 56 vẫn khép)',
  case when not has_column_privilege('authenticated', 'public.tree_persons', 'doi', 'select')
       then 'ĐẠT' else 'HỎNG' end
order by stt;
