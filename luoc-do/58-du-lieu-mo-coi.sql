-- ============================================================
-- giapha-supabase · luoc-do/58-du-lieu-mo-coi.sql
-- Vai trò  : Tab *Dữ liệu mồ côi* của Quản trị hệ thống (b159c) — những thứ
--            KHÔNG cây nào giữ, nên `luu_cay()` không với tới:
--              1. `ds_anh_mat_chu()`   bản ghi ảnh trỏ vào người/cặp không còn
--              2. `ds_file_thua()`     file trong kho `anh` không bản ghi nào trỏ tới
--              3. `don_mo_coi_he_thong(p_nguoi, p_anh)` xoá hẳn người KHÔNG thuộc
--                 cây nào (danh sách `ds_nguoi_mo_coi()` của `27`) + ảnh mất chủ
--            Chỉ QTHT. Người mồ côi / gia đình mồ côi TRONG một cây thì trình
--            duyệt tự dò và ghi qua `luu_cay()` như mọi lần sửa — không ở đây.
-- Cần có   : `27` (ds_nguoi_mo_coi) · `42` (ghi_nhat_ky).
-- ⚠ File trong kho KHÔNG xoá ở đây: Supabase cấm xoá thẳng `storage.objects`
--   bằng SQL (file thật nằm ngoài Postgres). Hàm 3 trả danh sách đường dẫn,
--   trình duyệt xoá bằng Storage API (`sb.xoaAnhThat`, luật `xoa_anh`).
-- ⚠ Hàm 3 kiểm LẠI từng mã lúc xoá — danh sách trên màn hình có thể đã cũ.
--   Người còn trong một cây · còn đứng trong cặp nào · còn gắn tài khoản thì
--   KHÔNG xoá, trả về trong `boQua`. Ảnh mà chủ thể đã có lại thì cũng bỏ qua.
-- ⚠ `ds_file_thua()` bỏ file mới tải lên dưới 1 ngày: tải ảnh xong mới Lưu,
--   giữa hai bước ấy file chưa có ai trỏ tới mà KHÔNG phải rác.
-- JS      : `sb.js` `dsAnhMatChu()` · `dsFileThua()` · `donMoCoiHeThong()`.
--           Chạy được cả khi chưa dán (bảng báo "chưa dán 58").
-- Đo      : ../kiem-thu/ban-thu-sql/do-b159c.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 29/09/2026 (b159c)
-- ============================================================

begin;

do $$
begin
  if to_regprocedure('public.ds_nguoi_mo_coi()') is null then
    raise exception 'DỪNG: chưa dán 27-ham-mot-nguoi.sql (thiếu ds_nguoi_mo_coi).';
  end if;
  if to_regprocedure('public.ghi_nhat_ky(text, text, text, jsonb, uuid)') is null then
    raise exception 'DỪNG: chưa dán 42-nhat-ky-he-thong.sql (thiếu ghi_nhat_ky).';
  end if;
end $$;

-- ------------------------------------------------------------
-- 1. Ảnh mất chủ
-- ------------------------------------------------------------
-- Chủ thể mang cờ `deleted` thì CHƯA mất chủ — người ấy còn khôi phục được,
-- và Xoá vĩnh viễn người ấy sẽ dọn ảnh theo (`domains/purge.js`).
drop function if exists public.ds_anh_mat_chu();
create function public.ds_anh_mat_chu()
returns table(media_id text, subject_id text, duong_dan text, duong_dan_lon text,
              chu_thich text, cay_id uuid, ten_cay text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.id, m.subject_id, m.drive_file_id, m.drive_file_id_lon, m.caption,
         t.id, coalesce(t.name, '')
    from public.media m
    cross join lateral (select split_part(m.drive_file_id, '/', 1) as ma) thu_muc
    -- So CHUỖI, không ép `::uuid`: tệp nằm ở gốc kho thì ép kiểu ném lỗi cả câu.
    left join public.trees t on t.id::text = thu_muc.ma
   where not m.deleted
     and not exists (select 1 from public.persons p where p.id = m.subject_id)
     and not exists (select 1 from public.unions u where u.id = m.subject_id)
     and public.la_quan_tri_he_thong()
   order by m.id;
$$;

-- ------------------------------------------------------------
-- 2. File thừa trong kho
-- ------------------------------------------------------------
drop function if exists public.ds_file_thua();
create function public.ds_file_thua()
returns table(duong_dan text, tao_luc timestamptz, cay_id uuid, ten_cay text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with dang_dung as (
    select drive_file_id as d from public.media where drive_file_id <> ''
    union select drive_file_id_lon from public.media where drive_file_id_lon <> ''
    union select photo_file_id from public.persons where photo_file_id <> ''
  )
  select o.name, o.created_at, t.id, coalesce(t.name, '')
    from storage.objects o
    left join public.trees t on t.id::text = split_part(o.name, '/', 1)
   where o.bucket_id = 'anh'
     and o.created_at < now() - interval '1 day'
     and not exists (select 1 from dang_dung where d = o.name)
     and public.la_quan_tri_he_thong()
   order by o.name;
$$;

-- ------------------------------------------------------------
-- 3. Dọn: người không thuộc cây nào + ảnh mất chủ
-- ------------------------------------------------------------
drop function if exists public.don_mo_coi_he_thong(text[], text[]);
create function public.don_mo_coi_he_thong(p_nguoi text[], p_anh text[])
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_nguoi   text[] := '{}';
  v_anh     text[] := '{}';
  v_file    text[] := '{}';
  v_bo_qua  text[] := '{}';
  v_ma      text;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'lyDo', 'khongcoquyen',
      'loi', 'Chỉ Quản trị hệ thống mới dọn được dữ liệu mồ côi.');
  end if;

  -- Người: chỉ xoá khi VẪN không cây nào giữ, không cặp nào, không tài khoản.
  foreach v_ma in array coalesce(p_nguoi, '{}') loop
    if exists (select 1 from public.persons p where p.id = v_ma)
       and not exists (select 1 from public.tree_persons tp where tp.person_id = v_ma)
       and not exists (select 1 from public.unions u where v_ma = any(u.partners))
       and not exists (select 1 from public.union_children c where c.person_id = v_ma)
       and not exists (select 1 from public.tai_khoan k where k.person_id = v_ma)
    then
      v_nguoi := v_nguoi || v_ma;
    else
      v_bo_qua := v_bo_qua || v_ma;
    end if;
  end loop;

  -- Ảnh của chính những người sắp xoá đi theo họ, cộng ảnh mất chủ đã chọn.
  select coalesce(array_agg(m.id), '{}') into v_anh
    from public.media m
   where m.subject_id = any(v_nguoi)
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
  delete from public.persons where id = any(v_nguoi);

  if cardinality(v_nguoi) + cardinality(v_anh) > 0 then
    perform public.ghi_nhat_ky('qtht', 'don_mo_coi',
      cardinality(v_nguoi) || ' người · ' || cardinality(v_anh) || ' ảnh',
      jsonb_build_object('nguoi', v_nguoi, 'anh', v_anh, 'file', v_file));
  end if;

  return jsonb_build_object('ok', true, 'nguoi', to_jsonb(v_nguoi), 'anh', to_jsonb(v_anh),
                            'file', to_jsonb(v_file), 'boQua', to_jsonb(v_bo_qua));
end;
$$;

revoke all on function public.ds_anh_mat_chu() from public, anon;
revoke all on function public.ds_file_thua() from public, anon;
revoke all on function public.don_mo_coi_he_thong(text[], text[]) from public, anon;
grant execute on function public.ds_anh_mat_chu() to authenticated;
grant execute on function public.ds_file_thua() to authenticated;
grant execute on function public.don_mo_coi_he_thong(text[], text[]) to authenticated;

-- ------------------------------------------------------------
-- Tự kiểm
-- ------------------------------------------------------------
select 'ba hàm có mặt' as phep,
       case when to_regprocedure('public.ds_anh_mat_chu()') is not null
             and to_regprocedure('public.ds_file_thua()') is not null
             and to_regprocedure('public.don_mo_coi_he_thong(text[], text[])') is not null
            then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 'anon KHÔNG gọi được hàm dọn',
       case when not has_function_privilege('anon', 'public.don_mo_coi_he_thong(text[], text[])', 'execute')
            then 'ĐẠT' else 'HỎNG' end;

commit;
