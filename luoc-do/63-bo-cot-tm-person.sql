-- ============================================================
-- giapha-supabase · luoc-do/63-bo-cot-tm-person.sql
-- Vai trò  : b162b — XOÁ cột `tree_members.person_id` (chết từ b126; gắn
--            tài khoản ↔ người nằm ở `tai_khoan.person_id`). Kéo theo tự động:
--            chỉ mục `tree_members_person_uniq` (`06`) · khoá ngoại
--            `tree_members_person_fk`. Không khung nhìn, không luật RLS nào
--            đọc cột này (đo bàn thử 30/09).
-- Cần có   : `62` — không hàm nào còn đọc/ghi cột. Thiếu thì file DỪNG.
-- ⚠ Bản sao lưu chụp TRƯỚC file này (còn khoá `person_id`) KHÔNG khôi phục
--   được — bước so từng dòng thấy lệch và huỷ. Cố ý: chủ dự án bỏ hết bản
--   sao lưu cũ (30/09/2026, app chưa chạy chính thức). Sao lưu đọc
--   `select=*`, nên bản đêm sau tự theo khuôn mới.
-- ⚠ Sau file này, dán lại `06`/`15`/`27` sẽ báo lỗi TO TIẾNG (cột không còn);
--   dán lại `14`/`18`/`28`/`29`/`32`/`48`/`52` thì im lặng dựng lại hàm
--   ghi cột chết, hỏng lúc chạy — phải dán lại `62` ngay sau.
-- Đo      : ../kiem-thu/ban-thu-sql/do-b162b.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 30/09/2026 (b162b)
-- ============================================================

begin;

do $$
declare
  v_ham text;
begin
  if to_regprocedure('public.gan_nguoi_cho_thanh_vien(uuid, uuid, text)') is not null
     or (select prosrc from pg_proc
          where oid = 'public.tu_choi_thay_doi(uuid, bigint, text)'::regprocedure) not like '%b162a%' then
    raise exception 'DỪNG: chưa dán 62-thoi-doc-tm-person.sql.';
  end if;

  -- ⚠ Gán `:=`, KHÔNG `select … into`: SQL Editor của Supabase rà văn bản SAU
  --   khi chạy, gặp `select … into x` ngoài thân hàm thì tưởng tạo bảng `x`,
  --   đi hỏi RLS của nó → báo "relation … does not exist" dù file đã chạy xong.
  v_ham := (select string_agg(p.proname, ', ')
              from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public'
               and (p.prosrc ~* 'tm[.]person_id'
                    or p.prosrc ~* 'update public[.]tree_members[[:space:]][^;]*person_id'
                    or p.prosrc ~* 'insert into public[.]tree_members[^;]*person_id'));
  if v_ham is not null then
    raise exception 'DỪNG: còn hàm đụng tree_members.person_id: % — dán lại 62.', v_ham;
  end if;
end $$;

alter table public.tree_members drop column if exists person_id;

-- ------------------------------------------------------------
-- Tự kiểm
-- ------------------------------------------------------------
select 'cột tree_members.person_id đã bỏ' as phep,
  case when not exists (select 1 from information_schema.columns
                         where table_schema = 'public' and table_name = 'tree_members'
                           and column_name = 'person_id')
  then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 'chỉ mục + khoá ngoại theo cột đã rơi',
  case when to_regclass('public.tree_members_person_uniq') is null
        and not exists (select 1 from pg_constraint where conname = 'tree_members_person_fk')
  then 'ĐẠT' else 'HỎNG' end;

commit;
