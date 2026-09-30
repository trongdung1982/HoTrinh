-- ============================================================
-- giapha-supabase · luoc-do/44-sao-luu-bang-he-thong.sql
-- Vai trò  : b137 — cho bản sao lưu đêm chép SÁU bảng cấp hệ thống mà trước
--            nay nó bỏ sót: `cau_hinh` · `tai_khoan` · `doi_ma_toan_cuc` ·
--            `de_xuat_gan_nguoi` · `de_nghi_quan_he` · `de_xuat_dong_ho`.
--            Một hàm `sao_luu_bang_he_thong()`, chỉ máy sao lưu gọi được.
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `43`. Dán lại nhiều lần được.
--            ⚠ Dán xong phải chép `sao-luu/SaoLuu.gs` bản 0.4.0 vào dự án
--            Apps Script sao lưu — thiếu bước ấy thì hàm nằm đó không ai gọi.
-- Sổ tay   : sao-luu/HUONG-DAN-SAO-LUU.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b137.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 28/09/2026
-- ============================================================
--
-- ═══ VÌ SAO MỘT HÀM, KHÔNG MỞ SÁU LUẬT RLS ═══
--
-- `05` mở RLS cho vai `sao_luu` ở ba bảng theo CÂY — mỗi dòng có `tree_id`
-- để hỏi "máy này có giữ vai ở cây ấy không". Sáu bảng ở đây phần lớn KHÔNG
-- theo cây (`tai_khoan` · `cau_hinh`), và `tai_khoan` giữ cờ Quản trị hệ
-- thống: thêm một luật đọc trên nó là thêm một cửa vào đúng bảng từng thủng
-- ở b102 (`11` Bẫy 4). Một hàm `security definer` với MỘT hàng rào ở đầu thì
-- không đụng luật nào của bảng nào, và đọc lại một lần là thấy hết.
--
-- ⚠ Hàng rào hỏi thẳng `tree_members.role = 'sao_luu'`, KHÔNG hỏi `vai_tro()`
--   — cùng lý lẽ `la_may_sao_luu()` ở `16` mục 2.
--
-- ⚠ Trả TRỌN sáu bảng, không lọc theo cây máy sao lưu đang giữ (khác
--   `ds_tai_khoan()` của `05`): bảng cấp hệ thống không có cây để lọc. Mật
--   khẩu máy sao lưu lọt ra thì người cầm nó đọc được cờ quyền và đơn đề xuất
--   — cùng mức với cái họ đã đọc được hôm nay (mọi người của mọi cây), và vẫn
--   KHÔNG ghi được gì.
--
-- ⚠ Hai bảng nhật ký (`42`) KHÔNG đi qua hàm này — từ b166 chúng có hàm
--   riêng `sao_luu_nhat_ky()` ở `65`, vào ngăn riêng `nhatKy` của file.

begin;

create or replace function public.sao_luu_bang_he_thong()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.tree_members m
                  where m.user_id = auth.uid() and m.role = 'sao_luu') then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ tài khoản sao lưu tự động mới gọi được hàm này.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'bang', jsonb_build_object(
      'cau_hinh',          coalesce((select jsonb_agg(to_jsonb(x)) from public.cau_hinh x), '[]'::jsonb),
      'tai_khoan',         coalesce((select jsonb_agg(to_jsonb(x) order by x.user_id)
                                       from public.tai_khoan x), '[]'::jsonb),
      'doi_ma_toan_cuc',   coalesce((select jsonb_agg(to_jsonb(x) order by x.tree_id, x.loai, x.ma_cu)
                                       from public.doi_ma_toan_cuc x), '[]'::jsonb),
      'de_xuat_gan_nguoi', coalesce((select jsonb_agg(to_jsonb(x) order by x.id)
                                       from public.de_xuat_gan_nguoi x), '[]'::jsonb),
      'de_nghi_quan_he',   coalesce((select jsonb_agg(to_jsonb(x) order by x.id)
                                       from public.de_nghi_quan_he x), '[]'::jsonb),
      'de_xuat_dong_ho',   coalesce((select jsonb_agg(to_jsonb(x) order by x.id)
                                       from public.de_xuat_dong_ho x), '[]'::jsonb)
    ));
end;
$$;

revoke all on function public.sao_luu_bang_he_thong() from public, anon;
grant execute on function public.sao_luu_bang_he_thong() to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — hình dạng. Ai gọi được, trả đủ dòng chưa: bàn thử.
-- ============================================================
select 1 as stt, 'hàm sao_luu_bang_he_thong() đã có' as ten_kiem,
  case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'sao_luu_bang_he_thong')
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'authenticated gọi được, anon thì không',
  case when has_function_privilege('authenticated', 'public.sao_luu_bang_he_thong()', 'execute')
        and not has_function_privilege('anon', 'public.sao_luu_bang_he_thong()', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'có ít nhất một tài khoản mang vai sao_luu (không có thì hàm vô dụng)',
  case when exists (select 1 from public.tree_members where role = 'sao_luu')
       then 'ĐẠT' else 'XEM LẠI' end
order by stt;
