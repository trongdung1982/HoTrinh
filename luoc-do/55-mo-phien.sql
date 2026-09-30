-- ============================================================
-- giapha-supabase · luoc-do/55-mo-phien.sql
-- Vai trò  : b157b — `mo_phien(p_doc_cay)`: MỘT lượt mạng thay cho hai lượt
--            nối đuôi lúc mở app (vòng tài khoản → vòng cây + đọc cây).
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `53`. Dán lại nhiều lần được.
--            Không định nghĩa lại hàm nào của file khác → không kéo chuỗi
--            dán lại, và không file nào khác kéo nó.
-- Đi cặp   : `js/services/sb.js` `layPhien()` — chưa dán file này thì app tự
--            về đường cũ (từng câu), không hỏng gì.
-- Sổ tay   : so-tay/mo-app.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b157b.mjs
-- Phiên bản: 0.2.0 · Cập nhật: 30/09/2026 (b145c)
-- ============================================================
--
-- ⚠⚠ `security INVOKER` — CỐ Ý, và là cả điểm an toàn của file này. Hàm chạy
--   dưới danh nghĩa NGƯỜI GỌI: mọi `select` bên trong qua đúng luật RLS, mọi
--   hàm gọi bên trong (`doc_cay`, `co_the_sua`, `tin_thung_rac`…) là đúng
--   những hàm trình duyệt vẫn gọi từng câu. Nó không thấy thêm được một dòng
--   nào mà người gọi không tự đọc được — chỉ gom câu hỏi lại. Đổi sang
--   `security definer` là mở toang mọi bảng ở dưới: ĐỪNG.
--
-- CHỌN CÂY — cùng luật với `sb.js` (bản trước b157b tính ở trình duyệt):
--   bị khoá → không chọn · có chân (`tree_members` của mình) → cây cờ
--   `dang_mo`, không có thì cây vào sớm nhất · Quản trị hệ thống không chân →
--   cây đầu tiên theo tên · còn lại → cây mặc định (`cay_mac_dinh()`), không
--   có thì `null` (trình duyệt tự hỏi `trang_thai_cua_toi()` như cũ).
--   ĐỨNG TRƯỚC cả chuỗi ấy (0.2.0, b145c): cờ `dang_mo` trỏ vào cây không
--   có chân mà `co_the_xem_cay()` vẫn gật → mở cây ấy. Ghi được cờ ấy là
--   nhờ `64` — chưa dán `64` thì nhánh này không bao giờ trúng, vô hại.
--
-- `p_doc_cay` = true: kèm luôn dữ liệu cây (đúng năm thứ `layDong()` đọc:
--   dòng `trees` · `doc_cay()` · `sources` · `imports` · mã nhật ký). Cây
--   trong thùng rác thì không kèm. Trang Quản trị gọi với false.

begin;

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'an_bot_rieng') then
    raise exception 'DỪNG: chưa dán 53-cong-khai-vai-xem.sql (thiếu an_bot_rieng).';
  end if;
end $$;

create or replace function public.mo_phien(p_doc_cay boolean default false)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_toi     uuid := auth.uid();
  v_ds      jsonb;
  v_tk      public.tai_khoan%rowtype;
  v_qtht    boolean;
  v_khoa    boolean;
  v_cai_dat jsonb;
  v_cay     uuid;
  v_nguon   text;
  v_rac     jsonb := '{}'::jsonb;
  v_kq      jsonb;
begin
  if v_toi is null then
    return jsonb_build_object('ok', false, 'loi', 'Chưa đăng nhập.');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('tree_id', m.tree_id, 'role', m.role)
                            order by m.added_at, m.tree_id), '[]'::jsonb)
    into v_ds
    from public.tree_members m where m.user_id = v_toi;

  select * into v_tk from public.tai_khoan where user_id = v_toi;
  v_qtht := public.la_quan_tri_he_thong();
  v_khoa := public.bi_khoa();

  select coalesce(jsonb_agg(jsonb_build_object(
           'tree_id', s.tree_id, 'dang_mo', s.dang_mo,
           'focus_person_id', s.focus_person_id, 'hien_ngay_gio', s.hien_ngay_gio)), '[]'::jsonb)
    into v_cai_dat
    from public.user_settings s where s.user_id = v_toi;

  v_kq := jsonb_build_object(
    'ok', true,
    'ds', v_ds,
    'laQuanTriHeThong', v_qtht,
    'biKhoa', v_khoa,
    'maNgan', public.ma_tai_khoan_cua_toi(),
    'tk', case when v_tk.user_id is null then null else jsonb_build_object(
            'ho_ten', v_tk.ho_ten, 'duoc_tao_cay', v_tk.duoc_tao_cay,
            'khoa_ly_do', v_tk.khoa_ly_do, 'person_id', v_tk.person_id,
            'cay_chinh_id', v_tk.cay_chinh_id) end,
    'caiDat', v_cai_dat,
    'nguoiGan', (select jsonb_build_object('names', p.names) from public.persons p
                  where p.id = v_tk.person_id),
    'tenDongHo', coalesce((select t.name from public.trees t where t.id = v_tk.cay_chinh_id), ''));

  if v_khoa then
    return v_kq;
  end if;

  -- Chọn cây — cùng luật `sb.js` bản trước, cộng một nhánh (b145c): cờ
  -- `dang_mo` trỏ vào cây KHÔNG có chân mà vẫn xem được (cây mặc định; với
  -- QTHT là mọi cây) thì mở đúng cây ấy. Cờ trỏ vào cây nay không xem được
  -- nữa (thôi là mặc định) thì bỏ qua, rơi xuống luật cũ.
  select (s ->> 'tree_id')::uuid into v_cay
    from jsonb_array_elements(v_cai_dat) s
   where (s ->> 'dang_mo')::boolean
     and not exists (select 1 from jsonb_array_elements(v_ds) e
                      where e ->> 'tree_id' = s ->> 'tree_id')
     and public.co_the_xem_cay((s ->> 'tree_id')::uuid)
   limit 1;
  if v_cay is not null then
    v_nguon := case when v_qtht then 'qtht' else 'mac_dinh' end;
  elsif jsonb_array_length(v_ds) > 0 then
    select (e ->> 'tree_id')::uuid into v_cay
      from jsonb_array_elements(v_ds) e
     where exists (select 1 from jsonb_array_elements(v_cai_dat) s
                    where s ->> 'tree_id' = e ->> 'tree_id' and (s ->> 'dang_mo')::boolean)
     limit 1;
    v_cay := coalesce(v_cay, (v_ds -> 0 ->> 'tree_id')::uuid);
    v_nguon := 'thanh_vien';
  elsif v_qtht then
    select t.id into v_cay from public.trees t order by t.name limit 1;
    v_nguon := 'qtht';
  else
    v_cay := public.cay_mac_dinh();
    v_nguon := 'mac_dinh';
  end if;

  if v_cay is null then
    return v_kq || jsonb_build_object('treeId', null, 'nguon', v_nguon);
  end if;

  v_rac := coalesce(public.tin_thung_rac(v_cay), '{}'::jsonb);

  v_kq := v_kq || jsonb_build_object(
    'treeId', v_cay,
    'nguon', v_nguon,
    'tinRac', v_rac,
    'suaDuoc', public.co_the_sua(v_cay),
    'tenCay', coalesce((select t.name from public.trees t where t.id = v_cay), ''),
    'maCay', coalesce((select t.tree_code from public.trees t where t.id = v_cay), ''));

  if p_doc_cay and not coalesce((v_rac ->> 'daXoa')::boolean, false) then
    v_kq := v_kq || jsonb_build_object('dong', jsonb_build_object(
      'tree', (select to_jsonb(t) from public.trees t where t.id = v_cay),
      'doc_cay', public.doc_cay(v_cay),
      'sources', (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
                    from public.sources s where s.tree_id = v_cay),
      'imports', (select coalesce(jsonb_agg(to_jsonb(i) order by i.at), '[]'::jsonb)
                    from public.imports i where i.tree_id = v_cay),
      'ma_nhat_ky', (select coalesce(jsonb_agg(v.ma), '[]'::jsonb)
                       from public.v_ma_nhat_ky v where v.tree_id = v_cay)));
  end if;

  return v_kq;
end;
$$;

revoke all on function public.mo_phien(boolean) from public, anon;
grant execute on function public.mo_phien(boolean) to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — mọi dòng phải ĐẠT
-- ============================================================
-- ⚠ Chỉ hỏi hình dạng + quyền gọi. Hành vi (khớp từng câu cũ, dưới danh
--   nghĩa từng hạng người) đo ở `do-b157b.mjs`.
select 1 as stt, 'mo_phien là security INVOKER (không definer)' as ten_kiem,
       case when not (select prosecdef from pg_proc where oid = 'public.mo_phien(boolean)'::regprocedure)
            then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'authenticated gọi được, anon KHÔNG',
       case when has_function_privilege('authenticated', 'public.mo_phien(boolean)', 'execute')
             and not has_function_privilege('anon', 'public.mo_phien(boolean)', 'execute')
            then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'không đăng nhập (SQL Editor) → ok:false, không lộ gì',
       case when public.mo_phien(true) = '{"ok": false, "loi": "Chưa đăng nhập."}'::jsonb
            then 'ĐẠT' else 'HỎNG' end
order by 1;
