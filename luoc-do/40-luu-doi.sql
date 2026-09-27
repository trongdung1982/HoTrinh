-- ============================================================
-- giapha-supabase · luoc-do/40-luu-doi.sql
-- Vai trò  : b125g — LƯU Đời vào Supabase, theo CÂY: cột `tree_persons.doi`.
--            Máy chủ tự tính lại, chỉ cho NHÁNH bị đổi dòng cha (người ấy +
--            con cháu theo dòng cha), bằng trigger trên bốn bảng.
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `39`. Dán lại nhiều lần được.
--            ⚠ Không định nghĩa lại hàm nào của file khác — không kéo theo
--            chuỗi dán lại nào, và dán lại file khác cũng không đòi dán lại nó.
-- Sổ tay   : so-tay/xuat-excel.md (luật Đời) · so-tay/luu-du-lieu.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b125g.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 27/09/2026
-- ============================================================
--
-- ═══ LUẬT ĐỜI (chủ dự án chốt 27/09/2026 — bản gốc ở sổ tay) ═══
--
-- Đời = số bậc theo DÒNG CHA của chính người ấy, trong MỘT cây: lần ngược cha
-- → ông nội → … tới người không còn cha trong cây = Đời 1. "Cha" = người NAM
-- đầu tiên trong `partners` của cặp sinh ra người ấy; nhiều cặp thì đẻ → thừa
-- tự → nuôi → nuôi dưỡng, cùng hạng thì mã hôn nhân nhỏ hơn; cha dượng (`step`)
-- không nối dòng. Vòng dữ liệu hỏng → `null`. Người đã xoá mềm → `null`.
-- Đây là bản SQL của `js/utils/graph.js tinhDoi()`; bàn thử so hai bản.
--
-- ═══ VÌ SAO TRIGGER, KHÔNG SỬA `luu_cay()` ═══
--
-- Dòng cha đổi ở ít nhất sáu lối: thêm người · gắn cha cho người có sẵn · gỡ
-- cha · xoá người · kéo người từ cây khác · TỪ CHỐI một thay đổi (hoàn tác) —
-- và đổi giới tính cha. Trigger bắt cả sáu mà không chép lại `luu_cay()`
-- (hàm dài nhất, đứng cuối ở `32`). Mỗi trigger chỉ đưa vào NGƯỜI GỐC bị đổi;
-- `tinh_lai_doi()` tính người gốc + hậu duệ theo dòng cha, và chỉ GHI dòng
-- có số khác — thêm bố cho cụ tổ thì cả dòng +1, phần còn lại không đụng.
--
-- ⚠ Một người ở nhiều cây: đổi quan hệ từ cây A thì tính lại ở MỌI cây chứa
--   người gốc — cha có mặt ở cây B thì đời ở B cũng đổi.
-- ⚠ Cột này KHÔNG thuộc bảng `persons` — luật "BỐN chỗ" của sổ tay
--   `luu-du-lieu.md` không áp: trình duyệt không bao giờ gửi `doi` lên, và
--   `authenticated` chỉ có quyền ĐỌC `tree_persons` (`26` mục 5).

begin;

do $$
begin
  if not exists (select 1 from information_schema.tables
                  where table_schema = 'public' and table_name = 'tree_persons') then
    raise exception 'DỪNG: chưa dán 26-mot-nguoi-mot-ban-ghi.sql (thiếu bảng tree_persons).';
  end if;
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'persons'
                and column_name = 'tree_id') then
    raise exception 'DỪNG: `26` chưa chuyển xong dữ liệu (persons còn cột tree_id).';
  end if;
end $$;

-- ============================================================
-- 1. CỘT
-- ============================================================
-- Không `not null`, không `default`: `null` = chưa tính được (vòng dữ liệu,
-- người đã xoá mềm). Mọi chỗ ghi `tree_persons` hiện có liệt kê tên cột nên
-- không vướng; dòng mới vào mang `null` rồi trigger điền ngay trong cùng giao
-- dịch.
alter table public.tree_persons add column if not exists doi integer;

-- ============================================================
-- 2. TÍNH — `doi_tinh(cây, người gốc)`: gốc + hậu duệ theo dòng cha
-- ============================================================
-- Trả ĐỜI ĐÚNG của tập ấy, không ghi gì. Mọi lần duyệt có tập đã thăm
-- (`duong`) — dữ liệu vòng không treo được (`CLAUDE.md` mục 7).
--
-- Cách tính: (a) tập T = gốc + hậu duệ; (b) "điểm vào" = người trong T mà
-- cha KHÔNG trong T — đời của họ đo bằng cách LEO lên tới đầu dòng, không đọc
-- số đã lưu (số lưu hỏng thì không lây); (c) đi xuống từ điểm vào, mỗi bậc +1.
-- Người trong vòng không bao giờ là điểm vào, cũng không với tới từ điểm vào
-- nào → `null`, đúng như `tinhDoi()` để trống.
create or replace function public.doi_tinh(p_tree uuid, p_goc text[])
returns table(person_id text, doi integer)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with recursive
  trong as (
    select p.id, p.sex
      from public.tree_persons tp
      join public.persons p on p.id = tp.person_id and not coalesce(p.deleted, false)
     where tp.tree_id = p_tree),
  cha as (
    select distinct on (uc.person_id) uc.person_id as con, o.ma as cha
      from public.union_children uc
      join trong c on c.id = uc.person_id
      join public.unions u on u.id = uc.union_id and not coalesce(u.deleted, false)
      cross join lateral (
        select x.ma from unnest(u.partners) with ordinality x(ma, i)
          join trong t on t.id = x.ma and t.sex = 'M'
         order by x.i limit 1) o
     where uc.relation in ('birth', 'thua_tu', 'adopted', 'foster')
       and o.ma <> uc.person_id
     order by uc.person_id,
              array_position(array['birth', 'thua_tu', 'adopted', 'foster'], uc.relation),
              u.id),
  xuong(id, duong) as (
    select g.id, array[g.id] from trong g where g.id = any(p_goc)
    union all
    select c.con, x.duong || c.con
      from xuong x join cha c on c.cha = x.id
     where c.con <> all(x.duong)),
  tap as (select distinct id from xuong),
  vao as (
    select t.id from tap t
     where not exists (select 1 from cha c join tap t2 on t2.id = c.cha where c.con = t.id)),
  leo(goc, id, duong) as (
    select v.id, v.id, array[v.id] from vao v
    union all
    select l.goc, c.cha, l.duong || c.cha
      from leo l join cha c on c.con = l.id
     where c.cha <> all(l.duong)),
  -- Bậc cao nhất của mỗi lần leo. Còn cha mà dừng = cha đã nằm trong đường
  -- đi, tức vòng phía trên → `null`.
  dau as (
    select distinct on (l.goc) l.goc,
           case when exists (select 1 from cha c where c.con = l.id) then null
                else cardinality(l.duong) end as doi
      from leo l
     order by l.goc, cardinality(l.duong) desc),
  ket(id, doi, duong) as (
    select d.goc, d.doi, array[d.goc] from dau d
    union all
    select c.con, k.doi + 1, k.duong || c.con
      from ket k
      join cha c on c.cha = k.id
      join tap t on t.id = c.con
     where c.con <> all(k.duong))
  select t.id, k.doi
    from tap t
    left join (select distinct on (id) id, doi from ket order by id) k on k.id = t.id;
$$;

-- ============================================================
-- 3. GHI — `tinh_lai_doi(người gốc)`, ở MỌI cây chứa họ
-- ============================================================
-- Chỉ `update` dòng có số KHÁC — lần lưu sửa tên thì không dòng nào bị chạm.
-- Gốc không còn "trong cây" (xoá mềm) thì đặt `null` cho chính họ.
create or replace function public.tinh_lai_doi(p_goc text[])
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tree uuid;
  v_n    integer;
  v_tong integer := 0;
begin
  if p_goc is null or cardinality(p_goc) = 0 then return 0; end if;

  for v_tree in
    select distinct tp.tree_id from public.tree_persons tp where tp.person_id = any(p_goc)
  loop
    update public.tree_persons tp set doi = m.doi
      from public.doi_tinh(v_tree, p_goc) m
     where tp.tree_id = v_tree and tp.person_id = m.person_id
       and tp.doi is distinct from m.doi;
    get diagnostics v_n = row_count;
    v_tong := v_tong + v_n;

    update public.tree_persons tp set doi = null
     where tp.tree_id = v_tree and tp.person_id = any(p_goc) and tp.doi is not null
       and not exists (select 1 from public.persons p
                        where p.id = tp.person_id and not coalesce(p.deleted, false));
    get diagnostics v_n = row_count;
    v_tong := v_tong + v_n;
  end loop;
  return v_tong;
end;
$$;

revoke all on function public.doi_tinh(uuid, text[]) from public, anon, authenticated;
revoke all on function public.tinh_lai_doi(text[])   from public, anon, authenticated;

-- ============================================================
-- 4. TRIGGER — mỗi bảng nói "ai là người gốc bị đổi dòng cha"
-- ============================================================
-- Trigger CÂU LỆNH (for each statement) kèm bảng chuyển tiếp: lưu 700 người
-- một lúc cũng chỉ tính một lần mỗi câu lệnh, không 700 lần. Postgres không
-- cho một trigger có bảng chuyển tiếp mà nghe nhiều loại lệnh, nên mỗi loại
-- một trigger; một hàm mỗi bảng, rẽ nhánh theo `tg_op`.
-- ⚠ Không trigger UPDATE trên `tree_persons`: chính `tinh_lai_doi()` update
--   bảng ấy — có trigger là tự gọi mình mãi.

-- 4a. Con: chính đứa con là gốc.
create or replace function public.doi_sau_ghi_con()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    perform public.tinh_lai_doi(array(select distinct person_id from moi));
  elsif tg_op = 'DELETE' then
    perform public.tinh_lai_doi(array(select distinct person_id from cu));
  else
    -- Chỉ đổi thứ tự con (`ord`) thì không ai đổi đời.
    perform public.tinh_lai_doi(array(
      select m.person_id from moi m
        left join cu c on c.union_id = m.union_id and c.person_id = m.person_id
       where c.person_id is null or c.relation is distinct from m.relation
      union
      select c.person_id from cu c
        left join moi m on m.union_id = c.union_id and m.person_id = c.person_id
       where m.person_id is null));
  end if;
  return null;
end;
$$;

drop trigger if exists doi_them on public.union_children;
create trigger doi_them after insert on public.union_children
  referencing new table as moi for each statement execute function public.doi_sau_ghi_con();
drop trigger if exists doi_sua on public.union_children;
create trigger doi_sua after update on public.union_children
  referencing old table as cu new table as moi for each statement execute function public.doi_sau_ghi_con();
drop trigger if exists doi_xoa on public.union_children;
create trigger doi_xoa after delete on public.union_children
  referencing old table as cu for each statement execute function public.doi_sau_ghi_con();

-- 4b. Hôn nhân: đổi vợ/chồng hoặc xoá mềm → mọi con của cặp là gốc. Xoá
--     cứng thì `union_children` đi theo (khoá ngoại cascade) và 4a lo.
create or replace function public.doi_sau_ghi_hon_nhan()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    perform public.tinh_lai_doi(array(
      select distinct uc.person_id from public.union_children uc
       where uc.union_id in (select id from moi)));
  else
    perform public.tinh_lai_doi(array(
      select distinct uc.person_id from public.union_children uc
       where uc.union_id in (
         select m.id from moi m join cu c on c.id = m.id
          where c.partners is distinct from m.partners
             or coalesce(c.deleted, false) is distinct from coalesce(m.deleted, false))));
  end if;
  return null;
end;
$$;

drop trigger if exists doi_them on public.unions;
create trigger doi_them after insert on public.unions
  referencing new table as moi for each statement execute function public.doi_sau_ghi_hon_nhan();
drop trigger if exists doi_sua on public.unions;
create trigger doi_sua after update on public.unions
  referencing old table as cu new table as moi for each statement execute function public.doi_sau_ghi_hon_nhan();

-- 4c. Người: đổi GIỚI TÍNH (ai là "cha") hoặc xoá mềm → chính họ + con của
--     mọi cặp họ đứng trong. Sửa tên, ngày sinh… thì mảng gốc rỗng, thoát ngay.
create or replace function public.doi_sau_sua_nguoi()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_doi text[];
begin
  v_doi := array(
    select m.id from moi m join cu c on c.id = m.id
     where c.sex is distinct from m.sex
        or coalesce(c.deleted, false) is distinct from coalesce(m.deleted, false));
  if cardinality(v_doi) = 0 then return null; end if;
  perform public.tinh_lai_doi(v_doi || array(
    select distinct uc.person_id
      from public.unions u join public.union_children uc on uc.union_id = u.id
     where u.partners && v_doi));
  return null;
end;
$$;

drop trigger if exists doi_sua on public.persons;
create trigger doi_sua after update on public.persons
  referencing old table as cu new table as moi for each statement execute function public.doi_sau_sua_nguoi();

-- 4d. Người VÀO cây (thêm mới, kéo từ cây khác): chính họ là gốc — con cháu
--     của họ trong cây này nay có thể nhận họ làm cha. Người RA khỏi cây:
--     con của mọi cặp họ đứng trong là gốc (dòng của chính họ đã đi cùng dòng).
create or replace function public.doi_sau_ghi_cay_nguoi()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    perform public.tinh_lai_doi(array(select distinct person_id from moi));
  else
    perform public.tinh_lai_doi(array(
      select distinct uc.person_id
        from public.unions u join public.union_children uc on uc.union_id = u.id
       where u.partners && array(select distinct person_id from cu)));
  end if;
  return null;
end;
$$;

drop trigger if exists doi_them on public.tree_persons;
create trigger doi_them after insert on public.tree_persons
  referencing new table as moi for each statement execute function public.doi_sau_ghi_cay_nguoi();
drop trigger if exists doi_xoa on public.tree_persons;
create trigger doi_xoa after delete on public.tree_persons
  referencing old table as cu for each statement execute function public.doi_sau_ghi_cay_nguoi();

revoke all on function public.doi_sau_ghi_con()       from public, anon, authenticated;
revoke all on function public.doi_sau_ghi_hon_nhan()  from public, anon, authenticated;
revoke all on function public.doi_sau_sua_nguoi()     from public, anon, authenticated;
revoke all on function public.doi_sau_ghi_cay_nguoi() from public, anon, authenticated;

-- ============================================================
-- 5. ĐIỀN MỘT LẦN — mọi cây đang có
-- ============================================================
-- Gốc = mọi người của mọi cây → tính trọn từng cây. Dán lại thì số đã đúng,
-- không dòng nào bị ghi.
select public.tinh_lai_doi(array(select distinct person_id from public.tree_persons));

commit;

-- ============================================================
-- 6. TỰ KIỂM — hỏi HÌNH DẠNG + so số đã lưu với một lần tính trọn.
--    Hành vi từng lối ghi (thêm cha, gỡ cha, hoàn tác…) thì bàn thử hỏi.
-- ============================================================
select 1 as stt, 'cột tree_persons.doi đã có' as ten_kiem,
  case when exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'tree_persons'
                       and column_name = 'doi')
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'đủ 8 trigger doi_* trên bốn bảng',
  case when (select count(*) from pg_trigger g join pg_class c on c.oid = g.tgrelid
              join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and not g.tgisinternal
               and g.tgname in ('doi_them', 'doi_sua', 'doi_xoa')
               and c.relname in ('union_children', 'unions', 'persons', 'tree_persons')) = 8
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'số đã lưu KHỚP một lần tính trọn, ở mọi cây',
  case when not exists (
         select 1 from public.trees t
          cross join lateral public.doi_tinh(t.id,
                     array(select person_id from public.tree_persons where tree_id = t.id)) m
           join public.tree_persons tp on tp.tree_id = t.id and tp.person_id = m.person_id
          where tp.doi is distinct from m.doi)
       then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'người còn trong cây mà Đời trống: ' ||
  (select count(*) from public.tree_persons tp join public.persons p on p.id = tp.person_id
    where not coalesce(p.deleted, false) and tp.doi is null) || ' (chỉ vòng dữ liệu mới trống)',
  case when (select count(*) from public.tree_persons tp join public.persons p on p.id = tp.person_id
              where not coalesce(p.deleted, false) and tp.doi is null) = 0
       then 'ĐẠT' else 'XEM LẠI' end
union all
select 5, 'anon/authenticated KHÔNG gọi được doi_tinh · tinh_lai_doi',
  case when not (has_function_privilege('anon', 'public.tinh_lai_doi(text[])', 'execute')
              or has_function_privilege('authenticated', 'public.tinh_lai_doi(text[])', 'execute')
              or has_function_privilege('anon', 'public.doi_tinh(uuid, text[])', 'execute')
              or has_function_privilege('authenticated', 'public.doi_tinh(uuid, text[])', 'execute'))
       then 'ĐẠT' else 'HỎNG' end
order by stt;
