-- ============================================================
-- giapha-supabase · luoc-do/27-ham-mot-nguoi.sql
-- Vai trò  : b122a — dạy các hàm máy chủ mô hình "một người một bản ghi" của
--            `26`: 20 hàm còn hỏi `tree_id` trên bảng người + `moi_vao_cay`
--            · `doc_cay()` (đọc một cây) · `ds_nguoi_mo_coi()` (QTHT).
-- Chạy ở   : Supabase → SQL Editor. Chạy NGAY SAU `26`, cùng buổi.
--            ⚠ Bản ĐỨNG CUỐI của 21 hàm dưới đây — dán lại `03`/`06`/`08`/
--            `13`→`25` sau file này là kéo chúng về mô hình cũ.
-- Phiên bản: 0.1.0 · Cập nhật: 17/09/2026 (b122a)
-- Thiết kế : THIET-KE-NHIEU-CAY.md mục 6 · Sổ tay: so-tay/luu-du-lieu.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b122.mjs
-- ============================================================
--
-- ⚠⚠ `26` + file này vẫn CHƯA đủ để mở app: `services/sb.js` còn đọc bảng
--   người bằng `tree_id` — đó là b122b. Dán cả hai file SAU khi b122b xong.
--
-- ═══ BA LUẬT MỚI CỦA `luu_cay()` ═══
--
-- 1. THUỘC CÂY (hàng rào 3b). Bản ghi ĐANG CÓ gửi lên hay xoá đi phải thuộc
--    cây đang lưu: người ∈ `tree_persons`; hôn nhân có vợ/chồng hay con thuộc
--    cây; ảnh gắn vào người/hôn nhân thuộc cây. Thiếu luật này thì quản trị
--    cây B (phạm vi không giới hạn) sửa được MỌI người trong phần mềm bằng mã.
-- 2. SỐ CHỐNG GHI ĐÈ. `on conflict do update set … revision = excluded.revision`
--    ở cả bốn bảng — thiếu là trigger của `26` im lặng vô hiệu. `GP409` bắt
--    thành `lyDo` = `xungdot` / `trungma` kèm câu tiếng Việt.
-- 3. XOÁ NGƯỜI = rút khỏi CÂY NÀY. Bản ghi chỉ xoá thật khi không còn cây nào
--    giữ; còn cây khác thì chỉ cắt dòng `tree_persons`.
--
-- ═══ HOÀN TÁC XUYÊN CÂY — `tu_choi_thay_doi()` ═══
--
-- `dung_do_sau()` chỉ thấy nhật ký CÙNG cây: ông X sửa tiếp từ cây A thì từ
-- chối bản lưu cũ ở cây B vẫn dán đè lên. Nên `luu_cay()` ghi thêm vào ảnh
-- chụp `truoc.rev_sau` — số `revision` của từng bản ghi NGAY SAU lần lưu — và
-- hoàn tác chỉ chạy khi số hiện tại còn khớp (`ban_ghi_lech_so()`).
-- Và từ chối mọi nhật ký cũ hơn `doi_ma_toan_cuc.luc` của cây ấy: ảnh chụp
-- ấy nói bằng mã CŨ, dán lại là dán lên người khác.
--
-- ═══ HỎI GÌ VẪN CHƯA ĐÚNG — để b123 ═══
--
-- Cờ `deleted` và việc xoá cứng hôn nhân là CHUNG mọi cây. Hôm nay mỗi cây
-- vẫn tự đứng riêng (chưa ai thêm người cây A vào cây B) nên chưa lộ.
--
-- ⚠ KHÔNG ĐỔI: `ds_kiem_duyet()` · `khoa_cua()` · `dung_do_sau()` — chúng chỉ
--   đọc `change_log` (vẫn theo cây). KE-HOACH liệt kê hai hàm đầu vì chữ
--   `persons` nằm trong khoá JSON, không phải trong bảng.
-- ⚠ Mọi hàm cũ dựng lại bằng `create or replace` cùng chữ ký → `grant` giữ
--   nguyên. Hàm MỚI tự `revoke`/`grant` ở cuối mục của nó.

begin;

-- ============================================================
-- 1. HÀM NỀN — hôn nhân của một cây · so số chống ghi đè
-- ============================================================

-- Hôn nhân "thuộc" cây khi có vợ/chồng HOẶC con thuộc cây (chốt 3, mục 6).
create or replace function public.ds_hon_nhan_cua_cay(p_tree uuid)
returns setof text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select un.id from public.unions un
   where exists (select 1 from unnest(un.partners) x(ma)
                  join public.tree_persons tp on tp.person_id = x.ma
                 where tp.tree_id = p_tree)
  union
  select uc.union_id from public.union_children uc
    join public.tree_persons tp on tp.person_id = uc.person_id
   where tp.tree_id = p_tree;
$$;

-- Khoá đầu tiên (`p:P0001` · `u:…` · `c:U|P` · `m:…`) mà số `revision` HIỆN
-- TẠI khác số ghi ở `truoc.rev_sau`. `null` = không ai đụng từ lần lưu ấy.
-- Dòng vắng ở cả hai phía (đã xoá, vẫn xoá) là khớp.
create or replace function public.ban_ghi_lech_so(p_truoc jsonb)
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  with sau as (select coalesce(p_truoc->'rev_sau', '{}'::jsonb) as r),
  hien as (
    select 'p:' || (e->>'id') as k, p.revision
      from jsonb_array_elements(coalesce(p_truoc->'persons', '[]'::jsonb)) e
      left join public.persons p on p.id = e->>'id'
    union all
    select 'u:' || (e->>'id'), u.revision
      from jsonb_array_elements(coalesce(p_truoc->'unions', '[]'::jsonb)) e
      left join public.unions u on u.id = e->>'id'
    union all
    select 'c:' || (e->>'union_id') || '|' || (e->>'person_id'), c.revision
      from jsonb_array_elements(coalesce(p_truoc->'children', '[]'::jsonb)) e
      left join public.union_children c
        on c.union_id = e->>'union_id' and c.person_id = e->>'person_id'
    union all
    select 'm:' || (e->>'id'), m.revision
      from jsonb_array_elements(coalesce(p_truoc->'media', '[]'::jsonb)) e
      left join public.media m on m.id = e->>'id'
  )
  select h.k from hien h, sau
   where (sau.r ->> h.k)::integer is distinct from h.revision
   order by h.k
   limit 1;
$$;

revoke all on function public.ds_hon_nhan_cua_cay(uuid) from public, anon, authenticated;
revoke all on function public.ban_ghi_lech_so(jsonb)    from public, anon, authenticated;

-- ============================================================
-- 2. ĐỌC — `doc_cay()` thay bốn lệnh `.eq('tree_id', …)` của `sb.js`
-- ============================================================
-- PostgREST không lọc được "hôn nhân có vợ/chồng thuộc cây" bằng đường dẫn,
-- và danh sách 700 mã không nhét vừa URL. Cổng: `co_the_xem_cay()`.
-- Con: chỉ cạnh mà CẢ hai đầu thuộc cây — `domains/` chưa biết vẽ người
-- vắng mặt (b123 mới thêm người cây này vào cây kia).
create or replace function public.doc_cay(p_tree uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_nguoi text[];
  v_hn    text[];
begin
  if p_tree is null or not public.co_the_xem_cay(p_tree) then
    return jsonb_build_object('ok', false,
      'loi', 'Không đọc được gia phả này. Có thể bạn đã bị gỡ khỏi danh sách người được xem.');
  end if;

  v_nguoi := array(select person_id from public.tree_persons where tree_id = p_tree);
  v_hn    := array(select public.ds_hon_nhan_cua_cay(p_tree));

  return jsonb_build_object('ok', true,
    'persons', (select coalesce(jsonb_agg(to_jsonb(p.*) order by p.id), '[]'::jsonb)
                  from public.persons p where p.id = any(v_nguoi)),
    'unions', (select coalesce(jsonb_agg(to_jsonb(u.*) order by u.id), '[]'::jsonb)
                 from public.unions u where u.id = any(v_hn)),
    'children', (select coalesce(jsonb_agg(to_jsonb(c.*) order by c.union_id, c.ord), '[]'::jsonb)
                   from public.union_children c
                  where c.union_id = any(v_hn) and c.person_id = any(v_nguoi)),
    'media', (select coalesce(jsonb_agg(to_jsonb(m.*) order by m.id), '[]'::jsonb)
                from public.media m
               where m.subject_id = any(v_nguoi) or m.subject_id = any(v_hn)));
end;
$$;

revoke all on function public.doc_cay(uuid) from public, anon;
grant execute on function public.doc_cay(uuid) to authenticated;

-- ============================================================
-- 3. NGƯỜI KHÔNG THUỘC CÂY NÀO — khu Quản trị hệ thống (chốt 17/09)
-- ============================================================
-- Xoá cây (`don_thung_rac`) chỉ cắt `tree_persons`; bản ghi người ở lại.
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
         (select count(*) from public.unions u where p.id = any(u.partners))
    from public.persons p
   where not exists (select 1 from public.tree_persons tp where tp.person_id = p.id)
     and public.la_quan_tri_he_thong()
   order by p.id;
$$;

revoke all on function public.ds_nguoi_mo_coi() from public, anon;
grant execute on function public.ds_nguoi_mo_coi() to authenticated;

-- ============================================================
-- 4. PHẠM VI TRỰC HỆ — tính trong những người thuộc cây (chốt 2, mục 6)
-- ============================================================
-- ⚠ Gốc KHÔNG thuộc cây → phạm vi rỗng. Bản cũ nhận `p_goc` vô điều kiện:
--   nay `tree_members.person_id` trỏ được sang người cây khác, và nhận vô
--   điều kiện là cấp quyền sửa người ấy từ cây này.
create or replace function public.pham_vi_sua(p_tree uuid, p_goc text)
returns table(person_id text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with recursive
  cay (id) as (
    select tp.person_id from public.tree_persons tp where tp.tree_id = p_tree
  ),
  -- Đi LÊN. Chỉ trực hệ: qua union mà người ấy làm CON, lấy partner. Không
  -- lấy con của union ấy — đó là rẽ ngang sang anh chị em.
  to_tien (id) as (
    select p_goc where p_goc in (select id from cay)
    union
    select x.ma
      from to_tien t
      join public.union_children uc on uc.person_id = t.id
      join public.unions un on un.id = uc.union_id
      cross join unnest(un.partners) x(ma)
     where x.ma <> t.id
       and x.ma in (select id from cay)
  ),
  -- Đi XUỐNG, không giới hạn đời.
  hau_due (id) as (
    select p_goc where p_goc in (select id from cay)
    union
    select uc.person_id
      from hau_due h
      join public.unions un on h.id = any(un.partners)
      join public.union_children uc on uc.union_id = un.id
     where uc.person_id in (select id from cay)
  ),
  co_ban (id) as (
    select id from to_tien
    union
    select id from hau_due
  ),
  -- Vợ/chồng MỘT bước, không lan tiếp.
  vo_chong (id) as (
    select x.ma
      from public.unions un
      cross join unnest(un.partners) x(ma)
     where x.ma in (select id from cay)
       and exists (select 1 from co_ban c where c.id = any(un.partners))
  )
  select id from co_ban
  union
  select id from vo_chong;
$$;

-- ============================================================
-- 5. `luu_cay()` — bản ĐỨNG CUỐI (thay `25`)
-- ============================================================
create or replace function public.luu_cay(p_tree_id uuid, p_revision integer, p_ops jsonb, p_mo_ta jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email      text := coalesce(auth.jwt() ->> 'email', '');
  v_rev_thuc   integer;
  v_rev_moi    integer;
  v_persons    jsonb;
  v_unions     jsonb;
  v_children   jsonb;
  v_media      jsonb;
  v_sources    jsonb;
  v_ngoai      text;
  v_pham_vi    text[];      -- null = KHÔNG giới hạn (hai hạng quản trị).
  v_cay_nguoi  text[];      -- người thuộc cây này, TRƯỚC lần lưu
  v_cay_hn     text[];      -- hôn nhân thuộc cây này, TRƯỚC lần lưu
  v_moi_nguoi  text[];      -- mã người gửi lên mà chưa bản ghi nào giữ
  v_xoa_p      text[];      -- người rút khỏi cây này
  v_xoa_that   text[];      -- …trong đó không cây nào khác giữ: xoá bản ghi
  v_tree       jsonb;
  v_truoc      jsonb;
  v_imports    jsonb;
  v_trang_thai text;
  v_hint       text;
begin
  -- ══ HÀNG RÀO 1 — có đăng nhập không ══
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'lyDo', 'chuadangnhap',
      'loi', 'Phiên đăng nhập đã hết hạn. Tải lại trang và đăng nhập lại.');
  end if;

  -- ══ HÀNG RÀO 2 — có quyền sửa cây này không ══
  if not public.co_the_sua(p_tree_id) then
    if public.vai_tro(p_tree_id) = 'sua' then
      return jsonb_build_object('ok', false, 'lyDo', 'chuaduyet',
        'loi', 'Tài khoản của bạn chưa được gắn với một người trong gia phả, '
            || 'hoặc quản trị viên chưa duyệt. Trong lúc chờ, bạn vẫn xem '
            || 'được toàn bộ gia phả.');
    end if;
    return jsonb_build_object('ok', false, 'lyDo', 'khongcoquyen',
      'loi', 'Bạn chỉ có quyền xem gia phả này, không sửa được.');
  end if;

  -- ══ HÀNG RÀO 3 — số của CÂY (khối chung, nguồn, sổ nhập) ══
  -- Số của TỪNG BẢN GHI người/hôn nhân/con/ảnh do trigger `26` gác.
  select revision into v_rev_thuc
    from public.trees where id = p_tree_id for update;

  if v_rev_thuc is null then
    return jsonb_build_object('ok', false, 'lyDo', 'khongthaycay',
      'loi', 'Không tìm thấy gia phả này.');
  end if;

  -- ⚠ `p_revision is null` kiểm RIÊNG: `5 <> null` ra `null`, `if` không chạy.
  if p_revision is null or v_rev_thuc <> p_revision then
    return jsonb_build_object('ok', false, 'lyDo', 'xungdot',
      'loi', 'Người khác vừa sửa gia phả trong lúc bạn đang mở. ' ||
             'Tải lại trang để lấy bản mới nhất rồi sửa lại.',
      'revision', v_rev_thuc);
  end if;

  -- Bốn bảng dùng chung KHÔNG gắn mã cây nữa; khoá `tree_id`/`noi_ve` trình
  -- duyệt cũ gửi kèm bị `jsonb_populate_recordset` bỏ qua. Nguồn vẫn theo cây.
  v_persons  := coalesce(p_ops->'persons'->'luu',  '[]'::jsonb);
  v_unions   := coalesce(p_ops->'unions'->'luu',   '[]'::jsonb);
  v_children := coalesce(p_ops->'children'->'luu', '[]'::jsonb);
  v_media    := coalesce(p_ops->'media'->'luu',    '[]'::jsonb);
  v_sources  := public.gan_ma_cay(p_ops->'sources'->'luu', p_tree_id);

  v_cay_nguoi := array(select tp.person_id from public.tree_persons tp
                        where tp.tree_id = p_tree_id);
  v_cay_hn    := array(select public.ds_hon_nhan_cua_cay(p_tree_id));
  v_moi_nguoi := array(select e->>'id' from jsonb_array_elements(v_persons) e
                        where not exists (select 1 from public.persons x
                                           where x.id = e->>'id'));
  v_xoa_p     := array(select jsonb_array_elements_text(
                          coalesce(p_ops->'persons'->'xoa', '[]'::jsonb)));
  v_xoa_that  := array(select p.id from public.persons p
                        where p.id = any(v_xoa_p)
                          and not exists (select 1 from public.tree_persons tp
                                           where tp.person_id = p.id
                                             and tp.tree_id <> p_tree_id));

  -- ══ HÀNG RÀO 3b — bản ghi ĐANG CÓ phải thuộc cây này ══
  -- Dòng gửi `revision = 0` (tự nhận là mới) bỏ qua ở đây: mã ấy mà đã có
  -- người giữ thì trigger `26` từ chối bằng `trungma`, câu đúng hơn.
  select x.ma into v_ngoai from (
    select e->>'id' as ma from jsonb_array_elements(v_persons) e
     where coalesce(e->>'revision', '') <> '0'
    union all
    select unnest(v_xoa_p)
  ) x
   where exists (select 1 from public.persons p where p.id = x.ma)
     and not (x.ma = any(v_cay_nguoi))
   limit 1;
  if v_ngoai is null then
    select x.ma into v_ngoai from (
      select e->>'id' as ma from jsonb_array_elements(v_unions) e
       where coalesce(e->>'revision', '') <> '0'
      union all
      select jsonb_array_elements_text(coalesce(p_ops->'unions'->'xoa', '[]'::jsonb))
    ) x
     where exists (select 1 from public.unions u where u.id = x.ma)
       and not (x.ma = any(v_cay_hn))
     limit 1;
  end if;
  if v_ngoai is null then
    -- Vợ/chồng · con · chủ thể ảnh: người ĐANG CÓ mà ngoài cây thì không kéo vào.
    select x.ma into v_ngoai from (
      select unnest(u.partners) as ma
        from jsonb_populate_recordset(null::public.unions, v_unions) u
      union all
      select uc.person_id from jsonb_populate_recordset(null::public.union_children, v_children) uc
      union all
      select x.person_id from jsonb_to_recordset(coalesce(p_ops->'children'->'xoa', '[]'::jsonb))
             as x(union_id text, person_id text)
    ) x
     where exists (select 1 from public.persons p where p.id = x.ma)
       and not (x.ma = any(v_cay_nguoi))
     limit 1;
  end if;
  if v_ngoai is null then
    select x.ma into v_ngoai from (
      select uc.union_id as ma from jsonb_populate_recordset(null::public.union_children, v_children) uc
      union all
      select x.union_id from jsonb_to_recordset(coalesce(p_ops->'children'->'xoa', '[]'::jsonb))
             as x(union_id text, person_id text)
    ) x
     where exists (select 1 from public.unions u where u.id = x.ma)
       and not (x.ma = any(v_cay_hn))
       and x.ma not in (select u.id from jsonb_populate_recordset(null::public.unions, v_unions) u)
     limit 1;
  end if;
  if v_ngoai is null then
    select x.ma into v_ngoai from (
      select m.subject_id as ma from public.media m
       where m.id in (select e->>'id' from jsonb_array_elements(v_media) e
                       where coalesce(e->>'revision', '') <> '0'
                      union all
                      select jsonb_array_elements_text(coalesce(p_ops->'media'->'xoa', '[]'::jsonb)))
      union all
      select m.subject_id from jsonb_populate_recordset(null::public.media, v_media) m
    ) x
     where nullif(x.ma, '') is not null
       and (exists (select 1 from public.persons p where p.id = x.ma)
            or exists (select 1 from public.unions u where u.id = x.ma))
       and not (x.ma = any(v_cay_nguoi) or x.ma = any(v_cay_hn))
     limit 1;
  end if;
  if v_ngoai is not null then
    return jsonb_build_object('ok', false, 'lyDo', 'ngoaicay',
      'loi', 'Bản ghi ' || v_ngoai || ' không thuộc gia phả này nên không sửa '
          || 'được từ đây. Tải lại trang rồi thử lại.');
  end if;

  -- ══ HÀNG RÀO 4 — giới hạn theo TRỰC HỆ ══
  -- Luật: `06-quyen-truc-he.sql` mục 1. Phạm vi tính MỘT lần, trên dữ liệu
  -- CŨ — tính trên dữ liệu mới thì cạnh vừa khai tự cấp quyền cho chính nó.
  if public.vai_tro(p_tree_id) in ('quan_tri_he_thong', 'quan_tri') then
    v_pham_vi := null;
  else
    v_pham_vi := array(
      select pv.person_id
        from public.pham_vi_sua(p_tree_id, public.nguoi_gan(p_tree_id)) pv);
  end if;

  if v_pham_vi is not null then
    -- 4a. Người gửi lên, đã có.
    select p.id into v_ngoai
      from jsonb_populate_recordset(null::public.persons, v_persons) p
     where not (p.id = any(v_pham_vi))
       and exists (select 1 from public.persons cu where cu.id = p.id)
     limit 1;
    if v_ngoai is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'ngoaiphamvi',
        'loi', 'Người ' || v_ngoai || ' không thuộc trực hệ của bạn nên bạn '
            || 'không sửa được. Nhờ quản trị viên nếu cần.');
    end if;

    -- 4b. Người bị xoá.
    select cu.id into v_ngoai
      from public.persons cu
     where cu.id = any(v_xoa_p)
       and not (cu.id = any(v_pham_vi))
     limit 1;
    if v_ngoai is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'ngoaiphamvi',
        'loi', 'Người ' || v_ngoai || ' không thuộc trực hệ của bạn nên bạn '
            || 'không xoá được.');
    end if;

    -- 4c. Quan hệ — "khai cụ tổ là bố tôi" là đường leo quyền hai lần bấm.
    select u.id into v_ngoai
      from jsonb_populate_recordset(null::public.unions, v_unions) u
     where exists (select 1 from public.persons px
                    where px.id = any(u.partners)
                      and not (px.id = any(v_pham_vi)))
     limit 1;
    if v_ngoai is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'ngoaiphamvi',
        'loi', 'Hôn nhân ' || v_ngoai || ' có người ngoài trực hệ của bạn.');
    end if;

    select cu.id into v_ngoai
      from public.unions cu
     where (cu.id in (select u.id
                        from jsonb_populate_recordset(null::public.unions, v_unions) u)
         or cu.id in (select jsonb_array_elements_text(
                               coalesce(p_ops->'unions'->'xoa','[]'::jsonb))))
       and exists (select 1 from public.persons px
                    where px.id = any(cu.partners)
                      and not (px.id = any(v_pham_vi)))
     limit 1;
    if v_ngoai is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'ngoaiphamvi',
        'loi', 'Hôn nhân ' || v_ngoai || ' đang có người ngoài trực hệ của bạn.');
    end if;

    select uc.person_id into v_ngoai
      from jsonb_populate_recordset(null::public.union_children, v_children) uc
     where not (uc.person_id = any(v_pham_vi))
       and exists (select 1 from public.persons cu where cu.id = uc.person_id)
     limit 1;
    if v_ngoai is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'ngoaiphamvi',
        'loi', 'Không gắn được người ' || v_ngoai || ' làm con: người ấy '
            || 'không thuộc trực hệ của bạn.');
    end if;

    select uc.union_id into v_ngoai
      from jsonb_populate_recordset(null::public.union_children, v_children) uc
     where exists (select 1 from public.unions un
                    join public.persons px on px.id = any(un.partners)
                   where un.id = uc.union_id
                     and not (px.id = any(v_pham_vi)))
     limit 1;
    if v_ngoai is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'ngoaiphamvi',
        'loi', 'Hôn nhân ' || v_ngoai || ' ngoài trực hệ của bạn nên bạn '
            || 'không thêm bớt con của họ được.');
    end if;

    select x.person_id into v_ngoai
      from jsonb_to_recordset(coalesce(p_ops->'children'->'xoa','[]'::jsonb))
           as x(union_id text, person_id text)
     where not (x.person_id = any(v_pham_vi))
        or exists (select 1 from public.unions un
                    join public.persons px on px.id = any(un.partners)
                   where un.id = x.union_id
                     and not (px.id = any(v_pham_vi)))
     limit 1;
    if v_ngoai is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'ngoaiphamvi',
        'loi', 'Quan hệ cha mẹ–con của người ' || v_ngoai || ' nằm ngoài '
            || 'trực hệ của bạn.');
    end if;
  end if;

  -- ══ CHỤP ẢNH DỮ LIỆU CŨ — phải đứng TRƯỚC mọi lệnh ghi ══
  -- Luật ba điều ở `03`: máy chủ tự chụp · `cu` null = dòng chưa từng có ·
  -- cạnh CASCADE cắt theo phải tự đi tìm. `cu` nay mang cả `revision`.
  select jsonb_build_object(

    'persons', (
      select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'cu',
               case when cu.id is null then 'null'::jsonb
                    else to_jsonb(cu.*) end)), '[]'::jsonb)
        from (
          select p.id
            from jsonb_populate_recordset(null::public.persons, v_persons) p
          union
          select unnest(v_xoa_p)
        ) k
        left join public.persons cu on cu.id = k.id),

    'unions', (
      select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'cu',
               case when cu.id is null then 'null'::jsonb
                    else to_jsonb(cu.*) end)), '[]'::jsonb)
        from (
          select u.id
            from jsonb_populate_recordset(null::public.unions, v_unions) u
          union
          select jsonb_array_elements_text(
                   coalesce(p_ops->'unions'->'xoa', '[]'::jsonb))
        ) k
        left join public.unions cu on cu.id = k.id),

    'children', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'union_id', k.union_id, 'person_id', k.person_id, 'cu',
               case when cu.union_id is null then 'null'::jsonb
                    else to_jsonb(cu.*) end)), '[]'::jsonb)
        from (
          select uc.union_id, uc.person_id
            from jsonb_populate_recordset(null::public.union_children, v_children) uc
          union
          select x.union_id, x.person_id
            from jsonb_to_recordset(coalesce(p_ops->'children'->'xoa','[]'::jsonb))
                 as x(union_id text, person_id text)
          union
          -- Cạnh sắp bị cắt theo hôn nhân bị xoá / người bị xoá THẬT.
          select c2.union_id, c2.person_id
            from public.union_children c2
           where c2.union_id in (select jsonb_array_elements_text(
                    coalesce(p_ops->'unions'->'xoa', '[]'::jsonb)))
              or c2.person_id = any(v_xoa_that)
        ) k
        left join public.union_children cu
          on cu.union_id = k.union_id and cu.person_id = k.person_id),

    'media', (
      select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'cu',
               case when cu.id is null then 'null'::jsonb
                    else to_jsonb(cu.*) end)), '[]'::jsonb)
        from (
          select m.id
            from jsonb_populate_recordset(null::public.media, v_media) m
          union
          select jsonb_array_elements_text(
                   coalesce(p_ops->'media'->'xoa', '[]'::jsonb))
        ) k
        left join public.media cu on cu.id = k.id),

    'sources', (
      select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'cu',
               case when sc.tree_id is null then 'null'::jsonb
                    else to_jsonb(sc.*) end)), '[]'::jsonb)
        from (
          select s.id
            from jsonb_populate_recordset(null::public.sources, v_sources) s
          union
          select jsonb_array_elements_text(
                   coalesce(p_ops->'sources'->'xoa', '[]'::jsonb))
        ) k
        left join public.sources sc
          on sc.tree_id = p_tree_id and sc.id = k.id),

    -- ⚠ `luu_cay()` ghi ba trường này bằng `coalesce` — hoàn tác cũng vậy.
    'tree', case
      when jsonb_typeof(coalesce(p_ops->'tree', 'null'::jsonb)) = 'object'
      then (select jsonb_build_object('name', t.name,
                                      'root_person_id', t.root_person_id,
                                      'note', t.note)
              from public.trees t where t.id = p_tree_id)
      else 'null'::jsonb end

  ) into v_truoc;

  -- ══════════════════════════════════════════════════════════
  -- TỪ ĐÂY TRỞ XUỐNG MỚI ĐƯỢC GHI
  -- ══════════════════════════════════════════════════════════
  -- Xoá: con trước, rồi hôn nhân và người. Thêm: người, hôn nhân, rồi con.

  delete from public.union_children uc
   using jsonb_to_recordset(coalesce(p_ops->'children'->'xoa','[]'::jsonb))
         as x(union_id text, person_id text)
   where uc.union_id = x.union_id and uc.person_id = x.person_id;

  delete from public.union_children
   where union_id in (select jsonb_array_elements_text(coalesce(p_ops->'unions'->'xoa','[]'::jsonb)))
      or person_id = any(v_xoa_that);

  delete from public.unions
   where id in (select jsonb_array_elements_text(coalesce(p_ops->'unions'->'xoa','[]'::jsonb)));

  delete from public.media
   where id in (select jsonb_array_elements_text(coalesce(p_ops->'media'->'xoa','[]'::jsonb)));

  delete from public.sources
   where tree_id = p_tree_id
     and id in (select jsonb_array_elements_text(coalesce(p_ops->'sources'->'xoa','[]'::jsonb)));

  -- Rút khỏi cây này; bản ghi chỉ đi khi không cây nào khác giữ.
  delete from public.tree_persons
   where tree_id = p_tree_id and person_id = any(v_xoa_p);
  delete from public.persons where id = any(v_xoa_that);

  -- --- THÊM VÀ SỬA ---
  -- ⚠⚠ `revision = excluded.revision` ở cả bốn bảng. Thiếu nó thì lệnh
  --   UPDATE không nhắc số, trigger `26` cho qua — chống ghi đè vô hiệu.
  insert into public.persons
  select * from jsonb_populate_recordset(null::public.persons, v_persons)
  on conflict (id) do update set
    uid = excluded.uid, names = excluded.names, sex = excluded.sex,
    birth = excluded.birth, death = excluded.death,
    burial_place = excluded.burial_place,
    title = excluded.title, occupation = excluded.occupation,
    education = excluded.education, religion = excluded.religion,
    residence = excluded.residence, nationality = excluded.nationality,
    living = excluded.living, photo_file_id = excluded.photo_file_id,
    note = excluded.note, deleted = excluded.deleted,
    vn = excluded.vn, meta = excluded.meta, branch_id = excluded.branch_id,
    revision = excluded.revision;

  insert into public.tree_persons (tree_id, person_id)
  select p_tree_id, p.id
    from jsonb_populate_recordset(null::public.persons, v_persons) p
  on conflict do nothing;

  insert into public.unions
  select * from jsonb_populate_recordset(null::public.unions, v_unions)
  on conflict (id) do update set
    uid = excluded.uid, partners = excluded.partners,
    partner_order = excluded.partner_order, ranks = excluded.ranks,
    status = excluded.status, marriage = excluded.marriage,
    note = excluded.note, deleted = excluded.deleted,
    revision = excluded.revision;

  insert into public.union_children
  select * from jsonb_populate_recordset(null::public.union_children, v_children)
  on conflict (union_id, person_id) do update set
    relation = excluded.relation, ord = excluded.ord,
    revision = excluded.revision;

  insert into public.media
  select * from jsonb_populate_recordset(null::public.media, v_media)
  on conflict (id) do update set
    subject_id = excluded.subject_id,
    drive_file_id = excluded.drive_file_id,
    drive_file_id_lon = excluded.drive_file_id_lon,
    caption = excluded.caption, year = excluded.year,
    deleted = excluded.deleted, meta = excluded.meta,
    revision = excluded.revision;

  insert into public.sources
  select * from jsonb_populate_recordset(null::public.sources, v_sources)
  on conflict (tree_id, id) do update set
    title = excluded.title, author = excluded.author, note = excluded.note;

  -- --- SỐ SAU LẦN LƯU — hoàn tác xuyên cây so vào đây (đầu file) ---
  v_truoc := v_truoc || jsonb_build_object('rev_sau', (
    select coalesce(jsonb_object_agg(x.k, x.r), '{}'::jsonb) from (
      select 'p:' || p.id as k, p.revision as r from public.persons p
       where p.id in (select e->>'id' from jsonb_array_elements(v_truoc->'persons') e)
      union all
      select 'u:' || u.id, u.revision from public.unions u
       where u.id in (select e->>'id' from jsonb_array_elements(v_truoc->'unions') e)
      union all
      select 'c:' || c.union_id || '|' || c.person_id, c.revision
        from public.union_children c
        join jsonb_array_elements(v_truoc->'children') e
          on c.union_id = e->>'union_id' and c.person_id = e->>'person_id'
      union all
      select 'm:' || m.id, m.revision from public.media m
       where m.id in (select e->>'id' from jsonb_array_elements(v_truoc->'media') e)
    ) x));

  -- --- SỔ NHẬP ---
  with them as (
    insert into public.imports (tree_id, by_email, file, source, source_name,
                                exporter, counts, map)
    select p_tree_id, v_email,
           coalesce(e->>'file',''), coalesce(e->>'source',''),
           coalesce(e->>'source_name',''), coalesce(e->>'exporter',''),
           coalesce(e->'counts','{}'::jsonb), coalesce(e->'map','[]'::jsonb)
      from jsonb_array_elements(coalesce(p_ops->'imports','[]'::jsonb)) e
    returning id
  )
  select coalesce(jsonb_agg(them.id), '[]'::jsonb) into v_imports from them;

  v_truoc := v_truoc || jsonb_build_object('imports_moi', v_imports);

  -- --- KHỐI THÔNG TIN CHUNG CỦA CÂY + TĂNG SỐ CÂY ---
  v_rev_moi := v_rev_thuc + 1;
  update public.trees set
    name           = coalesce(p_ops->'tree'->>'name', name),
    root_person_id = coalesce(p_ops->'tree'->>'root_person_id', root_person_id),
    note           = coalesce(p_ops->'tree'->>'note', note),
    revision       = v_rev_moi,
    updated_at     = now(),
    updated_by     = v_email
   where id = p_tree_id
   returning to_jsonb(trees.*) into v_tree;

  -- --- NHẬT KÝ --- (`ts`/`by`/`truoc`/`trang_thai` người gửi không tự khai)
  v_trang_thai := case when public.ghi_thang(p_tree_id) then 'duyet' else 'cho' end;

  insert into public.change_log (tree_id, by_email, user_id, action, target,
                                 note, diff, revision, truoc, trang_thai,
                                 duyet_boi, duyet_luc)
  values (p_tree_id, v_email, auth.uid(),
          coalesce(p_mo_ta->>'action', 'update'),
          coalesce(p_mo_ta->>'target', ''),
          coalesce(p_mo_ta->>'note', ''),
          coalesce(p_mo_ta->'diff', '{}'::jsonb),
          v_rev_moi, v_truoc, v_trang_thai,
          case when v_trang_thai = 'duyet' then v_email end,
          case when v_trang_thai = 'duyet' then now()   end);

  return jsonb_build_object('ok', true, 'lyDo', null, 'loi', null,
                            'revision', v_rev_moi, 'tree', v_tree,
                            'trangThai', v_trang_thai);

exception
  -- Trigger `chan_ghi_de_ban_ghi` (`26`). Cả lần lưu đã tự huỷ ở đây.
  when sqlstate 'GP409' then
    get stacked diagnostics v_hint = pg_exception_hint, v_ngoai = message_text;
    return jsonb_build_object('ok', false, 'lyDo', coalesce(v_hint, 'xungdot'),
      'loi', case when v_hint = 'trungma'
                  then 'Mã mới vừa cấp đã có bản ghi khác giữ, nên lần lưu này không '
                    || 'ghi đè lên nó. Tải lại trang rồi thêm lại.'
                  else 'Người khác vừa sửa một người trong lần lưu này (có thể từ '
                    || 'gia phả khác). Tải lại trang để lấy bản mới nhất rồi sửa lại.'
             end,
      'chiTiet', v_ngoai);
end;
$$;

-- ============================================================
-- 6. `tu_choi_thay_doi()` — bản ĐỨNG CUỐI (thay `25`)
-- ============================================================
create or replace function public.tu_choi_thay_doi(p_tree uuid, p_id bigint, p_ly_do text default ''::text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email    text := coalesce(auth.jwt() ->> 'email', '');
  v_tt       text;
  v_ts       timestamptz;
  v_truoc    jsonb;
  v_khoa     text[];
  v_sau      record;
  v_ngoai    text;
  v_xoa_p    text[];
  v_xoa_u    text[];
  v_rev_moi  integer;
begin
  if not public.co_the_kiem_duyet(p_tree) then
    return jsonb_build_object('ok', false, 'lyDo', 'khongcoquyen',
      'loi', 'Chỉ quản trị hệ thống hoặc quản trị viên mới từ chối được nội dung.');
  end if;

  -- Khoá dòng nhật ký: hai người bấm Từ chối cùng lúc thì người sau dừng ở
  -- phép kiểm `trang_thai` ngay dưới.
  select trang_thai, truoc, ts into v_tt, v_truoc, v_ts
    from public.change_log
   where id = p_id and tree_id = p_tree
     for update;

  if v_tt is null then
    return jsonb_build_object('ok', false, 'lyDo', 'khongthay',
      'loi', 'Không có thay đổi nào mang số ' || p_id || ' trong gia phả này.');
  end if;
  if v_tt <> 'cho' then
    return jsonb_build_object('ok', false, 'lyDo', 'daxuly',
      'loi', 'Thay đổi này đã được xử lý rồi (' || v_tt || ').');
  end if;

  -- ══ 7-0. NHẬT KÝ CŨ HƠN LÚC ĐỔI MÃ (`26`) ══
  -- Ảnh chụp ấy nói bằng mã cũ của cây này; mã ấy nay có thể là người khác.
  if exists (select 1 from public.doi_ma_toan_cuc d
              where d.tree_id = p_tree and d.luc > v_ts) then
    return jsonb_build_object('ok', false, 'lyDo', 'truocdoima',
      'loi', 'Lần Lưu này có từ trước khi phần mềm đổi sang mã người chung, nên '
          || 'ảnh chụp của nó mang mã cũ — hoàn tác tự động có thể dán lên người '
          || 'khác. Sửa tay nếu cần.');
  end if;

  v_khoa := public.khoa_cua(v_truoc);

  -- ══ 7a. CÓ AI SỬA TIẾP LÊN TRÊN KHÔNG — cùng cây ══
  -- ⚠ Hỏi `found`, đừng hỏi `v_sau.id is not null`.
  select * into v_sau from public.dung_do_sau(p_tree, p_id);
  if found then
    return jsonb_build_object('ok', false, 'lyDo', 'dabisuatiep',
      'loi', 'Không hoàn tác được: ' || coalesce(v_sau.by_email, 'người khác')
          || ' đã sửa tiếp lên đúng những bản ghi này lúc '
          || to_char(v_sau.ts, 'HH24:MI DD/MM/YYYY')
          || '. Hoàn tác bây giờ là xoá mất công của họ. '
          || 'Hãy từ chối thay đổi mới hơn trước, hoặc sửa tay.',
      'canxuly', v_sau.id);
  end if;

  if v_khoa = '{}'::text[] then
    return jsonb_build_object('ok', false, 'lyDo', 'khongcoanhchup',
      'loi', 'Lần Lưu này không có ảnh chụp dữ liệu cũ (nó có trước khi bật '
          || 'kiểm duyệt), nên không hoàn tác tự động được. Sửa tay nếu cần.');
  end if;

  -- ══ 7a'. CÓ AI SỬA TIẾP — từ BẤT KỲ cây nào (số trên từng bản ghi) ══
  v_ngoai := public.ban_ghi_lech_so(v_truoc);
  if v_ngoai is not null then
    return jsonb_build_object('ok', false, 'lyDo', 'dabisuatiep',
      'loi', 'Không hoàn tác được: bản ghi ' || substr(v_ngoai, 3)
          || ' đã được sửa tiếp sau lần Lưu này (có thể từ gia phả khác). '
          || 'Hoàn tác bây giờ là xoá mất công của người sau. Sửa tay nếu cần.');
  end if;

  select coalesce(array_agg(e->>'id'), '{}'::text[]) into v_xoa_p
    from jsonb_array_elements(coalesce(v_truoc->'persons', '[]'::jsonb)) e
   where jsonb_typeof(e->'cu') = 'null';

  select coalesce(array_agg(e->>'id'), '{}'::text[]) into v_xoa_u
    from jsonb_array_elements(coalesce(v_truoc->'unions', '[]'::jsonb)) e
   where jsonb_typeof(e->'cu') = 'null';

  -- ══ 7b. XOÁ CÓ KÉO THEO GÌ NGOÀI TẦM KHÔNG ══
  select uc.union_id || ' ↔ ' || uc.person_id into v_ngoai
    from public.union_children uc
   where (uc.person_id = any(v_xoa_p) or uc.union_id = any(v_xoa_u))
     and not (('c:' || uc.union_id || '|' || uc.person_id) = any(v_khoa))
   limit 1;
  if v_ngoai is not null then
    return jsonb_build_object('ok', false, 'lyDo', 'keotheo',
      'loi', 'Không hoàn tác được: bỏ những người mới thêm sẽ cắt luôn quan hệ '
          || v_ngoai || ' do lần Lưu khác tạo ra. Sửa tay nếu cần.');
  end if;

  select tm.email into v_ngoai
    from public.tree_members tm
   where tm.person_id = any(v_xoa_p)
   limit 1;
  if v_ngoai is not null then
    return jsonb_build_object('ok', false, 'lyDo', 'keotheo',
      'loi', 'Không hoàn tác được: tài khoản ' || v_ngoai || ' đang gắn với '
          || 'một trong những người sắp bị bỏ. Gỡ gắn kết ấy trước.');
  end if;

  -- Người mới của lần Lưu ấy nay đã có mặt ở cây KHÁC: bỏ đi là xoá ở đó.
  select tp.person_id into v_ngoai
    from public.tree_persons tp
   where tp.person_id = any(v_xoa_p) and tp.tree_id <> p_tree
   limit 1;
  if v_ngoai is not null then
    return jsonb_build_object('ok', false, 'lyDo', 'keotheo',
      'loi', 'Không hoàn tác được: người ' || v_ngoai || ' nay đã có mặt ở gia '
          || 'phả khác. Sửa tay nếu cần.');
  end if;

  -- ══════════════════════════════════════════════════════════
  -- TỪ ĐÂY TRỞ XUỐNG MỚI ĐƯỢC GHI
  -- ══════════════════════════════════════════════════════════

  delete from public.union_children uc
   using jsonb_array_elements(coalesce(v_truoc->'children', '[]'::jsonb)) e
   where uc.union_id  = e->>'union_id'
     and uc.person_id = e->>'person_id';

  delete from public.unions  where id = any(v_xoa_u);
  delete from public.persons where id = any(v_xoa_p);   -- `tree_persons` đi theo (cascade)

  -- --- KHÔI PHỤC NGƯỜI ---
  -- ⚠ `on conflict do update`, KHÔNG xoá-rồi-chèn (cascade cắt quan hệ).
  -- ⚠ KHÔNG `revision = excluded.revision` ở đây: `cu` mang số CŨ, và 7a' đã
  --   xác nhận không ai sửa tiếp — để trigger tự tăng số.
  insert into public.persons
  select * from jsonb_populate_recordset(null::public.persons, (
    select coalesce(jsonb_agg(e->'cu'), '[]'::jsonb)
      from jsonb_array_elements(coalesce(v_truoc->'persons', '[]'::jsonb)) e
     where jsonb_typeof(e->'cu') = 'object'))
  on conflict (id) do update set
    uid = excluded.uid, names = excluded.names, sex = excluded.sex,
    birth = excluded.birth, death = excluded.death,
    burial_place = excluded.burial_place,
    title = excluded.title, occupation = excluded.occupation,
    education = excluded.education, religion = excluded.religion,
    residence = excluded.residence, nationality = excluded.nationality,
    living = excluded.living, photo_file_id = excluded.photo_file_id,
    note = excluded.note, deleted = excluded.deleted,
    vn = excluded.vn, meta = excluded.meta, branch_id = excluded.branch_id;

  -- Người lần Lưu ấy rút khỏi cây này: trả về cây.
  insert into public.tree_persons (tree_id, person_id)
  select p_tree, e->>'id'
    from jsonb_array_elements(coalesce(v_truoc->'persons', '[]'::jsonb)) e
   where jsonb_typeof(e->'cu') = 'object'
  on conflict do nothing;

  -- --- KHÔI PHỤC HÔN NHÂN ---
  insert into public.unions
  select * from jsonb_populate_recordset(null::public.unions, (
    select coalesce(jsonb_agg(e->'cu'), '[]'::jsonb)
      from jsonb_array_elements(coalesce(v_truoc->'unions', '[]'::jsonb)) e
     where jsonb_typeof(e->'cu') = 'object'))
  on conflict (id) do update set
    uid = excluded.uid, partners = excluded.partners,
    partner_order = excluded.partner_order, ranks = excluded.ranks,
    status = excluded.status, marriage = excluded.marriage,
    note = excluded.note, deleted = excluded.deleted;

  -- --- KHÔI PHỤC CON ---
  insert into public.union_children
  select * from jsonb_populate_recordset(null::public.union_children, (
    select coalesce(jsonb_agg(e->'cu'), '[]'::jsonb)
      from jsonb_array_elements(coalesce(v_truoc->'children', '[]'::jsonb)) e
     where jsonb_typeof(e->'cu') = 'object'))
  on conflict (union_id, person_id) do update set
    relation = excluded.relation, ord = excluded.ord;

  -- --- KHÔI PHỤC ẢNH và NGUỒN ---
  delete from public.media
   where id in (select e->>'id'
                  from jsonb_array_elements(coalesce(v_truoc->'media','[]'::jsonb)) e
                 where jsonb_typeof(e->'cu') = 'null');

  insert into public.media
  select * from jsonb_populate_recordset(null::public.media, (
    select coalesce(jsonb_agg(e->'cu'), '[]'::jsonb)
      from jsonb_array_elements(coalesce(v_truoc->'media', '[]'::jsonb)) e
     where jsonb_typeof(e->'cu') = 'object'))
  on conflict (id) do update set
    subject_id = excluded.subject_id,
    drive_file_id = excluded.drive_file_id,
    drive_file_id_lon = excluded.drive_file_id_lon,
    caption = excluded.caption, year = excluded.year,
    deleted = excluded.deleted, meta = excluded.meta;

  delete from public.sources
   where tree_id = p_tree
     and id in (select e->>'id'
                  from jsonb_array_elements(coalesce(v_truoc->'sources','[]'::jsonb)) e
                 where jsonb_typeof(e->'cu') = 'null');

  insert into public.sources
  select * from jsonb_populate_recordset(null::public.sources, (
    select coalesce(jsonb_agg(e->'cu'), '[]'::jsonb)
      from jsonb_array_elements(coalesce(v_truoc->'sources', '[]'::jsonb)) e
     where jsonb_typeof(e->'cu') = 'object'))
  on conflict (tree_id, id) do update set
    title = excluded.title, author = excluded.author, note = excluded.note;

  -- --- SỔ NHẬP: gỡ những dòng chính lần Lưu này đẻ ra ---
  delete from public.imports
   where tree_id = p_tree
     and id in (select x::bigint
                  from jsonb_array_elements_text(
                         coalesce(v_truoc->'imports_moi', '[]'::jsonb)) x);

  -- --- KHỐI THÔNG TIN CHUNG CỦA CÂY + TĂNG SỐ CÂY ---
  select revision + 1 into v_rev_moi
    from public.trees where id = p_tree for update;

  update public.trees set
    name           = coalesce(v_truoc->'tree'->>'name', name),
    root_person_id = coalesce(v_truoc->'tree'->>'root_person_id', root_person_id),
    note           = coalesce(v_truoc->'tree'->>'note', note),
    revision       = v_rev_moi,
    updated_at     = now(),
    updated_by     = v_email
   where id = p_tree;

  update public.change_log
     set trang_thai = 'tu_choi', duyet_boi = v_email, duyet_luc = now(),
         ly_do_tu_choi = left(coalesce(p_ly_do, ''), 500)
   where id = p_id and tree_id = p_tree;

  return jsonb_build_object('ok', true, 'id', p_id, 'trangThai', 'tu_choi',
                            'revision', v_rev_moi);

exception
  when foreign_key_violation then
    return jsonb_build_object('ok', false, 'lyDo', 'vuongkhoangoai',
      'loi', 'Không hoàn tác được vì còn bản ghi khác đang trỏ tới dữ liệu '
          || 'này. Không có gì bị thay đổi. Sửa tay nếu cần.');
  when sqlstate 'GP409' then
    return jsonb_build_object('ok', false, 'lyDo', 'dabisuatiep',
      'loi', 'Không hoàn tác được: có người vừa sửa đúng những bản ghi này. '
          || 'Không có gì bị thay đổi. Tải lại rồi xem lại.');
end;
$$;

-- ============================================================
-- 7. KIỂM DUYỆT — xem chi tiết
-- ============================================================
-- Thêm hai khoá cho màn hình (b122b): `truocDoiMa` · `lechSo` — cùng hai câu
-- hỏi `tu_choi_thay_doi()` tự hỏi, để khoá nút sớm.
create or replace function public.chi_tiet_kiem_duyet(p_tree uuid, p_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_tt      text;
  v_ts      timestamptz;
  v_truoc   jsonb;
  v_ban_ghi jsonb;
  v_khoa    record;
begin
  if not public.co_the_kiem_duyet(p_tree) then
    return jsonb_build_object('ok', false, 'lyDo', 'khongcoquyen',
      'loi', 'Chỉ quản trị hệ thống hoặc quản trị viên mới xem chi tiết được.');
  end if;

  select trang_thai, truoc, ts into v_tt, v_truoc, v_ts
    from public.change_log
   where id = p_id and tree_id = p_tree;

  if v_tt is null then
    return jsonb_build_object('ok', false, 'lyDo', 'khongthay',
      'loi', 'Không có thay đổi nào mang số ' || p_id || ' trong gia phả này.');
  end if;

  select jsonb_build_object(
    'nguoi', (
      select coalesce(jsonb_agg(jsonb_build_object('id', e->>'id', 'truoc', e->'cu',
               'sau', case when cu.id is null then 'null'::jsonb
                           else to_jsonb(cu.*) end)), '[]'::jsonb)
        from jsonb_array_elements(coalesce(v_truoc->'persons', '[]'::jsonb)) e
        left join public.persons cu on cu.id = e->>'id'),

    'honnhan', (
      select coalesce(jsonb_agg(jsonb_build_object('id', e->>'id', 'truoc', e->'cu',
               'sau', case when cu.id is null then 'null'::jsonb
                           else to_jsonb(cu.*) end)), '[]'::jsonb)
        from jsonb_array_elements(coalesce(v_truoc->'unions', '[]'::jsonb)) e
        left join public.unions cu on cu.id = e->>'id'),

    'con', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'unionId', e->>'union_id', 'personId', e->>'person_id',
               'truoc', e->'cu',
               'sau', case when cu.union_id is null then 'null'::jsonb
                           else to_jsonb(cu.*) end)), '[]'::jsonb)
        from jsonb_array_elements(coalesce(v_truoc->'children', '[]'::jsonb)) e
        left join public.union_children cu
          on cu.union_id = e->>'union_id' and cu.person_id = e->>'person_id'),

    'anh', (
      select coalesce(jsonb_agg(jsonb_build_object('id', e->>'id', 'truoc', e->'cu',
               'sau', case when cu.id is null then 'null'::jsonb
                           else to_jsonb(cu.*) end)), '[]'::jsonb)
        from jsonb_array_elements(coalesce(v_truoc->'media', '[]'::jsonb)) e
        left join public.media cu on cu.id = e->>'id'),

    'nguon', (
      select coalesce(jsonb_agg(jsonb_build_object('id', e->>'id', 'truoc', e->'cu',
               'sau', case when sc.tree_id is null then 'null'::jsonb
                           else to_jsonb(sc.*) end)), '[]'::jsonb)
        from jsonb_array_elements(coalesce(v_truoc->'sources', '[]'::jsonb)) e
        left join public.sources sc
          on sc.tree_id = p_tree and sc.id = e->>'id'),

    'cay', case
      when jsonb_typeof(coalesce(v_truoc->'tree', 'null'::jsonb)) = 'object'
      then jsonb_build_object('truoc', v_truoc->'tree',
             'sau', (select jsonb_build_object('name', t.name,
                                                'root_person_id', t.root_person_id,
                                                'note', t.note)
                       from public.trees t where t.id = p_tree))
      else null end
  ) into v_ban_ghi;

  select * into v_khoa from public.dung_do_sau(p_tree, p_id);

  return jsonb_build_object('ok', true, 'id', p_id, 'trangThai', v_tt,
    'banGhi', v_ban_ghi,
    'biKhoa', case when not found or v_khoa.id is null then null
              else jsonb_build_object('id', v_khoa.id, 'byEmail', v_khoa.by_email,
                                       'ts', v_khoa.ts) end,
    'truocDoiMa', exists (select 1 from public.doi_ma_toan_cuc d
                           where d.tree_id = p_tree and d.luc > v_ts),
    'lechSo', case when v_tt = 'cho' then public.ban_ghi_lech_so(v_truoc) end);
end;
$$;

-- ============================================================
-- 8. ĐẾM — ds_gia_pha · dem_du_lieu · xin_xoa_cay · don_thung_rac
-- ============================================================
create or replace function public.ds_gia_pha()
returns table(id uuid, ten text, tree_code text, email_chu text, so_nguoi bigint, vai_cua_toi text, co_the_xem boolean, co_the_sua_du_lieu boolean, da_nop_don boolean, cho_nguoi_la_thay_ten boolean, toi_la_chu boolean, duoc_moi boolean, moi_vai text, email_nguoi_moi text, xin_xoa_luc timestamp with time zone, xin_xoa_ly_do text, email_xin_xoa text, da_xoa_luc timestamp with time zone)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    t.id,
    t.name                                       as ten,
    t.tree_code,
    au.email                                     as email_chu,
    (select count(*) from public.tree_persons tp
       join public.persons p on p.id = tp.person_id
      where tp.tree_id = t.id and p.deleted = false) as so_nguoi,
    public.vai_tro(t.id)                         as vai_cua_toi,
    public.co_the_xem_cay(t.id)                  as co_the_xem,
    public.co_the_sua(t.id)                      as co_the_sua_du_lieu,
    exists (
      select 1 from public.tree_members tm
       where tm.tree_id = t.id
         and tm.user_id = auth.uid()
         and tm.approved = false
         and tm.moi_luc is null
    )                                            as da_nop_don,
    t.cho_nguoi_la_thay_ten,
    coalesce(t.chu_so_huu = auth.uid(), false)   as toi_la_chu,
    exists (
      select 1 from public.tree_members tm
       where tm.tree_id = t.id
         and tm.user_id = auth.uid()
         and tm.approved = false
         and tm.moi_luc is not null
    )                                            as duoc_moi,
    (select tm.moi_vai from public.tree_members tm
      where tm.tree_id = t.id and tm.user_id = auth.uid()
        and tm.approved = false and tm.moi_luc is not null) as moi_vai,
    coalesce((select um.email::text
                from public.tree_members tm
                left join auth.users um on um.id = tm.moi_boi
               where tm.tree_id = t.id and tm.user_id = auth.uid()
                 and tm.approved = false and tm.moi_luc is not null), '')
                                                 as email_nguoi_moi,
    t.xin_xoa_luc,
    t.xin_xoa_ly_do,
    coalesce(ax.email::text, '')                 as email_xin_xoa,
    t.da_xoa_luc
  from public.trees t
  left join auth.users au on au.id = t.chu_so_huu
  left join auth.users ax on ax.id = t.xin_xoa_boi
  where
    public.co_the_xem_cay(t.id)
    or t.cho_nguoi_la_thay_ten = true
    or public.la_quan_tri_he_thong()
    or exists (
      select 1 from public.tree_members tm
       where tm.tree_id = t.id
         and tm.user_id = auth.uid()
         and tm.approved = false
    )
    -- Nhánh b118b: chủ cây thấy dòng cây mình vừa xoá, tới khi nó vào thùng rác.
    or (coalesce(t.chu_so_huu = auth.uid(), false)
        and t.da_xoa_luc is null
        and not public.bi_khoa())
  order by t.name;
$$;

-- Hôn nhân/con đếm theo `ds_hon_nhan_cua_cay()` — cùng tập `doc_cay()` trả.
create or replace function public.dem_du_lieu(p_tree uuid)
returns table(persons integer, unions integer, union_children integer, tree_members integer, change_log integer)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with hn as (select public.ds_hon_nhan_cua_cay(p_tree) as id)
  select (select count(*) from public.tree_persons   where tree_id = p_tree)::integer,
         (select count(*) from hn)::integer,
         (select count(*) from public.union_children uc
           where uc.union_id in (select id from hn)
             and uc.person_id in (select tp.person_id from public.tree_persons tp
                                   where tp.tree_id = p_tree))::integer,
         (select count(*) from public.tree_members   where tree_id = p_tree)::integer,
         (select count(*) from public.change_log     where tree_id = p_tree)::integer
   where public.la_quan_tri_he_thong();
$$;

create or replace function public.xin_xoa_cay(p_tree uuid, p_ly_do text default ''::text)
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

-- ⚠ Đổi NGHĨA: xoá cây chỉ cắt `tree_persons` (cascade). Người · hôn nhân ·
--   ảnh Ở LẠI và hiện trong `ds_nguoi_mo_coi()` nếu không cây nào giữ.
--   Nên `dsAnh` nay LUÔN rỗng — không file ảnh nào mồ côi vì xoá cây. Khoá
--   giữ lại để màn hình cũ không vỡ; `soNguoiMoCoi` là khoá mới.
create or replace function public.don_thung_rac(p_ds uuid[])
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_du       uuid[];
  v_chua     jsonb;
  v_ten      text[];
  v_nguoi    bigint;
  v_mo_coi   bigint;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới dọn được thùng rác.');
  end if;

  if p_ds is null or array_length(p_ds, 1) is null then
    return jsonb_build_object('ok', false, 'loi',
      'Chưa chọn gia phả nào để dọn.');
  end if;

  select coalesce(array_agg(t.id), '{}'::uuid[]),
         coalesce(array_agg(t.name), '{}'::text[])
    into v_du, v_ten
    from public.trees t
   where t.id = any(p_ds)
     and t.da_xoa_luc is not null
     and t.da_xoa_luc <= now() - interval '120 days';

  select coalesce(jsonb_agg(jsonb_build_object(
           'ten', t.name,
           'conLai', greatest(0, 120 - floor(extract(epoch from
                        now() - t.da_xoa_luc) / 86400)::int))), '[]'::jsonb)
    into v_chua
    from public.trees t
   where t.id = any(p_ds)
     and (t.da_xoa_luc is null
          or t.da_xoa_luc > now() - interval '120 days');

  if array_length(v_du, 1) is null then
    return jsonb_build_object('ok', false, 'loi',
      'Không cây nào trong số đã chọn đủ 120 ngày nằm trong thùng rác.',
      'boQua', v_chua);
  end if;

  -- Đếm TRƯỚC khi xoá — sau `delete` cascade đã cắt `tree_persons`.
  select count(distinct tp.person_id) into v_nguoi
    from public.tree_persons tp where tp.tree_id = any(v_du);

  select count(distinct tp.person_id) into v_mo_coi
    from public.tree_persons tp
   where tp.tree_id = any(v_du)
     and not exists (select 1 from public.tree_persons t2
                      where t2.person_id = tp.person_id
                        and not (t2.tree_id = any(v_du)));

  delete from public.trees where id = any(v_du);

  return jsonb_build_object(
    'ok',           true,
    'soCay',        array_length(v_du, 1),
    'tenCay',       to_jsonb(v_ten),
    'soNguoi',      v_nguoi,
    'soNguoiMoCoi', v_mo_coi,
    'dsAnh',        '[]'::jsonb,
    'boQua',        v_chua
  );
end;
$$;

-- ============================================================
-- 9. GẮN MÃ NGƯỜI CHO TÀI KHOẢN — người phải THUỘC CÂY
-- ============================================================
-- Trước `26` khoá ngoại `(tree_id, person_id)` của `tree_members` tự chặn mã
-- cây khác. Khoá ấy nay chỉ còn `person_id` → bốn cửa tự hỏi `tree_persons`.
create or replace function public.duyet_thanh_vien(p_tree uuid, p_email text, p_person_id text, p_duyet boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid;
  n integer;
begin
  -- ⚠ `coalesce(…, '')`: với người NGOÀI cây `vai_tro()` trả `null`, và
  --   `null not in (…)` ra `null` — cửa không đóng (H9, 04/09/2026).
  if coalesce(public.vai_tro(p_tree), '') not in ('quan_tri_he_thong', 'quan_tri') then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ quản trị hệ thống hoặc quản trị viên mới duyệt được thành viên.');
  end if;

  select id into v_user from auth.users where lower(email) = lower(p_email);
  if v_user is null then
    return jsonb_build_object('ok', false, 'loi',
      'Không có tài khoản nào mang email ' || p_email || '.');
  end if;

  -- ⚠ b110c: lời mời thì chữ ký thứ hai thuộc người được mời.
  if public.la_loi_moi_cho_nhan(p_tree, v_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Đây là LỜI MỜI đang chờ chính người ấy bấm Nhận, không phải đơn xin '
      || 'vào gia phả. Không ai nhận hộ được — vào cây luôn cần hai chữ ký. '
      || 'Muốn đổi vai mời hay đổi ý thì rút lời mời rồi mời lại.');
  end if;

  if p_person_id is not null then
    select count(*) into n from public.tree_persons
     where tree_id = p_tree and person_id = p_person_id;
    if n <> 1 then
      return jsonb_build_object('ok', false, 'loi',
        'Không có người mang mã ' || p_person_id || ' trong gia phả này.');
    end if;
  end if;

  update public.tree_members
     set person_id = p_person_id,
         approved  = p_duyet
   where tree_id = p_tree and user_id = v_user;

  if not found then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản ' || p_email || ' chưa được thêm vào gia phả này.');
  end if;

  return jsonb_build_object('ok', true, 'email', p_email,
    'person_id', p_person_id, 'approved', p_duyet);
end;
$$;

create or replace function public.gan_nguoi_cho_thanh_vien(p_tree uuid, p_user uuid, p_person text default null::text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ma text;
  n    integer;
begin
  if not public.co_the_quan_tri(p_tree) then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ chủ gia phả mới gắn được mã người cho tài khoản.');
  end if;

  if public.la_chinh_minh(p_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Không ai tự gắn mã người cho chính mình được — gắn vào một cụ tổ là tự '
      || 'mở quyền sửa ra cả gia phả. Nhờ một quản trị khác làm việc này.');
  end if;

  -- ⚠ b110c: chưa nhận lời mời thì chưa gắn.
  if public.la_loi_moi_cho_nhan(p_tree, p_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này mới được MỜI, chưa bấm Nhận. Gắn mã người sau khi họ vào '
      || 'cây — hoặc rút lời mời rồi mời lại kèm mã người ngay từ đầu.');
  end if;

  v_ma := nullif(btrim(coalesce(p_person, '')), '');

  if v_ma is not null then
    select count(*) into n
      from public.tree_persons tp join public.persons p on p.id = tp.person_id
     where tp.tree_id = p_tree and tp.person_id = v_ma
       and not coalesce(p.deleted, false);
    if n <> 1 then
      return jsonb_build_object('ok', false, 'loi',
        'Không có người mang mã ' || v_ma || ' trong gia phả này.');
    end if;
  end if;

  update public.tree_members
     set person_id = v_ma
   where tree_id = p_tree and user_id = p_user;

  if not found then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này chưa có tên trong gia phả.');
  end if;

  return jsonb_build_object('ok', true, 'maNguoi', v_ma);

exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'loi',
      'Mã ' || v_ma || ' đã gắn cho một tài khoản khác rồi. Gỡ bên đó trước.');
end;
$$;

create or replace function public.nop_de_xuat_gan(p_tree uuid, p_person text, p_ly_do text default ''::text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_toi  uuid := auth.uid();
  v_ma   text;
  v_tv   public.tree_members%rowtype;
  v_id   uuid;
  v_sua  boolean := false;
  n      integer;
begin
  if v_toi is null then
    return jsonb_build_object('ok', false, 'loi',
      'Chưa đăng nhập nên chưa nộp đơn được.');
  end if;

  if p_tree is null or not exists (select 1 from public.trees where id = p_tree) then
    return jsonb_build_object('ok', false, 'loi', 'Không có gia phả này.');
  end if;

  select * into v_tv from public.tree_members
   where tree_id = p_tree and user_id = v_toi;

  if not found then
    return jsonb_build_object('ok', false, 'loi',
      'Bạn chưa có tên trong gia phả này. Xin vào gia phả trước đã, rồi mới '
      || 'đề xuất được mã người.');
  end if;

  if not coalesce(v_tv.approved, false) then
    return jsonb_build_object('ok', false, 'loi',
      case when v_tv.moi_luc is not null
           then 'Bạn mới được MỜI vào gia phả này và chưa bấm Nhận. Nhận lời '
                || 'mời trước đã.'
           else 'Đơn xin vào gia phả của bạn còn đang chờ duyệt. Đợi được '
                || 'duyệt rồi mới đề xuất mã người được.' end);
  end if;

  -- ⚠ Mã người BẮT BUỘC — gỡ mã của chính mình không đi bằng đơn.
  v_ma := nullif(btrim(coalesce(p_person, '')), '');
  if v_ma is null then
    return jsonb_build_object('ok', false, 'loi',
      'Phải nói rõ mã người bạn tự nhận (ví dụ P0012).');
  end if;

  select count(*) into n
    from public.tree_persons tp join public.persons p on p.id = tp.person_id
   where tp.tree_id = p_tree and tp.person_id = v_ma
     and not coalesce(p.deleted, false);
  if n <> 1 then
    return jsonb_build_object('ok', false, 'loi',
      'Không có người mang mã ' || v_ma || ' trong gia phả này.');
  end if;

  if coalesce(v_tv.person_id, '') = v_ma then
    return jsonb_build_object('ok', false, 'loi',
      'Bạn đã được gắn đúng mã ' || v_ma || ' rồi, không cần đề xuất nữa.');
  end if;

  if exists (select 1 from public.tree_members
              where tree_id = p_tree and person_id = v_ma and user_id <> v_toi) then
    return jsonb_build_object('ok', false, 'loi',
      'Mã ' || v_ma || ' đã gắn cho một tài khoản khác rồi. Nói với quản trị '
      || 'gia phả nếu bạn cho rằng chỗ ấy nhầm.');
  end if;

  update public.de_xuat_gan_nguoi
     set person_id = v_ma,
         ly_do     = left(coalesce(p_ly_do, ''), 500),
         tao_luc   = now()
   where tree_id = p_tree and user_id = v_toi and trang_thai = 'cho'
  returning id into v_id;

  if v_id is null then
    insert into public.de_xuat_gan_nguoi (tree_id, user_id, person_id, ly_do)
    values (p_tree, v_toi, v_ma, left(coalesce(p_ly_do, ''), 500))
    returning id into v_id;
  else
    v_sua := true;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'maNguoi', v_ma,
                            'suaDon', v_sua);
end;
$$;

-- Cửa thứ 21, KE-HOACH chưa liệt kê: mời kèm mã người.
create or replace function public.moi_vao_cay(p_tree uuid, p_email text, p_vai text default 'xem'::text, p_ma_nguoi text default null::text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user  uuid;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_ma    text := nullif(trim(coalesce(p_ma_nguoi, '')), '');
  v_dong  public.tree_members%rowtype;
begin
  if not public.co_the_quan_tri(p_tree) then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ chủ gia phả và Quản trị hệ thống mới mời được người vào gia phả.');
  end if;

  if coalesce(p_vai, '') not in ('quan_tri', 'sua', 'xem') then
    return jsonb_build_object('ok', false, 'loi',
      'Vai mời được chỉ có: quan_tri, sua, xem.');
  end if;

  if v_email = '' then
    return jsonb_build_object('ok', false, 'loi', 'Chưa nhập email.');
  end if;

  if v_ma is not null and not exists (
       select 1 from public.tree_persons tp join public.persons p on p.id = tp.person_id
        where tp.tree_id = p_tree and tp.person_id = v_ma
          and not coalesce(p.deleted, false)) then
    return jsonb_build_object('ok', false, 'loi',
      'Không có người mang mã ' || v_ma || ' trong gia phả này.');
  end if;

  select u.id into v_user from auth.users u
   where lower(u.email::text) = v_email;

  -- ⚠ Không có máy chủ thư: nói thật là "chưa có tài khoản".
  if v_user is null then
    return jsonb_build_object('ok', false, 'loi',
      'Chưa có tài khoản nào đăng ký bằng email này. Bảo người ấy đăng ký trước, ' ||
      'rồi mời lại.');
  end if;

  if public.la_chinh_minh(v_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Không ai tự mời mình vào gia phả được. Nhờ một quản trị khác làm việc này.');
  end if;

  select * into v_dong from public.tree_members
   where tree_id = p_tree and user_id = v_user;

  if found then
    if v_dong.approved then
      return jsonb_build_object('ok', false, 'loi',
        'Tài khoản này đã có tên trong gia phả rồi.');
    end if;
    if v_dong.moi_luc is not null then
      return jsonb_build_object('ok', false, 'loi',
        'Đã mời tài khoản này rồi, đang chờ người ta nhận lời.');
    end if;
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này đang có đơn xin vào gia phả. Duyệt đơn ấy, đừng mời lại.');
  end if;

  insert into public.tree_members
         (tree_id, user_id, role, email, approved, person_id,
          moi_boi, moi_luc, moi_vai)
  values (p_tree, v_user, 'xem', v_email, false, v_ma,
          auth.uid(), now(), p_vai);

  return jsonb_build_object('ok', true, 'userId', v_user, 'email', v_email,
                            'moiVai', p_vai);
end;
$$;

-- ============================================================
-- 10. TÊN NGƯỜI trong các danh sách — nối bằng mã, không bằng cây
-- ============================================================
create or replace function public.de_xuat_gan_cua_toi(p_tree uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_cho public.de_xuat_gan_nguoi%rowtype;
  v_bo  public.de_xuat_gan_nguoi%rowtype;
begin
  if auth.uid() is null or p_tree is null then
    return jsonb_build_object('coDon', false);
  end if;

  select * into v_cho from public.de_xuat_gan_nguoi
   where tree_id = p_tree and user_id = auth.uid() and trang_thai = 'cho';

  select * into v_bo from public.de_xuat_gan_nguoi
   where tree_id = p_tree and user_id = auth.uid() and trang_thai = 'tu_choi'
   order by xet_luc desc nulls last
   limit 1;

  return jsonb_build_object(
    'coDon',   v_cho.id is not null,
    'id',      v_cho.id,
    'maNguoi', coalesce(v_cho.person_id, ''),
    'tenNguoi', coalesce((select nullif(public.ten_day_du(p.names), '')
                            from public.persons p
                           where p.id = v_cho.person_id), ''),
    'lyDo',    coalesce(v_cho.ly_do, ''),
    'taoLuc',  v_cho.tao_luc,
    'lanTuChoi', case when v_bo.id is null then null else jsonb_build_object(
                   'maNguoi', v_bo.person_id,
                   'loiXet',  coalesce(v_bo.loi_xet, ''),
                   'xetLuc',  v_bo.xet_luc) end);
end;
$$;

create or replace function public.ds_cay_cua_tai_khoan(p_user uuid)
returns table(tree_id uuid, ten text, tree_code text, vai text, approved boolean, moi_luc timestamp with time zone, moi_vai text, person_id text, ten_nguoi text, tin_cay boolean, la_chu_cay boolean, added_at timestamp with time zone)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select tm.tree_id,
         t.name,
         t.tree_code,
         tm.role,
         tm.approved,
         tm.moi_luc,
         tm.moi_vai,
         tm.person_id,
         coalesce(nullif(public.ten_day_du(p.names), ''), p.id, ''),
         tm.tin_cay,
         coalesce(t.chu_so_huu = tm.user_id, false),
         tm.added_at
    from public.tree_members tm
    join public.trees t on t.id = tm.tree_id
    left join public.persons p on p.id = tm.person_id
   where tm.user_id = p_user
     and public.la_quan_tri_he_thong()
   order by t.name;
$$;

create or replace function public.ds_de_xuat_gan(p_tree uuid)
returns table(id uuid, user_id uuid, email text, ma_ngan text, person_id text, ten_nguoi text, ly_do text, tao_luc timestamp with time zone, la_cua_toi boolean, ma_dang_co text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select d.id,
         d.user_id,
         coalesce(tm.email, u.email::text, ''),
         coalesce(tk.ma_ngan, ''),
         d.person_id,
         coalesce(nullif(public.ten_day_du(p.names), ''), d.person_id, ''),
         d.ly_do,
         d.tao_luc,
         coalesce(d.user_id = auth.uid(), false),
         -- Mã ĐANG gắn của tài khoản ấy: *gắn mới* hay *đổi mã*. Trống = chưa gắn.
         coalesce(tm.person_id, '')
    from public.de_xuat_gan_nguoi d
    join auth.users u on u.id = d.user_id
    left join public.tai_khoan tk on tk.user_id = d.user_id
    left join public.tree_members tm
           on tm.tree_id = d.tree_id and tm.user_id = d.user_id
    left join public.persons p on p.id = d.person_id
   where d.tree_id = p_tree
     and d.trang_thai = 'cho'
     and public.co_the_quan_tri(p_tree)
   order by d.tao_luc, coalesce(tm.email, u.email::text);
$$;

create or replace function public.ds_tai_khoan_he_thong()
returns table(user_id uuid, email text, ho_ten text, vai_cao_nhat text, ma_ngan text, la_quan_tri_he_thong boolean, duoc_tao_cay boolean, so_cay bigint, so_cho bigint, so_moi bigint, so_cay_lam_chu bigint, so_cay_gan bigint, nguoi_gan jsonb, tao_luc timestamp with time zone, dang_nhap_gan_nhat timestamp with time zone, da_xac_nhan_email boolean, khoa_luc timestamp with time zone, khoa_ly_do text, email_khoa_boi text, qtht_moi_luc timestamp with time zone, email_qtht_moi_boi text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u.id,
         u.email::text,
         coalesce(tk.ho_ten, ''),
         -- ⚠ VAI CAO NHẤT TRONG MỌI CÂY — dòng tóm tắt, lý do đầy đủ ở `15`.
         (case
            when exists (select 1 from public.trees t where t.chu_so_huu = u.id)
              then 'chu_cay'
            else coalesce((
              select m.role from public.tree_members m
               where m.user_id = u.id and m.approved
               order by case m.role
                          when 'quan_tri' then 1
                          when 'sua'      then 2
                          when 'xem'      then 3
                          when 'sao_luu'  then 4
                          else 5 end
               limit 1), '')
          end),
         coalesce(tk.ma_ngan, ''),
         coalesce(tk.la_quan_tri_he_thong, false),
         coalesce(tk.duoc_tao_cay, false),
         (select count(*) from public.tree_members m
           where m.user_id = u.id and m.approved),
         (select count(*) from public.tree_members m
           where m.user_id = u.id and not m.approved and m.moi_luc is null),
         (select count(*) from public.tree_members m
           where m.user_id = u.id and not m.approved and m.moi_luc is not null),
         (select count(*) from public.trees t where t.chu_so_huu = u.id),
         (select count(*) from public.tree_members m
           where m.user_id = u.id and m.approved
             and nullif(m.person_id, '') is not null),
         coalesce((
           select jsonb_agg(x order by x->>'tenCay')
             from (
               select jsonb_build_object(
                        'treeId',  m.tree_id,
                        'tenCay',  t2.name,
                        'maCay',   t2.tree_code,
                        'maNguoi', m.person_id,
                        'ten',     coalesce(nullif(public.ten_day_du(p.names), ''),
                                            m.person_id, '')
                      ) as x
                 from public.tree_members m
                 join public.trees t2 on t2.id = m.tree_id
                 left join public.persons p on p.id = m.person_id
                where m.user_id = u.id and m.approved
                  and nullif(m.person_id, '') is not null
                order by t2.name
                limit 3
             ) q
         ), '[]'::jsonb),
         u.created_at,
         u.last_sign_in_at,
         (u.email_confirmed_at is not null),
         tk.khoa_luc,
         coalesce(tk.khoa_ly_do, ''),
         coalesce(uk.email::text, ''),
         tk.qtht_moi_luc,
         coalesce(um.email::text, '')
    from auth.users u
    left join public.tai_khoan tk on tk.user_id = u.id
    left join auth.users uk on uk.id = tk.khoa_boi
    left join auth.users um on um.id = tk.qtht_moi_boi
   where public.la_quan_tri_he_thong()
   order by u.created_at;
$$;

create or replace function public.ds_thanh_vien(p_tree uuid)
returns table(user_id uuid, email text, ma_ngan text, vai text, approved boolean, person_id text, ten_nguoi text, tin_cay boolean, la_chu_cay boolean, xin_luc timestamp with time zone, loi_nhan text, added_at timestamp with time zone, moi_luc timestamp with time zone, moi_vai text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select tm.user_id,
         tm.email,
         coalesce(tk.ma_ngan, ''),
         tm.role,
         tm.approved,
         tm.person_id,
         coalesce(nullif(public.ten_day_du(p.names), ''), p.id, ''),
         tm.tin_cay,
         coalesce(t.chu_so_huu = tm.user_id, false),
         tm.xin_luc,
         tm.loi_nhan,
         tm.added_at,
         -- ⚠ Phân biệt lời mời bằng `moi_luc`, KHÔNG bằng `moi_boi` (`14` mục 1).
         tm.moi_luc,
         coalesce(tm.moi_vai, '')
    from public.tree_members tm
    join public.trees t         on t.id  = tm.tree_id
    left join public.tai_khoan tk on tk.user_id = tm.user_id
    left join public.persons  p on p.id = tm.person_id
   where tm.tree_id = p_tree
     and public.co_the_kiem_duyet(p_tree)
   order by (t.chu_so_huu = tm.user_id) desc nulls last,
            tm.approved, tm.role, tm.email;
$$;

create or replace function public.tim_nguoi_trong_cay(p_tree uuid, p_chuoi text)
returns table(id text, ten text, nam_sinh text, nam_mat text, gioi text, gan_cho_email text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with tim as (
    select public.bo_dau(btrim(coalesce(p_chuoi, ''))) as chuoi
  ),
  tach as (
    select chuoi,
           regexp_split_to_array(chuoi, '\s+') as tu
      from tim
  )
  select p.id,
         coalesce(nullif(public.ten_day_du(p.names), ''), p.id),
         coalesce(
           left(nullif(p.birth->>'iso', ''), 4),
           substring(coalesce(p.birth->>'raw', '') from '\d{4}'),
           ''
         ),
         coalesce(
           left(nullif(p.death->>'iso', ''), 4),
           substring(coalesce(p.death->>'raw', '') from '\d{4}'),
           ''
         ),
         p.sex,
         coalesce(tm.email, '')
    from public.tree_persons tp
    join public.persons p on p.id = tp.person_id
    cross join tach
    left join public.tree_members tm
           on tm.tree_id = p_tree and tm.person_id = p.id
   where tp.tree_id = p_tree
     and not p.deleted
     and public.co_the_quan_tri(p_tree)
     and length(tach.chuoi) >= 2
     and (
       select bool_and(
                position(w in public.bo_dau(
                  public.ten_day_du(p.names) || ' ' || p.id
                )) > 0
              )
         from unnest(tach.tu) as w
       )
   order by
     case
       when lower(p.id) = tach.chuoi then 0
       when left(public.bo_dau(public.ten_day_du(p.names)),
                 length(tach.chuoi)) = tach.chuoi then 1
       else 2
     end,
     coalesce(nullif(public.ten_day_du(p.names), ''), p.id)
   limit 10;
$$;

create or replace function public.tim_tai_khoan(p_tree uuid, p_chuoi text)
returns table(user_id uuid, email text, ho_ten text, ma_ngan text, person_id text, ten_nguoi text, trang_thai text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with tim as (
    select public.bo_dau(btrim(coalesce(p_chuoi, ''))) as chuoi
  ),
  tach as (
    select chuoi,
           regexp_split_to_array(chuoi, '\s+') as tu
      from tim
  )
  select tk.user_id,
         u.email::text,
         tk.ho_ten,
         tk.ma_ngan,
         tm.person_id,
         coalesce(nullif(public.ten_day_du(p.names), ''), p.id),
         case when tk.user_id = auth.uid()   then 'chinh_minh'
              when tm.user_id is null        then 'chua'
              when tm.approved               then 'thanh_vien'
              when tm.moi_luc is not null    then 'da_moi'
              else                                'cho_duyet' end
    from public.tai_khoan tk
    join auth.users u on u.id = tk.user_id
    cross join tach
    left join public.tree_members tm
           on tm.tree_id = p_tree and tm.user_id = tk.user_id
    left join public.persons p on p.id = tm.person_id
   where public.co_the_quan_tri(p_tree)
     and length(tach.chuoi) >= 2
     and (
       select bool_and(
                position(w in public.bo_dau(tk.ho_ten || ' ' || u.email::text)) > 0
              )
         from unnest(tach.tu) as w
       )
   order by
     case
       when public.bo_dau(u.email::text) = tach.chuoi then 0
       when left(public.bo_dau(u.email::text), length(tach.chuoi)) = tach.chuoi then 1
       when left(public.bo_dau(tk.ho_ten),     length(tach.chuoi)) = tach.chuoi then 1
       else 2
     end,
     coalesce(nullif(tk.ho_ten, ''), u.email::text)
   limit 8;
$$;

commit;

-- ============================================================
-- 11. BẢNG TỰ KIỂM — đọc sau khi dán, mọi dòng phải ĐẠT
-- ============================================================
-- ⚠ Chỉ hỏi HÌNH DẠNG. Hành vi (thuộc cây · ghi đè xuyên cây · hoàn tác ·
--   gọi đủ 20 hàm không lỗi cột) đo bằng `do-b122.mjs`.
select ten_kiem as "Kiểm", ket_qua as "Kết quả"
from (
  select 1 as stt, 'Đã dán 26 trước (tree_persons có mặt)' as ten_kiem,
    case when to_regclass('public.tree_persons') is not null
         then 'ĐẠT' else 'HỎNG — dán 26 trước' end as ket_qua
  union all
  select 2, 'luu_cay đặt revision ở đủ 4 bảng',
    case when (select array_length(regexp_split_to_array(prosrc, 'revision = excluded\.revision;'), 1) - 1
                 from pg_proc where oid = 'public.luu_cay(uuid, integer, jsonb, jsonb)'::regprocedure) = 4
         then 'ĐẠT' else 'HỎNG — chống ghi đè vô hiệu' end
  union all
  select 3, 'tu_choi_thay_doi hỏi doi_ma_toan_cuc + số bản ghi',
    case when (select prosrc ~ 'doi_ma_toan_cuc' and prosrc ~ 'ban_ghi_lech_so'
                 from pg_proc where oid = 'public.tu_choi_thay_doi(uuid, bigint, text)'::regprocedure)
         then 'ĐẠT' else 'HỎNG — hoàn tác dán mã cũ' end
  union all
  select 4, 'anon KHÔNG gọi được doc_cay · ds_nguoi_mo_coi',
    case when not has_function_privilege('anon', 'public.doc_cay(uuid)', 'execute')
          and not has_function_privilege('anon', 'public.ds_nguoi_mo_coi()', 'execute')
         then 'ĐẠT' else 'HỎNG — chưa revoke' end
  union all
  select 5, 'authenticated KHÔNG gọi thẳng hai hàm nền',
    case when not has_function_privilege('authenticated', 'public.ds_hon_nhan_cua_cay(uuid)', 'execute')
          and not has_function_privilege('authenticated', 'public.ban_ghi_lech_so(jsonb)', 'execute')
         then 'ĐẠT' else 'HỎNG — chưa revoke' end
  union all
  select 6, 'Không hàm nào còn nối bảng người bằng tree_id',
    case when not exists (
           select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public'
              and p.prosrc ~ '\m(p|cu|px|un|uc|c2)\.tree_id\M'
              and p.proname in ('luu_cay','tu_choi_thay_doi','pham_vi_sua','chi_tiet_kiem_duyet',
                'ds_gia_pha','dem_du_lieu','don_thung_rac','xin_xoa_cay','duyet_thanh_vien',
                'gan_nguoi_cho_thanh_vien','ds_thanh_vien','ds_tai_khoan_he_thong',
                'ds_cay_cua_tai_khoan','tim_tai_khoan','tim_nguoi_trong_cay','nop_de_xuat_gan',
                'ds_de_xuat_gan','de_xuat_gan_cua_toi','moi_vao_cay'))
         then 'ĐẠT' else 'HỎNG — còn hàm hỏi tree_id' end
) t order by stt;
