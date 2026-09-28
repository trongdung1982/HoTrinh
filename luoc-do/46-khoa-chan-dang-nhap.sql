-- ============================================================
-- giapha-supabase · luoc-do/46-khoa-chan-dang-nhap.sql
-- Vai trò  : Khoá tài khoản thì CHẶN LUÔN ĐĂNG NHẬP — đồng bộ cột
--            `tai_khoan.khoa_luc` sang `auth.users.banned_until`.
-- Cần có   : `23` (cột `khoa_luc`) đã dán. Không dán lại file nào khác.
-- Phiên bản: 0.1.0 · Cập nhật: 28/09/2026 (b144)
-- Sổ tay   : so-tay/phan-quyen.md mục *Khoá mềm*
-- ============================================================
--
-- ⚠ Trước file này, khoá mềm (`23` mục 7) chỉ tắt QUYỀN: người bị khoá vẫn
--   đăng nhập được, chỉ là mọi hàm trả rỗng. Máy Auth của Supabase đọc
--   `banned_until` mỗi lần đăng nhập VÀ mỗi lần làm mới thẻ → người đang mở
--   app bị đẩy ra trong vòng ~1 giờ (hạn thẻ), không cần làm gì thêm.
--
-- ⚠ Bằng TRIGGER trên `tai_khoan`, không sửa `khoa_tai_khoan()` /
--   `mo_khoa_tai_khoan()`: hai hàm ấy ĐỨNG CUỐI ở `23`, sửa là đẻ thêm một mắt
--   xích vào chuỗi dán lại. Trigger còn bắt cả khi ai đó sửa `khoa_luc` bằng
--   tay trong SQL Editor.
--
-- ⚠ 100 năm, KHÔNG phải `infinity`: máy Auth viết bằng Go, đọc `infinity`
--   thành lỗi — cùng con số với `ban_duration: '876000h'` của API chính chủ.
--
-- ⚠ KHÔNG nuốt lỗi (khác trigger nhật ký `42`): chặn hỏng mà khoá vẫn "thành
--   công" là báo dối về an ninh. Hỏng thì cả lệnh khoá hỏng theo.
--
-- ⚠ Không tự mở sau 60 ngày — đúng luật `23`: khoá đứng tới khi mở tay hoặc
--   xoá hẳn. `xoa_tai_khoan()` xoá cả dòng `auth.users`, không cần bước nào.

begin;

do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'tai_khoan'
                    and column_name = 'khoa_luc') then
    raise exception 'DỪNG: chưa dán 23-bon-luat-moi.sql (thiếu cột tai_khoan.khoa_luc).';
  end if;
end $$;

create or replace function public.dong_bo_khoa_dang_nhap()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update auth.users
     set banned_until = case when new.khoa_luc is null then null
                             else now() + interval '100 years' end
   where id = new.user_id;
  return null;
end;
$$;

revoke all on function public.dong_bo_khoa_dang_nhap() from public, anon, authenticated;

drop trigger if exists khoa_chan_dang_nhap on public.tai_khoan;
create trigger khoa_chan_dang_nhap
  after update of khoa_luc on public.tai_khoan
  for each row
  when (old.khoa_luc is distinct from new.khoa_luc)
  execute function public.dong_bo_khoa_dang_nhap();

-- Tài khoản ĐANG bị khoá từ trước file này: chặn luôn. Tài khoản không khoá
-- mà lỡ mang `banned_until` (ai đó cấm tay ở bảng điều khiển) thì ĐỂ NGUYÊN —
-- file này chỉ đồng bộ chiều khoá, không đoán ý người khác.
update auth.users u
   set banned_until = now() + interval '100 years'
  from public.tai_khoan k
 where k.user_id = u.id
   and k.khoa_luc is not null
   and (u.banned_until is null or u.banned_until < now());

commit;

-- ============================================================
-- TỰ KIỂM — bảng cuối phải ra ĐẠT ở cả ba dòng
-- ============================================================
select 1 as stt, 'trigger khoa_chan_dang_nhap đã gắn vào tai_khoan' as ten_kiem,
  case when exists (select 1 from pg_trigger
                     where tgrelid = 'public.tai_khoan'::regclass and tgname = 'khoa_chan_dang_nhap')
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'mọi tài khoản đang khoá đều bị chặn đăng nhập — số lệch: ' ||
  (select count(*) from public.tai_khoan k join auth.users u on u.id = k.user_id
    where k.khoa_luc is not null and (u.banned_until is null or u.banned_until < now())),
  case when not exists (select 1 from public.tai_khoan k join auth.users u on u.id = k.user_id
                         where k.khoa_luc is not null
                           and (u.banned_until is null or u.banned_until < now()))
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'authenticated/anon không gọi thẳng được hàm trigger',
  case when not has_function_privilege('authenticated', 'public.dong_bo_khoa_dang_nhap()', 'execute')
        and not has_function_privilege('anon', 'public.dong_bo_khoa_dang_nhap()', 'execute')
       then 'ĐẠT' else 'HỎNG' end
order by stt;
