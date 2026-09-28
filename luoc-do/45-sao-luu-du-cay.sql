-- ============================================================
-- giapha-supabase · luoc-do/45-sao-luu-du-cay.sql
-- Vai trò  : b142a — bản sao lưu đêm BỎ SÓT mọi cây dựng sau ngày chủ dự án
--            thêm tay máy sao lưu (bước 2c của hướng dẫn). Vá ba chỗ: cây mới
--            tự có máy sao lưu · bù cho cây đang thiếu · một hàm đếm thật để
--            `SaoLuu.gs` tự phát hiện bản sao lưu thiếu dòng.
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `44`. Dán lại nhiều lần được.
--            ⚠ Dán xong chép `sao-luu/SaoLuu.gs` bản 0.5.0 vào dự án Apps
--            Script sao lưu — thiếu bước ấy thì chuông báo nằm đó không ai kéo.
-- Sổ tay   : sao-luu/HUONG-DAN-SAO-LUU.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b142a.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 28/09/2026
-- ============================================================
--
-- ═══ LỖ HỔNG ═══
--
-- Máy sao lưu đọc nội dung cây qua RLS, và cửa của nó là `la_thanh_vien()` —
-- tức phải có dòng `tree_members.role = 'sao_luu'` Ở TỪNG CÂY. Dòng ấy chủ dự
-- án thêm tay một lần (hướng dẫn bước 2c). `tao_gia_pha_moi()` của `12` KHÔNG
-- thêm. Nên cây dựng sau ngày ấy **vắng mặt hoàn toàn** trong mọi bản sao lưu
-- — không lỗi, không thư, file trông bình thường. Bàn thử 28/09: máy chủ có
-- 2 cây · 740 người, máy sao lưu thấy 1 cây · 59 người.
--
-- ⚠ Vá bằng trigger trên `trees`, KHÔNG sửa `tao_gia_pha_moi()`: cây còn sinh
--   ra bằng đường khác (SQL di dời, dán tay), và định nghĩa lại một hàm của
--   `12` là kéo thêm một mắt xích vào chuỗi dán lại.
--
-- ⚠ Đây KHÔNG phải cửa vào cây mới. Trigger chỉ chép những tài khoản ĐÃ mang
--   vai `sao_luu` — vai ấy app không cấp được cho ai (`14` mục 8 cấm mời,
--   `13` cấm đổi sang/đi), chỉ SQL Editor đặt được. Và vai ấy không ghi được
--   gì (`co_the_sua()` không nhận nó).
--
-- ⚠ Chuông báo (`sao_luu_dem_that()`) là hàm MỚI, không định nghĩa lại hàm
--   của `44` — không kéo chuỗi dán lại. Nó bắt được cả những kiểu thiếu khác
--   mà hôm nay chưa ai nghĩ tới (người không thuộc cây nào, luật RLS mới).

begin;

-- ============================================================
-- 1. CÂY MỚI TỰ CÓ MÁY SAO LƯU
-- ============================================================
create or replace function public.them_may_sao_luu_vao_cay()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.tree_members (tree_id, user_id, role, email, approved)
  select distinct on (m.user_id) new.id, m.user_id, 'sao_luu', m.email, true
    from public.tree_members m
   where m.role = 'sao_luu'
   order by m.user_id, m.added_at
  on conflict (tree_id, user_id) do nothing;
  return null;
end;
$$;

revoke all on function public.them_may_sao_luu_vao_cay() from public, anon, authenticated;

drop trigger if exists them_may_sao_luu on public.trees;
create trigger them_may_sao_luu
  after insert on public.trees
  for each row execute function public.them_may_sao_luu_vao_cay();

-- ============================================================
-- 2. BÙ CHO CÂY ĐANG THIẾU
-- ============================================================
insert into public.tree_members (tree_id, user_id, role, email, approved)
select t.id, s.user_id, 'sao_luu', s.email, true
  from public.trees t
 cross join (select distinct on (m.user_id) m.user_id, m.email
               from public.tree_members m
              where m.role = 'sao_luu'
              order by m.user_id, m.added_at) s
on conflict (tree_id, user_id) do nothing;

-- ============================================================
-- 3. CHUÔNG BÁO — số dòng THẬT, để `SaoLuu.gs` so với số nó đọc được
-- ============================================================
-- Cùng hàng rào với `sao_luu_bang_he_thong()` của `44`. Chỉ trả SỐ, không trả
-- dòng nào — lọt mật khẩu máy sao lưu thì người cầm biết thêm mười ba con số.
-- ⚠ Danh sách bảng phải khớp `THU_TU_DOC` của `SaoLuu.gs`.
create or replace function public.sao_luu_dem_that()
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

  return jsonb_build_object('ok', true, 'dem', jsonb_build_object(
    'trees',          (select count(*) from public.trees),
    'tree_members',   (select count(*) from public.tree_members),
    'branches',       (select count(*) from public.branches),
    'branch_access',  (select count(*) from public.branch_access),
    'tree_persons',   (select count(*) from public.tree_persons),
    'persons',        (select count(*) from public.persons),
    'unions',         (select count(*) from public.unions),
    'union_children', (select count(*) from public.union_children),
    'media',          (select count(*) from public.media),
    'sources',        (select count(*) from public.sources),
    'change_log',     (select count(*) from public.change_log),
    'imports',        (select count(*) from public.imports),
    'user_settings',  (select count(*) from public.user_settings)
  ));
end;
$$;

revoke all on function public.sao_luu_dem_that() from public, anon;
grant execute on function public.sao_luu_dem_that() to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — bảng cuối phải ra ĐẠT ở cả bốn dòng
-- ============================================================
select 1 as stt, 'trigger them_may_sao_luu đã gắn vào trees' as ten_kiem,
  case when exists (select 1 from pg_trigger
                     where tgrelid = 'public.trees'::regclass and tgname = 'them_may_sao_luu')
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'có tài khoản mang vai sao_luu (không có thì cả file vô dụng)',
  case when exists (select 1 from public.tree_members where role = 'sao_luu')
       then 'ĐẠT' else 'XEM LẠI' end
union all
select 3, 'MỌI cây đều có máy sao lưu — cây thiếu: ' ||
  coalesce((select string_agg(t.tree_code, ', ' order by t.tree_code) from public.trees t
             where not exists (select 1 from public.tree_members m
                                where m.tree_id = t.id and m.role = 'sao_luu')), 'không'),
  case when not exists (select 1 from public.trees t
                         where not exists (select 1 from public.tree_members m
                                            where m.tree_id = t.id and m.role = 'sao_luu'))
       then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'sao_luu_dem_that(): authenticated gọi được, anon thì không',
  case when has_function_privilege('authenticated', 'public.sao_luu_dem_that()', 'execute')
        and not has_function_privilege('anon', 'public.sao_luu_dem_that()', 'execute')
       then 'ĐẠT' else 'HỎNG' end
order by stt;
