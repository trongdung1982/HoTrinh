-- ============================================================
-- giapha-supabase · luoc-do/51-cong-khai-ca-nhan.sql
-- Vai trò  : Thông tin công khai CỦA TÔI trong từng cây (b150, quantri3
--            `#public-info-detail`) — mỗi tài khoản chọn trường nào về chính
--            người mình được gắn thì KHÁCH của cây ấy thấy.
-- Cần có   : `50`. ⚠ Bản ĐỨNG CUỐI của `doc_cay()` — dán lại `47`/`50` sau
--            file này thì PHẢI dán lại file này, không là khách thấy lại mọi
--            trường người ta đã tắt, IM LẶNG.
-- Thiết kế : chốt 28/09/2026 — đường (A) của KE-HOACH b150: theo prototype.
-- Sổ tay   : so-tay/phan-quyen.md · Đo: ../kiem-thu/ban-thu-sql/do-b150.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 28/09/2026 (b150)
-- ============================================================
--
-- Cài đặt nằm trên DÒNG THÀNH VIÊN `tree_members` (tài khoản X trong cây Y),
--   không trên `persons`/`tree_persons`: gộp hai người (`48`) xoá dòng
--   `tree_persons` của mã thua rồi chèn lại trần — cài đặt để ở đó là mất khi
--   gộp, và mất theo hướng LỘ. Dòng thành viên gộp người không đụng tới.
-- `null` = chưa đặt = theo cây (y hệt trước file này). Lưu danh sách BẬT, cùng
--   sáu nhóm của `47`; trường thật khách thấy = nhóm cây bật ∩ nhóm người bật.
-- Ai bị che: CHỈ khách (`la_khach_cay`, cùng người `47` che). Thành viên và
--   QTHT thấy như cũ; vai `xem` vẫn theo luật người còn sống của `50`.
-- Người có mặt ở cây này mà tài khoản gắn với họ KHÔNG là thành viên cây này
--   (người xuyên cây, vành đai): lấy phần GIAO mọi cài đặt họ đã đặt — chặt
--   nhất, không lộ.

begin;

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'ds_nguoi_bi_che') then
    raise exception 'DỪNG: chưa dán 50-an-nguoi-con-song.sql (thiếu ds_nguoi_bi_che).';
  end if;
end $$;

-- ------------------------------------------------------------
-- 1. Cột — danh sách nhóm BẬT của một tài khoản trong một cây
-- ------------------------------------------------------------
alter table public.tree_members add column if not exists truong_cong_khai text[];

alter table public.tree_members drop constraint if exists tree_members_truong_cong_khai_hop_le;
alter table public.tree_members add constraint tree_members_truong_cong_khai_hop_le
  check (truong_cong_khai is null
         or truong_cong_khai <@ array['gioi_tinh', 'nam_sinh', 'ngay_sinh', 'ngay_mat', 'anh', 'tieu_su']);

-- ------------------------------------------------------------
-- 2. truong_rieng_nguoi() — nhóm BẬT của một người ở một cây, null = không hạn
-- ------------------------------------------------------------
-- Tài khoản gắn với người ấy có dòng ở cây này → theo dòng ấy (kể cả null).
-- Không có → giao mọi dòng đã đặt của họ.
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
    else array(select x from unnest(array['gioi_tinh', 'nam_sinh', 'ngay_sinh', 'ngay_mat', 'anh', 'tieu_su']) x
                where not exists (select 1 from dat where not x = any(dat.t))) end;
$$;

-- Hàm thuần: nhóm cây bật ∩ nhóm người bật (jsonb mảng, null = không hạn).
create or replace function public.giao_truong(p_mo text[], p_rieng jsonb)
returns text[]
language sql
immutable
set search_path = public, pg_temp
as $$
  select case when p_rieng is null or jsonb_typeof(p_rieng) <> 'array' then p_mo
    else array(select x from unnest(p_mo) x where p_rieng ? x) end;
$$;

-- ------------------------------------------------------------
-- 3. doc_cay() — thân `50` + khách thấy theo cài đặt từng người
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

  -- Chỉ người được gắn với một tài khoản mới có cài đặt riêng — tính một lần,
  -- thường chỉ vài người, không phải cả cây.
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
                                    and (u.partners && v_che or u.partners && v_an_anh))));
end;
$$;

-- ------------------------------------------------------------
-- 4. Ba cửa cho trang — tự mình, hoặc Quản trị hệ thống
-- ------------------------------------------------------------
-- Danh sách cài đặt của một tài khoản ở mọi cây — cho cột "n thông tin →".
create or replace function public.ds_cong_khai_tai_khoan(p_user uuid default null)
returns table (tree_id uuid, truong text[])
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.tree_id, m.truong_cong_khai from public.tree_members m
   where m.user_id = coalesce(p_user, auth.uid())
     and (coalesce(p_user, auth.uid()) = auth.uid() or public.la_quan_tri_he_thong());
$$;

-- Một trang: cây · người được gắn (bản ĐỦ — chính chủ hoặc QTHT) · cài đặt.
create or replace function public.doc_cong_khai_tai_khoan(p_tree uuid, p_user uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := coalesce(p_user, auth.uid());
  v_ma   text;
begin
  if v_user is null or not (v_user = auth.uid() or public.la_quan_tri_he_thong()) then
    return jsonb_build_object('ok', false, 'lyDo', 'Chỉ chính chủ tài khoản hoặc Quản trị hệ thống mới xem được trang này.');
  end if;
  if not exists (select 1 from public.tree_members m where m.tree_id = p_tree and m.user_id = v_user) then
    return jsonb_build_object('ok', false, 'lyDo', 'Tài khoản này không ở trong gia phả này.');
  end if;

  select k.person_id into v_ma from public.tai_khoan k where k.user_id = v_user;

  return jsonb_build_object('ok', true,
    'ten', (select t.name from public.trees t where t.id = p_tree),
    'maCay', (select t.tree_code from public.trees t where t.id = p_tree),
    'truongCay', (select to_jsonb(t.truong_cong_khai) from public.trees t where t.id = p_tree),
    'truong', (select to_jsonb(m.truong_cong_khai) from public.tree_members m
                where m.tree_id = p_tree and m.user_id = v_user),
    'email', public.email_tai_khoan(v_user),
    'nguoi', (select to_jsonb(p.*) from public.persons p where p.id = v_ma),
    'doi', (select tp.doi from public.tree_persons tp where tp.tree_id = p_tree and tp.person_id = v_ma));
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
  if not v_moi <@ array['gioi_tinh', 'nam_sinh', 'ngay_sinh', 'ngay_mat', 'anh', 'tieu_su'] then
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
-- 5. Quyền gọi
-- ------------------------------------------------------------
revoke all on function public.truong_rieng_nguoi(text, uuid)                from public, anon, authenticated;
revoke all on function public.giao_truong(text[], jsonb)                     from public, anon;
revoke all on function public.doc_cay(uuid)                                  from public, anon;
revoke all on function public.ds_cong_khai_tai_khoan(uuid)                   from public, anon;
revoke all on function public.doc_cong_khai_tai_khoan(uuid, uuid)            from public, anon;
revoke all on function public.dat_cong_khai_tai_khoan(uuid, uuid, text[])    from public, anon;
grant execute on function public.giao_truong(text[], jsonb)                   to authenticated;
grant execute on function public.doc_cay(uuid)                                to authenticated;
grant execute on function public.ds_cong_khai_tai_khoan(uuid)                 to authenticated;
grant execute on function public.doc_cong_khai_tai_khoan(uuid, uuid)          to authenticated;
grant execute on function public.dat_cong_khai_tai_khoan(uuid, uuid, text[])  to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — bảng cuối phải ra ĐẠT ở cả năm dòng
-- ============================================================
select 1 as stt, 'cột tree_members.truong_cong_khai có, mọi dòng cũ để trống (theo cây)' as ten_kiem,
  case when exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'tree_members'
                       and column_name = 'truong_cong_khai')
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'doc_cay() bản 51 (có truong_rieng_nguoi + coi_con_song) đang chạy',
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'doc_cay') like '%truong_rieng_nguoi%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'doc_cay') like '%coi_con_song%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'anon không gọi được doc_cay · ba cửa mới; authenticated không gọi thẳng truong_rieng_nguoi',
  case when not has_function_privilege('anon', 'public.doc_cay(uuid)', 'execute')
        and not has_function_privilege('anon', 'public.dat_cong_khai_tai_khoan(uuid, uuid, text[])', 'execute')
        and not has_function_privilege('anon', 'public.doc_cong_khai_tai_khoan(uuid, uuid)', 'execute')
        and not has_function_privilege('anon', 'public.ds_cong_khai_tai_khoan(uuid)', 'execute')
        and not has_function_privilege('authenticated', 'public.truong_rieng_nguoi(text, uuid)', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'authenticated gọi được ba cửa mới',
  case when has_function_privilege('authenticated', 'public.dat_cong_khai_tai_khoan(uuid, uuid, text[])', 'execute')
        and has_function_privilege('authenticated', 'public.doc_cong_khai_tai_khoan(uuid, uuid)', 'execute')
        and has_function_privilege('authenticated', 'public.ds_cong_khai_tai_khoan(uuid)', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 5, 'giao_truong: null giữ nguyên; [anh] ∩ cây → chỉ anh',
  case when public.giao_truong(array['anh', 'tieu_su'], null) = array['anh', 'tieu_su']
        and public.giao_truong(array['anh', 'tieu_su'], '["anh", "nam_sinh"]'::jsonb) = array['anh']
       then 'ĐẠT' else 'HỎNG' end
order by stt;
