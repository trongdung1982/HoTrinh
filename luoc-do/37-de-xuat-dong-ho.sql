-- ============================================================
-- giapha-supabase · luoc-do/37-de-xuat-dong-ho.sql
-- Vai trò  : b126c — "DÒNG HỌ" ở Hồ sơ cá nhân. Tự chọn CÂY CHÍNH
--            (`tai_khoan.cay_chinh_id`, cột đã có từ `34`) trong các cây mình
--            là thành viên ĐÃ DUYỆT; QTHT duyệt. QTHT tự chọn cho mình,
--            KHÔNG cần ai duyệt — đường riêng, không đi qua đơn.
-- Chạy ở   : Supabase → SQL Editor. Chạy SAU `36`.
-- Phiên bản: 0.1.0 · Cập nhật: 26/09/2026 (b126c)
-- Thiết kế : THIET-KE-NHIEU-CAY.md mục 6, khối "GẮN NGƯỜI và DÒNG HỌ" (23/09)
-- Sổ tay   : so-tay/phan-quyen.md
-- ============================================================
--
-- ═══ KHÔNG PHẢI BẢN CHÉP CỦA `35` — MỘT CHỖ KHÁC HẲN ═══
--
-- Gắn người là **duy nhất** (một mã, một tài khoản — chỉ mục `34`). Dòng họ
-- **không duy nhất**: hàng chục tài khoản cùng nhận một cây là dòng họ chính
-- của mình là bình thường. Nên bảng đơn này KHÔNG có chỉ mục "một cây một
-- người", chỉ có "một tài khoản một đơn đang chờ" — giống `35`, không giống
-- `34`.
--
-- ═══ "TỰ CHỌN, KHÔNG CẦN AI DUYỆT" CỦA QTHT ĐI ĐƯỜNG RIÊNG ═══
--
-- Không tái dùng khe `tu_gan_lan_dau_duoc()` của `36` — khe ấy trả lời một
-- câu hỏi khác ("có phải lần đầu, có tranh chấp không") và dòng họ không có
-- khái niệm tranh chấp. QTHT tự đặt qua `dat_dong_ho_qtht()`, ÁP DỤNG THẲNG,
-- không qua bảng đơn — đúng nghĩa "không cần ai duyệt" (không phải "tự duyệt
-- đơn của mình", mà là không có đơn nào cả).

begin;

-- ⚠ HÀNG RÀO THỨ TỰ DÁN (đặt 26/09 sau khi chủ dự án dán `37` trước `34` —
--   Postgres báo "column tk.cay_chinh_id does not exist", không nói phải làm gì).
do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'tai_khoan'
                    and column_name = 'cay_chinh_id') then
    raise exception 'DỪNG: chưa dán 34-gan-nguoi-tai-khoan.sql. Thứ tự đúng: 34 → 35 → 36 → 37, cùng một buổi.';
  end if;
end $$;

-- ============================================================
-- 1. BẢNG ĐƠN
-- ============================================================
create table if not exists public.de_xuat_dong_ho (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  tree_id    uuid not null references public.trees(id) on delete cascade,
  ly_do      text not null default '',
  trang_thai text not null default 'cho'
             check (trang_thai in ('cho', 'duyet', 'tu_choi')),
  tao_luc    timestamptz not null default now(),
  xet_boi    uuid references auth.users(id) on delete set null,
  xet_luc    timestamptz,
  loi_xet    text not null default ''
);

comment on table public.de_xuat_dong_ho is
  'Đơn một TÀI KHOẢN xin đổi "dòng họ" (cay_chinh_id) — tự chọn trong các cây '
  'mình là thành viên đã duyệt. QTHT xét. QTHT tự chọn cho mình đi đường '
  'riêng (dat_dong_ho_qtht), không qua bảng này.';

create unique index if not exists de_xuat_dong_ho_mot_don_cho
  on public.de_xuat_dong_ho (user_id)
  where trang_thai = 'cho';

create index if not exists de_xuat_dong_ho_theo_trang_thai
  on public.de_xuat_dong_ho (trang_thai);

-- ⚠⚠ BẬT RLS, KHÔNG POLICY — mọi đường qua hàm `security definer` bên dưới,
--   đúng nếp `35`/`21`.
alter table public.de_xuat_dong_ho enable row level security;

-- ============================================================
-- 2. NỘP ĐƠN — nop_de_xuat_dong_ho(p_tree, p_ly_do)
-- ============================================================
create or replace function public.nop_de_xuat_dong_ho(
  p_tree  uuid,
  p_ly_do text default ''
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_toi uuid := auth.uid();
  v_id  uuid;
  v_sua boolean := false;
  v_hien uuid;
begin
  if v_toi is null then
    return jsonb_build_object('ok', false, 'loi',
      'Chưa đăng nhập nên chưa nộp đơn được.');
  end if;

  if p_tree is null or not exists (select 1 from public.trees where id = p_tree) then
    return jsonb_build_object('ok', false, 'loi', 'Không có gia phả này.');
  end if;

  -- Chỉ chọn trong các cây mình LÀ THÀNH VIÊN ĐÃ DUYỆT — đúng câu chốt 23/09.
  if not exists (select 1 from public.tree_members
                  where tree_id = p_tree and user_id = v_toi and approved) then
    return jsonb_build_object('ok', false, 'loi',
      'Bạn chưa là thành viên đã được duyệt của gia phả này, nên chưa chọn '
      || 'làm dòng họ được.');
  end if;

  select cay_chinh_id into v_hien from public.tai_khoan where user_id = v_toi;
  if v_hien = p_tree then
    return jsonb_build_object('ok', false, 'loi',
      'Gia phả này đã là dòng họ hiện tại của bạn rồi.');
  end if;

  update public.de_xuat_dong_ho
     set tree_id = p_tree,
         ly_do   = left(coalesce(p_ly_do, ''), 500),
         tao_luc = now()
   where user_id = v_toi and trang_thai = 'cho'
  returning id into v_id;

  if v_id is null then
    insert into public.de_xuat_dong_ho (user_id, tree_id, ly_do)
    values (v_toi, p_tree, left(coalesce(p_ly_do, ''), 500))
    returning id into v_id;
  else
    v_sua := true;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'suaDon', v_sua);
end;
$$;

-- ============================================================
-- 3. RÚT ĐƠN CỦA CHÍNH MÌNH
-- ============================================================
create or replace function public.rut_de_xuat_dong_ho(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare n integer;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'loi', 'Chưa đăng nhập.');
  end if;

  delete from public.de_xuat_dong_ho
   where id = p_id and user_id = auth.uid() and trang_thai = 'cho';
  get diagnostics n = row_count;

  if n = 0 then
    return jsonb_build_object('ok', false, 'loi',
      'Không có đơn nào đang chờ của bạn mang mã đơn ấy.');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- 4. NGƯỜI XÉT NHÌN THẤY GÌ — ds_de_xuat_dong_ho()
-- ============================================================
create or replace function public.ds_de_xuat_dong_ho()
returns table (
  id           uuid,
  user_id      uuid,
  email        text,
  ma_ngan      text,
  tree_id      uuid,
  ten_cay      text,
  dong_ho_hien text,
  ly_do        text,
  tao_luc      timestamptz,
  la_cua_toi   boolean
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
         d.tree_id,
         t.name,
         coalesce(th.name, ''),
         d.ly_do,
         d.tao_luc,
         coalesce(d.user_id = auth.uid(), false)
    from public.de_xuat_dong_ho d
    join auth.users u on u.id = d.user_id
    join public.trees t on t.id = d.tree_id
    left join public.tai_khoan tk on tk.user_id = d.user_id
    left join public.trees th on th.id = tk.cay_chinh_id
   where d.trang_thai = 'cho'
     and public.la_quan_tri_he_thong()
   order by d.tao_luc, u.email::text;
$$;

-- ============================================================
-- 5. NGƯỜI NỘP NHÌN THẤY GÌ — de_xuat_dong_ho_cua_toi()
-- ============================================================
create or replace function public.de_xuat_dong_ho_cua_toi()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_cho public.de_xuat_dong_ho%rowtype;
  v_bo  public.de_xuat_dong_ho%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('coDon', false);
  end if;

  select * into v_cho from public.de_xuat_dong_ho
   where user_id = auth.uid() and trang_thai = 'cho';

  select * into v_bo from public.de_xuat_dong_ho
   where user_id = auth.uid() and trang_thai = 'tu_choi'
   order by xet_luc desc nulls last
   limit 1;

  return jsonb_build_object(
    'coDon',  v_cho.id is not null,
    'id',     v_cho.id,
    'treeId', v_cho.tree_id,
    'tenCay', (select name from public.trees where id = v_cho.tree_id),
    'lyDo',   coalesce(v_cho.ly_do, ''),
    'taoLuc', v_cho.tao_luc,
    'lanTuChoi', case when v_bo.id is null then null else jsonb_build_object(
                   'tenCay', (select name from public.trees where id = v_bo.tree_id),
                   'loiXet', coalesce(v_bo.loi_xet, ''),
                   'xetLuc', v_bo.xet_luc) end);
end;
$$;

-- ============================================================
-- 6. DUYỆT / TỪ CHỐI — CHỈ QTHT, KHÔNG NGOẠI LỆ TỰ DUYỆT
-- ============================================================
-- ⚠ Chốt 23/09 không nêu ngoại lệ nào cho dòng họ (khác gắn người, nơi chủ
--   dự án sau đó thêm khe ở `36`). Đừng tự suy ra một khe tương tự ở đây.
create or replace function public.duyet_de_xuat_dong_ho(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_don public.de_xuat_dong_ho%rowtype;
begin
  select * into v_don from public.de_xuat_dong_ho where id = p_id;

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
      'Đây là đơn của chính bạn — không ai tự duyệt đơn của mình được. Muốn '
      || 'đổi dòng họ cho chính mình, dùng đường đặt trực tiếp (không qua đơn).');
  end if;

  update public.tai_khoan set cay_chinh_id = v_don.tree_id
   where user_id = v_don.user_id;

  update public.de_xuat_dong_ho
     set trang_thai = 'duyet', xet_boi = auth.uid(), xet_luc = now()
   where id = p_id;

  return jsonb_build_object('ok', true, 'treeId', v_don.tree_id,
                            'nguoiNop', v_don.user_id);
end;
$$;

create or replace function public.tu_choi_de_xuat_dong_ho(p_id uuid, p_ly_do text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_don public.de_xuat_dong_ho%rowtype;
  v_ly  text;
begin
  select * into v_don from public.de_xuat_dong_ho where id = p_id;

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
      'Đây là đơn của chính bạn. Muốn thôi thì tự rút đơn về.');
  end if;

  v_ly := nullif(btrim(coalesce(p_ly_do, '')), '');
  if v_ly is null then
    return jsonb_build_object('ok', false, 'loi',
      'Phải ghi lý do từ chối — người nộp đọc đúng câu ấy để biết nên sửa gì.');
  end if;

  update public.de_xuat_dong_ho
     set trang_thai = 'tu_choi', xet_boi = auth.uid(), xet_luc = now(),
         loi_xet = left(v_ly, 500)
   where id = p_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- 7. QTHT TỰ CHỌN CHO MÌNH — KHÔNG QUA ĐƠN
-- ============================================================
create or replace function public.dat_dong_ho_qtht(p_tree uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare v_toi uuid := auth.uid();
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới dùng được đường đặt trực tiếp này. Tài '
      || 'khoản khác nộp đơn qua nop_de_xuat_dong_ho().');
  end if;

  if p_tree is null or not exists (select 1 from public.trees where id = p_tree) then
    return jsonb_build_object('ok', false, 'loi', 'Không có gia phả này.');
  end if;

  if not exists (select 1 from public.tree_members
                  where tree_id = p_tree and user_id = v_toi and approved) then
    return jsonb_build_object('ok', false, 'loi',
      'Bạn chưa là thành viên đã được duyệt của gia phả này.');
  end if;

  update public.tai_khoan set cay_chinh_id = p_tree where user_id = v_toi;

  return jsonb_build_object('ok', true, 'treeId', p_tree);
end;
$$;

-- ============================================================
-- 8. QUYỀN GỌI
-- ============================================================
revoke all on function public.nop_de_xuat_dong_ho(uuid, text)   from public, anon;
revoke all on function public.rut_de_xuat_dong_ho(uuid)          from public, anon;
revoke all on function public.ds_de_xuat_dong_ho()               from public, anon;
revoke all on function public.de_xuat_dong_ho_cua_toi()          from public, anon;
revoke all on function public.duyet_de_xuat_dong_ho(uuid)        from public, anon;
revoke all on function public.tu_choi_de_xuat_dong_ho(uuid, text) from public, anon;
revoke all on function public.dat_dong_ho_qtht(uuid)             from public, anon;

grant execute on function public.nop_de_xuat_dong_ho(uuid, text)    to authenticated;
grant execute on function public.rut_de_xuat_dong_ho(uuid)          to authenticated;
grant execute on function public.ds_de_xuat_dong_ho()               to authenticated;
grant execute on function public.de_xuat_dong_ho_cua_toi()          to authenticated;
grant execute on function public.duyet_de_xuat_dong_ho(uuid)        to authenticated;
grant execute on function public.tu_choi_de_xuat_dong_ho(uuid, text) to authenticated;
grant execute on function public.dat_dong_ho_qtht(uuid)             to authenticated;

commit;

-- ============================================================
-- 9. TỰ KIỂM — hỏi HÌNH DẠNG. Hành vi thì bàn thử hỏi (do-b126c.mjs)
-- ============================================================
select 'PHÉP 1 · bảng de_xuat_dong_ho đã có: ' ||
  case when exists (select 1 from information_schema.tables
                     where table_schema = 'public' and table_name = 'de_xuat_dong_ho')
       then 'ĐẠT' else 'HỎNG' end as tu_kiem
union all
select 'PHÉP 2 · bảng ấy BẬT RLS, KHÔNG policy: ' ||
  case when (select relrowsecurity from pg_class where oid = 'public.de_xuat_dong_ho'::regclass)
        and (select count(*) from pg_policies
              where schemaname = 'public' and tablename = 'de_xuat_dong_ho') = 0
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 3 · chỉ mục "một tài khoản một đơn chờ" đã có: ' ||
  case when exists (select 1 from pg_indexes
                     where schemaname = 'public' and indexname = 'de_xuat_dong_ho_mot_don_cho')
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 4 · nop_de_xuat_dong_ho() đòi approved (thành viên đã duyệt): ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'nop_de_xuat_dong_ho')
            ilike '%approved%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 5 · duyet_de_xuat_dong_ho() gác QTHT VÀ chặn la_chinh_minh, KHÔNG ngoại lệ: ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'duyet_de_xuat_dong_ho')
            ilike '%la_quan_tri_he_thong%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'duyet_de_xuat_dong_ho')
            ilike '%la_chinh_minh%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'duyet_de_xuat_dong_ho')
            not ilike '%tu_gan_lan_dau_duoc%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 6 · dat_dong_ho_qtht() gác la_quan_tri_he_thong VÀ đòi approved: ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'dat_dong_ho_qtht')
            ilike '%la_quan_tri_he_thong%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'dat_dong_ho_qtht')
            ilike '%approved%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 7 · anon KHÔNG gọi được bảy hàm: ' ||
  case when not (has_function_privilege('anon', 'public.nop_de_xuat_dong_ho(uuid, text)', 'execute')
             or has_function_privilege('anon', 'public.rut_de_xuat_dong_ho(uuid)', 'execute')
             or has_function_privilege('anon', 'public.ds_de_xuat_dong_ho()', 'execute')
             or has_function_privilege('anon', 'public.de_xuat_dong_ho_cua_toi()', 'execute')
             or has_function_privilege('anon', 'public.duyet_de_xuat_dong_ho(uuid)', 'execute')
             or has_function_privilege('anon', 'public.tu_choi_de_xuat_dong_ho(uuid, text)', 'execute')
             or has_function_privilege('anon', 'public.dat_dong_ho_qtht(uuid)', 'execute'))
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 8 · authenticated gọi được cả bảy: ' ||
  case when has_function_privilege('authenticated', 'public.nop_de_xuat_dong_ho(uuid, text)', 'execute')
        and has_function_privilege('authenticated', 'public.rut_de_xuat_dong_ho(uuid)', 'execute')
        and has_function_privilege('authenticated', 'public.ds_de_xuat_dong_ho()', 'execute')
        and has_function_privilege('authenticated', 'public.de_xuat_dong_ho_cua_toi()', 'execute')
        and has_function_privilege('authenticated', 'public.duyet_de_xuat_dong_ho(uuid)', 'execute')
        and has_function_privilege('authenticated', 'public.tu_choi_de_xuat_dong_ho(uuid, text)', 'execute')
        and has_function_privilege('authenticated', 'public.dat_dong_ho_qtht(uuid)', 'execute')
       then 'ĐẠT' else 'HỎNG' end;
