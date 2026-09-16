-- ============================================================
-- giapha-supabase · luoc-do/23-bon-luat-moi.sql
-- Vai trò  : BỐN LUẬT MỚI chốt 15/09/2026 (`THIET-KE-NHIEU-CAY.md` mục 11.9)
--            + một việc thứ năm đi kèm: XIN ĐỔI QUYỀN.
--              1. Xoá tài khoản = KHOÁ MỀM 60 ngày, hết hạn mới xoá hẳn
--              2. Bật cờ Quản trị hệ thống = HAI CHỮ KÝ (mời → tự nhận)
--              3. Thùng rác cây giữ 120 ngày (từ lúc QTHT duyệt)
--              4. Chủ bấm xoá → cây ẨN NGAY → QTHT duyệt vào thùng rác
--                 hoặc trả lại cho chủ
--              5. Thành viên tự XIN ĐỔI VAI, chủ cây duyệt
-- Phiên bản: 0.1.0 · Cập nhật: 16/09/2026 (b118b)
-- ============================================================
--
-- ⚠⚠ DÁN SAU `22`. File này là bản ĐỨNG CUỐI của mười ba hàm:
--
--     la_quan_tri_he_thong · duoc_tao_cay · la_thanh_vien ·
--     co_the_xem_cay · co_the_sua · ds_gia_pha ·
--     dat_quan_tri_he_thong · xoa_tai_khoan · ds_tai_khoan_he_thong ·
--     xin_xoa_cay · huy_xin_xoa_cay · duyet_xoa_cay · don_thung_rac
--
-- ⚠⚠ CHUỖI DÁN LẠI — dán lại BẤT CỨ file nào trong `11` · `14` · `16` · `18`
--    · `20` thì BẮT BUỘC dán lại file này ngay sau, nếu không:
--      · tài khoản bị khoá mềm **mở lại** đủ mọi quyền — im lặng;
--      · lời mời QTHT chưa nhận **thành quyền thật** — im lặng;
--      · cây chủ vừa xoá **hiện lại cho cả họ đọc** — im lặng.
--    Chép gọn:  `11`/`14`/`16`/`18`/`20`  →  `23`
--
-- ⚠ TÊN HAI HÀM NAY HƠI LỆCH NGHĨA, và nói ra thay vì lặng lẽ để đó:
--   `xin_xoa_cay()` không còn là "xin" — nó ẩn cây ngay. `huy_xin_xoa_cay()`
--   không còn là người nộp rút đơn — nay chỉ Quản trị hệ thống gọi được, và
--   nghĩa thật là *trả lại cây cho chủ*. Giữ tên cũ ở bước này là **cố ý**:
--   đổi tên kéo theo `sb.js`, `sb-gia.mjs`, `trang-cay.js` và bộ ảnh chụp,
--   tức trộn một việc đổi luật với một việc đổi tên — đúng thứ `KE-HOACH.md`
--   dặn đừng làm chung. Việc đổi tên đã ghi vào mục "Còn treo".
--
-- ═══ NĂM CÂU ĐÃ HỎI VÀ ĐÃ CHỐT ═══
--
-- Bốn câu chốt 15/09/2026 (`THIET-KE-NHIEU-CAY.md` mục 11.9), ba câu nhỏ
-- chốt 16/09/2026 lúc viết file này:
--
--   · 120 ngày đếm **từ lúc QTHT duyệt** (`da_xoa_luc`), không từ lúc chủ
--     bấm. Cái giá đã nói ra trước khi chọn: QTHT chần chừ một tháng thì cây
--     nằm ẩn thêm một tháng nằm ngoài 120 ngày ấy.
--   · Tài khoản bị khoá mềm **vẫn đăng nhập được, nhưng trắng tay** — không
--     thấy cây nào, không sửa được gì. KHÔNG đụng `auth.users`. Việc chặn
--     đăng nhập thật (`banned_until`) để lại nhóm E, đi cùng Edge Function
--     tạo tài khoản — chỗ duy nhất có khoá `service_role`.
--   · Quản trị hệ thống **cuối cùng không khoá được**, y như không xoá được.
--
-- ═══⚠⚠ CHỖ DỄ LÀM SAI NHẤT CỦA CẢ FILE ═══
--
-- Luật 2 là hàm hai chữ ký thứ hai, nên **cái bẫy của mục 11.8 áp nguyên**:
-- một lời mời CHƯA NHẬN không được mang một mẩu quyền nào. Ở đây nó được
-- gác bằng hình dạng dữ liệu chứ không bằng một mệnh đề dễ quên:
--
--     lời mời nằm ở HAI CỘT RIÊNG (`qtht_moi_luc` · `qtht_moi_boi`),
--     cờ thật vẫn là `la_quan_tri_he_thong` và nó **không đổi giá trị**
--     cho tới khi người kia tự bấm Nhận.
--
-- Nên `la_quan_tri_he_thong()` vẫn chỉ đọc đúng một cột như cũ, và không có
-- đường nào để một lời mời lọt vào đó. Bảng tự kiểm cuối file đo đúng câu ấy
-- (mục 9, phép 12): sau khi được mời, người ấy đọc ra **0 cây**.
--
-- ═══⚠ VÀ CHỖ THỨ HAI: MÁY SAO LƯU ═══
--
-- File này thêm mệnh đề "chưa bị khoá" vào `la_thanh_vien()` — đúng hàm mà
-- `16` dặn **đừng động vào**. Lời dặn ấy nói về chuyện KHÁC: `16` cấm mang
-- luật thùng rác vào đây, vì bản sao lưu đêm phải chép được cây trong thùng
-- rác. Luật khoá tài khoản không đụng chuyện đó, và đường an toàn đã khoá
-- bằng một hàng rào đo được: `khoa_tai_khoan()` **từ chối khoá tài khoản
-- mang vai `sao_luu`** ở bất cứ cây nào (mục 5). Máy sao lưu không bao giờ
-- bị khoá nên `bi_khoa()` của nó vĩnh viễn `false`.
--
-- Không có hàng rào ấy thì đây đúng là lỗ hổng b102 lần thứ ba: bản sao lưu
-- đêm vẫn chạy, vẫn sinh file, vẫn đủ chín bảng, chỉ là rỗng.
--
-- Và `co_the_xem_cay()` giữ nguyên lối riêng cho `sao_luu` — nay lối ấy mở
-- cho CẢ hai trạng thái đóng (cây đang ẩn chờ QTHT, và cây trong thùng rác).
-- Quãng từ lúc chủ bấm xoá tới lúc dọn hẳn là quãng dữ liệu mong manh nhất;
-- để nó không có bản sao nào là hỏng đúng lúc không được phép hỏng.

begin;

-- ============================================================
-- 1. CỘT MỚI TRÊN `tai_khoan` — khoá mềm và lời mời QTHT
-- ============================================================
-- ⚠ `khoa_boi` và `qtht_moi_boi` khai `on delete set null`, KHÔNG `cascade`:
--   xoá tài khoản người ra lệnh khoá không được phép kéo theo người bị khoá.
--   Cùng lý lẽ `chu_so_huu` ở `11` mục 5 và `xin_xoa_boi` ở `16` mục 1.
--
-- ⚠ KHÔNG có cột `khoa_den`. Sáu mươi ngày là một phép TÍNH trên `khoa_luc`,
--   không phải một con số chép ra chỗ thứ hai — y như `16` không giữ cột
--   "ngày dọn được". Hai chỗ ghi cùng một hạn là hai chỗ để lệch nhau, và
--   chỗ lệch ấy thì không ai đọc ra bằng mắt.
--
-- ⚠ Hết 60 ngày KHÔNG tự mở khoá. Khoá đứng cho tới khi có người mở tay
--   (`mo_khoa_tai_khoan`) hoặc xoá hẳn (`xoa_tai_khoan`). Sáu mươi ngày chỉ
--   là lúc cánh cửa xoá hẳn MỞ RA — đúng nghĩa "hết hạn mới xoá hẳn".

alter table public.tai_khoan
  add column if not exists khoa_luc     timestamptz,
  add column if not exists khoa_boi     uuid references auth.users(id) on delete set null,
  add column if not exists khoa_ly_do   text not null default '',
  add column if not exists qtht_moi_luc timestamptz,
  add column if not exists qtht_moi_boi uuid references auth.users(id) on delete set null;

comment on column public.tai_khoan.khoa_luc is
  'Lúc bị khoá mềm. Còn giá trị = đang bị khoá (không tự hết hạn). Đủ 60 ngày thì xoá hẳn được.';
comment on column public.tai_khoan.qtht_moi_luc is
  'Lời mời làm Quản trị hệ thống, CHƯA NHẬN. Cột này KHÔNG mang một mẩu quyền nào — quyền thật vẫn là cờ la_quan_tri_he_thong.';

-- ============================================================
-- 2. CỘT MỚI TRÊN `tree_members` — xin đổi vai
-- ============================================================
-- Lá đơn nằm ngay trên dòng thành viên, không đẻ bảng mới: một người chỉ có
-- một lá đơn đang chờ ở một cây, và lá đơn chết theo dòng nếu họ rời cây.
--
-- ⚠ Trần ba vai, chép đúng trần của `doi_vai_thanh_vien` ở `18` mục 4: không
--   ai xin làm `sao_luu`, không ai xin làm `quan_tri_he_thong` (mã ấy `13`
--   đã đuổi khỏi bảng này).

alter table public.tree_members
  add column if not exists xin_vai       text,
  add column if not exists xin_vai_luc   timestamptz,
  add column if not exists xin_vai_ly_do text not null default '';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tree_members_xin_vai_hop_le'
  ) then
    alter table public.tree_members
      add constraint tree_members_xin_vai_hop_le
      check (xin_vai is null or xin_vai in ('quan_tri', 'sua', 'xem'));
  end if;
end $$;

-- ============================================================
-- 3. HAI HÀM HỎI NHỎ — mỗi hàm một câu, không hơn
-- ============================================================
-- ⚠ Cả hai bọc `coalesce(…, false)` và viết dạng KHẲNG ĐỊNH — Bẫy 2 của `11`
--   mục 6: không có dòng thì `select` trả `null`, và `null` trong một mệnh
--   đề `and`/`or` cho ra `null` chứ không cho ra `false`. Lỗ leo quyền
--   04/09 sinh ra đúng từ chỗ ấy, và 57 phép kiểm báo xanh suốt.

-- Tôi có đang bị khoá mềm không?
create or replace function public.bi_khoa()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select k.khoa_luc is not null
       from public.tai_khoan k where k.user_id = auth.uid()),
    false
  );
$$;

-- Người kia có đang bị khoá mềm không? (cho các hàm quản trị hỏi về người khác)
create or replace function public.bi_khoa_ai(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select k.khoa_luc is not null
       from public.tai_khoan k where k.user_id = p_user),
    false
  );
$$;

-- Cây này có đang đóng cửa không — ẩn chờ Quản trị hệ thống, HOẶC trong
-- thùng rác. Hai trạng thái, một câu hỏi, vì cả hai đóng cửa như nhau.
--
-- ⚠ Hỏi `xin_xoa_luc`, và từ file này trở đi đó là điều ĐÚNG. `16` cấm hỏi
--   nó — vì hồi ấy một lá đơn xin xoá không được khoá cây lại. Luật 4 lật
--   ngược điều ấy: chủ bấm xoá là cây ẩn ngay. Ràng buộc
--   `trees_thung_rac_hop_le` của `16` bảo đảm `da_xoa_luc` không bao giờ có
--   mà `xin_xoa_luc` lại trống, nên một cột này trả lời được cả hai trạng thái.
create or replace function public.cay_dang_an(p_tree uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select t.xin_xoa_luc is not null from public.trees t where t.id = p_tree),
    false
  );
$$;

-- ============================================================
-- 4. BỐN HÀM NỀN MÓNG — thêm đúng một mệnh đề "chưa bị khoá"
-- ============================================================
-- ⚠⚠ THÂN BỐN HÀM DƯỚI ĐÂY CHÉP NGUYÊN VĂN từ bản đứng cuối của chúng, rồi
--    bọc thêm. Viết gọn lại "cho dễ đọc" ở một hàm nền móng chính là hình
--    dạng của lỗ hổng b102: ở đó `la_thanh_vien()` bị rút một mệnh đề và
--    bảng tự kiểm 12/12 vẫn báo xanh.
--      `la_quan_tri_he_thong` ← `11` mục 6
--      `duoc_tao_cay`         ← `11` mục 11
--      `la_thanh_vien`        ← `18` mục 2  (bản LỚP HAI, không phải bản `11`)
--      `co_the_xem_cay`       ← `16` mục 3
--      `co_the_sua`           ← `16` mục 4

-- ------------------------------------------------------------
-- 4a. la_quan_tri_he_thong() — đòn bẩy lớn nhất của cả file
-- ------------------------------------------------------------
-- Một mệnh đề ở đây tắt luôn `co_the_quan_tri()`, nhánh đầu của `vai_tro()`,
-- và mọi hàm quản trị — tất cả đều hỏi hàm này. Khoá một tài khoản Quản trị
-- hệ thống là tắt hết trong cùng một nhịp.
--
-- ⚠ VẪN CHỈ ĐỌC ĐÚNG MỘT CỘT `la_quan_tri_he_thong`. Không đọc
--   `qtht_moi_luc`. Đó là toàn bộ cách luật hai chữ ký được thi hành ở đây.
create or replace function public.la_quan_tri_he_thong()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select la_quan_tri_he_thong and khoa_luc is null
       from public.tai_khoan
      where user_id = auth.uid()),
    false
  );
$$;

-- ------------------------------------------------------------
-- 4b. duoc_tao_cay()
-- ------------------------------------------------------------
-- ⚠ `tk.` không thừa: hàm và cột trùng tên. Chép nguyên lời dặn của `11`.
create or replace function public.duoc_tao_cay()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (not public.bi_khoa())
    and (
      public.la_quan_tri_he_thong()
      or (select tk.duoc_tao_cay from public.tai_khoan tk where tk.user_id = auth.uid())
    ),
    false
  );
$$;

-- ------------------------------------------------------------
-- 4c. la_thanh_vien() — bản LỚP HAI của `18`, thêm một mệnh đề
-- ------------------------------------------------------------
-- ⚠⚠ Đọc khối "MÁY SAO LƯU" ở đầu file trước khi đụng hàm này. Tóm lại:
--    thêm được mệnh đề này là nhờ `khoa_tai_khoan()` từ chối khoá tài khoản
--    mang vai `sao_luu` — không có hàng rào ấy thì đây là b102 lần ba.
create or replace function public.la_thanh_vien(p_tree uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select (not public.bi_khoa()) and (
    public.la_quan_tri_he_thong()
    or exists (
      select 1 from public.tree_members
       where tree_id = p_tree
         and user_id = auth.uid()
         and (
           approved
           or (moi_boi is null
               and role in ('quan_tri_he_thong', 'quan_tri', 'sao_luu'))
         )
    )
  );
$$;

-- ------------------------------------------------------------
-- 4d. co_the_xem_cay() — khoá ĐỌC 6 bảng nội dung
-- ------------------------------------------------------------
-- Hai điều đổi so với bản `16`:
--   · thêm `not public.bi_khoa()` — tài khoản bị khoá không đọc cây nào;
--   · `trong_thung_rac()` → `cay_dang_an()`, tức cửa đóng SỚM HƠN một nhịp:
--     từ giây chủ bấm xoá, không đợi Quản trị hệ thống duyệt. Đó chính là
--     luật 4.
--
-- ⚠ `la_quan_tri_he_thong()` vẫn nằm TRONG dấu ngoặc — Quản trị hệ thống
--   cũng KHÔNG đọc nội dung cây đang đóng. Giữ nguyên chủ ý của `16`: một
--   thùng rác mà người quyền cao nhất đọc xuyên qua thì nó là bộ lọc hiển
--   thị, không phải hàng rào. Muốn xem lại thì bấm **Trả lại cho chủ**
--   (`huy_xin_xoa_cay`) hoặc **Phục hồi** (`phuc_hoi_cay`) — một cú bấm, có
--   ghi lại, đảo ngược được.
--
-- ⚠ Lối riêng cho `sao_luu` nay phủ CẢ hai trạng thái đóng. Xem đầu file.
create or replace function public.co_the_xem_cay(p_tree uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      public.la_thanh_vien(p_tree)
      or (public.cay_mac_dinh() is not null and p_tree = public.cay_mac_dinh())
      or public.la_quan_tri_he_thong()
    )
    and not public.bi_khoa()
    and (
      not public.cay_dang_an(p_tree)
      -- Cây đang đóng vẫn phải vào được bản sao lưu đêm.
      or public.la_may_sao_luu(p_tree)
    ),
    false
  );
$$;

-- ------------------------------------------------------------
-- 4e. co_the_sua() — khoá GHI, không có lối cho ai
-- ------------------------------------------------------------
-- Ba cửa ghi cùng hỏi hàm này, nên hai mệnh đề khoá cả ba:
--   · `luu_cay()` hàng rào đầu — `03-ham-luu-cay.sql` dòng 115
--   · luật RLS `ghi_anh` trên `storage.objects` — `02-rls.sql` mục 5
--   · luật RLS `xoa_anh` trên `storage.objects` — `02-rls.sql` mục 5
create or replace function public.co_the_sua(p_tree uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when public.bi_khoa()             then false
    when public.cay_dang_an(p_tree)   then false
    when public.vai_tro(p_tree) in ('quan_tri_he_thong', 'quan_tri') then true
    when public.vai_tro(p_tree) = 'sua' then public.nguoi_gan(p_tree) is not null
    else false
  end;
$$;

-- ============================================================
-- 5. ds_gia_pha() — CHỦ CÂY VẪN THẤY DÒNG CÂY MÌNH VỪA XOÁ
-- ============================================================
-- Danh sách cột KHÔNG đổi (18 cột của `16` mục 5), nên `create or replace`
-- đủ, không cần `drop`. Đổi đúng mệnh đề `where`.
--
-- ⚠ VÌ SAO PHẢI THÊM MỘT NHÁNH. Từ luật 4, `co_the_xem_cay()` trả `false`
--   ngay khi chủ bấm xoá — mà mệnh đề `where` cũ hỏi đúng hàm ấy. Không thêm
--   gì thì cây biến mất khỏi màn hình chủ cây ngay giây họ bấm, và họ không
--   còn chỗ nào nhìn thấy nó nữa: không biết đơn đi tới đâu, không biết
--   Quản trị hệ thống đã xử lý chưa. Một việc đảo ngược được mà người trong
--   cuộc không nhìn thấy trạng thái thì trên thực tế là không đảo ngược được.
--
-- ⚠ NHÁNH ẤY DỪNG Ở THÙNG RÁC: `and t.da_xoa_luc is null`. Vào thùng rác
--   rồi thì cây biến hẳn khỏi danh sách người thường — đúng bản 0.2.0 của
--   `16` mà chủ dự án đã chốt 09/09: *"không hiện cây trong thùng rác […]
--   nhận thông báo cây đã bị xoá bởi…"*. Câu thông báo ấy là `tin_thung_rac()`.
--
-- ⚠ Nhánh chỉ mở cho ĐÚNG chủ cây, và chỉ mở ra tên/mã/số người — không mở
--   một dòng `persons` nào (`co_the_xem_cay()` vẫn khoá). Người ta đọc siêu
--   dữ liệu của cây chính mình đứng tên, không hơn.
--
-- ⚠⚠ BỐN NHÁNH CŨ CHÉP NGUYÊN, KHÔNG BỎ NHÁNH NÀO. Hàm là `security
--    definer` — bỏ `where` là mọi tài khoản đọc được tên, mã và số người của
--    MỌI gia phả trên máy chủ.

create or replace function public.ds_gia_pha()
returns table (
  id                   uuid,
  ten                  text,
  tree_code            text,
  email_chu            text,
  so_nguoi             bigint,
  vai_cua_toi          text,
  co_the_xem           boolean,
  co_the_sua_du_lieu   boolean,
  da_nop_don           boolean,
  cho_nguoi_la_thay_ten boolean,
  toi_la_chu           boolean,
  duoc_moi             boolean,
  moi_vai              text,
  email_nguoi_moi      text,
  xin_xoa_luc          timestamptz,
  xin_xoa_ly_do        text,
  email_xin_xoa        text,
  da_xoa_luc           timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    t.id,
    t.name                                       as ten,
    t.tree_code,
    au.email                                     as email_chu,
    (select count(*) from public.persons p
      where p.tree_id = t.id and p.deleted = false) as so_nguoi,
    public.vai_tro(t.id)                         as vai_cua_toi,
    public.co_the_xem_cay(t.id)                  as co_the_xem,
    public.co_the_sua(t.id)                      as co_the_sua_du_lieu,
    exists (
      select 1 from public.tree_members tm
       where tm.tree_id = t.id
         and tm.user_id = auth.uid()
         and tm.approved = false
         and tm.moi_luc is null
    )                                            as da_nop_don,
    t.cho_nguoi_la_thay_ten,
    coalesce(t.chu_so_huu = auth.uid(), false)   as toi_la_chu,
    exists (
      select 1 from public.tree_members tm
       where tm.tree_id = t.id
         and tm.user_id = auth.uid()
         and tm.approved = false
         and tm.moi_luc is not null
    )                                            as duoc_moi,
    (select tm.moi_vai from public.tree_members tm
      where tm.tree_id = t.id and tm.user_id = auth.uid()
        and tm.approved = false and tm.moi_luc is not null) as moi_vai,
    coalesce((select um.email::text
                from public.tree_members tm
                left join auth.users um on um.id = tm.moi_boi
               where tm.tree_id = t.id and tm.user_id = auth.uid()
                 and tm.approved = false and tm.moi_luc is not null), '')
                                                 as email_nguoi_moi,
    t.xin_xoa_luc,
    t.xin_xoa_ly_do,
    coalesce(ax.email::text, '')                 as email_xin_xoa,
    t.da_xoa_luc
  from public.trees t
  left join auth.users au on au.id = t.chu_so_huu
  left join auth.users ax on ax.id = t.xin_xoa_boi
  where
    public.co_the_xem_cay(t.id)
    or t.cho_nguoi_la_thay_ten = true
    or public.la_quan_tri_he_thong()
    or exists (
      select 1 from public.tree_members tm
       where tm.tree_id = t.id
         and tm.user_id = auth.uid()
         and tm.approved = false
    )
    -- Nhánh b118b: chủ cây thấy dòng cây mình vừa xoá, tới khi nó vào thùng rác.
    or (coalesce(t.chu_so_huu = auth.uid(), false)
        and t.da_xoa_luc is null
        and not public.bi_khoa())
  order by t.name;
$$;

-- ============================================================
-- 6. LUẬT 2 — BẬT CỜ QUẢN TRỊ HỆ THỐNG CẦN HAI CHỮ KÝ
-- ============================================================
-- Chữ ký thứ nhất: một Quản trị hệ thống MỜI. Chữ ký thứ hai: người được mời
-- tự bấm Nhận. Giữa hai nhịp ấy họ **không có một mẩu quyền nào**.
--
-- ⚠ TẮT CỜ VẪN LÀ MỘT CHỮ KÝ, và đó là chủ ý chứ không phải quên. Hai chữ ký
--   canh việc TRAO quyền; đòi hai chữ ký để THU quyền về là biến một việc
--   khẩn cấp thành một việc phải xin phép chính người đang bị thu. Cùng lý
--   lẽ `xoa_tai_khoan()` của `14` mục 10 đã trả giá một lần: *một hàng rào mà
--   lối đi qua nó nằm trong tay chính người đang bị đuổi thì không phải hàng
--   rào*.

-- ------------------------------------------------------------
-- 6a. so_qtht_dung_tru(p_user) — ĐẾM NGƯỜI CÒN ĐỨNG, TRỪ một người ra
-- ------------------------------------------------------------
-- Ba hàm dùng nó để hỏi đúng một câu: *bỏ người này đi thì còn ai quản trị
-- hệ thống không?* — `dat_quan_tri_he_thong(…, false)` · `khoa_tai_khoan()`
-- · `xoa_tai_khoan()`.
--
-- ⚠ HAI CHỖ ĐỔI SO VỚI PHÉP ĐẾM CŨ Ở `14` mục 7, và cả hai đều cần:
--
--   1. **Đếm người có cờ VÀ chưa bị khoá.** Bản cũ đếm cờ trơn. Từ hôm nay
--      đếm thế là sai theo hướng nguy hiểm nhất: một Quản trị hệ thống đang
--      bị khoá vẫn được tính là "còn một người", nên phép không-tắt-người-
--      cuối-cùng tưởng còn hai mà thật ra còn không.
--
--   2. **Trừ chính người đang bị đụng ra.** Bản cũ đếm cả họ, và cộng với
--      điều 1 thì nó đẻ ra một lời TỪ CHỐI SAI, đo được: QT1 và QT2 đều là
--      Quản trị hệ thống, QT1 khoá QT2 → còn QT1 đứng. Nay QT1 muốn hạ nốt
--      cờ của QT2 (người đang bị khoá, không phục vụ gì) thì phép đếm cũ trả
--      về 1 và từ chối — trong khi hạ xong vẫn còn nguyên QT1. Cửa bị khoá
--      bằng một câu đúng ngữ pháp mà sai nghĩa.
--
-- ⚠⚠ VÀ NÓI THẲNG ĐIỀU BÀN THỬ KHÔNG CHỨNG MINH ĐƯỢC: với ba hàm gọi nó hôm
--    nay, nhánh từ chối này **không với tới được**. Người gọi bắt buộc là
--    Quản trị hệ thống còn đứng, và cả ba hàm đều chặn trỏ vào chính mình
--    trước đó — nên người gọi luôn tự mình làm cho phép đếm ≥ 1. Giữ lại vì
--    nó rẻ và vì nó có việc vào ngày ai đó nới hàng rào người gọi; **đừng
--    đọc nó như một hàng rào đã được đo**. Cái đo được là điều 2 ở trên: nó
--    gỡ một lời từ chối sai, không phải dựng một lời từ chối đúng.
create or replace function public.so_qtht_dung_tru(p_user uuid)
returns int
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select count(*)::int from public.tai_khoan
   where la_quan_tri_he_thong = true
     and khoa_luc is null
     and user_id is distinct from p_user;
$$;

-- ------------------------------------------------------------
-- 6b. dat_quan_tri_he_thong(p_user, p_bat) — nay là MỜI, không phải BẬT
-- ------------------------------------------------------------
-- Chép nguyên bốn hàng rào của `14` mục 7, đổi đúng phần thân:
--   `p_bat = true`  → ghi LỜI MỜI, cờ không đổi giá trị;
--   `p_bat = false` → tắt cờ ngay, và xoá luôn lời mời chưa nhận nếu có.
create or replace function public.dat_quan_tri_he_thong(
  p_user uuid,
  p_bat  boolean
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_co    boolean;
  v_moi   timestamptz;
  v_email text;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới đặt được cờ này.');
  end if;

  if public.la_chinh_minh(p_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Không ai đặt quyền cho chính mình được, kể cả cờ này. Nhờ một Quản trị ' ||
      'hệ thống khác làm.');
  end if;

  select u.email::text into v_email from auth.users u where u.id = p_user;
  if v_email is null then
    return jsonb_build_object('ok', false, 'loi', 'Không có tài khoản này.');
  end if;

  -- Dòng `tai_khoan` sinh ra cùng tài khoản (trigger `sau_khi_tao_user` của
  -- `11` mục 2); `insert … on conflict` dưới đây là để hàm không hỏng với một
  -- tài khoản cũ lọt lưới. Cột `ma_ngan` là `not null unique` nên phải điền.
  --
  -- ⚠ KHÔNG gọi `tao_ma_ngan_tai_khoan()`: **nó là hàm TRIGGER**, gọi thẳng
  --   thì Postgres ném `trigger functions can only be called as triggers`.
  --   Công thức dưới chép của `11` mục 3, nên hai chỗ sinh mã cùng hình dạng.
  insert into public.tai_khoan (user_id, ma_ngan)
  values (p_user,
          left(upper(translate(md5(p_user::text), '0123456789abcdef', '23456789ABCDEFGH')), 6))
  on conflict (user_id) do nothing;

  select coalesce(k.la_quan_tri_he_thong, false), k.qtht_moi_luc
    into v_co, v_moi
    from public.tai_khoan k where k.user_id = p_user;

  -- ══ BẬT: chỉ ghi lời mời ══
  if coalesce(p_bat, false) then
    if public.bi_khoa_ai(p_user) then
      return jsonb_build_object('ok', false, 'loi',
        'Tài khoản này đang bị khoá. Mở khoá trước rồi mới mời được.');
    end if;

    if v_co then
      return jsonb_build_object('ok', false, 'loi',
        'Tài khoản này đã là Quản trị hệ thống rồi.');
    end if;

    if v_moi is not null then
      return jsonb_build_object('ok', false, 'loi',
        'Đã có một lời mời đang chờ họ bấm Nhận.');
    end if;

    update public.tai_khoan
       set qtht_moi_luc = now(), qtht_moi_boi = auth.uid()
     where user_id = p_user;

    -- ⚠ `moi` true, `bat` FALSE. Màn hình phải đọc được rằng chưa có gì đổi.
    return jsonb_build_object('ok', true, 'moi', true, 'bat', false,
                              'email', v_email);
  end if;

  -- ══ TẮT: một chữ ký, có hiệu lực ngay ══
  if not v_co and v_moi is null then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này không phải Quản trị hệ thống và cũng không có lời mời nào.');
  end if;

  if v_co and public.so_qtht_dung_tru(p_user) < 1 then
    return jsonb_build_object('ok', false, 'loi',
      'Đây là Quản trị hệ thống cuối cùng còn đứng — tắt nốt thì không ai bật ' ||
      'lại được nữa trừ khi dán SQL tay.');
  end if;

  update public.tai_khoan
     set la_quan_tri_he_thong = false,
         qtht_moi_luc = null, qtht_moi_boi = null
   where user_id = p_user;

  return jsonb_build_object('ok', true, 'moi', false, 'bat', false,
                            'email', v_email);
end;
$$;

-- ------------------------------------------------------------
-- 6c. loi_moi_qtht_cua_toi() — người được mời nhìn thấy gì
-- ------------------------------------------------------------
-- ⚠ Trả `{}` chứ không ném lỗi khi không có lời mời: nơi gọi là ô *Quyền cấp
--   hệ thống* của khu Tài khoản, vẽ ở MỌI lần mở màn hình. Cùng lý lẽ
--   `tin_thung_rac()` của `16` mục 5b.
create or replace function public.loi_moi_qtht_cua_toi()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select jsonb_build_object(
              'coLoiMoi',   true,
              'moiLuc',     k.qtht_moi_luc,
              'emailNguoiMoi', coalesce(um.email::text, ''))
       from public.tai_khoan k
       left join auth.users um on um.id = k.qtht_moi_boi
      where k.user_id = auth.uid()
        and k.qtht_moi_luc is not null),
    '{}'::jsonb
  );
$$;

-- ------------------------------------------------------------
-- 6d. nhan_quyen_qtht() — CHỮ KÝ THỨ HAI
-- ------------------------------------------------------------
-- ⚠⚠ VÌ SAO HÀM NÀY KHÔNG VI PHẠM LUẬT "KHÔNG AI ĐẶT QUYỀN CHO CHÍNH MÌNH".
--    Cùng ba ranh giới đã viết cho `nhan_loi_moi()` ở `14` mục 4, và cả ba
--    đo được:
--      1. Chỉ lật đúng một cột, trên đúng dòng của mình.
--      2. Chỉ lật khi có `qtht_moi_luc` — tức một Quản trị hệ thống đủ thẩm
--         quyền đã ký trước. Không có lời mời thì hàm từ chối.
--      3. Không có tham số nào để nâng: cờ chỉ có một giá trị đích.
--    Chốt chặn cuối: `qtht_moi_boi = auth.uid()` thì từ chối. Ai lách được
--    vào bảng để tự viết một lời mời cho mình sẽ dừng ở đúng dòng ấy.
create or replace function public.nhan_quyen_qtht()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_moi timestamptz;
  v_boi uuid;
  v_khoa timestamptz;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'loi', 'Chưa đăng nhập.');
  end if;

  select k.qtht_moi_luc, k.qtht_moi_boi, k.khoa_luc
    into v_moi, v_boi, v_khoa
    from public.tai_khoan k where k.user_id = auth.uid();

  if v_moi is null then
    return jsonb_build_object('ok', false, 'loi',
      'Không có lời mời làm Quản trị hệ thống nào đang chờ bạn.');
  end if;

  if v_khoa is not null then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản của bạn đang bị khoá.');
  end if;

  if v_boi is not null and v_boi = auth.uid() then
    return jsonb_build_object('ok', false, 'loi',
      'Lời mời này do chính bạn tạo ra — không tự nhận được.');
  end if;

  update public.tai_khoan
     set la_quan_tri_he_thong = true,
         qtht_moi_luc = null, qtht_moi_boi = null
   where user_id = auth.uid();

  return jsonb_build_object('ok', true, 'bat', true);
end;
$$;

-- ------------------------------------------------------------
-- 6e. tu_choi_quyen_qtht() — xoá lời mời, không đánh dấu
-- ------------------------------------------------------------
-- Cùng lý lẽ `tu_choi_loi_moi()` của `14` mục 5: giữ lại một dấu "đã từ chối"
-- thì người mời không mời lại được nữa mà chẳng hiểu vì sao.
create or replace function public.tu_choi_quyen_qtht()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare v_so int;
begin
  update public.tai_khoan
     set qtht_moi_luc = null, qtht_moi_boi = null
   where user_id = auth.uid() and qtht_moi_luc is not null;
  get diagnostics v_so = row_count;

  if v_so = 0 then
    return jsonb_build_object('ok', false, 'loi',
      'Không có lời mời làm Quản trị hệ thống nào đang chờ bạn.');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- 7. LUẬT 1 — KHOÁ MỀM 60 NGÀY THAY CHO XOÁ NGAY
-- ============================================================
-- Chủ dự án chốt 15/09/2026: *xoá tài khoản = khoá mềm 60 ngày, hết hạn mới
-- xoá hẳn*. Cùng hình dạng với thùng rác cây: hai nhịp, một quãng chờ, mọi
-- bước lùi lại được — trừ bước cuối.
--
-- ⚠ KHOÁ **KHÔNG** CHUYỂN CHỦ CÂY. Khoá là việc đảo ngược được; chuyển chủ
--   thì không. Cây của người bị khoá vẫn có chủ, chỉ là chủ ấy tạm không làm
--   gì được — mà Quản trị hệ thống thì vẫn quản trị được mọi cây
--   (`co_the_quan_tri()` trả `true` khắp nơi), nên không cây nào bị kẹt.
--   Việc chuyển chủ nằm ở bước xoá hẳn, y như `14` mục 10 đã viết.
--
-- ⚠ Hàm trả về `dsCayLamChu` để màn hình nói thẳng *"khoá người này thì N
--   gia phả họ đứng tên tạm không có ai trông"* TRƯỚC khi bấm, chứ không để
--   người bấm phát hiện ra sau.

-- ------------------------------------------------------------
-- 7a. khoa_tai_khoan(p_user, p_email_xac_nhan, p_ly_do)
-- ------------------------------------------------------------
-- ⚠ VÌ SAO ĐÒI GÕ LẠI EMAIL, y như `xoa_tai_khoan()`: nút bấm từ một danh
--   sách TOÀN HỆ THỐNG nơi hai dòng trông na ná nhau. Nút hai nhịp gác được
--   cái bấm nhầm, không gác được cái bấm nhầm DÒNG.
create or replace function public.khoa_tai_khoan(
  p_user           uuid,
  p_email_xac_nhan text,
  p_ly_do          text default ''
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_email  text;
  v_khoa   timestamptz;
  v_co     boolean;
  v_saoluu int;
  v_ten    text[];
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới khoá được tài khoản.');
  end if;

  if public.la_chinh_minh(p_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Không ai tự khoá tài khoản của chính mình ở đây được.');
  end if;

  select u.email::text into v_email from auth.users u where u.id = p_user;
  if v_email is null then
    return jsonb_build_object('ok', false, 'loi', 'Không có tài khoản này.');
  end if;

  if lower(trim(coalesce(p_email_xac_nhan, ''))) <> lower(v_email) then
    return jsonb_build_object('ok', false, 'loi',
      'Email gõ lại không khớp với tài khoản định khoá.');
  end if;

  select k.khoa_luc, coalesce(k.la_quan_tri_he_thong, false)
    into v_khoa, v_co
    from public.tai_khoan k where k.user_id = p_user;

  if v_khoa is not null then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này đang bị khoá rồi.');
  end if;

  -- ⚠⚠ HÀNG RÀO GIỮ CHO `la_thanh_vien()` SỬA ĐƯỢC. Xem khối "MÁY SAO LƯU"
  --    ở đầu file: mục 4c chỉ an toàn chừng nào tài khoản `sao_luu` không
  --    bao giờ mang cờ khoá. Bỏ phép kiểm này là mở lại lỗ hổng b102 — bản
  --    sao lưu đêm vẫn chạy, vẫn sinh file, chỉ là file rỗng.
  select count(*) into v_saoluu from public.tree_members m
   where m.user_id = p_user and m.role = 'sao_luu';
  if v_saoluu > 0 then
    return jsonb_build_object('ok', false, 'loi',
      'Đây là tài khoản sao lưu tự động — khoá nó thì bản sao lưu đêm vẫn chạy ' ||
      'và vẫn sinh file, chỉ là file rỗng.');
  end if;

  if v_co and public.so_qtht_dung_tru(p_user) < 1 then
    return jsonb_build_object('ok', false, 'loi',
      'Đây là Quản trị hệ thống cuối cùng còn đứng — khoá nốt thì không ai ' ||
      'mở khoá lại được nữa trừ khi dán SQL tay.');
  end if;

  -- Đọc TRƯỚC khi ghi, để câu báo nói đúng cái vừa xảy ra.
  select coalesce(array_agg(t.name order by t.name), '{}'::text[]) into v_ten
    from public.trees t where t.chu_so_huu = p_user;

  update public.tai_khoan
     set khoa_luc   = now(),
         khoa_boi   = auth.uid(),
         khoa_ly_do = coalesce(p_ly_do, ''),
         -- ⚠ Lời mời QTHT chưa nhận chết theo. Để lại là để một tài khoản
         --   vừa bị khoá tự nâng mình lên ngay khi được mở khoá.
         qtht_moi_luc = null,
         qtht_moi_boi = null
   where user_id = p_user;

  return jsonb_build_object('ok', true, 'email', v_email,
    'soCayLamChu', coalesce(array_length(v_ten, 1), 0),
    'dsCayLamChu', to_jsonb(v_ten),
    'xoaDuocTu',   to_char(now() + interval '60 days', 'DD/MM/YYYY'));
end;
$$;

-- ------------------------------------------------------------
-- 7b. mo_khoa_tai_khoan(p_user)
-- ------------------------------------------------------------
-- ⚠ Phép `la_chinh_minh` dưới đây hôm nay KHÔNG với tới được: người đang bị
--   khoá thì `la_quan_tri_he_thong()` đã trả `false` nên họ dừng ở hàng rào
--   đầu. Giữ vì nó không tốn gì và nó còn đúng vào ngày ai đó nới hàng rào
--   đầu — cùng lý lẽ `nullif` ở `20` mục 1.
create or replace function public.mo_khoa_tai_khoan(p_user uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text;
  v_khoa  timestamptz;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới mở khoá được tài khoản.');
  end if;

  if public.la_chinh_minh(p_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Không ai tự mở khoá cho chính mình được.');
  end if;

  select u.email::text, k.khoa_luc into v_email, v_khoa
    from auth.users u
    left join public.tai_khoan k on k.user_id = u.id
   where u.id = p_user;

  if v_email is null then
    return jsonb_build_object('ok', false, 'loi', 'Không có tài khoản này.');
  end if;

  if v_khoa is null then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này không bị khoá.');
  end if;

  update public.tai_khoan
     set khoa_luc = null, khoa_boi = null, khoa_ly_do = ''
   where user_id = p_user;

  return jsonb_build_object('ok', true, 'email', v_email);
end;
$$;

-- ------------------------------------------------------------
-- 7c. xoa_tai_khoan(...) — nay đứng SAU một quãng chờ 60 ngày
-- ------------------------------------------------------------
-- Thân hàm chép NGUYÊN VĂN `14` mục 10, thêm đúng một hàng rào ở đầu: tài
-- khoản phải đang bị khoá, và đã khoá đủ 60 ngày.
--
-- ⚠ SÁU MƯƠI NGÀY LÀ HÀNG RÀO CỨNG, không phải gợi ý trên màn hình — y như
--   120 ngày của `don_thung_rac()`. Đây là việc duy nhất trong cả hệ thống
--   phá huỷ một lối đăng nhập và nó không lùi lại được.
--
-- ⚠ `drop` bản ba tham số trước, để lần dán thứ hai không đẻ ra bản nạp
--   chồng. `14` mục 10 đã trả giá đúng chuyện này với bản hai tham số.
drop function if exists public.xoa_tai_khoan(uuid, text, uuid);

create or replace function public.xoa_tai_khoan(
  p_user           uuid,
  p_email_xac_nhan text,
  p_chu_moi        uuid default null   -- để trống = chính người bấm nút
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_email      text;
  v_email_chu  text;
  v_chu_moi    uuid;
  v_cay        int;
  v_chan       int;
  v_saoluu     int;
  v_co_co      boolean;
  v_khoa       timestamptz;
  v_con_ngay   int;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới xoá được tài khoản.');
  end if;

  if public.la_chinh_minh(p_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Không ai tự xoá tài khoản của chính mình ở đây được.');
  end if;

  select u.email::text into v_email from auth.users u where u.id = p_user;
  if v_email is null then
    return jsonb_build_object('ok', false, 'loi', 'Không có tài khoản này.');
  end if;

  if lower(trim(coalesce(p_email_xac_nhan, ''))) <> lower(v_email) then
    return jsonb_build_object('ok', false, 'loi',
      'Email gõ lại không khớp với tài khoản định xoá.');
  end if;

  -- ══ HÀNG RÀO b118b: hai nhịp và một quãng chờ ══
  select k.khoa_luc into v_khoa
    from public.tai_khoan k where k.user_id = p_user;

  if v_khoa is null then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này chưa bị khoá. Xoá hẳn đi qua hai nhịp: khoá mềm trước, ' ||
      '60 ngày sau mới xoá được.');
  end if;

  if v_khoa > now() - interval '60 days' then
    v_con_ngay := greatest(0, 60 - floor(extract(epoch from now() - v_khoa) / 86400)::int);
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này mới bị khoá, còn ' || v_con_ngay ||
      ' ngày nữa mới xoá hẳn được.', 'conLai', v_con_ngay);
  end if;

  -- Ai nhận những cây người này đang làm chủ.
  v_chu_moi := coalesce(p_chu_moi, auth.uid());

  if v_chu_moi = p_user then
    return jsonb_build_object('ok', false, 'loi',
      'Không giao cây cho chính tài khoản sắp bị xoá được.');
  end if;

  -- ⚠ Hỏi `tai_khoan` chứ không hỏi `auth.users`, chép đúng `doi_chu_cay()`
  --   của `13` mục 12: `11` mục 3 đặt luật mọi tài khoản đều có một dòng ở đó.
  select u.email::text into v_email_chu
    from auth.users u
    join public.tai_khoan k on k.user_id = u.id
   where u.id = v_chu_moi;

  if v_email_chu is null then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản định giao cây cho không có trong phần mềm.');
  end if;

  -- ⚠ Chủ mới không được là một tài khoản đang bị khoá — giao cây cho người
  --   không làm gì được là dời cái kẹt sang chỗ khác rồi gọi đó là xong.
  if public.bi_khoa_ai(v_chu_moi) then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản định giao cây cho đang bị khoá — chọn người khác.');
  end if;

  select count(*) into v_cay from public.trees t where t.chu_so_huu = p_user;

  select count(*) into v_saoluu from public.tree_members m
   where m.user_id = p_user and m.role = 'sao_luu';
  if v_saoluu > 0 then
    return jsonb_build_object('ok', false, 'loi',
      'Đây là tài khoản sao lưu tự động — xoá nó thì bản sao lưu đêm vẫn chạy ' ||
      'và vẫn sinh file, chỉ là file rỗng.');
  end if;

  select coalesce(k.la_quan_tri_he_thong, false) into v_co_co
    from public.tai_khoan k where k.user_id = p_user;
  if coalesce(v_co_co, false) and public.so_qtht_dung_tru(p_user) < 1 then
    return jsonb_build_object('ok', false, 'loi',
      'Đây là Quản trị hệ thống cuối cùng còn đứng — xoá nốt thì không ai ' ||
      'quản trị hệ thống được nữa.');
  end if;

  -- Đếm TRƯỚC khi xoá, để câu báo trên màn hình nói đúng cái vừa mất.
  select count(*) into v_chan from public.tree_members m where m.user_id = p_user;

  -- ⚠⚠ CHUYỂN CHỦ TRƯỚC, XOÁ SAU, TRONG CÙNG MỘT GIAO DỊCH. Cây không bao
  --    giờ tồn tại ở trạng thái không chủ, kể cả khi lệnh xoá vấp ở giữa.
  if v_cay > 0 then
    update public.trees set chu_so_huu = v_chu_moi where chu_so_huu = p_user;

    -- Chủ mới phải ĐỌC được cây vừa nhận. Bài học `doi_chu_cay()`: thiếu dòng
    -- `tree_members` là chủ mới *sửa được mà không đọc được*.
    insert into public.tree_members (tree_id, user_id, role, email, approved)
    select t.id, v_chu_moi, 'quan_tri', v_email_chu, true
      from public.trees t where t.chu_so_huu = v_chu_moi
    on conflict (tree_id, user_id) do update
       set approved = true,
           role = case when public.tree_members.role = 'sao_luu'
                       then public.tree_members.role else 'quan_tri' end;
  end if;

  -- `tree_members`, `tai_khoan`, `user_settings`, `branch_access` đều khai
  -- `on delete cascade` nên đi theo. `change_log` KHÔNG — cố ý, xem `14` mục 10.
  delete from auth.users where id = p_user;

  return jsonb_build_object('ok', true, 'email', v_email,
                            'soChanDaGo', v_chan,
                            'soCayDaChuyen', v_cay,
                            'chuMoi', v_chu_moi,
                            'emailChuMoi', v_email_chu);
end;
$$;

-- ============================================================
-- 8. LUẬT 4 — CHỦ BẤM XOÁ THÌ CÂY ẨN NGAY
-- ============================================================
-- ⚠ Ba trạng thái từ hôm nay, thay cho bốn trạng thái của `16`:
--
--     xin_xoa_luc trống                     → bình thường
--     xin_xoa_luc CÓ · da_xoa_luc trống     → ĐÃ XOÁ, cây ẨN, chờ QTHT
--     xin_xoa_luc CÓ · da_xoa_luc CÓ        → trong thùng rác, 120 ngày
--
-- Dòng giữa là chỗ `16` viết ngược lại — ở đó đơn KHÔNG khoá cây. Chủ dự án
-- lật lại điều ấy ngày 15/09, sau khi đã đọc đúng cái giá trong câu hỏi:
-- **xoá nhầm thì cây bị ẩn suốt lúc chờ Quản trị hệ thống**. Chủ cây không
-- tự mở lại được; đường về nằm ở tay QTHT (`huy_xin_xoa_cay` = trả lại).
--
-- Hai điều của `16` vẫn giữ nguyên: vẫn hai chữ ký cho bước vào thùng rác;
-- và thùng rác đóng cửa với NGƯỜI, không đóng cửa với MÁY SAO LƯU.

-- ------------------------------------------------------------
-- 8a. xin_xoa_cay(p_tree, p_ly_do) — nay là XOÁ, có hiệu lực ngay
-- ------------------------------------------------------------
-- Cùng tập người với `16` mục 6: chủ cây và Quản trị hệ thống. Quản trị GIA
-- PHẢ được phong thì KHÔNG — đúng bảng năm hạng của mục 11.3: vai ấy *chỉ
-- sửa + duyệt nội dung*, còn xử lý cái vỏ là việc khác.
create or replace function public.xin_xoa_cay(p_tree uuid, p_ly_do text default '')
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_ten     text;
  v_la_chu  boolean;
  v_nguoi   bigint;
begin
  select t.name, coalesce(t.chu_so_huu = auth.uid(), false)
    into v_ten, v_la_chu
    from public.trees t where t.id = p_tree;

  if v_ten is null then
    return jsonb_build_object('ok', false, 'loi', 'Không có gia phả này.');
  end if;

  if not (v_la_chu or public.la_quan_tri_he_thong()) then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ người đứng tên gia phả hoặc Quản trị hệ thống mới xoá được.');
  end if;

  if public.cay_dang_an(p_tree) then
    return jsonb_build_object('ok', false, 'loi',
      'Gia phả này đã bị xoá rồi, đang chờ Quản trị hệ thống xử lý.');
  end if;

  -- Đếm TRƯỚC khi ẩn — sau câu `update` thì chính người vừa bấm cũng không
  -- đọc ra được con số này nữa (`co_the_xem_cay()` đã đóng).
  select count(*) into v_nguoi from public.persons p
   where p.tree_id = p_tree and p.deleted = false;

  update public.trees
     set xin_xoa_luc   = now(),
         xin_xoa_boi   = auth.uid(),
         xin_xoa_ly_do = coalesce(p_ly_do, '')
   where id = p_tree;

  return jsonb_build_object('ok', true, 'ten', v_ten, 'soNguoi', v_nguoi);
end;
$$;

-- ------------------------------------------------------------
-- 8b. huy_xin_xoa_cay(p_tree) — TRẢ LẠI CÂY CHO CHỦ
-- ------------------------------------------------------------
-- ⚠⚠ ĐỔI TẬP NGƯỜI GỌI: `16` cho chủ cây tự rút đơn; từ b118b **chỉ Quản trị
--    hệ thống**. Không phải để làm khó — mà vì từ luật 4 cái nút này không
--    còn là *rút đơn của mình* nữa, nó là *đảo ngược một việc đã có hiệu
--    lực*. Chủ dự án chọn thế khi đã đọc đúng cái giá ấy (mục 11.9 luật 4).
--
-- ⚠ Tên hàm nay lệch nghĩa — xem khối đầu file. Đây là nút *Khôi phục lại
--   cho chủ cây* của prototype `quantri3`.
--
-- ⚠ Cây đã vào thùng rác thì đường về là `phuc_hoi_cay()`, không phải hàm này.
create or replace function public.huy_xin_xoa_cay(p_tree uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_ten  text;
  v_xin  timestamptz;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới trả lại gia phả cho chủ được.');
  end if;

  select t.name, t.xin_xoa_luc into v_ten, v_xin
    from public.trees t where t.id = p_tree;

  if v_ten is null then
    return jsonb_build_object('ok', false, 'loi', 'Không có gia phả này.');
  end if;

  if v_xin is null then
    return jsonb_build_object('ok', false, 'loi',
      'Gia phả này không bị xoá — không có gì để trả lại.');
  end if;

  if public.trong_thung_rac(p_tree) then
    return jsonb_build_object('ok', false, 'loi',
      'Gia phả này đã nằm trong thùng rác — đường về là nút Phục hồi.');
  end if;

  update public.trees
     set xin_xoa_luc = null, xin_xoa_boi = null, xin_xoa_ly_do = ''
   where id = p_tree;

  return jsonb_build_object('ok', true, 'ten', v_ten);
end;
$$;

-- ------------------------------------------------------------
-- 8c. duyet_xoa_cay(p_tree) — CHỮ KÝ THỨ HAI, nay nói 120 ngày
-- ------------------------------------------------------------
-- Thân chép nguyên `16` mục 8; đổi đúng con số trong câu trả về.
--
-- ⚠ KHÔNG cấm người vừa xoá tự duyệt. Lý lẽ đầy đủ ở `16` mục 8 và vẫn
--   đúng: nếp *không ai tự đặt quyền cho mình* canh việc TỰ NÂNG quyền, còn
--   ở đây người ta tự bỏ đi thứ mình đang có. Cấm đi thì hệ thống hôm nay
--   không xoá được cây nào — chủ dự án là Quản trị hệ thống duy nhất và đứng
--   tên cả hai cây.
create or replace function public.duyet_xoa_cay(p_tree uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_ten  text;
  v_xin  timestamptz;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới duyệt được việc xoá gia phả.');
  end if;

  select t.name, t.xin_xoa_luc into v_ten, v_xin
    from public.trees t where t.id = p_tree;

  if v_ten is null then
    return jsonb_build_object('ok', false, 'loi', 'Không có gia phả này.');
  end if;

  -- ⚠ Không ai xoá trước thì không duyệt được, kể cả Quản trị hệ thống. Đây
  --   là chỗ luật hai chữ ký thật sự nằm: bỏ phép kiểm này là còn một chữ ký.
  if v_xin is null then
    return jsonb_build_object('ok', false, 'loi',
      'Gia phả này chưa bị ai xoá. Người đứng tên phải xoá trước.');
  end if;

  if public.trong_thung_rac(p_tree) then
    return jsonb_build_object('ok', false, 'loi',
      'Gia phả này đã nằm trong thùng rác rồi.');
  end if;

  update public.trees
     set da_xoa_luc = now(), da_xoa_boi = auth.uid()
   where id = p_tree;

  return jsonb_build_object('ok', true, 'ten', v_ten,
                            'donLuc', to_char(now() + interval '120 days',
                                              'DD/MM/YYYY'));
end;
$$;

-- ============================================================
-- 9. LUẬT 3 — THÙNG RÁC GIỮ 120 NGÀY
-- ============================================================
-- Thân chép nguyên `16` mục 10; đổi đúng `30` thành `120` ở ba chỗ, và cả ba
-- đều đếm từ `da_xoa_luc` — tức **từ lúc Quản trị hệ thống duyệt**, đúng câu
-- đã chốt 16/09/2026.
--
-- ⚠ ĐÂY LÀ CHỖ DUY NHẤT TRONG CẢ PHẦN MỀM ĐƯỢC PHÉP `delete from
--   public.trees`. Chín bảng mang `tree_id` đi theo bằng `on delete cascade`,
--   `change_log` cũng đi theo, và file ảnh trong kho thì KHÔNG — nên hàm trả
--   `dsAnh` để `khu-gia-pha.js` gọi `xoaAnhThat()` ngay sau.
create or replace function public.don_thung_rac(p_ds uuid[])
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_du       uuid[];
  v_chua     jsonb;
  v_anh      text[];
  v_ten      text[];
  v_nguoi    bigint;
begin
  if not public.la_quan_tri_he_thong() then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ Quản trị hệ thống mới dọn được thùng rác.');
  end if;

  if p_ds is null or array_length(p_ds, 1) is null then
    return jsonb_build_object('ok', false, 'loi',
      'Chưa chọn gia phả nào để dọn.');
  end if;

  -- Đủ 120 ngày trong thùng rác.
  select coalesce(array_agg(t.id), '{}'::uuid[]),
         coalesce(array_agg(t.name), '{}'::text[])
    into v_du, v_ten
    from public.trees t
   where t.id = any(p_ds)
     and t.da_xoa_luc is not null
     and t.da_xoa_luc <= now() - interval '120 days';

  -- Chưa đủ ngày, hoặc không nằm trong thùng rác: kể tên ra, đừng im lặng.
  select coalesce(jsonb_agg(jsonb_build_object(
           'ten', t.name,
           'conLai', greatest(0, 120 - floor(extract(epoch from
                        now() - t.da_xoa_luc) / 86400)::int))), '[]'::jsonb)
    into v_chua
    from public.trees t
   where t.id = any(p_ds)
     and (t.da_xoa_luc is null
          or t.da_xoa_luc > now() - interval '120 days');

  if array_length(v_du, 1) is null then
    return jsonb_build_object('ok', false, 'loi',
      'Không cây nào trong số đã chọn đủ 120 ngày nằm trong thùng rác.',
      'boQua', v_chua);
  end if;

  -- ⚠ ĐỌC TRƯỚC KHI XOÁ. Sau `delete` thì `media` đã cascade đi mất và không
  --   còn cách nào biết file nào vừa mồ côi trong kho ảnh.
  select coalesce(array_agg(d), '{}'::text[]) into v_anh
    from (
      select unnest(array[m.drive_file_id, m.drive_file_id_lon]) as d
        from public.media m
       where m.tree_id = any(v_du)
    ) x
   where d is not null and d <> '';

  select count(*) into v_nguoi
    from public.persons p where p.tree_id = any(v_du);

  delete from public.trees where id = any(v_du);

  return jsonb_build_object(
    'ok',      true,
    'soCay',   array_length(v_du, 1),
    'tenCay',  to_jsonb(v_ten),
    'soNguoi', v_nguoi,
    'dsAnh',   to_jsonb(v_anh),
    'boQua',   v_chua
  );
end;
$$;

-- ============================================================
-- 10. XIN ĐỔI QUYỀN — thành viên nộp, chủ cây duyệt
-- ============================================================
-- Prototype `quantri3` chip *Tôi là thành viên* có nút **Xin đổi quyền**.
-- Nó không phải một hàm: lá đơn phải nằm ở đâu đó để chủ cây duyệt. Ba hàm
-- việc + một hàm đọc, lá đơn nằm ở ba cột thêm vào `tree_members` (mục 2).
--
-- ⚠ Đây là chiều NGƯỢC LẠI của `doi_vai_thanh_vien` (`18` mục 4): ở đó quản
--   trị đổi vai cho người khác; ở đây chính người ấy xin cho mình, và **việc
--   xin không đổi gì cả** — chỉ ghi một lá đơn. Luật *không ai đặt quyền cho
--   chính mình* không bị đụng: người xin không phải người duyệt.

-- ------------------------------------------------------------
-- 10a. xin_doi_vai(p_tree, p_vai, p_ly_do)
-- ------------------------------------------------------------
create or replace function public.xin_doi_vai(
  p_tree  uuid,
  p_vai   text,
  p_ly_do text default ''
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_vai      text;
  v_duyet    boolean;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'loi', 'Chưa đăng nhập.');
  end if;

  if public.bi_khoa() then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản của bạn đang bị khoá.');
  end if;

  if coalesce(p_vai, '') not in ('quan_tri', 'sua', 'xem') then
    return jsonb_build_object('ok', false, 'loi',
      'Quyền xin được chỉ có: quan_tri, sua, xem.');
  end if;

  select m.role, m.approved into v_vai, v_duyet
    from public.tree_members m
   where m.tree_id = p_tree and m.user_id = auth.uid();

  -- ⚠ Đòi `approved = true`, và đó là cửa của mục 11.8 đặt ở chiều vào: một
  --   dòng chưa nhận (lời mời) hoặc chưa được duyệt (đơn xin vào) mà mang
  --   được một lá đơn đổi vai là mở đường cho `duyet_xin_doi_vai()` ghi
  --   `role` lên đúng dòng ấy — tức cho người ta vào cây mà chưa ai đồng ý.
  if v_vai is null or not coalesce(v_duyet, false) then
    return jsonb_build_object('ok', false, 'loi',
      'Bạn chưa phải thành viên của gia phả này.');
  end if;

  if public.cay_dang_an(p_tree) then
    return jsonb_build_object('ok', false, 'loi',
      'Gia phả này đang đóng.');
  end if;

  if public.la_chu_cay(p_tree, auth.uid()) then
    return jsonb_build_object('ok', false, 'loi',
      'Bạn đang đứng tên gia phả này — đã có mọi quyền, không có gì để xin.');
  end if;

  if v_vai = 'sao_luu' then
    return jsonb_build_object('ok', false, 'loi',
      'Đây là tài khoản sao lưu tự động — đổi vai nó là làm hỏng bản sao lưu đêm.');
  end if;

  if v_vai = p_vai then
    return jsonb_build_object('ok', false, 'loi',
      'Bạn đang mang đúng vai này rồi.');
  end if;

  update public.tree_members
     set xin_vai = p_vai, xin_vai_luc = now(),
         xin_vai_ly_do = coalesce(p_ly_do, '')
   where tree_id = p_tree and user_id = auth.uid();

  return jsonb_build_object('ok', true, 'vaiHienTai', v_vai, 'vaiXin', p_vai);
end;
$$;

-- ------------------------------------------------------------
-- 10b. rut_xin_doi_vai(p_tree) — tự rút đơn của mình
-- ------------------------------------------------------------
create or replace function public.rut_xin_doi_vai(p_tree uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare v_so int;
begin
  update public.tree_members
     set xin_vai = null, xin_vai_luc = null, xin_vai_ly_do = ''
   where tree_id = p_tree and user_id = auth.uid() and xin_vai is not null;
  get diagnostics v_so = row_count;

  if v_so = 0 then
    return jsonb_build_object('ok', false, 'loi',
      'Bạn không có đơn xin đổi quyền nào ở gia phả này.');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ------------------------------------------------------------
-- 10c. duyet_xin_doi_vai(p_tree, p_user, p_dong_y)
-- ------------------------------------------------------------
-- Gác bằng `co_the_quan_tri(p_tree)` — Quản trị hệ thống ở mọi cây, chủ cây
-- ở cây mình. **Quản trị gia phả được phong thì KHÔNG**, đúng bảng năm hạng
-- của mục 11.3: đổi quyền không nằm ở cột "duyệt nội dung".
--
-- ⚠ Bốn hàng rào dưới đây chép đúng bốn hàng rào của `doi_vai_thanh_vien`
--   (`18` mục 4), vì kết quả của hàm này là một câu `update role` y hệt.
--   Hàm nào ghi `role` cũng phải trả lời đủ bốn câu ấy — đó chính là chỗ
--   b110c đã thủng ở bốn cửa một lúc.
create or replace function public.duyet_xin_doi_vai(
  p_tree   uuid,
  p_user   uuid,
  p_dong_y boolean
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_vai_cu text;
  v_xin    text;
  v_duyet  boolean;
begin
  if not public.co_the_quan_tri(p_tree) then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ chủ gia phả mới duyệt được đơn xin đổi quyền.');
  end if;

  -- Hàng rào 1 — không ai đặt quyền cho chính mình.
  if public.la_chinh_minh(p_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Không ai tự duyệt đơn của chính mình được. Nhờ một quản trị khác làm.');
  end if;

  -- Hàng rào 2 — cửa đắt nhất của b110c: không ghi `role` lên một lời mời
  -- chưa nhận. Hôm nay `xin_doi_vai()` không cho một dòng như thế mang đơn,
  -- nên nhánh này chỉ với tới được nếu ai đó lách thẳng vào bảng — tức đúng
  -- lúc nó cần có mặt.
  if public.la_loi_moi_cho_nhan(p_tree, p_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này mới được MỜI, chưa bấm Nhận — chưa đổi vai được.');
  end if;

  select m.role, m.xin_vai, m.approved into v_vai_cu, v_xin, v_duyet
    from public.tree_members m
   where m.tree_id = p_tree and m.user_id = p_user;

  if v_vai_cu is null then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này chưa có tên trong gia phả.');
  end if;

  if v_xin is null then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này không có đơn xin đổi quyền nào.');
  end if;

  -- Từ chối: xoá lá đơn, không đụng `role`.
  if not coalesce(p_dong_y, false) then
    update public.tree_members
       set xin_vai = null, xin_vai_luc = null, xin_vai_ly_do = ''
     where tree_id = p_tree and user_id = p_user;
    return jsonb_build_object('ok', true, 'dongY', false, 'vaiCu', v_vai_cu);
  end if;

  if not coalesce(v_duyet, false) then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này chưa được duyệt vào gia phả.');
  end if;

  -- Hàng rào 3 — chủ cây không hạ vai được.
  if public.la_chu_cay(p_tree, p_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Đây là chủ gia phả — không đổi vai được. Muốn đổi chủ thì dùng Bàn giao gia phả.');
  end if;

  -- Hàng rào 4 — không đụng vai `sao_luu`.
  if v_vai_cu = 'sao_luu' then
    return jsonb_build_object('ok', false, 'loi',
      'Đây là tài khoản sao lưu tự động — đổi vai nó là làm hỏng bản sao lưu đêm.');
  end if;

  update public.tree_members
     set role = v_xin, xin_vai = null, xin_vai_luc = null, xin_vai_ly_do = ''
   where tree_id = p_tree and user_id = p_user;

  return jsonb_build_object('ok', true, 'dongY', true,
                            'vaiCu', v_vai_cu, 'vaiMoi', v_xin);
end;
$$;

-- ------------------------------------------------------------
-- 10d. ds_xin_doi_vai(p_tree) — hàng chờ cho màn hình `#tree-requests`
-- ------------------------------------------------------------
-- ⚠ ĐỨNG RIÊNG, không nhập vào `ds_cho_duyet()` của `18` mục 6c. Hai lý do,
--   và lý do thứ hai mới là lý do thật: (a) hình dạng dòng khác hẳn — đây là
--   người ĐÃ ở trong cây; (b) `ds_cho_duyet()` nuôi con số huy hiệu trên nút
--   Gia phả (`napSoDem` ở `khung.js`), gộp vào là đổi nghĩa con số ấy trong
--   im lặng, ở một chỗ không ai nghĩ tới khi sửa file này.
create or replace function public.ds_xin_doi_vai(p_tree uuid)
returns table (
  user_id       uuid,
  email         text,
  ho_ten        text,
  vai_hien_tai  text,
  xin_vai       text,
  xin_vai_luc   timestamptz,
  xin_vai_ly_do text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.user_id,
         coalesce(u.email::text, ''),
         coalesce(k.ho_ten, ''),
         m.role,
         m.xin_vai,
         m.xin_vai_luc,
         m.xin_vai_ly_do
    from public.tree_members m
    left join auth.users u on u.id = m.user_id
    left join public.tai_khoan k on k.user_id = m.user_id
   where m.tree_id = p_tree
     and m.xin_vai is not null
     -- ⚠ `security definer` nên PHẢI tự gác. Bỏ dòng này là mọi tài khoản
     --   đọc được email thành viên của mọi cây trên máy chủ — đúng hình dạng
     --   Bẫy 3 của `11`.
     and public.co_the_quan_tri(p_tree)
   order by m.xin_vai_luc;
$$;

-- ============================================================
-- 11. ds_tai_khoan_he_thong() — THÊM NĂM CỘT
-- ============================================================
-- ⚠ Mọi cột cũ chép NGUYÊN VĂN từ `20` mục 1 — file này thay `20` làm bản
--   đứng cuối. Năm cột mới đứng CUỐI, đúng nếp `14` mục 6 và `16` mục 5:
--   JS đọc theo TÊN nên không quan tâm, nhưng phép đo và `psql` đọc theo VỊ TRÍ.
--
-- ⚠ `drop` TRƯỚC là BẮT BUỘC: danh sách cột đổi (16 → 21) thì `create or
--   replace` ném `42P13`, và lần dán vấp giữa file để lại máy chủ nửa vời.
--
-- ⚠⚠ `drop function` XOÁ CẢ `grant`. Mục 12 cấp lại — `15` đã đánh rơi đúng
--    dòng ấy một lần và `20` phải vá.

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
  so_cay_gan         bigint,
  nguoi_gan          jsonb,
  tao_luc            timestamptz,
  dang_nhap_gan_nhat timestamptz,
  da_xac_nhan_email  boolean,
  khoa_luc           timestamptz,
  khoa_ly_do         text,
  email_khoa_boi     text,
  qtht_moi_luc       timestamptz,
  email_qtht_moi_boi text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u.id,
         u.email::text,
         coalesce(tk.ho_ten, ''),
         -- ⚠ VAI CAO NHẤT TRONG MỌI CÂY — một dòng tóm tắt, KHÔNG phải câu
         --   trả lời đầy đủ. Chép nguyên từ `20` mục 1; lý do đầy đủ ở `15`.
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
         (select count(*) from public.tree_members m
           where m.user_id = u.id and m.approved
             and nullif(m.person_id, '') is not null),
         coalesce((
           select jsonb_agg(x order by x->>'tenCay')
             from (
               select jsonb_build_object(
                        'treeId',  m.tree_id,
                        'tenCay',  t2.name,
                        'maCay',   t2.tree_code,
                        'maNguoi', m.person_id,
                        'ten',     coalesce(nullif(public.ten_day_du(p.names), ''),
                                            m.person_id, '')
                      ) as x
                 from public.tree_members m
                 join public.trees t2 on t2.id = m.tree_id
                 left join public.persons p
                        on p.tree_id = m.tree_id and p.id = m.person_id
                where m.user_id = u.id and m.approved
                  and nullif(m.person_id, '') is not null
                order by t2.name
                limit 3
             ) q
         ), '[]'::jsonb),
         u.created_at,
         u.last_sign_in_at,
         (u.email_confirmed_at is not null),
         -- Năm cột b118b, đứng cuối.
         tk.khoa_luc,
         coalesce(tk.khoa_ly_do, ''),
         coalesce(uk.email::text, ''),
         tk.qtht_moi_luc,
         coalesce(um.email::text, '')
    from auth.users u
    left join public.tai_khoan tk on tk.user_id = u.id
    left join auth.users uk on uk.id = tk.khoa_boi
    left join auth.users um on um.id = tk.qtht_moi_boi
   where public.la_quan_tri_he_thong()
   order by u.created_at;
$$;

-- ============================================================
-- 12. QUYỀN GỌI
-- ============================================================
-- ⚠ `revoke … from public, anon` trước mỗi `grant`, đúng khuôn `07` mục 8,
--   `14` mục 11 và `16` mục 11: mặc định của Postgres là MỌI vai gọi được,
--   kể cả `anon` — người chưa đăng nhập.
--
-- ⚠⚠ MƯỜI BA HÀM CŨ ĐƯỢC ĐỊNH NGHĨA LẠI Ở FILE NÀY, nên quyền cũ của chúng
--    mất theo (`drop`) hoặc cần cấp lại cho chắc. Thiếu một dòng ở đây là
--    hàm ấy lặng lẽ rơi về mặc định *ai cũng gọi được* — `15` đã vấp đúng
--    thế và `20` phải vá.

revoke all on function public.bi_khoa()                             from public, anon;
revoke all on function public.bi_khoa_ai(uuid)                      from public, anon;
revoke all on function public.cay_dang_an(uuid)                     from public, anon;
revoke all on function public.so_qtht_dung_tru(uuid)                      from public, anon;
revoke all on function public.dat_quan_tri_he_thong(uuid, boolean)  from public, anon;
revoke all on function public.loi_moi_qtht_cua_toi()                from public, anon;
revoke all on function public.nhan_quyen_qtht()                     from public, anon;
revoke all on function public.tu_choi_quyen_qtht()                  from public, anon;
revoke all on function public.khoa_tai_khoan(uuid, text, text)      from public, anon;
revoke all on function public.mo_khoa_tai_khoan(uuid)               from public, anon;
revoke all on function public.xoa_tai_khoan(uuid, text, uuid)       from public, anon;
revoke all on function public.xin_xoa_cay(uuid, text)               from public, anon;
revoke all on function public.huy_xin_xoa_cay(uuid)                 from public, anon;
revoke all on function public.duyet_xoa_cay(uuid)                   from public, anon;
revoke all on function public.don_thung_rac(uuid[])                 from public, anon;
revoke all on function public.xin_doi_vai(uuid, text, text)         from public, anon;
revoke all on function public.rut_xin_doi_vai(uuid)                 from public, anon;
revoke all on function public.duyet_xin_doi_vai(uuid, uuid, boolean) from public, anon;
revoke all on function public.ds_xin_doi_vai(uuid)                  from public, anon;
revoke all on function public.ds_tai_khoan_he_thong()               from public, anon;

grant execute on function public.bi_khoa()                             to authenticated;
grant execute on function public.bi_khoa_ai(uuid)                      to authenticated;
grant execute on function public.cay_dang_an(uuid)                     to authenticated;
grant execute on function public.so_qtht_dung_tru(uuid)                      to authenticated;
grant execute on function public.dat_quan_tri_he_thong(uuid, boolean)  to authenticated;
grant execute on function public.loi_moi_qtht_cua_toi()                to authenticated;
grant execute on function public.nhan_quyen_qtht()                     to authenticated;
grant execute on function public.tu_choi_quyen_qtht()                  to authenticated;
grant execute on function public.khoa_tai_khoan(uuid, text, text)      to authenticated;
grant execute on function public.mo_khoa_tai_khoan(uuid)               to authenticated;
grant execute on function public.xoa_tai_khoan(uuid, text, uuid)       to authenticated;
grant execute on function public.xin_xoa_cay(uuid, text)               to authenticated;
grant execute on function public.huy_xin_xoa_cay(uuid)                 to authenticated;
grant execute on function public.duyet_xoa_cay(uuid)                   to authenticated;
grant execute on function public.don_thung_rac(uuid[])                 to authenticated;
grant execute on function public.xin_doi_vai(uuid, text, text)         to authenticated;
grant execute on function public.rut_xin_doi_vai(uuid)                 to authenticated;
grant execute on function public.duyet_xin_doi_vai(uuid, uuid, boolean) to authenticated;
grant execute on function public.ds_xin_doi_vai(uuid)                  to authenticated;
grant execute on function public.ds_tai_khoan_he_thong()               to authenticated;

-- Năm hàm nền móng vừa được định nghĩa lại — cấp lại cho đủ.
grant execute on function public.la_quan_tri_he_thong() to authenticated;
grant execute on function public.duoc_tao_cay()         to authenticated;
grant execute on function public.la_thanh_vien(uuid)    to authenticated;
grant execute on function public.co_the_xem_cay(uuid)   to authenticated;
grant execute on function public.co_the_sua(uuid)       to authenticated;
grant execute on function public.ds_gia_pha()           to authenticated;

commit;

-- ============================================================
-- 13. BẢNG TỰ KIỂM — đọc sau khi dán
-- ============================================================
-- Chạy trong SQL Editor của Supabase ngay sau khi dán. Mọi dòng phải ĐẠT.
-- ⚠ Bảng này chỉ hỏi *có tồn tại / có hình dạng đúng không*. Nó KHÔNG đo
--   được hành vi dưới danh nghĩa một người cụ thể — việc ấy là của bàn thử
--   tại chỗ (`kiem-thu/ban-thu-sql/do-b118b.mjs`), và bài học `14` mục 7 đã
--   trả giá: một bảng tự kiểm 5/5 ĐẠT che một hàm hỏng hẳn.

select * from (
  values
  (1, 'Cột tai_khoan.khoa_luc tồn tại',
   case when exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='tai_khoan'
                        and column_name='khoa_luc')
        then 'ĐẠT' else 'HỎNG' end),

  (2, 'Cột tai_khoan.qtht_moi_luc tồn tại',
   case when exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='tai_khoan'
                        and column_name='qtht_moi_luc')
        then 'ĐẠT' else 'HỎNG' end),

  (3, 'Cột tree_members.xin_vai tồn tại',
   case when exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='tree_members'
                        and column_name='xin_vai')
        then 'ĐẠT' else 'HỎNG' end),

  (4, 'Ràng buộc tree_members_xin_vai_hop_le có',
   case when exists (select 1 from pg_constraint
                      where conname='tree_members_xin_vai_hop_le')
        then 'ĐẠT' else 'HỎNG' end),

  (5, 'Bốn hàm mới của luật 1 và 2 có đủ',
   case when (select count(*) from information_schema.routines
               where routine_schema='public'
                 and routine_name in ('khoa_tai_khoan','mo_khoa_tai_khoan',
                                      'nhan_quyen_qtht','tu_choi_quyen_qtht')) = 4
        then 'ĐẠT' else 'HỎNG' end),

  (6, 'Bốn hàm xin đổi quyền có đủ',
   case when (select count(*) from information_schema.routines
               where routine_schema='public'
                 and routine_name in ('xin_doi_vai','rut_xin_doi_vai',
                                      'duyet_xin_doi_vai','ds_xin_doi_vai')) = 4
        then 'ĐẠT' else 'HỎNG' end),

  (7, 'la_quan_tri_he_thong() đã hỏi khoa_luc',
   case when (select pg_get_functiondef(p.oid) from pg_proc p
               join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname='la_quan_tri_he_thong')
             like '%khoa_luc is null%'
        then 'ĐẠT' else 'HỎNG' end),

  (8, 'co_the_xem_cay() đã hỏi bi_khoa() VÀ cay_dang_an()',
   case when (select pg_get_functiondef(p.oid) from pg_proc p
               join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname='co_the_xem_cay')
             like '%bi_khoa()%'
        and (select pg_get_functiondef(p.oid) from pg_proc p
               join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname='co_the_xem_cay')
             like '%cay_dang_an(%'
        then 'ĐẠT' else 'HỎNG' end),

  (9, 'co_the_xem_cay() VẪN chừa lối cho vai sao_luu',
   case when (select pg_get_functiondef(p.oid) from pg_proc p
               join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname='co_the_xem_cay')
             like '%la_may_sao_luu(%'
        then 'ĐẠT' else 'HỎNG' end),

  (10, 'khoa_tai_khoan() từ chối tài khoản sao_luu',
   case when (select pg_get_functiondef(p.oid) from pg_proc p
               join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname='khoa_tai_khoan')
             like '%sao_luu%'
        then 'ĐẠT' else 'HỎNG' end),

  (11, 'la_quan_tri_he_thong() KHÔNG đọc qtht_moi_luc (luật 11.8)',
   case when (select pg_get_functiondef(p.oid) from pg_proc p
               join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname='la_quan_tri_he_thong')
             not like '%qtht_moi%'
        then 'ĐẠT' else 'HỎNG' end),

  (12, 'don_thung_rac() đã đổi 30 → 120 ngày',
   case when (select pg_get_functiondef(p.oid) from pg_proc p
               join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname='don_thung_rac')
             like '%120 days%'
        then 'ĐẠT' else 'HỎNG' end),

  -- ⚠ Đếm bằng `pg_proc.proallargtypes`, KHÔNG bằng `information_schema.
  --   columns`. Bản nháp đầu hỏi bảng ấy và nó trả về **0** — một hàm trả
  --   bảng không có dòng nào ở đó, cột trả về nằm trong tham số OUT. Bàn thử
  --   bắt được 16/09: phép này báo HỎNG trong khi hàm hoàn toàn đúng, tức một
  --   phép kiểm sai làm người đọc đi sửa thứ không hỏng.
  (13, 'ds_tai_khoan_he_thong() trả đủ 21 cột',
   case when (select array_length(p.proallargtypes, 1) from pg_proc p
               join pg_namespace n on n.oid = p.pronamespace
              where n.nspname='public'
                and p.proname='ds_tai_khoan_he_thong') = 21
        then 'ĐẠT' else 'HỎNG' end),

  (14, 'anon KHÔNG gọi được khoa_tai_khoan()',
   case when has_function_privilege('anon',
          'public.khoa_tai_khoan(uuid, text, text)', 'execute')
        then 'HỎNG' else 'ĐẠT' end),

  (15, 'anon KHÔNG gọi được ds_tai_khoan_he_thong() (grant sau drop)',
   case when has_function_privilege('anon',
          'public.ds_tai_khoan_he_thong()', 'execute')
        then 'HỎNG' else 'ĐẠT' end),

  (16, 'authenticated GỌI ĐƯỢC ds_tai_khoan_he_thong()',
   case when has_function_privilege('authenticated',
          'public.ds_tai_khoan_he_thong()', 'execute')
        then 'ĐẠT' else 'HỎNG' end)
) as t(stt, phep_kiem, ket_qua)
order by stt;

-- ============================================================
-- HẾT FILE
-- ============================================================
