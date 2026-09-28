-- ============================================================
-- giapha-supabase · luoc-do/50-an-nguoi-con-song.sql
-- Vai trò  : Giấu chi tiết NGƯỜI CÒN SỐNG với thành viên chỉ có vai `xem`
--            (b148a) — `doc_cay()` che, đọc thẳng bảng thì không thấy dòng.
-- Cần có   : `47` (`che_nguoi` · `la_khach_cay`). ⚠ Bản ĐỨNG CUỐI của
--            `doc_cay()` và `ds_nguoi_xem_duoc()` — dán lại `26`/`27`/`30`/`47`
--            sau file này thì PHẢI dán lại file này, không là lộ lại, IM LẶNG.
--            Cũng là bản đứng cuối của `ds_hon_nhan_xem_duoc()` (từ `26`).
-- Thiết kế : chốt 28/09/2026 — ai: vai `xem` của cây ấy (không phải chủ cây,
--            không phải QTHT) · che: ngày sinh đủ (giữ năm), ảnh, tiểu sử ·
--            còn sống: ô Còn sống bật + không dấu vết đã mất + sinh < 100 năm.
-- Sổ tay   : so-tay/phan-quyen.md · Đo: ../kiem-thu/ban-thu-sql/do-b148a.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 28/09/2026 (b148a)
-- ============================================================
--
-- ⚠ Như `47`: che ở `doc_cay()` mà để bảng đọc thẳng được thì chỉ là tấm rèm.
--   Nên đi CÙNG NHAU ba việc:
--   ① `doc_cay()` che người còn sống khi người gọi chỉ xem cây ấy;
--   ② `ds_nguoi_xem_duoc()` bỏ những người ấy → luật đọc `persons` · `media`
--     tự khép theo; `ds_hon_nhan_xem_duoc()` bỏ hôn nhân có họ làm vợ/chồng
--     (ngày cưới, ghi chú) → `unions` · `union_children` khép theo;
--   ③ luật đọc `change_log` bỏ cây mình chỉ xem — `diff`/`truoc` chứa nguyên
--     bản ghi người trước/sau mỗi lần sửa. Không màn hình nào đọc thẳng bảng
--     này (kiểm duyệt đi qua hàm `security definer`, chỉ quản trị gọi được).
-- Người ấy có mặt ở cây KHÁC mà mình sửa được, hoặc là chính mình
--   (`tai_khoan.person_id`) → thấy đủ, ở mọi cây.
-- Hôn nhân có một vợ/chồng bị che: xoá trắng ngày/nơi cưới + ghi chú, giữ
--   tình trạng (chốt 28/09/2026). Chưa che: `sources`.
-- Tìm người (`tim_nguoi_*`, báo trùng) chỉ trả tên + năm sinh → không đụng.
-- Trang Hồ sơ người đọc qua `doc_ho_so_nguoi()` (mục 7) để thấy bản che thay
--   vì bị RLS bỏ dòng.

begin;

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'che_nguoi') then
    raise exception 'DỪNG: chưa dán 47-cong-khai-theo-truong.sql (thiếu che_nguoi).';
  end if;
end $$;

-- ------------------------------------------------------------
-- 1. coi_con_song() — hàm thuần trên các cột của một người
-- ------------------------------------------------------------
-- `living` mặc định là `true`, nên một cụ sinh 1850 chưa ai ghi ngày mất vẫn
-- mang `true`. Ba vế cùng phải đúng mới coi là còn sống:
--   · ô Còn sống bật;
--   · không một dấu vết đã mất: ngày/nơi mất, nơi an táng, ngày giỗ;
--   · năm sinh chưa quá 100 năm — hoặc không có năm sinh (không biết thì che).
-- Không `security definer`: hàm SQL thường thì Postgres gộp được vào câu gọi.
create or replace function public.coi_con_song(
  p_living boolean, p_birth jsonb, p_death jsonb, p_burial text, p_vn jsonb)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(p_living, true)
     and coalesce(p_death->>'iso', '') = ''
     and coalesce(p_death->>'raw', '') = ''
     and coalesce(p_death->>'place', '') = ''
     and coalesce(p_burial, '') = ''
     and coalesce(p_vn->>'gio', '') = ''
     and coalesce(
           coalesce(substring(coalesce(p_birth->>'iso', '') from '^(\d{4})'),
                    substring(coalesce(p_birth->>'raw', '') from '(\d{4})'))::int
             > extract(year from current_date)::int - 100,
           true);
$$;

-- ------------------------------------------------------------
-- 2. la_chi_xem_cay() — thành viên mang vai `xem` của cây này
-- ------------------------------------------------------------
-- ⚠ `vai_tro()` trả 'quan_tri_he_thong' ở nhánh ĐẦU cho QTHT → QTHT không bao
--   giờ rơi vào đây. Chủ cây loại riêng: chủ mà vai ghi `xem` vẫn là chủ.
create or replace function public.la_chi_xem_cay(p_tree uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    public.la_thanh_vien(p_tree)
    and public.vai_tro(p_tree) = 'xem'
    and not public.la_chu_cay(p_tree, auth.uid()),
    false);
$$;

-- ------------------------------------------------------------
-- 3. ds_nguoi_xem_day_du() — người mình thấy ĐỦ chi tiết
-- ------------------------------------------------------------
-- = người của cây mình là thành viên mà KHÔNG chỉ xem · cộng chính mình.
create or replace function public.ds_nguoi_xem_day_du()
returns setof text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select tp.person_id from public.tree_persons tp
   where tp.tree_id in (select c from public.ds_cay_xem_duoc() c
                         where public.la_thanh_vien(c) and not public.la_chi_xem_cay(c))
  union
  select k.person_id from public.tai_khoan k
   where k.user_id = auth.uid() and k.person_id is not null;
$$;

-- ------------------------------------------------------------
-- 3b. che_hon_nhan() — hàm thuần: xoá trắng ngày/nơi cưới + ghi chú
-- ------------------------------------------------------------
-- Giữ `status` (đã cưới/ly hôn/goá): sơ đồ vẽ đường nối theo nó.
create or replace function public.che_hon_nhan(u jsonb)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select u || jsonb_build_object('marriage', '{"iso":null,"raw":"","place":""}'::jsonb,
                                 'note', '');
$$;

-- ------------------------------------------------------------
-- 4. doc_cay() — thân `47` + che người còn sống với người chỉ xem
-- ------------------------------------------------------------
-- ⚠ Chỉ che khi người gọi CHỈ XEM cây này — họ không Lưu được. Che cho người
--   sửa được là mời họ Lưu bản trắng đè lên ngày cưới thật.
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
  -- Ba nhóm GIỮ: giới tính · năm sinh · (ngày mất — người còn sống vốn trống).
  -- Che: ngày sinh đủ + nơi sinh, ảnh, tiểu sử, email người sửa.
  c_mo_song constant text[] := array['gioi_tinh', 'nam_sinh', 'ngay_mat'];
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

  return jsonb_build_object('ok', true,
    -- Cờ + danh sách mã đã che: app nói "bị ẩn" đúng người, không đoán theo
    -- ô Còn sống (cụ 1850 mang `living` bật mà không bị che).
    'che_con_song', v_chi_xem,
    'bi_che', to_jsonb(v_che),
    'persons', (select coalesce(jsonb_agg(
                         case when v_khach then public.che_nguoi(to_jsonb(p.*), v_mo)
                              when p.id = any(v_che) then public.che_nguoi(to_jsonb(p.*), c_mo_song)
                              else to_jsonb(p.*) end order by p.id), '[]'::jsonb)
                  from public.persons p where p.id = any(v_nguoi)),
    'vanh_dai', (select coalesce(jsonb_agg(
                         case when v_khach then public.che_nguoi(to_jsonb(p.*), v_mo)
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
    -- Ảnh: bỏ ảnh của người bị che, và ảnh hôn nhân có người bị che đứng trong.
    'media', (select coalesce(jsonb_agg(to_jsonb(m.*) order by m.id), '[]'::jsonb)
                from public.media m
               where (m.subject_id = any(v_nguoi) or m.subject_id = any(v_hn))
                 and (not v_khach or 'anh' = any(v_mo))
                 and not (m.subject_id = any(v_che))
                 and not exists (select 1 from public.unions u
                                  where u.id = m.subject_id and u.partners && v_che)));
end;
$$;

-- ------------------------------------------------------------
-- 5. ds_nguoi_xem_duoc() — thân `47`, cây chỉ xem thì bỏ người còn sống
-- ------------------------------------------------------------
create or replace function public.ds_nguoi_xem_duoc()
returns setof text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select tp.person_id from public.tree_persons tp
   where tp.tree_id in (select c from public.ds_cay_xem_duoc() c
                         where public.la_thanh_vien(c) and not public.la_chi_xem_cay(c))
  union
  select tp.person_id from public.tree_persons tp
    join public.persons p on p.id = tp.person_id
   where tp.tree_id in (select c from public.ds_cay_xem_duoc() c
                         where public.la_chi_xem_cay(c))
     and not public.coi_con_song(p.living, p.birth, p.death, p.burial_place, p.vn)
  union
  select k.person_id from public.tai_khoan k
   where k.user_id = auth.uid() and k.person_id is not null
     and exists (select 1 from public.tree_persons tp
                  where tp.person_id = k.person_id
                    and tp.tree_id in (select public.ds_cay_xem_duoc()));
$$;

-- ------------------------------------------------------------
-- 6. Luật đọc `change_log` — bản `02`, bớt cây mình chỉ xem
-- ------------------------------------------------------------
-- Danh sách cây chỉ-xem tính MỘT lần mỗi câu (`so-tay/phan-quyen.md`: luật gọi
-- hàm cho từng dòng là chậm) — vế `la_thanh_vien` giữ đúng như `02`.
create or replace function public.ds_cay_chi_xem()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select t.id from public.trees t where public.la_chi_xem_cay(t.id);
$$;

drop policy if exists doc_change_log on public.change_log;
create policy doc_change_log on public.change_log
  for select to authenticated
  using (public.la_thanh_vien(tree_id)
         and tree_id not in (select public.ds_cay_chi_xem()));

-- ------------------------------------------------------------
-- 6b. ds_nguoi_bi_che() · ds_hon_nhan_xem_duoc() — khép bảng hôn nhân
-- ------------------------------------------------------------
-- Người bị che = còn sống, nằm ở cây mình chỉ xem, không có đường thấy đủ.
create or replace function public.ds_nguoi_bi_che()
returns setof text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select distinct tp.person_id from public.tree_persons tp
    join public.persons p on p.id = tp.person_id
   where tp.tree_id in (select public.ds_cay_chi_xem())
     and tp.tree_id in (select public.ds_cay_xem_duoc())
     and public.coi_con_song(p.living, p.birth, p.death, p.burial_place, p.vn)
     and tp.person_id not in (select public.ds_nguoi_xem_day_du());
$$;

-- Thân `26` mục 5, thêm một vế: hôn nhân có vợ/chồng bị che thì KHÔNG đọc
-- thẳng được (ngày cưới, ghi chú nằm ngay trên dòng). `union_children` và ảnh
-- hôn nhân bám hàm này nên khép theo. App đọc qua `doc_cay`/`doc_ho_so_nguoi`.
-- Không ai bị che (mọi người trừ vai `xem`) thì `che` rỗng — y hệt `26`.
create or replace function public.ds_hon_nhan_xem_duoc()
returns setof text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with nguoi as (select public.ds_nguoi_xem_duoc() as id),
       che   as (select public.ds_nguoi_bi_che() as id),
       hn as (
         select u.id from public.unions u
          where exists (select 1 from unnest(u.partners) x(ma) where x.ma in (select id from nguoi))
         union
         select uc.union_id from public.union_children uc
          where uc.person_id in (select id from nguoi))
  select hn.id from hn join public.unions u on u.id = hn.id
   where not exists (select 1 from unnest(u.partners) x(ma) where x.ma in (select id from che));
$$;

-- ------------------------------------------------------------
-- 7. doc_ho_so_nguoi() — trang Hồ sơ người, bản ĐÃ CHE
-- ------------------------------------------------------------
-- Trang `#…/nguoi/<mã>` (b133) đọc thẳng bảng. Sau mục 5, người chỉ xem bấm
-- vào một người còn sống ở bảng *Danh sách người* (bảng ấy đi qua `doc_cay`,
-- đã che) thì trang hồ sơ báo "không có quyền xem" — sai, họ được xem, chỉ
-- là xem bản che. Hàm này trả đúng năm thứ trang cần, cùng hình dòng thô như
-- đọc thẳng bảng: `nguoi` · `persons` · `unions` · `children` · `cay`.
--   Thấy đủ  = `ds_nguoi_xem_duoc()` (đúng luật đọc thẳng bảng).
--   Thấy che = người còn sống ở cây mình chỉ xem, không có đường thấy đủ.
--   Còn lại  = không có mặt (như RLS bỏ dòng). Khách cây mặc định: như cũ,
--   không mở rộng.
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
  c_mo_song constant text[] := array['gioi_tinh', 'nam_sinh', 'ngay_mat'];
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
    -- Trang hồ sơ chỉ ĐỌC (không nút Lưu) nên che theo `ds_nguoi_bi_che()`
    -- được, không cần hỏi người gọi có sửa được cây nào.
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
-- 8. Quyền gọi
-- ------------------------------------------------------------
revoke all on function public.doc_ho_so_nguoi(text)      from public, anon;
grant execute on function public.doc_ho_so_nguoi(text)    to authenticated;
revoke all on function public.coi_con_song(boolean, jsonb, jsonb, text, jsonb) from public, anon;
revoke all on function public.la_chi_xem_cay(uuid)       from public, anon;
revoke all on function public.ds_nguoi_xem_day_du()      from public, anon;
revoke all on function public.doc_cay(uuid)              from public, anon;
revoke all on function public.ds_nguoi_xem_duoc()        from public, anon;
revoke all on function public.ds_cay_chi_xem()           from public, anon;
revoke all on function public.che_hon_nhan(jsonb)        from public, anon;
revoke all on function public.ds_nguoi_bi_che()          from public, anon;
revoke all on function public.ds_hon_nhan_xem_duoc()     from public, anon;
grant execute on function public.che_hon_nhan(jsonb)      to authenticated;
grant execute on function public.ds_nguoi_bi_che()        to authenticated;
grant execute on function public.ds_hon_nhan_xem_duoc()   to authenticated;
grant execute on function public.coi_con_song(boolean, jsonb, jsonb, text, jsonb) to authenticated;
grant execute on function public.la_chi_xem_cay(uuid)     to authenticated;
grant execute on function public.ds_nguoi_xem_day_du()    to authenticated;
grant execute on function public.doc_cay(uuid)            to authenticated;
grant execute on function public.ds_nguoi_xem_duoc()      to authenticated;
grant execute on function public.ds_cay_chi_xem()         to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — bảng cuối phải ra ĐẠT ở cả sáu dòng
-- ============================================================
select 1 as stt, 'doc_cay() bản 50 (có coi_con_song) đang chạy' as ten_kiem,
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'doc_cay') like '%coi_con_song%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'doc_cay') like '%che_nguoi%'
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'ds_nguoi_xem_duoc() · ds_hon_nhan_xem_duoc() bản 50 đang chạy',
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'ds_nguoi_xem_duoc') like '%coi_con_song%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'ds_hon_nhan_xem_duoc') like '%ds_nguoi_bi_che%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'luật đọc change_log bớt cây chỉ xem',
  case when (select qual from pg_policies where schemaname = 'public'
              and tablename = 'change_log' and policyname = 'doc_change_log') like '%ds_cay_chi_xem%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'anon không gọi được doc_cay · la_chi_xem_cay · ds_nguoi_xem_day_du · doc_ho_so_nguoi',
  case when not has_function_privilege('anon', 'public.doc_cay(uuid)', 'execute')
        and not has_function_privilege('anon', 'public.la_chi_xem_cay(uuid)', 'execute')
        and not has_function_privilege('anon', 'public.ds_nguoi_xem_day_du()', 'execute')
        and not has_function_privilege('anon', 'public.doc_ho_so_nguoi(text)', 'execute')
        and has_function_privilege('authenticated', 'public.doc_ho_so_nguoi(text)', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 5, 'coi_con_song: sinh 1990 không ngày mất → sống; có ngày mất → không',
  case when public.coi_con_song(true, '{"iso":"1990-01-01","raw":"","place":""}', '{}', '', '{}')
        and not public.coi_con_song(true, '{"iso":"1990-01-01"}', '{"raw":"2020"}', '', '{}')
        and not public.coi_con_song(false, '{}', '{}', '', '{}')
       then 'ĐẠT' else 'HỎNG' end
union all
select 6, 'coi_con_song: sinh 1850 → không; không năm sinh → sống; có giỗ → không',
  case when not public.coi_con_song(true, '{"raw":"1850"}', '{}', '', '{}')
        and public.coi_con_song(true, '{"iso":null,"raw":"","place":""}', '{}', '', '{}')
        and not public.coi_con_song(true, '{}', '{}', '', '{"gio":"3/7"}')
       then 'ĐẠT' else 'HỎNG' end
order by stt;
