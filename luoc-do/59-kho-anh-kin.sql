-- ============================================================
-- giapha-supabase · luoc-do/59-kho-anh-kin.sql
-- Vai trò  : Kho ảnh `anh` chuyển sang KÍN (chủ dự án chốt 30/09/2026).
--            Từ nay không còn đường dẫn công khai: trình duyệt xin CHỮ KÝ
--            (`createSignedUrls`), và máy chủ chỉ ký cho người được xem.
--              1. `co_the_xem_anh(ten)` — ai được xem một file trong kho
--              2. luật đọc `xem_anh` trên `storage.objects`
--              3. kho `anh` thôi `public`
-- Cần có   : `53` (ds_nguoi_xem_duoc bản cuối) · `23` (co_the_xem_cay bản cuối).
-- ⚠ THỨ TỰ: mã JS (b161a) đi TRƯỚC file này cũng được, đi SAU cũng được —
--   `utils/image.js` rơi về đường công khai khi chưa xin được chữ ký. Nhưng
--   dán file này rồi thì đường công khai chết hẳn: trang nào chưa Ctrl+F5 sẽ
--   hiện bóng người thay ảnh cho tới khi tải lại.
-- ⚠ Được xem khi MỘT trong ba:
--     · Quản trị hệ thống (kể cả tệp nằm gốc kho — tab Dữ liệu mồ côi xem trước);
--     · xem được cây mang tên thư mục đầu (`<tree_id>/…`) — lối nhanh, phủ gần hết;
--     · xem được một cây chứa người (hoặc một vợ/chồng của cặp) mà ảnh ấy
--       thuộc về — cho người xuyên cây: ảnh tải lên ở cây A, người ấy hiện ở
--       cây B, người xem chỉ có chân ở B.
--   Cả ba đều theo CÂY (như lối nhanh), không theo `ds_nguoi_xem_duoc()`:
--   tập ấy dựng lại mỗi lần gọi — đo 9 giây cho 700 file.
-- ⚠ Chưa kín bằng dữ liệu ở MỘT chỗ, nói thẳng: nhóm *Ảnh* tắt cho khách/vai
--   xem (`47`, `53`) chỉ bỏ đường dẫn khỏi `doc_cay()`; ai đã biết sẵn đường
--   dẫn và xem được cây thì vẫn xin được chữ ký. Đường dẫn mang uuid, không đoán
--   ra được — chỉ lọt khi đã từng thấy.
-- ⚠ Sao lưu không đổi: `SaoLuu.gs` đọc qua `/object/authenticated/` bằng luật
--   `liet_ke_anh` (`05`), vốn không cần kho công khai.
-- JS      : `sb.kyAnh()` · `repo.js` `kyAnhCuaCay()` · `utils/image.js` `ghiChuKy()`.
-- Đo      : ../kiem-thu/ban-thu-sql/do-b161a.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 30/09/2026 (b161a)
-- ============================================================

begin;

do $$
begin
  if to_regprocedure('public.ds_nguoi_xem_duoc()') is null
     or to_regprocedure('public.ds_hon_nhan_xem_duoc()') is null then
    raise exception 'DỪNG: chưa dán 26/53 (thiếu ds_nguoi_xem_duoc / ds_hon_nhan_xem_duoc).';
  end if;
  if to_regprocedure('public.co_the_xem_cay(uuid)') is null then
    raise exception 'DỪNG: thiếu co_the_xem_cay(uuid).';
  end if;
end $$;

-- ------------------------------------------------------------
-- 1. co_the_xem_anh(ten)
-- ------------------------------------------------------------
-- plpgsql để giữ THỨ TỰ xét: so chuỗi uuid trước khi ép kiểu (tệp ở gốc kho
-- ép `::uuid` là ném lỗi cả câu ký — cùng bẫy `05` mục 5), lối nhanh trước
-- lối chậm.
create or replace function public.co_the_xem_anh(p_ten text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_dau text := split_part(coalesce(p_ten, ''), '/', 1);
begin
  if p_ten is null or p_ten = '' then return false; end if;
  if public.la_quan_tri_he_thong() then return true; end if;

  if v_dau ~ '^[0-9a-fA-F-]{36}$' and public.co_the_xem_cay(v_dau::uuid) then
    return true;
  end if;

  -- Lối chậm hỏi ĐÚNG người/cặp của file, không dựng cả `ds_nguoi_xem_duoc()`
  -- (đo b161a: dựng cả tập mỗi file = 9 giây cho 700 file).
  return exists (select 1 from public.persons p
                   join public.tree_persons tp on tp.person_id = p.id
                  where p.photo_file_id = p_ten
                    and public.co_the_xem_cay(tp.tree_id))
      or exists (select 1 from public.media m
                   join public.tree_persons tp on tp.person_id = m.subject_id
                  where p_ten in (m.drive_file_id, m.drive_file_id_lon)
                    and not m.deleted
                    and public.co_the_xem_cay(tp.tree_id))
      or exists (select 1 from public.media m
                   join public.unions u on u.id = m.subject_id
                   join public.tree_persons tp on tp.person_id = any(u.partners)
                  where p_ten in (m.drive_file_id, m.drive_file_id_lon)
                    and not m.deleted
                    and public.co_the_xem_cay(tp.tree_id));
end;
$$;

revoke all on function public.co_the_xem_anh(text) from public, anon;
grant execute on function public.co_the_xem_anh(text) to authenticated;

-- Lối chậm tra theo đường dẫn — không có chỉ mục là quét cả bảng mỗi file.
create index if not exists media_drive_file_idx     on public.media (drive_file_id)     where drive_file_id <> '';
create index if not exists media_drive_file_lon_idx on public.media (drive_file_id_lon) where drive_file_id_lon <> '';
create index if not exists persons_photo_file_idx   on public.persons (photo_file_id)   where photo_file_id <> '';

-- ------------------------------------------------------------
-- 2. Luật đọc `xem_anh`
-- ------------------------------------------------------------
-- Cộng dồn với `liet_ke_anh` (`05`) — Postgres gộp các luật cùng lệnh bằng OR.
-- `liet_ke_anh` để nguyên: máy sao lưu (vai `sao_luu`) đi qua nó.
drop policy if exists xem_anh on storage.objects;
create policy xem_anh on storage.objects
  for select to authenticated
  using (bucket_id = 'anh' and public.co_the_xem_anh(name));

-- ------------------------------------------------------------
-- 3. Kho thôi công khai
-- ------------------------------------------------------------
update storage.buckets set public = false where id = 'anh';

-- ------------------------------------------------------------
-- Tự kiểm
-- ------------------------------------------------------------
select 'kho anh đã KÍN' as phep,
       case when (select not public from storage.buckets where id = 'anh') then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 'luật xem_anh có mặt',
       case when exists (select 1 from pg_policies where schemaname = 'storage'
                          and tablename = 'objects' and policyname = 'xem_anh')
            then 'ĐẠT' else 'HỎNG' end
union all
select 'anon KHÔNG gọi được co_the_xem_anh',
       case when not has_function_privilege('anon', 'public.co_the_xem_anh(text)', 'execute')
            then 'ĐẠT' else 'HỎNG' end;

commit;
