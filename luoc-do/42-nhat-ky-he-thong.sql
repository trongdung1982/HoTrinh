-- ============================================================
-- giapha-supabase · luoc-do/42-nhat-ky-he-thong.sql
-- Vai trò  : b134 — NHẬT KÝ HỆ THỐNG: ai làm gì với tài khoản, cờ quyền cấp
--            hệ thống và vỏ gia phả. Bảng mới + trigger ghi tự động + năm
--            hàm cho Quản trị hệ thống (đọc · chuyển thùng rác · phục hồi ·
--            dọn > 120 ngày · đọc thùng rác).
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `41`. Dán lại nhiều lần được.
--            ⚠ Không định nghĩa lại hàm nào của file khác — không kéo theo
--            chuỗi dán lại nào, và dán lại file khác cũng không đòi dán lại nó.
-- Sổ tay   : so-tay/nhat-ky-he-thong.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b134.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 28/09/2026
-- ============================================================
--
-- ═══ VÌ SAO TRIGGER, KHÔNG SỬA TỪNG HÀM ═══
--
-- Mười hai việc cần ghi đi qua chín hàm ở bốn file (`11` · `13` · `16` ·
-- `17` · `23`), và bốn trong số ấy đứng CUỐI chuỗi dán lại. Chép lại chúng để
-- thêm một dòng `insert` là mở lại đúng loại lỗi `so-tay/phan-quyen.md` kể:
-- dán lại một file cũ sau nó thì mất, im lặng. Trigger đọc TRẠNG THÁI đổi
-- (cột trước → sau) nên bắt được cả việc không đi qua hàm nào — dán SQL tay,
-- bảng điều khiển Supabase.
--
-- ⚠ Người làm = `auth.uid()` lúc câu lệnh chạy. Hàm `security definer` không
--   đổi `auth.uid()` (nó đọc thẻ đăng nhập, không đọc vai Postgres), nên trigger
--   thấy đúng người bấm nút. Trống = không có thẻ: dán SQL tay, bảng điều khiển,
--   hoặc máy chủ đăng nhập tự ghi — màn hình gọi là "Hệ thống".
--
-- ⚠ Nhật ký KHÔNG có khoá ngoại tới `auth.users` — xoá tài khoản thì dòng
--   nhật ký về họ vẫn ở lại, email chép thành CHỮ lúc ghi. Cùng lý lẽ
--   `change_log.by_email` (`14` mục 10).
--
-- ⚠ Loại `backup` (Sao lưu & Dữ liệu) hôm nay chỉ gồm việc làm với CHÍNH nhật
--   ký (xoá · phục hồi · dọn). Bản sao lưu đêm chạy ở Apps Script, chỉ ĐỌC,
--   không để lại dấu gì ở đây — muốn ghi thì `SaoLuu.gs` phải gọi một hàm, việc
--   riêng.

begin;

do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'tai_khoan'
                    and column_name = 'khoa_luc') then
    raise exception 'DỪNG: chưa dán 23-bon-luat-moi.sql (thiếu cột tai_khoan.khoa_luc).';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'trees'
                    and column_name = 'da_xoa_luc') then
    raise exception 'DỪNG: chưa dán 16-thung-rac-cay.sql (thiếu cột trees.da_xoa_luc).';
  end if;
end $$;

-- ============================================================
-- 1. HAI BẢNG
-- ============================================================
-- Một lô = một lần bấm "Xóa các dòng đã chọn". Dòng nhật ký mang `lo_rac`
-- là đang nằm trong thùng rác; xoá hẳn lô thì dòng đi theo (cascade).
-- 120 ngày là PHÉP TÍNH trên `xoa_luc`, không đẻ cột "hạn" — bài học khoá
-- mềm của `so-tay/phan-quyen.md`.
create table if not exists public.nhat_ky_lo_rac (
  id             bigint generated always as identity primary key,
  mo_ta          text not null default '',
  so_dong        integer not null default 0,
  xoa_luc        timestamptz not null default now(),
  xoa_boi        uuid,
  email_xoa_boi  text not null default ''
);

create table if not exists public.nhat_ky_he_thong (
  id               bigint generated always as identity primary key,
  luc              timestamptz not null default now(),
  loai             text not null check (loai in ('auth', 'qtht', 'tree', 'backup')),
  su_kien          text not null,
  nguoi_lam        uuid,
  email_nguoi_lam  text not null default '',
  doi_tuong        text not null default '',
  chi_tiet         jsonb not null default '{}'::jsonb,
  lo_rac           bigint references public.nhat_ky_lo_rac(id) on delete cascade
);

create index if not exists nhat_ky_he_thong_luc
  on public.nhat_ky_he_thong (luc desc) where lo_rac is null;
create index if not exists nhat_ky_he_thong_lo
  on public.nhat_ky_he_thong (lo_rac) where lo_rac is not null;

-- ⚠ HAI LỚP KHOÁ, cố ý. Supabase tự cấp mọi quyền trên bảng mới cho `anon` và
--   `authenticated` (default privileges) — `revoke` bỏ lớp ấy. RLS bật mà
--   KHÔNG một luật nào là lớp thứ hai. Cửa đọc duy nhất: năm hàm mục 5, và
--   chúng hỏi `la_quan_tri_he_thong()` trong thân.
alter table public.nhat_ky_he_thong enable row level security;
alter table public.nhat_ky_lo_rac   enable row level security;
revoke all on table public.nhat_ky_he_thong from public, anon, authenticated;
revoke all on table public.nhat_ky_lo_rac   from public, anon, authenticated;

-- ============================================================
-- 2. MỘT CỬA GHI — `ghi_nhat_ky()`
-- ============================================================
-- Không ai ngoài trigger gọi được (revoke). Email người làm tra NGAY lúc ghi.
create or replace function public.ghi_nhat_ky(
  p_loai      text,
  p_su_kien   text,
  p_doi_tuong text,
  p_chi_tiet  jsonb default '{}'::jsonb,
  p_nguoi     uuid  default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_nguoi uuid := coalesce(p_nguoi, auth.uid());
  v_email text := '';
begin
  if v_nguoi is not null then
    select coalesce(u.email::text, '') into v_email from auth.users u where u.id = v_nguoi;
  end if;
  insert into public.nhat_ky_he_thong (loai, su_kien, nguoi_lam, email_nguoi_lam, doi_tuong, chi_tiet)
  values (p_loai, p_su_kien, v_nguoi, coalesce(v_email, ''), coalesce(p_doi_tuong, ''),
          coalesce(p_chi_tiet, '{}'::jsonb));
end;
$$;

revoke all on function public.ghi_nhat_ky(text, text, text, jsonb, uuid) from public, anon, authenticated;

-- Email của một tài khoản, '' nếu không có — trigger dùng để điền `doi_tuong`.
create or replace function public.email_tai_khoan(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select u.email::text from auth.users u where u.id = p_user), '');
$$;

revoke all on function public.email_tai_khoan(uuid) from public, anon, authenticated;

-- ============================================================
-- 3. TRIGGER — TÀI KHOẢN (`auth.users` · `tai_khoan`)
-- ============================================================

-- 3a. Đăng nhập. ⚠⚠ Đây là trigger duy nhất của file được NUỐT LỖI: nó nằm
--     trên đường đăng nhập của MỌI người, hỏng một dòng nhật ký không được
--     phép khoá cửa cả phần mềm. Mất một dòng "đăng nhập" rẻ hơn thế nhiều.
--     `last_sign_in_at` đổi đúng lúc đăng nhập bằng mật khẩu; làm mới vé
--     (refresh token) không đụng cột này.
create or replace function public.nk_dang_nhap()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  begin
    perform public.ghi_nhat_ky('auth', 'dang_nhap', coalesce(new.email::text, ''),
                               '{}'::jsonb, new.id);
  exception when others then
    null;
  end;
  return null;
end;
$$;

drop trigger if exists nhat_ky_dang_nhap on auth.users;
create trigger nhat_ky_dang_nhap
  after update on auth.users
  for each row
  when (new.last_sign_in_at is not null
        and old.last_sign_in_at is distinct from new.last_sign_in_at)
  execute function public.nk_dang_nhap();

-- 3b. Xoá hẳn tài khoản. TRƯỚC khi xoá — sau thì email đã mất. Bắt cả cửa
--     `xoa_tai_khoan()` lẫn nút xoá trên bảng điều khiển Supabase.
create or replace function public.nk_xoa_tai_khoan()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.ghi_nhat_ky('auth', 'xoa_tai_khoan', coalesce(old.email::text, ''));
  return old;
end;
$$;

drop trigger if exists nhat_ky_xoa_tai_khoan on auth.users;
create trigger nhat_ky_xoa_tai_khoan
  before delete on auth.users
  for each row execute function public.nk_xoa_tai_khoan();

-- 3c. Tài khoản mới. Dòng `tai_khoan` sinh từ trigger `sau_khi_tao_user`
--     (`11` mục 2) — lúc ấy chưa ai có thẻ, nên người làm = chính họ.
create or replace function public.nk_tao_tai_khoan()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.ghi_nhat_ky('auth', 'tao_tai_khoan', public.email_tai_khoan(new.user_id),
                             jsonb_build_object('ma_ngan', new.ma_ngan),
                             coalesce(auth.uid(), new.user_id));
  return null;
end;
$$;

drop trigger if exists nhat_ky_tao on public.tai_khoan;
create trigger nhat_ky_tao
  after insert on public.tai_khoan
  for each row execute function public.nk_tao_tai_khoan();

-- 3d. Cờ và khoá trên `tai_khoan`. Một câu `update` có thể đổi nhiều cột
--     (khoá mềm xoá luôn lời mời QTHT — `23` mục 7a) → ghi VIỆC CHÍNH, không
--     ghi hệ quả kéo theo của nó.
create or replace function public.nk_sua_tai_khoan()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ai text := public.email_tai_khoan(new.user_id);
begin
  if old.khoa_luc is null and new.khoa_luc is not null then
    perform public.ghi_nhat_ky('auth', 'khoa_tai_khoan', v_ai,
      jsonb_build_object('ly_do', new.khoa_ly_do,
                         'huy_loi_moi_qtht', old.qtht_moi_luc is not null));
  elsif old.khoa_luc is not null and new.khoa_luc is null then
    perform public.ghi_nhat_ky('auth', 'mo_khoa_tai_khoan', v_ai);
  end if;

  if not old.la_quan_tri_he_thong and new.la_quan_tri_he_thong then
    -- Chữ ký thứ hai: người làm là chính họ; người mời lấy từ cột cũ.
    perform public.ghi_nhat_ky('qtht', 'nhan_qtht', v_ai,
      case when old.qtht_moi_boi is null then '{}'::jsonb
           else jsonb_build_object('moi_boi', public.email_tai_khoan(old.qtht_moi_boi)) end);
  elsif old.la_quan_tri_he_thong and not new.la_quan_tri_he_thong then
    perform public.ghi_nhat_ky('qtht', 'ha_qtht', v_ai);
  elsif old.qtht_moi_luc is null and new.qtht_moi_luc is not null then
    perform public.ghi_nhat_ky('qtht', 'moi_qtht', v_ai);
  elsif old.qtht_moi_luc is not null and new.qtht_moi_luc is null
        and not (old.khoa_luc is null and new.khoa_luc is not null) then
    -- Người được mời từ chối, hoặc QTHT rút lời mời — cột `nguoi_lam` nói ai.
    perform public.ghi_nhat_ky('qtht', 'huy_moi_qtht', v_ai);
  end if;

  if not old.duoc_tao_cay and new.duoc_tao_cay then
    perform public.ghi_nhat_ky('qtht', 'cap_quyen_tao_cay', v_ai);
  elsif old.duoc_tao_cay and not new.duoc_tao_cay then
    perform public.ghi_nhat_ky('qtht', 'thu_quyen_tao_cay', v_ai);
  end if;
  return null;
end;
$$;

drop trigger if exists nhat_ky_sua on public.tai_khoan;
create trigger nhat_ky_sua
  after update on public.tai_khoan
  for each row
  when (old.khoa_luc             is distinct from new.khoa_luc
     or old.la_quan_tri_he_thong is distinct from new.la_quan_tri_he_thong
     or old.qtht_moi_luc         is distinct from new.qtht_moi_luc
     or old.duoc_tao_cay         is distinct from new.duoc_tao_cay)
  execute function public.nk_sua_tai_khoan();

-- ============================================================
-- 4. TRIGGER — VỎ GIA PHẢ (`trees` · `cau_hinh`)
-- ============================================================
-- Ba trạng thái của `23` mục 8: bình thường → ẨN (chủ xoá) → THÙNG RÁC (QTHT
-- duyệt). Mỗi mũi tên một sự kiện; `phuc_hoi_cay()` xoá cả hai cột một lúc →
-- một sự kiện "phục hồi", không kèm "trả lại".
create or replace function public.nk_cay()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ten text;
begin
  if tg_op = 'DELETE' then
    perform public.ghi_nhat_ky('tree', 'xoa_han_cay', old.name || ' (' || old.tree_code || ')');
    return null;
  end if;

  v_ten := new.name || ' (' || new.tree_code || ')';

  if tg_op = 'INSERT' then
    perform public.ghi_nhat_ky('tree', 'tao_cay', v_ten);
    return null;
  end if;

  if old.xin_xoa_luc is null and new.xin_xoa_luc is not null then
    perform public.ghi_nhat_ky('tree', 'xoa_cay', v_ten,
      jsonb_build_object('ly_do', new.xin_xoa_ly_do));
  end if;
  if old.da_xoa_luc is null and new.da_xoa_luc is not null then
    perform public.ghi_nhat_ky('tree', 'vao_thung_rac', v_ten);
  elsif old.da_xoa_luc is not null and new.da_xoa_luc is null then
    perform public.ghi_nhat_ky('tree', 'phuc_hoi_cay', v_ten);
  elsif old.xin_xoa_luc is not null and new.xin_xoa_luc is null then
    perform public.ghi_nhat_ky('tree', 'tra_lai_cay', v_ten);
  end if;

  if old.chu_so_huu is distinct from new.chu_so_huu then
    perform public.ghi_nhat_ky('tree', 'doi_chu_cay', v_ten,
      jsonb_build_object('chu_cu',  public.email_tai_khoan(old.chu_so_huu),
                         'chu_moi', public.email_tai_khoan(new.chu_so_huu)));
  end if;
  return null;
end;
$$;

drop trigger if exists nhat_ky_them on public.trees;
create trigger nhat_ky_them
  after insert on public.trees
  for each row execute function public.nk_cay();
drop trigger if exists nhat_ky_sua on public.trees;
create trigger nhat_ky_sua
  after update on public.trees
  for each row
  when (old.xin_xoa_luc is distinct from new.xin_xoa_luc
     or old.da_xoa_luc  is distinct from new.da_xoa_luc
     or old.chu_so_huu  is distinct from new.chu_so_huu)
  execute function public.nk_cay();
drop trigger if exists nhat_ky_xoa on public.trees;
create trigger nhat_ky_xoa
  after delete on public.trees
  for each row execute function public.nk_cay();

-- Cây mặc định — công tắc của cả hệ thống (`11` mục 4).
create or replace function public.nk_cay_mac_dinh()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cu  text;
  v_moi text;
begin
  select t.name || ' (' || t.tree_code || ')' into v_cu  from public.trees t where t.id = old.cay_mac_dinh;
  select t.name || ' (' || t.tree_code || ')' into v_moi from public.trees t where t.id = new.cay_mac_dinh;
  perform public.ghi_nhat_ky('tree', 'doi_cay_mac_dinh', coalesce(v_moi, ''),
    jsonb_build_object('cu', coalesce(v_cu, '')));
  return null;
end;
$$;

drop trigger if exists nhat_ky_sua on public.cau_hinh;
create trigger nhat_ky_sua
  after update on public.cau_hinh
  for each row
  when (old.cay_mac_dinh is distinct from new.cay_mac_dinh)
  execute function public.nk_cay_mac_dinh();

revoke all on function public.nk_dang_nhap()      from public, anon, authenticated;
revoke all on function public.nk_xoa_tai_khoan()  from public, anon, authenticated;
revoke all on function public.nk_tao_tai_khoan()  from public, anon, authenticated;
revoke all on function public.nk_sua_tai_khoan()  from public, anon, authenticated;
revoke all on function public.nk_cay()            from public, anon, authenticated;
revoke all on function public.nk_cay_mac_dinh()   from public, anon, authenticated;

-- ============================================================
-- 5. NĂM CỬA CHO QUẢN TRỊ HỆ THỐNG
-- ============================================================
-- Người không có cờ: hàm đọc trả 0 dòng, hàm việc trả `ok:false` — đúng khuôn
-- `ds_tai_khoan_he_thong()` / `khoa_tai_khoan()`.

-- 5a. Đọc nhật ký đang hiện (không tính dòng trong thùng rác).
--     `p_tu` / `p_den` là nửa khoảng [tu, den). Trần 5000 dòng một lần gọi.
create or replace function public.ds_nhat_ky_he_thong(
  p_loai     text        default null,
  p_tu       timestamptz default null,
  p_den      timestamptz default null,
  p_gioi_han integer     default 1000
)
returns table (
  id              bigint,
  luc             timestamptz,
  loai            text,
  su_kien         text,
  email_nguoi_lam text,
  doi_tuong       text,
  chi_tiet        jsonb
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select n.id, n.luc, n.loai, n.su_kien, n.email_nguoi_lam, n.doi_tuong, n.chi_tiet
    from public.nhat_ky_he_thong n
   where public.la_quan_tri_he_thong()
     and n.lo_rac is null
     and (p_loai is null or n.loai = p_loai)
     and (p_tu  is null or n.luc >= p_tu)
     and (p_den is null or n.luc <  p_den)
   order by n.luc desc, n.id desc
   limit greatest(1, least(coalesce(p_gioi_han, 1000), 5000));
$$;

-- 5b. Chuyển các dòng đã chọn vào thùng rác — một LÔ. Việc này tự để lại
--     một dòng nhật ký (loại `backup`): xoá dấu vết cũng là một dấu vết.
create or replace function public.xoa_nhat_ky(p_ids bigint[], p_mo_ta text default '')
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_so   integer;
  v_tu   timestamptz;
  v_den  timestamptz;
  v_lo   bigint;
  v_mo_ta text;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới xoá được nhật ký hệ thống.');
  end if;

  select count(*), min(n.luc), max(n.luc) into v_so, v_tu, v_den
    from public.nhat_ky_he_thong n
   where n.id = any(coalesce(p_ids, '{}'::bigint[])) and n.lo_rac is null;

  if v_so = 0 then
    return jsonb_build_object('ok', false, 'loi',
      'Chưa chọn dòng nhật ký nào (hoặc các dòng ấy đã nằm trong thùng rác).');
  end if;

  v_mo_ta := v_so || ' dòng, từ ' || to_char(v_tu at time zone 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY')
          || ' tới ' || to_char(v_den at time zone 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY')
          || case when coalesce(trim(p_mo_ta), '') = '' then '' else ' — ' || trim(p_mo_ta) end;

  insert into public.nhat_ky_lo_rac (mo_ta, so_dong, xoa_boi, email_xoa_boi)
  values (v_mo_ta, v_so, auth.uid(), public.email_tai_khoan(auth.uid()))
  returning id into v_lo;

  update public.nhat_ky_he_thong n set lo_rac = v_lo
   where n.id = any(p_ids) and n.lo_rac is null;

  perform public.ghi_nhat_ky('backup', 'xoa_nhat_ky', v_mo_ta,
    jsonb_build_object('so_dong', v_so, 'lo', v_lo));

  return jsonb_build_object('ok', true, 'soDong', v_so, 'lo', v_lo, 'moTa', v_mo_ta);
end;
$$;

-- 5c. Đọc thùng rác nhật ký — mỗi dòng một lô.
create or replace function public.ds_lo_nhat_ky_rac()
returns table (
  id             bigint,
  mo_ta          text,
  so_dong        integer,
  xoa_luc        timestamptz,
  email_xoa_boi  text,
  con_lai        integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select l.id, l.mo_ta, l.so_dong, l.xoa_luc, l.email_xoa_boi,
         greatest(0, 120 - floor(extract(epoch from now() - l.xoa_luc) / 86400)::int)
    from public.nhat_ky_lo_rac l
   where public.la_quan_tri_he_thong()
   order by l.xoa_luc desc, l.id desc;
$$;

-- 5d. Phục hồi một lô — các dòng về lại nhật ký, lô biến mất.
create or replace function public.phuc_hoi_lo_nhat_ky(p_lo bigint)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_mo_ta text;
  v_so    integer;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới phục hồi được nhật ký.');
  end if;

  select l.mo_ta into v_mo_ta from public.nhat_ky_lo_rac l where l.id = p_lo;
  if v_mo_ta is null then
    return jsonb_build_object('ok', false, 'loi', 'Không có lô nhật ký này trong thùng rác.');
  end if;

  update public.nhat_ky_he_thong n set lo_rac = null where n.lo_rac = p_lo;
  get diagnostics v_so = row_count;
  delete from public.nhat_ky_lo_rac where id = p_lo;

  perform public.ghi_nhat_ky('backup', 'phuc_hoi_nhat_ky', v_mo_ta,
    jsonb_build_object('so_dong', v_so));

  return jsonb_build_object('ok', true, 'soDong', v_so);
end;
$$;

-- 5e. Dọn thùng rác nhật ký — XOÁ HẲN mọi lô đã nằm đủ 120 ngày. Không lùi
--     lại được. Cùng con số với thùng rác gia phả (`23` mục 9), cùng luật:
--     chưa đủ ngày thì không dọn, và nói còn bao lâu.
create or replace function public.don_nhat_ky_rac()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_lo   integer;
  v_dong integer;
  v_con  integer;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới dọn được thùng rác nhật ký.');
  end if;

  select count(*), coalesce(sum(l.so_dong), 0) into v_lo, v_dong
    from public.nhat_ky_lo_rac l
   where l.xoa_luc <= now() - interval '120 days';

  if v_lo = 0 then
    select min(greatest(0, 120 - floor(extract(epoch from now() - l.xoa_luc) / 86400)::int))
      into v_con from public.nhat_ky_lo_rac l;
    return jsonb_build_object('ok', false, 'loi',
      case when v_con is null then 'Thùng rác nhật ký đang trống.'
           else 'Chưa lô nào nằm đủ 120 ngày — lô sớm nhất còn ' || v_con || ' ngày.' end);
  end if;

  delete from public.nhat_ky_lo_rac l where l.xoa_luc <= now() - interval '120 days';

  perform public.ghi_nhat_ky('backup', 'don_nhat_ky_rac', v_lo || ' lô, ' || v_dong || ' dòng',
    jsonb_build_object('so_lo', v_lo, 'so_dong', v_dong));

  return jsonb_build_object('ok', true, 'soLo', v_lo, 'soDong', v_dong);
end;
$$;

revoke all on function public.ds_nhat_ky_he_thong(text, timestamptz, timestamptz, integer) from public, anon;
revoke all on function public.xoa_nhat_ky(bigint[], text)    from public, anon;
revoke all on function public.ds_lo_nhat_ky_rac()            from public, anon;
revoke all on function public.phuc_hoi_lo_nhat_ky(bigint)    from public, anon;
revoke all on function public.don_nhat_ky_rac()              from public, anon;
grant execute on function public.ds_nhat_ky_he_thong(text, timestamptz, timestamptz, integer) to authenticated;
grant execute on function public.xoa_nhat_ky(bigint[], text)    to authenticated;
grant execute on function public.ds_lo_nhat_ky_rac()            to authenticated;
grant execute on function public.phuc_hoi_lo_nhat_ky(bigint)    to authenticated;
grant execute on function public.don_nhat_ky_rac()              to authenticated;

-- ============================================================
-- 6. DÒNG ĐẦU TIÊN — chỉ khi bảng còn trống
-- ============================================================
-- Để màn hình nói được "nhật ký bắt đầu ghi từ lúc nào". Dán lại không thêm.
insert into public.nhat_ky_he_thong (loai, su_kien, doi_tuong)
select 'backup', 'bat_dau_nhat_ky', ''
 where not exists (select 1 from public.nhat_ky_he_thong)
   and not exists (select 1 from public.nhat_ky_lo_rac);

commit;

-- ============================================================
-- 7. TỰ KIỂM — hỏi HÌNH DẠNG. Hành vi (ai đọc được, trigger ghi đúng việc
--    nào) thì bàn thử hỏi: `do-b134.mjs`.
-- ============================================================
select 1 as stt, 'hai bảng nhật ký đã có' as ten_kiem,
  case when (select count(*) from information_schema.tables
              where table_schema = 'public'
                and table_name in ('nhat_ky_he_thong', 'nhat_ky_lo_rac')) = 2
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'RLS bật ở cả hai bảng, KHÔNG luật nào',
  case when (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
              where n.nspname = 'public' and c.relname in ('nhat_ky_he_thong', 'nhat_ky_lo_rac')
                and c.relrowsecurity) = 2
        and not exists (select 1 from pg_policies
                         where schemaname = 'public'
                           and tablename in ('nhat_ky_he_thong', 'nhat_ky_lo_rac'))
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'anon/authenticated KHÔNG đọc thẳng được bảng',
  case when not (has_table_privilege('anon', 'public.nhat_ky_he_thong', 'select')
              or has_table_privilege('authenticated', 'public.nhat_ky_he_thong', 'select')
              or has_table_privilege('authenticated', 'public.nhat_ky_he_thong', 'insert')
              or has_table_privilege('authenticated', 'public.nhat_ky_lo_rac', 'select'))
       then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'đủ 8 trigger nhat_ky_* (auth.users 2 · tai_khoan 2 · trees 3 · cau_hinh 1)',
  case when (select count(*) from pg_trigger g join pg_class c on c.oid = g.tgrelid
              join pg_namespace n on n.oid = c.relnamespace
             where not g.tgisinternal and g.tgname like 'nhat\_ky\_%'
               and ((n.nspname = 'auth'   and c.relname = 'users')
                 or (n.nspname = 'public' and c.relname in ('tai_khoan', 'trees', 'cau_hinh')))) = 8
       then 'ĐẠT' else 'HỎNG' end
union all
select 5, 'anon/authenticated KHÔNG gọi được ghi_nhat_ky',
  case when not (has_function_privilege('anon', 'public.ghi_nhat_ky(text, text, text, jsonb, uuid)', 'execute')
              or has_function_privilege('authenticated', 'public.ghi_nhat_ky(text, text, text, jsonb, uuid)', 'execute'))
       then 'ĐẠT' else 'HỎNG' end
union all
select 6, 'authenticated gọi được năm cửa, anon thì không',
  case when has_function_privilege('authenticated', 'public.ds_nhat_ky_he_thong(text, timestamptz, timestamptz, integer)', 'execute')
        and has_function_privilege('authenticated', 'public.xoa_nhat_ky(bigint[], text)', 'execute')
        and has_function_privilege('authenticated', 'public.ds_lo_nhat_ky_rac()', 'execute')
        and has_function_privilege('authenticated', 'public.phuc_hoi_lo_nhat_ky(bigint)', 'execute')
        and has_function_privilege('authenticated', 'public.don_nhat_ky_rac()', 'execute')
        and not has_function_privilege('anon', 'public.xoa_nhat_ky(bigint[], text)', 'execute')
        and not has_function_privilege('anon', 'public.ds_nhat_ky_he_thong(text, timestamptz, timestamptz, integer)', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 7, 'nhật ký có ít nhất một dòng (dòng "bắt đầu")',
  case when exists (select 1 from public.nhat_ky_he_thong) then 'ĐẠT' else 'HỎNG' end
order by stt;
