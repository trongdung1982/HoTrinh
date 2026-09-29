-- ============================================================
-- giapha-supabase · luoc-do/62-thoi-doc-tm-person.sql
-- Vai trò  : b162a — không hàm nào còn ĐỌC hay GHI `tree_members.person_id`
--            (cột chết từ b126: gắn tài khoản ↔ người nằm ở
--            `tai_khoan.person_id`, là chuyện của TÀI KHOẢN, không của cây).
--              1. `tim_tai_khoan()` — khuôn b132: `tai_khoan` → `tree_persons`.
--              2. `tim_nguoi_trong_cay()` — "đã gắn cho …" đọc `tai_khoan`.
--              3. `moi_vao_cay()` — thôi ghi mã người vào dòng mời.
--              4. `duyet_thanh_vien()` — thôi ghi; kèm mã thì TỪ CHỐI (trước
--                 đây nhận mã, ghi vào cột chết, báo "xong" — không gắn gì).
--              5. `gan_nguoi_cho_thanh_vien()` — BỎ. Không mã nào gọi; cửa gắn
--                 thật là `gan_nguoi_tai_khoan()` (`36`) · `gan_thang_tai_khoan()`
--                 · `duyet_de_xuat_gan()` (`39`).
--              6. `tu_choi_thay_doi()` · `gop_hai_nguoi()` — VÁ TẠI CHỖ như `52`.
-- Cần có   : `52` (hai hàm dài đã có `contact`) · `39` (`gan_thang_tai_khoan`).
-- ⚠ Chuỗi dán lại: dán lại `14`/`15`/`18`/`27`/`28`/`29`/`32`/`48`/`52` thì
--   PHẢI dán lại file này — không thì hàm ấy đọc/ghi lại cột chết, im lặng.
-- ⚠ Hai hàm dài: đọc bản ĐANG CHẠY, thay đúng MỘT chỗ neo. Neo khớp ≠ 1 lần
--   thì DỪNG, cả file lùi. Đã vá (có dấu `b162a`) thì bỏ qua — dán lại được.
-- ⚠ `create or replace` không đổi cột trả về → giữ `grant`, không `drop`.
-- JS      : `trang-cay.js` `hoiDuyetDon()` bỏ ô mã người.
-- Đo      : ../kiem-thu/ban-thu-sql/do-b162a.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 30/09/2026 (b162a)
-- ============================================================

begin;

do $$
begin
  if to_regprocedure('public.gan_thang_tai_khoan(uuid, text)') is null then
    raise exception 'DỪNG: chưa dán 39-de-xuat-gan-ho.sql.';
  end if;
  if (select prosrc from pg_proc where oid = 'public.gop_hai_nguoi(text, text, uuid)'::regprocedure)
     not like '%contact%' then
    raise exception 'DỪNG: chưa dán 52-lien-he-muoi-nhom.sql.';
  end if;
end $$;

-- ------------------------------------------------------------
-- 1. tim_tai_khoan — mã người đọc `tai_khoan`, chỉ khi người ấy thuộc cây này
-- ------------------------------------------------------------
create or replace function public.tim_tai_khoan(p_tree uuid, p_chuoi text)
returns table(user_id uuid, email text, ho_ten text, ma_ngan text,
              person_id text, ten_nguoi text, trang_thai text)
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
         tp.person_id,
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
    left join public.tree_persons tp
           on tp.person_id = tk.person_id and tp.tree_id = p_tree
    left join public.persons p on p.id = tp.person_id
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

-- ------------------------------------------------------------
-- 2. tim_nguoi_trong_cay — "đã gắn cho …" = tài khoản đang giữ người ấy
-- ------------------------------------------------------------
-- Gắn là toàn phần mềm: người đã có tài khoản giữ thì KHÔNG gắn thêm được,
-- dù tài khoản ấy ở cây nào — nên không lọc theo cây đang hỏi.
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
         coalesce(u.email::text, '')
    from public.tree_persons tp
    join public.persons p on p.id = tp.person_id
    cross join tach
    left join public.tai_khoan tk on tk.person_id = p.id
    left join auth.users u on u.id = tk.user_id
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

-- ------------------------------------------------------------
-- 3. moi_vao_cay — lời mời không mang mã người
-- ------------------------------------------------------------
-- Giữ tham số `p_ma_nguoi` để khỏi `drop` (mất `grant`). Trình duyệt luôn gửi
-- rỗng; ai gửi mã thì bị từ chối thành tiếng thay vì bị nuốt im lặng.
create or replace function public.moi_vao_cay(
  p_tree     uuid,
  p_email    text,
  p_vai      text default 'xem'::text,
  p_ma_nguoi text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user  uuid;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_dong  public.tree_members%rowtype;
begin
  if not public.co_the_quan_tri(p_tree) then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ chủ gia phả và Quản trị hệ thống mới mời được người vào gia phả.');
  end if;

  if nullif(trim(coalesce(p_ma_nguoi, '')), '') is not null then
    return jsonb_build_object('ok', false, 'loi',
      'Lời mời không kèm mã người nữa. Gắn tài khoản với người trong sơ đồ là '
      || 'việc của tài khoản — làm sau, ở cột Tài khoản của bảng Người.');
  end if;

  if coalesce(p_vai, '') not in ('quan_tri', 'sua', 'xem') then
    return jsonb_build_object('ok', false, 'loi',
      'Vai mời được chỉ có: quan_tri, sua, xem.');
  end if;

  if v_email = '' then
    return jsonb_build_object('ok', false, 'loi', 'Chưa nhập email.');
  end if;

  select u.id into v_user from auth.users u
   where lower(u.email::text) = v_email;

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
         (tree_id, user_id, role, email, approved,
          moi_boi, moi_luc, moi_vai)
  values (p_tree, v_user, 'xem', v_email, false,
          auth.uid(), now(), p_vai);

  return jsonb_build_object('ok', true, 'userId', v_user, 'email', v_email,
                            'moiVai', p_vai);
end;
$$;

-- ------------------------------------------------------------
-- 4. duyet_thanh_vien — duyệt đơn, KHÔNG gắn mã người
-- ------------------------------------------------------------
-- Trước b162a: nhận mã, ghi vào cột chết, trả `ok` — người duyệt tưởng đã gắn.
-- Gắn đi qua cửa của tài khoản (QTHT gắn thẳng, người khác gửi đề xuất), nơi
-- giữ luật hai chữ ký; một quản trị cây gắn ở đây là đi vòng luật ấy.
create or replace function public.duyet_thanh_vien(
  p_tree      uuid,
  p_email     text,
  p_person_id text,
  p_duyet     boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid;
begin
  if coalesce(public.vai_tro(p_tree), '') not in ('quan_tri_he_thong', 'quan_tri') then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ quản trị hệ thống hoặc quản trị viên mới duyệt được thành viên.');
  end if;

  if nullif(btrim(coalesce(p_person_id, '')), '') is not null then
    return jsonb_build_object('ok', false, 'loi',
      'Duyệt đơn không gắn mã người nữa. Duyệt để trống, rồi gắn ở cột Tài '
      || 'khoản của bảng Người — gắn là việc của tài khoản, cần hai chữ ký.');
  end if;

  select id into v_user from auth.users where lower(email) = lower(p_email);
  if v_user is null then
    return jsonb_build_object('ok', false, 'loi',
      'Không có tài khoản nào mang email ' || p_email || '.');
  end if;

  if public.la_loi_moi_cho_nhan(p_tree, v_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Đây là LỜI MỜI đang chờ chính người ấy bấm Nhận, không phải đơn xin '
      || 'vào gia phả. Không ai nhận hộ được — vào cây luôn cần hai chữ ký. '
      || 'Muốn đổi vai mời hay đổi ý thì rút lời mời rồi mời lại.');
  end if;

  update public.tree_members
     set approved = p_duyet
   where tree_id = p_tree and user_id = v_user;

  if not found then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản ' || p_email || ' chưa được thêm vào gia phả này.');
  end if;

  return jsonb_build_object('ok', true, 'email', p_email, 'approved', p_duyet);
end;
$$;

-- ------------------------------------------------------------
-- 5. gan_nguoi_cho_thanh_vien — bỏ (gắn theo CÂY, ghi cột chết, không ai gọi)
-- ------------------------------------------------------------
drop function if exists public.gan_nguoi_cho_thanh_vien(uuid, uuid, text);

-- ------------------------------------------------------------
-- 6. Vá tại chỗ hai hàm dài (khuôn `52` mục 9)
-- ------------------------------------------------------------
-- `tu_choi_thay_doi`: chặn hoàn tác khi tài khoản đang gắn người sắp bị bỏ —
--   hỏi `tai_khoan` (trước: cột chết → chặn nhầm người đã gỡ, để lọt người mới
--   gắn). Toàn phần mềm, như bản cũ: bỏ người ra khỏi sơ đồ là mất liên kết.
-- `gop_hai_nguoi`: bỏ dòng dời mã ở `tree_members` — `tai_khoan` đã được hàm
--   này dời riêng, ngay dưới.
do $$
declare
  r      record;
  v_def  text;
  v_so   integer;
begin
  for r in select * from (values
    ('public.tu_choi_thay_doi(uuid, bigint, text)'::regprocedure,
     'select tm.email into v_ngoai' || chr(10) ||
     '    from public.tree_members tm' || chr(10) ||
     '   where tm.person_id = any(v_xoa_p)',
     'select coalesce(u.email::text, tk.user_id::text) into v_ngoai  -- b162a' || chr(10) ||
     '    from public.tai_khoan tk left join auth.users u on u.id = tk.user_id' || chr(10) ||
     '   where tk.person_id = any(v_xoa_p)'),
    ('public.gop_hai_nguoi(text, text, uuid)'::regprocedure,
     'update public.tree_members   set person_id       = p_giu where person_id       = p_thua;',
     '-- b162a: liên kết tài khoản ↔ người nằm ở tai_khoan, dời ở dưới.')
  ) as v(ham, neo, thay)
  loop
    v_def := pg_get_functiondef(r.ham);
    continue when v_def like '%b162a%';
    v_so := (length(v_def) - length(replace(v_def, r.neo, ''))) / length(r.neo);
    if v_so <> 1 then
      raise exception 'DỪNG: chỗ neo của % khớp % lần (phải đúng 1) — bản đứng cuối đã đổi, sửa luoc-do/62.',
        r.ham, v_so;
    end if;
    execute replace(v_def, r.neo, r.thay);
  end loop;
end $$;

-- ------------------------------------------------------------
-- 7. Tự kiểm — không hàm nào còn nhắc `tm.person_id` / ghi cột ấy
-- ------------------------------------------------------------
select 'không hàm nào còn đọc/ghi tree_members.person_id' as phep,
  case when not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and (p.prosrc ~* 'tm\.person_id'
            or p.prosrc ~* 'update public\.tree_members\s[^;]*person_id'
            or p.prosrc ~* 'insert into public\.tree_members[^;]*person_id'))
  then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 'gan_nguoi_cho_thanh_vien đã bỏ',
  case when to_regprocedure('public.gan_nguoi_cho_thanh_vien(uuid, uuid, text)') is null
  then 'ĐẠT' else 'HỎNG' end
union all
select 'anon KHÔNG gọi được bốn hàm dựng lại',
  case when not has_function_privilege('anon', 'public.tim_tai_khoan(uuid, text)', 'execute')
        and not has_function_privilege('anon', 'public.tim_nguoi_trong_cay(uuid, text)', 'execute')
        and not has_function_privilege('anon', 'public.moi_vao_cay(uuid, text, text, text)', 'execute')
        and not has_function_privilege('anon', 'public.duyet_thanh_vien(uuid, text, text, boolean)', 'execute')
  then 'ĐẠT' else 'HỎNG' end;

commit;
