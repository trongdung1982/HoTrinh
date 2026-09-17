-- ============================================================
-- giapha-supabase · luoc-do/26-mot-nguoi-mot-ban-ghi.sql
-- Vai trò  : b121 — MỘT NGƯỜI MỘT BẢN GHI chung mọi cây. `persons` · `unions`
--            · `union_children` · `media` bỏ `tree_id`; bảng mới
--            `tree_persons` giữ "ai thuộc cây nào"; mã P/U/M toàn cục, không
--            tiền tố cây; số chống ghi đè đặt trên TỪNG bản ghi. Bỏ `noi_ve`.
-- Chạy ở   : Supabase → SQL Editor. Chạy SAU `25`. Dán lần hai vô hại.
-- Phiên bản: 0.1.0 · Cập nhật: 17/09/2026 (b121)
-- Thiết kế : THIET-KE-NHIEU-CAY.md mục 6 · Sổ tay: so-tay/luu-du-lieu.md
-- ============================================================
--
-- ⚠⚠ DÁN FILE NÀY LÀ APP NGỪNG ĐỌC/GHI ĐƯỢC CÂY cho tới khi dán file của
--   b122. Khoảng 20 hàm máy chủ (`luu_cay` · `tu_choi_thay_doi` ·
--   `pham_vi_sua` · `ds_kiem_duyet` · …) và `services/sb.js` còn hỏi
--   `persons.tree_id` — cột ấy không còn. Không lỗi lúc dán, lỗi lúc GỌI.
--   Đề nghị: dán `26` CÙNG LÚC với file của b122, không dán riêng.
--
-- ⚠ SAU FILE NÀY KHÔNG DÁN LẠI `02` hay `11` NỮA — chúng dựng luật đọc
--   `co_the_xem_cay(tree_id)` trên bảng người, sẽ báo lỗi cột không tồn tại.
--   Bản đứng cuối của bốn luật đọc ấy nằm ở mục 5 dưới đây.
--
-- ═══ ĐỔI MÃ ═══
--
-- Hai cây cùng có `P0001`. Luật (bảng `doi_ma_toan_cuc` giữ VĨNH VIỄN từng
-- cặp cũ → mới):
--   1. Bỏ tiền tố cây (`NPGQ8C9_M0001` → `M0001`).
--   2. Mã trần ấy chưa ai giữ → giữ nguyên. Nhiều cây cùng mã → cây TẠO
--      TRƯỚC giữ, các cây sau nhận số mới.
--   3. Số mới đứng SAU số lớn nhất từng thấy, KỂ CẢ trong `change_log` —
--      cấp lại một mã đã dùng là để chuyện cũ dính sang người khác.
-- ⚠ `change_log` KHÔNG viết lại. Nhật ký trước lúc đổi mã nói bằng mã cũ của
--   cây ấy — tra `doi_ma_toan_cuc`. Hệ quả cho b122: `tu_choi_thay_doi()`
--   PHẢI từ chối dòng nhật ký cũ hơn `doi_ma_toan_cuc.luc`, không thì nó dán
--   ảnh chụp mang mã cũ đè lên người khác.
--
-- ═══ CHỐNG GHI ĐÈ THEO BẢN GHI (bẫy ở THIET-KE mục 6) ═══
--
-- `trees.revision` là số của TỪNG CÂY: sửa ông X từ cây A không làm số cây B
-- đổi, nên tab cây B mở từ trước vẫn lưu đè được. Nay mỗi dòng của bốn bảng
-- dùng chung có cột `revision`, và trigger `chan_ghi_de_ban_ghi` thi hành:
--   · UPDATE: `revision` gửi lên phải BẰNG số đang có, không thì lỗi `GP409`;
--     qua thì số tự tăng 1. Gửi thiếu (`null`) cũng là lỗi — tab cũ không đè.
--     Gợi ý lỗi (`hint`) là `xungdot`.
--   · INSERT: dòng MỚI gửi `revision = 0`, lưu thành 1. Gửi 0 mà mã đã có
--     người giữ → `GP409` gợi ý `trungma`: hai cây sinh trùng mã không lặng
--     lẽ ghi đè nhau.
-- ⚠ Lệnh UPDATE KHÔNG nhắc tới `revision` thì qua (số vẫn tăng). Đó là đường
--   của hàm máy chủ sửa trên dữ liệu đang có. `luu_cay()` của b122 PHẢI đặt
--   `revision = excluded.revision` trong danh sách `on conflict do update` —
--   thiếu dòng ấy là cả cơ chế này im lặng vô hiệu.

begin;

-- ============================================================
-- 1. BẢNG GHI ĐỔI MÃ — đọc thẳng không được, chỉ SQL Editor
-- ============================================================
create table if not exists public.doi_ma_toan_cuc (
  tree_id uuid        not null,
  loai    text        not null check (loai in ('P', 'U', 'M')),
  ma_cu   text        not null,
  ma_moi  text        not null,
  luc     timestamptz not null default now(),
  primary key (tree_id, loai, ma_cu),
  unique (loai, ma_moi)
);
alter table public.doi_ma_toan_cuc enable row level security;

create table if not exists public.tree_persons (
  tree_id   uuid not null references public.trees(id) on delete cascade,
  person_id text not null,
  primary key (tree_id, person_id)
);

-- ============================================================
-- 2. CHUYỂN DỮ LIỆU — chỉ chạy khi `persons.tree_id` còn
-- ============================================================
do $$
declare
  v_nguoi  integer;
  v_hn     integer;
  v_con    integer;
  v_anh    integer;
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'persons'
                    and column_name = 'tree_id') then
    raise notice '26: đã chuyển từ lần dán trước — bỏ qua mục 2.';
    return;
  end if;

  select count(*) into v_nguoi from public.persons;
  select count(*) into v_hn    from public.unions;
  select count(*) into v_con   from public.union_children;
  select count(*) into v_anh   from public.media;

  -- ── 2a. Gỡ mọi thứ bám vào khoá cũ. Không dùng CASCADE: thứ gì lạ còn
  --        bám thì phải LỖI ở đây, không lặng lẽ bị xoá theo.
  drop policy if exists doc_persons        on public.persons;
  drop policy if exists doc_unions         on public.unions;
  drop policy if exists doc_union_children on public.union_children;
  drop policy if exists doc_media          on public.media;

  alter table public.tree_members   drop constraint if exists tree_members_person_fk;
  alter table public.union_children drop constraint if exists union_children_tree_id_union_id_fkey;
  alter table public.union_children drop constraint if exists union_children_tree_id_person_id_fkey;
  alter table public.persons        drop constraint if exists persons_tree_id_branch_id_fkey;
  alter table public.persons        drop constraint if exists persons_noi_ve_hop_le;
  drop index if exists public.persons_noi_ve_duy_nhat;

  alter table public.union_children drop constraint if exists union_children_pkey;
  alter table public.persons        drop constraint if exists persons_pkey;
  alter table public.unions         drop constraint if exists unions_pkey;
  alter table public.media          drop constraint if exists media_pkey;

  -- ── 2b. Bảng đổi mã. Bước 1+2 của luật đầu file: mã trần, cây tạo trước giữ.
  insert into public.doi_ma_toan_cuc (tree_id, loai, ma_cu, ma_moi)
  with nguon as (
    select tree_id, 'P' as loai, id as ma_cu from public.persons
    union all select tree_id, 'U', id from public.unions
    union all select tree_id, 'M', id from public.media
  ), tach as (
    select n.*, t.created_at,
           case when n.ma_cu ~ ('^([A-Z][A-Z0-9]{0,13}_)?' || n.loai || '[0-9]{4,}$')
                then regexp_replace(n.ma_cu, '^[A-Z][A-Z0-9]{0,13}_', '') end as tran
      from nguon n join public.trees t on t.id = n.tree_id
  ), xep as (
    select *, row_number() over (partition by loai, tran
                                 order by created_at, tree_id, ma_cu) as thu
      from tach
  )
  select tree_id, loai, ma_cu, tran from xep where tran is not null and thu = 1;

  -- Bước 3: số mới sau số lớn nhất từng thấy — ở mã đã giữ VÀ ở nhật ký.
  insert into public.doi_ma_toan_cuc (tree_id, loai, ma_cu, ma_moi)
  with nguon as (
    select tree_id, 'P' as loai, id as ma_cu from public.persons
    union all select tree_id, 'U', id from public.unions
    union all select tree_id, 'M', id from public.media
  ), con_lai as (
    select n.*, t.created_at from nguon n join public.trees t on t.id = n.tree_id
     where not exists (select 1 from public.doi_ma_toan_cuc d
                        where d.tree_id = n.tree_id and d.loai = n.loai
                          and d.ma_cu = n.ma_cu)
  ), da_thay as (
    select ma_moi as ma from public.doi_ma_toan_cuc
    union all select target from public.change_log
    union all select k from public.change_log cl, lateral jsonb_object_keys(cl.diff) k
  ), so_lon as (
    select l.loai,
           coalesce(max((substring(dt.ma from ('^(?:[A-Z][A-Z0-9]{0,13}_)?'
                          || l.loai || '([0-9]{4,})')))::bigint), 0) as so
      from (values ('P'), ('U'), ('M')) l(loai)
      left join da_thay dt on dt.ma ~ ('^([A-Z][A-Z0-9]{0,13}_)?' || l.loai || '[0-9]{4,}')
     group by l.loai
  )
  select c.tree_id, c.loai, c.ma_cu,
         c.loai || lpad((s.so + row_number() over (partition by c.loai
                           order by c.created_at, c.tree_id, c.ma_cu))::text, 4, '0')
    from con_lai c join so_lon s on s.loai = c.loai;

  -- ── 2c. Viết lại mọi chỗ mang mã — mỗi chỗ tra theo CÂY của chính nó.
  update public.persons p set id = d.ma_moi
    from public.doi_ma_toan_cuc d
   where d.loai = 'P' and d.tree_id = p.tree_id and d.ma_cu = p.id and d.ma_moi <> p.id;

  update public.persons p set photo_file_id = d.ma_moi
    from public.doi_ma_toan_cuc d
   where d.loai = 'M' and d.tree_id = p.tree_id and d.ma_cu = p.photo_file_id;

  update public.unions u set
    id = coalesce((select d.ma_moi from public.doi_ma_toan_cuc d
                    where d.loai = 'U' and d.tree_id = u.tree_id and d.ma_cu = u.id), u.id),
    partners = array(
      select coalesce(d.ma_moi, x.ma)
        from unnest(u.partners) with ordinality x(ma, i)
        left join public.doi_ma_toan_cuc d
          on d.loai = 'P' and d.tree_id = u.tree_id and d.ma_cu = x.ma
       order by x.i),
    partner_order = array(
      select coalesce(d.ma_moi, x.ma)
        from unnest(u.partner_order) with ordinality x(ma, i)
        left join public.doi_ma_toan_cuc d
          on d.loai = 'P' and d.tree_id = u.tree_id and d.ma_cu = x.ma
       order by x.i),
    ranks = (
      select coalesce(jsonb_object_agg(coalesce(d.ma_moi, k.key), k.value), '{}'::jsonb)
        from jsonb_each(u.ranks) k
        left join public.doi_ma_toan_cuc d
          on d.loai = 'P' and d.tree_id = u.tree_id and d.ma_cu = k.key);

  update public.union_children c set
    union_id  = coalesce((select d.ma_moi from public.doi_ma_toan_cuc d
                           where d.loai = 'U' and d.tree_id = c.tree_id
                             and d.ma_cu = c.union_id), c.union_id),
    person_id = coalesce((select d.ma_moi from public.doi_ma_toan_cuc d
                           where d.loai = 'P' and d.tree_id = c.tree_id
                             and d.ma_cu = c.person_id), c.person_id);

  update public.media m set
    id         = coalesce((select d.ma_moi from public.doi_ma_toan_cuc d
                            where d.loai = 'M' and d.tree_id = m.tree_id
                              and d.ma_cu = m.id), m.id),
    subject_id = coalesce((select d.ma_moi from public.doi_ma_toan_cuc d
                            where d.loai in ('P', 'U') and d.tree_id = m.tree_id
                              and d.ma_cu = m.subject_id), m.subject_id);

  update public.trees t set root_person_id = d.ma_moi
    from public.doi_ma_toan_cuc d
   where d.loai = 'P' and d.tree_id = t.id and d.ma_cu = t.root_person_id;

  update public.branches b set root_person_id = d.ma_moi
    from public.doi_ma_toan_cuc d
   where d.loai = 'P' and d.tree_id = b.tree_id and d.ma_cu = b.root_person_id;

  update public.tree_members m set person_id = d.ma_moi
    from public.doi_ma_toan_cuc d
   where d.loai = 'P' and d.tree_id = m.tree_id and d.ma_cu = m.person_id;

  update public.user_settings s set focus_person_id = d.ma_moi
    from public.doi_ma_toan_cuc d
   where d.loai = 'P' and d.tree_id = s.tree_id and d.ma_cu = s.focus_person_id;

  if to_regclass('public.de_xuat_gan_nguoi') is not null then
    execute $x$
      update public.de_xuat_gan_nguoi g set person_id = d.ma_moi
        from public.doi_ma_toan_cuc d
       where d.loai = 'P' and d.tree_id = g.tree_id and d.ma_cu = g.person_id$x$;
  end if;

  -- ── 2d. Ai thuộc cây nào — lấy từ `tree_id` cũ, TRƯỚC khi bỏ cột.
  insert into public.tree_persons (tree_id, person_id)
  select tree_id, id from public.persons
  on conflict do nothing;

  -- ── 2e. Bỏ cột, dựng khoá mới.
  alter table public.persons        drop column tree_id;
  alter table public.persons        drop column if exists noi_ve;
  alter table public.unions         drop column tree_id;
  alter table public.union_children drop column tree_id;
  alter table public.media          drop column tree_id;

  alter table public.persons        add primary key (id);
  alter table public.unions         add primary key (id);
  alter table public.media          add primary key (id);
  alter table public.union_children add primary key (union_id, person_id);

  -- ── 2f. Đếm lại. Lệch một dòng là huỷ CẢ file — giao dịch trả về như cũ.
  if (select count(*) from public.persons)        <> v_nguoi
  or (select count(*) from public.tree_persons)   <> v_nguoi
  or (select count(*) from public.unions)         <> v_hn
  or (select count(*) from public.union_children) <> v_con
  or (select count(*) from public.media)          <> v_anh then
    raise exception '26: số dòng lệch sau khi chuyển — huỷ, không đổi gì.';
  end if;
  raise notice '26: đã chuyển % người · % hôn nhân · % quan hệ con · % ảnh.',
    v_nguoi, v_hn, v_con, v_anh;
end $$;

-- ============================================================
-- 3. KHOÁ NGOẠI VÀ CHỈ MỤC — dán lại vô hại
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tree_persons_person_fk') then
    alter table public.tree_persons add constraint tree_persons_person_fk
      foreign key (person_id) references public.persons(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'union_children_union_fk') then
    alter table public.union_children add constraint union_children_union_fk
      foreign key (union_id) references public.unions(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'union_children_person_fk') then
    alter table public.union_children add constraint union_children_person_fk
      foreign key (person_id) references public.persons(id) on delete cascade;
  end if;
  -- Tài khoản gắn với MỘT người; `unique (tree_id, person_id)` của `20` vẫn giữ.
  if not exists (select 1 from pg_constraint where conname = 'tree_members_person_fk') then
    alter table public.tree_members add constraint tree_members_person_fk
      foreign key (person_id) references public.persons(id) on delete set null;
  end if;
end $$;

create index if not exists tree_persons_person_idx   on public.tree_persons (person_id);
create index if not exists union_children_person_idx on public.union_children (person_id);
create index if not exists media_subject_idx         on public.media (subject_id) where not deleted;

-- ============================================================
-- 4. CHỐNG GHI ĐÈ THEO BẢN GHI
-- ============================================================
alter table public.persons        add column if not exists revision integer not null default 1;
alter table public.unions         add column if not exists revision integer not null default 1;
alter table public.union_children add column if not exists revision integer not null default 1;
alter table public.media          add column if not exists revision integer not null default 1;

create or replace function public.chan_ghi_de_ban_ghi()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  -- Đọc qua jsonb: `new.union_id` viết thẳng thì bảng không có cột ấy lỗi ngay.
  v_ma   text := coalesce(to_jsonb(new) ->> 'id',
                          (to_jsonb(new) ->> 'union_id') || '/' || (to_jsonb(new) ->> 'person_id'));
  v_co   boolean;
begin
  if tg_op = 'INSERT' then
    -- ⚠ Trigger BEFORE INSERT chạy TRƯỚC khi Postgres xét `on conflict`, và
    --   `excluded` mang giá trị SAU trigger. Nên ở đây KHÔNG được đặt số cho
    --   dòng sắp đụng mã đã có — đặt là xoá mất số người gửi khai.
    if tg_table_name = 'union_children' then
      select exists (select 1 from public.union_children
                      where union_id = new.union_id and person_id = new.person_id) into v_co;
    else
      execute format('select exists (select 1 from public.%I where id = $1)', tg_table_name)
        into v_co using new.id;
    end if;
    if not v_co then
      new.revision := 1;
    elsif new.revision is null then
      -- Tab mở từ trước khi có cột này: nó tưởng mình đang SỬA, không phải tạo.
      raise exception 'Bản ghi % gửi lên thiếu số chống ghi đè. Tải lại rồi sửa.', v_ma
        using errcode = 'GP409', hint = 'xungdot';
    elsif new.revision = 0 then
      raise exception 'Mã % đã có bản ghi khác giữ — không ghi đè.', v_ma
        using errcode = 'GP409', hint = 'trungma';
    end if;
    return new;
  end if;

  if new.revision is distinct from old.revision then
    raise exception 'Bản ghi % vừa có người sửa (số % ≠ %). Tải lại rồi sửa.',
      v_ma, coalesce(new.revision::text, 'trống'), old.revision
      using errcode = 'GP409', hint = 'xungdot';
  end if;
  new.revision := old.revision + 1;
  return new;
end;
$$;

drop trigger if exists chan_ghi_de on public.persons;
create trigger chan_ghi_de before insert or update on public.persons
  for each row execute function public.chan_ghi_de_ban_ghi();
drop trigger if exists chan_ghi_de on public.unions;
create trigger chan_ghi_de before insert or update on public.unions
  for each row execute function public.chan_ghi_de_ban_ghi();
drop trigger if exists chan_ghi_de on public.union_children;
create trigger chan_ghi_de before insert or update on public.union_children
  for each row execute function public.chan_ghi_de_ban_ghi();
drop trigger if exists chan_ghi_de on public.media;
create trigger chan_ghi_de before insert or update on public.media
  for each row execute function public.chan_ghi_de_ban_ghi();

-- ============================================================
-- 5. LUẬT ĐỌC — bản ĐỨNG CUỐI của bốn luật `11` mục 16
-- ============================================================
-- Thấy một người khi người ấy thuộc ÍT NHẤT MỘT cây mình xem được. Hôn nhân
-- thấy được khi một vợ/chồng hay một đứa con thấy được (chốt 3 mục 6: không
-- giấu theo cây). Ảnh theo người/hôn nhân nó gắn vào.
--
-- ⚠⚠ TỐC ĐỘ — đã vấp ở bàn thử. Luật kiểu `using (ham(id))` gọi hàm cho TỪNG
--   dòng; hàm `security definer` viết bằng SQL không được Postgres gộp vào câu
--   truy vấn nên mỗi lần gọi lập kế hoạch lại (~8ms). 740 người = 6 giây, và
--   bản đầu của luật hôn nhân (nối bằng `or`) = 15 PHÚT. Nên ba hàm dưới đây
--   trả DANH SÁCH, luật viết `id in (select ds_…())`: danh sách không phụ
--   thuộc dòng nào nên Postgres tính MỘT lần mỗi câu rồi tra bảng băm.
--   Đo: `do-b121.mjs` phép R7.
-- ⚠ `security definer` còn vì lẽ thứ hai: luật của `unions` đọc
--   `union_children` và ngược lại — đọc thẳng là `infinite recursion`.
create or replace function public.ds_cay_xem_duoc()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select t.id from public.trees t where public.co_the_xem_cay(t.id);
$$;

create or replace function public.ds_nguoi_xem_duoc()
returns setof text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select distinct tp.person_id from public.tree_persons tp
   where tp.tree_id in (select public.ds_cay_xem_duoc());
$$;

create or replace function public.ds_hon_nhan_xem_duoc()
returns setof text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with nguoi as (select public.ds_nguoi_xem_duoc() as id)
  select u.id from public.unions u
   where exists (select 1 from unnest(u.partners) x(ma) where x.ma in (select id from nguoi))
  union
  select uc.union_id from public.union_children uc
   where uc.person_id in (select id from nguoi);
$$;

revoke all on function public.ds_cay_xem_duoc()      from public, anon;
revoke all on function public.ds_nguoi_xem_duoc()    from public, anon;
revoke all on function public.ds_hon_nhan_xem_duoc() from public, anon;
grant execute on function public.ds_cay_xem_duoc()      to authenticated;
grant execute on function public.ds_nguoi_xem_duoc()    to authenticated;
grant execute on function public.ds_hon_nhan_xem_duoc() to authenticated;

alter table public.tree_persons enable row level security;
drop policy if exists doc_tree_persons on public.tree_persons;
create policy doc_tree_persons on public.tree_persons
  for select to authenticated
  using (tree_id in (select public.ds_cay_xem_duoc()));

drop policy if exists doc_persons on public.persons;
create policy doc_persons on public.persons
  for select to authenticated
  using (id in (select public.ds_nguoi_xem_duoc()));

drop policy if exists doc_unions on public.unions;
create policy doc_unions on public.unions
  for select to authenticated
  using (id in (select public.ds_hon_nhan_xem_duoc()));

drop policy if exists doc_union_children on public.union_children;
create policy doc_union_children on public.union_children
  for select to authenticated
  using (union_id in (select public.ds_hon_nhan_xem_duoc()));

drop policy if exists doc_media on public.media;
create policy doc_media on public.media
  for select to authenticated
  using (subject_id in (select public.ds_nguoi_xem_duoc())
      or subject_id in (select public.ds_hon_nhan_xem_duoc()));

-- Bản nháp gọi-từng-dòng của bàn thử — đứng SAU luật mới vì luật cũ bám vào nó.
drop function if exists public.nguoi_xem_duoc(text);
drop function if exists public.hon_nhan_xem_duoc(text);

-- Chỉ ĐỌC. Không luật ghi nào: cửa ghi vẫn chỉ là hàm máy chủ (`02` mục 1).
revoke all on public.tree_persons    from anon;
revoke all on public.doi_ma_toan_cuc from anon, authenticated;
grant select on public.tree_persons to authenticated;

-- ============================================================
-- 6. CẤP MÃ MỚI — máy chủ đếm, không để trình duyệt tự đếm trong một cây
-- ============================================================
-- `utils/id.js` tìm số lớn nhất TRONG CÂY ĐANG MỞ — nay cây khác có thể đã
-- giữ số ấy. b122 đổi sang gọi `cap_ma()`. Sổ đếm chỉ tiến, không lùi.
create sequence if not exists public.ma_p_seq;
create sequence if not exists public.ma_u_seq;
create sequence if not exists public.ma_m_seq;
-- Supabase tự cấp quyền sổ đếm cho anon/authenticated — gỡ, chỉ `cap_ma()` đếm.
revoke all on sequence public.ma_p_seq, public.ma_u_seq, public.ma_m_seq
  from public, anon, authenticated;

do $$
declare
  l text;
  v bigint;
begin
  foreach l in array array['P', 'U', 'M'] loop
    select coalesce(max((substring(ma from ('^(?:[A-Z][A-Z0-9]{0,13}_)?' || l || '([0-9]{4,})')))::bigint), 0)
      into v
      from (select id as ma from public.persons where l = 'P'
            union all select id from public.unions where l = 'U'
            union all select id from public.media  where l = 'M'
            union all select ma_moi from public.doi_ma_toan_cuc
            union all select target from public.change_log
            union all select k from public.change_log cl, lateral jsonb_object_keys(cl.diff) k) x;
    execute format('select setval(%L, greatest(%s, (select last_value from public.%I), 1), true)',
                   'public.ma_' || lower(l) || '_seq', v, 'ma_' || lower(l) || '_seq');
  end loop;
end $$;

create or replace function public.cap_ma(p_loai text, p_so integer default 1)
returns text[]
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Chưa đăng nhập.' using errcode = '42501';
  end if;
  if p_loai is null or p_loai not in ('P', 'U', 'M') then
    raise exception 'Loại mã không hợp lệ: %', p_loai;
  end if;
  if p_so is null or p_so < 1 or p_so > 5000 then
    raise exception 'Số mã xin phải từ 1 tới 5000.';
  end if;
  return array(
    select p_loai || lpad(nextval(('public.ma_' || lower(p_loai) || '_seq')::regclass)::text, 4, '0')
      from generate_series(1, p_so));
end;
$$;

revoke all on function public.cap_ma(text, integer) from public, anon;
grant execute on function public.cap_ma(text, integer) to authenticated;

commit;

-- ============================================================
-- 7. BẢNG TỰ KIỂM — đọc sau khi dán, mọi dòng phải ĐẠT
-- ============================================================
-- ⚠ Chỉ hỏi *"có mặt và đúng hình không"*. Ba bước ghi đè xuyên cây và luật
--   đọc dưới danh nghĩa từng người đo bằng `kiem-thu/ban-thu-sql/do-b121.mjs`.
select ten_kiem as "Kiểm", ket_qua as "Kết quả"
from (
  select 1 as stt, 'Bốn bảng dùng chung đã bỏ tree_id' as ten_kiem,
    case when not exists (select 1 from information_schema.columns
                           where table_schema = 'public' and column_name = 'tree_id'
                             and table_name in ('persons', 'unions', 'union_children', 'media'))
         then 'ĐẠT' else 'HỎNG — còn cột tree_id' end as ket_qua
  union all
  select 2, 'Cột noi_ve đã bỏ',
    case when not exists (select 1 from information_schema.columns
                           where table_schema = 'public' and table_name = 'persons'
                             and column_name = 'noi_ve')
         then 'ĐẠT' else 'HỎNG — noi_ve còn' end
  union all
  select 3, 'Mọi người thuộc ít nhất một cây',
    case when not exists (select 1 from public.persons p
                           where not exists (select 1 from public.tree_persons tp
                                              where tp.person_id = p.id))
         then 'ĐẠT' else 'HỎNG — có người mồ côi cây' end
  union all
  select 4, 'Không mã nào còn tiền tố cây',
    case when not exists (select 1 from public.persons where id ~ '_'
                          union all select 1 from public.unions where id ~ '_'
                          union all select 1 from public.media  where id ~ '_')
         then 'ĐẠT' else 'HỎNG — còn mã dạng CÂY_P####' end
  union all
  select 5, 'Trigger chống ghi đè trên đủ 4 bảng',
    case when (select count(*) from pg_trigger
                where tgname = 'chan_ghi_de' and not tgisinternal) = 4
         then 'ĐẠT' else 'HỎNG — thiếu trigger' end
  union all
  select 6, 'Luật đọc mới trên 5 bảng',
    case when (select count(*) from pg_policies where schemaname = 'public'
                and policyname in ('doc_tree_persons', 'doc_persons', 'doc_unions',
                                   'doc_union_children', 'doc_media')) = 5
         then 'ĐẠT' else 'HỎNG — thiếu luật đọc (đọc ra 0 dòng)' end
  union all
  select 7, 'anon KHÔNG gọi được cap_ma()',
    case when not has_function_privilege('anon', 'public.cap_ma(text, integer)', 'execute')
         then 'ĐẠT' else 'HỎNG — chưa revoke' end
  union all
  select 8, 'Sổ đếm mã P đứng sau mã lớn nhất',
    case when (select last_value from public.ma_p_seq) >=
              (select coalesce(max(substring(id from '^P([0-9]+)$')::bigint), 0) from public.persons)
         then 'ĐẠT' else 'HỎNG — cap_ma() sẽ cấp trùng' end
) t order by stt;
