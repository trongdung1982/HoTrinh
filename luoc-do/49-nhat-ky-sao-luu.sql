-- ============================================================
-- giapha-supabase · luoc-do/49-nhat-ky-sao-luu.sql
-- Vai trò  : b147 — bản sao lưu đêm GHI VÀO Nhật ký hệ thống. Một hàm mới
--            `ghi_sao_luu_dem()`, chỉ tài khoản sao lưu tự động gọi được.
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `42` và `45`. Dán lại nhiều lần
--            được. Không định nghĩa lại hàm nào của file khác → không kéo
--            chuỗi dán lại.
--            ⚠ Dán xong chép `sao-luu/SaoLuu.gs` bản 0.6.0 vào dự án Apps
--            Script sao lưu — thiếu bước ấy thì không ai gọi hàm này.
-- Sổ tay   : so-tay/nhat-ky-he-thong.md · so-tay/sao-luu.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b147.mjs · kiem-thu/kiem-sao-luu.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 28/09/2026 (b147)
-- ============================================================
--
-- VÌ SAO: trang Quản trị chạy trong trình duyệt, không nối được tới Google
--   Drive hay Apps Script (không OAuth, `CLAUDE.md` mục 3) — nên bảng *Lịch
--   sử sao lưu* và thẻ *Sao lưu* ở Tổng quan xưa nay ghi "Không đọc được".
--   Đảo chiều: Apps Script đã nói chuyện được với Supabase, thì nó tự BÁO kết
--   quả mỗi lần chạy vào nhật ký; trang Quản trị đọc nhật ký như mọi dòng khác.
--
-- ⚠ Vai `sao_luu` vẫn KHÔNG ghi được một dòng dữ liệu nào: hàm này chỉ chèn
--   đúng một dòng nhật ký loại `backup`, và tự gọt đầu vào (chỉ nhận các khoá
--   biết trước, chữ tối đa 2000 ký tự) — không thành cửa đổ rác vào nhật ký.
-- ⚠ Ba mã việc: `sao_luu_dem` (đạt) · `sao_luu_canh_bao` (đã ghi file nhưng
--   thiếu so với máy chủ, hoặc sụt so với lần trước) · `sao_luu_hong` (không
--   ghi được file). Màn hình đặt tên ở `khu-nhat-ky.js` `TEN_VIEC`.

begin;

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'ghi_nhat_ky') then
    raise exception 'DỪNG: chưa dán 42-nhat-ky-he-thong.sql (thiếu ghi_nhat_ky).';
  end if;
end $$;

create or replace function public.ghi_sao_luu_dem(p_ket_qua jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_k        jsonb := coalesce(p_ket_qua, '{}'::jsonb);
  v_ok       boolean := coalesce((v_k ->> 'ok')::boolean, false);
  v_canh_bao text := left(coalesce(v_k ->> 'canhBao', ''), 2000);
  v_thieu    text := left(coalesce(v_k ->> 'thieu', ''), 2000);
  v_loi      text := left(coalesce(v_k ->> 'loi', ''), 2000);
  v_ten      text := left(coalesce(v_k ->> 'tenFile', ''), 200);
  v_su_kien  text;
  v_dem      jsonb := '{}'::jsonb;
begin
  -- Cùng cửa với `sao_luu_dem_that()` của `45`: chỉ tài khoản mang vai
  -- `sao_luu` ở ít nhất một cây — vai ấy chỉ SQL Editor đặt được.
  if not exists (select 1 from public.tree_members m
                  where m.user_id = auth.uid() and m.role = 'sao_luu') then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ tài khoản sao lưu tự động mới gọi được hàm này.');
  end if;

  -- Số đếm: chỉ giữ cặp tên-bảng → số nguyên, tối đa 40 cặp.
  if jsonb_typeof(v_k -> 'dem') = 'object' then
    select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) into v_dem
      from (select left(k, 60) as k, v from jsonb_each(v_k -> 'dem') e(k, v)
             where jsonb_typeof(v) = 'number' limit 40) q;
  end if;

  v_su_kien := case when not v_ok then 'sao_luu_hong'
                    when v_canh_bao <> '' or v_thieu <> '' then 'sao_luu_canh_bao'
                    else 'sao_luu_dem' end;

  perform public.ghi_nhat_ky('backup', v_su_kien, v_ten, jsonb_strip_nulls(jsonb_build_object(
    'so_byte',   case when jsonb_typeof(v_k -> 'soByte') = 'number' then v_k -> 'soByte' end,
    'da_xoa',    case when jsonb_typeof(v_k -> 'daXoa') = 'number' then v_k -> 'daXoa' end,
    'canh_bao',  nullif(v_canh_bao, ''),
    'thieu',     nullif(v_thieu, ''),
    'loi',       nullif(v_loi, ''),
    'dem',       case when v_dem = '{}'::jsonb then null else v_dem end)));

  return jsonb_build_object('ok', true, 'suKien', v_su_kien);
end;
$$;

revoke all on function public.ghi_sao_luu_dem(jsonb) from public, anon;
grant execute on function public.ghi_sao_luu_dem(jsonb) to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — mọi dòng phải ĐẠT
-- ============================================================
select 1 as stt, 'hàm ghi_sao_luu_dem có, authenticated gọi được' as ten_kiem,
       case when has_function_privilege('authenticated', 'public.ghi_sao_luu_dem(jsonb)', 'execute')
            then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'anon KHÔNG gọi được',
       case when not has_function_privilege('anon', 'public.ghi_sao_luu_dem(jsonb)', 'execute')
            then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'nhật ký nhận loại backup',
       case when exists (select 1 from pg_constraint
                          where conname = 'nhat_ky_he_thong_loai_check'
                            and pg_get_constraintdef(oid) like '%backup%')
            then 'ĐẠT' else 'HỎNG' end
order by 1;
