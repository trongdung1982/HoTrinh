# Sổ tay — LƯU MỘT DÒNG ngoài `repo.js` (trang Quản trị)

*Lập 26/09/2026 (b125c). Ghi theo chức năng — gặp lỗi thì thêm vào đây.*

## Vì sao không qua `repo.luuCay()`

`repo.js` giữ `state.tree` của đúng MỘT cây — cây đang mở ở sơ đồ. Trang Quản
trị (`pages/quan-tri/trang-nguoi.js`) xem bất cứ cây nào chủ tài khoản quản
lý, không chỉ cây đang mở, nên không có `state` nào của `repo` để dùng.

Cách làm: mượn lại bốn bước của `repo.luuCay()` (so — gửi — tăng số — cập
nhật tại chỗ) nhưng gọi thẳng `services/hinh-dang.js` (`soSanh` ·
`coGiDeGhi` · `tangSoSauKhiLuu`) và `services/sb.js luuCay()`, với "cây" chỉ
có MỘT người: `{persons:[truoc]}` / `{persons:[sau]}`. `domains/person.js
updatePerson()` tính bản SAU (raw→iso ngày tháng, ghép tên…) — trang không
tự làm lại việc ấy.

## Một `treeRevision` dùng chung cho cả bảng

Cây chỉ có MỘT số chống ghi đè cấp cây (`trees.revision`, khác cột `revision`
riêng của từng người ở `so-tay/luu-du-lieu.md`). Hai nút Lưu bấm gần nhau
(hai dòng khác nhau trong cùng bảng) gửi cùng số cũ, lần hai bị máy chủ từ
chối `xungdot` một cách oan uổng — không ai thật sự tranh nhau sửa, chỉ là
trang chưa kịp cập nhật số sau lần Lưu đầu.

⚠ Vá bằng cách khoá TẤT CẢ nút Lưu trong bảng lúc đang có một lượt Lưu chạy
dở, mở lại sau khi lượt ấy xong (thành công hay thất bại đều mở).

## "Họ và tên" là MỘT ô, `updatePerson` cần BA phần

`changes.name` cần `{surname, middle, given}`. Tách một chuỗi theo quy ước đã
dùng ở `domains/gedcom.js`: từ ĐẦU là họ, từ CUỐI là tên, ở giữa là đệm — một
từ duy nhất thì coi là TÊN (biệt hiệu, tên gọi), không phải họ.

Mẫu này (`luuHang()` trong `trang-nguoi.js`) dùng lại cho b125d (sửa hàng
loạt) — đừng dựng đường ghi thứ ba.
