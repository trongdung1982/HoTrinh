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

## Cột *Tài khoản* — gắn/gỡ liên kết theo bốn hạng (b129c, 27/09/2026)

Đang Chỉnh sửa, cột *Tài khoản* (MỘT cột, không tách cột mới) vẽ bằng
`oTaiKhoan()` — hành động RIÊNG, KHÔNG đi qua `luuHang()`/`luu_cay()`:

| Ai | Chưa gắn | Đã gắn |
|---|---|---|
| QTHT | *Gắn* thẳng — `gan_thang_tai_khoan` | *Gỡ* thẳng |
| chủ · quản trị · thành viên | *Gửi đề xuất* — `de_xuat_gan_ho` | *Đề xuất gỡ* — `de_xuat_go_ho` |
| chính chủ dòng ấy | chọn chính mình → dẫn sang Hồ sơ cá nhân | *Gỡ liên kết của tôi* — `go_gan_tai_khoan` |
| khách | không tới được (cây không cho sửa) | — |

Duyệt đề xuất: QTHT hoặc chính người được gắn (`duyet_de_xuat_gan`, bản `39`).
Đơn gỡ người được gắn LUÔN tự duyệt được; đơn gắn thì chỉ qua khe `36`.
Không có "đổi": tài khoản đã liên kết thì phải GỠ trước, câu chặn nói rõ người
ấy + thuộc gia phả nào (`mo_ta_lien_ket`).

⚠ Nguồn cột là `ds_lien_ket_cay()` (đọc `tai_khoan.person_id`). Bản trước đọc
`dsThanhVien().maNguoi` = `tree_members.person_id` — cột CHẾT từ b126, và chỉ
trả cho người kiểm duyệt được: cột hiện SAI, thành viên thường thấy trống.

⚠ Ô tìm dùng `tim_tai_khoan_trong_cay()` — chỉ người ĐÃ vào cây (khách trở
lên), KHÔNG dùng `timTaiKhoan()` (cái ấy tìm toàn hệ thống, dành cho Mời).

⚠⚠ Khe `36` đòi `la_chu_cay()` — người được gắn phải LÀ CHỦ một cây bất kỳ
mới tự duyệt đơn GẮN; thành viên thường cần QTHT. Bàn thử đầu tiên giả định
sai điều này. Đo: `do-b129c.mjs` (66 phép, gồm kiểm chứng ngược H: dán lại
`36` sau `39` thì đơn gỡ "được duyệt" mà không gắn nhầm ai).

⚠ `ganGoiY()` gắn `window.scroll`/`resize` NGAY khi gọi, không chờ popup mở
(`so-tay/o-goi-y.md`). Bảng vẽ lại cả `tbody` mỗi lần tìm/sắp/đổi trang —
quên gọi hàm gỡ nó trả về TRƯỚC khi xoá `tbody` là mỗi lượt vẽ lại cộng dồn
thêm một bộ nghe treo mãi. `trang-nguoi.js` giữ mảng `goiYDangMo`, gọi hết
rồi mới xoá bảng.
