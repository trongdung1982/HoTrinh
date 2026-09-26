-- ============================================================
-- giapha-supabase · luoc-do/35-de-xuat-gan-tai-khoan.sql
-- Vai trò  : b126b — ĐỔI BÊN GHI của "gắn người về Hồ sơ cá nhân". `34`
--            (b126a) đã đổi bên ĐỌC (`nguoi_gan()` đọc `tai_khoan.person_id`);
--            file này đổi đơn `de_xuat_gan_nguoi` (bỏ `tree_id` — đơn là của
--            TÀI KHOẢN, không của một cây) và hàm ghi (`gan_nguoi_tai_khoan`,
--            gác bằng QTHT, không còn chủ cây).
-- Chạy ở   : Supabase → SQL Editor. Chạy NGAY SAU `34`, ⚠⚠ CÙNG BUỔI, không
--            để hai file cách nhau một lần dán khác — xem cảnh báo đầu `34`.
-- Phiên bản: 0.1.0 · Cập nhật: 26/09/2026 (b126b)
-- Thiết kế : THIET-KE-NHIEU-CAY.md mục 6, khối "GẮN NGƯỜI và DÒNG HỌ" (23/09)
-- Sổ tay   : so-tay/phan-quyen.md · so-tay/luu-du-lieu.md
-- ============================================================
--
-- ═══ ⚠⚠ MỘT QUYẾT ĐỊNH RÚT LẠI, NÓI THẲNG ═══
--
-- `29` (b124c, 21/09) nới luật tự duyệt: chủ cây/`quan_tri` của CHÍNH cây ấy
-- tự duyệt đơn gắn mã cho mình được, vì họ đã sửa được toàn cây đó — tự duyệt
-- không mở thêm quyền. Lý lẽ ấy đứng trên một điều: đơn CŨ chỉ có hiệu lực ở
-- MỘT cây. Đơn MỚI (file này) có hiệu lực ở TOÀN PHẦN MỀM — gắn cho mình một
-- mã người là mở `pham_vi_sua()` ở MỌI cây mình đang và sẽ tham gia, không
-- riêng cây họ đang là chủ. Lý lẽ của `29` không dịch sang được cửa mới, và
-- mục 6 (23/09, chốt SAU `29`) chỉ nói "QTHT duyệt" — không có ngoại lệ.
-- **File này KHÔNG mang theo ngoại lệ ấy**: cửa mới đòi chữ ký thứ hai của
-- một QTHT KHÁC trong MỌI trường hợp, không có nhánh nào bỏ qua.
-- `la_quan_tri_cay()` (`29`) vẫn còn cho cửa CŨ (`gan_nguoi_cho_thanh_vien`,
-- chưa xoá — xem cuối file), chỉ cửa MỚI này không dùng tới nó.
-- ⚠ Đây là suy luận từ đúng câu chủ dự án đã chốt, KHÔNG PHẢI việc tôi tự
--   quyết — nhưng là một đổi hành vi thật, báo lại trong lời chốt phiên.
--
-- ═══ VÌ SAO BỎ ĐƯỢC PHÉP "CHƯA NHẬN LỜI MỜI" (b110c) MÀ KHÔNG MỞ LẠI LỖ ═══
--
-- Cửa cũ giữ phép ấy vì nó ghi THẲNG vào `tree_members.person_id` — cột mà
-- `co_the_sua()` đọc ngay khi ghi xong. Cửa mới ghi vào `tai_khoan.person_id`,
-- một cột KHÔNG cây nào đọc trực tiếp: `nguoi_gan(p_tree)` (`34`) còn đòi
-- `tree_members.approved = true` ở ĐÚNG cây ấy trước khi trả về mã. Nên gắn
-- mã cho một tài khoản mới được MỜI, chưa nhận, chưa `approved` ở đâu cả thì
-- vẫn chưa mở được `pham_vi_sua()` ở cây nào — hàng rào cũ đứng nguyên, chỉ
-- đứng ở CHỖ KHÁC. Đo: `do-b126b.mjs` mục K.
--
-- ═══ KHÔNG CÒN ĐÒI "PHẢI CÓ CHÂN TRONG CÂY NÀY TRƯỚC" ═══
--
-- Cửa cũ (`nop_de_xuat_gan`) đòi người nộp đã là thành viên ĐÃ DUYỆT của
-- CHÍNH cây họ đang nộp — hợp lý khi đơn chỉ có nghĩa ở cây ấy. Đơn mới không
-- còn gắn với một cây, và mục 6 (17/09) đã chốt: "người không thuộc cây nào
-- là trạng thái hợp lệ". Bỏ điều kiện ấy, không thay bằng điều kiện khác.

begin;

-- ============================================================
-- 1. BẢNG ĐƠN — BỎ tree_id
-- ============================================================
-- ⚠ Xoá cột kéo theo xoá luôn chỉ mục cũ (nó đánh trên cột này). Chỉ mục mới
--   chỉ còn `user_id` — MỘT tài khoản, MỘT đơn đang chờ, không cần biết cây.
alter table public.de_xuat_gan_nguoi drop column if exists tree_id;

comment on table public.de_xuat_gan_nguoi is
  'Đơn một TÀI KHOẢN tự nộp: "tôi chính là người mang mã này" — TOÀN PHẦN '
  'MỀM, không theo cây (b126b). Một Quản trị hệ thống KHÁC xét.';

create unique index if not exists de_xuat_gan_mot_don_cho
  on public.de_xuat_gan_nguoi (user_id)
  where trang_thai = 'cho';

-- ============================================================
-- 2. NỘP ĐƠN — nop_de_xuat_gan(p_person, p_ly_do)
-- ============================================================
-- ⚠ Bỏ tham số `p_tree` — bỏ luôn phép "đã có chân trong cây ấy" (xem đầu
--   file). Vẫn giữ: không tham số `p_user` (đơn luôn của `auth.uid()`); nộp
--   lần hai là SỬA đơn đang chờ; mọi so vai/cờ qua `coalesce`.
drop function if exists public.nop_de_xuat_gan(uuid, text, text);

create or replace function public.nop_de_xuat_gan(
  p_person text,
  p_ly_do  text default ''
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_toi  uuid := auth.uid();
  v_ma   text;
  v_id   uuid;
  v_sua  boolean := false;
  v_hien text;
  n      integer;
begin
  if v_toi is null then
    return jsonb_build_object('ok', false, 'loi',
      'Chưa đăng nhập nên chưa nộp đơn được.');
  end if;

  v_ma := nullif(btrim(coalesce(p_person, '')), '');
  if v_ma is null then
    return jsonb_build_object('ok', false, 'loi',
      'Phải nói rõ mã người bạn tự nhận (ví dụ P0012).');
  end if;

  select count(*) into n from public.persons
   where id = v_ma and not coalesce(deleted, false);
  if n <> 1 then
    return jsonb_build_object('ok', false, 'loi',
      'Không có người mang mã ' || v_ma || ' trong phần mềm.');
  end if;

  select person_id into v_hien from public.tai_khoan where user_id = v_toi;
  if coalesce(v_hien, '') = v_ma then
    return jsonb_build_object('ok', false, 'loi',
      'Bạn đã được gắn đúng mã ' || v_ma || ' rồi, không cần đề xuất nữa.');
  end if;

  -- Nói sớm cho người nộp; hàng rào thật vẫn là chỉ mục
  -- `tai_khoan_mot_nguoi_mot_tk` (`34`) + câu bắt `unique_violation` trong
  -- `gan_nguoi_tai_khoan()`.
  if exists (select 1 from public.tai_khoan
              where person_id = v_ma and user_id <> v_toi) then
    return jsonb_build_object('ok', false, 'loi',
      'Mã ' || v_ma || ' đã gắn cho một tài khoản khác rồi. Nói với Quản trị '
      || 'hệ thống nếu bạn cho rằng chỗ ấy nhầm.');
  end if;

  update public.de_xuat_gan_nguoi
     set person_id = v_ma,
         ly_do     = left(coalesce(p_ly_do, ''), 500),
         tao_luc   = now()
   where user_id = v_toi and trang_thai = 'cho'
  returning id into v_id;

  if v_id is null then
    insert into public.de_xuat_gan_nguoi (user_id, person_id, ly_do)
    values (v_toi, v_ma, left(coalesce(p_ly_do, ''), 500))
    returning id into v_id;
  else
    v_sua := true;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'maNguoi', v_ma,
                            'suaDon', v_sua);
end;
$$;

-- ============================================================
-- 3. NGƯỜI XÉT NHÌN THẤY GÌ — ds_de_xuat_gan() KHÔNG THAM SỐ
-- ============================================================
-- Không còn "đơn của cây nào" — QTHT xem TẤT CẢ đơn đang chờ của toàn phần
-- mềm. Gác bằng `la_quan_tri_he_thong()` thẳng, không qua `co_the_quan_tri()`
-- (hàm đó còn nhận cả chủ cây — không còn nghĩa ở cửa toàn cục này).
drop function if exists public.ds_de_xuat_gan(uuid);

create or replace function public.ds_de_xuat_gan()
returns table (
  id         uuid,
  user_id    uuid,
  email      text,
  ma_ngan    text,
  person_id  text,
  ten_nguoi  text,
  ly_do      text,
  tao_luc    timestamptz,
  la_cua_toi boolean,
  ma_dang_co text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select d.id,
         d.user_id,
         coalesce(u.email::text, ''),
         coalesce(tk.ma_ngan, ''),
         d.person_id,
         coalesce(nullif(public.ten_day_du(p.names), ''), d.person_id, ''),
         d.ly_do,
         d.tao_luc,
         coalesce(d.user_id = auth.uid(), false),
         -- Mã ĐANG gắn của tài khoản ấy (cấp toàn phần mềm nay): *gắn mới* hay
         -- *đổi mã*. Trống = chưa gắn.
         coalesce(tk.person_id, '')
    from public.de_xuat_gan_nguoi d
    join auth.users u on u.id = d.user_id
    left join public.tai_khoan tk on tk.user_id = d.user_id
    left join public.persons p on p.id = d.person_id
   where d.trang_thai = 'cho'
     and public.la_quan_tri_he_thong()
   order by d.tao_luc, u.email::text;
$$;

-- ============================================================
-- 4. NGƯỜI NỘP NHÌN THẤY GÌ — de_xuat_gan_cua_toi() KHÔNG THAM SỐ
-- ============================================================
drop function if exists public.de_xuat_gan_cua_toi(uuid);

create or replace function public.de_xuat_gan_cua_toi()
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
  if auth.uid() is null then
    return jsonb_build_object('coDon', false);
  end if;

  select * into v_cho from public.de_xuat_gan_nguoi
   where user_id = auth.uid() and trang_thai = 'cho';

  select * into v_bo from public.de_xuat_gan_nguoi
   where user_id = auth.uid() and trang_thai = 'tu_choi'
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

-- ============================================================
-- 5. GẮN — gan_nguoi_tai_khoan(p_user, p_person) — CỬA GHI MỚI
-- ============================================================
-- Thay `gan_nguoi_cho_thanh_vien()` CHO VIỆC NÀY. Cửa cũ KHÔNG xoá (còn phục
-- vụ hoàn tác/tương thích cho tới b126d) nhưng KHÔNG còn được `duyet_de_xuat_
-- gan()` gọi — xem mục 6.
create or replace function public.gan_nguoi_tai_khoan(
  p_user   uuid,
  p_person text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ma text;
  n    integer;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới gắn được mã người cho tài khoản.');
  end if;

  -- ⚠⚠ KHÔNG NGOẠI LỆ — xem khối đầu file. Gắn là chuyện TOÀN PHẦN MỀM.
  if public.la_chinh_minh(p_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Không ai tự gắn mã người cho chính mình được — gắn là mở quyền sửa ra '
      || 'mọi cây mình có mặt. Nhờ một Quản trị hệ thống khác làm việc này.');
  end if;

  v_ma := nullif(btrim(coalesce(p_person, '')), '');

  if v_ma is not null then
    select count(*) into n from public.persons
     where id = v_ma and not coalesce(deleted, false);
    if n <> 1 then
      return jsonb_build_object('ok', false, 'loi',
        'Không có người mang mã ' || v_ma || ' trong phần mềm.');
    end if;
  end if;

  update public.tai_khoan
     set person_id = v_ma
   where user_id = p_user;

  if not found then
    return jsonb_build_object('ok', false, 'loi', 'Không có tài khoản này.');
  end if;

  return jsonb_build_object('ok', true, 'maNguoi', v_ma);

exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'loi',
      'Mã ' || v_ma || ' đã gắn cho một tài khoản khác rồi. Gỡ bên đó trước.');
end;
$$;

-- ============================================================
-- 6. DUYỆT / TỪ CHỐI — đi qua cửa GHI mới, không còn ngoại lệ tự duyệt
-- ============================================================
create or replace function public.duyet_de_xuat_gan(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_don public.de_xuat_gan_nguoi%rowtype;
  v_kq  jsonb;
begin
  select * into v_don from public.de_xuat_gan_nguoi where id = p_id;

  if not found then
    return jsonb_build_object('ok', false, 'loi', 'Không có đơn này.');
  end if;

  if v_don.trang_thai <> 'cho' then
    return jsonb_build_object('ok', false, 'loi',
      'Đơn này đã được xét rồi (' ||
      case v_don.trang_thai when 'duyet' then 'đã duyệt'
                            else 'đã từ chối' end || ').');
  end if;

  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới xét được đơn này.');
  end if;

  -- ⚠⚠ KHÔNG NGOẠI LỆ (xem khối đầu file) — khác `29`.
  if public.la_chinh_minh(v_don.user_id) then
    return jsonb_build_object('ok', false, 'loi',
      'Đây là đơn của chính bạn — không ai tự duyệt đơn của mình được. Nhờ '
      || 'một Quản trị hệ thống khác bấm giúp.');
  end if;

  v_kq := public.gan_nguoi_tai_khoan(v_don.user_id, v_don.person_id);

  if not coalesce((v_kq ->> 'ok')::boolean, false) then
    return jsonb_build_object('ok', false, 'loi',
      coalesce(v_kq ->> 'loi', 'Không gắn được mã người.'));
  end if;

  update public.de_xuat_gan_nguoi
     set trang_thai = 'duyet', xet_boi = auth.uid(), xet_luc = now()
   where id = p_id;

  return jsonb_build_object('ok', true, 'maNguoi', v_don.person_id,
                            'nguoiNop', v_don.user_id);
end;
$$;

create or replace function public.tu_choi_de_xuat_gan(p_id uuid, p_ly_do text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_don public.de_xuat_gan_nguoi%rowtype;
  v_ly  text;
begin
  select * into v_don from public.de_xuat_gan_nguoi where id = p_id;

  if not found then
    return jsonb_build_object('ok', false, 'loi', 'Không có đơn này.');
  end if;

  if v_don.trang_thai <> 'cho' then
    return jsonb_build_object('ok', false, 'loi', 'Đơn này đã được xét rồi.');
  end if;

  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới xét được đơn này.');
  end if;

  if public.la_chinh_minh(v_don.user_id) then
    return jsonb_build_object('ok', false, 'loi',
      'Đây là đơn của chính bạn. Muốn thôi thì tự rút đơn về, không phải tự '
      || 'từ chối mình.');
  end if;

  v_ly := nullif(btrim(coalesce(p_ly_do, '')), '');
  if v_ly is null then
    return jsonb_build_object('ok', false, 'loi',
      'Phải ghi lý do từ chối — người nộp đọc đúng câu ấy để biết nên sửa gì.');
  end if;

  update public.de_xuat_gan_nguoi
     set trang_thai = 'tu_choi', xet_boi = auth.uid(), xet_luc = now(),
         loi_xet = left(v_ly, 500)
   where id = p_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- 7. QUYỀN GỌI
-- ============================================================
revoke all on function public.nop_de_xuat_gan(text, text)        from public, anon;
revoke all on function public.ds_de_xuat_gan()                   from public, anon;
revoke all on function public.de_xuat_gan_cua_toi()               from public, anon;
revoke all on function public.gan_nguoi_tai_khoan(uuid, text)     from public, anon;
revoke all on function public.duyet_de_xuat_gan(uuid)             from public, anon;
revoke all on function public.tu_choi_de_xuat_gan(uuid, text)     from public, anon;

grant execute on function public.nop_de_xuat_gan(text, text)      to authenticated;
grant execute on function public.ds_de_xuat_gan()                 to authenticated;
grant execute on function public.de_xuat_gan_cua_toi()             to authenticated;
grant execute on function public.gan_nguoi_tai_khoan(uuid, text)   to authenticated;
grant execute on function public.duyet_de_xuat_gan(uuid)           to authenticated;
grant execute on function public.tu_choi_de_xuat_gan(uuid, text)   to authenticated;

commit;

-- ============================================================
-- 8. TỰ KIỂM — hỏi HÌNH DẠNG. Hành vi thì bàn thử hỏi (do-b126b.mjs)
-- ============================================================
select 'PHÉP 1 · de_xuat_gan_nguoi KHÔNG còn cột tree_id: ' ||
  case when not exists (select 1 from information_schema.columns
                         where table_schema = 'public' and table_name = 'de_xuat_gan_nguoi'
                           and column_name = 'tree_id')
       then 'ĐẠT' else 'HỎNG' end as tu_kiem
union all
select 'PHÉP 2 · chỉ mục "một tài khoản một đơn chờ" (không theo cây): ' ||
  case when exists (select 1 from pg_indexes
                     where schemaname = 'public' and indexname = 'de_xuat_gan_mot_don_cho'
                       and indexdef not ilike '%tree_id%')
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 3 · gan_nguoi_tai_khoan() gác bằng la_quan_tri_he_thong, KHÔNG co_the_quan_tri: ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'gan_nguoi_tai_khoan')
            ilike '%la_quan_tri_he_thong%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'gan_nguoi_tai_khoan')
            not ilike '%co_the_quan_tri%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 4 · gan_nguoi_tai_khoan() KHÔNG có ngoại lệ la_quan_tri_cay: ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'gan_nguoi_tai_khoan')
            not ilike '%la_quan_tri_cay%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 5 · duyet_de_xuat_gan() gọi gan_nguoi_tai_khoan(), không còn gọi gan_nguoi_cho_thanh_vien: ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'duyet_de_xuat_gan')
            ilike '%gan_nguoi_tai_khoan%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'duyet_de_xuat_gan')
            not ilike '%gan_nguoi_cho_thanh_vien%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 6 · duyet_de_xuat_gan()/tu_choi_de_xuat_gan() vẫn chặn la_chinh_minh: ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'duyet_de_xuat_gan') ilike '%la_chinh_minh%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'tu_choi_de_xuat_gan') ilike '%la_chinh_minh%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 7 · anon KHÔNG gọi được sáu hàm: ' ||
  case when not (has_function_privilege('anon', 'public.nop_de_xuat_gan(text, text)', 'execute')
             or has_function_privilege('anon', 'public.ds_de_xuat_gan()', 'execute')
             or has_function_privilege('anon', 'public.de_xuat_gan_cua_toi()', 'execute')
             or has_function_privilege('anon', 'public.gan_nguoi_tai_khoan(uuid, text)', 'execute')
             or has_function_privilege('anon', 'public.duyet_de_xuat_gan(uuid)', 'execute')
             or has_function_privilege('anon', 'public.tu_choi_de_xuat_gan(uuid, text)', 'execute'))
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 8 · authenticated gọi được cả sáu: ' ||
  case when has_function_privilege('authenticated', 'public.nop_de_xuat_gan(text, text)', 'execute')
        and has_function_privilege('authenticated', 'public.ds_de_xuat_gan()', 'execute')
        and has_function_privilege('authenticated', 'public.de_xuat_gan_cua_toi()', 'execute')
        and has_function_privilege('authenticated', 'public.gan_nguoi_tai_khoan(uuid, text)', 'execute')
        and has_function_privilege('authenticated', 'public.duyet_de_xuat_gan(uuid)', 'execute')
        and has_function_privilege('authenticated', 'public.tu_choi_de_xuat_gan(uuid, text)', 'execute')
       then 'ĐẠT' else 'HỎNG' end;
