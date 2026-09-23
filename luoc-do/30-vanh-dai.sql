-- ============================================================
-- giapha-supabase · luoc-do/30-vanh-dai.sql
-- Vai trò  : b127a — `doc_cay()` trả thêm mảng `vanh_dai` (người NGOÀI cây có
--            dây nối thẳng vào người trong cây) và THÔI bỏ cạnh con có một
--            đầu ngoài cây.
-- Chạy ở   : Supabase → SQL Editor. Dán sau `27`. Chỉ đổi MỘT hàm, không
--            đụng bảng nào; dán lại bao nhiêu lần cũng được.
--            ⚠ Bản ĐỨNG CUỐI của `doc_cay()` — dán lại `27` sau file này là
--            kéo nó về bản cắt cạnh con.
-- Thiết kế : THIET-KE-NHIEU-CAY.md mục 6, *HAI HÀNG RÀO*
-- Sổ tay   : so-tay/nguoi-xuyen-cay.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b127a.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 23/09/2026
-- ============================================================
--
-- Thân hàm CHÉP NGUYÊN prototype `doc_cay_thu()` (`../kiem-thu/ban-thu-sql/
-- thu-vanh-dai.sql`, đo 11/11 ở bước 0), giữ nguyên ba thứ của `27`: cổng
-- `co_the_xem_cay()` · `security definer` · khoá `media`.
--
-- ⚠ `vanh_dai` KHÔNG vẽ, không có thẻ riêng — chỉ để thẻ người trong cây điền
--   dòng "vợ: …", "con: …". App trước b127b chưa đọc mảng này; cạnh con trỏ
--   tới người vắng mặt thì `domains/` và `person-detail.js` đã tự lọc bỏ.
-- ⚠ `vanh_dai` mang CẢ bản ghi người (mọi cột), như `persons`. Người xem cây
--   B vì thế đọc được bản ghi vợ/con ông X dù họ chỉ nằm ở cây A.

create or replace function public.doc_cay(p_tree uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_nguoi text[];
  v_hn    text[];
  v_bien  text[];
begin
  if p_tree is null or not public.co_the_xem_cay(p_tree) then
    return jsonb_build_object('ok', false,
      'loi', 'Không đọc được gia phả này. Có thể bạn đã bị gỡ khỏi danh sách người được xem.');
  end if;

  v_nguoi := array(select person_id from public.tree_persons where tree_id = p_tree);
  v_hn    := array(select public.ds_hon_nhan_cua_cay(p_tree));

  -- Vành đai: ai xuất hiện trong một hôn nhân/cạnh con ĐÃ chọn (v_hn) mà
  -- KHÔNG thuộc cây — đúng nghĩa "dây nối thẳng vào người trong cây".
  v_bien := array(
    select distinct x from (
      select unnest(partners) as x from public.unions where id = any(v_hn)
      union
      select person_id as x from public.union_children where union_id = any(v_hn)
    ) t
    where x <> all(v_nguoi)
  );

  return jsonb_build_object('ok', true,
    'persons', (select coalesce(jsonb_agg(to_jsonb(p.*) order by p.id), '[]'::jsonb)
                  from public.persons p where p.id = any(v_nguoi)),
    'vanh_dai', (select coalesce(jsonb_agg(to_jsonb(p.*) order by p.id), '[]'::jsonb)
                  from public.persons p where p.id = any(v_bien)),
    'unions', (select coalesce(jsonb_agg(to_jsonb(u.*) order by u.id), '[]'::jsonb)
                 from public.unions u where u.id = any(v_hn)),
    -- ⚠ Khác `27`: KHÔNG lọc `c.person_id = any(v_nguoi)` — cạnh con đi theo
    --   union đã chọn, không bị bỏ vì đầu kia ở vành đai.
    'children', (select coalesce(jsonb_agg(to_jsonb(c.*) order by c.union_id, c.ord), '[]'::jsonb)
                   from public.union_children c
                  where c.union_id = any(v_hn)),
    'media', (select coalesce(jsonb_agg(to_jsonb(m.*) order by m.id), '[]'::jsonb)
                from public.media m
               where m.subject_id = any(v_nguoi) or m.subject_id = any(v_hn)));
end;
$$;

revoke all on function public.doc_cay(uuid) from public, anon;
grant execute on function public.doc_cay(uuid) to authenticated;
