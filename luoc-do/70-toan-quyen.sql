-- ============================================================
-- giapha-supabase · luoc-do/70-toan-quyen.sql
-- Vai trò  : CÔNG TẮC TOÀN QUYỀN cho đúng một tài khoản — chủ dự án
--            `trongdung1982@gmail.com`. Chủ dự án chốt 14/10/2026: "đủ mọi
--            quyền, không có hàng rào nào".
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `69`. Dán lại nhiều lần được.
-- Cần có   : `23` (bản đứng cuối của năm hàm gác cửa) · `13` (`la_chinh_minh`).
--            ⚠ File này ĐỨNG CUỐI sáu hàm: `la_quan_tri_he_thong` · `bi_khoa` ·
--            `co_the_xem_cay` · `co_the_sua` · `la_chinh_minh` (+ hàm mới
--            `la_toan_quyen`). Dán lại `11`/`13`/`16`/`23` thì PHẢI dán lại
--            file này — không thì công tắc tắt, IM LẶNG.
-- Sổ tay   : so-tay/phan-quyen.md mục *Toàn quyền — `70`*
-- Đo       : ../kiem-thu/ban-thu-sql/do-toan-quyen.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 14/10/2026
-- ============================================================
--
-- Cách làm: một cột `tai_khoan.toan_quyen`, KHÔNG nút nào trên app đổi được
-- (không hàm nào ghi cột ấy, `authenticated` không có quyền ghi bảng) — chỉ
-- SQL Editor. Năm hàm gác cửa hỏi cột ấy ở nhánh ĐẦU; mọi hàm khác hỏi năm
-- hàm này nên tự đi theo. Người có cờ:
--   · là Quản trị hệ thống ở mọi nơi, kể cả khi ai đó hạ cờ hay khoá;
--   · không bao giờ bị khoá mềm, không bị xoá tài khoản (trigger mục 4);
--   · đọc + sửa MỌI cây, kể cả cây đã bấm xoá và cây trong thùng rác;
--   · đặt quyền cho chính mình, tự duyệt đơn của chính mình.
-- ⚠ Ai có mật khẩu tài khoản này là có toàn quyền, không người thứ hai chặn.
-- Tắt: `update public.tai_khoan set toan_quyen = false where …;` trong SQL Editor.

begin;

-- ============================================================
-- 1. CỘT + HÀM HỎI
-- ============================================================
alter table public.tai_khoan
  add column if not exists toan_quyen boolean not null default false;

create or replace function public.la_toan_quyen()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select k.toan_quyen from public.tai_khoan k where k.user_id = auth.uid()),
    false);
$$;

revoke all on function public.la_toan_quyen() from public, anon;
grant execute on function public.la_toan_quyen() to authenticated;

-- ============================================================
-- 2. NĂM HÀM GÁC CỬA — thân chép nguyên bản đứng cuối, thêm đúng một nhánh
-- ============================================================

-- `23` mục 4a. Cờ toàn quyền thắng cả khoá mềm lẫn cờ QTHT bị hạ.
create or replace function public.la_quan_tri_he_thong()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select (la_quan_tri_he_thong and khoa_luc is null) or toan_quyen
       from public.tai_khoan
      where user_id = auth.uid()),
    false
  );
$$;

-- `23` mục 3.
create or replace function public.bi_khoa()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select k.khoa_luc is not null and not k.toan_quyen
       from public.tai_khoan k where k.user_id = auth.uid()),
    false
  );
$$;

-- `23` mục 4d. Toàn quyền đọc xuyên cả cây đang đóng và thùng rác.
create or replace function public.co_the_xem_cay(p_tree uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.la_toan_quyen() or coalesce(
    (
      public.la_thanh_vien(p_tree)
      or (public.cay_mac_dinh() is not null and p_tree = public.cay_mac_dinh())
      or public.la_quan_tri_he_thong()
    )
    and not public.bi_khoa()
    and (
      not public.cay_dang_an(p_tree)
      -- Cây đang đóng vẫn phải vào được bản sao lưu đêm.
      or public.la_may_sao_luu(p_tree)
    ),
    false
  );
$$;

-- `23` mục 4e. Toàn quyền ghi cả cây đang đóng.
create or replace function public.co_the_sua(p_tree uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when public.la_toan_quyen()       then true
    when public.bi_khoa()             then false
    when public.cay_dang_an(p_tree)   then false
    when public.vai_tro(p_tree) in ('quan_tri_he_thong', 'quan_tri') then true
    when public.vai_tro(p_tree) = 'sua' then public.nguoi_gan(p_tree) is not null
    else false
  end;
$$;

-- `13` mục 5. Mọi chỗ gọi hàm này đều để CHẶN ("là chính mình thì từ chối"),
-- nên trả `false` cho người toàn quyền là mở mọi cửa tự đặt quyền / tự duyệt.
-- Chỗ duy nhất dùng để CHO (`39`: rút đơn) còn nhánh `la_quan_tri_he_thong()`.
create or replace function public.la_chinh_minh(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(p_user = auth.uid() and not public.la_toan_quyen(), false);
$$;

-- ============================================================
-- 3. BẬT CỜ cho đúng một tài khoản
-- ============================================================
-- Gỡ khoá trước (trigger `46` tự gỡ lệnh cấm đăng nhập theo), rồi bật cờ.
update public.tai_khoan k
   set khoa_luc = null
  from auth.users u
 where u.id = k.user_id and u.email = 'trongdung1982@gmail.com'
   and k.khoa_luc is not null;

update public.tai_khoan k
   set toan_quyen = true, la_quan_tri_he_thong = true
  from auth.users u
 where u.id = k.user_id and u.email = 'trongdung1982@gmail.com';

-- ============================================================
-- 4. TRIGGER — không ai khoá, hạ cờ, hay xoá tài khoản toàn quyền
-- ============================================================
-- Đặt ở BẢNG thay vì vá `khoa_tai_khoan()` / `xoa_tai_khoan()` /
-- `dat_quan_tri_he_thong()`: một chỗ chặn cả ba cửa và mọi cửa sau này.
-- `xoa_tai_khoan()` xoá `auth.users` → dòng `tai_khoan` xoá theo dây chuyền
-- → trigger báo lỗi → cả lần xoá lùi lại.
-- Muốn khoá/xoá thật thì SQL Editor tắt `toan_quyen` trước.
create or replace function public.giu_tai_khoan_toan_quyen()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    if old.toan_quyen then
      raise exception 'Tài khoản toàn quyền không xoá được.';
    end if;
    return old;
  end if;
  if new.toan_quyen and new.khoa_luc is not null then
    raise exception 'Tài khoản toàn quyền không khoá được.';
  end if;
  if new.toan_quyen and not new.la_quan_tri_he_thong then
    raise exception 'Tài khoản toàn quyền không gỡ cờ Quản trị hệ thống được.';
  end if;
  return new;
end $$;

revoke all on function public.giu_tai_khoan_toan_quyen() from public, anon, authenticated;

drop trigger if exists giu_toan_quyen on public.tai_khoan;
create trigger giu_toan_quyen
  before update or delete on public.tai_khoan
  for each row execute function public.giu_tai_khoan_toan_quyen();

commit;

-- ============================================================
-- TỰ KIỂM — mọi dòng phải ĐẠT
-- ============================================================
select 1 as stt, 'cột tai_khoan.toan_quyen có' as ten_kiem,
  case when exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'tai_khoan'
                       and column_name = 'toan_quyen') then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'trongdung1982@gmail.com: toàn quyền + QTHT + không khoá',
  case when not exists (select 1 from auth.users where email = 'trongdung1982@gmail.com')
         then 'HỎNG — chưa có tài khoản này'
       when exists (select 1 from public.tai_khoan k join auth.users u on u.id = k.user_id
                     where u.email = 'trongdung1982@gmail.com'
                       and k.toan_quyen and k.la_quan_tri_he_thong and k.khoa_luc is null)
         then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'đúng MỘT tài khoản mang cờ toàn quyền',
  case when (select count(*) from public.tai_khoan where toan_quyen) = 1
       then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'năm hàm gác cửa hỏi cờ toàn quyền',
  case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public'
                and p.proname in ('la_quan_tri_he_thong', 'bi_khoa', 'co_the_xem_cay',
                                  'co_the_sua', 'la_chinh_minh')
                and (p.prosrc like '%toan_quyen%')) = 5
       then 'ĐẠT' else 'HỎNG' end
union all
select 5, 'trigger giữ tài khoản toàn quyền có',
  case when exists (select 1 from pg_trigger
                     where tgname = 'giu_toan_quyen'
                       and tgrelid = 'public.tai_khoan'::regclass)
       then 'ĐẠT' else 'HỎNG' end
union all
select 6, 'anon KHÔNG gọi được la_toan_quyen()',
  case when not has_function_privilege('anon', 'public.la_toan_quyen()', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 7, 'authenticated gọi được la_toan_quyen()',
  case when has_function_privilege('authenticated', 'public.la_toan_quyen()', 'execute')
       then 'ĐẠT' else 'HỎNG' end
order by stt;
