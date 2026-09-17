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

## `noi_ve` — nghĩa

Một mã người đầy đủ ở gia phả KHÁC (`NTB417_P0013`) chỉ **cùng một con người**,
không nối quan hệ nào. Mã người duy nhất toàn ứng dụng, mã cây trong nó nói cây
nào — nên một chuỗi là đủ. Mã cũ `P####` bị từ chối. ⚠ Mã cây KHÔNG phải dòng
họ (dòng họ do người ấy tự chọn). Luật: `domains/person.js`
`loiNoiVe()` nói trước; máy chủ chặn khuôn + trùng trong một cây.
