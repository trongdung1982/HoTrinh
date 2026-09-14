-- ============================================================
-- giapha-supabase · luoc-do/21-de-xuat-gan-nguoi.sql
-- Vai trò  : b111c — ĐƠN ĐỀ XUẤT gắn mã người cho CHÍNH MÌNH, một quản trị
--            KHÁC xét. Đây là **cửa thứ TÁM** của luật không-tự-đặt-quyền-cho-mình.
-- Chạy ở   : Supabase → SQL Editor. Chạy SAU `18-hai-chu-ky.sql`.
--            ⚠ File này chỉ THÊM — nó không định nghĩa đè hàm nào của file
--            khác, nên nó KHÔNG nằm trong ba chuỗi dán lại ở `CHI-DAN.md`
--            mục 3. Nhưng nó GỌI `gan_nguoi_cho_thanh_vien()` của `18`, nên
--            `18` phải đã dán trước.
-- Phiên bản: 0.1.0 · Cập nhật: 10/09/2026 (b111c)
-- ============================================================
--
-- ═══ VÌ SAO CÓ FILE NÀY ═══
--
-- Khu *Tài khoản & quyền* khoá dòng của chính người đang đăng nhập, đúng luật
-- *"không ai đặt quyền cho chính mình"* (`THIET-KE-NHIEU-CAY.md` mục 11.3).
-- Cửa thứ HAI trong bảy cửa ấy là **gắn mã người**: tự trỏ mình vào một cụ tổ
-- là mở `pham_vi_sua()` ra cả một nhánh, không đổi một chữ vai nào.
--
-- Luật đúng, và file này KHÔNG mở khoá nó. Nhưng luật ấy để lại một người
-- **không có đường nào** nói ra câu *"tôi chính là người này trong sơ đồ"* —
-- kể cả Quản trị hệ thống, kể cả chủ cây. Đơn đề xuất là đường ấy, và nó giữ
-- nguyên hai chữ ký: **người nộp ký một, người xét ký hai.**
--
-- Chủ dự án chốt 10/09/2026, sau khi được hỏi thẳng ba đường. Nguyên văn câu
-- chọn: *"Đơn đề xuất, người khác duyệt"*.
--
-- ═══ BA ĐIỀU HÀM MÁY CHỦ PHẢI TỰ CANH (KE-HOACH.md, b111c) ═══
--
--   ① **Người xét không được là người nộp.** Đây là cả điểm của bước này. Gác
--      bằng đúng câu của bảy cửa kia: `la_chinh_minh(...)` thì từ chối, không
--      ngoại lệ. Xem mục 6.
--   ② **`null not in (…)` cho ra `null`, không cho ra `true`.** Cái bẫy đã mở
--      một lỗ leo quyền thật ngày 04/09/2026 (phép thử H9). Mọi phép so vai ở
--      đây đi qua `coalesce(…, '')`, và mọi phép so cờ đi qua `coalesce(…,
--      false)`.
--   ③ **Duyệt xong phải đi qua đúng `gan_nguoi_cho_thanh_vien()` của `18`**,
--      KHÔNG ghi thẳng vào `tree_members`. Hai đường ghi vào cùng một cột là
--      hai chỗ để lệch nhau — đúng bài học b110c: *hàng rào phải gác CỘT,
--      không gác HÀM*. Nhờ đi qua đó, đơn này thừa hưởng nguyên cả bốn phép
--      kiểm của hàm ấy (quyền quản trị · không tự gắn cho mình · không gắn cho
--      lời mời chưa nhận · mã người có thật) mà không chép lại phép nào.
--
-- ═══ TÊN LỆCH MỘT CHỖ SO VỚI `KE-HOACH.md`, VÀ ĐÂY LÀ LÝ DO ═══
--
-- `KE-HOACH.md` mục b111c viết hàm nộp tên `de_xuat_gan_nguoi()`, trùng đúng
-- tên bảng. Postgres cho phép, nhưng một cái tên vừa là bảng vừa là hàm trong
-- cùng schema là chỗ người đọc mã (và cả câu báo lỗi) phải dừng lại đoán. Nên
-- bảng giữ tên **`de_xuat_gan_nguoi`**, còn hàm nộp mang động từ đứng đầu như
-- mọi hàm khác của dự án: **`nop_de_xuat_gan()`** — cùng nếp `xin_vao_cay()`,
-- `moi_vao_cay()`, `duyet_thanh_vien()`.
--
-- ═══ CHÉP NẾP CỦA `07-duyet-dang-ky.sql`, KHÔNG PHÁT MINH LẠI ═══
--
-- Đường *đơn — rồi — duyệt* đã có sẵn trong dự án này từ b95 (`xin_vao_cay()`
-- → `ds_cho_duyet()` → `duyet_thanh_vien()` / `tu_choi_thanh_vien()`). File
-- này đi đúng bốn nhịp ấy, và mượn luôn ba thói quen đã trả giá để có:
--
--   · **vai và cờ đóng cứng trong thân hàm.** Người nộp không chọn được gì
--     ngoài mã người và lời nhắn — `07` mục 4: *"người gọi không chọn được vai
--     của mình, đó là điểm khác nhau giữa một cửa và một lỗ hổng"*.
--   · **phép kiểm quyền của hàm trả BẢNG nằm trong `where`**, không nằm ở một
--     câu `if` đứng trước (`07` mục 6) — hàm `sql` thì đó là cách gọn nhất và
--     nó không có nhánh nào để rơi lọt qua.
--   · **`revoke` đứng trước mọi `grant`** (`07` mục 8), vì mặc định Postgres là
--     EXECUTE cho `public`, tức cả `anon`.

begin;

-- ============================================================
-- 1. BẢNG CHỨA ĐƠN
-- ============================================================
-- ⚠ **Một bảng mới, không nhét thêm cột vào `tree_members`.** Đơn đề xuất là
--   một thứ có vòng đời riêng — nộp, sửa, rút, xét — và nó tồn tại cả khi
--   người nộp chưa được gắn gì. Nhét vào `tree_members` là trộn *"người này
--   đang có quyền gì"* với *"người này đang xin gì"*; đúng chỗ `THIET-KE-
--   NHIEU-CAY.md` mục 11.4 đã phải dựng hẳn cột `moi_vai` để gỡ ra.
--
-- ⚠ `on delete cascade` cả hai khoá ngoại: xoá cứng một cây (`don_thung_rac()`
--   của `16`) hay xoá một tài khoản thì đơn của nó không còn nghĩa gì. Khác
--   `moi_boi` của `14` — chỗ ấy `set null` vì dòng lời mời vẫn còn nghĩa khi
--   người mời biến mất, còn đơn thì không.

create table if not exists public.de_xuat_gan_nguoi (
  id         uuid primary key default gen_random_uuid(),
  tree_id    uuid not null references public.trees(id)   on delete cascade,
  user_id    uuid not null references auth.users(id)     on delete cascade,
  person_id  text not null,
  ly_do      text not null default '',
  trang_thai text not null default 'cho'
             check (trang_thai in ('cho', 'duyet', 'tu_choi')),
  tao_luc    timestamptz not null default now(),
  xet_boi    uuid references auth.users(id) on delete set null,
  xet_luc    timestamptz,
  loi_xet    text not null default ''
);

comment on table public.de_xuat_gan_nguoi is
  'Đơn một người tự nộp: "tôi chính là người mang mã này". Một quản trị KHÁC '
  'xét. Cửa thứ tám của luật không tự đặt quyền cho mình.';
comment on column public.de_xuat_gan_nguoi.person_id is
  'Mã người trong cây mà người nộp tự nhận. Không bao giờ để trống — gỡ mã '
  'không đi bằng đơn.';
comment on column public.de_xuat_gan_nguoi.xet_boi is
  'Ai đã xét. Luôn KHÁC user_id — máy chủ canh, xem duyet_de_xuat_gan().';

-- ⚠ MỘT NGƯỜI, MỘT CÂY, ĐÚNG MỘT ĐƠN ĐANG CHỜ. Chỉ mục có điều kiện, không
--   phải `unique (tree_id, user_id)` trơn: đơn đã xét phải ở lại làm dấu vết,
--   nên chỉ những dòng `cho` mới bị ràng buộc. Thiếu nó là bấm mười lần ra
--   mười đơn, và người xét không biết đơn nào là ý cuối của người nộp.
create unique index if not exists de_xuat_gan_mot_don_cho
  on public.de_xuat_gan_nguoi (tree_id, user_id)
  where trang_thai = 'cho';

-- Người xét mở bảng theo cây, và luôn lọc `cho`.
create index if not exists de_xuat_gan_theo_cay
  on public.de_xuat_gan_nguoi (tree_id, trang_thai);

-- ⚠⚠ BẬT RLS VÀ **KHÔNG** VIẾT POLICY NÀO. Bảng bật RLS mà không có policy là
--    *cấm tất* — đúng điều muốn ở đây: mọi đường vào bảng này đi qua sáu hàm
--    `security definer` bên dưới, không ai `select` thẳng được. `02-rls.sql`
--    mục cuối ghi nguyên câu ấy, và cũng ghi cái giá: **quên bật là bảng mở
--    toang cho mọi người đăng nhập.**
alter table public.de_xuat_gan_nguoi enable row level security;

-- ============================================================
-- 2. NỘP ĐƠN — nop_de_xuat_gan()
-- ============================================================
-- ⚠ **KHÔNG có tham số `p_user`.** Đơn luôn là của `auth.uid()`, đóng cứng
--   trong thân hàm. Nhờ vậy không ai nộp hộ ai được, và không có đường nào
--   biến hàm này thành cửa gắn mã người cho người khác — chỗ ấy đã có
--   `gan_nguoi_cho_thanh_vien()` với hàng rào riêng của nó.
--
-- ⚠ Người nộp phải **đã có chân thật** trong cây (`approved`). Ba lý do, và
--   không lý do nào là để cho chặt:
--     · chưa có chân thì `gan_nguoi_cho_thanh_vien()` lúc duyệt cũng ném
--       *"chưa có tên trong gia phả"* — nhận đơn là hứa một thứ không giữ được;
--     · dòng LỜI MỜI chưa nhận có mặt trong bảng nhưng `approved = false`, và
--       cho nó nộp đơn là mở lại đúng lỗ hổng b110c bằng một cửa mới;
--     · người chưa vào cây đã có đường riêng rồi — `xin_vao_cay()`.
--
-- ⚠ Nộp lần thứ hai là **SỬA đơn đang chờ**, không đẻ đơn thứ hai (chỉ mục ở
--   mục 1 chặn, nhưng chặn bằng lỗi thì người dùng nhận một câu tiếng Anh).
--   Cùng lý lẽ `on conflict do nothing` của `xin_vao_cay()`: bấm nhiều lần
--   không được sinh ra nhiều thứ.

create or replace function public.nop_de_xuat_gan(
  p_tree   uuid,
  p_person text,
  p_ly_do  text default ''
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_toi  uuid := auth.uid();
  v_ma   text;
  v_tv   public.tree_members%rowtype;
  v_id   uuid;
  v_sua  boolean := false;
  n      integer;
begin
  if v_toi is null then
    return jsonb_build_object('ok', false, 'loi',
      'Chưa đăng nhập nên chưa nộp đơn được.');
  end if;

  if p_tree is null or not exists (select 1 from public.trees where id = p_tree) then
    return jsonb_build_object('ok', false, 'loi', 'Không có gia phả này.');
  end if;

  select * into v_tv from public.tree_members
   where tree_id = p_tree and user_id = v_toi;

  if not found then
    return jsonb_build_object('ok', false, 'loi',
      'Bạn chưa có tên trong gia phả này. Xin vào gia phả trước đã, rồi mới '
      || 'đề xuất được mã người.');
  end if;

  -- ⚠ `coalesce(…, false)`: cột `approved` khai cho phép `null` ở bản đầu, và
  --   `if not null` không vào nhánh nào — cùng họ với cái bẫy `null not in`.
  if not coalesce(v_tv.approved, false) then
    return jsonb_build_object('ok', false, 'loi',
      case when v_tv.moi_luc is not null
           then 'Bạn mới được MỜI vào gia phả này và chưa bấm Nhận. Nhận lời '
                || 'mời trước đã.'
           else 'Đơn xin vào gia phả của bạn còn đang chờ duyệt. Đợi được '
                || 'duyệt rồi mới đề xuất mã người được.' end);
  end if;

  -- ⚠ Mã người BẮT BUỘC. Để trống trong `gan_nguoi_cho_thanh_vien()` nghĩa là
  --   *gỡ gắn*, nhưng gỡ mã của chính mình là tự HẠ quyền mình — nó không cần
  --   chữ ký thứ hai, nên nó không đi bằng đơn. Nhận một đơn rỗng là đẻ ra một
  --   đường thứ hai làm cùng một việc.
  v_ma := nullif(btrim(coalesce(p_person, '')), '');
  if v_ma is null then
    return jsonb_build_object('ok', false, 'loi',
      'Phải nói rõ mã người bạn tự nhận (ví dụ P0012).');
  end if;

  select count(*) into n from public.persons
   where tree_id = p_tree and id = v_ma and not coalesce(deleted, false);
  if n <> 1 then
    return jsonb_build_object('ok', false, 'loi',
      'Không có người mang mã ' || v_ma || ' trong gia phả này.');
  end if;

  if coalesce(v_tv.person_id, '') = v_ma then
    return jsonb_build_object('ok', false, 'loi',
      'Bạn đã được gắn đúng mã ' || v_ma || ' rồi, không cần đề xuất nữa.');
  end if;

  -- Nói sớm cho người nộp biết, thay vì để họ chờ rồi nhận câu từ chối lúc
  -- xét. Hàng rào thật vẫn là `unique (tree_id, person_id)` của `tree_members`
  -- và câu bắt `unique_violation` trong `gan_nguoi_cho_thanh_vien()` — phép
  -- kiểm ở đây chỉ để câu chuyện đúng thứ tự, không thay hàng rào ấy.
  if exists (select 1 from public.tree_members
              where tree_id = p_tree and person_id = v_ma and user_id <> v_toi) then
    return jsonb_build_object('ok', false, 'loi',
      'Mã ' || v_ma || ' đã gắn cho một tài khoản khác rồi. Nói với quản trị '
      || 'gia phả nếu bạn cho rằng chỗ ấy nhầm.');
  end if;

  update public.de_xuat_gan_nguoi
     set person_id = v_ma,
         ly_do     = left(coalesce(p_ly_do, ''), 500),
         tao_luc   = now()
   where tree_id = p_tree and user_id = v_toi and trang_thai = 'cho'
  returning id into v_id;

  if v_id is null then
    insert into public.de_xuat_gan_nguoi (tree_id, user_id, person_id, ly_do)
    values (p_tree, v_toi, v_ma, left(coalesce(p_ly_do, ''), 500))
    returning id into v_id;
  else
    v_sua := true;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'maNguoi', v_ma,
                            'suaDon', v_sua);
end;
$$;

-- ============================================================
-- 3. RÚT ĐƠN CỦA CHÍNH MÌNH — rut_de_xuat_gan()
-- ============================================================
-- ⚠ **Rút đơn KHÔNG vi phạm luật "không tự đặt quyền cho mình"**, và ranh giới
--   nằm đúng chỗ `THIET-KE-NHIEU-CAY.md` mục 11.4 đã kẻ cho việc nhận lời mời:
--   người rút chỉ **lấy đi** một lời đề nghị của chính mình, không cấp cho
--   mình thứ gì. Không có nó thì người gõ nhầm mã phải đi nhờ người khác bấm
--   *Từ chối* — biến một việc vô hại thành việc của người thứ hai.
--
-- ⚠ `delete`, không phải `trang_thai = 'tu_choi'`: đơn tự rút không phải một
--   lần bị từ chối, và để nó lại trong sổ dưới nhãn ấy là ghi sai lịch sử.

create or replace function public.rut_de_xuat_gan(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare n integer;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'loi', 'Chưa đăng nhập.');
  end if;

  delete from public.de_xuat_gan_nguoi
   where id = p_id and user_id = auth.uid() and trang_thai = 'cho';
  get diagnostics n = row_count;

  if n = 0 then
    return jsonb_build_object('ok', false, 'loi',
      'Không có đơn nào đang chờ của bạn mang mã đơn ấy.');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- 4. NGƯỜI XÉT NHÌN THẤY GÌ — ds_de_xuat_gan()
-- ============================================================
-- ⚠ Phép kiểm quyền nằm TRONG `where`, đúng nếp `07` mục 6: hàm `sql` trả
--   bảng thì đó là cách gọn nhất, và nó không dính bẫy `null` — người ngoài
--   cây có `co_the_quan_tri()` trả `false`, bảng ra rỗng, không có nhánh nào
--   để rơi lọt qua.
--
-- ⚠ Cột `la_cua_toi` KHÔNG phải để cho đẹp: màn hình phải **khoá sẵn kèm lý
--   do** nút Duyệt trên đơn của chính mình, chứ không cho bấm rồi mới giải
--   thích (chủ dự án, 08/09/2026). Tính ở máy chủ vì đó là chỗ duy nhất biết
--   chắc `auth.uid()`.
--
-- ⚠ `ten_nguoi` tra từ `persons` chứ không tin mã suông: người xét cần đọc
--   *"à, tài khoản này tự nhận là cụ Bắc"* — một chuỗi `P0012` không nói được
--   câu ấy. Cùng lý lẽ cột `nguoi_gan` của `20`.

drop function if exists public.ds_de_xuat_gan(uuid);

create or replace function public.ds_de_xuat_gan(p_tree uuid)
returns table (
  id         uuid,
  user_id    uuid,
  email      text,
  ma_ngan    text,
  person_id  text,
  ten_nguoi  text,
  ly_do      text,
  tao_luc    timestamptz,
  la_cua_toi boolean,
  ma_dang_co text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select d.id,
         d.user_id,
         coalesce(tm.email, u.email::text, ''),
         coalesce(tk.ma_ngan, ''),
         d.person_id,
         coalesce(nullif(public.ten_day_du(p.names), ''), d.person_id, ''),
         d.ly_do,
         d.tao_luc,
         coalesce(d.user_id = auth.uid(), false),
         -- Mã người ĐANG gắn của chính tài khoản ấy, để người xét thấy đơn này
         -- là *gắn mới* hay *đổi mã*. Trống là chưa gắn gì.
         coalesce(tm.person_id, '')
    from public.de_xuat_gan_nguoi d
    join auth.users u on u.id = d.user_id
    left join public.tai_khoan tk on tk.user_id = d.user_id
    left join public.tree_members tm
           on tm.tree_id = d.tree_id and tm.user_id = d.user_id
    left join public.persons p
           on p.tree_id = d.tree_id and p.id = d.person_id
   where d.tree_id = p_tree
     and d.trang_thai = 'cho'
     and public.co_the_quan_tri(p_tree)
   order by d.tao_luc, coalesce(tm.email, u.email::text);
$$;

-- ============================================================
-- 5. NGƯỜI NỘP NHÌN THẤY GÌ — de_xuat_gan_cua_toi()
-- ============================================================
-- Người nộp **không đọc được bảng** (mục 1 bật RLS không policy), nên câu
-- *"đơn của bạn đang chờ"* phải đi qua một hàm chỉ nói về chính người gọi —
-- đúng khuôn `trang_thai_cua_toi()` của `07` mục 5.
--
-- ⚠ Nó trả cả **lần bị từ chối gần nhất** kèm lý do. Không có phần ấy thì đơn
--   bị từ chối biến mất không dấu vết, và người nộp chỉ thấy màn hình quay về
--   như chưa từng bấm gì — họ sẽ nộp lại đúng cái đơn ấy.

create or replace function public.de_xuat_gan_cua_toi(p_tree uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_cho public.de_xuat_gan_nguoi%rowtype;
  v_bo  public.de_xuat_gan_nguoi%rowtype;
begin
  if auth.uid() is null or p_tree is null then
    return jsonb_build_object('coDon', false);
  end if;

  select * into v_cho from public.de_xuat_gan_nguoi
   where tree_id = p_tree and user_id = auth.uid() and trang_thai = 'cho';

  select * into v_bo from public.de_xuat_gan_nguoi
   where tree_id = p_tree and user_id = auth.uid() and trang_thai = 'tu_choi'
   order by xet_luc desc nulls last
   limit 1;

  return jsonb_build_object(
    'coDon',   v_cho.id is not null,
    'id',      v_cho.id,
    'maNguoi', coalesce(v_cho.person_id, ''),
    'tenNguoi', coalesce((select nullif(public.ten_day_du(p.names), '')
                            from public.persons p
                           where p.tree_id = p_tree and p.id = v_cho.person_id), ''),
    'lyDo',    coalesce(v_cho.ly_do, ''),
    'taoLuc',  v_cho.tao_luc,
    'lanTuChoi', case when v_bo.id is null then null else jsonb_build_object(
                   'maNguoi', v_bo.person_id,
                   'loiXet',  coalesce(v_bo.loi_xet, ''),
                   'xetLuc',  v_bo.xet_luc) end);
end;
$$;

-- ============================================================
-- 6. ⚠⚠ DUYỆT — duyet_de_xuat_gan() — CỬA THỨ TÁM
-- ============================================================
-- Đây là hàm cả bước này sinh ra để viết. Bốn phép kiểm, và phép thứ ba là
-- phép mà bảy cửa kia đã trả giá để có.

create or replace function public.duyet_de_xuat_gan(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_don public.de_xuat_gan_nguoi%rowtype;
  v_kq  jsonb;
begin
  select * into v_don from public.de_xuat_gan_nguoi where id = p_id;

  if not found then
    return jsonb_build_object('ok', false, 'loi', 'Không có đơn này.');
  end if;

  if v_don.trang_thai <> 'cho' then
    return jsonb_build_object('ok', false, 'loi',
      'Đơn này đã được xét rồi (' ||
      case v_don.trang_thai when 'duyet' then 'đã duyệt'
                            else 'đã từ chối' end || ').');
  end if;

  if not public.co_the_quan_tri(v_don.tree_id) then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ chủ gia phả hoặc Quản trị hệ thống mới xét được đơn này.');
  end if;

  -- ⚠⚠ CỬA THỨ TÁM CỦA LUẬT KHÔNG-TỰ-ĐẶT-QUYỀN-CHO-MÌNH, và là cả lý do bước
  --    b111c tồn tại. Không có câu này thì đơn đề xuất trở thành đúng cái thứ
  --    nó sinh ra để tránh: một Quản trị hệ thống nộp đơn cho mình rồi tự bấm
  --    Duyệt là tự gắn mình vào một cụ tổ bằng hai cú bấm thay vì một.
  --
  --    Luật **không có ngoại lệ**, kể cả cho Quản trị hệ thống — họ đã có mọi
  --    quyền ở mọi cây qua cờ `tai_khoan`, nên chặn họ tự xét đơn của chính
  --    mình không lấy đi khả năng nào. *Một luật không ngoại lệ thì kiểm được.*
  if public.la_chinh_minh(v_don.user_id) then
    return jsonb_build_object('ok', false, 'loi',
      'Đây là đơn của chính bạn — không ai tự duyệt đơn của mình được. Đó là '
      || 'cả điểm của lá đơn: cần chữ ký thứ hai. Nhờ một Quản trị hệ thống '
      || 'khác, hoặc chủ gia phả này, bấm giúp.');
  end if;

  -- ⚠⚠ ĐI QUA ĐÚNG CỬA CŨ, KHÔNG GHI THẲNG VÀO `tree_members`. Nhờ vậy đơn này
  --    thừa hưởng cả bốn phép kiểm của `gan_nguoi_cho_thanh_vien()` (`18` mục
  --    5) mà không chép lại phép nào — kể cả cửa *lời mời chưa nhận* và câu
  --    bắt `unique_violation`. Hai đường ghi vào cùng một cột là hai chỗ để
  --    lệch nhau; bài học b110c.
  v_kq := public.gan_nguoi_cho_thanh_vien(v_don.tree_id, v_don.user_id,
                                          v_don.person_id);

  -- ⚠ `coalesce((… ->> 'ok')::boolean, false)`: `->>` trả `null` khi khoá
  --   không có, và `if not null` không vào nhánh nào — đơn sẽ bị đánh dấu đã
  --   duyệt trong khi mã người chưa gắn vào đâu cả.
  if not coalesce((v_kq ->> 'ok')::boolean, false) then
    return jsonb_build_object('ok', false, 'loi',
      coalesce(v_kq ->> 'loi', 'Không gắn được mã người.'));
  end if;

  update public.de_xuat_gan_nguoi
     set trang_thai = 'duyet', xet_boi = auth.uid(), xet_luc = now()
   where id = p_id;

  return jsonb_build_object('ok', true, 'maNguoi', v_don.person_id,
                            'nguoiNop', v_don.user_id);
end;
$$;

-- ============================================================
-- 7. TỪ CHỐI — tu_choi_de_xuat_gan()
-- ============================================================
-- ⚠ Cũng chặn `la_chinh_minh()`, dù tự từ chối đơn của mình chẳng cấp cho ai
--   quyền gì. Hai lý do:
--     · **một luật một hình thì kiểm được** — "người xét khác người nộp" đúng
--       cho cả hai nút, nên phép đo hỏi đúng một câu cho cả hai;
--     · đường tự lấy đơn về đã có rồi (`rut_de_xuat_gan()`), và để hai đường
--       cùng làm một việc là hai chỗ để lệch nhau — đúng câu `18` mục 3 đã
--       viết khi chặn `duyet_thanh_vien(p_duyet := false)` trên một lời mời.
--
-- ⚠ Lý do từ chối **bắt buộc**. Người nộp đọc nó ở `de_xuat_gan_cua_toi()`;
--   một lời từ chối không lý do thì họ chỉ biết nộp lại y hệt.

create or replace function public.tu_choi_de_xuat_gan(p_id uuid, p_ly_do text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_don public.de_xuat_gan_nguoi%rowtype;
  v_ly  text;
begin
  select * into v_don from public.de_xuat_gan_nguoi where id = p_id;

  if not found then
    return jsonb_build_object('ok', false, 'loi', 'Không có đơn này.');
  end if;

  if v_don.trang_thai <> 'cho' then
    return jsonb_build_object('ok', false, 'loi', 'Đơn này đã được xét rồi.');
  end if;

  if not public.co_the_quan_tri(v_don.tree_id) then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ chủ gia phả hoặc Quản trị hệ thống mới xét được đơn này.');
  end if;

  if public.la_chinh_minh(v_don.user_id) then
    return jsonb_build_object('ok', false, 'loi',
      'Đây là đơn của chính bạn. Muốn thôi thì tự rút đơn về, không phải tự '
      || 'từ chối mình.');
  end if;

  v_ly := nullif(btrim(coalesce(p_ly_do, '')), '');
  if v_ly is null then
    return jsonb_build_object('ok', false, 'loi',
      'Phải ghi lý do từ chối — người nộp đọc đúng câu ấy để biết nên sửa gì.');
  end if;

  update public.de_xuat_gan_nguoi
     set trang_thai = 'tu_choi', xet_boi = auth.uid(), xet_luc = now(),
         loi_xet = left(v_ly, 500)
   where id = p_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- 8. QUYỀN GỌI
-- ============================================================
-- ⚠ `revoke` đứng trước `grant`, không bỏ được: mặc định của Postgres là
--   EXECUTE cấp cho `public` — tức mọi vai, kể cả `anon`, người chưa đăng
--   nhập. Sáu hàm dưới đều tự kiểm người gọi trong thân, nhưng đóng sẵn cửa
--   vẫn hơn tin vào một phép kiểm (`07` mục 8). Và `15` đã trả giá đúng chỗ
--   này: nó `drop` rồi dựng lại hai hàm mà quên cấp lại, `20` mới vá.

revoke all on function public.nop_de_xuat_gan(uuid, text, text) from public, anon;
revoke all on function public.rut_de_xuat_gan(uuid)             from public, anon;
revoke all on function public.ds_de_xuat_gan(uuid)              from public, anon;
revoke all on function public.de_xuat_gan_cua_toi(uuid)         from public, anon;
revoke all on function public.duyet_de_xuat_gan(uuid)           from public, anon;
revoke all on function public.tu_choi_de_xuat_gan(uuid, text)   from public, anon;

grant execute on function public.nop_de_xuat_gan(uuid, text, text) to authenticated;
grant execute on function public.rut_de_xuat_gan(uuid)             to authenticated;
grant execute on function public.ds_de_xuat_gan(uuid)              to authenticated;
grant execute on function public.de_xuat_gan_cua_toi(uuid)         to authenticated;
grant execute on function public.duyet_de_xuat_gan(uuid)           to authenticated;
grant execute on function public.tu_choi_de_xuat_gan(uuid, text)   to authenticated;

commit;

-- ============================================================
-- 9. BẢNG TỰ KIỂM — đọc sau khi dán
-- ============================================================
-- ⚠ Bảng này chỉ hỏi *"thứ này có tồn tại và đúng hình dạng không"*. Nó KHÔNG
--   hỏi *"hàng rào có chặn được không"* — câu ấy chỉ phép đo mượn danh nghĩa
--   từng tài khoản mới trả lời được: `kiem-thu/ban-thu-sql/do-b111c.mjs`,
--   ngoài repo. Ngày 07/09/2026 một bảng tự kiểm 12/12 ĐẠT đã cho qua hai lỗ
--   hổng thật; ngày 10/09/2026 chính bảng tự kiểm của `18` báo nhầm hai phép.

select ten_kiem as "Kiểm", ket_qua as "Kết quả"
from (
  select 1 as stt, 'Bảng de_xuat_gan_nguoi đã có' as ten_kiem,
    case when exists (select 1 from information_schema.tables
                       where table_schema = 'public'
                         and table_name = 'de_xuat_gan_nguoi')
         then 'ĐẠT' else 'HỎNG — thiếu bảng' end as ket_qua
  union all
  select 2, '⚠ Bảng ấy BẬT RLS (không policy nào = cấm tất)',
    case when (select relrowsecurity from pg_class
                where oid = 'public.de_xuat_gan_nguoi'::regclass)
         then 'ĐẠT' else 'HỎNG — bảng đơn đang mở toang cho mọi người đăng nhập' end
  union all
  select 3, '⚠ Và KHÔNG có policy nào (mọi đường đi qua hàm definer)',
    case when (select count(*) from pg_policies
                where schemaname = 'public' and tablename = 'de_xuat_gan_nguoi') = 0
         then 'ĐẠT' else 'HỎNG — có policy lạ, đọc lại xem ai thêm' end
  union all
  select 4, 'Chỉ mục "một người một cây đúng một đơn chờ"',
    case when exists (select 1 from pg_indexes
                       where schemaname = 'public'
                         and indexname = 'de_xuat_gan_mot_don_cho')
         then 'ĐẠT' else 'HỎNG — bấm mười lần sẽ ra mười đơn' end
  union all
  select 5, 'Đủ sáu hàm',
    (select case when count(*) = 6 then 'ĐẠT'
                 else 'HỎNG — mới có ' || count(*)::text || '/6' end
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in ('nop_de_xuat_gan', 'rut_de_xuat_gan',
                          'ds_de_xuat_gan', 'de_xuat_gan_cua_toi',
                          'duyet_de_xuat_gan', 'tu_choi_de_xuat_gan'))
  union all
  select 6, '⚠⚠ duyet_de_xuat_gan() có CỬA THỨ TÁM (la_chinh_minh)',
    case when pg_get_functiondef((select p.oid from pg_proc p
            join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'duyet_de_xuat_gan'))
         like '%la_chinh_minh%'
         then 'ĐẠT' else 'HỎNG — tự duyệt đơn của mình được, cả bước này vô nghĩa' end
  union all
  select 7, '⚠ tu_choi_de_xuat_gan() cũng có cửa ấy',
    case when pg_get_functiondef((select p.oid from pg_proc p
            join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'tu_choi_de_xuat_gan'))
         like '%la_chinh_minh%'
         then 'ĐẠT' else 'HỎNG — hai nút xét đơn không cùng một luật' end
  union all
  select 8, '⚠⚠ Duyệt ĐI QUA gan_nguoi_cho_thanh_vien(), không ghi thẳng bảng',
    case when pg_get_functiondef((select p.oid from pg_proc p
            join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'duyet_de_xuat_gan'))
              like '%gan_nguoi_cho_thanh_vien%'
          and pg_get_functiondef((select p.oid from pg_proc p
            join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'duyet_de_xuat_gan'))
              not like '%update public.tree_members%'
         then 'ĐẠT' else 'HỎNG — có đường ghi thứ hai vào tree_members' end
  union all
  select 9, 'gan_nguoi_cho_thanh_vien() đã có bản vá `18` (cửa lời mời)',
    case when pg_get_functiondef((select p.oid from pg_proc p
            join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'gan_nguoi_cho_thanh_vien'))
         like '%la_loi_moi_cho_nhan%'
         then 'ĐẠT' else 'HỎNG — dán `18-hai-chu-ky.sql` trước, xem CHI-DAN mục 3' end
  union all
  select 10, 'ds_de_xuat_gan() gác bằng co_the_quan_tri()',
    case when pg_get_functiondef((select p.oid from pg_proc p
            join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'ds_de_xuat_gan'))
         like '%co_the_quan_tri%'
         then 'ĐẠT' else 'HỎNG — ai cũng đọc được đơn của người khác' end
  union all
  select 11, 'anon KHÔNG gọi được sáu hàm ấy',
    case when not (has_function_privilege('anon', 'public.nop_de_xuat_gan(uuid, text, text)', 'execute')
                or has_function_privilege('anon', 'public.rut_de_xuat_gan(uuid)', 'execute')
                or has_function_privilege('anon', 'public.ds_de_xuat_gan(uuid)', 'execute')
                or has_function_privilege('anon', 'public.de_xuat_gan_cua_toi(uuid)', 'execute')
                or has_function_privilege('anon', 'public.duyet_de_xuat_gan(uuid)', 'execute')
                or has_function_privilege('anon', 'public.tu_choi_de_xuat_gan(uuid, text)', 'execute'))
         then 'ĐẠT' else 'HỎNG — quên revoke ở mục 8' end
  union all
  select 12, 'authenticated gọi được cả sáu',
    case when has_function_privilege('authenticated', 'public.nop_de_xuat_gan(uuid, text, text)', 'execute')
          and has_function_privilege('authenticated', 'public.rut_de_xuat_gan(uuid)', 'execute')
          and has_function_privilege('authenticated', 'public.ds_de_xuat_gan(uuid)', 'execute')
          and has_function_privilege('authenticated', 'public.de_xuat_gan_cua_toi(uuid)', 'execute')
          and has_function_privilege('authenticated', 'public.duyet_de_xuat_gan(uuid)', 'execute')
          and has_function_privilege('authenticated', 'public.tu_choi_de_xuat_gan(uuid, text)', 'execute')
         then 'ĐẠT' else 'HỎNG — màn hình sẽ báo lỗi quyền' end
  union all
  select 13, 'ten_day_du() có sẵn (hai hàm ở đây gọi nó)',
    case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                       where n.nspname = 'public' and p.proname = 'ten_day_du')
         then 'ĐẠT' else 'HỎNG — dán 15-tim-kiem.sql trước' end
) t order by stt;
