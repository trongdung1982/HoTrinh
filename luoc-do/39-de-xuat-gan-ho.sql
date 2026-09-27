-- ============================================================
-- giapha-supabase · luoc-do/39-de-xuat-gan-ho.sql
-- Vai trò  : b129c — cột *Tài khoản* của bảng Danh sách người thành chỗ gắn/gỡ
--            liên kết tài khoản ↔ người, theo bốn hạng (chốt 27/09/2026):
--              · Quản trị hệ thống: gắn/gỡ THẲNG, có hiệu lực ngay
--              · chủ cây · quản trị cây · thành viên: gửi ĐỀ XUẤT gắn hoặc GỠ
--              · khách: khoá (màn hình không mở, hàng rào dưới cũng chặn)
--              · chính chủ tài khoản: tự gỡ liên kết của mình, không cần ai duyệt
--            Người duyệt đề xuất: Quản trị hệ thống, hoặc chính người được gắn.
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `36`. ⚠ File này THÊM hai cột vào
--            `de_xuat_gan_nguoi` (`loai`, `nop_boi`) và là bản ĐỨNG CUỐI của
--            `duyet_de_xuat_gan()` · `ds_de_xuat_gan()` · `de_xuat_gan_cua_toi()`
--            — dán lại `35`/`36` sau file này thì PHẢI dán lại `39`.
-- Sổ tay   : so-tay/phan-quyen.md · so-tay/luu-mot-dong-quan-tri.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b129c.mjs
-- Phiên bản: 0.2.0 · Cập nhật: 27/09/2026
-- ============================================================
--
-- ═══ VÌ SAO ĐƠN GỠ VẪN GHI MÃ NGƯỜI (không để `person_id` trống) ═══
--
-- `21` chốt `person_id not null` — "gỡ mã không đi bằng đơn". Chủ dự án đổi
-- 27/09: có đơn gỡ. Không nới ràng buộc cũ; thêm cột `loai` ('gan'|'go'), và
-- đơn gỡ ghi MÃ ĐANG GẮN. Lợi phụ: nếu ai lỡ dán lại `36` sau file này, bản
-- duyệt cũ gặp đơn gỡ sẽ "gắn lại đúng mã đang có" — tức không làm gì, chứ
-- không gắn nhầm người. Hỏng im lặng theo hướng VÔ HẠI, không hướng leo quyền.
--
-- ═══ KHÔNG ĐỔI LUẬT 26/09 ═══
--
-- Đề xuất GẮN vẫn đi qua đúng khe `36` (người được gắn tự duyệt khi là chủ
-- một cây + lần đầu + mã trống) hoặc một Quản trị hệ thống. Chỉ đề xuất GỠ là
-- mới: người được gắn LUÔN tự duyệt được — gỡ là rút quyền của chính mình,
-- không mở thêm gì.
--
-- ═══ LIÊN KẾT ĐÃ CÓ THÌ PHẢI GỠ TRƯỚC ═══
--
-- Nộp HỘ không được lặng lẽ chuyển một tài khoản từ người X sang người Y:
-- chặn và nói rõ X là ai, thuộc gia phả nào, để người dùng biết chỗ mà gỡ.
-- (Đơn TỰ nộp ở Hồ sơ cá nhân vẫn cho "đề xuất đổi mã" như trước — không đụng.)

begin;

do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'de_xuat_gan_nguoi'
                and column_name = 'tree_id') then
    raise exception 'DỪNG: chưa dán 35-de-xuat-gan-tai-khoan.sql (bảng đơn còn cột tree_id).';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'tu_gan_lan_dau_duoc') then
    raise exception 'DỪNG: chưa dán 36-tu-duyet-lan-dau.sql (thiếu tu_gan_lan_dau_duoc()).';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'la_quan_tri_cay') then
    raise exception 'DỪNG: chưa dán 29-tu-duyet-noi-hep.sql (thiếu la_quan_tri_cay()).';
  end if;
end $$;

-- ============================================================
-- 1. HAI CỘT MỚI
-- ============================================================
alter table public.de_xuat_gan_nguoi
  add column if not exists loai text not null default 'gan'
    constraint de_xuat_gan_nguoi_loai_chk check (loai in ('gan', 'go'));

alter table public.de_xuat_gan_nguoi
  add column if not exists nop_boi uuid references auth.users(id) on delete set null;

comment on column public.de_xuat_gan_nguoi.person_id is
  'loai=gan: mã người XIN gắn. loai=go: mã ĐANG gắn, xin gỡ ra — vẫn ghi mã, '
  'không bao giờ trống (xem đầu `39`).';
comment on column public.de_xuat_gan_nguoi.loai is
  'gan = xin gắn tài khoản với người; go = xin gỡ liên kết đang có (b129c).';
comment on column public.de_xuat_gan_nguoi.nop_boi is
  'Người nộp HỘ (b129c). Trống = chính chủ tài khoản tự nộp.';

-- ============================================================
-- 2. HAI HÀM HỎI NHỎ — nội bộ, KHÔNG cấp cho trình duyệt
-- ============================================================
-- "Tên (P0012, thuộc gia phả A · NTB, B · 123)". Không cấp quyền gọi thẳng:
-- nó đọc tên người + tên cây bất kỳ, chỉ được dùng từ trong các hàm dưới.
create or replace function public.mo_ta_lien_ket(p_person text)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(nullif(public.ten_day_du(p.names), ''), p.id) || ' (' || p.id ||
         coalesce(', thuộc gia phả ' ||
           (select string_agg(t.name || ' · ' || t.tree_code, ', ' order by t.name)
              from public.tree_persons tp
              join public.trees t on t.id = tp.tree_id
             where tp.person_id = p.id), '') || ')'
    from public.persons p
   where p.id = p_person;
$$;

-- Người gọi được NỘP ĐỀ XUẤT về người này: chủ / quản trị / thành viên
-- (`sua`, đã duyệt) của MỘT cây đang chứa người ấy. Khách (`xem`) không.
-- ⚠ Viết khẳng định + `coalesce(…, false)` — bài học lỗ `null` 04/09.
create or replace function public.duoc_nop_ho(p_person text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (not public.bi_khoa()) and exists (
      select 1 from public.tree_persons tp
       where tp.person_id = p_person
         and (public.la_quan_tri_cay(tp.tree_id, auth.uid())
              or exists (select 1 from public.tree_members tm
                          where tm.tree_id = tp.tree_id
                            and tm.user_id = auth.uid()
                            and tm.role = 'sua'
                            and tm.approved))),
    false);
$$;

revoke all on function public.mo_ta_lien_ket(text) from public, anon, authenticated;
revoke all on function public.duoc_nop_ho(text)    from public, anon, authenticated;

-- ============================================================
-- 3. ĐỀ XUẤT GẮN HỘ — de_xuat_gan_ho(p_user, p_person, p_ly_do)
-- ============================================================
create or replace function public.de_xuat_gan_ho(
  p_user   uuid,
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
  v_ma   text;
  v_id   uuid;
  v_dang text;
  v_tk   text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'loi', 'Chưa đăng nhập nên chưa nộp được.');
  end if;

  if p_user is null or not exists (select 1 from auth.users where id = p_user) then
    return jsonb_build_object('ok', false, 'loi', 'Không có tài khoản này.');
  end if;

  if public.la_chinh_minh(p_user) then
    return jsonb_build_object('ok', false, 'lyDo', 'chinhminh', 'loi',
      'Đây là tài khoản của chính bạn — tự đề xuất mã người cho mình ở Hồ sơ cá '
      || 'nhân (Tài khoản → Mã người & Dòng họ).');
  end if;

  v_ma := nullif(btrim(coalesce(p_person, '')), '');
  if v_ma is null then
    return jsonb_build_object('ok', false, 'loi', 'Phải nói rõ mã người, ví dụ P0012.');
  end if;

  if not exists (select 1 from public.persons
                  where id = v_ma and not coalesce(deleted, false)) then
    return jsonb_build_object('ok', false, 'loi',
      'Không có người mang mã ' || v_ma || ' trong phần mềm.');
  end if;

  if not public.duoc_nop_ho(v_ma) then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ chủ gia phả, quản trị gia phả hoặc thành viên của gia phả đang có người '
      || v_ma || ' mới đề xuất được.');
  end if;

  select person_id into v_dang from public.tai_khoan where user_id = p_user;
  if v_dang is not null then
    return jsonb_build_object('ok', false, 'lyDo', 'dagan', 'loi',
      'Tài khoản này đã liên kết với ' || coalesce(public.mo_ta_lien_ket(v_dang), v_dang)
      || '. Hãy gỡ liên kết đó trước khi gắn.');
  end if;

  select coalesce(u.email::text, '(không rõ email)') into v_tk
    from public.tai_khoan k join auth.users u on u.id = k.user_id
   where k.person_id = v_ma and k.user_id <> p_user
   limit 1;
  if v_tk is not null then
    return jsonb_build_object('ok', false, 'lyDo', 'nguoidagan', 'loi',
      'Người ' || coalesce(public.mo_ta_lien_ket(v_ma), v_ma) || ' đã liên kết với tài khoản '
      || v_tk || '. Hãy gỡ liên kết đó trước.');
  end if;

  if exists (select 1 from public.de_xuat_gan_nguoi
              where user_id = p_user and trang_thai = 'cho') then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này đang có một đơn chờ duyệt — đợi xét xong, hoặc để chính họ rút đơn, '
      || 'rồi hãy đề xuất lại.');
  end if;

  insert into public.de_xuat_gan_nguoi (user_id, person_id, ly_do, loai, nop_boi)
  values (p_user, v_ma, left(coalesce(p_ly_do, ''), 500), 'gan', auth.uid())
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'maNguoi', v_ma);

exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này vừa có một đơn chờ duyệt khác — tải lại rồi xem.');
end;
$$;

-- ============================================================
-- 4. ĐỀ XUẤT GỠ HỘ — de_xuat_go_ho(p_user, p_ly_do)
-- ============================================================
create or replace function public.de_xuat_go_ho(
  p_user  uuid,
  p_ly_do text default ''
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_dang text;
  v_id   uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'loi', 'Chưa đăng nhập nên chưa nộp được.');
  end if;

  if p_user is null or not exists (select 1 from auth.users where id = p_user) then
    return jsonb_build_object('ok', false, 'loi', 'Không có tài khoản này.');
  end if;

  if public.la_chinh_minh(p_user) then
    return jsonb_build_object('ok', false, 'lyDo', 'chinhminh', 'loi',
      'Đây là liên kết của chính bạn — bấm "Gỡ liên kết của tôi", không cần đề xuất.');
  end if;

  select person_id into v_dang from public.tai_khoan where user_id = p_user;
  if v_dang is null then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này chưa liên kết với ai, không có gì để gỡ.');
  end if;

  if not public.duoc_nop_ho(v_dang) then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ chủ gia phả, quản trị gia phả hoặc thành viên của gia phả đang có người '
      || v_dang || ' mới đề xuất gỡ được.');
  end if;

  if exists (select 1 from public.de_xuat_gan_nguoi
              where user_id = p_user and trang_thai = 'cho') then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này đang có một đơn chờ duyệt — đợi xét xong, hoặc để chính họ rút đơn, '
      || 'rồi hãy đề xuất lại.');
  end if;

  insert into public.de_xuat_gan_nguoi (user_id, person_id, ly_do, loai, nop_boi)
  values (p_user, v_dang, left(coalesce(p_ly_do, ''), 500), 'go', auth.uid())
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'maNguoi', v_dang);

exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này vừa có một đơn chờ duyệt khác — tải lại rồi xem.');
end;
$$;

-- ============================================================
-- 5. DUYỆT — duyet_de_xuat_gan(p_id): bản `36` + nhánh đơn GỠ + chặn chuyển
-- ============================================================
-- Chép nguyên `36` mục 3. Thêm ĐÚNG hai chỗ, đánh dấu `b129c`:
--   ① đơn `go`: chính người được gắn HOẶC QTHT; gỡ chỉ khi liên kết còn y
--      như lúc nộp, lệch thì đơn tự huỷ.
--   ② đơn `gan` nộp HỘ: tài khoản đã liên kết người khác thì không chuyển.
create or replace function public.duyet_de_xuat_gan(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_don  public.de_xuat_gan_nguoi%rowtype;
  v_kq   jsonb;
  v_dang text;
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

  -- ══ b129c ① — ĐƠN GỠ ══
  if v_don.loai = 'go' then
    if not (public.la_chinh_minh(v_don.user_id) or public.la_quan_tri_he_thong()) then
      return jsonb_build_object('ok', false, 'loi',
        'Chỉ chính người được gắn hoặc Quản trị hệ thống mới duyệt được đề xuất gỡ này.');
    end if;

    update public.tai_khoan set person_id = null
     where user_id = v_don.user_id and person_id = v_don.person_id;

    if not found then
      update public.de_xuat_gan_nguoi
         set trang_thai = 'tu_choi', xet_boi = auth.uid(), xet_luc = now(),
             loi_xet = 'Liên kết đã đổi trước khi xét — đơn gỡ này không còn đúng, tự huỷ.'
       where id = p_id;
      return jsonb_build_object('ok', false, 'loi',
        'Tài khoản không còn gắn ' || v_don.person_id || ' như lúc nộp đơn — đơn tự huỷ.');
    end if;

    update public.de_xuat_gan_nguoi
       set trang_thai = 'duyet', xet_boi = auth.uid(), xet_luc = now()
     where id = p_id;

    return jsonb_build_object('ok', true, 'loai', 'go', 'maNguoi', v_don.person_id,
                              'nguoiNop', v_don.user_id);
  end if;

  -- ⚠⚠ Tự mình (chủ cây, khe hẹp) đứng TRƯỚC, không hỏi QTHT trước — một chủ
  --    cây thường (không phải QTHT) mới với tới được khe này.
  if public.la_chinh_minh(v_don.user_id) then
    if not public.tu_gan_lan_dau_duoc(v_don.user_id, v_don.person_id) then
      return jsonb_build_object('ok', false, 'loi',
        'Đây là đơn của chính bạn. Chỉ tự duyệt được khi đây là lần gắn ĐẦU '
        || 'TIÊN của bạn và mã ấy chưa ai giữ. Nhờ một Quản trị hệ thống '
        || 'khác bấm giúp.');
    end if;
  elsif not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới xét được đơn này.');
  end if;

  -- ══ b129c ② — đơn nộp HỘ không chuyển một liên kết đang có ══
  if v_don.nop_boi is not null then
    select person_id into v_dang from public.tai_khoan where user_id = v_don.user_id;
    if v_dang is not null and v_dang <> v_don.person_id then
      return jsonb_build_object('ok', false, 'loi',
        'Tài khoản này đã liên kết với ' || coalesce(public.mo_ta_lien_ket(v_dang), v_dang)
        || '. Hãy gỡ liên kết đó trước khi gắn.');
    end if;
  end if;

  v_kq := public.gan_nguoi_tai_khoan(v_don.user_id, v_don.person_id);

  if not coalesce((v_kq ->> 'ok')::boolean, false) then
    return jsonb_build_object('ok', false, 'loi',
      coalesce(v_kq ->> 'loi', 'Không gắn được mã người.'));
  end if;

  update public.de_xuat_gan_nguoi
     set trang_thai = 'duyet', xet_boi = auth.uid(), xet_luc = now()
   where id = p_id;

  return jsonb_build_object('ok', true, 'loai', 'gan', 'maNguoi', v_don.person_id,
                            'nguoiNop', v_don.user_id);
end;
$$;

-- ============================================================
-- 6. TỰ GỠ — go_gan_tai_khoan(): chính chủ gỡ liên kết của mình, NGAY
-- ============================================================
-- ⚠ Không đi qua `gan_nguoi_tai_khoan()`: nhánh tự-mình của hàm ấy đòi
--   `tu_gan_lan_dau_duoc()`, vốn luôn `false` khi mã trống — tức chặn đúng
--   việc gỡ. Rút quyền của chính mình không cần chữ ký thứ hai.
create or replace function public.go_gan_tai_khoan()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_dang text;
  n      integer;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'loi', 'Chưa đăng nhập.');
  end if;

  select person_id into v_dang from public.tai_khoan where user_id = auth.uid();
  if v_dang is null then
    return jsonb_build_object('ok', false, 'loi', 'Bạn chưa liên kết với người nào để gỡ.');
  end if;

  update public.tai_khoan set person_id = null where user_id = auth.uid();

  -- Đơn gỡ đang chờ về chính mình thì coi như đã xong.
  update public.de_xuat_gan_nguoi
     set trang_thai = 'duyet', xet_boi = auth.uid(), xet_luc = now()
   where user_id = auth.uid() and trang_thai = 'cho' and loai = 'go';
  get diagnostics n = row_count;

  if n = 0 then
    insert into public.de_xuat_gan_nguoi
           (user_id, person_id, ly_do, loai, trang_thai, nop_boi, xet_boi, xet_luc)
    values (auth.uid(), v_dang, '(tự gỡ liên kết)', 'go', 'duyet',
            auth.uid(), auth.uid(), now());
  end if;

  return jsonb_build_object('ok', true, 'maNguoiCu', v_dang);
end;
$$;

-- ============================================================
-- 7. QUẢN TRỊ HỆ THỐNG GẮN / GỠ THẲNG — gan_thang_tai_khoan(p_user, p_person)
-- ============================================================
-- `p_person` trống = GỠ. Ghi qua `gan_nguoi_tai_khoan()` (cửa ghi DUY NHẤT,
-- nó tự hỏi lại QTHT), cộng ba việc cửa ấy không làm: chặn chuyển liên kết
-- đang có, đóng đơn chờ đã lỗi thời, và để lại một dòng sổ (trạng thái duyệt).
create or replace function public.gan_thang_tai_khoan(
  p_user   uuid,
  p_person text default null::text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_ma   text;
  v_dang text;
  v_tk   text;
  v_kq   jsonb;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới gắn/gỡ thẳng được — người khác gửi đề xuất.');
  end if;

  if p_user is null or not exists (select 1 from auth.users where id = p_user) then
    return jsonb_build_object('ok', false, 'loi', 'Không có tài khoản này.');
  end if;

  if public.la_chinh_minh(p_user) then
    return jsonb_build_object('ok', false, 'lyDo', 'chinhminh', 'loi',
      'Đây là tài khoản của chính bạn — tự đề xuất ở Hồ sơ cá nhân, hoặc bấm '
      || '"Gỡ liên kết của tôi".');
  end if;

  v_ma := nullif(btrim(coalesce(p_person, '')), '');
  select person_id into v_dang from public.tai_khoan where user_id = p_user;

  if v_ma is null then
    if v_dang is null then
      return jsonb_build_object('ok', false, 'loi', 'Tài khoản này chưa liên kết với ai.');
    end if;
  else
    if v_dang = v_ma then
      return jsonb_build_object('ok', false, 'loi',
        'Tài khoản này đã gắn đúng ' || v_ma || ' rồi.');
    end if;
    if v_dang is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'dagan', 'loi',
        'Tài khoản này đã liên kết với ' || coalesce(public.mo_ta_lien_ket(v_dang), v_dang)
        || '. Hãy gỡ liên kết đó trước khi gắn.');
    end if;
    select coalesce(u.email::text, '(không rõ email)') into v_tk
      from public.tai_khoan k join auth.users u on u.id = k.user_id
     where k.person_id = v_ma and k.user_id <> p_user
     limit 1;
    if v_tk is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'nguoidagan', 'loi',
        'Người ' || coalesce(public.mo_ta_lien_ket(v_ma), v_ma) || ' đã liên kết với tài khoản '
        || v_tk || '. Hãy gỡ liên kết đó trước.');
    end if;
  end if;

  v_kq := public.gan_nguoi_tai_khoan(p_user, v_ma);
  if not coalesce((v_kq ->> 'ok')::boolean, false) then
    return jsonb_build_object('ok', false, 'loi',
      coalesce(v_kq ->> 'loi', 'Không ghi được liên kết.'));
  end if;

  update public.de_xuat_gan_nguoi
     set trang_thai = 'tu_choi', xet_boi = auth.uid(), xet_luc = now(),
         loi_xet = 'Quản trị hệ thống đã sửa thẳng liên kết — đơn này không còn nghĩa.'
   where user_id = p_user and trang_thai = 'cho';

  insert into public.de_xuat_gan_nguoi
         (user_id, person_id, ly_do, loai, trang_thai, nop_boi, xet_boi, xet_luc)
  values (p_user, coalesce(v_ma, v_dang),
          case when v_ma is null then '(Quản trị hệ thống gỡ thẳng)'
               else '(Quản trị hệ thống gắn thẳng)' end,
          case when v_ma is null then 'go' else 'gan' end,
          'duyet', auth.uid(), auth.uid(), now());

  return jsonb_build_object('ok', true, 'maNguoi', v_ma, 'maNguoiCu', v_dang);
end;
$$;

-- ============================================================
-- 8. ĐỌC — ds_lien_ket_cay(p_tree): ai đang gắn với người nào của cây này
-- ============================================================
-- ⚠ Thay nguồn cũ của cột *Tài khoản*: `ds_thanh_vien().person_id` đọc
--   `tree_members.person_id` — cột CHẾT từ b126 — và chỉ trả cho người kiểm
--   duyệt được. Nguồn đúng là `tai_khoan.person_id`, và một tài khoản gắn với
--   người của cây này có thể KHÔNG phải thành viên cây (gắn là toàn phần mềm).
-- Mọi thành viên đã duyệt (kể cả khách) + QTHT đọc được: email chỉ lộ ra
-- trong nội bộ gia phả, không cho người lạ.
create or replace function public.ds_lien_ket_cay(p_tree uuid)
returns table (
  person_id text,
  user_id   uuid,
  email     text,
  ho_ten    text,
  ma_ngan   text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select tk.person_id, tk.user_id, coalesce(u.email::text, ''),
         coalesce(tk.ho_ten, ''), coalesce(tk.ma_ngan, '')
    from public.tai_khoan tk
    join auth.users u on u.id = tk.user_id
    join public.tree_persons tp on tp.person_id = tk.person_id and tp.tree_id = p_tree
   where tk.person_id is not null
     and public.la_thanh_vien(p_tree);
$$;

-- ============================================================
-- 9. TÌM TÀI KHOẢN ĐỂ GẮN — chỉ người đã vào cây này (khách trở lên)
-- ============================================================
-- `lien_ket` = mô tả liên kết ĐANG CÓ của tài khoản ấy (trống nếu chưa) — để
-- ô gợi ý nói trước "đã liên kết với X, thuộc gia phả Y" thay vì bấm xong
-- mới biết. Người gọi phải là QTHT hoặc chủ/quản trị/thành viên của cây.
create or replace function public.tim_tai_khoan_trong_cay(p_tree uuid, p_chuoi text)
returns table (
  user_id   uuid,
  email     text,
  ho_ten    text,
  ma_ngan   text,
  vai       text,
  person_id text,
  lien_ket  text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with tim as (
    select public.bo_dau(btrim(coalesce(p_chuoi, ''))) as chuoi
  ),
  ung as (
    select tm.user_id, tm.role as vai
      from public.tree_members tm
     where tm.tree_id = p_tree and tm.approved and tm.role <> 'sao_luu'
    union
    select t.chu_so_huu, 'chu'
      from public.trees t
     where t.id = p_tree and t.chu_so_huu is not null
  )
  select distinct on (x.user_id)
         x.user_id, coalesce(u.email::text, ''), coalesce(tk.ho_ten, ''),
         coalesce(tk.ma_ngan, ''), x.vai, tk.person_id,
         case when tk.person_id is null then ''
              else coalesce(public.mo_ta_lien_ket(tk.person_id), tk.person_id) end
    from ung x
    join auth.users u on u.id = x.user_id
    left join public.tai_khoan tk on tk.user_id = x.user_id
    cross join tim
   where length(tim.chuoi) >= 2
     and public.bo_dau(coalesce(u.email::text, '') || ' ' || coalesce(tk.ho_ten, '')
                       || ' ' || coalesce(tk.ma_ngan, '')) like '%' || tim.chuoi || '%'
     and not public.bi_khoa()
     and (public.la_quan_tri_he_thong()
          or public.la_quan_tri_cay(p_tree, auth.uid())
          or exists (select 1 from public.tree_members m
                      where m.tree_id = p_tree and m.user_id = auth.uid()
                        and m.role = 'sua' and m.approved))
   order by x.user_id
   limit 8;
$$;

-- ============================================================
-- 10. HAI HÀM ĐỌC ĐƠN — thêm `loai` + người nộp hộ
-- ============================================================
-- ds_de_xuat_gan(): đổi kiểu trả về → phải drop rồi dựng lại, chép cả grant.
drop function if exists public.ds_de_xuat_gan();

create or replace function public.ds_de_xuat_gan()
returns table (
  id            uuid,
  user_id       uuid,
  email         text,
  ma_ngan       text,
  person_id     text,
  ten_nguoi     text,
  ly_do         text,
  tao_luc       timestamptz,
  la_cua_toi    boolean,
  ma_dang_co    text,
  loai          text,
  email_nop_boi text
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
         coalesce(tk.person_id, ''),
         d.loai,
         coalesce(nb.email::text, '')
    from public.de_xuat_gan_nguoi d
    join auth.users u on u.id = d.user_id
    left join auth.users nb on nb.id = d.nop_boi
    left join public.tai_khoan tk on tk.user_id = d.user_id
    left join public.persons p on p.id = d.person_id
   where d.trang_thai = 'cho'
     and public.la_quan_tri_he_thong()
   order by d.tao_luc, u.email::text;
$$;

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
    'loai',    coalesce(v_cho.loai, 'gan'),
    'nopBoi',  coalesce((select u.email::text from auth.users u
                          where u.id = v_cho.nop_boi and v_cho.nop_boi <> auth.uid()), ''),
    'lanTuChoi', case when v_bo.id is null then null else jsonb_build_object(
                   'maNguoi', v_bo.person_id,
                   'loai',    v_bo.loai,
                   'loiXet',  coalesce(v_bo.loi_xet, ''),
                   'xetLuc',  v_bo.xet_luc) end);
end;
$$;

-- ============================================================
-- 11. QUYỀN GỌI
-- ============================================================
revoke all on function public.de_xuat_gan_ho(uuid, text, text)       from public, anon;
revoke all on function public.de_xuat_go_ho(uuid, text)              from public, anon;
revoke all on function public.duyet_de_xuat_gan(uuid)                from public, anon;
revoke all on function public.go_gan_tai_khoan()                     from public, anon;
revoke all on function public.gan_thang_tai_khoan(uuid, text)        from public, anon;
revoke all on function public.ds_lien_ket_cay(uuid)                  from public, anon;
revoke all on function public.tim_tai_khoan_trong_cay(uuid, text)    from public, anon;
revoke all on function public.ds_de_xuat_gan()                       from public, anon;
revoke all on function public.de_xuat_gan_cua_toi()                  from public, anon;

grant execute on function public.de_xuat_gan_ho(uuid, text, text)    to authenticated;
grant execute on function public.de_xuat_go_ho(uuid, text)           to authenticated;
grant execute on function public.duyet_de_xuat_gan(uuid)             to authenticated;
grant execute on function public.go_gan_tai_khoan()                  to authenticated;
grant execute on function public.gan_thang_tai_khoan(uuid, text)     to authenticated;
grant execute on function public.ds_lien_ket_cay(uuid)               to authenticated;
grant execute on function public.tim_tai_khoan_trong_cay(uuid, text) to authenticated;
grant execute on function public.ds_de_xuat_gan()                    to authenticated;
grant execute on function public.de_xuat_gan_cua_toi()               to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — hỏi HÌNH DẠNG. Hành vi (hàng rào có gác không) thì bàn thử hỏi.
-- ============================================================
select 1 as stt, 'cột de_xuat_gan_nguoi.loai + nop_boi đã có' as ten_kiem,
  case when (select count(*) from information_schema.columns
              where table_schema = 'public' and table_name = 'de_xuat_gan_nguoi'
                and column_name in ('loai', 'nop_boi')) = 2
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'duyet_de_xuat_gan() có nhánh đơn gỡ (bản 39, không phải 36)',
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'duyet_de_xuat_gan') ilike '%loai = ''go''%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'duyet_de_xuat_gan() vẫn giữ khe tu_gan_lan_dau_duoc của 36',
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'duyet_de_xuat_gan') ilike '%tu_gan_lan_dau_duoc%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'gan_thang_tai_khoan() gác bằng la_quan_tri_he_thong',
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'gan_thang_tai_khoan') ilike '%la_quan_tri_he_thong%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 5, 'anon KHÔNG gọi được bảy cửa mới/sửa',
  case when not (has_function_privilege('anon', 'public.de_xuat_gan_ho(uuid, text, text)', 'execute')
             or has_function_privilege('anon', 'public.de_xuat_go_ho(uuid, text)', 'execute')
             or has_function_privilege('anon', 'public.go_gan_tai_khoan()', 'execute')
             or has_function_privilege('anon', 'public.gan_thang_tai_khoan(uuid, text)', 'execute')
             or has_function_privilege('anon', 'public.ds_lien_ket_cay(uuid)', 'execute')
             or has_function_privilege('anon', 'public.tim_tai_khoan_trong_cay(uuid, text)', 'execute')
             or has_function_privilege('anon', 'public.ds_de_xuat_gan()', 'execute'))
       then 'ĐẠT' else 'HỎNG' end
union all
select 6, 'authenticated gọi được bảy cửa ấy',
  case when has_function_privilege('authenticated', 'public.de_xuat_gan_ho(uuid, text, text)', 'execute')
        and has_function_privilege('authenticated', 'public.de_xuat_go_ho(uuid, text)', 'execute')
        and has_function_privilege('authenticated', 'public.go_gan_tai_khoan()', 'execute')
        and has_function_privilege('authenticated', 'public.gan_thang_tai_khoan(uuid, text)', 'execute')
        and has_function_privilege('authenticated', 'public.ds_lien_ket_cay(uuid)', 'execute')
        and has_function_privilege('authenticated', 'public.tim_tai_khoan_trong_cay(uuid, text)', 'execute')
        and has_function_privilege('authenticated', 'public.ds_de_xuat_gan()', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 7, 'hai hàm hỏi nhỏ KHÔNG cấp cho trình duyệt',
  case when not (has_function_privilege('authenticated', 'public.mo_ta_lien_ket(text)', 'execute')
             or has_function_privilege('authenticated', 'public.duoc_nop_ho(text)', 'execute'))
       then 'ĐẠT' else 'HỎNG' end
order by stt;
