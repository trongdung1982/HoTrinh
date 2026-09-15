-- ============================================================
-- giapha-supabase · luoc-do/22-rut-don-roi-cay.sql
-- Vai trò  : Hai việc CHÍNH NGƯỜI TRONG CUỘC tự làm cho chính mình — rút đơn
--            xin vào một gia phả, và rời khỏi một gia phả đã là thành viên.
--            Nhóm C của b116 (`THIET-KE-QUAN-TRI.md` 9.5): không đụng vai,
--            không đụng nền móng quyền.
-- Phiên bản: 0.1.0 · Cập nhật: 15/09/2026 (b116)
-- ============================================================
--
-- ═══ VÌ SAO HAI HÀM NÀY KHÔNG CÓ SẴN ═══
--
-- Hai việc tưởng như đối xứng với hai việc đã có, nhưng cả hai đối xứng đều
-- SAI khi kiểm lại (`THIET-KE-QUAN-TRI.md` 9.3):
--
--   · `tu_choi_loi_moi()` (`14` mục 5) chỉ xoá dòng có `moi_luc is not null`
--     — tức LỜI MỜI. Một ĐƠN XIN VÀO (`moi_luc is null`) không hàm nào xoá
--     được của chính người đã nộp.
--   · `go_thanh_vien()` (`13` mục ở trên) **cố ý** từ chối khi
--     `la_chinh_minh(p_user)` — nó là hàm của NGƯỜI QUẢN TRỊ gỡ MỘT NGƯỜI
--     KHÁC, không phải hàm tự rời. Đối xứng giả: tên nghe giống nhưng luật
--     ngược hẳn nhau.
--
-- Nên đây là hai hàm MỚI, không phải sửa hàm cũ.
--
-- ═══ `rut_don_xin_vao` — không cần gác gì thêm ═══
--
-- Xoá dòng CHÍNH MÌNH, đúng điều kiện `approved = false and moi_luc is null`
-- — tức chỉ xoá ĐƠN XIN VÀO, không đụng lời mời (đã có `tu_choi_loi_moi`) và
-- không đụng chân đã duyệt (`roi_cay` lo việc đó). `auth.uid()` tự giới hạn
-- phạm vi, không cần hỏi `co_the_quan_tri` — đơn của ai thì người ấy rút,
-- không cần quyền quản trị gì cả.
--
-- ═══ `roi_cay` — MỘT hàng rào, và chỉ một: không cho chủ cây tự rời ═══
--
-- Chủ dự án chốt trong bàn giao trước b116: hàm mới phải chặn chủ cây. Lý do
-- không cần đoán — `trees.chu_so_huu` không rỗng được kiểu "không có ai",
-- khác `tree_members` (một dòng xoá đi là hết dòng). Chủ cây muốn rời thì
-- phải **Bàn giao gia phả** trước (`doi_chu_cay`, mục *Vòng đời* của trang
-- chi tiết) — đó là đường đúng, `roi_cay` không đi tắt qua nó.
--
-- Quản trị gia phả (`quan_tri` được phong, không phải chủ) VẪN rời được —
-- không có luật nào cấm, và khoá họ lại là bắt một người muốn nghỉ phải nhờ
-- người khác gỡ hộ mình.

begin;

-- ============================================================
-- 1. rut_don_xin_vao(p_tree)
-- ============================================================

create or replace function public.rut_don_xin_vao(p_tree uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare v_so int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'loi', 'Chưa đăng nhập.');
  end if;

  delete from public.tree_members
   where tree_id = p_tree
     and user_id = auth.uid()
     and approved = false
     and moi_luc is null;
  get diagnostics v_so = row_count;

  if v_so = 0 then
    return jsonb_build_object('ok', false, 'loi',
      'Không có đơn xin vào nào của bạn ở gia phả này. Nếu đây là lời mời thì ' ||
      'dùng nút Từ chối, không phải Rút đơn.');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- 2. roi_cay(p_tree)
-- ============================================================

create or replace function public.roi_cay(p_tree uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_vai text;
  v_so  int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'loi', 'Chưa đăng nhập.');
  end if;

  if public.la_chu_cay(p_tree, auth.uid()) then
    return jsonb_build_object('ok', false, 'loi',
      'Bạn là chủ gia phả này — không tự rời được. Bàn giao gia phả cho người ' ||
      'khác trước, rồi rời sau.');
  end if;

  select role into v_vai from public.tree_members
   where tree_id = p_tree and user_id = auth.uid() and approved = true;

  if v_vai is null then
    return jsonb_build_object('ok', false, 'loi',
      'Bạn chưa là thành viên đã duyệt của gia phả này.');
  end if;

  if v_vai = 'sao_luu' then
    return jsonb_build_object('ok', false, 'loi',
      'Đây là tài khoản sao lưu tự động — rời khỏi đây là bản sao lưu đêm ra ' ||
      'file rỗng.');
  end if;

  delete from public.tree_members
   where tree_id = p_tree and user_id = auth.uid() and approved = true;
  get diagnostics v_so = row_count;

  if v_so = 0 then
    return jsonb_build_object('ok', false, 'loi', 'Không rời được — thử lại.');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- 3. QUYỀN GỌI
-- ============================================================

revoke all on function public.rut_don_xin_vao(uuid) from public, anon;
revoke all on function public.roi_cay(uuid)         from public, anon;

grant execute on function public.rut_don_xin_vao(uuid) to authenticated;
grant execute on function public.roi_cay(uuid)         to authenticated;

commit;

-- ============================================================
-- 4. BẢNG TỰ KIỂM — đọc sau khi dán, không thay phép đo thật
-- ============================================================
-- ⚠ Bảng này chỉ hỏi "thứ này có tồn tại không". Phép đo thật là chạy trên
--   bàn thử tại chỗ (cổng 5433) bằng danh nghĩa mượn của một tài khoản không
--   phải chủ cây — CHI-DAN.md hàng "Bàn thử SQL tại chỗ".

select ten_kiem as "Kiểm", ket_qua as "Kết quả"
from (
  select 1 as stt, 'Hai hàm mới đã có' as ten_kiem,
    case when (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                where n.nspname='public' and p.proname in ('rut_don_xin_vao','roi_cay')) = 2
         then 'ĐẠT' else 'HỎNG — thiếu hàm' end as ket_qua
  union all
  select 2, 'anon KHÔNG gọi được rut_don_xin_vao',
    case when not has_function_privilege('anon', 'public.rut_don_xin_vao(uuid)', 'execute')
         then 'ĐẠT' else 'HỎNG — anon gọi được' end
  union all
  select 3, 'anon KHÔNG gọi được roi_cay',
    case when not has_function_privilege('anon', 'public.roi_cay(uuid)', 'execute')
         then 'ĐẠT' else 'HỎNG — anon gọi được' end
) t order by stt;
