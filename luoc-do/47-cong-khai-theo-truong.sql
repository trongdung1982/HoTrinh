-- ============================================================
-- giapha-supabase · luoc-do/47-cong-khai-theo-truong.sql
-- Vai trò  : Công khai theo TỪNG TRƯỜNG cho khách xem cây mặc định (b145a) —
--            cột `trees.truong_cong_khai`, `doc_cay()` che trường đã tắt, và
--            khách THÔI đọc thẳng bảng `persons`/`unions`/`media`.
-- Cần có   : `30` (`doc_cay` có vành đai) · `42` (`ghi_nhat_ky`).
--            ⚠ Bản ĐỨNG CUỐI của `doc_cay()` và `ds_nguoi_xem_duoc()` — dán
--            lại `26`/`27`/`30` sau file này là mở lại lỗ, IM LẶNG.
-- Thiết kế : THIET-KE-QUAN-TRI.md 9.5 nhóm E · chốt 28/09/2026: che với MỌI
--            người trong cây (kể cả người đã mất) · bảy nhóm theo cột thật.
-- Sổ tay   : so-tay/phan-quyen.md · Đo: ../kiem-thu/ban-thu-sql/do-b145a.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 28/09/2026 (b145a)
-- ============================================================
--
-- "Khách" = tài khoản ĐÃ ĐĂNG NHẬP xem được cây CHỈ NHỜ nó là cây mặc định
--   (`co_the_xem_cay` đúng, `la_thanh_vien` sai). Người chưa đăng nhập không
--   gọi được `doc_cay` từ `30`, không đổi. Thành viên và QTHT không bị che.
--
-- ⚠ Che ở GIAO DIỆN là không chặn gì: trước file này khách đọc thẳng được
--   bảng `persons` qua REST (luật `doc_persons` của `26` cho qua mọi cây xem
--   được). Nên hai việc phải đi CÙNG NHAU:
--   ① `doc_cay()` xoá trắng trường đã tắt khi người gọi là khách;
--   ② `ds_nguoi_xem_duoc()` bỏ cây mà người gọi chỉ là khách → luật đọc của
--     `persons` · `media` và (qua `ds_hon_nhan_xem_duoc`) `unions` ·
--     `union_children` tự khép theo. Bỏ ② thì ① chỉ là tấm rèm.
--   `trees` · `tree_persons` (Đời) vẫn đọc được — app cần để mở cây.
--
-- Bảy nhóm (Họ tên cố định, không có công tắc; Đời luôn hiện):
--   gioi_tinh → sex='U' · nam_sinh → chỉ còn năm · ngay_sinh → birth đủ
--   (bật ngày sinh thì năm đi theo) · ngay_mat → death + burial_place + vn.gio
--   · anh → photo_file_id + MỌI dòng media của cây · tieu_su → note, title,
--   occupation, education, religion, residence, nationality.
--   Trường bị xoá trắng thì app tự không vẽ hàng đó — không sửa `domains/`.
-- ⚠ Cột lưu danh sách BẬT, không lưu danh sách tắt: nhóm thêm sau này mặc
--   định bị che với cây đã có, không tự lộ. Mặc định = bật cả sáu, tức đúng
--   hành vi trước file này.
-- ⚠ `meta.updatedBy`/`createdBy` là EMAIL người sửa — khách luôn bị bỏ, không
--   có công tắc.
-- Chưa che: `unions` (ngày cưới, ghi chú hôn nhân) · `sources` — ngoài bảy nhóm.

begin;

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'ds_hon_nhan_cua_cay') then
    raise exception 'DỪNG: chưa dán 27-ham-mot-nguoi.sql (thiếu ds_hon_nhan_cua_cay).';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'ghi_nhat_ky') then
    raise exception 'DỪNG: chưa dán 42-nhat-ky-he-thong.sql (thiếu ghi_nhat_ky).';
  end if;
end $$;

-- ------------------------------------------------------------
-- 1. Cột — danh sách nhóm BẬT
-- ------------------------------------------------------------
alter table public.trees
  add column if not exists truong_cong_khai text[] not null
  default array['gioi_tinh', 'nam_sinh', 'ngay_sinh', 'ngay_mat', 'anh', 'tieu_su'];

alter table public.trees drop constraint if exists trees_truong_cong_khai_hop_le;
alter table public.trees add constraint trees_truong_cong_khai_hop_le
  check (truong_cong_khai <@ array['gioi_tinh', 'nam_sinh', 'ngay_sinh', 'ngay_mat', 'anh', 'tieu_su']);

-- ------------------------------------------------------------
-- 2. la_khach_cay() — xem được CHỈ nhờ cây mặc định
-- ------------------------------------------------------------
create or replace function public.la_khach_cay(p_tree uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.co_the_xem_cay(p_tree) and not public.la_thanh_vien(p_tree), false);
$$;

-- ------------------------------------------------------------
-- 3. che_nguoi() — hàm thuần: một bản ghi người (jsonb) → bản đã che
-- ------------------------------------------------------------
create or replace function public.che_nguoi(p jsonb, p_mo text[])
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select p
    || jsonb_build_object('meta', coalesce(p->'meta', '{}'::jsonb) - 'updatedBy' - 'createdBy')
    || case when 'gioi_tinh' = any(p_mo) then '{}'::jsonb
            else jsonb_build_object('sex', 'U') end
    || case when 'ngay_sinh' = any(p_mo) then '{}'::jsonb
            when 'nam_sinh' = any(p_mo) then jsonb_build_object('birth', jsonb_build_object(
              'iso', null, 'place', '',
              'raw', coalesce(left(nullif(p->'birth'->>'iso', ''), 4),
                              substring(coalesce(p->'birth'->>'raw', '') from '\d{4}'), '')))
            else jsonb_build_object('birth', '{"iso":null,"raw":"","place":""}'::jsonb) end
    || case when 'ngay_mat' = any(p_mo) then '{}'::jsonb
            else jsonb_build_object('death', '{"iso":null,"raw":"","place":""}'::jsonb,
                                    'burial_place', '',
                                    'vn', coalesce(p->'vn', '{}'::jsonb) - 'gio') end
    || case when 'anh' = any(p_mo) then '{}'::jsonb
            else jsonb_build_object('photo_file_id', '') end
    || case when 'tieu_su' = any(p_mo) then '{}'::jsonb
            else jsonb_build_object('note', '', 'title', '', 'occupation', '', 'education', '',
                                    'religion', '', 'residence', '', 'nationality', '') end;
$$;

-- ------------------------------------------------------------
-- 4. doc_cay() — thân `30` + che khi người gọi là khách
-- ------------------------------------------------------------
create or replace function public.doc_cay(p_tree uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_nguoi text[];
  v_hn    text[];
  v_bien  text[];
  v_khach boolean;
  v_mo    text[];
begin
  if p_tree is null or not public.co_the_xem_cay(p_tree) then
    return jsonb_build_object('ok', false,
      'loi', 'Không đọc được gia phả này. Có thể bạn đã bị gỡ khỏi danh sách người được xem.');
  end if;

  v_khach := public.la_khach_cay(p_tree);
  select t.truong_cong_khai into v_mo from public.trees t where t.id = p_tree;
  v_mo := coalesce(v_mo, '{}'::text[]);

  v_nguoi := array(select person_id from public.tree_persons where tree_id = p_tree);
  v_hn    := array(select public.ds_hon_nhan_cua_cay(p_tree));

  v_bien := array(
    select distinct x from (
      select unnest(partners) as x from public.unions where id = any(v_hn)
      union
      select person_id as x from public.union_children where union_id = any(v_hn)
    ) t
    where x <> all(v_nguoi)
  );

  return jsonb_build_object('ok', true,
    'persons', (select coalesce(jsonb_agg(
                         case when v_khach then public.che_nguoi(to_jsonb(p.*), v_mo)
                              else to_jsonb(p.*) end order by p.id), '[]'::jsonb)
                  from public.persons p where p.id = any(v_nguoi)),
    'vanh_dai', (select coalesce(jsonb_agg(
                         case when v_khach then public.che_nguoi(to_jsonb(p.*), v_mo)
                              else to_jsonb(p.*) end order by p.id), '[]'::jsonb)
                  from public.persons p where p.id = any(v_bien)),
    'unions', (select coalesce(jsonb_agg(to_jsonb(u.*) order by u.id), '[]'::jsonb)
                 from public.unions u where u.id = any(v_hn)),
    'children', (select coalesce(jsonb_agg(to_jsonb(c.*) order by c.union_id, c.ord), '[]'::jsonb)
                   from public.union_children c
                  where c.union_id = any(v_hn)),
    'media', (select coalesce(jsonb_agg(to_jsonb(m.*) order by m.id), '[]'::jsonb)
                from public.media m
               where (m.subject_id = any(v_nguoi) or m.subject_id = any(v_hn))
                 and (not v_khach or 'anh' = any(v_mo))));
end;
$$;

-- ------------------------------------------------------------
-- 5. ds_nguoi_xem_duoc() — bỏ cây mà người gọi chỉ là khách
-- ------------------------------------------------------------
-- Giữ lại bản ghi người GẮN VỚI CHÍNH tài khoản mình (`tai_khoan.person_id`)
-- nếu nó nằm trong một cây xem được — `layPhien()` đọc tên người ấy thẳng từ
-- bảng; thiếu vế này thì khách được gắn vào cây mặc định mất tên ở trang
-- Tài khoản. Chỉ đúng MỘT bản ghi, của chính mình.
create or replace function public.ds_nguoi_xem_duoc()
returns setof text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select tp.person_id from public.tree_persons tp
   where tp.tree_id in (select c from public.ds_cay_xem_duoc() c
                         where public.la_thanh_vien(c))
  union
  select k.person_id from public.tai_khoan k
   where k.user_id = auth.uid() and k.person_id is not null
     and exists (select 1 from public.tree_persons tp
                  where tp.person_id = k.person_id
                    and tp.tree_id in (select public.ds_cay_xem_duoc()));
$$;

-- ------------------------------------------------------------
-- 6. dat_truong_cong_khai() — chỉ Quản trị hệ thống
-- ------------------------------------------------------------
create or replace function public.dat_truong_cong_khai(p_tree uuid, p_truong text[])
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cu  text[];
  v_moi text[];
  v_ten text;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'lyDo', 'Chỉ Quản trị hệ thống mới đặt được trường công khai.');
  end if;
  if public.bi_khoa() then
    return jsonb_build_object('ok', false, 'lyDo', 'Tài khoản đang bị khoá.');
  end if;

  v_moi := array(select distinct x from unnest(coalesce(p_truong, '{}'::text[])) x order by 1);
  if not v_moi <@ array['gioi_tinh', 'nam_sinh', 'ngay_sinh', 'ngay_mat', 'anh', 'tieu_su'] then
    return jsonb_build_object('ok', false, 'lyDo', 'Có tên trường không hợp lệ.');
  end if;

  select t.truong_cong_khai, t.name || ' (' || t.tree_code || ')' into v_cu, v_ten
    from public.trees t where t.id = p_tree;
  if v_ten is null then
    return jsonb_build_object('ok', false, 'lyDo', 'Không thấy gia phả này.');
  end if;

  update public.trees set truong_cong_khai = v_moi where id = p_tree;
  perform public.ghi_nhat_ky('tree', 'doi_truong_cong_khai', v_ten,
    jsonb_build_object('cu', to_jsonb(v_cu), 'moi', to_jsonb(v_moi)));
  return jsonb_build_object('ok', true, 'truong', to_jsonb(v_moi));
end;
$$;

-- ------------------------------------------------------------
-- 7. Quyền gọi
-- ------------------------------------------------------------
revoke all on function public.la_khach_cay(uuid)                   from public, anon;
revoke all on function public.che_nguoi(jsonb, text[])             from public, anon;
revoke all on function public.doc_cay(uuid)                        from public, anon;
revoke all on function public.ds_nguoi_xem_duoc()                  from public, anon;
revoke all on function public.dat_truong_cong_khai(uuid, text[])   from public, anon;
grant execute on function public.la_khach_cay(uuid)                 to authenticated;
grant execute on function public.che_nguoi(jsonb, text[])           to authenticated;
grant execute on function public.doc_cay(uuid)                      to authenticated;
grant execute on function public.ds_nguoi_xem_duoc()                to authenticated;
grant execute on function public.dat_truong_cong_khai(uuid, text[]) to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — bảng cuối phải ra ĐẠT ở cả sáu dòng
-- ============================================================
select 1 as stt, 'cột trees.truong_cong_khai có, mặc định bật đủ sáu nhóm' as ten_kiem,
  case when exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'trees'
                       and column_name = 'truong_cong_khai')
        and not exists (select 1 from public.trees where cardinality(truong_cong_khai) is null)
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'doc_cay() bản 47 (có che_nguoi) đang chạy',
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'doc_cay') like '%che_nguoi%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'ds_nguoi_xem_duoc() bản 47 (lọc la_thanh_vien) đang chạy',
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'ds_nguoi_xem_duoc') like '%la_thanh_vien%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'anon không gọi được doc_cay · dat_truong_cong_khai',
  case when not has_function_privilege('anon', 'public.doc_cay(uuid)', 'execute')
        and not has_function_privilege('anon', 'public.dat_truong_cong_khai(uuid, text[])', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 5, 'authenticated gọi được doc_cay · dat_truong_cong_khai',
  case when has_function_privilege('authenticated', 'public.doc_cay(uuid)', 'execute')
        and has_function_privilege('authenticated', 'public.dat_truong_cong_khai(uuid, text[])', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 6, 'che_nguoi tắt hết → sex U, ngày sinh/mất, ảnh, tiểu sử trống, email người sửa bỏ',
  case when public.che_nguoi(
         '{"sex":"M","birth":{"iso":"1982-03-05","raw":"05/03/1982","place":"Hà Nội"},
           "death":{"iso":null,"raw":"2020","place":"x"},"burial_place":"y","vn":{"gio":"1/1","generation":9},
           "photo_file_id":"M1","note":"n","occupation":"o","meta":{"updatedBy":"a@b"}}'::jsonb,
         '{}'::text[])
       = '{"sex":"U","birth":{"iso":null,"raw":"","place":""},"death":{"iso":null,"raw":"","place":""},
           "burial_place":"","vn":{"generation":9},"photo_file_id":"","note":"","occupation":"",
           "title":"","education":"","religion":"","residence":"","nationality":"","meta":{}}'::jsonb
       then 'ĐẠT' else 'HỎNG' end
order by stt;
