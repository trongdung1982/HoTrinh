-- ============================================================
-- giapha-supabase · luoc-do/61-mo-coi-ca-cap.sql
-- Vai trò  : Dọn nốt hai chỗ tab *Dữ liệu mồ côi* (`58`) còn chịu (b161d):
--              1. Người ngoài mọi cây mà còn đứng trong CẶP. Hay gặp nhất là
--                 sau *Dọn thùng rác*: cả cây bị cắt khỏi `tree_persons`, vợ
--                 chồng thành mồ côi CÙNG NHAU và khoá lẫn nhau. Nay xoá được
--                 cặp nào KHÔNG thành viên nào (vợ/chồng/con) còn thuộc cây nào
--                 — cặp ấy không cây nào vẽ, xoá không đổi gia phả đang dùng.
--              2. File thừa trong thư mục của cây đang ẩn/thùng rác/đã xoá hẳn,
--                 và tệp nằm ở gốc kho: luật `xoa_anh` (`02`) hỏi `co_the_sua`
--                 cây ấy → luôn từ chối, còn tệp gốc kho làm ép `::uuid` nổ cả
--                 lượt xoá. Nay QTHT xoá được file KHÔNG bản ghi nào trỏ tới.
-- Cần có   : `58` (don_mo_coi_he_thong) · `27` (ds_nguoi_mo_coi, ten_day_du).
-- ⚠ Cặp còn MỘT thành viên thuộc cây (vd. chồng ở cây A, vợ ngoài mọi cây)
--   vẫn KHÔNG xoá — đụng vào nó là đổi dữ liệu cây A ngoài `luu_cay()` (không
--   `change_log`, không `revision`). `ds_nguoi_mo_coi().so_hon_nhan` nay đếm
--   đúng những cặp khoá ấy, nên ô tích chỉ khoá khi thật sự không xoá được.
-- ⚠ Xoá cặp mồ côi kéo theo: `union_children` (cascade) + ảnh cưới của cặp.
--   Người mồ côi KHÔNG được chọn mà cùng cặp thì ở lại, thành mồ côi đơn —
--   lần quét sau xoá được.
-- ⚠ Lối mới của `xoa_anh` chỉ cho file KHÔNG ai trỏ tới. File trong thư mục
--   mang mã cây thì QTHT vốn xoá được qua `co_the_sua` (quyền sửa mọi cây) —
--   luật cũ, không đổi ở đây (đo b161d S4).
-- ⚠ `anh_con_dung()` là `security definer`: hỏi qua RLS thì QTHT không thấy
--   ảnh của người ngoài mọi cây → tưởng "không ai dùng" → xoá nhầm.
-- JS      : `sb.donMoCoiHeThong()` (trả thêm `honNhan`) · `khu-du-lieu-mo-coi.js`.
-- Đo      : ../kiem-thu/ban-thu-sql/do-b161d.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 30/09/2026 (b161d)
-- ============================================================

begin;

do $$
begin
  if to_regprocedure('public.don_mo_coi_he_thong(text[], text[])') is null then
    raise exception 'DỪNG: chưa dán 58-du-lieu-mo-coi.sql.';
  end if;
end $$;

-- ------------------------------------------------------------
-- 0. Cặp "khoá" = có ít nhất một thành viên còn thuộc một cây
-- ------------------------------------------------------------
create or replace function public.hon_nhan_con_cay(p_union text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.unions u
                   cross join unnest(u.partners) x(ma)
                   join public.tree_persons tp on tp.person_id = x.ma
                  where u.id = p_union)
      or exists (select 1 from public.union_children c
                   join public.tree_persons tp on tp.person_id = c.person_id
                  where c.union_id = p_union);
$$;

revoke all on function public.hon_nhan_con_cay(text) from public, anon;

-- ------------------------------------------------------------
-- 1. ds_nguoi_mo_coi — `so_hon_nhan` chỉ đếm cặp KHOÁ (thân `27` mục 3)
-- ------------------------------------------------------------
create or replace function public.ds_nguoi_mo_coi()
returns table(id text, ten text, nam_sinh text, nam_mat text, gioi text,
              da_xoa boolean, so_hon_nhan bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id,
         coalesce(nullif(public.ten_day_du(p.names), ''), p.id),
         coalesce(left(nullif(p.birth->>'iso', ''), 4),
                  substring(coalesce(p.birth->>'raw', '') from '\d{4}'), ''),
         coalesce(left(nullif(p.death->>'iso', ''), 4),
                  substring(coalesce(p.death->>'raw', '') from '\d{4}'), ''),
         p.sex,
         coalesce(p.deleted, false),
         (select count(*) from (
            select u.id from public.unions u where p.id = any(u.partners)
            union
            select c.union_id from public.union_children c where c.person_id = p.id
          ) h where public.hon_nhan_con_cay(h.id))
    from public.persons p
   where not exists (select 1 from public.tree_persons tp where tp.person_id = p.id)
     and public.la_quan_tri_he_thong()
   order by p.id;
$$;

revoke all on function public.ds_nguoi_mo_coi() from public, anon;
grant execute on function public.ds_nguoi_mo_coi() to authenticated;

-- ------------------------------------------------------------
-- 2. don_mo_coi_he_thong — xoá cả cặp mồ côi (thay bản `58`)
-- ------------------------------------------------------------
create or replace function public.don_mo_coi_he_thong(p_nguoi text[], p_anh text[])
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ung     text[] := '{}';   -- ứng viên: tồn tại, ngoài mọi cây, không gắn tài khoản
  v_hn      text[] := '{}';   -- cặp mồ côi chạm ứng viên
  v_nguoi   text[] := '{}';
  v_anh     text[] := '{}';
  v_file    text[] := '{}';
  v_bo_qua  text[] := '{}';
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'lyDo', 'khongcoquyen',
      'loi', 'Chỉ Quản trị hệ thống mới dọn được dữ liệu mồ côi.');
  end if;

  v_ung := array(
    select x from unnest(coalesce(p_nguoi, '{}')) x
     where exists (select 1 from public.persons p where p.id = x)
       and not exists (select 1 from public.tree_persons tp where tp.person_id = x)
       and not exists (select 1 from public.tai_khoan k where k.person_id = x));

  v_hn := array(
    select u.id from public.unions u
     where (u.partners && v_ung
            or exists (select 1 from public.union_children c
                        where c.union_id = u.id and c.person_id = any(v_ung)))
       and not public.hon_nhan_con_cay(u.id));

  -- Người xoá được khi MỌI cặp của họ nằm trong `v_hn`.
  v_nguoi := array(
    select x from unnest(v_ung) x
     where not exists (select 1 from public.unions u
                        where x = any(u.partners) and not (u.id = any(v_hn)))
       and not exists (select 1 from public.union_children c
                        where c.person_id = x and not (c.union_id = any(v_hn))));
  v_bo_qua := array(select x from unnest(coalesce(p_nguoi, '{}')) x where not (x = any(v_nguoi)));

  -- Ảnh: của người/cặp sắp xoá, cộng ảnh mất chủ đã chọn.
  select coalesce(array_agg(m.id), '{}') into v_anh
    from public.media m
   where m.subject_id = any(v_nguoi)
      or m.subject_id = any(v_hn)
      or (m.id = any(coalesce(p_anh, '{}'))
          and not exists (select 1 from public.persons p where p.id = m.subject_id)
          and not exists (select 1 from public.unions u where u.id = m.subject_id));
  v_bo_qua := v_bo_qua || array(
    select x from unnest(coalesce(p_anh, '{}')) x where not (x = any(v_anh)));

  -- File: chỉ file mà sau khi xoá KHÔNG còn bản ghi nào khác trỏ tới.
  select coalesce(array_agg(distinct f), '{}') into v_file
    from (select drive_file_id as f from public.media where id = any(v_anh)
          union select drive_file_id_lon from public.media where id = any(v_anh)
          union select photo_file_id from public.persons where id = any(v_nguoi)) x
   where f <> ''
     and not exists (select 1 from public.media m2
                      where not (m2.id = any(v_anh)) and f in (m2.drive_file_id, m2.drive_file_id_lon))
     and not exists (select 1 from public.persons p2
                      where not (p2.id = any(v_nguoi)) and p2.photo_file_id = f);

  delete from public.media   where id = any(v_anh);
  delete from public.unions  where id = any(v_hn);       -- union_children đi theo (cascade)
  delete from public.persons where id = any(v_nguoi);

  if cardinality(v_nguoi) + cardinality(v_anh) + cardinality(v_hn) > 0 then
    perform public.ghi_nhat_ky('qtht', 'don_mo_coi',
      cardinality(v_nguoi) || ' người · ' || cardinality(v_hn) || ' cặp · ' || cardinality(v_anh) || ' ảnh',
      jsonb_build_object('nguoi', v_nguoi, 'honNhan', v_hn, 'anh', v_anh, 'file', v_file));
  end if;

  return jsonb_build_object('ok', true, 'nguoi', to_jsonb(v_nguoi), 'honNhan', to_jsonb(v_hn),
                            'anh', to_jsonb(v_anh), 'file', to_jsonb(v_file),
                            'boQua', to_jsonb(v_bo_qua));
end;
$$;

revoke all on function public.don_mo_coi_he_thong(text[], text[]) from public, anon;
grant execute on function public.don_mo_coi_he_thong(text[], text[]) to authenticated;

-- ------------------------------------------------------------
-- 3. Luật xoá file kho: thêm lối cho QTHT với file KHÔNG ai trỏ tới
-- ------------------------------------------------------------
create or replace function public.anh_con_dung(p_ten text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.media m where p_ten in (m.drive_file_id, m.drive_file_id_lon))
      or exists (select 1 from public.persons p where p.photo_file_id = p_ten);
$$;

revoke all on function public.anh_con_dung(text) from public, anon;
grant execute on function public.anh_con_dung(text) to authenticated;

-- `case` giữ THỨ TỰ: so chuỗi uuid trước khi ép kiểu (tệp gốc kho).
drop policy if exists xoa_anh on storage.objects;
create policy xoa_anh on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'anh'
    and (
      case when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
           then public.co_the_sua(((storage.foldername(name))[1])::uuid)
           else false end
      or (public.la_quan_tri_he_thong() and not public.anh_con_dung(name))
    )
  );

-- ------------------------------------------------------------
-- Tự kiểm
-- ------------------------------------------------------------
select 'ba hàm mới/thay có mặt' as phep,
       case when to_regprocedure('public.hon_nhan_con_cay(text)') is not null
             and to_regprocedure('public.anh_con_dung(text)') is not null
             and to_regprocedure('public.don_mo_coi_he_thong(text[], text[])') is not null
            then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 'luật xoa_anh có mặt',
       case when exists (select 1 from pg_policies where schemaname = 'storage'
                          and tablename = 'objects' and policyname = 'xoa_anh')
            then 'ĐẠT' else 'HỎNG' end
union all
select 'anon KHÔNG gọi được hàm dọn',
       case when not has_function_privilege('anon', 'public.don_mo_coi_he_thong(text[], text[])', 'execute')
            then 'ĐẠT' else 'HỎNG' end;

commit;
