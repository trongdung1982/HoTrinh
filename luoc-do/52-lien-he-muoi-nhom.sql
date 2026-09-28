-- ============================================================
-- giapha-supabase · luoc-do/52-lien-he-muoi-nhom.sql
-- Vai trò  : Cột mới `persons.contact` (Liên hệ) · công khai theo MƯỜI nhóm
--            thay vì sáu — thêm Sống/mất · Đời · Quê quán (tách khỏi Tiểu
--            sử) · Liên hệ (b150b). Đủ 11 dòng của quantri3 `#public-info-detail`.
-- ⚠ TỪ 29/09: `53` đứng sau file này cho `doc_cay()` · `doc_ho_so_nguoi()` —
--   dán lại file này thì PHẢI dán lại `53` (so-tay/phan-quyen.md).
-- Cần có   : `51`. ⚠ Bản ĐỨNG CUỐI của `che_nguoi()` · `doc_cay()` ·
--            `doc_ho_so_nguoi()` · `dat_truong_cong_khai()` ·
--            `dat_cong_khai_tai_khoan()` · `truong_rieng_nguoi()` · luật đọc
--            `tree_persons` — dán lại `26`/`47`/`50`/`51` thì PHẢI dán lại file
--            này. ⚠ VÁ TẠI CHỖ `luu_cay()` (bản `32`) · `tu_choi_thay_doi()`
--            (bản `28`) · `gop_hai_nguoi()` (bản `48`) — dán lại một trong ba
--            file ấy thì PHẢI dán lại file này, không thì ô Liên hệ thôi lưu,
--            IM LẶNG.
-- Thiết kế : chốt 28/09/2026 — Liên hệ là MỘT ô chữ tự do.
-- Sổ tay   : so-tay/phan-quyen.md · so-tay/luu-du-lieu.md
--            Đo: ../kiem-thu/ban-thu-sql/do-b150b.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 28/09/2026 (b150b)
-- ============================================================
--
-- ⚠ `contact` CHO PHÉP NULL, khác sáu cột chữ của `01`. `luu_cay()` chèn bằng
--   `jsonb_populate_recordset`: bản ghi thiếu khoá (tab chưa Ctrl+F5, ảnh chụp
--   `change_log` cũ mà `tu_choi_thay_doi()` trả lại) ra NULL. `not null` thì
--   những lần ấy HỎNG; còn `contact = excluded.contact` thì XOÁ TRẮNG liên hệ
--   đang có. Nên: cho null, và cập nhật bằng `coalesce(excluded.contact, cũ)`.
--   App đọc null như chuỗi rỗng — trống thì không vẽ hàng đó.
--
-- Mười nhóm (Họ tên cố định):
--   gioi_tinh · nam_sinh · ngay_sinh · ngay_mat (death + an táng + giỗ) ·
--   song_mat (living; tắt thì ngày mất cũng tắt) · doi (Đời: `vn.generation`
--   + `tree_persons.doi`) · que_quan (residence) · anh · tieu_su (note, title,
--   occupation, education, religion, nationality) · lien_he (contact).
-- Chuyển dữ liệu (chạy MỘT lần — nhận ra bằng ràng buộc cũ chưa biết
--   `lien_he`): mọi danh sách đang có thêm song_mat + doi (xưa nay luôn hiện);
--   có tieu_su thì thêm que_quan (xưa nay đi theo tiểu sử); lien_he KHÔNG thêm
--   — trường mới, nhạy cảm, mặc định kín.
--
-- ⚠ Đời có đường đọc THỨ HAI: app đọc thẳng `tree_persons` (`sb.cauDoi`).
--   Che trong `doc_cay()` mà để khách đọc thẳng bảng ấy là tấm rèm. Nên:
--   `doc_cay()` trả `doi` (đã che), và khách THÔI đọc thẳng `tree_persons`
--   của cây mình chỉ là khách.

begin;

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'truong_rieng_nguoi') then
    raise exception 'DỪNG: chưa dán 51-cong-khai-ca-nhan.sql (thiếu truong_rieng_nguoi).';
  end if;
end $$;

-- ------------------------------------------------------------
-- 1. Cột Liên hệ
-- ------------------------------------------------------------
alter table public.persons add column if not exists contact text default '';

-- ------------------------------------------------------------
-- 2. Mười nhóm — danh sách, chuyển dữ liệu, ràng buộc
-- ------------------------------------------------------------
create or replace function public.ds_nhom_cong_khai()
returns text[]
language sql
immutable
set search_path = public, pg_temp
as $$
  select array['gioi_tinh', 'nam_sinh', 'ngay_sinh', 'ngay_mat', 'song_mat', 'doi',
               'que_quan', 'anh', 'tieu_su', 'lien_he'];
$$;

-- Chạy MỘT lần: ràng buộc hiện hành chưa biết `lien_he` = chưa chuyển.
do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'trees_truong_cong_khai_hop_le'
                    and pg_get_constraintdef(oid) like '%lien_he%') then
    alter table public.trees drop constraint if exists trees_truong_cong_khai_hop_le;
    alter table public.tree_members drop constraint if exists tree_members_truong_cong_khai_hop_le;

    update public.trees set truong_cong_khai = array(
      select distinct x from unnest(truong_cong_khai || array['song_mat', 'doi']
        || case when 'tieu_su' = any(truong_cong_khai) then array['que_quan'] else '{}'::text[] end) x
      order by 1);
    update public.tree_members set truong_cong_khai = array(
      select distinct x from unnest(truong_cong_khai || array['song_mat', 'doi']
        || case when 'tieu_su' = any(truong_cong_khai) then array['que_quan'] else '{}'::text[] end) x
      order by 1)
     where truong_cong_khai is not null;
  end if;
end $$;

alter table public.trees alter column truong_cong_khai
  set default array['gioi_tinh', 'nam_sinh', 'ngay_sinh', 'ngay_mat', 'song_mat', 'doi',
                    'que_quan', 'anh', 'tieu_su'];

alter table public.trees drop constraint if exists trees_truong_cong_khai_hop_le;
alter table public.trees add constraint trees_truong_cong_khai_hop_le
  check (truong_cong_khai <@ array['gioi_tinh', 'nam_sinh', 'ngay_sinh', 'ngay_mat', 'song_mat',
                                   'doi', 'que_quan', 'anh', 'tieu_su', 'lien_he']);
alter table public.tree_members drop constraint if exists tree_members_truong_cong_khai_hop_le;
alter table public.tree_members add constraint tree_members_truong_cong_khai_hop_le
  check (truong_cong_khai is null
         or truong_cong_khai <@ array['gioi_tinh', 'nam_sinh', 'ngay_sinh', 'ngay_mat', 'song_mat',
                                      'doi', 'que_quan', 'anh', 'tieu_su', 'lien_he']);

-- ------------------------------------------------------------
-- 3. che_nguoi() — mười nhóm
-- ------------------------------------------------------------
-- `vn` tính MỘT lần: hai vế `||` cùng khoá `vn` thì vế sau đè vế trước.
create or replace function public.che_nguoi(p jsonb, p_mo text[])
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select p
    || jsonb_build_object('meta', coalesce(p->'meta', '{}'::jsonb) - 'updatedBy' - 'createdBy')
    || jsonb_build_object('vn', coalesce(p->'vn', '{}'::jsonb)
         - (case when 'ngay_mat' = any(p_mo) and 'song_mat' = any(p_mo) then '' else 'gio' end)
         - (case when 'doi' = any(p_mo) then '' else 'generation' end))
    || case when 'gioi_tinh' = any(p_mo) then '{}'::jsonb
            else jsonb_build_object('sex', 'U') end
    || case when 'ngay_sinh' = any(p_mo) then '{}'::jsonb
            when 'nam_sinh' = any(p_mo) then jsonb_build_object('birth', jsonb_build_object(
              'iso', null, 'place', '',
              'raw', coalesce(left(nullif(p->'birth'->>'iso', ''), 4),
                              substring(coalesce(p->'birth'->>'raw', '') from '\d{4}'), '')))
            else jsonb_build_object('birth', '{"iso":null,"raw":"","place":""}'::jsonb) end
    || case when 'ngay_mat' = any(p_mo) and 'song_mat' = any(p_mo) then '{}'::jsonb
            else jsonb_build_object('death', '{"iso":null,"raw":"","place":""}'::jsonb,
                                    'burial_place', '') end
    -- Tắt Sống/mất: `living` = null — app không vẽ dấu đã mất, không tính tuổi.
    || case when 'song_mat' = any(p_mo) then '{}'::jsonb
            else jsonb_build_object('living', null) end
    || case when 'anh' = any(p_mo) then '{}'::jsonb
            else jsonb_build_object('photo_file_id', '') end
    || case when 'tieu_su' = any(p_mo) then '{}'::jsonb
            else jsonb_build_object('note', '', 'title', '', 'occupation', '', 'education', '',
                                    'religion', '', 'nationality', '') end
    || case when 'que_quan' = any(p_mo) then '{}'::jsonb
            else jsonb_build_object('residence', '') end
    || case when 'lien_he' = any(p_mo) then '{}'::jsonb
            else jsonb_build_object('contact', '') end;
$$;

-- ------------------------------------------------------------
-- 4. truong_rieng_nguoi() — thân `51`, vũ trụ mười nhóm
-- ------------------------------------------------------------
create or replace function public.truong_rieng_nguoi(p_person text, p_tree uuid)
returns text[]
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with r as (
    select m.tree_id, m.truong_cong_khai as t
      from public.tree_members m join public.tai_khoan k on k.user_id = m.user_id
     where k.person_id = p_person),
  chon as (
    select t from r where tree_id = p_tree
    union all
    select t from r where not exists (select 1 from r where tree_id = p_tree)),
  dat as (select t from chon where t is not null)
  select case when not exists (select 1 from dat) then null
    else array(select x from unnest(public.ds_nhom_cong_khai()) x
                where not exists (select 1 from dat where not x = any(dat.t))) end;
$$;

-- ------------------------------------------------------------
-- 5. doc_cay() — thân `51` + nhóm giữ của người còn sống thêm song_mat, doi
--    + trả Đời đã che
-- ------------------------------------------------------------
create or replace function public.doc_cay(p_tree uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_nguoi   text[];
  v_hn      text[];
  v_bien    text[];
  v_khach   boolean;
  v_mo      text[];
  v_chi_xem boolean;
  v_che     text[] := '{}';
  v_rieng   jsonb  := '{}';
  v_an_anh  text[] := '{}';
  -- Người còn sống với người chỉ xem (`50`): GIỮ giới tính · năm sinh · sống/mất
  -- · Đời · (ngày mất — người còn sống vốn trống). Che mọi thứ còn lại.
  c_mo_song constant text[] := array['gioi_tinh', 'nam_sinh', 'ngay_mat', 'song_mat', 'doi'];
begin
  if p_tree is null or not public.co_the_xem_cay(p_tree) then
    return jsonb_build_object('ok', false,
      'loi', 'Không đọc được gia phả này. Có thể bạn đã bị gỡ khỏi danh sách người được xem.');
  end if;

  v_khach := public.la_khach_cay(p_tree);
  select t.truong_cong_khai into v_mo from public.trees t where t.id = p_tree;
  v_mo := coalesce(v_mo, '{}'::text[]);
  v_chi_xem := not v_khach and public.la_chi_xem_cay(p_tree);

  v_nguoi := array(select person_id from public.tree_persons where tree_id = p_tree);
  v_hn    := array(select public.ds_hon_nhan_cua_cay(p_tree));

  v_bien := array(
    select distinct x from (
      select unnest(partners) as x from public.unions where id = any(v_hn)
      union
      select person_id as x from public.union_children where union_id = any(v_hn)
    ) t
    where x <> all(v_nguoi)
  );

  if v_chi_xem then
    v_che := array(
      select p.id from public.persons p
       where (p.id = any(v_nguoi) or p.id = any(v_bien))
         and public.coi_con_song(p.living, p.birth, p.death, p.burial_place, p.vn)
         and p.id not in (select public.ds_nguoi_xem_day_du()));
  end if;

  if v_khach then
    v_rieng := coalesce((
      select jsonb_object_agg(x.id, x.t) from (
        select k.person_id as id, to_jsonb(public.truong_rieng_nguoi(k.person_id, p_tree)) as t
          from (select distinct person_id from public.tai_khoan
                 where person_id = any(v_nguoi) or person_id = any(v_bien)) k) x
       where x.t is not null), '{}'::jsonb);
    v_an_anh := array(select e.key from jsonb_each(v_rieng) e where not (e.value ? 'anh'));
  end if;

  return jsonb_build_object('ok', true,
    -- Cờ + danh sách mã đã che: app nói "bị ẩn" đúng người, không đoán theo
    -- ô Còn sống (cụ 1850 mang `living` bật mà không bị che).
    'che_con_song', v_chi_xem,
    'bi_che', to_jsonb(v_che),
    'persons', (select coalesce(jsonb_agg(
                         case when v_khach then public.che_nguoi(to_jsonb(p.*), public.giao_truong(v_mo, v_rieng->p.id))
                              when p.id = any(v_che) then public.che_nguoi(to_jsonb(p.*), c_mo_song)
                              else to_jsonb(p.*) end order by p.id), '[]'::jsonb)
                  from public.persons p where p.id = any(v_nguoi)),
    'vanh_dai', (select coalesce(jsonb_agg(
                         case when v_khach then public.che_nguoi(to_jsonb(p.*), public.giao_truong(v_mo, v_rieng->p.id))
                              when p.id = any(v_che) then public.che_nguoi(to_jsonb(p.*), c_mo_song)
                              else to_jsonb(p.*) end order by p.id), '[]'::jsonb)
                  from public.persons p where p.id = any(v_bien)),
    'unions', (select coalesce(jsonb_agg(
                         case when u.partners && v_che then public.che_hon_nhan(to_jsonb(u.*))
                              else to_jsonb(u.*) end order by u.id), '[]'::jsonb)
                 from public.unions u where u.id = any(v_hn)),
    'children', (select coalesce(jsonb_agg(to_jsonb(c.*) order by c.union_id, c.ord), '[]'::jsonb)
                   from public.union_children c
                  where c.union_id = any(v_hn)),
    -- Ảnh: như `50`, cộng ảnh của người tắt nhóm Ảnh (và ảnh cưới có họ).
    'media', (select coalesce(jsonb_agg(to_jsonb(m.*) order by m.id), '[]'::jsonb)
                from public.media m
               where (m.subject_id = any(v_nguoi) or m.subject_id = any(v_hn))
                 and (not v_khach or 'anh' = any(v_mo))
                 and not (m.subject_id = any(v_che))
                 and not (m.subject_id = any(v_an_anh))
                 and not exists (select 1 from public.unions u
                                  where u.id = m.subject_id
                                    and (u.partners && v_che or u.partners && v_an_anh))),
    -- Đời theo cây (`40`) — khách không đọc thẳng `tree_persons` được nữa (mục 7).
    'doi', (select coalesce(jsonb_agg(jsonb_build_object('person_id', tp.person_id, 'doi', tp.doi)), '[]'::jsonb)
              from public.tree_persons tp
             where tp.tree_id = p_tree
               and (not v_khach or 'doi' = any(public.giao_truong(v_mo, v_rieng->tp.person_id)))));
end;
$$;

-- ------------------------------------------------------------
-- 6. doc_ho_so_nguoi() — thân `50`, nhóm giữ thêm song_mat, doi
-- ------------------------------------------------------------
create or replace function public.doc_ho_so_nguoi(p_ma text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_du   text[];
  v_che  text[];
  v_hn   text[];
  v_ma   text[];
  c_mo_song constant text[] := array['gioi_tinh', 'nam_sinh', 'ngay_mat', 'song_mat', 'doi'];
begin
  v_du  := array(select public.ds_nguoi_xem_duoc());
  v_che := array(select public.ds_nguoi_bi_che());

  if p_ma is null or not (p_ma = any(v_du) or p_ma = any(v_che)) then
    return jsonb_build_object('ok', false,
      'loi', 'Không đọc được người mang mã ' || coalesce(p_ma, '') || '. Có thể mã sai, '
             || 'hoặc người ấy nằm trong gia phả bạn không có quyền xem.');
  end if;

  v_hn := array(
    select u.id from public.unions u where p_ma = any(u.partners)
    union
    select uc.union_id from public.union_children uc where uc.person_id = p_ma);

  v_ma := array(
    select distinct x from (
      select unnest(partners) as x from public.unions where id = any(v_hn)
      union
      select person_id from public.union_children where union_id = any(v_hn)
      union
      select p_ma) t
    where x = any(v_du) or x = any(v_che));

  return jsonb_build_object('ok', true,
    'nguoi', (select case when p.id = any(v_che) then public.che_nguoi(to_jsonb(p.*), c_mo_song)
                          else to_jsonb(p.*) end
                from public.persons p where p.id = p_ma),
    'persons', (select coalesce(jsonb_agg(
                         case when p.id = any(v_che) then public.che_nguoi(to_jsonb(p.*), c_mo_song)
                              else to_jsonb(p.*) end order by p.id), '[]'::jsonb)
                  from public.persons p where p.id = any(v_ma)),
    'unions', (select coalesce(jsonb_agg(
                         case when u.partners && v_che then public.che_hon_nhan(to_jsonb(u.*))
                              else to_jsonb(u.*) end order by u.id), '[]'::jsonb)
                 from public.unions u where u.id = any(v_hn)),
    'children', (select coalesce(jsonb_agg(to_jsonb(c.*) order by c.union_id, c.ord), '[]'::jsonb)
                   from public.union_children c where c.union_id = any(v_hn)),
    'cay', (select coalesce(jsonb_agg(jsonb_build_object('tree_id', tp.tree_id, 'doi', tp.doi)), '[]'::jsonb)
              from public.tree_persons tp
             where tp.person_id = p_ma and tp.tree_id in (select public.ds_cay_xem_duoc())));
end;
$$;

-- ------------------------------------------------------------
-- 7. Luật đọc `tree_persons` — thân `26`, bớt cây mình chỉ là khách
-- ------------------------------------------------------------
create or replace function public.ds_cay_doc_tree_persons()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select c from public.ds_cay_xem_duoc() c where not public.la_khach_cay(c);
$$;

drop policy if exists doc_tree_persons on public.tree_persons;
create policy doc_tree_persons on public.tree_persons
  for select to authenticated
  using (tree_id in (select public.ds_cay_doc_tree_persons()));

-- ------------------------------------------------------------
-- 8. Hai cửa đặt nhóm — thân `47` / `51`, mười nhóm
-- ------------------------------------------------------------
create or replace function public.dat_truong_cong_khai(p_tree uuid, p_truong text[])
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cu  text[];
  v_moi text[];
  v_ten text;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'lyDo', 'Chỉ Quản trị hệ thống mới đặt được trường công khai.');
  end if;
  if public.bi_khoa() then
    return jsonb_build_object('ok', false, 'lyDo', 'Tài khoản đang bị khoá.');
  end if;

  v_moi := array(select distinct x from unnest(coalesce(p_truong, '{}'::text[])) x order by 1);
  if not v_moi <@ public.ds_nhom_cong_khai() then
    return jsonb_build_object('ok', false, 'lyDo', 'Có tên trường không hợp lệ.');
  end if;

  select t.truong_cong_khai, t.name || ' (' || t.tree_code || ')' into v_cu, v_ten
    from public.trees t where t.id = p_tree;
  if v_ten is null then
    return jsonb_build_object('ok', false, 'lyDo', 'Không thấy gia phả này.');
  end if;

  update public.trees set truong_cong_khai = v_moi where id = p_tree;
  perform public.ghi_nhat_ky('tree', 'doi_truong_cong_khai', v_ten,
    jsonb_build_object('cu', to_jsonb(v_cu), 'moi', to_jsonb(v_moi)));
  return jsonb_build_object('ok', true, 'truong', to_jsonb(v_moi));
end;
$$;

create or replace function public.dat_cong_khai_tai_khoan(p_tree uuid, p_user uuid, p_truong text[])
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := coalesce(p_user, auth.uid());
  v_cu   text[];
  v_moi  text[];
  v_ten  text;
begin
  if v_user is null or not (v_user = auth.uid() or public.la_quan_tri_he_thong()) then
    return jsonb_build_object('ok', false, 'lyDo', 'Chỉ chính chủ tài khoản hoặc Quản trị hệ thống mới đổi được.');
  end if;
  if public.bi_khoa() then
    return jsonb_build_object('ok', false, 'lyDo', 'Tài khoản đang bị khoá.');
  end if;

  v_moi := array(select distinct x from unnest(coalesce(p_truong, '{}'::text[])) x order by 1);
  if not v_moi <@ public.ds_nhom_cong_khai() then
    return jsonb_build_object('ok', false, 'lyDo', 'Có tên trường không hợp lệ.');
  end if;

  select m.truong_cong_khai, t.name || ' (' || t.tree_code || ')' into v_cu, v_ten
    from public.tree_members m join public.trees t on t.id = m.tree_id
   where m.tree_id = p_tree and m.user_id = v_user;
  if v_ten is null then
    return jsonb_build_object('ok', false, 'lyDo', 'Tài khoản này không ở trong gia phả này.');
  end if;

  update public.tree_members set truong_cong_khai = v_moi
   where tree_id = p_tree and user_id = v_user;
  perform public.ghi_nhat_ky('tree', 'doi_cong_khai_ca_nhan',
    v_ten || ' · ' || public.email_tai_khoan(v_user),
    jsonb_build_object('cu', to_jsonb(v_cu), 'moi', to_jsonb(v_moi)));
  return jsonb_build_object('ok', true, 'truong', to_jsonb(v_moi));
end;
$$;

-- ------------------------------------------------------------
-- 9. VÁ TẠI CHỖ ba hàm dài — thêm `contact` vào danh sách cột
-- ------------------------------------------------------------
-- Chép lại cả ba (400–500 dòng mỗi hàm) để thêm một tên cột là đẻ bản thứ hai
-- của những hàm hay sửa nhất. Thay vào đó: đọc bản ĐANG CHẠY, thay đúng MỘT
-- chỗ neo, dựng lại (`create or replace` giữ nguyên `grant`). Neo khớp ≠ 1 lần
-- thì DỪNG, cả file lùi — bản đứng cuối đã đổi, phải sửa file này.
-- Đã vá (có chữ `contact`) thì bỏ qua — dán lại nhiều lần được.
do $$
declare
  r      record;
  v_def  text;
  v_so   integer;
begin
  for r in select * from (values
    ('public.luu_cay(uuid, integer, jsonb, jsonb)'::regprocedure,
     'photo_file_id = excluded.photo_file_id,',
     'photo_file_id = excluded.photo_file_id, contact = coalesce(excluded.contact, persons.contact),'),
    ('public.tu_choi_thay_doi(uuid, bigint, text)'::regprocedure,
     'photo_file_id = excluded.photo_file_id,',
     'photo_file_id = excluded.photo_file_id, contact = coalesce(excluded.contact, persons.contact),'),
    ('public.gop_hai_nguoi(text, text, uuid)'::regprocedure,
     'note          = coalesce(nullif(note, ''''), v_t.note),',
     'note          = coalesce(nullif(note, ''''), v_t.note),' || chr(10) ||
     '    contact       = coalesce(nullif(contact, ''''), v_t.contact),')
  ) as v(ham, neo, thay)
  loop
    v_def := pg_get_functiondef(r.ham);
    continue when v_def like '%contact%';
    v_so := (length(v_def) - length(replace(v_def, r.neo, ''))) / length(r.neo);
    if v_so <> 1 then
      raise exception 'DỪNG: chỗ neo của % khớp % lần (phải đúng 1) — bản đứng cuối đã đổi, sửa luoc-do/52.',
        r.ham, v_so;
    end if;
    execute replace(v_def, r.neo, r.thay);
  end loop;
end $$;

-- ------------------------------------------------------------
-- 10. Quyền gọi
-- ------------------------------------------------------------
revoke all on function public.ds_nhom_cong_khai()                            from public, anon;
revoke all on function public.che_nguoi(jsonb, text[])                       from public, anon;
revoke all on function public.truong_rieng_nguoi(text, uuid)                 from public, anon, authenticated;
revoke all on function public.doc_cay(uuid)                                  from public, anon;
revoke all on function public.doc_ho_so_nguoi(text)                          from public, anon;
revoke all on function public.ds_cay_doc_tree_persons()                      from public, anon;
revoke all on function public.dat_truong_cong_khai(uuid, text[])             from public, anon;
revoke all on function public.dat_cong_khai_tai_khoan(uuid, uuid, text[])    from public, anon;
grant execute on function public.ds_nhom_cong_khai()                          to authenticated;
grant execute on function public.che_nguoi(jsonb, text[])                     to authenticated;
grant execute on function public.doc_cay(uuid)                                to authenticated;
grant execute on function public.doc_ho_so_nguoi(text)                        to authenticated;
grant execute on function public.ds_cay_doc_tree_persons()                    to authenticated;
grant execute on function public.dat_truong_cong_khai(uuid, text[])           to authenticated;
grant execute on function public.dat_cong_khai_tai_khoan(uuid, uuid, text[])  to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — bảng cuối phải ra ĐẠT ở cả sáu dòng
-- ============================================================
select 1 as stt, 'cột persons.contact có' as ten_kiem,
  case when exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'persons'
                       and column_name = 'contact')
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'ba hàm dài đã vá: luu_cay · tu_choi_thay_doi · gop_hai_nguoi có contact',
  case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public'
                and p.proname in ('luu_cay', 'tu_choi_thay_doi', 'gop_hai_nguoi')
                and p.prosrc like '%contact%') = 3
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'ràng buộc hai bảng đã biết mười nhóm (dữ liệu đã chuyển)',
  case when (select count(*) from pg_constraint
              where conname in ('trees_truong_cong_khai_hop_le', 'tree_members_truong_cong_khai_hop_le')
                and pg_get_constraintdef(oid) like '%lien_he%') = 2
       then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'doc_cay() bản 52 (trả doi) · luật đọc tree_persons bớt khách',
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'doc_cay') like '%''doi'', (select%'
        and (select qual from pg_policies where schemaname = 'public'
              and tablename = 'tree_persons' and policyname = 'doc_tree_persons') like '%ds_cay_doc_tree_persons%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 5, 'che_nguoi tắt hết → sống/mất null, Đời, quê quán, liên hệ trống',
  case when public.che_nguoi(
         '{"living":false,"residence":"Nam Định","contact":"0909","vn":{"generation":9,"gio":"1/1"},
           "death":{"iso":null,"raw":"2020","place":""}}'::jsonb, '{}'::text[])
       @> '{"living":null,"residence":"","contact":"","vn":{},"death":{"raw":""}}'::jsonb
        and not (public.che_nguoi('{"vn":{"generation":9}}'::jsonb, '{}'::text[])->'vn' ? 'generation')
       then 'ĐẠT' else 'HỎNG' end
union all
select 6, 'anon không gọi được doc_cay · ds_cay_doc_tree_persons; authenticated không gọi truong_rieng_nguoi',
  case when not has_function_privilege('anon', 'public.doc_cay(uuid)', 'execute')
        and not has_function_privilege('anon', 'public.ds_cay_doc_tree_persons()', 'execute')
        and not has_function_privilege('authenticated', 'public.truong_rieng_nguoi(text, uuid)', 'execute')
       then 'ĐẠT' else 'HỎNG' end
order by stt;
