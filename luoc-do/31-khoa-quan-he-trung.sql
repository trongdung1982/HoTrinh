-- ============================================================
-- giapha-supabase · luoc-do/31-khoa-quan-he-trung.sql
-- Vai trò  : b127c — A và B ĐÃ có quan hệ trực tiếp (vợ/chồng, cha mẹ–con) ở
--            một hôn nhân còn sống thì KHÔNG khai thêm quan hệ thứ hai giữa
--            họ ở hôn nhân khác. Chặn ở hai trigger, không ở `luu_cay()`.
-- Chạy ở   : Supabase → SQL Editor. Dán sau `30`. Không đụng dữ liệu; dán
--            lại bao nhiêu lần cũng được.
-- Thiết kế : THIET-KE-NHIEU-CAY.md mục 6, *HAI HÀNG RÀO* — khối *Quan hệ*
-- Sổ tay   : so-tay/nguoi-xuyen-cay.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b127c.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 24/09/2026
-- ============================================================
--
-- ⚠ VÌ SAO TRIGGER, KHÔNG CHÉP LẠI `luu_cay()`: hàng rào gác CỘT, không gác
--   HÀM (bài học b110c). Mọi đường ghi vào `unions`/`union_children` — lưu,
--   hoàn tác, gộp sau này — đều qua đây. Lỗi ném bằng `GP409` + hint
--   `quanhetrung`; `luu_cay()` (`28`) đã bắt sẵn `GP409` và trả hint làm
--   `lyDo`, câu tiếng Việt nằm ở `chiTiet` — `sb.luuCay()` đổi nó thành `loi`.
-- ⚠ CHỈ XÉT QUAN HỆ MỚI SINH trong lần ghi: cạnh con vừa CHÈN, vợ/chồng vừa
--   thêm vào `partners`, hôn nhân vừa tạo hoặc vừa bỏ cờ `deleted`. Sắp thứ tự,
--   sửa ngày cưới… không sinh cặp mới nên không bị xét — cặp đã trùng TỪ TRƯỚC
--   vẫn sửa được. Bảng tự kiểm cuối file liệt kê chúng.
-- ⚠ Trigger AFTER ROW chạy ở CUỐI câu lệnh, nên thấy trọn câu ấy. `luu_cay()`
--   xoá trước, rồi hôn nhân, rồi cạnh con — gộp cặp (cặp bỏ đi mang `deleted`)
--   và chuyển con sang cặp khác (xoá cạnh cũ trước) đều đi lọt.
-- ⚠ Hoàn tác (`tu_choi_thay_doi`) bị chặn thì báo `dabisuatiep` — nó tự dịch
--   `GP409` theo cách của nó. Chấp nhận: câu ấy vẫn đúng hướng.
-- ⚠ Di dời dữ liệu hàng loạt bằng tay mà cố ý chứa cặp trùng: chạy với
--   `set session_replication_role = replica` — trigger thường không chạy.

begin;

-- ============================================================
-- 1. Hôn nhân KHÁC nào đang nối thẳng A với B? — null = chưa có
-- ============================================================
create or replace function public.hon_nhan_da_noi(p_tru text, p_a text, p_b text)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u.id from public.unions u
   where not coalesce(u.deleted, false)
     and u.id is distinct from p_tru
     and (   (p_a = any(u.partners) and p_b = any(u.partners))
          or (p_a = any(u.partners) and exists (select 1 from public.union_children c
                                                  where c.union_id = u.id and c.person_id = p_b))
          or (p_b = any(u.partners) and exists (select 1 from public.union_children c
                                                  where c.union_id = u.id and c.person_id = p_a)))
   order by u.id
   limit 1;
$$;

revoke all on function public.hon_nhan_da_noi(text, text, text) from public, anon, authenticated;

-- Ném lỗi bằng tên người — người dùng không đọc mã. Chỉ nêu tên HAI người họ
-- đang nối (họ đã biết), cộng mã hôn nhân cũ để Quản trị hệ thống tra.
create or replace function public.bao_quan_he_trung(p_a text, p_b text, p_cu text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_a text := coalesce((select nullif(public.ten_day_du(names), '') from public.persons where id = p_a), p_a);
  v_b text := coalesce((select nullif(public.ten_day_du(names), '') from public.persons where id = p_b), p_b);
begin
  raise exception '% và % đã có quan hệ với nhau (gia đình %), nên không khai thêm một quan hệ thứ hai giữa hai người. Nếu quan hệ cũ sai, báo Quản trị hệ thống sửa.',
    v_a, v_b, p_cu
    using errcode = 'GP409', hint = 'quanhetrung';
end;
$$;

revoke all on function public.bao_quan_he_trung(text, text, text) from public, anon, authenticated;

-- ============================================================
-- 2. Trigger trên `union_children` — cạnh con MỚI
-- ============================================================
create or replace function public.chan_quan_he_trung_con()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_u  public.unions%rowtype;
  v_a  text;
  v_cu text;
begin
  if tg_op = 'UPDATE' and old.union_id = new.union_id and old.person_id = new.person_id then
    return null;                                  -- chỉ đổi thứ tự/loại con
  end if;
  select * into v_u from public.unions where id = new.union_id;
  if not found or coalesce(v_u.deleted, false) then return null; end if;

  foreach v_a in array coalesce(v_u.partners, '{}') loop
    continue when v_a is null or v_a = new.person_id;
    v_cu := public.hon_nhan_da_noi(new.union_id, v_a, new.person_id);
    if v_cu is not null then perform public.bao_quan_he_trung(v_a, new.person_id, v_cu); end if;
  end loop;
  return null;
end;
$$;

drop trigger if exists chan_quan_he_trung on public.union_children;
create trigger chan_quan_he_trung
  after insert or update of union_id, person_id on public.union_children
  for each row execute function public.chan_quan_he_trung_con();

-- ============================================================
-- 3. Trigger trên `unions` — vợ/chồng MỚI, hôn nhân mới hoặc sống lại
-- ============================================================
create or replace function public.chan_quan_he_trung_hn()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cu_p text[] := '{}';   -- vợ/chồng ĐÃ có trước lần ghi (rỗng nếu mới/sống lại)
  v_a    text;
  v_b    text;
  v_cu   text;
begin
  if coalesce(new.deleted, false) then return null; end if;
  if tg_op = 'UPDATE' and not coalesce(old.deleted, false) then
    v_cu_p := coalesce(old.partners, '{}');
  end if;

  foreach v_a in array coalesce(new.partners, '{}') loop
    continue when v_a is null or v_a = any(v_cu_p);        -- chỉ người MỚI vào cặp
    -- Mới với từng vợ/chồng kia …
    foreach v_b in array coalesce(new.partners, '{}') loop
      continue when v_b is null or v_b = v_a;
      v_cu := public.hon_nhan_da_noi(new.id, v_a, v_b);
      if v_cu is not null then perform public.bao_quan_he_trung(v_a, v_b, v_cu); end if;
    end loop;
    -- … và với các con đang có của cặp này.
    for v_b in select person_id from public.union_children where union_id = new.id loop
      continue when v_b = v_a;
      v_cu := public.hon_nhan_da_noi(new.id, v_a, v_b);
      if v_cu is not null then perform public.bao_quan_he_trung(v_a, v_b, v_cu); end if;
    end loop;
  end loop;
  return null;
end;
$$;

drop trigger if exists chan_quan_he_trung on public.unions;
create trigger chan_quan_he_trung
  after insert or update of partners, deleted on public.unions
  for each row execute function public.chan_quan_he_trung_hn();

revoke all on function public.chan_quan_he_trung_con() from public, anon, authenticated;
revoke all on function public.chan_quan_he_trung_hn()  from public, anon, authenticated;

commit;

-- ============================================================
-- 4. BẢNG TỰ KIỂM — đọc sau khi dán
-- ============================================================
-- Hai trigger đã gắn chưa, và dữ liệu hiện có đã có cặp nào khai HAI lần
-- (từ trước file này — trigger không xoá chúng, cũng không chặn sửa chúng).
with cap as (
  select u.id as u, a as x, b as y
    from public.unions u, unnest(u.partners) a, unnest(u.partners) b
   where not coalesce(u.deleted, false) and a < b
  union
  select u.id, least(a, c.person_id), greatest(a, c.person_id)
    from public.unions u
    join public.union_children c on c.union_id = u.id, unnest(u.partners) a
   where not coalesce(u.deleted, false) and a <> c.person_id
),
trung as (
  select x, y, string_agg(distinct u, ', ') as cac_hn
    from cap group by x, y having count(distinct u) > 1
)
select (select count(*) from pg_trigger
         where tgname = 'chan_quan_he_trung' and not tgisinternal) as so_trigger_mong_2,
       (select count(*) from trung) as so_cap_da_trung_tu_truoc,
       coalesce((select string_agg(x || '–' || y || ' (' || cac_hn || ')', ' · ')
                   from (select * from trung order by x, y limit 20) t), '') as cac_cap;
