-- ============================================================
-- giapha-supabase · luoc-do/36-tu-duyet-lan-dau.sql
-- Vai trò  : b126b2 — chủ dự án nới lại một khe hẹp cho luật "không ngoại lệ"
--            của `35`: CHỦ CÂY (bất kỳ cây nào) tự duyệt được đơn gắn mã của
--            CHÍNH MÌNH khi và chỉ khi ①tài khoản mình CHƯA gắn ai, ②mã người
--            mình xin CHƯA tài khoản nào gắn. Đổi mã đang có, hay xin mã đã
--            có người giữ, vẫn cần chữ ký thứ hai (QTHT khác).
-- Chạy ở   : Supabase → SQL Editor. Chạy NGAY SAU `35`, ⚠⚠ CÙNG BUỔI với
--            `34`+`35` — ba file này là MỘT chuỗi, dán lại một cái phải dán
--            lại cả ba (xem `so-tay/phan-quyen.md` mục *Chuỗi dán lại*, cần
--            thêm dòng cho `34`→`35`→`36`).
-- Phiên bản: 0.1.0 · Cập nhật: 26/09/2026 (b126b2)
-- Thiết kế : chủ dự án chốt 26/09/2026, sau khi đọc lại quyết định của `35`
-- Sổ tay   : so-tay/phan-quyen.md
-- ============================================================
--
-- ═══ VÌ SAO KHE NÀY HẸP HƠN KHE CỦA `29` (b124c) ═══
--
-- `29` cho một chủ cây/`quan_tri` tự duyệt vì họ ĐÃ sửa được toàn cây đó —
-- tự duyệt không mở thêm quyền TRONG CÂY ẤY. Gắn mã nay có hiệu lực TOÀN
-- PHẦN MỀM, nên lý lẽ ấy không đủ một mình. Khe này thêm HAI điều nữa để bù:
-- claim phải là LẦN ĐẦU (không tài khoản nào đổi mã đang có bằng tự duyệt) và
-- mã ấy phải TRỐNG (không tranh chấp với ai). Cả ba điều cùng đúng thì rủi ro
-- giống với b124c: không mở thêm gì mà một QTHT xét tay cũng sẽ cho qua.
-- Đổi mã đã gắn, hay giành một mã đang có người giữ, luôn cần chữ ký thứ hai.
--
-- ═══ HAI LỚP, GIỐNG BÀI HỌC `29` ═══
--
-- `duyet_de_xuat_gan()` (cửa xét đơn) VÀ `gan_nguoi_tai_khoan()` (cửa ghi mà
-- nó gọi) đều tự chặn tự-gắn — nới một mình cửa xét thì cửa ghi vẫn chặn, và
-- nới một mình cửa ghi thì ai cũng gọi thẳng nó tự phong cho mình. Sót một
-- lớp là hỏng nửa vời, đúng câu `29` đã viết khi nới `21`+`27`.

begin;

-- ⚠ HÀNG RÀO THỨ TỰ DÁN: thiếu `35` thì dừng ngay, nói bằng tiếng Việt.
do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'gan_nguoi_tai_khoan') then
    raise exception 'DỪNG: chưa dán 35-de-xuat-gan-tai-khoan.sql. Thứ tự đúng: 34 → 35 → 36.';
  end if;
end $$;

-- ============================================================
-- 1. HAI HÀM HỎI NHỎ
-- ============================================================
create or replace function public.la_chu_cay(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(exists (select 1 from public.trees where chu_so_huu = p_user), false);
$$;

-- ⚠ Viết KHẲNG ĐỊNH + `coalesce(…, false)`: không có dòng thì `exists` vẫn ra
--   `false` (không như `select … into` một cột), nhưng bọc để không ai lỡ đổi
--   `exists` thành phép chọn cột rồi rơi vào bẫy `null`.
create or replace function public.tu_gan_lan_dau_duoc(p_user uuid, p_person text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    p_person is not null
    and public.la_chu_cay(p_user)
    -- ① tài khoản mình CHƯA gắn ai
    and not exists (select 1 from public.tai_khoan
                     where user_id = p_user and person_id is not null)
    -- ② mã người mình xin CHƯA tài khoản nào gắn
    and not exists (select 1 from public.tai_khoan where person_id = p_person),
    false);
$$;

revoke all on function public.la_chu_cay(uuid)              from public, anon;
revoke all on function public.tu_gan_lan_dau_duoc(uuid, text) from public, anon;
grant execute on function public.la_chu_cay(uuid)              to authenticated;
grant execute on function public.tu_gan_lan_dau_duoc(uuid, text) to authenticated;

-- ============================================================
-- 2. gan_nguoi_tai_khoan() — LỚP GHI, thêm khe hẹp
-- ============================================================
-- Trích nguyên văn `35` mục 5. Đổi ĐÚNG khối phép kiểm quyền: gộp
-- `la_quan_tri_he_thong()` VÀ nhánh tự-gắn-lần-đầu vào MỘT câu, tính `v_ma`
-- trước khi hỏi (khe cần biết mã đang xin).
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
  v_ma := nullif(btrim(coalesce(p_person, '')), '');

  if public.la_chinh_minh(p_user) then
    if not public.tu_gan_lan_dau_duoc(p_user, v_ma) then
      return jsonb_build_object('ok', false, 'loi',
        'Không ai tự gắn mã người cho chính mình được, trừ khi đây là lần '
        || 'gắn ĐẦU TIÊN và mã ấy chưa ai giữ. Nhờ một Quản trị hệ thống '
        || 'khác làm việc này.');
    end if;
  elsif not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới gắn được mã người cho tài khoản.');
  end if;

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
-- 3. duyet_de_xuat_gan() — CỬA XÉT, cùng khe hẹp
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

-- ⚠ `tu_choi_de_xuat_gan()` KHÔNG nới — chép nguyên từ `35`, không đổi.
--   Người muốn thôi tự rút đơn (`rut_de_xuat_gan()`), đường ấy đã có, không
--   đóng vai bởi QTHT nào cả.

-- ============================================================
-- 4. QUYỀN GỌI — create or replace giữ nguyên grant cũ của hai hàm mục 2-3
-- ============================================================
-- (grant của gan_nguoi_tai_khoan/duyet_de_xuat_gan đã có từ `35`; không lặp)

commit;

-- ============================================================
-- 5. TỰ KIỂM — hỏi HÌNH DẠNG. Hành vi thì bàn thử hỏi (do-b126b2.mjs)
-- ============================================================
select 'PHÉP 1 · la_chu_cay() tồn tại: ' ||
  case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'la_chu_cay')
       then 'ĐẠT' else 'HỎNG' end as tu_kiem
union all
select 'PHÉP 2 · tu_gan_lan_dau_duoc() đọc CẢ hai điều (tai_khoan hai lần): ' ||
  case when (select count(*) from regexp_matches(
               (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'tu_gan_lan_dau_duoc'),
               'tai_khoan', 'g')) >= 2
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 3 · gan_nguoi_tai_khoan() gọi tu_gan_lan_dau_duoc(): ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'gan_nguoi_tai_khoan')
            ilike '%tu_gan_lan_dau_duoc%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 4 · duyet_de_xuat_gan() gọi tu_gan_lan_dau_duoc(): ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'duyet_de_xuat_gan')
            ilike '%tu_gan_lan_dau_duoc%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 5 · tu_choi_de_xuat_gan() KHÔNG đổi — vẫn không biết tu_gan_lan_dau_duoc: ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'tu_choi_de_xuat_gan')
            not ilike '%tu_gan_lan_dau_duoc%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 6 · anon KHÔNG gọi được hai hàm hỏi nhỏ: ' ||
  case when not (has_function_privilege('anon', 'public.la_chu_cay(uuid)', 'execute')
             or has_function_privilege('anon', 'public.tu_gan_lan_dau_duoc(uuid, text)', 'execute'))
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 7 · authenticated gọi được: ' ||
  case when has_function_privilege('authenticated', 'public.la_chu_cay(uuid)', 'execute')
        and has_function_privilege('authenticated', 'public.tu_gan_lan_dau_duoc(uuid, text)', 'execute')
       then 'ĐẠT' else 'HỎNG' end;
