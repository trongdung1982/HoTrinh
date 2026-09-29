-- ============================================================
-- giapha-supabase · luoc-do/60-doi-ten-ham-xoa-cay.sql
-- Vai trò  : Đổi tên hai hàm lệch nghĩa (chủ dự án chốt 30/09/2026, b161c):
--              xin_xoa_cay(p_tree, p_ly_do)  →  xoa_cay(p_tree, p_ly_do)
--              huy_xin_xoa_cay(p_tree)       →  tra_lai_cay(p_tree)
--            Thân hàm CHÉP NGUYÊN bản cuối (`27` · `23`), không đổi một luật nào.
-- Cần có   : `23` · `27` (cột `trees.xin_xoa_*`, `cay_dang_an`, `trong_thung_rac`).
-- ⚠ Tên CỘT `trees.xin_xoa_luc/boi/ly_do` GIỮ NGUYÊN — đổi cột là đụng `42`
--   (trigger nhật ký), `SaoLuu.gs`, khôi phục; không đáng.
-- ⚠ `16`/`23`/`27` (ba file định nghĩa tên cũ) KHÔNG dán lại được trên nền
--   hiện tại — hỏi cột `tree_id` đã bỏ, cả giao dịch huỷ, tên cũ không sống
--   lại (đo b161c). Ngày nào sửa cho chúng dán lại được thì phải dán `60` sau.
-- ⚠ THỨ TỰ với mã JS: `sb.js` gọi tên MỚI từ b161c. Chưa dán file này thì hai
--   nút *Xoá gia phả* / *Trả lại cho chủ* báo "Máy chủ chưa có hàm này".
-- JS      : `sb.xoaCay()` · `sb.traLaiCay()`.
-- Đo      : ../kiem-thu/ban-thu-sql/do-b161c.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 30/09/2026 (b161c)
-- ============================================================

begin;

do $$
begin
  if to_regprocedure('public.cay_dang_an(uuid)') is null
     or to_regprocedure('public.trong_thung_rac(uuid)') is null then
    raise exception 'DỪNG: chưa dán 23-bon-luat-moi.sql.';
  end if;
end $$;

-- ------------------------------------------------------------
-- 1. xoa_cay — chủ cây hoặc QTHT ẨN cây NGAY (thân `27` mục 8)
-- ------------------------------------------------------------
create or replace function public.xoa_cay(p_tree uuid, p_ly_do text default ''::text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ten     text;
  v_la_chu  boolean;
  v_nguoi   bigint;
begin
  select t.name, coalesce(t.chu_so_huu = auth.uid(), false)
    into v_ten, v_la_chu
    from public.trees t where t.id = p_tree;

  if v_ten is null then
    return jsonb_build_object('ok', false, 'loi', 'Không có gia phả này.');
  end if;

  if not (v_la_chu or public.la_quan_tri_he_thong()) then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ người đứng tên gia phả hoặc Quản trị hệ thống mới xoá được.');
  end if;

  if public.cay_dang_an(p_tree) then
    return jsonb_build_object('ok', false, 'loi',
      'Gia phả này đã bị xoá rồi, đang chờ Quản trị hệ thống xử lý.');
  end if;

  -- Đếm TRƯỚC khi ẩn — sau `update` chính người bấm cũng không đọc được nữa.
  select count(*) into v_nguoi
    from public.tree_persons tp join public.persons p on p.id = tp.person_id
   where tp.tree_id = p_tree and p.deleted = false;

  update public.trees
     set xin_xoa_luc   = now(),
         xin_xoa_boi   = auth.uid(),
         xin_xoa_ly_do = coalesce(p_ly_do, '')
   where id = p_tree;

  return jsonb_build_object('ok', true, 'ten', v_ten, 'soNguoi', v_nguoi);
end;
$$;

-- ------------------------------------------------------------
-- 2. tra_lai_cay — CHỈ QTHT trả cây đang ẩn lại cho chủ (thân `23` mục 8b)
-- ------------------------------------------------------------
-- Cây đã vào thùng rác thì đường về là `phuc_hoi_cay()`, không phải hàm này.
create or replace function public.tra_lai_cay(p_tree uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_ten  text;
  v_xin  timestamptz;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới trả lại gia phả cho chủ được.');
  end if;

  select t.name, t.xin_xoa_luc into v_ten, v_xin
    from public.trees t where t.id = p_tree;

  if v_ten is null then
    return jsonb_build_object('ok', false, 'loi', 'Không có gia phả này.');
  end if;

  if v_xin is null then
    return jsonb_build_object('ok', false, 'loi',
      'Gia phả này không bị xoá — không có gì để trả lại.');
  end if;

  if public.trong_thung_rac(p_tree) then
    return jsonb_build_object('ok', false, 'loi',
      'Gia phả này đã nằm trong thùng rác — đường về là nút Phục hồi.');
  end if;

  update public.trees
     set xin_xoa_luc = null, xin_xoa_boi = null, xin_xoa_ly_do = ''
   where id = p_tree;

  return jsonb_build_object('ok', true, 'ten', v_ten);
end;
$$;

-- ------------------------------------------------------------
-- 3. Quyền — revoke TRƯỚC grant, đúng khuôn `07` mục 8
-- ------------------------------------------------------------
revoke all on function public.xoa_cay(uuid, text) from public, anon;
revoke all on function public.tra_lai_cay(uuid)   from public, anon;
grant execute on function public.xoa_cay(uuid, text) to authenticated;
grant execute on function public.tra_lai_cay(uuid)   to authenticated;

-- ------------------------------------------------------------
-- 4. Xoá tên cũ
-- ------------------------------------------------------------
drop function if exists public.xin_xoa_cay(uuid, text);
drop function if exists public.huy_xin_xoa_cay(uuid);

-- ------------------------------------------------------------
-- Tự kiểm
-- ------------------------------------------------------------
select 'hai tên mới có mặt' as phep,
       case when to_regprocedure('public.xoa_cay(uuid, text)') is not null
             and to_regprocedure('public.tra_lai_cay(uuid)') is not null
            then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 'hai tên cũ đã xoá',
       case when to_regprocedure('public.xin_xoa_cay(uuid, text)') is null
             and to_regprocedure('public.huy_xin_xoa_cay(uuid)') is null
            then 'ĐẠT' else 'HỎNG' end
union all
select 'anon KHÔNG gọi được hai hàm mới',
       case when not has_function_privilege('anon', 'public.xoa_cay(uuid, text)', 'execute')
             and not has_function_privilege('anon', 'public.tra_lai_cay(uuid)', 'execute')
            then 'ĐẠT' else 'HỎNG' end;

commit;
