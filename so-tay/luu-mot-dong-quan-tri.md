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

## Cột *Gắn tài khoản* — nộp HỘ, không ghi thẳng (b129c, 27/09/2026)

Quản trị chọn một tài khoản ở dòng người, bấm Gửi là gọi
`sb.deXuatGanHo(userId, maNguoi)` → RPC mới `de_xuat_gan_ho()`
(`luoc-do/39-de-xuat-gan-ho.sql`). Đây là hành động RIÊNG, KHÔNG đi qua
`luuHang()`/`luu_cay()` — nó tạo/sửa một dòng `de_xuat_gan_nguoi`, y hệt
luồng đề xuất ở Hồ sơ cá nhân, chỉ khác người NỘP không phải người ĐƯỢC gắn.

⚠ Hàng rào NỘP: chủ cây hoặc quản trị gia phả của MỘT CÂY ĐANG CHỨA người ấy
(`la_quan_tri_cay()`, `29`) — chốt 27/09/2026, hẹp hơn "mọi người sửa được
bảng". Trang tính MỘT LẦN cho cả trang (`duocGanHo` trong `mountTrangNguoi`),
không tính lại từng dòng, vì mọi người trong bảng chắc chắn thuộc cùng một
cây đang xem.

⚠⚠ Hàng rào DUYỆT KHÔNG ĐỔI — `de_xuat_gan_ho()` chỉ thêm cửa nộp, không đụng
`duyet_de_xuat_gan()`/`36`. Khe tự duyệt lần đầu của `36` vẫn nguyên: người
ĐƯỢC gắn (Y) tự duyệt được NẾU VÀ CHỈ NẾU ①Y đã là CHỦ một cây bất kỳ
(`la_chu_cay()` — không phải "mọi tài khoản"), ②Y chưa gắn ai, ③mã còn
trống. Sai lầm bàn thử ban đầu: giả định "nộp hộ thì Y luôn tự duyệt được" —
KHÔNG, Y phải tự có sẵn một cây riêng mới lọt khe; đa số trường hợp thực tế
(Y là thành viên thường) vẫn cần Quản trị hệ thống duyệt. Đo đủ ở
`do-b129c.mjs` mục C–D.

⚠ `ganGoiY()` gắn `window.scroll`/`resize` NGAY khi gọi, không chờ popup mở
(`so-tay/o-goi-y.md`). Bảng vẽ lại cả `tbody` mỗi lần tìm/sắp/đổi trang —
quên gọi hàm gỡ nó trả về TRƯỚC khi xoá `tbody` là mỗi lượt vẽ lại cộng dồn
thêm một bộ nghe treo mãi. `trang-nguoi.js` giữ mảng `goiYDangMo`, gọi hết
rồi mới xoá bảng.
