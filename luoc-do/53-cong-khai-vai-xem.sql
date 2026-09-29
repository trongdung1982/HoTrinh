-- ============================================================
-- giapha-supabase · luoc-do/53-cong-khai-vai-xem.sql
-- Vai trò  : Cài đặt *Thông tin công khai của tôi* (`51`/`52`) nay áp cả cho
--            thành viên vai `xem` — trước chỉ áp cho KHÁCH cây mặc định (b152).
-- Cần có   : `52`. ⚠ Bản ĐỨNG CUỐI của `doc_cay()` · `ds_nguoi_xem_duoc()` ·
--            `ds_nguoi_bi_che()` · `doc_ho_so_nguoi()` — dán lại `47`/`50`/
--            `51`/`52` thì PHẢI dán lại file này, không thì người chỉ xem thấy
--            lại trường chính chủ đã tắt, IM LẶNG.
-- Thiết kế : chủ dự án bảo 29/09/2026 ("áp thiết lập công khai của từng người
--            cho cả thành viên vai xem"). Ba điều Claude Code chốt thay, ghi ở
--            KE-HOACH.md để chủ dự án xem lại:
--            · vai `xem` thấy = nhóm NGƯỜI ấy bật — KHÔNG giao với nhóm của
--              CÂY (`47`): nhóm cây là cho khách, thành viên vẫn thấy hơn khách;
--            · người còn sống (`50`) thì giao hai luật — chặt hơn thắng;
--            · có đường thấy đủ (vai khác `xem` ở cây khác chứa người ấy, hoặc
--              là chính mình — `ds_nguoi_xem_day_du()`) thì không che, như `50`.
-- Sổ tay   : so-tay/phan-quyen.md · Đo: ../kiem-thu/ban-thu-sql/do-b152.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 29/09/2026 (b152)
-- ============================================================
--
-- ⚠ Như `50`: che ở `doc_cay()` mà để bảng đọc thẳng được là tấm rèm. Nên:
--   ① `doc_cay()` che theo cài đặt riêng khi người gọi chỉ xem cây ấy;
--   ② `ds_nguoi_xem_duoc()` bỏ những người ấy ở cây chỉ xem → `persons` ·
--     `media` khép theo; `ds_nguoi_bi_che()` thêm họ → `ds_hon_nhan_xem_duoc()`
--     (bản `50`, KHÔNG định nghĩa lại) khép `unions` · `union_children` theo;
--   ③ `doc_ho_so_nguoi()` (trang Hồ sơ người) trả bản che, theo cài đặt CHẶT
--     NHẤT của người ấy — trang ấy không gắn với một cây.
--   `change_log` đã khép cho cây chỉ xem từ `50`.
-- Khe cột `tree_persons.doi` (người chỉ xem đọc thẳng qua REST): khép ở `56`.
-- ⚠ Cờ `bi_che` của `doc_cay()` vẫn chỉ kể người còn sống: app dùng nó để nói
--   "còn sống nên đã lược bớt" — người che theo cài đặt riêng không đúng câu ấy.

begin;

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'ds_nhom_cong_khai') then
    raise exception 'DỪNG: chưa dán 52-lien-he-muoi-nhom.sql (thiếu ds_nhom_cong_khai).';
  end if;
end $$;

-- ------------------------------------------------------------
-- 1. an_bot_rieng() — người này có TẮT nhóm nào ở cây này không
-- ------------------------------------------------------------
-- Chưa đặt (null) = theo cây = không tắt gì với vai `xem`. Khoá kín như
-- `truong_rieng_nguoi()`: chỉ các hàm `security definer` dưới đây gọi.
create or replace function public.an_bot_rieng(p_person text, p_tree uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(not (public.ds_nhom_cong_khai() <@ public.truong_rieng_nguoi(p_person, p_tree)), false);
$$;

-- ------------------------------------------------------------
-- 2. doc_cay() — thân `52` + vai `xem` thấy theo cài đặt từng người
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
  v_du      text[] := '{}';
  -- Người còn sống với người chỉ xem (`50`): GIỮ giới tính · năm sinh · sống/mất
  -- · Đời · (ngày mất — người còn sống vốn trống). Che mọi thứ còn lại.
  c_mo_song constant text[] := array['gioi_tinh', 'nam_sinh', 'ngay_mat', 'song_mat', 'doi'];
  c_tat_ca  constant text[] := public.ds_nhom_cong_khai();
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
    v_du := array(select public.ds_nguoi_xem_day_du());
    v_che := array(
      select p.id from public.persons p
       where (p.id = any(v_nguoi) or p.id = any(v_bien))
         and public.coi_con_song(p.living, p.birth, p.death, p.burial_place, p.vn)
         and p.id <> all(v_du));
  end if;

  -- Cài đặt riêng: khách (như `51`) · người chỉ xem, trừ người mình thấy đủ.
  if v_khach or v_chi_xem then
    v_rieng := coalesce((
      select jsonb_object_agg(x.id, x.t) from (
        select k.person_id as id, to_jsonb(public.truong_rieng_nguoi(k.person_id, p_tree)) as t
          from (select distinct person_id from public.tai_khoan
                 where person_id = any(v_nguoi) or person_id = any(v_bien)) k
         where k.person_id <> all(v_du)) x
       where x.t is not null), '{}'::jsonb);
    v_an_anh := array(select e.key from jsonb_each(v_rieng) e where not (e.value ? 'anh'));
  end if;

  return jsonb_build_object('ok', true,
    -- Cờ + danh sách mã đã che vì CÒN SỐNG: app nói "bị ẩn" đúng người, không
    -- đoán theo ô Còn sống (cụ 1850 mang `living` bật mà không bị che).
    'che_con_song', v_chi_xem,
    'bi_che', to_jsonb(v_che),
    'persons', (select coalesce(jsonb_agg(
                         case when v_khach then public.che_nguoi(to_jsonb(p.*), public.giao_truong(v_mo, v_rieng->p.id))
                              when p.id = any(v_che) then public.che_nguoi(to_jsonb(p.*), public.giao_truong(c_mo_song, v_rieng->p.id))
                              when v_rieng ? p.id then public.che_nguoi(to_jsonb(p.*), public.giao_truong(c_tat_ca, v_rieng->p.id))
                              else to_jsonb(p.*) end order by p.id), '[]'::jsonb)
                  from public.persons p where p.id = any(v_nguoi)),
    'vanh_dai', (select coalesce(jsonb_agg(
                         case when v_khach then public.che_nguoi(to_jsonb(p.*), public.giao_truong(v_mo, v_rieng->p.id))
                              when p.id = any(v_che) then public.che_nguoi(to_jsonb(p.*), public.giao_truong(c_mo_song, v_rieng->p.id))
                              when v_rieng ? p.id then public.che_nguoi(to_jsonb(p.*), public.giao_truong(c_tat_ca, v_rieng->p.id))
                              else to_jsonb(p.*) end order by p.id), '[]'::jsonb)
                  from public.persons p where p.id = any(v_bien)),
    'unions', (select coalesce(jsonb_agg(
                         case when u.partners && v_che then public.che_hon_nhan(to_jsonb(u.*))
                              else to_jsonb(u.*) end order by u.id), '[]'::jsonb)
                 from public.unions u where u.id = any(v_hn)),
    'children', (select coalesce(jsonb_agg(to_jsonb(c.*) order by c.union_id, c.ord), '[]'::jsonb)
                   from public.union_children c
                  where c.union_id = any(v_hn)),
    -- Ảnh: như `52` — `v_an_anh` nay có cả người tắt nhóm Ảnh với vai `xem`.
    'media', (select coalesce(jsonb_agg(to_jsonb(m.*) order by m.id), '[]'::jsonb)
                from public.media m
               where (m.subject_id = any(v_nguoi) or m.subject_id = any(v_hn))
                 and (not v_khach or 'anh' = any(v_mo))
                 and not (m.subject_id = any(v_che))
                 and not (m.subject_id = any(v_an_anh))
                 and not exists (select 1 from public.unions u
                                  where u.id = m.subject_id
                                    and (u.partners && v_che or u.partners && v_an_anh))),
    -- Đời theo cây (`40`). Khách: nhóm cây ∩ nhóm người. Vai `xem`: nhóm người.
    'doi', (select coalesce(jsonb_agg(jsonb_build_object('person_id', tp.person_id, 'doi', tp.doi)), '[]'::jsonb)
              from public.tree_persons tp
             where tp.tree_id = p_tree
               and case when v_khach then 'doi' = any(public.giao_truong(v_mo, v_rieng->tp.person_id))
                        when v_rieng ? tp.person_id then 'doi' = any(public.giao_truong(c_tat_ca, v_rieng->tp.person_id))
                        else true end));
end;
$$;

-- ------------------------------------------------------------
-- 3. ds_nguoi_xem_duoc() — thân `50`, cây chỉ xem bỏ thêm người đã tắt nhóm
-- ------------------------------------------------------------
-- Chỉ người CÓ tài khoản mới có cài đặt riêng — `exists` trên `tai_khoan`
-- trước, để `an_bot_rieng()` chỉ chạy cho vài người chứ không cho cả cây.
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
     and not exists (select 1 from public.tai_khoan k
                      where k.person_id = tp.person_id
                        and public.an_bot_rieng(tp.person_id, tp.tree_id))
  union
  select k.person_id from public.tai_khoan k
   where k.user_id = auth.uid() and k.person_id is not null
     and exists (select 1 from public.tree_persons tp
                  where tp.person_id = k.person_id
                    and tp.tree_id in (select public.ds_cay_xem_duoc()));
$$;

-- ------------------------------------------------------------
-- 4. ds_nguoi_bi_che() — thân `50` + người đã tắt nhóm ở cây mình chỉ xem
-- ------------------------------------------------------------
-- Hàm này là gốc của `ds_hon_nhan_xem_duoc()` (hôn nhân có họ thôi đọc
-- thẳng) và của `doc_ho_so_nguoi()` (ai được xem bản che).
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
     and (public.coi_con_song(p.living, p.birth, p.death, p.burial_place, p.vn)
          or exists (select 1 from public.tai_khoan k
                      where k.person_id = tp.person_id
                        and public.an_bot_rieng(tp.person_id, tp.tree_id)))
     and tp.person_id not in (select public.ds_nguoi_xem_day_du());
$$;

-- ------------------------------------------------------------
-- 5. doc_ho_so_nguoi() — thân `52`, che theo cài đặt CHẶT NHẤT của người ấy
-- ------------------------------------------------------------
-- Trang Hồ sơ người không gắn với một cây → `truong_rieng_nguoi(mã, null)`
-- = phần GIAO mọi cài đặt người ấy đã đặt ở mọi cây (hàm `52` mục 4: không
-- dòng nào khớp cây `null` thì lấy tất). Chặt hơn một cây cụ thể — cố ý.
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
    'nguoi', (select case when p.id = any(v_che) then public.che_nguoi(to_jsonb(p.*), public.giao_truong(
                            case when public.coi_con_song(p.living, p.birth, p.death, p.burial_place, p.vn)
                                 then c_mo_song else public.ds_nhom_cong_khai() end,
                            to_jsonb(public.truong_rieng_nguoi(p.id, null))))
                          else to_jsonb(p.*) end
                from public.persons p where p.id = p_ma),
    'persons', (select coalesce(jsonb_agg(
                         case when p.id = any(v_che) then public.che_nguoi(to_jsonb(p.*), public.giao_truong(
                                case when public.coi_con_song(p.living, p.birth, p.death, p.burial_place, p.vn)
                                     then c_mo_song else public.ds_nhom_cong_khai() end,
                                to_jsonb(public.truong_rieng_nguoi(p.id, null))))
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
             where tp.person_id = p_ma and tp.tree_id in (select public.ds_cay_xem_duoc())
               and not (p_ma = any(v_che)
                        and not 'doi' = any(coalesce(public.truong_rieng_nguoi(p_ma, null),
                                                     public.ds_nhom_cong_khai())))));
end;
$$;

-- ------------------------------------------------------------
-- 6. Quyền gọi — `create or replace` giữ `grant` cũ; viết lại cho chắc
-- ------------------------------------------------------------
revoke all on function public.an_bot_rieng(text, uuid)   from public, anon, authenticated;
revoke all on function public.doc_cay(uuid)              from public, anon;
revoke all on function public.ds_nguoi_xem_duoc()        from public, anon;
revoke all on function public.ds_nguoi_bi_che()          from public, anon;
revoke all on function public.doc_ho_so_nguoi(text)      from public, anon;
grant execute on function public.doc_cay(uuid)            to authenticated;
grant execute on function public.ds_nguoi_xem_duoc()      to authenticated;
grant execute on function public.ds_nguoi_bi_che()        to authenticated;
grant execute on function public.doc_ho_so_nguoi(text)    to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — bảng cuối phải ra ĐẠT ở cả bốn dòng
-- ============================================================
select 1 as stt, 'an_bot_rieng có, authenticated/anon KHÔNG gọi được' as ten_kiem,
  case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'an_bot_rieng')
        and not has_function_privilege('authenticated', 'public.an_bot_rieng(text, uuid)', 'execute')
        and not has_function_privilege('anon', 'public.an_bot_rieng(text, uuid)', 'execute')
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'doc_cay() bản 53 (vai xem đọc cài đặt riêng)',
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'doc_cay') like '%if v_khach or v_chi_xem then%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'ba đường khép cùng nhau: ds_nguoi_xem_duoc · ds_nguoi_bi_che · doc_ho_so_nguoi',
  case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public'
                and ((p.proname in ('ds_nguoi_xem_duoc', 'ds_nguoi_bi_che') and p.prosrc like '%an_bot_rieng%')
                  or (p.proname = 'doc_ho_so_nguoi' and p.prosrc like '%truong_rieng_nguoi(p.id, null)%'))) = 3
       then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'anon không gọi được doc_cay · doc_ho_so_nguoi',
  case when not has_function_privilege('anon', 'public.doc_cay(uuid)', 'execute')
        and not has_function_privilege('anon', 'public.doc_ho_so_nguoi(text)', 'execute')
       then 'ĐẠT' else 'HỎNG' end
order by stt;
