-- ============================================================
-- giapha-supabase · luoc-do/34-gan-nguoi-tai-khoan.sql
-- Vai trò  : b126a — BƯỚC ĐẦU của "gắn người + dòng họ về Hồ sơ cá nhân"
--            (chốt 23/09/2026, `THIET-KE-NHIEU-CAY.md` mục 6). File này ĐỔI
--            BÊN ĐỌC: cột `tai_khoan.person_id` + `tai_khoan.cay_chinh_id`,
--            di dữ liệu từ `tree_members.person_id`, sửa `nguoi_gan()`.
-- Chạy ở   : Supabase → SQL Editor. Chạy SAU `23`. ⚠⚠ KHÔNG DÁN MỘT MÌNH LÊN
--            MÁY THẬT/STAGING — phải dán CÙNG LÚC với `35` (b126b, đổi BÊN
--            GHI). Đổi đọc mà chưa đổi ghi là: quản trị gắn mã qua cửa cũ,
--            `nguoi_gan()` không thấy nữa — hỏng im lặng. Hôm nay CHỈ chạy
--            trên bàn thử (`kiem-thu/ban-thu-sql/do-b126a.mjs`).
-- Phiên bản: 0.1.0 · Cập nhật: 26/09/2026 (b126a)
-- Thiết kế : THIET-KE-NHIEU-CAY.md mục 6, khối "GẮN NGƯỜI và DÒNG HỌ"
-- Sổ tay   : so-tay/phan-quyen.md · so-tay/luu-du-lieu.md
-- ============================================================
--
-- ═══ VÌ SAO ĐỔI ═══
--
-- Hôm nay `tree_members.person_id` trả lời câu "tôi là ai TRONG CÂY NÀY" —
-- mỗi cây một câu trả lời riêng cho cùng một người. Chủ dự án chỉ ra: một
-- người là duy nhất, một tài khoản cũng duy nhất, nên câu đúng phải hỏi MỘT
-- LẦN, MỘT CHỖ: "tôi là ai". File này chuyển câu trả lời ấy sang cấp TÀI
-- KHOẢN (`tai_khoan.person_id`), và thêm "dòng họ" — thực chất là **cây
-- chính** đã chốt ở cuối mục 6 (17/09): một khái niệm KHÁC hẳn `cay_mac_dinh`
-- của `11` (đó là cây mặc định TOÀN HỆ THỐNG do QTHT đặt cho mọi người chưa
-- có gì; đây là cây một NGƯỜI tự chọn cho chính mình).
--
-- ═══ `nguoi_gan(p_tree)` GIỮ NGUYÊN CHỮ KÝ ═══
--
-- Bảy chỗ gọi nó (`03`/`06`/`16`/`23`/`25`/`27`/`28`/`32`) không đổi một chữ.
-- Nó vẫn đòi người gọi là thành viên ĐÃ DUYỆT của CHÍNH cây `p_tree` — chỉ đổi
-- nguồn lấy mã người, từ cột theo cây sang cột theo tài khoản. `pham_vi_sua()`
-- không đổi: gốc ngoài cây vẫn ra phạm vi rỗng (b122a), nên một người xuyên
-- cây gắn ở cấp tài khoản mà đang mở một cây họ không thuộc thì vẫn không có
-- gì để sửa — đúng luật cũ, không mở thêm lỗ nào.
--
-- ═══ DI DỮ LIỆU — KHÔNG TỰ ĐOÁN CHỖ LỆCH ═══
--
-- Một tài khoản có thể đã gắn HAI mã người khác nhau ở hai cây (dữ liệu giả
-- hôm nay không cây nào dùng chung người, nhưng đừng tin — cứ kiểm). Bàn thử
-- BÁO RA danh sách ấy, KHÔNG tự chọn: chọn sai một mã là gắn nhầm cụ tổ, và
-- không ai phát hiện cho tới khi họ thấy quyền sửa sai người. Tài khoản chỉ
-- gắn ĐÚNG một mã (dù ở một hay nhiều cây) mới được chuyển tự động.

begin;

-- ============================================================
-- 1. CỘT MỚI TRÊN tai_khoan
-- ============================================================
alter table public.tai_khoan
  add column if not exists person_id    text references public.persons(id) on delete set null,
  add column if not exists cay_chinh_id uuid references public.trees(id)   on delete set null;

comment on column public.tai_khoan.person_id is
  'Tài khoản này CHÍNH LÀ người mang mã này trong toàn phần mềm — MỘT cột, '
  'không theo cây. Chỉ ghi được qua duong duyet (b126b), không ai tự đặt.';
comment on column public.tai_khoan.cay_chinh_id is
  '"Dòng họ" của người này = cây họ tự nhận là chính, KHÁC hẳn cay_mac_dinh() '
  '(cây mặc định của toàn hệ thống). Tự chọn trong các cây mình là thành '
  'viên; QTHT duyệt, trừ khi người chọn chính là QTHT (b126c).';

-- ⚠ Một người chỉ đứng tên MỘT tài khoản — chỉ mục có điều kiện, không phải
--   ràng buộc unique trơn: nhiều dòng `person_id is null` vẫn phải cho qua.
create unique index if not exists tai_khoan_mot_nguoi_mot_tk
  on public.tai_khoan (person_id) where person_id is not null;

-- ============================================================
-- 2. DI DỮ LIỆU TỪ tree_members.person_id
-- ============================================================
-- ⚠ CHỈ chuyển tài khoản đang gắn ĐÚNG MỘT mã (dù ở một cây hay nhiều cây
--   đồng ý). Tài khoản gắn LỆCH giữa các cây bị BỎ QUA — cột ở lại `null`,
--   và mục 3 in ra danh sách ấy để chủ dự án tự tay chọn trước khi dán thật.
update public.tai_khoan tk
   set person_id = mot.ma
  from (
    select user_id, min(person_id) as ma
      from public.tree_members
     where person_id is not null
     group by user_id
    having count(distinct person_id) = 1
  ) mot
 where mot.user_id = tk.user_id
   and tk.person_id is null;

-- ============================================================
-- 3. BÁO CHỖ LỆCH — đọc TRƯỚC khi coi bước này xong
-- ============================================================
select 'CẦN XEM TAY — tài khoản gắn LỆCH mã người giữa các cây (' ||
       count(*) || ' tài khoản): ' ||
       coalesce(string_agg(user_id::text || ' → ' || ma, '; '), '(không có)')
  as "Chỗ lệch, chưa tự chuyển"
  from (
    select user_id, string_agg(distinct person_id, '/' order by person_id) as ma
      from public.tree_members
     where person_id is not null
     group by user_id
    having count(distinct person_id) > 1
  ) x;

-- ============================================================
-- 4. `nguoi_gan(p_tree)` — BẢN ĐỨNG CUỐI, đọc TÀI KHOẢN
-- ============================================================
-- Bản `06`: `select person_id from tree_members where tree_id = p_tree and
-- user_id = auth.uid() and approved and person_id is not null`. Dưới đây đổi
-- ĐÚNG một chỗ — nguồn của `person_id` — giữ nguyên hai điều kiện kia.
create or replace function public.nguoi_gan(p_tree uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select tk.person_id
    from public.tai_khoan tk
    join public.tree_members tm
      on tm.tree_id = p_tree and tm.user_id = tk.user_id
   where tk.user_id = auth.uid()
     and tm.approved
     and tk.person_id is not null;
$$;

commit;

-- ============================================================
-- 5. TỰ KIỂM — hỏi HÌNH DẠNG. Hành vi thì bàn thử hỏi (do-b126a.mjs)
-- ============================================================
select 'PHÉP 1 · tai_khoan.person_id đã có: ' ||
  case when exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'tai_khoan'
                       and column_name = 'person_id')
       then 'ĐẠT' else 'HỎNG' end as tu_kiem
union all
select 'PHÉP 2 · tai_khoan.cay_chinh_id đã có: ' ||
  case when exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'tai_khoan'
                       and column_name = 'cay_chinh_id')
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 3 · chỉ mục "một người một tài khoản" đã có: ' ||
  case when exists (select 1 from pg_indexes
                     where schemaname = 'public'
                       and indexname = 'tai_khoan_mot_nguoi_mot_tk')
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 4 · nguoi_gan() đọc tai_khoan, không đọc tm.person_id: ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'nguoi_gan')
            ilike '%tai_khoan%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'nguoi_gan')
            not ilike '%tm.person_id%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 5 · nguoi_gan() vẫn đòi approved (giữ luật cũ): ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'nguoi_gan')
            ilike '%approved%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 6 · nguoi_gan() vẫn đòi person_id is not null: ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'nguoi_gan')
            ilike '%person_id is not null%'
       then 'ĐẠT' else 'HỎNG' end;
