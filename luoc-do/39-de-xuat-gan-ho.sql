-- ============================================================
-- giapha-supabase · luoc-do/39-de-xuat-gan-ho.sql
-- Vai trò  : b129c — quản trị NỘP HỘ đề xuất gắn tài khoản, từ bảng Danh
--            sách người (`trang-nguoi.js`, cột *Gắn tài khoản*). Không ghi
--            thẳng — đơn vẫn đi qua đúng chữ ký thứ hai của
--            `duyet_de_xuat_gan()` (`35`/`36`), KHÔNG NGOẠI LỆ.
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `36` — cần bảng
--            `de_xuat_gan_nguoi` đã bỏ `tree_id` và hàm `la_quan_tri_cay()`
--            của `29`. Chỉ THÊM một hàm mới, không sửa gì có sẵn.
-- Thiết kế : chủ dự án chốt 27/09/2026 — người nộp hộ = chủ cây HOẶC quản
--            trị gia phả CỦA MỘT CÂY ĐANG CHỨA người ấy (không phải cây
--            bất kỳ mình quản lý ở nơi khác).
-- Sổ tay   : so-tay/phan-quyen.md · so-tay/luu-mot-dong-quan-tri.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b129c.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 27/09/2026
-- ============================================================
--
-- ⚠ KHÔNG có khe tự duyệt nào ở đây. `35` đã RÚT LẠI khe của `29` cho đúng
--   cửa TOÀN PHẦN MỀM này (xem đầu `35`): "MỘT Quản trị hệ thống KHÁC xét,
--   không có ngoại lệ". Ai nộp hộ không đổi luật đó — đơn vẫn "chờ" cho tới
--   khi một QTHT không phải người được gắn bấm Duyệt/Từ chối.
--
-- ⚠ Hàng rào đọc theo NGƯỜI, không theo cây gọi. `trang-nguoi.js` chỉ mở MỘT
--   cây một lúc, nên trên màn hình `duocGanHo` (chủ/quản trị của CHÍNH cây
--   đang xem) và hàng rào SQL dưới (chủ/quản trị của MỘT cây bất kỳ đang
--   giữ người này) luôn ra cùng kết quả — người hiện trong bảng chắc chắn
--   thuộc cây đang mở. Viết hàng rào theo người vẫn đúng nếu sau này một
--   màn hình khác gọi cửa này từ ngữ cảnh nhiều cây.

begin;

do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'de_xuat_gan_nguoi'
                and column_name = 'tree_id')
     or not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'de_xuat_gan_nguoi'
                       and column_name = 'user_id') then
    raise exception 'DỪNG: chưa dán 35-de-xuat-gan-tai-khoan.sql (bảng còn tree_id hoặc thiếu user_id).';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'la_quan_tri_cay') then
    raise exception 'DỪNG: chưa dán 29-tu-duyet-noi-hep.sql (thiếu la_quan_tri_cay()).';
  end if;
end $$;

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
  v_ma  text;
  v_id  uuid;
  v_sua boolean := false;
  n     integer;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'loi', 'Chưa đăng nhập nên chưa nộp được.');
  end if;

  if p_user is null or not exists (select 1 from auth.users where id = p_user) then
    return jsonb_build_object('ok', false, 'loi', 'Không có tài khoản này.');
  end if;

  -- ⚠⚠ Không ngoại lệ: gắn cho CHÍNH MÌNH thì đi bằng Hồ sơ cá nhân
  -- (`nop_de_xuat_gan()`), không phải cửa nộp-hộ này.
  if public.la_chinh_minh(p_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Gắn cho chính mình thì tự nộp ở Hồ sơ cá nhân, không nộp hộ ở đây.');
  end if;

  v_ma := nullif(btrim(coalesce(p_person, '')), '');
  if v_ma is null then
    return jsonb_build_object('ok', false, 'loi', 'Phải nói rõ mã người, ví dụ P0012.');
  end if;

  select count(*) into n from public.persons
   where id = v_ma and not coalesce(deleted, false);
  if n <> 1 then
    return jsonb_build_object('ok', false, 'loi',
      'Không có người mang mã ' || v_ma || ' trong phần mềm.');
  end if;

  -- ══ HÀNG RÀO ══ chủ cây hoặc quản trị gia phả của MỘT CÂY ĐANG CHỨA
  -- người này (`la_quan_tri_cay`, `29`) — không phải cây bất kỳ mình quản lý.
  if not exists (
    select 1 from public.tree_persons tp
     where tp.person_id = v_ma
       and public.la_quan_tri_cay(tp.tree_id, auth.uid())
  ) then
    return jsonb_build_object('ok', false, 'loi',
      'Bạn không phải chủ hoặc quản trị của gia phả nào đang có người ' || v_ma
      || ' nên không nộp hộ được.');
  end if;

  if exists (select 1 from public.tai_khoan
              where user_id = p_user and person_id = v_ma) then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này đã được gắn đúng mã ' || v_ma || ' rồi.');
  end if;

  -- Nói sớm cho người nộp; hàng rào thật vẫn là chỉ mục
  -- `tai_khoan_mot_nguoi_mot_tk` (`34`) + câu bắt `unique_violation` trong
  -- `gan_nguoi_tai_khoan()` lúc duyệt.
  if exists (select 1 from public.tai_khoan
              where person_id = v_ma and user_id <> p_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Mã ' || v_ma || ' đã gắn cho một tài khoản khác rồi. Gỡ bên đó trước, '
      || 'hoặc nói Quản trị hệ thống xét lại.');
  end if;

  update public.de_xuat_gan_nguoi
     set person_id = v_ma,
         ly_do     = left(coalesce(p_ly_do, ''), 500),
         tao_luc   = now()
   where user_id = p_user and trang_thai = 'cho'
  returning id into v_id;

  if v_id is null then
    insert into public.de_xuat_gan_nguoi (user_id, person_id, ly_do)
    values (p_user, v_ma, left(coalesce(p_ly_do, ''), 500))
    returning id into v_id;
  else
    v_sua := true;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'maNguoi', v_ma,
                            'suaDon', v_sua);
end;
$$;

revoke all on function public.de_xuat_gan_ho(uuid, text, text) from public, anon;
grant execute on function public.de_xuat_gan_ho(uuid, text, text) to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — hỏi HÌNH DẠNG. Hành vi (hàng rào có gác không) thì bàn thử hỏi.
-- ============================================================
select 1 as stt, 'de_xuat_gan_ho() tồn tại' as ten_kiem,
  case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'de_xuat_gan_ho')
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'de_xuat_gan_ho() có chặn la_chinh_minh',
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'de_xuat_gan_ho') ilike '%la_chinh_minh%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'de_xuat_gan_ho() gác bằng la_quan_tri_cay, KHÔNG tự duyệt',
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'de_xuat_gan_ho') ilike '%la_quan_tri_cay%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'anon KHÔNG gọi được de_xuat_gan_ho()',
  case when not has_function_privilege('anon', 'public.de_xuat_gan_ho(uuid, text, text)', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 5, 'authenticated gọi được de_xuat_gan_ho()',
  case when has_function_privilege('authenticated', 'public.de_xuat_gan_ho(uuid, text, text)', 'execute')
       then 'ĐẠT' else 'HỎNG' end
order by stt;
