-- ============================================================
-- giapha-supabase · luoc-do/54-khoi-phuc-tu-nut.sql
-- Vai trò  : b155a — KHÔI PHỤC TOÀN PHẦN gọi được từ trang Quản trị: nhận
--            nguyên văn file sao lưu JSON, chỉ Quản trị hệ thống, chỉ file
--            do máy sao lưu tự ghi ra (khớp dấu vân tay SHA-256).
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `42`, `45`, `49`. Dán lại nhiều
--            lần được. Không định nghĩa lại hàm nào của file khác → không kéo
--            chuỗi dán lại.
--            ⚠ Đi cặp `sao-luu/SaoLuu.gs` 0.8.0 trở lên — báo dấu vân tay mỗi
--            file nó ghi. File ghi TRƯỚC khi thay mã thì nút không nhận.
-- Sổ tay   : so-tay/sao-luu.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b155a.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 29/09/2026 (b155a)
-- ============================================================
--
-- THÂN KHÔI PHỤC chép từ `sao-luu/khoi-phuc.mjs` (đã chạy thật 28/09): truncate
--   19 bảng → đổ lại cha trước con → so TỪNG DÒNG → bật lại trigger, MỘT giao
--   dịch. Sửa một bên thì sửa cả bên kia (hai bản, cùng luật).
--
-- ⚠⚠ VÌ SAO PHẢI CÓ DẤU VÂN TAY. File do NGƯỜI BẤM đưa lên. Không kiểm thì
--   một Quản trị hệ thống sửa tay `tai_khoan` / `tree_members` trong file rồi
--   "khôi phục" là tự phong Quản trị hệ thống cho người khác, cho người vào
--   cây — đi vòng qua MỌI luật hai chữ ký (`18`, `23`). Nên chỉ nhận file mà
--   máy sao lưu (vai `sao_luu`, chỉ đọc) đã báo dấu SHA-256 lúc ghi. Sửa một
--   byte là dấu khác → từ chối.
--
-- ⚠ Bảng `ban_sao_luu_da_ghi` KHÔNG nằm trong 19 bảng khôi phục và KHÔNG
--   được sao lưu (`kiem-sao-luu.mjs` CHUA_SAO_LUU): khôi phục về hôm qua
--   không được xoá dấu của những bản ghi sau hôm qua.
-- ⚠ Hàm gọi qua trình duyệt bị Supabase cắt ở ~8 giây (`statement_timeout`
--   của vai `authenticated`); đặt lại trong hàm KHÔNG có tác dụng vì đồng
--   hồ đã chạy từ đầu câu lệnh. Đo trên bàn thử: `do-b155a.mjs` nhóm G.

begin;

do $$
begin
  if to_regprocedure('public.ghi_nhat_ky(text, text, text, jsonb, uuid)') is null then
    raise exception 'DỪNG: chưa dán 42-nhat-ky-he-thong.sql (thiếu ghi_nhat_ky).';
  end if;
end $$;

-- ============================================================
-- 1. SỔ DẤU VÂN TAY — chỉ máy sao lưu ghi, không ai đọc thẳng
-- ============================================================
create table if not exists public.ban_sao_luu_da_ghi (
  bam        text primary key check (bam ~ '^[0-9a-f]{64}$'),
  ten_file   text not null,
  tao_luc_vn text not null default '',
  ghi_luc    timestamptz not null default now()
);
alter table public.ban_sao_luu_da_ghi enable row level security;
-- Không một `policy` nào: mọi lối vào đi qua hàm security definer bên dưới.
revoke all on public.ban_sao_luu_da_ghi from public, anon, authenticated;

-- Máy sao lưu báo dấu của file vừa ghi. Cùng cửa với `ghi_sao_luu_dem()`
-- (`49`): chỉ tài khoản mang vai `sao_luu` — vai ấy chỉ SQL Editor đặt được.
create or replace function public.ghi_bam_sao_luu(p_bam text, p_ten_file text, p_tao_luc_vn text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.tree_members m
                  where m.user_id = auth.uid() and m.role = 'sao_luu') then
    return jsonb_build_object('ok', false, 'loi', 'Chỉ tài khoản sao lưu tự động mới gọi được hàm này.');
  end if;
  if coalesce(p_bam, '') !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ok', false, 'loi', 'Dấu vân tay không đúng khuôn SHA-256 (64 chữ số hex thường).');
  end if;
  insert into public.ban_sao_luu_da_ghi (bam, ten_file, tao_luc_vn)
  values (p_bam, left(coalesce(p_ten_file, ''), 200), left(coalesce(p_tao_luc_vn, ''), 40))
  on conflict (bam) do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.ghi_bam_sao_luu(text, text, text) from public, anon;
grant execute on function public.ghi_bam_sao_luu(text, text, text) to authenticated;

-- ============================================================
-- 2. KIỂM FILE — dùng chung cho "xem trước" và "khôi phục" (KHOÁ KÍN)
-- ============================================================
-- Trả { ok, loi, ten_file, tao_luc_vn, dem } — `dem` = số dòng 19 bảng trong
-- file. Luật kiểm chép `khoi-phuc.mjs` `kiemFile()`, cộng dấu vân tay.
create or replace function public.kiem_file_sao_luu_(p_noi_dung text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  c_thu_tu constant text[] := array['trees', 'persons', 'unions', 'branches', 'branch_access',
    'tree_persons', 'union_children', 'tree_members', 'media', 'sources', 'change_log',
    'imports', 'user_settings', 'cau_hinh', 'tai_khoan', 'doi_ma_toan_cuc',
    'de_xuat_gan_nguoi', 'de_nghi_quan_he', 'de_xuat_dong_ho'];
  v_bam  text;
  v_dau  record;
  v_ban  jsonb;
  v_bang jsonb;
  v_dem  jsonb := '{}'::jsonb;
  t      text;
  v_loi  text[] := '{}';
begin
  if coalesce(p_noi_dung, '') = '' then
    return jsonb_build_object('ok', false, 'loi', 'File trống.');
  end if;

  v_bam := encode(sha256(convert_to(p_noi_dung, 'UTF8')), 'hex');
  select * into v_dau from public.ban_sao_luu_da_ghi where bam = v_bam;
  if not found then
    return jsonb_build_object('ok', false, 'loi',
      'File này không phải bản do máy sao lưu ghi ra, hoặc đã bị sửa (dù một chữ). ' ||
      'Tải lại đúng file từ thư mục sao lưu trên Drive, không mở ra sửa. ' ||
      'Bản ghi trước khi thay SaoLuu.gs 0.8.0 cũng không nhận được.');
  end if;

  begin
    v_ban := p_noi_dung::jsonb;
  exception when others then
    return jsonb_build_object('ok', false, 'loi', 'File không đọc được thành JSON.');
  end;

  if v_ban ->> 'khuon' is distinct from 'giapha-sao-luu' then
    return jsonb_build_object('ok', false, 'loi', 'Không phải file sao lưu gia phả (thiếu "khuon": "giapha-sao-luu").');
  end if;
  if (v_ban ->> 'phienBanKhuon') is distinct from '1' then
    v_loi := v_loi || ('Khuôn phiên bản ' || coalesce(v_ban ->> 'phienBanKhuon', '?') || ' — máy chủ chỉ biết bản 1.');
  end if;
  v_bang := coalesce(v_ban -> 'bang', '{}'::jsonb);
  for t in select jsonb_object_keys(v_bang) loop
    if not t = any (c_thu_tu) then v_loi := v_loi || ('Bảng lạ "' || t || '".'); end if;
  end loop;
  foreach t in array c_thu_tu loop
    if jsonb_typeof(v_bang -> t) is distinct from 'array' then
      v_loi := v_loi || ('Thiếu bảng "' || t || '".');
      continue;
    end if;
    v_dem := v_dem || jsonb_build_object(t, jsonb_array_length(v_bang -> t));
    if jsonb_typeof(v_ban -> 'dem' -> t) = 'number'
       and (v_ban -> 'dem' ->> t)::int <> jsonb_array_length(v_bang -> t) then
      v_loi := v_loi || ('Bảng "' || t || '": khối dem ghi ' || (v_ban -> 'dem' ->> t) ||
                         ' dòng, thực có ' || jsonb_array_length(v_bang -> t) || '.');
    end if;
  end loop;
  if coalesce(v_ban ->> 'thieuSoVoiMayChu', '') <> '' then
    v_loi := v_loi || ('Bản này tự khai THIẾU so với máy chủ lúc ghi: ' || left(v_ban ->> 'thieuSoVoiMayChu', 300));
  end if;

  if array_length(v_loi, 1) > 0 then
    return jsonb_build_object('ok', false, 'loi', array_to_string(v_loi, ' '));
  end if;
  return jsonb_build_object('ok', true, 'ten_file', v_dau.ten_file, 'tao_luc_vn',
    coalesce(nullif(v_ban ->> 'taoLucVn', ''), v_dau.tao_luc_vn), 'dem', v_dem);
end;
$$;

revoke all on function public.kiem_file_sao_luu_(text) from public, anon, authenticated;

-- ============================================================
-- 3. XEM TRƯỚC — không đổi gì; màn hình dùng để hỏi "chắc chưa"
-- ============================================================
-- Trả thêm `dem_hien_tai` (19 bảng trên máy lúc này) để đặt cạnh `dem`.
create or replace function public.xem_truoc_khoi_phuc(p_noi_dung text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_kq  jsonb;
  v_nay jsonb := '{}'::jsonb;
  v_n   bigint;
  t     text;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi', 'Chỉ Quản trị hệ thống mới khôi phục được.');
  end if;
  v_kq := public.kiem_file_sao_luu_(p_noi_dung);
  if not (v_kq ->> 'ok')::boolean then return v_kq; end if;
  for t in select jsonb_object_keys(v_kq -> 'dem') loop
    execute format('select count(*) from public.%I', t) into v_n;
    v_nay := v_nay || jsonb_build_object(t, v_n);
  end loop;
  return v_kq || jsonb_build_object('dem_hien_tai', v_nay);
end;
$$;

revoke all on function public.xem_truoc_khoi_phuc(text) from public, anon;
grant execute on function public.xem_truoc_khoi_phuc(text) to authenticated;

-- ============================================================
-- 4. KHÔI PHỤC TOÀN PHẦN
-- ============================================================
-- Trả { ok, loi } hoặc { ok:true, ten_file, bao_cao:[{muc, chi_tiet, ket_qua}] }.
-- Hỏng ở bất cứ bước nào → khối `exception` cuối hoàn tác MỌI thứ khối trong
-- đã làm (kể cả tắt trigger — `alter table` cũng nằm trong giao dịch) rồi trả
-- `ok:false` kèm câu lỗi.
create or replace function public.khoi_phuc_ban_sao(p_noi_dung text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  c_thu_tu constant text[] := array['trees', 'persons', 'unions', 'branches', 'branch_access',
    'tree_persons', 'union_children', 'tree_members', 'media', 'sources', 'change_log',
    'imports', 'user_settings', 'cau_hinh', 'tai_khoan', 'doi_ma_toan_cuc',
    'de_xuat_gan_nguoi', 'de_nghi_quan_he', 'de_xuat_dong_ho'];
  v_kiem   jsonb;
  v_bang   jsonb;
  v_bao    jsonb := '[]'::jsonb;
  v_bo     jsonb := '[]'::jsonb;
  v_nguoi  uuid := auth.uid();
  r        record;
  fk       record;
  tg       record;
  t        text;
  v_dong   jsonb;
  v_cot    text;
  v_n      int;
  v_that   int;
  v_ma     text;
  v_tat    text[] := '{}';
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi', 'Chỉ Quản trị hệ thống mới khôi phục được.');
  end if;
  v_kiem := public.kiem_file_sao_luu_(p_noi_dung);
  if not (v_kiem ->> 'ok')::boolean then return v_kiem; end if;
  v_bang := (p_noi_dung::jsonb) -> 'bang';

  begin
    -- Giờ UTC: đọc lại ngày giờ ra đúng dạng bản sao lưu ghi (+00:00) để so từng dòng.
    perform set_config('timezone', 'UTC', true);

    -- 0. Mọi bảng phải có trên máy chủ.
    foreach t in array c_thu_tu loop
      if to_regclass('public.' || quote_ident(t)) is null then
        raise exception 'Máy chủ không có bảng public.% — lược đồ lệch với bản sao lưu', t;
      end if;
    end loop;

    -- 1. Tắt trigger NGƯỜI DÙNG đang bật. Khoá ngoại vẫn gác (trigger hệ thống).
    for tg in
      select tr.tgrelid::regclass as bang, tr.tgname
        from pg_trigger tr
       where not tr.tgisinternal and tr.tgenabled <> 'D'
         and tr.tgrelid in (select ('public.' || quote_ident(x))::regclass from unnest(c_thu_tu) x)
    loop
      execute format('alter table %s disable trigger %I', tg.bang, tg.tgname);
      v_tat := v_tat || (tg.bang::text || '|' || tg.tgname);
    end loop;

    -- 2. Xoá sạch — một lệnh cho cả 19 bảng.
    execute (select 'truncate table ' || string_agg(format('public.%I', x), ', ') from unnest(c_thu_tu) x);

    -- 3. Đổ lại, cha trước con.
    foreach t in array c_thu_tu loop
      v_dong := v_bang -> t;

      -- 3a. Tài khoản đã mất khỏi auth.users: làm đúng điều khoá ngoại tự khai.
      for fk in
        select a.attname as cot, c.confdeltype as luat
          from pg_constraint c
          join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
         where c.contype = 'f' and c.confrelid = 'auth.users'::regclass
           and c.conrelid = ('public.' || quote_ident(t))::regclass
           and array_length(c.conkey, 1) = 1
      loop
        select count(*) into v_n from jsonb_array_elements(v_dong) e
         where e->>fk.cot is not null
           and not exists (select 1 from auth.users u where u.id::text = e->>fk.cot);
        continue when v_n = 0;
        v_bo := v_bo || jsonb_build_object('bang', t, 'cot', fk.cot, 'so_dong', v_n,
          'lam', case fk.luat when 'c' then 'bỏ dòng' when 'n' then 'đặt trống' else '?' end);
        if fk.luat = 'c' then
          select coalesce(jsonb_agg(e order by i), '[]'::jsonb) into v_dong
            from jsonb_array_elements(v_dong) with ordinality x(e, i)
           where not (e->>fk.cot is not null
                      and not exists (select 1 from auth.users u where u.id::text = e->>fk.cot));
        elsif fk.luat = 'n' then
          select coalesce(jsonb_agg(
                   case when e->>fk.cot is not null
                         and not exists (select 1 from auth.users u where u.id::text = e->>fk.cot)
                        then jsonb_set(e, array[fk.cot::text], 'null'::jsonb) else e end
                   order by i), '[]'::jsonb) into v_dong
            from jsonb_array_elements(v_dong) with ordinality x(e, i);
        else
          raise exception 'Bảng % cột % trỏ tới tài khoản đã mất, mà khoá ngoại không khai cascade/set null', t, fk.cot;
        end if;
        v_bao := v_bao || jsonb_build_object('muc', 'tài khoản đã mất · ' || t || '.' || fk.cot,
          'chi_tiet', v_n || ' dòng — ' || case fk.luat when 'c' then 'bỏ dòng' else 'đặt trống' end,
          'ket_qua', 'LƯU Ý');
      end loop;

      -- 3b. Cột = khoá có trong file ∩ cột có trên máy. Cột máy có mà file
      --     không có → nhận giá trị MẶC ĐỊNH (không phải null).
      select string_agg(format('%I', c.column_name), ', ' order by c.ordinal_position) into v_cot
        from information_schema.columns c
       where c.table_schema = 'public' and c.table_name = t and c.is_generated = 'NEVER'
         and c.column_name in (select distinct k from jsonb_array_elements(v_dong) e, jsonb_object_keys(e) k);

      if jsonb_array_length(v_dong) > 0 then
        execute format('insert into public.%I (%s) select %s from jsonb_populate_recordset(null::public.%I, $1)',
                       t, v_cot, v_cot, t) using v_dong;
      end if;

      execute format('select count(*) from public.%I', t) into v_that;
      if v_that <> jsonb_array_length(v_dong) then
        raise exception 'Bảng %: đổ % dòng mà đếm lại được %', t, jsonb_array_length(v_dong), v_that;
      end if;

      -- 3c. So TỪNG DÒNG: "file EXCEPT ALL máy" phải rỗng.
      execute format(
        'select count(*) from (select e from jsonb_array_elements($1) e
           except all
           select (select coalesce(jsonb_object_agg(j.key, j.value), ''{}'') from jsonb_each(to_jsonb(x)) j
                    where j.key in (select distinct k from jsonb_array_elements($1) e2, jsonb_object_keys(e2) k))
             from public.%I x) lech', t) using v_dong into v_n;
      if v_n <> 0 then
        raise exception 'Bảng %: % dòng đọc lại KHÔNG khớp bản chụp — huỷ khôi phục', t, v_n;
      end if;
      v_bao := v_bao || jsonb_build_object('muc', t, 'chi_tiet', v_that || ' dòng · so từng dòng: khớp',
                                           'ket_qua', 'ĐẠT');
    end loop;

    -- 4. Bộ đếm tự tăng đứng SAU số lớn nhất vừa đổ.
    for r in
      select c.table_name as bang, c.column_name as cot,
             pg_get_serial_sequence(format('public.%I', c.table_name), c.column_name) as day_so
        from information_schema.columns c
       where c.table_schema = 'public' and c.column_default like 'nextval(%'
         and c.table_name = any (c_thu_tu)
    loop
      execute format('select setval(%L, coalesce((select max(%I) from public.%I), 0) + 1, false)',
                     r.day_so, r.cot, r.bang);
    end loop;

    -- 5. Tài khoản mở SAU lúc chụp: cấp lại dòng tai_khoan, quyền trống.
    v_n := 0;
    for r in select u.id from auth.users u
              where not exists (select 1 from public.tai_khoan k where k.user_id = u.id) loop
      loop
        v_ma := left(translate(upper(substring(md5(gen_random_uuid()::text || clock_timestamp()::text), 1, 12)),
                               '0123456789ABCDEF', '23456789ABCDEFGH'), 6);
        exit when not exists (select 1 from public.tai_khoan where ma_ngan = v_ma);
      end loop;
      insert into public.tai_khoan (user_id, ma_ngan) values (r.id, v_ma);
      v_n := v_n + 1;
    end loop;
    if v_n > 0 then
      v_bao := v_bao || jsonb_build_object('muc', 'tài khoản mở sau lúc chụp',
        'chi_tiet', v_n || ' tài khoản được cấp lại dòng tai_khoan (quyền trống)', 'ket_qua', 'LƯU Ý');
    end if;

    -- 6. Bật lại đúng những trigger bước 1 đã tắt.
    for tg in select split_part(x, '|', 1) as bang, split_part(x, '|', 2) as ten from unnest(v_tat) x loop
      execute format('alter table %s enable trigger %I', tg.bang, tg.ten);
    end loop;
    v_bao := v_bao || jsonb_build_object('muc', 'trigger',
      'chi_tiet', coalesce(array_length(v_tat, 1), 0) || ' trigger tắt lúc đổ, đã bật lại', 'ket_qua', 'ĐẠT');

    -- 7. Một dòng nhật ký, người làm = người bấm (tài khoản của họ còn trong
    --    auth.users — bước 2 không đụng tới auth).
    perform public.ghi_nhat_ky('backup', 'khoi_phuc_sao_luu', v_kiem ->> 'ten_file',
      jsonb_build_object('tao_luc_vn', v_kiem ->> 'tao_luc_vn', 'dem', v_kiem -> 'dem', 'da_bo', v_bo),
      v_nguoi);

  exception when others then
    return jsonb_build_object('ok', false, 'loi', 'Khôi phục bị huỷ, dữ liệu KHÔNG đổi gì. Lý do: ' || sqlerrm);
  end;

  return jsonb_build_object('ok', true, 'ten_file', v_kiem ->> 'ten_file',
                            'tao_luc_vn', v_kiem ->> 'tao_luc_vn', 'bao_cao', v_bao);
end;
$$;

revoke all on function public.khoi_phuc_ban_sao(text) from public, anon;
grant execute on function public.khoi_phuc_ban_sao(text) to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — mọi dòng phải ĐẠT
-- ============================================================
-- ⚠ Chỉ hỏi hình dạng + quyền gọi. Hành vi (khôi phục thật, từ chối file
--   sửa tay, người không phải QTHT) đo ở `do-b155a.mjs`.
select 1 as stt, 'bảng ban_sao_luu_da_ghi có, bật RLS, authenticated không đọc thẳng được' as ten_kiem,
       case when to_regclass('public.ban_sao_luu_da_ghi') is not null
             and (select relrowsecurity from pg_class where oid = 'public.ban_sao_luu_da_ghi'::regclass)
             and not has_table_privilege('authenticated', 'public.ban_sao_luu_da_ghi', 'select')
            then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'authenticated gọi được ghi_bam_sao_luu · xem_truoc_khoi_phuc · khoi_phuc_ban_sao',
       case when has_function_privilege('authenticated', 'public.ghi_bam_sao_luu(text, text, text)', 'execute')
             and has_function_privilege('authenticated', 'public.xem_truoc_khoi_phuc(text)', 'execute')
             and has_function_privilege('authenticated', 'public.khoi_phuc_ban_sao(text)', 'execute')
            then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'anon KHÔNG gọi được hàm nào; hàm kiểm file khoá kín',
       case when not has_function_privilege('anon', 'public.khoi_phuc_ban_sao(text)', 'execute')
             and not has_function_privilege('anon', 'public.xem_truoc_khoi_phuc(text)', 'execute')
             and not has_function_privilege('anon', 'public.ghi_bam_sao_luu(text, text, text)', 'execute')
             and not has_function_privilege('authenticated', 'public.kiem_file_sao_luu_(text)', 'execute')
            then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'sha256 của máy chủ đúng chuẩn (chuỗi "abc")',
       case when encode(sha256(convert_to('abc', 'UTF8')), 'hex')
                 = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
            then 'ĐẠT' else 'HỎNG' end
order by 1;
