-- ============================================================
-- Claude_Code · supabase/luoc-do/41-thanh-vien-doc-tai-khoan.sql
-- Vai trò  : b132 — sửa hai hàm còn đọc CỘT CHẾT `tree_members.person_id`
--            (chết từ `26`/b126, chỉ nguồn thật là `tai_khoan.person_id`).
--            Cùng bệnh, cùng thuốc với `39` mục 8 (`ds_lien_ket_cay`, đã dán).
-- Lớp      : (ngoài bậc thang) — SQL dán tay vào Supabase, không qua app
-- Sổ tay   : so-tay/luu-mot-dong-quan-tri.md
-- Chạy sau : `40` (không định nghĩa lại hàm nào của `40` nên không bắt buộc,
--            nhưng đây là file cao số nhất — dán theo đúng thứ tự vẫn hơn)
-- Phiên bản: 0.1.0 · Cập nhật: 27/09/2026 (b132)
-- ============================================================
--
-- KHÔNG đổi danh sách cột trả về của hai hàm (JS đọc theo TÊN cột, không đổi
-- gì ở `sb.js`) — nên `create or replace` không cần `drop` trước, và không
-- cần `grant` lại: quyền cũ do `14`/`18`/`20`/`27` cấp vẫn còn nguyên,
-- đúng như `27` đã làm khi nó tự sửa hai hàm này lần trước (không `grant` lại).
--
-- Sửa ĐÚNG một chỗ ở mỗi hàm: nguồn của `person_id`/`ten_nguoi` đổi từ
-- `tm.person_id` (ghi bởi `duyet_thanh_vien()`, không còn ai đọc để dùng
-- thật từ b126) sang `tai_khoan.person_id` (nguồn ĐÚNG, một tài khoản một
-- người trong toàn phần mềm), và lọc qua `tree_persons` để chỉ nhận khi
-- người ấy thật sự có mặt ở CÂY đang hỏi — một tài khoản có thể gắn một
-- người mà người ấy chưa/không có ở cây này (gắn là chuyện toàn phần mềm,
-- không theo cây, xem `34`).

begin;

-- ============================================================
-- 1. ds_thanh_vien(p_tree) — bảng "Thành viên & quyền" (trang Cây)
-- ============================================================
create or replace function public.ds_thanh_vien(p_tree uuid)
returns table(
  user_id    uuid,
  email      text,
  ma_ngan    text,
  vai        text,
  approved   boolean,
  person_id  text,
  ten_nguoi  text,
  tin_cay    boolean,
  la_chu_cay boolean,
  xin_luc    timestamp with time zone,
  loi_nhan   text,
  added_at   timestamp with time zone,
  moi_luc    timestamp with time zone,
  moi_vai    text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select tm.user_id,
         tm.email,
         coalesce(tk.ma_ngan, ''),
         tm.role,
         tm.approved,
         tp.person_id,
         coalesce(nullif(public.ten_day_du(p.names), ''), tp.person_id, ''),
         tm.tin_cay,
         coalesce(t.chu_so_huu = tm.user_id, false),
         tm.xin_luc,
         tm.loi_nhan,
         tm.added_at,
         tm.moi_luc,
         coalesce(tm.moi_vai, '')
    from public.tree_members tm
    join public.trees t           on t.id = tm.tree_id
    left join public.tai_khoan tk on tk.user_id = tm.user_id
    left join public.tree_persons tp
           on tp.person_id = tk.person_id and tp.tree_id = tm.tree_id
    left join public.persons p    on p.id = tp.person_id
   where tm.tree_id = p_tree
     and public.co_the_kiem_duyet(p_tree)
   order by (t.chu_so_huu = tm.user_id) desc nulls last,
            tm.approved, tm.role, tm.email;
$$;

-- ============================================================
-- 2. ds_cay_cua_tai_khoan(p_user) — bảng sâu (trang Tài khoản của tôi,
--    khu Tài khoản hệ thống → "Các gia phả tôi tham gia")
-- ============================================================
create or replace function public.ds_cay_cua_tai_khoan(p_user uuid)
returns table(
  tree_id    uuid,
  ten        text,
  tree_code  text,
  vai        text,
  approved   boolean,
  moi_luc    timestamp with time zone,
  moi_vai    text,
  person_id  text,
  ten_nguoi  text,
  tin_cay    boolean,
  la_chu_cay boolean,
  added_at   timestamp with time zone
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select tm.tree_id,
         t.name,
         t.tree_code,
         tm.role,
         tm.approved,
         tm.moi_luc,
         tm.moi_vai,
         tp.person_id,
         coalesce(nullif(public.ten_day_du(p.names), ''), tp.person_id, ''),
         tm.tin_cay,
         coalesce(t.chu_so_huu = tm.user_id, false),
         tm.added_at
    from public.tree_members tm
    join public.trees t on t.id = tm.tree_id
    left join public.tai_khoan tk on tk.user_id = tm.user_id
    left join public.tree_persons tp
           on tp.person_id = tk.person_id and tp.tree_id = tm.tree_id
    left join public.persons p on p.id = tp.person_id
   where tm.user_id = p_user
     and public.la_quan_tri_he_thong()
   order by t.name;
$$;

commit;

-- ============================================================
-- 3. TỰ KIỂM — hỏi HÌNH DẠNG (nguồn cột). Hành vi thì bàn thử hỏi
--    (`do-b132.mjs`), cùng luật ghi ở `phan-quyen.md` bài học cuối.
-- ============================================================
select 1 as stt, 'ds_thanh_vien() đọc tk.person_id, không còn tm.person_id' as ten_kiem,
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'ds_thanh_vien')
            ilike '%tk.person_id%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'ds_thanh_vien')
        not ilike '%tm.person_id%'
       then 'ĐẠT' else 'HỎNG' end as tu_kiem
union all
select 2, 'ds_cay_cua_tai_khoan() đọc tk.person_id, không còn tm.person_id',
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'ds_cay_cua_tai_khoan')
            ilike '%tk.person_id%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'ds_cay_cua_tai_khoan')
        not ilike '%tm.person_id%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'anon vẫn KHÔNG gọi được ds_thanh_vien()',
  case when not has_function_privilege('anon', 'public.ds_thanh_vien(uuid)', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'anon vẫn KHÔNG gọi được ds_cay_cua_tai_khoan()',
  case when not has_function_privilege('anon', 'public.ds_cay_cua_tai_khoan(uuid)', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 5, 'authenticated vẫn gọi được cả hai',
  case when has_function_privilege('authenticated', 'public.ds_thanh_vien(uuid)', 'execute')
        and has_function_privilege('authenticated', 'public.ds_cay_cua_tai_khoan(uuid)', 'execute')
       then 'ĐẠT' else 'HỎNG' end
 order by stt;
