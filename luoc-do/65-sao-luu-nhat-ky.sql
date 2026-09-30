-- ============================================================
-- giapha-supabase · luoc-do/65-sao-luu-nhat-ky.sql
-- Vai trò  : b166 — cho bản sao lưu đêm chép HAI bảng nhật ký hệ thống
--            (`nhat_ky_he_thong` · `nhat_ky_lo_rac`, dựng ở `42`). Một hàm
--            `sao_luu_nhat_ky()`, chỉ máy sao lưu gọi được.
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `42` và `44`. Dán lại nhiều lần được.
--            Không định nghĩa lại hàm nào của file khác → không kéo chuỗi dán lại.
--            ⚠ Dán xong phải chép `sao-luu/SaoLuu.gs` bản 0.11.0 vào dự án
--            Apps Script sao lưu — thiếu bước ấy thì hàm nằm đó không ai gọi.
-- Sổ tay   : so-tay/sao-luu.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b166.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 30/09/2026 (b166)
-- ============================================================
--
-- ⚠ HÀM RIÊNG, không sửa `sao_luu_bang_he_thong()` của `44`: sửa hàm ấy ở
--   đây là `65` đứng cuối cho nó, dán lại `44` sau này thì mất nhật ký khỏi
--   sao lưu, im lặng. Cùng hàng rào với `44` (hỏi thẳng vai `sao_luu`).
--
-- ⚠ Nhật ký nằm ở ngăn RIÊNG `nhatKy` của file sao lưu, KHÔNG ở ngăn `bang`
--   — và khôi phục (`54` · `khoi-phuc.mjs`) KHÔNG đổ nó lại. Khôi phục về
--   hôm qua mà xoá nhật ký là xoá luôn dấu vết của việc làm sau hôm qua,
--   gồm cả việc làm hỏng dữ liệu. Bản chép trong file là để CÒN, ngày mất
--   cả project; muốn đổ lại thì đổ tay.
--
-- ⚠ Trả CẢ dòng đang nằm trong thùng rác nhật ký (`lo_rac` khác trống).

begin;

do $$
begin
  if to_regclass('public.nhat_ky_he_thong') is null or to_regclass('public.nhat_ky_lo_rac') is null then
    raise exception 'DỪNG: chưa dán 42-nhat-ky-he-thong.sql (thiếu hai bảng nhật ký).';
  end if;
end $$;

create or replace function public.sao_luu_nhat_ky()
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
      'nhat_ky_lo_rac',   coalesce((select jsonb_agg(to_jsonb(x) order by x.id)
                                      from public.nhat_ky_lo_rac x), '[]'::jsonb),
      'nhat_ky_he_thong', coalesce((select jsonb_agg(to_jsonb(x) order by x.id)
                                      from public.nhat_ky_he_thong x), '[]'::jsonb)
    ));
end;
$$;

revoke all on function public.sao_luu_nhat_ky() from public, anon;
grant execute on function public.sao_luu_nhat_ky() to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — hình dạng. Ai gọi được, trả đủ dòng chưa: bàn thử `do-b166.mjs`.
-- ============================================================
select 1 as stt, 'hàm sao_luu_nhat_ky() đã có' as ten_kiem,
  case when to_regprocedure('public.sao_luu_nhat_ky()') is not null
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'authenticated gọi được, anon thì không',
  case when has_function_privilege('authenticated', 'public.sao_luu_nhat_ky()', 'execute')
        and not has_function_privilege('anon', 'public.sao_luu_nhat_ky()', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'hai bảng nhật ký vẫn KHÔNG ai đọc thẳng được',
  case when not (has_table_privilege('authenticated', 'public.nhat_ky_he_thong', 'select')
              or has_table_privilege('authenticated', 'public.nhat_ky_lo_rac', 'select'))
       then 'ĐẠT' else 'HỎNG' end
order by stt;
