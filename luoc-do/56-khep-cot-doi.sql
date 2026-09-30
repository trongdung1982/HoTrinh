-- ============================================================
-- giapha-supabase · luoc-do/56-khep-cot-doi.sql
-- Vai trò  : Khép khe cuối của `53`: vai `xem` đọc thẳng `tree_persons.doi`
--            qua REST, nên Đời của người đã TẮT nhóm Đời vẫn lộ (b158).
-- Cần có   : `53` (bản đứng cuối của `doc_cay()`).
-- Cách khép: KHÔNG giấu cả dòng `tree_persons` (đụng mọi chỗ hỏi "người này ở
--            cây nào"). Chỉ thu quyền ĐỌC RIÊNG CỘT `doi` của `authenticated`
--            — hai cột `tree_id` · `person_id` đọc như cũ. Đời từ nay chỉ đi
--            qua hàm `security definer` đã che: `doc_cay().doi` · hàm mới
--            `doc_doi_cay()` dưới đây · `doc_ho_so_nguoi().cay`.
-- ⚠ `doc_doi_cay()` = đúng phần `doi` của `doc_cay()` — gọi thẳng nó, không
--   chép lại luật che, để hai đường không bao giờ lệch nhau. Đắt hơn một câu
--   đọc thẳng (dựng cả gói rồi bỏ), đo trên cây 681 người: xem `do-b158.mjs`.
-- ⚠ Cột mới thêm vào `tree_persons` sau này: `authenticated` KHÔNG tự đọc
--   được (quyền theo cột). Muốn đọc thì thêm vào câu `grant select (…)` dưới.
-- ⚠⚠ Máy sao lưu cũng là `authenticated`: file này làm REST `select=*` của
--   nó bị từ chối → sao lưu đêm HỎNG từ lúc dán (b166b). Vá: `66` +
--   `SaoLuu.gs` 0.12.0 đọc qua hàm `sao_luu_tree_persons()`.
-- ⚠ Hàm/view `security invoker` nào đọc `tree_persons.doi` sẽ báo
--   `permission denied` — lúc viết file này không có cái nào (mục 3 tự kiểm).
-- JS      : `sb.js` `docDoi()` gọi `doc_doi_cay`, còn đường đọc thẳng khi máy
--           chủ chưa có hàm. Mã JS đẩy TRƯỚC, dán file này SAU — cả hai thứ
--           tự đều không vỡ app.
-- Đo      : ../kiem-thu/ban-thu-sql/do-b158.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 29/09/2026 (b158)
-- ============================================================

begin;

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'an_bot_rieng') then
    raise exception 'DỪNG: chưa dán 53-cong-khai-vai-xem.sql (thiếu an_bot_rieng).';
  end if;
end $$;

-- ------------------------------------------------------------
-- 1. doc_doi_cay() — Đời của một cây, cùng luật che với doc_cay()
-- ------------------------------------------------------------
-- Không xem được cây → `null` (doc_cay trả ok=false, không có khoá `doi`).
create or replace function public.doc_doi_cay(p_tree uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case when (d->>'ok')::boolean then d->'doi' else null end
    from (select public.doc_cay(p_tree) as d) x;
$$;

revoke all on function public.doc_doi_cay(uuid) from public, anon;
grant execute on function public.doc_doi_cay(uuid) to authenticated;

-- ------------------------------------------------------------
-- 2. Quyền theo cột trên tree_persons
-- ------------------------------------------------------------
-- Luật hàng (`doc_tree_persons`, bản `52`) giữ nguyên — nó chọn DÒNG; quyền
-- cột chọn CỘT. Hai lớp độc lập nhau.
revoke select on public.tree_persons from authenticated;
grant select (tree_id, person_id) on public.tree_persons to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — bảng cuối phải ra ĐẠT ở cả bốn dòng
-- ============================================================
select 1 as stt, 'authenticated KHÔNG đọc được cột doi' as ten_kiem,
  case when not has_column_privilege('authenticated', 'public.tree_persons', 'doi', 'select')
        and not has_table_privilege('authenticated', 'public.tree_persons', 'select')
       then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'authenticated VẪN đọc được tree_id · person_id',
  case when has_column_privilege('authenticated', 'public.tree_persons', 'tree_id', 'select')
        and has_column_privilege('authenticated', 'public.tree_persons', 'person_id', 'select')
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'không hàm security invoker nào đọc tree_persons.doi',
  case when not exists (
         select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and not p.prosecdef
            and p.prosrc ilike '%tree_persons%' and p.prosrc ~* '\mdoi\M')
       then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'doc_doi_cay: authenticated gọi được, anon không',
  case when has_function_privilege('authenticated', 'public.doc_doi_cay(uuid)', 'execute')
        and not has_function_privilege('anon', 'public.doc_doi_cay(uuid)', 'execute')
       then 'ĐẠT' else 'HỎNG' end
order by stt;
