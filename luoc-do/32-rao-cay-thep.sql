-- ============================================================
-- giapha-supabase · luoc-do/32-rao-cay-thep.sql
-- Vai trò  : b128a — HÀNG RÀO CÂY LÀ RÀO THÉP ở đường GHI. `luu_cay()` thôi
--            tự kéo vào cây những người chỉ tình cờ có tên trong một quan hệ
--            ĐÃ CÓ được gửi lại; và từ chối sửa quan hệ có một đầu ngoài cây.
-- Chạy ở   : Supabase → SQL Editor. Dán SAU `31`. Chỉ đổi MỘT hàm.
--            ⚠ Bản ĐỨNG CUỐI của `luu_cay()` — dán lại `27`/`28` sau file này
--            là mở lại lỗ, im lặng.
-- Thiết kế : THIET-KE-NHIEU-CAY.md mục 6, *HAI HÀNG RÀO* · Sổ tay: so-tay/nguoi-xuyen-cay.md
-- Đo       : ../kiem-thu/ban-thu-sql/do-b128a.mjs
-- Phiên bản: 0.1.0 · Cập nhật: 24/09/2026
-- ============================================================
--
-- ═══ LỖ ĐÃ THẤY (ảnh `loi_2_cay_1.png`, 24/09/2026) ═══
--
-- Từ `30`, `doc_cay()` gửi về cả quan hệ có một đầu ngoài cây — CHỈ để thẻ
-- điền tên. Nhưng bản sao ấy cũng là thứ app sửa rồi gửi lên. `v_keo_vao` của
-- `28` coi MỌI người có tên trong quan hệ gửi lên là "được kéo vào": sắp lại
-- thứ tự con ở cây 1 → cạnh con của *H9* (ngoài cây 1) đi lên → *H9* bị ghi
-- vào cây 1 và hiện trên sơ đồ, mẹ *Hai b* thì không.
--
-- ═══ LUẬT MỚI — hai dòng ═══
--
--   ① Kéo vào CHỈ theo quan hệ MỚI KHAI trong lần lưu này (cặp mới, vợ/chồng
--      mới thêm vào cặp, cạnh con mới) — hoặc bản ghi người gửi kèm (b124a).
--      Thêm người B = chỉ B vào cây; cha mẹ, vợ, con của B vẫn ở ngoài.
--   ② Quan hệ có một đầu ngoài cây (không phải người vừa kéo) thì KHÔNG sửa,
--      không xoá, không thêm con từ cây này — `ngoairao`. Sửa những quan hệ
--      ấy sẽ đi đường *đề nghị chỉnh sửa* → QTHT duyệt (b127d).
--
-- ⚠ Chép nguyên `28`, chỉ khác các chỗ đánh dấu `b128a`.

begin;

create or replace function public.luu_cay(p_tree_id uuid, p_revision integer, p_ops jsonb, p_mo_ta jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email      text := coalesce(auth.jwt() ->> 'email', '');
  v_rev_thuc   integer;
  v_rev_moi    integer;
  v_persons    jsonb;
  v_unions     jsonb;
  v_children   jsonb;
  v_media      jsonb;
  v_sources    jsonb;
  v_ngoai      text;
  v_pham_vi    text[];      -- null = KHÔNG giới hạn (hai hạng quản trị).
  v_cay_nguoi  text[];      -- người thuộc cây này, TRƯỚC lần lưu
  v_cay_hn     text[];      -- hôn nhân thuộc cây này, TRƯỚC lần lưu
  v_moi_nguoi  text[];      -- mã người gửi lên mà chưa bản ghi nào giữ
  v_keo_vao    text[] := '{}';  -- b124a: người ĐÃ CÓ ở cây khác, lần lưu
                                --        này kéo vào cây này
  v_xoa_p      text[];      -- người rút khỏi cây này
  v_xoa_that   text[];      -- …trong đó không cây nào khác giữ: xoá bản ghi
  v_tree       jsonb;
  v_truoc      jsonb;
  v_imports    jsonb;
  v_trang_thai text;
  v_hint       text;
begin
  -- ══ HÀNG RÀO 1 — có đăng nhập không ══
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'lyDo', 'chuadangnhap',
      'loi', 'Phiên đăng nhập đã hết hạn. Tải lại trang và đăng nhập lại.');
  end if;

  -- ══ HÀNG RÀO 2 — có quyền sửa cây này không ══
  if not public.co_the_sua(p_tree_id) then
    if public.vai_tro(p_tree_id) = 'sua' then
      return jsonb_build_object('ok', false, 'lyDo', 'chuaduyet',
        'loi', 'Tài khoản của bạn chưa được gắn với một người trong gia phả, '
            || 'hoặc quản trị viên chưa duyệt. Trong lúc chờ, bạn vẫn xem '
            || 'được toàn bộ gia phả.');
    end if;
    return jsonb_build_object('ok', false, 'lyDo', 'khongcoquyen',
      'loi', 'Bạn chỉ có quyền xem gia phả này, không sửa được.');
  end if;

  -- ══ HÀNG RÀO 3 — số của CÂY (khối chung, nguồn, sổ nhập) ══
  -- Số của TỪNG BẢN GHI người/hôn nhân/con/ảnh do trigger `26` gác.
  select revision into v_rev_thuc
    from public.trees where id = p_tree_id for update;

  if v_rev_thuc is null then
    return jsonb_build_object('ok', false, 'lyDo', 'khongthaycay',
      'loi', 'Không tìm thấy gia phả này.');
  end if;

  -- ⚠ `p_revision is null` kiểm RIÊNG: `5 <> null` ra `null`, `if` không chạy.
  if p_revision is null or v_rev_thuc <> p_revision then
    return jsonb_build_object('ok', false, 'lyDo', 'xungdot',
      'loi', 'Người khác vừa sửa gia phả trong lúc bạn đang mở. ' ||
             'Tải lại trang để lấy bản mới nhất rồi sửa lại.',
      'revision', v_rev_thuc);
  end if;

  -- Bốn bảng dùng chung KHÔNG gắn mã cây nữa; khoá `tree_id`/`noi_ve` trình
  -- duyệt cũ gửi kèm bị `jsonb_populate_recordset` bỏ qua. Nguồn vẫn theo cây.
  v_persons  := coalesce(p_ops->'persons'->'luu',  '[]'::jsonb);
  v_unions   := coalesce(p_ops->'unions'->'luu',   '[]'::jsonb);
  v_children := coalesce(p_ops->'children'->'luu', '[]'::jsonb);
  v_media    := coalesce(p_ops->'media'->'luu',    '[]'::jsonb);
  v_sources  := public.gan_ma_cay(p_ops->'sources'->'luu', p_tree_id);

  v_cay_nguoi := array(select tp.person_id from public.tree_persons tp
                        where tp.tree_id = p_tree_id);
  v_cay_hn    := array(select public.ds_hon_nhan_cua_cay(p_tree_id));
  v_moi_nguoi := array(select e->>'id' from jsonb_array_elements(v_persons) e
                        where not exists (select 1 from public.persons x
                                           where x.id = e->>'id'));
  v_xoa_p     := array(select jsonb_array_elements_text(
                          coalesce(p_ops->'persons'->'xoa', '[]'::jsonb)));
  v_xoa_that  := array(select p.id from public.persons p
                        where p.id = any(v_xoa_p)
                          and not exists (select 1 from public.tree_persons tp
                                           where tp.person_id = p.id
                                             and tp.tree_id <> p_tree_id));

  -- ══ b124a — NGƯỜI KÉO TỪ CÂY KHÁC VÀO ══
  -- Người đã có bản ghi, chưa thuộc cây này, lần lưu này nhắc tới. Chỉ nhận
  -- khi người gọi XEM ĐƯỢC ít nhất một cây đang chứa họ — không thì gõ mò
  -- `P0123` là kéo được người ở cây kín.
  -- ⚠ `array(...)` trả `'{}'`, KHÔNG trả null. Phải thế: `x = any(null)` ra
  --   `null`, `not null` cũng `null`, và cả hàng rào 3b im lặng cho qua hết.
  v_keo_vao := array(
    select distinct x.ma from (
      select e->>'id' as ma from jsonb_array_elements(v_persons) e
      union all
      -- b128a — chỉ vợ/chồng MỚI có mặt trong cặp (cặp mới, hoặc mới thêm).
      select v.ma
        from jsonb_populate_recordset(null::public.unions, v_unions) u,
             unnest(u.partners) as v(ma)
       where not exists (select 1 from public.unions u0
                          where u0.id = u.id and v.ma = any(u0.partners))
      union all
      -- b128a — chỉ cạnh con MỚI.
      select uc.person_id
        from jsonb_populate_recordset(null::public.union_children, v_children) uc
       where not exists (select 1 from public.union_children c0
                          where c0.union_id = uc.union_id
                            and c0.person_id = uc.person_id)
    ) x
     where nullif(x.ma, '') is not null
       and exists (select 1 from public.persons p where p.id = x.ma)
       and not (x.ma = any(v_cay_nguoi))
       and exists (select 1 from public.tree_persons tp
                    where tp.person_id = x.ma
                      and tp.tree_id in (select public.ds_cay_xem_duoc())));

  -- ══ b128a — RÀO THÉP: quan hệ có một đầu NGOÀI cây ══
  -- Cặp gửi lên (sửa · xoá mềm · xoá thật) hoặc cặp có cạnh con gửi lên
  -- (thêm · sửa · xoá): mọi vợ/chồng — cũ trong máy chủ lẫn mới gửi lên —
  -- phải thuộc cây, hoặc là người lần lưu này kéo vào. Cạnh con: cả người con.
  -- Đứng TRƯỚC 3b để câu báo nói đúng chuyện, không bảo "tải lại trang".
  select x.ma into v_ngoai from (
    select unnest(u0.partners) as ma
      from public.unions u0
     where u0.id in (select u.id from jsonb_populate_recordset(null::public.unions, v_unions) u
                     union all
                     select jsonb_array_elements_text(coalesce(p_ops->'unions'->'xoa', '[]'::jsonb))
                     union all
                     select uc.union_id from jsonb_populate_recordset(null::public.union_children, v_children) uc
                     union all
                     select x.union_id from jsonb_to_recordset(coalesce(p_ops->'children'->'xoa', '[]'::jsonb))
                            as x(union_id text, person_id text))
    union all
    select unnest(u.partners)
      from jsonb_populate_recordset(null::public.unions, v_unions) u
    union all
    select uc.person_id from jsonb_populate_recordset(null::public.union_children, v_children) uc
    union all
    select x.person_id from jsonb_to_recordset(coalesce(p_ops->'children'->'xoa', '[]'::jsonb))
           as x(union_id text, person_id text)
  ) x
   where nullif(x.ma, '') is not null
     and exists (select 1 from public.persons p where p.id = x.ma)
     and not (x.ma = any(v_cay_nguoi))
     and not (x.ma = any(v_keo_vao))
   limit 1;
  if v_ngoai is not null then
    return jsonb_build_object('ok', false, 'lyDo', 'ngoairao',
      'loi', 'Quan hệ này có ' || coalesce((select public.ten_day_du(p.names)
                                              from public.persons p where p.id = v_ngoai), '')
          || ' (' || v_ngoai || ') — người không thuộc gia phả này. Sửa, xoá '
          || 'hay thêm con cho quan hệ ấy không làm được từ gia phả này.');
  end if;

  -- ══ HÀNG RÀO 3b — bản ghi ĐANG CÓ phải thuộc cây này ══
  -- Dòng gửi `revision = 0` (tự nhận là mới) bỏ qua ở đây: mã ấy mà đã có
  -- người giữ thì trigger `26` từ chối bằng `trungma`, câu đúng hơn.
  select x.ma into v_ngoai from (
    select e->>'id' as ma from jsonb_array_elements(v_persons) e
     where coalesce(e->>'revision', '') <> '0'
    union all
    select unnest(v_xoa_p)
  ) x
   where exists (select 1 from public.persons p where p.id = x.ma)
     and not (x.ma = any(v_cay_nguoi))
     and not (x.ma = any(v_keo_vao))     -- b124a
   limit 1;
  if v_ngoai is null then
    select x.ma into v_ngoai from (
      select e->>'id' as ma from jsonb_array_elements(v_unions) e
       where coalesce(e->>'revision', '') <> '0'
      union all
      select jsonb_array_elements_text(coalesce(p_ops->'unions'->'xoa', '[]'::jsonb))
    ) x
     where exists (select 1 from public.unions u where u.id = x.ma)
       and not (x.ma = any(v_cay_hn))
     limit 1;
  end if;
  if v_ngoai is null then
    -- Vợ/chồng · con · chủ thể ảnh: người ĐANG CÓ mà ngoài cây thì không kéo vào.
    select x.ma into v_ngoai from (
      select unnest(u.partners) as ma
        from jsonb_populate_recordset(null::public.unions, v_unions) u
      union all
      select uc.person_id from jsonb_populate_recordset(null::public.union_children, v_children) uc
      union all
      select x.person_id from jsonb_to_recordset(coalesce(p_ops->'children'->'xoa', '[]'::jsonb))
             as x(union_id text, person_id text)
    ) x
     where exists (select 1 from public.persons p where p.id = x.ma)
       and not (x.ma = any(v_cay_nguoi))
       and not (x.ma = any(v_keo_vao))   -- b124a
     limit 1;
  end if;
  if v_ngoai is null then
    select x.ma into v_ngoai from (
      select uc.union_id as ma from jsonb_populate_recordset(null::public.union_children, v_children) uc
      union all
      select x.union_id from jsonb_to_recordset(coalesce(p_ops->'children'->'xoa', '[]'::jsonb))
             as x(union_id text, person_id text)
    ) x
     where exists (select 1 from public.unions u where u.id = x.ma)
       and not (x.ma = any(v_cay_hn))
       and x.ma not in (select u.id from jsonb_populate_recordset(null::public.unions, v_unions) u)
     limit 1;
  end if;
  if v_ngoai is null then
    select x.ma into v_ngoai from (
      select m.subject_id as ma from public.media m
       where m.id in (select e->>'id' from jsonb_array_elements(v_media) e
                       where coalesce(e->>'revision', '') <> '0'
                      union all
                      select jsonb_array_elements_text(coalesce(p_ops->'media'->'xoa', '[]'::jsonb)))
      union all
      select m.subject_id from jsonb_populate_recordset(null::public.media, v_media) m
    ) x
     where nullif(x.ma, '') is not null
       and (exists (select 1 from public.persons p where p.id = x.ma)
            or exists (select 1 from public.unions u where u.id = x.ma))
       and not (x.ma = any(v_cay_nguoi) or x.ma = any(v_cay_hn))
       and not (x.ma = any(v_keo_vao))   -- b124a
     limit 1;
  end if;
  if v_ngoai is not null then
    return jsonb_build_object('ok', false, 'lyDo', 'ngoaicay',
      'loi', 'Bản ghi ' || v_ngoai || ' không thuộc gia phả này nên không sửa '
          || 'được từ đây. Tải lại trang rồi thử lại.');
  end if;

  -- ══ HÀNG RÀO 4 — giới hạn theo TRỰC HỆ ══
  -- Luật: `06-quyen-truc-he.sql` mục 1. Phạm vi tính MỘT lần, trên dữ liệu
  -- CŨ — tính trên dữ liệu mới thì cạnh vừa khai tự cấp quyền cho chính nó.
  if public.vai_tro(p_tree_id) in ('quan_tri_he_thong', 'quan_tri') then
    v_pham_vi := null;
  else
    v_pham_vi := array(
      select pv.person_id
        from public.pham_vi_sua(p_tree_id, public.nguoi_gan(p_tree_id)) pv);
  end if;

  -- ⚠ b124a — NỚI 3b MÀ QUÊN CHỖ NÀY LÀ HỎNG NỬA VỜI, IM LẶNG. Phạm vi trực
  --   hệ tính trong những người ĐÃ thuộc cây, nên người vừa kéo vào luôn nằm
  --   ngoài nó: 4a chặn chính họ, 4c chặn hôn nhân vừa khai, và người dùng
  --   đọc được câu "ngoài trực hệ" chẳng dính gì tới việc họ vừa làm.
  --   Họ vào được là nhờ quan hệ gắn với người TRONG phạm vi — bốn phép 4c
  --   dưới vẫn gác nguyên vẹn phía bên kia của quan hệ ấy.
  if v_pham_vi is not null and array_length(v_keo_vao, 1) is not null then
    v_pham_vi := v_pham_vi || v_keo_vao;
  end if;

  if v_pham_vi is not null then
    -- 4a. Người gửi lên, đã có.
    select p.id into v_ngoai
      from jsonb_populate_recordset(null::public.persons, v_persons) p
     where not (p.id = any(v_pham_vi))
       and exists (select 1 from public.persons cu where cu.id = p.id)
     limit 1;
    if v_ngoai is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'ngoaiphamvi',
        'loi', 'Người ' || v_ngoai || ' không thuộc trực hệ của bạn nên bạn '
            || 'không sửa được. Nhờ quản trị viên nếu cần.');
    end if;

    -- 4b. Người bị xoá.
    select cu.id into v_ngoai
      from public.persons cu
     where cu.id = any(v_xoa_p)
       and not (cu.id = any(v_pham_vi))
     limit 1;
    if v_ngoai is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'ngoaiphamvi',
        'loi', 'Người ' || v_ngoai || ' không thuộc trực hệ của bạn nên bạn '
            || 'không xoá được.');
    end if;

    -- 4c. Quan hệ — "khai cụ tổ là bố tôi" là đường leo quyền hai lần bấm.
    select u.id into v_ngoai
      from jsonb_populate_recordset(null::public.unions, v_unions) u
     where exists (select 1 from public.persons px
                    where px.id = any(u.partners)
                      and not (px.id = any(v_pham_vi)))
     limit 1;
    if v_ngoai is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'ngoaiphamvi',
        'loi', 'Hôn nhân ' || v_ngoai || ' có người ngoài trực hệ của bạn.');
    end if;

    select cu.id into v_ngoai
      from public.unions cu
     where (cu.id in (select u.id
                        from jsonb_populate_recordset(null::public.unions, v_unions) u)
         or cu.id in (select jsonb_array_elements_text(
                               coalesce(p_ops->'unions'->'xoa','[]'::jsonb))))
       and exists (select 1 from public.persons px
                    where px.id = any(cu.partners)
                      and not (px.id = any(v_pham_vi)))
     limit 1;
    if v_ngoai is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'ngoaiphamvi',
        'loi', 'Hôn nhân ' || v_ngoai || ' đang có người ngoài trực hệ của bạn.');
    end if;

    select uc.person_id into v_ngoai
      from jsonb_populate_recordset(null::public.union_children, v_children) uc
     where not (uc.person_id = any(v_pham_vi))
       and exists (select 1 from public.persons cu where cu.id = uc.person_id)
     limit 1;
    if v_ngoai is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'ngoaiphamvi',
        'loi', 'Không gắn được người ' || v_ngoai || ' làm con: người ấy '
            || 'không thuộc trực hệ của bạn.');
    end if;

    select uc.union_id into v_ngoai
      from jsonb_populate_recordset(null::public.union_children, v_children) uc
     where exists (select 1 from public.unions un
                    join public.persons px on px.id = any(un.partners)
                   where un.id = uc.union_id
                     and not (px.id = any(v_pham_vi)))
     limit 1;
    if v_ngoai is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'ngoaiphamvi',
        'loi', 'Hôn nhân ' || v_ngoai || ' ngoài trực hệ của bạn nên bạn '
            || 'không thêm bớt con của họ được.');
    end if;

    select x.person_id into v_ngoai
      from jsonb_to_recordset(coalesce(p_ops->'children'->'xoa','[]'::jsonb))
           as x(union_id text, person_id text)
     where not (x.person_id = any(v_pham_vi))
        or exists (select 1 from public.unions un
                    join public.persons px on px.id = any(un.partners)
                   where un.id = x.union_id
                     and not (px.id = any(v_pham_vi)))
     limit 1;
    if v_ngoai is not null then
      return jsonb_build_object('ok', false, 'lyDo', 'ngoaiphamvi',
        'loi', 'Quan hệ cha mẹ–con của người ' || v_ngoai || ' nằm ngoài '
            || 'trực hệ của bạn.');
    end if;
  end if;

  -- ══ CHỤP ẢNH DỮ LIỆU CŨ — phải đứng TRƯỚC mọi lệnh ghi ══
  -- Luật ba điều ở `03`: máy chủ tự chụp · `cu` null = dòng chưa từng có ·
  -- cạnh CASCADE cắt theo phải tự đi tìm. `cu` nay mang cả `revision`.
  select jsonb_build_object(

    'persons', (
      select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'cu',
               case when cu.id is null then 'null'::jsonb
                    else to_jsonb(cu.*) end)), '[]'::jsonb)
        from (
          select p.id
            from jsonb_populate_recordset(null::public.persons, v_persons) p
          union
          select unnest(v_xoa_p)
        ) k
        left join public.persons cu on cu.id = k.id),

    'unions', (
      select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'cu',
               case when cu.id is null then 'null'::jsonb
                    else to_jsonb(cu.*) end)), '[]'::jsonb)
        from (
          select u.id
            from jsonb_populate_recordset(null::public.unions, v_unions) u
          union
          select jsonb_array_elements_text(
                   coalesce(p_ops->'unions'->'xoa', '[]'::jsonb))
        ) k
        left join public.unions cu on cu.id = k.id),

    'children', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'union_id', k.union_id, 'person_id', k.person_id, 'cu',
               case when cu.union_id is null then 'null'::jsonb
                    else to_jsonb(cu.*) end)), '[]'::jsonb)
        from (
          select uc.union_id, uc.person_id
            from jsonb_populate_recordset(null::public.union_children, v_children) uc
          union
          select x.union_id, x.person_id
            from jsonb_to_recordset(coalesce(p_ops->'children'->'xoa','[]'::jsonb))
                 as x(union_id text, person_id text)
          union
          -- Cạnh sắp bị cắt theo hôn nhân bị xoá / người bị xoá THẬT.
          select c2.union_id, c2.person_id
            from public.union_children c2
           where c2.union_id in (select jsonb_array_elements_text(
                    coalesce(p_ops->'unions'->'xoa', '[]'::jsonb)))
              or c2.person_id = any(v_xoa_that)
        ) k
        left join public.union_children cu
          on cu.union_id = k.union_id and cu.person_id = k.person_id),

    'media', (
      select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'cu',
               case when cu.id is null then 'null'::jsonb
                    else to_jsonb(cu.*) end)), '[]'::jsonb)
        from (
          select m.id
            from jsonb_populate_recordset(null::public.media, v_media) m
          union
          select jsonb_array_elements_text(
                   coalesce(p_ops->'media'->'xoa', '[]'::jsonb))
        ) k
        left join public.media cu on cu.id = k.id),

    'sources', (
      select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'cu',
               case when sc.tree_id is null then 'null'::jsonb
                    else to_jsonb(sc.*) end)), '[]'::jsonb)
        from (
          select s.id
            from jsonb_populate_recordset(null::public.sources, v_sources) s
          union
          select jsonb_array_elements_text(
                   coalesce(p_ops->'sources'->'xoa', '[]'::jsonb))
        ) k
        left join public.sources sc
          on sc.tree_id = p_tree_id and sc.id = k.id),

    -- ⚠ `luu_cay()` ghi ba trường này bằng `coalesce` — hoàn tác cũng vậy.
    'tree', case
      when jsonb_typeof(coalesce(p_ops->'tree', 'null'::jsonb)) = 'object'
      then (select jsonb_build_object('name', t.name,
                                      'root_person_id', t.root_person_id,
                                      'note', t.note)
              from public.trees t where t.id = p_tree_id)
      else 'null'::jsonb end

  ) into v_truoc;

  -- b124a — hoàn tác phải biết ai là người KÉO VÀO: họ có bản ghi cũ nên
  -- không nằm trong danh sách "người mới", mà bỏ họ ra khỏi cây thì chỉ được
  -- cắt dòng `tree_persons` của cây này, KHÔNG xoá bản ghi — cây kia đang giữ.
  v_truoc := v_truoc || jsonb_build_object('keo_vao', to_jsonb(v_keo_vao));

  -- ══════════════════════════════════════════════════════════
  -- TỪ ĐÂY TRỞ XUỐNG MỚI ĐƯỢC GHI
  -- ══════════════════════════════════════════════════════════
  -- Xoá: con trước, rồi hôn nhân và người. Thêm: người, hôn nhân, rồi con.

  delete from public.union_children uc
   using jsonb_to_recordset(coalesce(p_ops->'children'->'xoa','[]'::jsonb))
         as x(union_id text, person_id text)
   where uc.union_id = x.union_id and uc.person_id = x.person_id;

  delete from public.union_children
   where union_id in (select jsonb_array_elements_text(coalesce(p_ops->'unions'->'xoa','[]'::jsonb)))
      or person_id = any(v_xoa_that);

  delete from public.unions
   where id in (select jsonb_array_elements_text(coalesce(p_ops->'unions'->'xoa','[]'::jsonb)));

  delete from public.media
   where id in (select jsonb_array_elements_text(coalesce(p_ops->'media'->'xoa','[]'::jsonb)));

  delete from public.sources
   where tree_id = p_tree_id
     and id in (select jsonb_array_elements_text(coalesce(p_ops->'sources'->'xoa','[]'::jsonb)));

  -- Rút khỏi cây này; bản ghi chỉ đi khi không cây nào khác giữ.
  delete from public.tree_persons
   where tree_id = p_tree_id and person_id = any(v_xoa_p);
  delete from public.persons where id = any(v_xoa_that);

  -- --- THÊM VÀ SỬA ---
  -- ⚠⚠ `revision = excluded.revision` ở cả bốn bảng. Thiếu nó thì lệnh
  --   UPDATE không nhắc số, trigger `26` cho qua — chống ghi đè vô hiệu.
  insert into public.persons
  select * from jsonb_populate_recordset(null::public.persons, v_persons)
  on conflict (id) do update set
    uid = excluded.uid, names = excluded.names, sex = excluded.sex,
    birth = excluded.birth, death = excluded.death,
    burial_place = excluded.burial_place,
    title = excluded.title, occupation = excluded.occupation,
    education = excluded.education, religion = excluded.religion,
    residence = excluded.residence, nationality = excluded.nationality,
    living = excluded.living, photo_file_id = excluded.photo_file_id,
    note = excluded.note, deleted = excluded.deleted,
    vn = excluded.vn, meta = excluded.meta, branch_id = excluded.branch_id,
    revision = excluded.revision;

  insert into public.tree_persons (tree_id, person_id)
  select p_tree_id, p.id
    from jsonb_populate_recordset(null::public.persons, v_persons) p
  on conflict do nothing;

  -- b124a — người kéo vào qua QUAN HỆ (khai làm vợ/chồng, làm con) mà lần
  -- lưu không gửi kèm bản ghi của họ: câu trên không với tới. Thiếu câu này
  -- thì họ đứng trong sơ đồ mà KHÔNG thuộc cây — `doc_cay()` không thấy, và
  -- lần sửa sau báo `ngoaicay` ở một chỗ không ai hiểu vì sao.
  insert into public.tree_persons (tree_id, person_id)
  select p_tree_id, unnest(v_keo_vao)
  on conflict do nothing;

  insert into public.unions
  select * from jsonb_populate_recordset(null::public.unions, v_unions)
  on conflict (id) do update set
    uid = excluded.uid, partners = excluded.partners,
    partner_order = excluded.partner_order, ranks = excluded.ranks,
    status = excluded.status, marriage = excluded.marriage,
    note = excluded.note, deleted = excluded.deleted,
    revision = excluded.revision;

  insert into public.union_children
  select * from jsonb_populate_recordset(null::public.union_children, v_children)
  on conflict (union_id, person_id) do update set
    relation = excluded.relation, ord = excluded.ord,
    revision = excluded.revision;

  insert into public.media
  select * from jsonb_populate_recordset(null::public.media, v_media)
  on conflict (id) do update set
    subject_id = excluded.subject_id,
    drive_file_id = excluded.drive_file_id,
    drive_file_id_lon = excluded.drive_file_id_lon,
    caption = excluded.caption, year = excluded.year,
    deleted = excluded.deleted, meta = excluded.meta,
    revision = excluded.revision;

  insert into public.sources
  select * from jsonb_populate_recordset(null::public.sources, v_sources)
  on conflict (tree_id, id) do update set
    title = excluded.title, author = excluded.author, note = excluded.note;

  -- --- SỐ SAU LẦN LƯU — hoàn tác xuyên cây so vào đây (đầu file) ---
  v_truoc := v_truoc || jsonb_build_object('rev_sau', (
    select coalesce(jsonb_object_agg(x.k, x.r), '{}'::jsonb) from (
      select 'p:' || p.id as k, p.revision as r from public.persons p
       where p.id in (select e->>'id' from jsonb_array_elements(v_truoc->'persons') e)
      union all
      select 'u:' || u.id, u.revision from public.unions u
       where u.id in (select e->>'id' from jsonb_array_elements(v_truoc->'unions') e)
      union all
      select 'c:' || c.union_id || '|' || c.person_id, c.revision
        from public.union_children c
        join jsonb_array_elements(v_truoc->'children') e
          on c.union_id = e->>'union_id' and c.person_id = e->>'person_id'
      union all
      select 'm:' || m.id, m.revision from public.media m
       where m.id in (select e->>'id' from jsonb_array_elements(v_truoc->'media') e)
    ) x));

  -- --- SỔ NHẬP ---
  with them as (
    insert into public.imports (tree_id, by_email, file, source, source_name,
                                exporter, counts, map)
    select p_tree_id, v_email,
           coalesce(e->>'file',''), coalesce(e->>'source',''),
           coalesce(e->>'source_name',''), coalesce(e->>'exporter',''),
           coalesce(e->'counts','{}'::jsonb), coalesce(e->'map','[]'::jsonb)
      from jsonb_array_elements(coalesce(p_ops->'imports','[]'::jsonb)) e
    returning id
  )
  select coalesce(jsonb_agg(them.id), '[]'::jsonb) into v_imports from them;

  v_truoc := v_truoc || jsonb_build_object('imports_moi', v_imports);

  -- --- KHỐI THÔNG TIN CHUNG CỦA CÂY + TĂNG SỐ CÂY ---
  v_rev_moi := v_rev_thuc + 1;
  update public.trees set
    name           = coalesce(p_ops->'tree'->>'name', name),
    root_person_id = coalesce(p_ops->'tree'->>'root_person_id', root_person_id),
    note           = coalesce(p_ops->'tree'->>'note', note),
    revision       = v_rev_moi,
    updated_at     = now(),
    updated_by     = v_email
   where id = p_tree_id
   returning to_jsonb(trees.*) into v_tree;

  -- --- NHẬT KÝ --- (`ts`/`by`/`truoc`/`trang_thai` người gửi không tự khai)
  v_trang_thai := case when public.ghi_thang(p_tree_id) then 'duyet' else 'cho' end;

  insert into public.change_log (tree_id, by_email, user_id, action, target,
                                 note, diff, revision, truoc, trang_thai,
                                 duyet_boi, duyet_luc)
  values (p_tree_id, v_email, auth.uid(),
          coalesce(p_mo_ta->>'action', 'update'),
          coalesce(p_mo_ta->>'target', ''),
          coalesce(p_mo_ta->>'note', ''),
          coalesce(p_mo_ta->'diff', '{}'::jsonb),
          v_rev_moi, v_truoc, v_trang_thai,
          case when v_trang_thai = 'duyet' then v_email end,
          case when v_trang_thai = 'duyet' then now()   end);

  return jsonb_build_object('ok', true, 'lyDo', null, 'loi', null,
                            'revision', v_rev_moi, 'tree', v_tree,
                            'trangThai', v_trang_thai);

exception
  -- Trigger `chan_ghi_de_ban_ghi` (`26`). Cả lần lưu đã tự huỷ ở đây.
  when sqlstate 'GP409' then
    get stacked diagnostics v_hint = pg_exception_hint, v_ngoai = message_text;
    return jsonb_build_object('ok', false, 'lyDo', coalesce(v_hint, 'xungdot'),
      'loi', case when v_hint = 'trungma'
                  then 'Mã mới vừa cấp đã có bản ghi khác giữ, nên lần lưu này không '
                    || 'ghi đè lên nó. Tải lại trang rồi thêm lại.'
                  else 'Người khác vừa sửa một người trong lần lưu này (có thể từ '
                    || 'gia phả khác). Tải lại trang để lấy bản mới nhất rồi sửa lại.'
             end,
      'chiTiet', v_ngoai);
end;
$$;

revoke all on function public.luu_cay(uuid, integer, jsonb, jsonb) from public, anon;
grant execute on function public.luu_cay(uuid, integer, jsonb, jsonb) to authenticated;

commit;

-- ============================================================
-- TỰ KIỂM — dán xong đọc bảng này, mọi dòng phải ĐẠT
-- ============================================================
-- Đo NGUỒN hàm, không đo hành vi (hành vi: do-b128a.mjs). Bắt đúng cái lỗi
-- hay gặp nhất: dán lại `27`/`28` sau `32` và mất rào thép, không ai báo.
select 1 as stt, 'luu_cay() có rào thép (ngoairao)' as ten_kiem,
  case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'luu_cay'
                and p.prosrc like '%ngoairao%') = 1 then 'ĐẠT' else 'HỎNG' end as ket_qua
union all
select 2, 'luu_cay() vẫn giữ phần kéo người của b124a',
  case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'luu_cay'
                and p.prosrc like '%v_pham_vi := v_pham_vi || v_keo_vao%') = 1
       then 'ĐẠT' else 'HỎNG' end
union all
select 3, 'anon KHÔNG gọi được luu_cay()',
  case when not has_function_privilege('anon',
         'public.luu_cay(uuid, integer, jsonb, jsonb)', 'execute') then 'ĐẠT' else 'HỎNG' end
union all
select 4, 'authenticated gọi được luu_cay()',
  case when has_function_privilege('authenticated',
         'public.luu_cay(uuid, integer, jsonb, jsonb)', 'execute') then 'ĐẠT' else 'HỎNG' end
order by stt;
