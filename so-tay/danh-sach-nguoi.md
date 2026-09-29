# Danh sách người · Các gia đình · Thùng rác (person-list.js)

*Chuyển từ ghi chú đầu `pages/person-list.js` ngày 29/09/2026 (b159d) — nguyên văn, chỉ bỏ dấu `//`. Đầu file mã chỉ còn khuôn 6 dòng.*

⚠ Nút *Chọn nhiều để xoá* đã GỠ ở nhánh Supabase (b159d): dọn hàng loạt nay ở *Quản trị hệ thống → Dữ liệu mồ côi* và *Thùng rác → Người đã xoá*. Những đoạn dưới nhắc tới "chế độ chọn" là lịch sử.

```
--- Vì sao màn hình này phải có (bước 24) ------------------------------

App đang coi *"được vẽ"* là *"tồn tại"*. Sơ đồ vẽ quanh MỘT người trung tâm,
nên ai không nối với ai thì không cửa nào tới được — kể cả khi bản ghi của
họ vẫn nằm nguyên trong file. Ca thật ở bước 21: xoá P0060 làm P0061 chỉ
còn MỘT trên 63 người trung tâm nhìn thấy được. Thêm nhầm một người rồi
quên nối cũng cho đúng kết quả ấy, nên chỗ hỏng này không do việc xoá sinh
ra.

Không phần mềm gia phả nào để sơ đồ làm cửa duy nhất: RootsMagic có People
list view, Legacy tìm theo RIN, FamilySearch tra theo PID. Đây là cái cửa đó.

--- Ba quyết định của màn hình -----------------------------------------

1. Bấm một dòng là mở HỒ SƠ, không phải đổi người trung tâm. Người ta tìm
   để XEM trước đã; đổi luôn người trung tâm là ném họ sang một sơ đồ khác
   trước khi kịp nhìn xem có đúng người mình tìm không. Thẻ thông tin đã có
   sẵn nút "Đưa ra giữa sơ đồ" cho bước tiếp theo.

   Nơi gọi không truyền `onXemHoSo` mà chỉ truyền `onChonNguoi` thì dòng bấm
   vào sẽ gọi `onChonNguoi` — đó là chế độ CHỌN NGƯỜI, thứ bước 25 cần cho
   ba mục Kết nối · Thêm cha mẹ · Thêm vợ/chồng. Một tap một dòng, không bao
   giờ hai nút cạnh nhau: trên điện thoại hai đích chạm sát nhau trong một
   dòng cao 44px là mời bấm nhầm.

2. Danh sách KHÔNG tự đóng khi mở hồ sơ. Thẻ thông tin nổi lên trên, đóng
   thẻ là quay lại đúng chỗ đang tìm — người tra gia phả thường mở ba bốn
   người liền nhau để so. Việc nào ĐỔI dữ liệu hoặc đổi sơ đồ thì nơi gọi tự
   đóng danh sách; xem `moDanhSachNguoi()` ở `pages/tree-view.js`.

3. Người đã xoá mềm KHÔNG có mặt TRONG DANH SÁCH. `searchPersons` kể ra được
   họ (`gomDaXoa: true`), nhưng thẻ thông tin đọc từ `state.index`, mà
   `buildIndex()` bỏ qua bản ghi mang cờ `deleted` — kể tên rồi bấm vào
   không ra gì thì tệ hơn là không kể tên. Họ có màn hình RIÊNG, ngay dưới.

Hai file `pages` KHÔNG import lẫn nhau: file này không mở thẻ thông tin, nó
báo ra ngoài bằng callback (đúng luật đã chốt 17/08/2026, chat 1.6).

--- THÙNG RÁC — năm quyết định (bước 29, và quyết định 5 ở việc 6B) ------

Treo từ bước 21: xoá là đặt cờ `deleted`, hoàn tác chỉ làm được NGAY LÚC ẤY
trong lúc hộp còn mở. Đóng hộp rồi thì người ấy nằm trong file mãi mãi mà
không cửa nào tới được — kể cả màn hình Danh sách người, vì lý do 3 bên trên.

1. **Thùng rác KHÔNG có ô tìm.** Danh sách người có ô tìm vì nó nhìn vào cả
   kho vài trăm đến vài nghìn bản ghi; thùng rác nhìn vào những thứ vừa bị
   xoá — đếm trên đầu ngón tay. Thêm ô tìm là thêm mã cho một việc chưa ai
   cần, và ô tìm rỗng giữa một danh sách ba dòng trông như app hỏng.

2. **Bấm một dòng là ĐƯA TRỞ LẠI, không phải xem hồ sơ.** Thùng rác chỉ có
   đúng một việc. Mở hồ sơ người đã xoá thì không mở được — thẻ thông tin đọc
   `state.index` mà chỉ mục không có họ. Hộp xác nhận nằm ở `person-edit.js`,
   cùng chỗ với mọi đường ghi khác.

3. **Người và CẶP đứng chung một màn hình, hai nhóm.** Cặp bị xoá mềm cũng
   không có đường quay lại (bước 26 gỡ nối làm cặp mất lý do tồn tại thì cả
   cặp bị xoá theo). Dựng hai màn hình cho hai loại là bắt người dùng đoán
   thứ mình vừa mất thuộc loại nào.

4. **Nút vào thùng rác nằm ở chân màn hình Danh sách người**, và luôn hiện
   kèm con số — kể cả khi con số là 0. Nút mọc ra rồi biến đi tuỳ lúc là thứ
   người dùng không tìm lại được lần sau.

5. **XOÁ THẬT chỉ có ĐÚNG MỘT CỬA: nút *Dọn thùng rác* ngay trong màn hình
   này** (việc 6B). Không thêm một mục nào vào menu vòng tròn, không thêm nút
   nào vào thẻ thông tin. Người bấm *"Xoá khỏi gia phả"* giữa lúc đang xem sơ
   đồ không ở tâm thế dọn dẹp — họ đang sửa một bản ghi, và một thao tác không
   lùi được đặt giữa dòng công việc bình thường thì có ngày mất dữ liệu thật.

   ⚠ Và nút ấy **ngược luật của quyết định 4**: nó biến đi khi thùng rác
   trống. Hai nút, hai loại: nút *Thùng rác (n)* là một CỬA nên phải luôn tìm
   lại được; nút này là một VIỆC, mà việc không có gì để làm thì đừng mời bấm.
```
