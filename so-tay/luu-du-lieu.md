# Sổ tay — LƯU DỮ LIỆU CÂY (thêm cột · `luu_cay` · hoàn tác)

*Lập 17/09/2026 (b120). Ghi theo chức năng — gặp lỗi thì thêm vào đây.*

## Thêm một cột vào bảng người (hay bảng dữ liệu cây nào khác)

Cột mới phải có tên ở **BỐN chỗ**. Thiếu chỗ nào thì hỏng **im lặng**:

| Chỗ | Thiếu thì |
|---|---|
| `js/services/hinh-dang.js` — `TEN_PERSON` + `MAC_DINH_PERSON` | mỗi lần lưu ghi `null` đè lên (`DU-LIEU.md` điều 7) |
| `js/domains/person.js` — `updatePerson()` (+ `createPerson()`) | ô trong form sửa không ăn — hàm chỉ ghi trường nó biết tên |
| `luu_cay()` — danh sách `on conflict do update set …` | người MỚI lưu được, người ĐÃ CÓ sửa không ăn |
| `tu_choi_thay_doi()` — cùng danh sách ấy | từ chối một thay đổi không trả lại cột ấy |

⚠ Hai hàm máy chủ **liệt kê tên cột**, không `set *`. Bẫy thứ ba và thứ tư tìm ra
ở b120, trước đó tài liệu chỉ ghi bẫy thứ nhất. Bản đứng cuối của cả hai: `luoc-do/27`.

## Khoá vắng mặt trong JSON gửi lên

`jsonb_populate_recordset` biến khoá thiếu thành `null`, không thành `default`.
Hai nguồn gửi dòng THIẾU cột mới: **tab trình duyệt mở từ trước khi đẩy mã**, và
**ảnh chụp `change_log.truoc` chụp trước khi có cột**. Cột `not null` thì cả lần
lưu bị từ chối; điền `''` thì xoá trắng dữ liệu người ta.

Cách `25-noi-ve.sql` làm: ghép giá trị ĐANG CÓ vào trước, khoá gửi lên đè sau —
`jsonb_build_object('noi_ve', coalesce(hn.noi_ve,'')) || e`. Cột mới sau này
làm y hệt, trong một file SQL mới **đứng cuối** của cả hai hàm.

## Chép lại hàm dài vào file SQL mới

Đừng chép tay. Trích nguyên văn bằng script, thay từng chỗ và **bắt khớp đúng 1
lần**. ⚠ `String.replace(cu, moi)` của JavaScript hiểu `$$` trong `moi` thành
một `$` — thân hàm plpgsql hỏng. Dùng `replace(cu, () => moi)`.

## Đo

`kiem-thu/ban-thu-sql/do-b120.mjs` (ngoài repo): lưu một vòng qua `luu_cay()`
rồi đọc lại · dòng thiếu khoá không xoá dữ liệu · từ chối trả đúng giá trị cũ.
`kiem-thu/kiem-hinh-dang.mjs` phép 4 nay đọc cả `add column … not null` ở mọi
file `luoc-do/`, không riêng `01`.

## Chống ghi đè THEO BẢN GHI — `revision` (b121, `luoc-do/26`)

Người dùng chung nhiều cây, nên `trees.revision` (số của một cây) không chặn
được tab cây B đè lên bản vừa sửa từ cây A. Bốn bảng `persons` · `unions` ·
`union_children` · `media` có cột `revision`; trigger `chan_ghi_de_ban_ghi`:

| Gửi lên | Kết quả |
|---|---|
| sửa, `revision` = số đang có | qua, số +1 |
| sửa, số cũ hoặc thiếu (`null`) | `GP409` hint `xungdot` |
| mới, `revision = 0`, mã chưa ai giữ | qua, lưu số 1 |
| mới, `revision = 0`, mã ĐÃ có | `GP409` hint `trungma` |
| lệnh máy chủ KHÔNG nhắc `revision` | qua, số +1 |

⚠ Dòng cuối là lỗ: `on conflict do update set` của `luu_cay()` mà thiếu
`revision = excluded.revision` thì cả cơ chế **im lặng vô hiệu**. Cột
`revision` là chỗ thứ NĂM trong bảng trên đầu sổ — nhưng khác bốn cột kia,
thiếu nó thì không mất dữ liệu mà mất hàng rào.

⚠ Trigger BEFORE INSERT chạy **trước** khi Postgres xét `on conflict`, và
`excluded` mang giá trị SAU trigger — nên trigger không được đặt số cho dòng
sắp đụng mã đã có. Đo: `kiem-thu/ban-thu-sql/do-b121.mjs` phần G.

⚠ **Ngược lại ở `tu_choi_thay_doi()`: KHÔNG đặt `revision = excluded.revision`.**
Ảnh chụp `cu` mang số CŨ — đặt vào là trigger từ chối chính lần hoàn tác. Ở đó
để trigger tự tăng số (b122a).

## Hoàn tác XUYÊN CÂY — `dung_do_sau()` không đủ (b122a)

`dung_do_sau()` chỉ so nhật ký cùng cây. Ông X sửa tiếp từ cây A thì từ chối lần
lưu cũ ở cây B vẫn dán đè — bàn thử T2 bắt được. `luu_cay()` nay ghi
`truoc.rev_sau` (số từng bản ghi NGAY SAU lần lưu); `ban_ghi_lech_so()` so với
số hiện tại, lệch là từ chối. Cộng: nhật ký cũ hơn `doi_ma_toan_cuc.luc` bị từ
chối (ảnh chụp mang mã cũ). Đo: `do-b122.mjs` phần T.

## Bản ghi phải THUỘC CÂY đang lưu (b122a)

Mã toàn cục + phạm vi `null` của quản trị = quản trị cây B sửa được MỌI người
trong phần mềm chỉ bằng cách gửi mã. Hàng rào 3b của `luu_cay()` chặn: người ∈
`tree_persons`, hôn nhân có vợ/chồng hay con thuộc cây, ảnh gắn vào hai loại ấy
— áp cho cả sửa, xoá, và kéo người cây khác làm vợ/chồng/con. Xoá người = rút
khỏi cây này; bản ghi chỉ xoá khi không cây nào giữ. Đo: `do-b122.mjs` L3–L11.

## Mã toàn cục — xin bằng `cap_ma()`

Mã P/U/M duy nhất toàn phần mềm, không tiền tố cây (b121). Trình duyệt đếm số
lớn nhất trong cây đang mở là cấp trùng mã cây khác → `cap_ma(loai, so)`.
Mã cũ → mới lúc chuyển: `doi_ma_toan_cuc`. `change_log` KHÔNG viết lại —
nhật ký trước `doi_ma_toan_cuc.luc` nói bằng mã cũ của cây ấy.

⚠ `photo_file_id` của dữ liệu di dời từ Drive có ca chứa MÃ FILE DRIVE, không
phải mã `M…` (bàn thử: NPG `P0553`). Có từ trước `26`, đừng tưởng `26` làm lạc.

## Ảnh mồ côi = rác — so cả mã HÔN NHÂN (b122a, chốt 17/09)

`don_thung_rac()` (`27`) xoá bản ghi ảnh có `subject_id` không khớp mã người
NÀO **và** mã hôn nhân NÀO, trả file vào `dsAnh` (trừ file còn bản ghi khác
dùng chung), xoá trắng `photo_file_id` trỏ vào nó. ⚠ Ảnh cưới gắn vào `U…` —
so riêng mã người là xoá oan. Đo: `do-b122.mjs` O2 · O5.
