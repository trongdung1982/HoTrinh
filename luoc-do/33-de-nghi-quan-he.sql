-- ============================================================
-- giapha-supabase · luoc-do/33-de-nghi-quan-he.sql
-- Vai trò  : b127d-1 — ĐỀ NGHỊ CHỈNH SỬA QUAN HỆ, Quản trị hệ thống duyệt.
--            Bảng `de_nghi_quan_he` + năm hàm: nộp · rút · danh sách ·
--            duyệt · từ chối.
-- Chạy ở   : Supabase → SQL Editor. Chạy SAU `32-rao-cay-thep.sql`.
--            File này chỉ THÊM, không định nghĩa đè hàm nào của file khác —
--            không nằm trong chuỗi dán lại nào. Dán lại nhiều lần vẫn được.
-- Sổ tay   : so-tay/nguoi-xuyen-cay.md mục *Cách mở lại*
-- Phiên bản: 0.1.0 · Cập nhật: 25/09/2026
-- ============================================================
--
-- VÌ SAO: rào thép `32` chặn MỌI NGƯỜI, kể cả QTHT, sửa quan hệ có một đầu
-- ngoài cây; `31` chặn khai lại quan hệ đã có. Không cây nào chứa cả A lẫn B
-- thì không ai sửa tay được — nên duyệt ở đây là MÁY CHỦ TỰ THI HÀNH, không
-- phải lá thư. Chủ dự án chọn bản gọn 25/09/2026: hai loại, đều là GỠ.
--   · `go_con`      — gỡ `person_id` khỏi đàn con của `union_id`.
--   · `go_vo_chong` — gỡ `person_id` khỏi vợ/chồng của `union_id`. Con ở lại
--                     với người còn lại; hôn nhân còn một người mà không con
--                     thì xoá hẳn (đúng cách `luu_cay()` xoá hôn nhân).
-- Gỡ xong, quan hệ đúng khai lại theo đường thường.
--
-- LUẬT:
--   · Ai nộp: thành viên của cây, và quan hệ phải có ÍT NHẤT một đầu trong cây
--     ấy (không có thì người nộp không nhìn thấy nó để mà báo sai).
--   · Ai duyệt / từ chối: CHỈ QTHT. QTHT tự duyệt đề nghị của chính mình ĐƯỢC
--     — đây là sửa nội dung, không phải đặt quyền; mọi lần duyệt đều ghi
--     `change_log` ở mọi cây có người dính vào.
--   · Một quan hệ, một đề nghị đang chờ (chỉ mục có điều kiện) — ai gửi sau
--     được báo là đã có người gửi.
--   · Duyệt xong TĂNG số mọi cây dính vào: tab đang mở bị buộc tải lại trước
--     khi lưu (hàng rào 3 của `luu_cay()`), không ai ghi đè bằng bản cũ.
--   · Nhật ký ghi `trang_thai = 'duyet'`: hoàn tác (`tu_choi_thay_doi`) chỉ
--     chạm dòng `cho`, nên lần gỡ này KHÔNG hoàn tác được bằng nút — `truoc`
--     giữ nguyên dòng cũ để khôi phục tay nếu cần.
-- ============================================================

-- ============================================================
-- 1. BẢNG
-- ============================================================
create table if not exists public.de_nghi_quan_he (
  id         uuid primary key default gen_random_uuid(),
  tree_id    uuid not null references public.trees(id) on delete cascade,
  user_id    uuid not null references auth.users(id)   on delete cascade,
  loai       text not null check (loai in ('go_con', 'go_vo_chong')),
  union_id   text not null,
  person_id  text not null,
  ly_do      text not null,
  trang_thai text not null default 'cho'
             check (trang_thai in ('cho', 'duyet', 'tu_choi')),
  tao_luc    timestamptz not null default now(),
  xet_boi    uuid references auth.users(id) on delete set null,
  xet_luc    timestamptz,
  loi_xet    text not null default ''
);

comment on table public.de_nghi_quan_he is
  'Đề nghị gỡ một quan hệ đã khoá (b127d). Chỉ QTHT duyệt; duyệt là máy chủ '
  'tự gỡ. Mọi đường vào bảng đi qua hàm security definer của 33.';

create unique index if not exists de_nghi_quan_he_mot_don_cho
  on public.de_nghi_quan_he (loai, union_id, person_id)
  where trang_thai = 'cho';

create index if not exists de_nghi_quan_he_theo_trang_thai
  on public.de_nghi_quan_he (trang_thai, tao_luc desc);

-- ⚠ Bật RLS, KHÔNG viết policy nào = cấm select/ghi thẳng. Quên bật là bảng
--   mở toang cho mọi người đăng nhập (nếp `21`).
alter table public.de_nghi_quan_he enable row level security;

-- ============================================================
-- 2. NỘP — nop_de_nghi_quan_he()
-- ============================================================
-- Không có tham số người nộp: đơn luôn là của `auth.uid()`.
create or replace function public.nop_de_nghi_quan_he(
  p_tree   uuid,
  p_loai   text,
  p_union  text,
  p_person text,
  p_ly_do  text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_toi      uuid := auth.uid();
  v_ly_do    text := left(btrim(coalesce(p_ly_do, '')), 1000);
  v_partners text[];
  v_id       uuid;
begin
  if v_toi is null then
    return jsonb_build_object('ok', false, 'loi', 'Chưa đăng nhập nên chưa gửi được.');
  end if;

  if p_tree is null or not coalesce(public.la_thanh_vien(p_tree), false) then
    return jsonb_build_object('ok', false, 'loi',
      'Bạn chưa là thành viên của gia phả này nên chưa gửi đề nghị được.');
  end if;

  if coalesce(p_loai, '') not in ('go_con', 'go_vo_chong') then
    return jsonb_build_object('ok', false, 'loi', 'Loại đề nghị không hợp lệ.');
  end if;

  if v_ly_do = '' then
    return jsonb_build_object('ok', false, 'loi',
      'Cần ghi lý do — Quản trị hệ thống đọc nó để quyết định.');
  end if;

  select u.partners into v_partners
    from public.unions u
   where u.id = p_union and not coalesce(u.deleted, false);
  if v_partners is null then
    return jsonb_build_object('ok', false, 'loi',
      'Không tìm thấy quan hệ ' || coalesce(p_union, '') || ' — có thể vừa bị xoá. Tải lại trang.');
  end if;

  if p_loai = 'go_con' and not exists (
       select 1 from public.union_children c
        where c.union_id = p_union and c.person_id = p_person) then
    return jsonb_build_object('ok', false, 'loi',
      coalesce(p_person, '') || ' không phải con trong quan hệ ' || p_union || '.');
  end if;

  if p_loai = 'go_vo_chong' and not (
       coalesce(p_person = any(v_partners), false) and cardinality(v_partners) >= 2) then
    return jsonb_build_object('ok', false, 'loi',
      coalesce(p_person, '') || ' không phải vợ/chồng trong quan hệ ' || p_union
      || ' (hoặc quan hệ chỉ còn một người).');
  end if;

  -- Quan hệ phải chạm cây người nộp — không thì họ không thấy nó để báo sai.
  if not exists (select 1 from public.tree_persons tp
                  where tp.tree_id = p_tree
                    and tp.person_id = any(v_partners || p_person)) then
    return jsonb_build_object('ok', false, 'loi',
      'Quan hệ này không có ai thuộc gia phả đang mở.');
  end if;

  begin
    insert into public.de_nghi_quan_he (tree_id, user_id, loai, union_id, person_id, ly_do)
    values (p_tree, v_toi, p_loai, p_union, p_person, v_ly_do)
    returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'lyDo', 'dachodoi', 'loi',
      'Đã có người gửi đúng đề nghị này, đang chờ Quản trị hệ thống xét.');
  end;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

-- ============================================================
-- 3. RÚT ĐƠN CỦA CHÍNH MÌNH — rut_de_nghi_quan_he()
-- ============================================================
-- `delete`, không đánh dấu từ chối: tự rút không phải bị từ chối (nếp `21`).
create or replace function public.rut_de_nghi_quan_he(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  n integer;
begin
  delete from public.de_nghi_quan_he
   where id = p_id and user_id = auth.uid() and trang_thai = 'cho';
  get diagnostics n = row_count;
  if n = 0 then
    return jsonb_build_object('ok', false, 'loi',
      'Không có đề nghị đang chờ nào của bạn mang mã này.');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- 4. DANH SÁCH — ds_de_nghi_quan_he()
-- ============================================================
-- QTHT: mọi đề nghị ĐANG CHỜ. Người khác: đề nghị CỦA MÌNH (50 gần nhất, mọi
-- trạng thái — để biết kết quả). Tên người lấy lúc đọc, không chép vào bảng.
create or replace function public.ds_de_nghi_quan_he()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(d order by d->>'taoLuc' desc), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id',        n.id,
      'loai',      n.loai,
      'unionId',   n.union_id,
      'personId',  n.person_id,
      'tenNguoi',  (select public.ten_day_du(p.names) from public.persons p where p.id = n.person_id),
      'voChong',   (select coalesce(jsonb_agg(jsonb_build_object(
                             'id', x.ma,
                             'ten', (select public.ten_day_du(p.names) from public.persons p where p.id = x.ma))
                           order by x.thu), '[]'::jsonb)
                      from public.unions u, unnest(u.partners) with ordinality as x(ma, thu)
                     where u.id = n.union_id),
      'lyDo',      n.ly_do,
      'trangThai', n.trang_thai,
      'taoLuc',    n.tao_luc,
      'loiXet',    n.loi_xet,
      'treeId',    n.tree_id,
      'tenCay',    t.name,
      'maCay',     t.tree_code,
      'nguoiGui',  (select a.email from auth.users a where a.id = n.user_id),
      'cuaToi',    n.user_id = auth.uid()
    ) as d
      from public.de_nghi_quan_he n
      join public.trees t on t.id = n.tree_id
     where case when public.la_quan_tri_he_thong()
                then n.trang_thai = 'cho'
                else n.user_id = auth.uid() end
     order by n.tao_luc desc
     limit 200
  ) q
  where auth.uid() is not null;
$$;

-- ============================================================
-- 5. DUYỆT — duyet_de_nghi_quan_he(): máy chủ tự gỡ
-- ============================================================
create or replace function public.duyet_de_nghi_quan_he(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_email    text := coalesce(auth.jwt() ->> 'email', '');
  v_dn       public.de_nghi_quan_he%rowtype;
  v_u        public.unions%rowtype;
  v_moi      text[];
  v_truoc    jsonb;
  v_xoa_hn   boolean := false;
  v_cay      uuid;
  v_rev      integer;
  v_mo_ta    text;
  v_cac_cay  uuid[];
begin
  if not coalesce(public.la_quan_tri_he_thong(), false) then
    return jsonb_build_object('ok', false, 'loi', 'Chỉ Quản trị hệ thống duyệt được đề nghị này.');
  end if;

  select * into v_dn from public.de_nghi_quan_he
   where id = p_id and trang_thai = 'cho' for update;
  if not found then
    return jsonb_build_object('ok', false, 'loi', 'Đề nghị này không còn chờ duyệt.');
  end if;

  select * into v_u from public.unions
   where id = v_dn.union_id and not coalesce(deleted, false) for update;

  -- Quan hệ đã đổi từ lúc gửi → không tự đoán, bảo người xét từ chối.
  if not found
     or (v_dn.loai = 'go_con' and not exists (
           select 1 from public.union_children
            where union_id = v_dn.union_id and person_id = v_dn.person_id))
     or (v_dn.loai = 'go_vo_chong' and not (
           coalesce(v_dn.person_id = any(v_u.partners), false) and cardinality(v_u.partners) >= 2)) then
    return jsonb_build_object('ok', false, 'lyDo', 'dadoi', 'loi',
      'Quan hệ này đã đổi từ lúc gửi đề nghị (có thể đã có người sửa). Từ chối đề nghị này, '
      || 'nếu vẫn sai thì gửi lại.');
  end if;

  -- Cây dính vào: mọi cây có vợ/chồng của hôn nhân hoặc người bị gỡ.
  v_cac_cay := array(select distinct tp.tree_id from public.tree_persons tp
                      where tp.person_id = any(v_u.partners || v_dn.person_id));

  v_truoc := jsonb_build_object(
    'unions',   jsonb_build_array(to_jsonb(v_u)),
    'children', coalesce((select jsonb_agg(to_jsonb(c)) from public.union_children c
                           where c.union_id = v_u.id
                             and (v_dn.loai = 'go_vo_chong' or c.person_id = v_dn.person_id)),
                         '[]'::jsonb));

  if v_dn.loai = 'go_con' then
    delete from public.union_children
     where union_id = v_dn.union_id and person_id = v_dn.person_id;
    v_mo_ta := 'Gỡ ' || v_dn.person_id || ' khỏi đàn con của ' || v_dn.union_id;
  else
    v_moi := array_remove(v_u.partners, v_dn.person_id);
    v_xoa_hn := cardinality(v_moi) < 2
                and not exists (select 1 from public.union_children where union_id = v_u.id);
    if v_xoa_hn then
      delete from public.unions where id = v_u.id;
    else
      -- Không nhắc `revision` → trigger `26` tự tăng số, tab cũ gửi số cũ sẽ bị chặn.
      update public.unions
         set partners      = v_moi,
             partner_order = array_remove(partner_order, v_dn.person_id),
             ranks         = coalesce(ranks, '{}'::jsonb) - v_dn.person_id
       where id = v_u.id;
    end if;
    v_mo_ta := 'Gỡ ' || v_dn.person_id || ' khỏi vợ/chồng của ' || v_dn.union_id
               || case when v_xoa_hn then ' (hôn nhân chỉ còn một người, không con — đã xoá)' else '' end;
  end if;

  foreach v_cay in array v_cac_cay loop
    update public.trees
       set revision = revision + 1, updated_at = now(), updated_by = v_email
     where id = v_cay
    returning revision into v_rev;

    insert into public.change_log (tree_id, by_email, user_id, action, target, note,
                                   diff, revision, truoc, trang_thai, duyet_boi, duyet_luc)
    values (v_cay, v_email, auth.uid(), 'de_nghi_quan_he', v_dn.union_id,
            v_mo_ta || '. Lý do: ' || v_dn.ly_do,
            jsonb_build_object('deNghi', v_dn.id, 'loai', v_dn.loai,
                               'unionId', v_dn.union_id, 'personId', v_dn.person_id,
                               'nguoiGui', v_dn.user_id),
            v_rev, v_truoc, 'duyet', v_email, now());
  end loop;

  update public.de_nghi_quan_he
     set trang_thai = 'duyet', xet_boi = auth.uid(), xet_luc = now()
   where id = v_dn.id;

  return jsonb_build_object('ok', true, 'moTa', v_mo_ta,
                            'soCay', coalesce(cardinality(v_cac_cay), 0));
end;
$$;

-- ============================================================
-- 6. TỪ CHỐI — tu_choi_de_nghi_quan_he()
-- ============================================================
create or replace function public.tu_choi_de_nghi_quan_he(p_id uuid, p_ly_do text default '')
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
    return jsonb_build_object('ok', false, 'loi', 'Chỉ Quản trị hệ thống từ chối được đề nghị này.');
  end if;

  update public.de_nghi_quan_he
     set trang_thai = 'tu_choi', xet_boi = auth.uid(), xet_luc = now(),
         loi_xet = left(btrim(coalesce(p_ly_do, '')), 1000)
   where id = p_id and trang_thai = 'cho';
  get diagnostics n = row_count;
  if n = 0 then
    return jsonb_build_object('ok', false, 'loi', 'Đề nghị này không còn chờ duyệt.');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- 7. QUYỀN GỌI — chỉ người đã đăng nhập
-- ============================================================
revoke all on function public.nop_de_nghi_quan_he(uuid, text, text, text, text) from public, anon;
revoke all on function public.rut_de_nghi_quan_he(uuid)                         from public, anon;
revoke all on function public.ds_de_nghi_quan_he()                              from public, anon;
revoke all on function public.duyet_de_nghi_quan_he(uuid)                       from public, anon;
revoke all on function public.tu_choi_de_nghi_quan_he(uuid, text)               from public, anon;
grant execute on function public.nop_de_nghi_quan_he(uuid, text, text, text, text) to authenticated;
grant execute on function public.rut_de_nghi_quan_he(uuid)                         to authenticated;
grant execute on function public.ds_de_nghi_quan_he()                              to authenticated;
grant execute on function public.duyet_de_nghi_quan_he(uuid)                       to authenticated;
grant execute on function public.tu_choi_de_nghi_quan_he(uuid, text)               to authenticated;

-- ============================================================
-- 8. TỰ KIỂM — mong đợi: 1 | 0 | 5 | 0
--    bảng có · 0 policy (RLS cấm thẳng) · 5 hàm authenticated gọi được · anon gọi được 0 hàm
-- ============================================================
select
  (select count(*) from pg_class c join pg_namespace s on s.oid = c.relnamespace
    where s.nspname = 'public' and c.relname = 'de_nghi_quan_he' and c.relrowsecurity)
  || '|' ||
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'de_nghi_quan_he')
  || '|' ||
  (select count(*) from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname = 'public' and p.proname like '%de_nghi_quan_he'
      and has_function_privilege('authenticated', p.oid, 'execute'))
  || '|' ||
  (select count(*) from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname = 'public' and p.proname like '%de_nghi_quan_he'
      and has_function_privilege('anon', p.oid, 'execute'))
  as tu_kiem;
