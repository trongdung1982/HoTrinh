-- ============================================================
-- giapha-supabase · luoc-do/38-so-tai-khoan-mot-nguoi.sql
-- Vai trò  : b126d — Sổ tài khoản (Quản trị hệ thống) đọc "Người được gắn"
--            theo mô hình MỘT MÃ MỘT TÀI KHOẢN của `34`, thay cho mảng
--            `nguoi_gan` cũ (mỗi cây một mã, trần 3 phần tử). Thêm cột dòng
--            họ (`37`) để Sổ tài khoản thấy luôn kết quả đơn đã duyệt.
-- Chạy ở   : Supabase → SQL Editor. Chạy SAU `37`, CÙNG buổi với `34→35→36→37`
--            — hàm này đọc `tai_khoan.person_id`/`cay_chinh_id`, hai cột `34`
--            mới thêm. Dán trước `34` thì `do $$` bên dưới chặn ngay.
-- Phiên bản: 0.1.0 · Cập nhật: 26/09/2026 (b126d)
-- Thiết kế : KE-HOACH.md mục b126d
-- Sổ tay   : so-tay/phan-quyen.md
-- ============================================================
--
-- ═══ VÌ SAO ĐỔI ═══
--
-- `20`/`23` xây `nguoi_gan` bằng cách gộp `tree_members.person_id` của TỪNG
-- CÂY — đúng khi một tài khoản có thể gắn khác mã ở mỗi cây. Từ `34`, gắn là
-- CHUYỆN CỦA TÀI KHOẢN — một mã, không theo cây — nên câu hỏi "người được gắn"
-- nay chỉ có MỘT câu trả lời, đọc thẳng `tai_khoan.person_id`. Giữ cột cũ lại
-- là hiện một thông tin đã ngừng đúng (cột ấy không ai ghi nữa từ `35`).

begin;

-- ⚠ HÀNG RÀO THỨ TỰ DÁN: thiếu `34` thì dừng ngay, nói bằng tiếng Việt.
do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'tai_khoan'
                    and column_name = 'person_id') then
    raise exception 'DỪNG: chưa dán 34-gan-nguoi-tai-khoan.sql. Thứ tự đúng: 34 → 35 → 36 → 37 → 38.';
  end if;
end $$;

-- ============================================================
-- 1. ds_tai_khoan_he_thong() — BỎ so_cay_gan/nguoi_gan, THÊM bốn cột
-- ============================================================
-- ⚠ `drop function` TRƯỚC là bắt buộc: danh sách cột đổi thì `create or
--   replace` ném `42P13`. Và nó XOÁ CẢ `grant` — mục 2 cấp lại.
drop function if exists public.ds_tai_khoan_he_thong();

create or replace function public.ds_tai_khoan_he_thong()
returns table (
  user_id            uuid,
  email              text,
  ho_ten             text,
  vai_cao_nhat       text,
  ma_ngan            text,
  la_quan_tri_he_thong boolean,
  duoc_tao_cay       boolean,
  so_cay             bigint,
  so_cho             bigint,
  so_moi             bigint,
  so_cay_lam_chu     bigint,
  tao_luc            timestamptz,
  dang_nhap_gan_nhat timestamptz,
  da_xac_nhan_email  boolean,
  khoa_luc           timestamptz,
  khoa_ly_do         text,
  email_khoa_boi     text,
  qtht_moi_luc       timestamptz,
  email_qtht_moi_boi text,
  -- Bốn cột mới (b126d) — thay cho `so_cay_gan`/`nguoi_gan` của `20`/`23`.
  nguoi_gan_ma       text,
  nguoi_gan_ten      text,
  cay_chinh_id       uuid,
  ten_dong_ho        text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u.id,
         u.email::text,
         coalesce(tk.ho_ten, ''),
         (case
            when exists (select 1 from public.trees t where t.chu_so_huu = u.id)
              then 'chu_cay'
            else coalesce((
              select m.role from public.tree_members m
               where m.user_id = u.id and m.approved
               order by case m.role
                          when 'quan_tri' then 1
                          when 'sua'      then 2
                          when 'xem'      then 3
                          when 'sao_luu'  then 4
                          else 5 end
               limit 1), '')
          end),
         coalesce(tk.ma_ngan, ''),
         coalesce(tk.la_quan_tri_he_thong, false),
         coalesce(tk.duoc_tao_cay, false),
         (select count(*) from public.tree_members m
           where m.user_id = u.id and m.approved),
         (select count(*) from public.tree_members m
           where m.user_id = u.id and not m.approved and m.moi_luc is null),
         (select count(*) from public.tree_members m
           where m.user_id = u.id and not m.approved and m.moi_luc is not null),
         (select count(*) from public.trees t where t.chu_so_huu = u.id),
         u.created_at,
         u.last_sign_in_at,
         (u.email_confirmed_at is not null),
         tk.khoa_luc,
         coalesce(tk.khoa_ly_do, ''),
         coalesce(uk.email::text, ''),
         tk.qtht_moi_luc,
         coalesce(um.email::text, ''),
         tk.person_id,
         coalesce(nullif(public.ten_day_du(p.names), ''), tk.person_id, ''),
         tk.cay_chinh_id,
         coalesce(tc.name, '')
    from auth.users u
    left join public.tai_khoan tk on tk.user_id = u.id
    left join auth.users uk on uk.id = tk.khoa_boi
    left join auth.users um on um.id = tk.qtht_moi_boi
    left join public.persons p on p.id = tk.person_id
    left join public.trees tc on tc.id = tk.cay_chinh_id
   where public.la_quan_tri_he_thong()
   order by u.created_at;
$$;

-- ============================================================
-- 2. QUYỀN GỌI — `drop function` ở mục 1 đã xoá cả grant cũ.
-- ============================================================
revoke all on function public.ds_tai_khoan_he_thong() from public, anon;
grant execute on function public.ds_tai_khoan_he_thong() to authenticated;

commit;

-- ============================================================
-- 3. TỰ KIỂM — hỏi HÌNH DẠNG. Hành vi thì bàn thử hỏi (do-b126d.mjs nếu có)
-- ============================================================
select 'PHÉP 1 · ds_tai_khoan_he_thong() trả đủ 23 cột: ' ||
  case when (select array_length(p.proallargtypes, 1) from pg_proc p
              join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'ds_tai_khoan_he_thong') = 23
       then 'ĐẠT' else 'HỎNG' end as tu_kiem
union all
select 'PHÉP 2 · KHÔNG còn cột so_cay_gan/nguoi_gan (jsonb cũ): ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'ds_tai_khoan_he_thong')
            not ilike '%jsonb_agg%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 3 · nguoi_gan_ma đọc tk.person_id (một mã, không theo cây): ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'ds_tai_khoan_he_thong')
            ilike '%tk.person_id%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 4 · ten_dong_ho đọc tk.cay_chinh_id qua bảng trees: ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'ds_tai_khoan_he_thong')
            ilike '%tk.cay_chinh_id%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 5 · anon KHÔNG gọi được: ' ||
  case when not has_function_privilege('anon', 'public.ds_tai_khoan_he_thong()', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 6 · authenticated gọi được: ' ||
  case when has_function_privilege('authenticated', 'public.ds_tai_khoan_he_thong()', 'execute')
       then 'ĐẠT' else 'HỎNG' end;
