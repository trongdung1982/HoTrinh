-- ============================================================
-- giapha-supabase · luoc-do/48-bao-trung-nguoi.sql
-- Vai trò  : b146 (= b124b) — BÁO TRÙNG NGƯỜI + Quản trị hệ thống DUYỆT GỘP.
--            Bảng `bao_trung_nguoi` + sáu hàm gọi được: tìm · nộp · rút ·
--            danh sách · duyệt (máy chủ tự gộp) · từ chối.
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `47`. Chỉ THÊM, không định nghĩa
--            đè hàm nào của file khác → không nằm trong chuỗi dán lại nào.
--            Dán lại nhiều lần vẫn được.
-- Thiết kế : THIET-KE-NHIEU-CAY.md mục 6 — điều 5 (17/09) + *CHỐT THÊM 21/09*
-- Sổ tay   : so-tay/nguoi-xuyen-cay.md mục *Báo trùng + gộp*
-- Đo       : ../kiem-thu/ban-thu-sql/do-b146.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 28/09/2026 (b146)
-- ============================================================
--
-- LUẬT (chủ dự án chốt 17/09 + 21/09):
--   · Ai báo: người xem được CẢ HAI người (`ds_nguoi_xem_duoc()`, tức thành
--     viên của một cây chứa mỗi người) — hoặc QTHT. Khách của cây mặc định
--     không báo được (từ `47` khách không đọc thẳng bảng người).
--   · MÁY chọn mã giữ, không hỏi: mã NHỎ HƠN ở lại. QTHT chỉ Duyệt/Từ chối.
--   · Trường bên giữ BỎ TRỐNG thì lấy của bên thua; vênh thật thì giữ bên giữ.
--   · Một hàm cho cả cùng cây lẫn khác cây.
--   · Mã thua: `deleted = true` + `meta.gopVao = <mã giữ>`, rời mọi cây.
--     Không xoá cứng. Không thêm cột vào `persons` (cột mới = BỐN chỗ phải
--     sửa, `so-tay/luu-du-lieu.md`) — con trỏ nằm trong `meta` + bảng này.
--
-- ⚠ MƯỜI BA CHỖ MANG MÃ NGƯỜI (đếm lại bằng `information_schema` 28/09, nhiều
--   hơn danh sách 21/09 hai chỗ — `tai_khoan.person_id` của `34` và
--   `de_nghi_quan_he.person_id` của `33`): tree_persons · unions.partners ·
--   unions.partner_order · unions.ranks (khoá) · union_children.person_id ·
--   media.subject_id · trees.root_person_id · branches.root_person_id ·
--   tree_members.person_id · user_settings.focus_person_id ·
--   de_xuat_gan_nguoi.person_id · tai_khoan.person_id · de_nghi_quan_he.person_id.
--   `change_log` · `nhat_ky_he_thong` là LỊCH SỬ — cố ý không viết lại.
--   Thêm bảng nào mang mã người sau này thì thêm vào `gop_hai_nguoi()` mục 5.
--
-- ⚠ HÔN NHÂN TRÙNG: gộp ông X (cây A) với ông X' (cây B) xong, gộp tiếp bà
--   vợ W/W' thì X có hai hôn nhân cùng với W — trigger `31` CHẶN mọi quan hệ
--   trùng mới sinh, kể cả của QTHT. Nên hàm gộp TỰ GỘP LUÔN hôn nhân có cùng
--   bộ vợ/chồng (mã hôn nhân nhỏ hơn ở lại, con + ảnh cưới chuyển sang, trường
--   trống lấy của bên bỏ). Thứ tự trong hàm là cố ý: đặt `deleted` cho hôn
--   nhân bỏ TRƯỚC, rồi mới đổi vợ/chồng và chuyển con — ngược lại thì `31`
--   thấy hai hôn nhân sống cùng nối một cặp và từ chối.
-- ⚠ Quan hệ trùng KHÁC loại (con của A ở hôn nhân A+B, bản trùng là con của A
--   ở hôn nhân A một mình) thì KHÔNG tự đoán: `31` chặn, duyệt trả câu báo,
--   cả lần gộp lùi lại nguyên vẹn. QTHT gộp người liên quan trước hoặc gỡ
--   quan hệ thừa bằng *Đề nghị sửa quan hệ* (`33`).
-- ⚠ Nhật ký ghi `trang_thai = 'duyet'` → nút hoàn tác không chạm tới (nếp
--   `33`). `truoc` giữ ảnh chụp đủ để khôi phục tay. Mọi bản ghi bị đụng tăng
--   `revision` (trigger `26`) + mọi cây dính vào tăng số → tab đang mở bị buộc
--   tải lại; từ chối một lần lưu CŨ chạm người đã gộp bị `ban_ghi_lech_so()`
--   chặn (đo ở `do-b146.mjs` phần H).

begin;

-- ⚠ HÀNG RÀO THỨ TỰ DÁN — nếp `37`: báo đúng file thiếu thay vì câu Postgres
--   khó hiểu giữa chừng.
do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'hon_nhan_da_noi') then
    raise exception 'DỪNG: chưa dán 31-khoa-quan-he-trung.sql.';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'tai_khoan'
                    and column_name = 'person_id') then
    raise exception 'DỪNG: chưa dán 34-gan-nguoi-tai-khoan.sql.';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'ghi_nhat_ky') then
    raise exception 'DỪNG: chưa dán 42-nhat-ky-he-thong.sql.';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'la_khach_cay') then
    raise exception 'DỪNG: chưa dán 47-cong-khai-theo-truong.sql.';
  end if;
end $$;

-- ============================================================
-- 1. BẢNG
-- ============================================================
create table if not exists public.bao_trung_nguoi (
  id         uuid primary key default gen_random_uuid(),
  ma_giu     text not null,
  ma_thua    text not null,
  -- `set null`, không `cascade`: dòng đã duyệt là con trỏ mã thua → mã giữ,
  -- xoá tài khoản người gửi không được xoá theo nó.
  user_id    uuid references auth.users(id) on delete set null,
  ly_do      text not null,
  trang_thai text not null default 'cho'
             check (trang_thai in ('cho', 'duyet', 'tu_choi')),
  tao_luc    timestamptz not null default now(),
  xet_boi    uuid references auth.users(id) on delete set null,
  xet_luc    timestamptz,
  loi_xet    text not null default '',
  ket_qua    jsonb not null default '{}'::jsonb,
  constraint bao_trung_hai_ma_khac check (ma_giu <> ma_thua)
);

comment on table public.bao_trung_nguoi is
  'Báo trùng người (b146). Máy chọn mã giữ = mã nhỏ hơn. Chỉ QTHT duyệt; duyệt '
  'là máy chủ tự gộp. Dòng duyet = con trỏ ma_thua → ma_giu. Mọi đường vào '
  'bảng đi qua hàm security definer của 48.';

create unique index if not exists bao_trung_mot_cap_cho
  on public.bao_trung_nguoi (ma_giu, ma_thua)
  where trang_thai = 'cho';

create index if not exists bao_trung_theo_trang_thai
  on public.bao_trung_nguoi (trang_thai, tao_luc desc);

-- ⚠ Bật RLS, KHÔNG viết policy nào = cấm select/ghi thẳng (nếp `21`, `33`).
alter table public.bao_trung_nguoi enable row level security;

-- ============================================================
-- 2. HÀM PHỤ — không ai ngoài hàm của file này gọi được
-- ============================================================

-- Mã nào "nhỏ hơn": so SỐ, không so chữ (`P9999` < `P10000`). Cùng số thì so chữ.
create or replace function public.cap_giu_thua(p_a text, p_b text, out giu text, out thua text)
language sql
immutable
set search_path = public, pg_temp
as $$
  select case when x.a_nho then p_a else p_b end,
         case when x.a_nho then p_b else p_a end
    from (select (coalesce(nullif(regexp_replace(p_a, '\D', '', 'g'), '')::numeric, 0),
                  p_a)
               < (coalesce(nullif(regexp_replace(p_b, '\D', '', 'g'), '')::numeric, 0),
                  p_b) as a_nho) x;
$$;

-- Giá trị jsonb "trống": null · "" · {} · [].
create or replace function public.jsonb_trong(p jsonb)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select p is null or p = 'null'::jsonb or p = '""'::jsonb
      or p = '{}'::jsonb or p = '[]'::jsonb;
$$;

-- Gộp hai đối tượng jsonb theo luật "bên giữ trống thì lấy bên thua", TỪNG
-- KHOÁ một (ngày sinh bên giữ có năm mà thiếu nơi sinh → lấy nơi sinh bên thua).
-- Không phải đối tượng (mảng `names`…) thì lấy nguyên bên giữ, trừ khi trống.
create or replace function public.gop_jsonb(p_giu jsonb, p_thua jsonb)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when public.jsonb_trong(p_giu) then p_thua
    when jsonb_typeof(p_giu) = 'object' and jsonb_typeof(p_thua) = 'object' then
      p_thua || coalesce((select jsonb_object_agg(k, v) from jsonb_each(p_giu) e(k, v)
                           where not public.jsonb_trong(v)), '{}'::jsonb)
    else p_giu
  end;
$$;

-- Hai người có đang nối THẲNG với nhau không (vợ/chồng, cha mẹ–con) — một
-- người không thể là vợ hay con của chính mình. Trả mã hôn nhân, null = không.
create or replace function public.noi_thang_nhau(p_a text, p_b text)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.hon_nhan_da_noi(null, p_a, p_b);
$$;

-- Tóm tắt một người cho bảng duyệt: tên · năm · cây · số quan hệ · tài khoản.
-- `p_moi_cay` = true thì kể mọi cây (QTHT), không thì chỉ cây người gọi xem được.
create or replace function public.tom_tat_nguoi(p_id text, p_moi_cay boolean)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id',      p.id,
    'ten',     coalesce(nullif(public.ten_day_du(p.names), ''), p.id),
    'gioi',    p.sex,
    'namSinh', coalesce(left(nullif(p.birth->>'iso', ''), 4),
                        substring(coalesce(p.birth->>'raw', '') from '\d{4}'), ''),
    'namMat',  coalesce(left(nullif(p.death->>'iso', ''), 4),
                        substring(coalesce(p.death->>'raw', '') from '\d{4}'), ''),
    'daXoa',   coalesce(p.deleted, false),
    'gopVao',  coalesce(p.meta->>'gopVao', ''),
    'cacCay',  coalesce((select string_agg(t.name || ' (' || t.tree_code || ')', ' · ' order by t.name)
                           from public.tree_persons tp join public.trees t on t.id = tp.tree_id
                          where tp.person_id = p.id
                            and (p_moi_cay or tp.tree_id in (select public.ds_cay_xem_duoc()))), ''),
    'soVoChong', (select count(*) from public.unions u
                   where not coalesce(u.deleted, false) and p.id = any(u.partners)),
    'soCon',   (select count(distinct c.person_id) from public.unions u
                  join public.union_children c on c.union_id = u.id
                 where not coalesce(u.deleted, false) and p.id = any(u.partners)),
    'soChaMe', (select count(*) from public.union_children c
                  join public.unions u on u.id = c.union_id
                 where c.person_id = p.id and not coalesce(u.deleted, false)),
    'coTaiKhoan', exists (select 1 from public.tai_khoan k where k.person_id = p.id)
  )
  from public.persons p where p.id = p_id;
$$;

revoke all on function public.cap_giu_thua(text, text)      from public, anon, authenticated;
revoke all on function public.jsonb_trong(jsonb)            from public, anon, authenticated;
revoke all on function public.gop_jsonb(jsonb, jsonb)       from public, anon, authenticated;
revoke all on function public.noi_thang_nhau(text, text)    from public, anon, authenticated;
revoke all on function public.tom_tat_nguoi(text, boolean)  from public, anon, authenticated;

-- ============================================================
-- 3. GỘP — gop_hai_nguoi(): việc thật, KHÔNG ai gọi thẳng được
-- ============================================================
-- Ném lỗi khi không gộp được; `duyet_bao_trung()` bắt lỗi ấy và cả lần gộp
-- lùi lại nguyên vẹn (khối `exception` của plpgsql là một giao dịch con).
create or replace function public.gop_hai_nguoi(p_giu text, p_thua text, p_bao uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_email   text := coalesce(auth.jwt() ->> 'email', '');
  v_g       public.persons%rowtype;
  v_t       public.persons%rowtype;
  v_ten_g   text;
  v_ten_t   text;
  v_tk_g    uuid;
  v_tk_t    uuid;
  v_cac_cay uuid[];
  v_truoc   jsonb;
  v_hn_gop  jsonb := '[]'::jsonb;
  v_u       public.unions%rowtype;
  v_moi     text[];
  v_trung   text;
  v_hn_giu  text;
  v_hn_bo   text;
  v_c       record;
  v_cay     uuid;
  v_rev     integer;
  v_mo_ta   text;
begin
  -- ── 1. Hai bản ghi, khoá lại. Thứ tự khoá theo mã → hai lần gộp chéo
  --       nhau không kẹt nhau.
  perform 1 from public.persons where id in (p_giu, p_thua) order by id for update;
  select * into v_g from public.persons where id = p_giu;
  select * into v_t from public.persons where id = p_thua;
  if v_g.id is null or v_t.id is null or coalesce(v_g.deleted, false) or coalesce(v_t.deleted, false) then
    raise exception 'Một trong hai người không còn (đã xoá, hoặc đã gộp vào người khác từ trước).'
      using errcode = 'GP422', hint = 'khongcon';
  end if;
  v_ten_g := coalesce(nullif(public.ten_day_du(v_g.names), ''), p_giu);
  v_ten_t := coalesce(nullif(public.ten_day_du(v_t.names), ''), p_thua);

  if public.noi_thang_nhau(p_giu, p_thua) is not null then
    raise exception '% và % đang là vợ chồng hoặc cha mẹ – con của nhau trong sơ đồ (gia đình %) — một người không thể là vợ hay con của chính mình. Gỡ quan hệ ấy trước.',
      v_ten_g, v_ten_t, public.noi_thang_nhau(p_giu, p_thua)
      using errcode = 'GP422', hint = 'noithang';
  end if;

  select user_id into v_tk_g from public.tai_khoan where person_id = p_giu;
  select user_id into v_tk_t from public.tai_khoan where person_id = p_thua;
  if v_tk_g is not null and v_tk_t is not null then
    raise exception 'Cả % và % đều đang gắn với một tài khoản (hai tài khoản khác nhau). Mỗi người chỉ gắn được một tài khoản — gỡ một liên kết ở trang Tài khoản trước rồi gộp.',
      v_ten_g, v_ten_t
      using errcode = 'GP422', hint = 'haitaikhoan';
  end if;

  v_cac_cay := array(select distinct tree_id from public.tree_persons
                      where person_id in (p_giu, p_thua));

  -- ── 2. Ảnh chụp TRƯỚC — đủ để khôi phục tay (nút hoàn tác không chạm tới).
  v_truoc := jsonb_build_object(
    'persons',     jsonb_build_array(to_jsonb(v_g), to_jsonb(v_t)),
    'unions',      coalesce((select jsonb_agg(to_jsonb(u)) from public.unions u
                              where p_giu = any(u.partners) or p_thua = any(u.partners)), '[]'::jsonb),
    'children',    coalesce((select jsonb_agg(to_jsonb(c)) from public.union_children c
                              where c.person_id in (p_giu, p_thua)
                                 or c.union_id in (select u.id from public.unions u
                                                    where p_giu = any(u.partners) or p_thua = any(u.partners))),
                            '[]'::jsonb),
    'media',       coalesce((select jsonb_agg(to_jsonb(m)) from public.media m
                              where m.subject_id = p_thua
                                 or m.subject_id in (select u.id from public.unions u
                                                      where p_giu = any(u.partners) or p_thua = any(u.partners))),
                            '[]'::jsonb),
    'treePersons', coalesce((select jsonb_agg(to_jsonb(tp)) from public.tree_persons tp
                              where tp.person_id in (p_giu, p_thua)), '[]'::jsonb),
    'taiKhoanThua', v_tk_t);

  -- ── 3. Bên giữ: trường trống lấy của bên thua. Không nhắc `revision` →
  --       trigger `26` tự tăng số, tab cũ gửi số cũ bị chặn.
  update public.persons set
    names         = case when public.jsonb_trong(names) then v_t.names else names end,
    sex           = case when coalesce(sex, 'U') = 'U' then coalesce(v_t.sex, 'U') else sex end,
    birth         = public.gop_jsonb(birth, v_t.birth),
    death         = public.gop_jsonb(death, v_t.death),
    burial_place  = coalesce(nullif(burial_place, ''), v_t.burial_place),
    title         = coalesce(nullif(title, ''), v_t.title),
    occupation    = coalesce(nullif(occupation, ''), v_t.occupation),
    education     = coalesce(nullif(education, ''), v_t.education),
    religion      = coalesce(nullif(religion, ''), v_t.religion),
    residence     = coalesce(nullif(residence, ''), v_t.residence),
    nationality   = coalesce(nullif(nationality, ''), v_t.nationality),
    note          = coalesce(nullif(note, ''), v_t.note),
    photo_file_id = coalesce(nullif(photo_file_id, ''), v_t.photo_file_id),
    branch_id     = coalesce(nullif(branch_id, ''), v_t.branch_id),
    -- Một bên đã ghi là mất thì người ấy đã mất — chuyện không đảo được.
    living        = case when living = false or v_t.living = false then false
                         else coalesce(living, v_t.living) end,
    vn            = public.gop_jsonb(vn, v_t.vn)
  where id = p_giu;

  -- ── 4. Hôn nhân có bên thua làm vợ/chồng.
  for v_u in select * from public.unions
              where p_thua = any(partners) and not coalesce(deleted, false)
              order by id loop
    v_moi := array_replace(v_u.partners, p_thua, p_giu);
    -- Hôn nhân SỐNG khác có đúng bộ vợ/chồng ấy = hôn nhân trùng.
    select u.id into v_trung from public.unions u
     where u.id <> v_u.id and not coalesce(u.deleted, false)
       and (select array_agg(x order by x) from unnest(u.partners) x)
         = (select array_agg(x order by x) from unnest(v_moi) x)
     order by u.id limit 1;

    if v_trung is null then
      update public.unions
         set partners      = v_moi,
             partner_order = array_replace(partner_order, p_thua, p_giu),
             ranks         = case when coalesce(ranks, '{}'::jsonb) ? p_thua
                                  then (ranks - p_thua) || jsonb_build_object(p_giu, ranks -> p_thua)
                                  else ranks end
       where id = v_u.id;
    else
      select giu, thua into v_hn_giu, v_hn_bo from public.cap_giu_thua(v_u.id, v_trung);
      -- ⚠ Đặt `deleted` cho hôn nhân BỎ TRƯỚC — xem đầu file.
      update public.unions
         set deleted       = true,
             partners      = array_replace(partners, p_thua, p_giu),
             partner_order = array_replace(partner_order, p_thua, p_giu),
             ranks         = case when coalesce(ranks, '{}'::jsonb) ? p_thua
                                  then (ranks - p_thua) || jsonb_build_object(p_giu, ranks -> p_thua)
                                  else ranks end
       where id = v_hn_bo;
      -- Hôn nhân GIỮ: vợ/chồng thành bộ mới (chỉ đổi khi nó là hôn nhân của
      -- bên thua), trường trống lấy của hôn nhân bỏ, thứ bậc bên giữ thắng.
      update public.unions g
         set partners      = v_moi,
             partner_order = array_replace(g.partner_order, p_thua, p_giu),
             ranks         = (select coalesce(b.ranks, '{}'::jsonb) - p_thua
                                     || case when coalesce(b.ranks, '{}'::jsonb) ? p_thua
                                             then jsonb_build_object(p_giu, b.ranks -> p_thua)
                                             else '{}'::jsonb end
                                from public.unions b where b.id = v_hn_bo)
                             || (coalesce(g.ranks, '{}'::jsonb) - p_thua
                                 || case when coalesce(g.ranks, '{}'::jsonb) ? p_thua
                                         then jsonb_build_object(p_giu, g.ranks -> p_thua)
                                         else '{}'::jsonb end),
             marriage      = public.gop_jsonb(g.marriage, (select b.marriage from public.unions b where b.id = v_hn_bo)),
             note          = coalesce(nullif(g.note, ''), (select b.note from public.unions b where b.id = v_hn_bo)),
             status        = case when coalesce(g.status, 'unknown') = 'unknown'
                                  then coalesce((select b.status from public.unions b where b.id = v_hn_bo), g.status)
                                  else g.status end
       where g.id = v_hn_giu;
      -- Con của hôn nhân bỏ sang hôn nhân giữ; con đã có ở cả hai thì bỏ dòng thừa.
      for v_c in select * from public.union_children where union_id = v_hn_bo order by ord, person_id loop
        if exists (select 1 from public.union_children
                    where union_id = v_hn_giu and person_id = v_c.person_id) then
          delete from public.union_children where union_id = v_hn_bo and person_id = v_c.person_id;
        else
          update public.union_children
             set union_id = v_hn_giu,
                 ord      = coalesce((select max(ord) from public.union_children
                                       where union_id = v_hn_giu), 0) + 1
           where union_id = v_hn_bo and person_id = v_c.person_id;
        end if;
      end loop;
      -- Ảnh cưới đi theo (`DAC-TA-GOP` hỏi mỗi lần; ở đây CHUYỂN — không mất gì).
      update public.media set subject_id = v_hn_giu where subject_id = v_hn_bo;
      v_hn_gop := v_hn_gop || jsonb_build_object('giu', v_hn_giu, 'bo', v_hn_bo);
    end if;
  end loop;

  -- Hôn nhân ĐÃ XOÁ có bên thua: thay mã cho khỏi trỏ vào bản ghi đã gộp.
  -- `31` bỏ qua hôn nhân `deleted`, nên không sinh lỗi quan hệ trùng.
  update public.unions
     set partners      = array_replace(partners, p_thua, p_giu),
         partner_order = array_replace(partner_order, p_thua, p_giu),
         ranks         = case when coalesce(ranks, '{}'::jsonb) ? p_thua
                              then (ranks - p_thua) || jsonb_build_object(p_giu, ranks -> p_thua)
                              else ranks end
   where p_thua = any(partners) and coalesce(deleted, false);

  -- ── 5. Mười hai chỗ còn lại mang mã người — xem danh sách đầu file.
  -- Con: bên thua là con của một gia đình. Đã có bên giữ ở đó → dòng thừa.
  for v_c in select * from public.union_children where person_id = p_thua loop
    if exists (select 1 from public.union_children
                where union_id = v_c.union_id and person_id = p_giu) then
      delete from public.union_children where union_id = v_c.union_id and person_id = p_thua;
    else
      update public.union_children set person_id = p_giu
       where union_id = v_c.union_id and person_id = p_thua;
    end if;
  end loop;

  insert into public.tree_persons (tree_id, person_id)
  select tree_id, p_giu from public.tree_persons where person_id = p_thua
  on conflict do nothing;
  delete from public.tree_persons where person_id = p_thua;

  update public.media          set subject_id      = p_giu where subject_id      = p_thua;
  update public.trees          set root_person_id  = p_giu where root_person_id  = p_thua;
  update public.branches       set root_person_id  = p_giu where root_person_id  = p_thua;
  update public.tree_members   set person_id       = p_giu where person_id       = p_thua;
  update public.user_settings  set focus_person_id = p_giu where focus_person_id = p_thua;
  update public.de_xuat_gan_nguoi set person_id    = p_giu where person_id       = p_thua;
  if v_tk_t is not null then
    update public.tai_khoan set person_id = p_giu where user_id = v_tk_t;
  end if;
  -- Đề nghị gỡ quan hệ: đơn đang chờ mà bên giữ đã có đúng đơn ấy thì đơn
  -- của bên thua thành thừa — đóng lại, đừng để chỉ mục "một đơn chờ" nổ.
  update public.de_nghi_quan_he d
     set trang_thai = 'tu_choi', xet_boi = auth.uid(), xet_luc = now(),
         loi_xet = 'Tự đóng: ' || p_thua || ' đã gộp vào ' || p_giu || ', đơn trùng với đơn đang chờ.'
   where d.person_id = p_thua and d.trang_thai = 'cho'
     and exists (select 1 from public.de_nghi_quan_he e
                  where e.trang_thai = 'cho' and e.person_id = p_giu
                    and e.loai = d.loai and e.union_id = d.union_id);
  update public.de_nghi_quan_he set person_id = p_giu where person_id = p_thua;

  -- ── 6. Bên thua: đặt cờ xoá + con trỏ. Không xoá cứng.
  update public.persons
     set deleted = true,
         meta    = coalesce(meta, '{}'::jsonb)
                   || jsonb_build_object('gopVao', p_giu, 'gopLuc', now(), 'gopBoi', v_email)
   where id = p_thua;

  -- ── 7. Nhật ký mọi cây dính vào + tăng số cây.
  v_mo_ta := 'Gộp ' || v_ten_t || ' (' || p_thua || ') vào ' || v_ten_g || ' (' || p_giu || ')'
             || case when jsonb_array_length(v_hn_gop) > 0
                     then ' · gộp kèm ' || jsonb_array_length(v_hn_gop) || ' hôn nhân trùng'
                     else '' end;
  foreach v_cay in array coalesce(v_cac_cay, '{}') loop
    update public.trees
       set revision = revision + 1, updated_at = now(), updated_by = v_email
     where id = v_cay
    returning revision into v_rev;

    insert into public.change_log (tree_id, by_email, user_id, action, target, note,
                                   diff, revision, truoc, trang_thai, duyet_boi, duyet_luc)
    values (v_cay, v_email, auth.uid(), 'gop_nguoi', p_giu, v_mo_ta,
            jsonb_build_object('baoTrung', p_bao, 'maGiu', p_giu, 'maThua', p_thua,
                               'hnGop', v_hn_gop),
            v_rev, v_truoc, 'duyet', v_email, now());
  end loop;

  perform public.ghi_nhat_ky('tree', 'gop_nguoi', v_ten_g || ' (' || p_giu || ')',
    jsonb_build_object('ma_giu', p_giu, 'ma_thua', p_thua, 'ten_thua', v_ten_t,
                       'hn_gop', v_hn_gop, 'so_cay', coalesce(cardinality(v_cac_cay), 0)));

  return jsonb_build_object('ok', true, 'moTa', v_mo_ta, 'maGiu', p_giu, 'maThua', p_thua,
                            'hnGop', v_hn_gop, 'soCay', coalesce(cardinality(v_cac_cay), 0));
end;
$$;

revoke all on function public.gop_hai_nguoi(text, text, uuid) from public, anon, authenticated;

-- ============================================================
-- 4. TÌM — tim_nguoi_bao_trung(): ô gợi ý của form báo trùng
-- ============================================================
-- Chép nếp `tim_nguoi_moi_cay()` (`28`), đổi hai chỗ: tìm trong MỌI người
-- người gọi xem được (`ds_nguoi_xem_duoc()`, QTHT: mọi người) và KHÔNG loại
-- cây nào — hai người trùng có thể cùng một cây.
create or replace function public.tim_nguoi_bao_trung(p_chuoi text)
returns table(id text, ten text, nam_sinh text, nam_mat text, gioi text, cac_cay text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with tim as (
    select public.bo_dau(btrim(coalesce(p_chuoi, ''))) as chuoi,
           coalesce(public.la_quan_tri_he_thong(), false) as qtht
  ),
  tach as (
    select chuoi, qtht, regexp_split_to_array(chuoi, '\s+') as tu from tim
  )
  select p.id,
         coalesce(nullif(public.ten_day_du(p.names), ''), p.id),
         coalesce(left(nullif(p.birth->>'iso', ''), 4),
                  substring(coalesce(p.birth->>'raw', '') from '\d{4}'), ''),
         coalesce(left(nullif(p.death->>'iso', ''), 4),
                  substring(coalesce(p.death->>'raw', '') from '\d{4}'), ''),
         p.sex,
         coalesce((select string_agg(t.name, ' · ' order by t.name)
                     from public.tree_persons tp
                     join public.trees t on t.id = tp.tree_id
                    where tp.person_id = p.id
                      and (tach.qtht or tp.tree_id in (select public.ds_cay_xem_duoc()))), '')
    from public.persons p
    cross join tach
   where not coalesce(p.deleted, false)
     and auth.uid() is not null
     and length(tach.chuoi) >= 2
     and (tach.qtht or p.id in (select public.ds_nguoi_xem_duoc()))
     and exists (select 1 from public.tree_persons tp where tp.person_id = p.id)
     and (
       select bool_and(position(w in public.bo_dau(public.ten_day_du(p.names) || ' ' || p.id)) > 0)
         from unnest(tach.tu) as w
     )
   order by
     case
       when lower(p.id) = tach.chuoi then 0
       when left(public.bo_dau(public.ten_day_du(p.names)), length(tach.chuoi)) = tach.chuoi then 1
       else 2
     end,
     coalesce(nullif(public.ten_day_du(p.names), ''), p.id)
   limit 10;
$$;

-- ============================================================
-- 5. NỘP — nop_bao_trung()
-- ============================================================
-- Không có tham số người nộp: đơn luôn là của `auth.uid()`. Không cần
-- `tree_id`: báo trùng là chuyện của hai NGƯỜI, không của cây đang mở.
create or replace function public.nop_bao_trung(p_x text, p_y text, p_ly_do text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_toi   uuid := auth.uid();
  v_x     text := upper(btrim(coalesce(p_x, '')));
  v_y     text := upper(btrim(coalesce(p_y, '')));
  v_ly_do text := left(btrim(coalesce(p_ly_do, '')), 1000);
  v_qtht  boolean := coalesce(public.la_quan_tri_he_thong(), false);
  v_giu   text;
  v_thua  text;
  v_hn    text;
  v_id    uuid;
begin
  if v_toi is null then
    return jsonb_build_object('ok', false, 'loi', 'Chưa đăng nhập nên chưa gửi được.');
  end if;
  if v_x = '' or v_y = '' then
    return jsonb_build_object('ok', false, 'loi', 'Chọn đủ hai người.');
  end if;
  if v_x = v_y then
    return jsonb_build_object('ok', false, 'loi', 'Hai ô đang chọn cùng một người.');
  end if;
  if v_ly_do = '' then
    return jsonb_build_object('ok', false, 'loi',
      'Cần ghi lý do (vì sao là một người) — Quản trị hệ thống đọc nó để quyết định.');
  end if;

  -- Xem được cả hai — cùng một câu cho "không có" và "không được xem", để
  -- không ai dò được mã người ở cây kín bằng cách gửi báo trùng.
  if (select count(*) from public.persons p
       where p.id in (v_x, v_y) and not coalesce(p.deleted, false)
         and (v_qtht or p.id in (select public.ds_nguoi_xem_duoc()))) <> 2 then
    return jsonb_build_object('ok', false, 'loi',
      'Không tìm thấy một trong hai người, hoặc bạn chưa là thành viên của gia phả chứa người ấy.');
  end if;

  v_hn := public.noi_thang_nhau(v_x, v_y);
  if v_hn is not null then
    return jsonb_build_object('ok', false, 'lyDo', 'noithang', 'loi',
      'Hai người này đang là vợ chồng hoặc cha mẹ – con của nhau (gia đình ' || v_hn
      || ') — một người không thể là vợ hay con của chính mình. Nếu quan hệ ấy sai, gửi Đề nghị sửa quan hệ.');
  end if;

  select giu, thua into v_giu, v_thua from public.cap_giu_thua(v_x, v_y);
  begin
    insert into public.bao_trung_nguoi (ma_giu, ma_thua, user_id, ly_do)
    values (v_giu, v_thua, v_toi, v_ly_do)
    returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'lyDo', 'dachodoi', 'loi',
      'Đã có người báo đúng hai người này, đang chờ Quản trị hệ thống xét.');
  end;

  return jsonb_build_object('ok', true, 'id', v_id, 'maGiu', v_giu, 'maThua', v_thua);
end;
$$;

-- ============================================================
-- 6. RÚT ĐƠN CỦA CHÍNH MÌNH — rut_bao_trung()
-- ============================================================
create or replace function public.rut_bao_trung(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  n integer;
begin
  delete from public.bao_trung_nguoi
   where id = p_id and user_id = auth.uid() and trang_thai = 'cho';
  get diagnostics n = row_count;
  if n = 0 then
    return jsonb_build_object('ok', false, 'loi', 'Không có báo trùng đang chờ nào của bạn mang mã này.');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- 7. DANH SÁCH — ds_bao_trung()
-- ============================================================
-- `p_cua_toi` = false và là QTHT: mọi báo trùng ĐANG CHỜ (bảng duyệt).
-- Còn lại: báo trùng CỦA MÌNH, 200 gần nhất, mọi trạng thái (để biết kết quả).
create or replace function public.ds_bao_trung(p_cua_toi boolean default false)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with ai as (
    select coalesce(public.la_quan_tri_he_thong(), false) as qtht
  )
  select coalesce(jsonb_agg(d order by d->>'taoLuc' desc), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id',        b.id,
      'maGiu',     b.ma_giu,
      'maThua',    b.ma_thua,
      'giu',       public.tom_tat_nguoi(b.ma_giu, ai.qtht),
      'thua',      public.tom_tat_nguoi(b.ma_thua, ai.qtht),
      'lyDo',      b.ly_do,
      'trangThai', b.trang_thai,
      'taoLuc',    b.tao_luc,
      'xetLuc',    b.xet_luc,
      'loiXet',    b.loi_xet,
      'nguoiGui',  (select a.email from auth.users a where a.id = b.user_id),
      'cuaToi',    b.user_id = auth.uid()
    ) as d
      from public.bao_trung_nguoi b, ai
     where case when ai.qtht and not coalesce(p_cua_toi, false)
                then b.trang_thai = 'cho'
                else b.user_id = auth.uid() end
     order by b.tao_luc desc
     limit 200
  ) q
  where auth.uid() is not null;
$$;

-- ============================================================
-- 8. DUYỆT — duyet_bao_trung(): máy chủ tự gộp
-- ============================================================
create or replace function public.duyet_bao_trung(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_b    public.bao_trung_nguoi%rowtype;
  v_kq   jsonb;
  v_r    record;
  v_giu  text;
  v_thua text;
  v_hint text;
begin
  if not coalesce(public.la_quan_tri_he_thong(), false) then
    return jsonb_build_object('ok', false, 'loi', 'Chỉ Quản trị hệ thống duyệt được báo trùng.');
  end if;

  select * into v_b from public.bao_trung_nguoi
   where id = p_id and trang_thai = 'cho' for update;
  if not found then
    return jsonb_build_object('ok', false, 'loi', 'Báo trùng này không còn chờ duyệt.');
  end if;

  begin
    v_kq := public.gop_hai_nguoi(v_b.ma_giu, v_b.ma_thua, v_b.id);
  exception when others then
    -- Cả lần gộp đã lùi lại nguyên vẹn (giao dịch con). Đơn vẫn chờ.
    get stacked diagnostics v_hint = pg_exception_hint;
    return jsonb_build_object('ok', false, 'lyDo', coalesce(nullif(v_hint, ''), 'loi'),
      'loi', case when v_hint = 'quanhetrung'
                  then 'Chưa gộp được — gộp xong sẽ sinh quan hệ trùng: ' || sqlerrm
                       || ' Gộp người/gia đình liên quan trước, hoặc gỡ quan hệ thừa bằng Đề nghị sửa quan hệ. Không có gì bị đổi.'
                  else 'Chưa gộp được: ' || sqlerrm || ' Không có gì bị đổi.' end);
  end;

  update public.bao_trung_nguoi
     set trang_thai = 'duyet', xet_boi = auth.uid(), xet_luc = now(), ket_qua = v_kq
   where id = v_b.id;

  -- Báo trùng KHÁC đang chờ mà nhắc bên thua: chuyển sang bên giữ. Thành
  -- "cùng một người" thì đóng; trùng một đơn đang chờ khác thì đóng.
  for v_r in select * from public.bao_trung_nguoi
              where trang_thai = 'cho' and v_b.ma_thua in (ma_giu, ma_thua) loop
    select giu, thua into v_giu, v_thua
      from public.cap_giu_thua(
             case when v_r.ma_giu  = v_b.ma_thua then v_b.ma_giu else v_r.ma_giu  end,
             case when v_r.ma_thua = v_b.ma_thua then v_b.ma_giu else v_r.ma_thua end);
    if v_giu = v_thua or exists (select 1 from public.bao_trung_nguoi e
                                  where e.trang_thai = 'cho' and e.id <> v_r.id
                                    and e.ma_giu = v_giu and e.ma_thua = v_thua) then
      update public.bao_trung_nguoi
         set trang_thai = 'tu_choi', xet_boi = auth.uid(), xet_luc = now(),
             loi_xet = 'Tự đóng: ' || v_b.ma_thua || ' đã gộp vào ' || v_b.ma_giu
                       || case when v_giu = v_thua then ' — hai người nay là một.'
                               else ' — trùng một báo trùng khác đang chờ.' end
       where id = v_r.id;
    else
      update public.bao_trung_nguoi set ma_giu = v_giu, ma_thua = v_thua where id = v_r.id;
    end if;
  end loop;

  return v_kq;
end;
$$;

-- ============================================================
-- 9. TỪ CHỐI — tu_choi_bao_trung()
-- ============================================================
create or replace function public.tu_choi_bao_trung(p_id uuid, p_ly_do text default '')
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  n integer;
begin
  if not coalesce(public.la_quan_tri_he_thong(), false) then
    return jsonb_build_object('ok', false, 'loi', 'Chỉ Quản trị hệ thống từ chối được báo trùng.');
  end if;
  update public.bao_trung_nguoi
     set trang_thai = 'tu_choi', xet_boi = auth.uid(), xet_luc = now(),
         loi_xet = left(btrim(coalesce(p_ly_do, '')), 1000)
   where id = p_id and trang_thai = 'cho';
  get diagnostics n = row_count;
  if n = 0 then
    return jsonb_build_object('ok', false, 'loi', 'Báo trùng này không còn chờ duyệt.');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- 10. QUYỀN GỌI — chỉ người đã đăng nhập
-- ============================================================
-- ⚠ `drop function` xoá cả `grant` — file này chỉ `create or replace`, nên
--   dán lại không mất quyền; vẫn ghi đủ cho lần dán đầu.
revoke all on function public.tim_nguoi_bao_trung(text)         from public, anon;
revoke all on function public.nop_bao_trung(text, text, text)   from public, anon;
revoke all on function public.rut_bao_trung(uuid)               from public, anon;
revoke all on function public.ds_bao_trung(boolean)             from public, anon;
revoke all on function public.duyet_bao_trung(uuid)             from public, anon;
revoke all on function public.tu_choi_bao_trung(uuid, text)     from public, anon;
grant execute on function public.tim_nguoi_bao_trung(text)       to authenticated;
grant execute on function public.nop_bao_trung(text, text, text) to authenticated;
grant execute on function public.rut_bao_trung(uuid)             to authenticated;
grant execute on function public.ds_bao_trung(boolean)           to authenticated;
grant execute on function public.duyet_bao_trung(uuid)           to authenticated;
grant execute on function public.tu_choi_bao_trung(uuid, text)   to authenticated;

commit;

-- ============================================================
-- 11. TỰ KIỂM — đọc sau khi dán. Mọi dòng phải ĐẠT.
-- ============================================================
select 1 as stt, 'bảng bao_trung_nguoi bật RLS, không policy' as ten_kiem,
       case when (select c.relrowsecurity from pg_class c join pg_namespace s on s.oid = c.relnamespace
                   where s.nspname = 'public' and c.relname = 'bao_trung_nguoi')
             and (select count(*) from pg_policies
                   where schemaname = 'public' and tablename = 'bao_trung_nguoi') = 0
            then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'sáu hàm authenticated gọi được',
       case when (select count(*) from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                   where s.nspname = 'public'
                     and p.proname in ('tim_nguoi_bao_trung', 'nop_bao_trung', 'rut_bao_trung',
                                       'ds_bao_trung', 'duyet_bao_trung', 'tu_choi_bao_trung')
                     and has_function_privilege('authenticated', p.oid, 'execute')) = 6
            then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'anon không gọi được hàm nào của 48',
       case when (select count(*) from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                   where s.nspname = 'public'
                     and p.proname in ('tim_nguoi_bao_trung', 'nop_bao_trung', 'rut_bao_trung',
                                       'ds_bao_trung', 'duyet_bao_trung', 'tu_choi_bao_trung',
                                       'gop_hai_nguoi', 'tom_tat_nguoi', 'noi_thang_nhau',
                                       'cap_giu_thua', 'gop_jsonb', 'jsonb_trong')
                     and has_function_privilege('anon', p.oid, 'execute')) = 0
            then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'hàm gộp KHÔNG gọi thẳng được (authenticated)',
       case when not has_function_privilege('authenticated',
                       'public.gop_hai_nguoi(text, text, uuid)', 'execute')
            then 'ĐẠT' else 'HỎNG' end
union all
select 5, 'mã nhỏ hơn giữ: P9999 thắng P10000',
       case when (select giu from public.cap_giu_thua('P10000', 'P9999')) = 'P9999'
            then 'ĐẠT' else 'HỎNG' end
order by 1;
