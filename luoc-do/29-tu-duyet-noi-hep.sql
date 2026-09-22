-- ============================================================
-- giapha-supabase · luoc-do/29-tu-duyet-noi-hep.sql
-- Vai trò  : b124c — NỚI HẸP luật tự duyệt đơn gắn mã người.
--            Người nộp đơn cho CHÍNH MÌNH tự duyệt được KHI VÀ CHỈ KHI họ đã
--            là chủ cây, hoặc `quan_tri` của chính cây ấy. Mọi trường hợp
--            khác — gồm Quản trị hệ thống ở cây họ CHƯA CÓ VAI — vẫn cần chữ
--            ký thứ hai.
-- Nguồn    : THIET-KE-NHIEU-CAY.md mục 11.10 (chủ dự án chốt 21/09/2026)
-- Dán sau  : 13 · 18 · 21 · 27 — file này giữ bản ĐỨNG CUỐI của
--            `duyet_de_xuat_gan()` và `gan_nguoi_cho_thanh_vien()`
-- Phiên bản: 0.1.0 · Cập nhật: 23/09/2026
-- ============================================================
--
-- ⚠⚠ ĐÂY LÀ NỚI MỘT LUẬT ĐÃ CHỐT HAI LẦN. Đọc mục 11.10 trước khi sửa tiếp.
--    Luật gốc: *không ai đặt quyền cho chính mình*. Chỗ nới được đúng ở đây vì
--    ở cây mình đã là chủ/`quan_tri`, người ấy vốn sửa được toàn cây — tự duyệt
--    KHÔNG mở thêm quyền nào. Ở cây chưa có vai thì gắn mã chính là lúc
--    `pham_vi_sua()` mở ra một nhánh mới, nên ở đó luật cũ giữ nguyên.
--
-- ⚠⚠ CỜ QTHT KHÔNG PHẢI ĐIỀU KIỆN. Điều kiện là VAI TRONG CHÍNH CÂY ẤY. Hai
--    câu đọc gần giống nhau, nghĩa khác hẳn: viết nhầm là bỏ chữ ký thứ hai ở
--    MỌI cây mà không ai thấy.
--
-- ⚠⚠ VÌ THẾ KHÔNG ĐƯỢC DÙNG `vai_tro()` Ở ĐÂY. `vai_tro()` (`11` mục 10) trả
--    'quan_tri_he_thong' ở NHÁNH ĐẦU TIÊN, che mất vai thật trong cây: hỏi nó
--    thì một QTHT không có chân trong cây vẫn "là quản trị cây ấy". Hàm dưới
--    đọc thẳng `trees.chu_so_huu` và `tree_members`.
--
-- ⚠ `tu_choi_de_xuat_gan()` KHÔNG nới — tự từ chối đơn của mình vẫn bị chặn,
--   vì đường tự lấy đơn về đã có rồi (`rut_de_xuat_gan()`), và hai đường cùng
--   làm một việc là hai chỗ để lệch nhau (`21` mục 7).
--
-- ⚠ ĐIỀU FILE NÀY KHÔNG LÀM ĐƯỢC, nói thẳng: nhánh `quan_tri` hôm nay CHƯA
--   VỚI TỚI ĐƯỢC. Cả hai hàm vẫn mở đầu bằng `co_the_quan_tri()`, mà hàm ấy
--   (`13` mục 4) chỉ nhận **Quản trị hệ thống hoặc chủ cây** — vai `quan_tri`
--   của cây không qua nổi cửa ấy, nên không bao giờ chạy tới mệnh đề mới. Giữ
--   nhánh ấy là giữ đúng câu chủ dự án chốt, và giữ sẵn cho ngày
--   `co_the_quan_tri()` được nới; **đừng viết vào báo cáo rằng nó đã đo**.
--   Muốn quản trị gia phả xét được đơn gắn mã là một việc KHÁC, chưa chốt.
--
-- ⚠ Hai hàm dưới TRÍCH NGUYÊN VĂN từ `21` và `27` bằng script, mỗi hàm thay
--   đúng một mệnh đề (`so-tay/luu-du-lieu.md`: đừng chép tay). Dán lại `21`
--   hay `27` sau file này là mất cả hai chỗ nới, **im lặng** — dán lại thì
--   dán tiếp file này.

-- ============================================================
-- 1. HÀM HỎI NHỎ — la_quan_tri_cay(p_tree, p_user)
-- ============================================================
-- Hỏi VAI THẬT của `p_user` trong CHÍNH cây ấy, không hỏi cờ hệ thống, không
-- hỏi người đang gọi. Viết dạng KHẲNG ĐỊNH và bọc `coalesce(…, false)`: không
-- có dòng thì `select` trả `null`, và `null` trong `and`/`or` cho ra `null`
-- chứ không cho ra `false` — đúng cái bẫy đã mở lỗ leo quyền 04/09 (b94).

create or replace function public.la_quan_tri_cay(p_tree uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
      (select t.chu_so_huu = p_user from public.trees t where t.id = p_tree),
      false)
      or coalesce(
      (select true from public.tree_members tm
        where tm.tree_id = p_tree
          and tm.user_id = p_user
          and tm.role = 'quan_tri'
          and tm.approved = true),
      false);
$$;

-- ============================================================
-- 2. duyet_de_xuat_gan() — CỬA THỨ TÁM, nay có ngoại lệ hẹp
-- ============================================================
-- Trích nguyên văn `21` mục 6. Đổi đúng một mệnh đề: thêm
-- `and not la_quan_tri_cay(...)` vào phép chặn `la_chinh_minh`.

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
  if public.la_chinh_minh(v_don.user_id)
     and not public.la_quan_tri_cay(v_don.tree_id, v_don.user_id) then
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
-- 3. gan_nguoi_cho_thanh_vien() — LỚP THỨ HAI, phải nới CÙNG LÚC
-- ============================================================
-- Trích nguyên văn `27`. `duyet_de_xuat_gan()` cố ý đi qua hàm này (`21` mục
-- 6), nên nới một mình cửa thứ tám thì tự duyệt vẫn rơi ở đây — hỏng nửa vời,
-- và câu từ chối nói về "tự gắn mã cho chính mình" chứ không nói về lá đơn.

create or replace function public.gan_nguoi_cho_thanh_vien(p_tree uuid, p_user uuid, p_person text default null::text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ma text;
  n    integer;
begin
  if not public.co_the_quan_tri(p_tree) then
    return jsonb_build_object('ok', false, 'loi',
      'Chỉ chủ gia phả mới gắn được mã người cho tài khoản.');
  end if;

  if public.la_chinh_minh(p_user)
     and not public.la_quan_tri_cay(p_tree, p_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Không ai tự gắn mã người cho chính mình được — gắn vào một cụ tổ là tự '
      || 'mở quyền sửa ra cả gia phả. Nhờ một quản trị khác làm việc này.');
  end if;

  -- ⚠ b110c: chưa nhận lời mời thì chưa gắn.
  if public.la_loi_moi_cho_nhan(p_tree, p_user) then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này mới được MỜI, chưa bấm Nhận. Gắn mã người sau khi họ vào '
      || 'cây — hoặc rút lời mời rồi mời lại kèm mã người ngay từ đầu.');
  end if;

  v_ma := nullif(btrim(coalesce(p_person, '')), '');

  if v_ma is not null then
    select count(*) into n
      from public.tree_persons tp join public.persons p on p.id = tp.person_id
     where tp.tree_id = p_tree and tp.person_id = v_ma
       and not coalesce(p.deleted, false);
    if n <> 1 then
      return jsonb_build_object('ok', false, 'loi',
        'Không có người mang mã ' || v_ma || ' trong gia phả này.');
    end if;
  end if;

  update public.tree_members
     set person_id = v_ma
   where tree_id = p_tree and user_id = p_user;

  if not found then
    return jsonb_build_object('ok', false, 'loi',
      'Tài khoản này chưa có tên trong gia phả.');
  end if;

  return jsonb_build_object('ok', true, 'maNguoi', v_ma);

exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'loi',
      'Mã ' || v_ma || ' đã gắn cho một tài khoản khác rồi. Gỡ bên đó trước.');
end;
$$;

-- ============================================================
-- 4. QUYỀN GỌI
-- ============================================================
-- `create or replace` giữ nguyên `grant` cũ của hai hàm mục 2–3 (chỉ `drop`
-- mới xoá). Hàm mới ở mục 1 thì mang mặc định Postgres *ai cũng gọi được, kể
-- cả `anon`* — `revoke` trước, `grant` sau, đúng nếp `07` mục 8.

revoke all  on function public.la_quan_tri_cay(uuid, uuid) from public, anon;
grant execute on function public.la_quan_tri_cay(uuid, uuid) to authenticated;

-- Dựng lại cho chắc — nếu một lần dán lại `21`/`27` đã `drop` chúng.
revoke all  on function public.duyet_de_xuat_gan(uuid)                     from public, anon;
grant execute on function public.duyet_de_xuat_gan(uuid)                     to authenticated;
revoke all  on function public.gan_nguoi_cho_thanh_vien(uuid, uuid, text)  from public, anon;
grant execute on function public.gan_nguoi_cho_thanh_vien(uuid, uuid, text)  to authenticated;

-- ============================================================
-- 5. TỰ KIỂM — hỏi HÌNH DẠNG. Hành vi thì bàn thử hỏi (do-b124c.mjs)
-- ============================================================
-- ⚠ Bảng này hỏi "mã có đúng hình không", KHÔNG hỏi "hàng rào có gác không".
--   Một bảng 8/8 ĐẠT vẫn che được một hàm thủng — bài học `14` mục 7.

select 'PHÉP 1 · la_quan_tri_cay() tồn tại: ' ||
  case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'la_quan_tri_cay')
       then 'ĐẠT' else 'HỎNG' end as tu_kiem
union all
select 'PHÉP 2 · nó KHÔNG hỏi vai_tro() (bẫy cờ QTHT): ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'la_quan_tri_cay')
            not ilike '%vai_tro%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 3 · nó đọc chu_so_huu VÀ tree_members: ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'la_quan_tri_cay')
            ilike '%chu_so_huu%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'la_quan_tri_cay')
            ilike '%tree_members%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 4 · nó đòi approved = true: ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'la_quan_tri_cay')
            ilike '%approved%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 5 · duyet_de_xuat_gan() giữ la_chinh_minh VÀ thêm la_quan_tri_cay: ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'duyet_de_xuat_gan')
            ilike '%la_chinh_minh%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'duyet_de_xuat_gan')
            ilike '%la_quan_tri_cay%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 6 · gan_nguoi_cho_thanh_vien() cũng vậy: ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'gan_nguoi_cho_thanh_vien')
            ilike '%la_chinh_minh%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'gan_nguoi_cho_thanh_vien')
            ilike '%la_quan_tri_cay%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 7 · tu_choi_de_xuat_gan() KHÔNG nới theo: ' ||
  case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'tu_choi_de_xuat_gan')
            not ilike '%la_quan_tri_cay%'
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 8 · anon KHÔNG gọi được ba hàm: ' ||
  case when not has_function_privilege('anon', 'public.la_quan_tri_cay(uuid, uuid)', 'execute')
        and not has_function_privilege('anon', 'public.duyet_de_xuat_gan(uuid)', 'execute')
        and not has_function_privilege('anon', 'public.gan_nguoi_cho_thanh_vien(uuid, uuid, text)', 'execute')
       then 'ĐẠT' else 'HỎNG' end
union all
select 'PHÉP 9 · authenticated GỌI ĐƯỢC ba hàm: ' ||
  case when has_function_privilege('authenticated', 'public.la_quan_tri_cay(uuid, uuid)', 'execute')
        and has_function_privilege('authenticated', 'public.duyet_de_xuat_gan(uuid)', 'execute')
        and has_function_privilege('authenticated', 'public.gan_nguoi_cho_thanh_vien(uuid, uuid, text)', 'execute')
       then 'ĐẠT' else 'HỎNG' end;
