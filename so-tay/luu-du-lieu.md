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
ở b120, trước đó tài liệu chỉ ghi bẫy thứ nhất.

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

## Mã toàn cục — xin bằng `cap_ma()`

Mã P/U/M duy nhất toàn phần mềm, không tiền tố cây (b121). Trình duyệt đếm số
lớn nhất trong cây đang mở là cấp trùng mã cây khác → `cap_ma(loai, so)`.
Mã cũ → mới lúc chuyển: `doi_ma_toan_cuc`. `change_log` KHÔNG viết lại —
nhật ký trước `doi_ma_toan_cuc.luc` nói bằng mã cũ của cây ấy.

⚠ `photo_file_id` của dữ liệu di dời từ Drive có ca chứa MÃ FILE DRIVE, không
phải mã `M…` (bàn thử: NPG `P0553`). Có từ trước `26`, đừng tưởng `26` làm lạc.
