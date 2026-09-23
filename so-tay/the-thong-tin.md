# Sổ tay — THẺ THÔNG TIN (thẻ người · thẻ gia đình · menu vòng tròn)

File     : `js/pages/person-detail.js`
Đo bằng  : `node ../kiem-thu/kiem-vanh-dai.mjs` (thẻ ở hai cây, Chrome thật,
           mã `supabase/js`) · các bài `../kiem-thu/kiem-the-*.mjs` còn đo
           bản `giapha/js`

*Chuyển nguyên văn từ ghi chú đầu file ngày 23/09/2026 (b127b, luật D1).*

## Người VÀNH ĐAI (b127b, 23/09/2026)

Người NGOÀI cây có dây nối thẳng vào người trong cây (`luoc-do/30`,
`THIET-KE-NHIEU-CAY.md` mục 6 *HAI HÀNG RÀO*). Tra bằng `timNguoiThe()` —
`personById` rồi tới `vanhDaiById` (`utils/graph.js`).

- Chỉ **kể tên** ở các nhóm Cha mẹ · Vợ/chồng · Con, ở cả thẻ người lẫn thẻ
  gia đình. Là `<div>`, **không phải nút**: họ không có thẻ, không bấm tới.
- Các cửa SỬA (sửa con, sắp thứ tự, xoá cặp) vẫn chỉ đếm người TRONG cây —
  sửa quan hệ có một đầu ngoài cây là việc của b127c (QTHT duyệt).
- `domains/` không bao giờ thấy họ, nên sơ đồ không đổi một nét.

## HAI MÀN HÌNH, HAI CÂU HỎI (chốt 20/08/2026)

File này xuất ra HAI cửa, và chúng trả lời hai câu khác nhau:

  openPersonMenu()   — *"tôi muốn LÀM GÌ với người này?"*  ⟵ cửa MẶC ĐỊNH
                       của cú chạm giữ và cú bấm chuột phải. Sáu việc QUAN HỆ
                       quanh vành, ảnh người ở giữa.
  openPersonDetail() — *"người này LÀ AI?"*  ngày tháng, tên khác, ba nhóm
                       quan hệ, và nút **Sửa hồ sơ**. Mở bằng cách bấm vào
                       ẢNH ở giữa vòng tròn.
  openUnionDetail()  — *"gia đình này RA SAO?"*  ngày cưới, cặp bây giờ thế
                       nào, các con theo thứ tự. Mở từ nhóm Vợ/chồng trong
                       thẻ người. Việc 4, thêm 21/08/2026 — xem mục riêng.

**Trước 20/08 hai thứ này nằm chung một thẻ, và đó là thừa.** Chạm giữ vào
một ô là hiện ra cả tiểu sử lẫn tám cái nút — mà chín lần trên mười người ta
chạm giữ vì muốn LÀM một việc, còn đọc tiểu sử thì đã đọc ngay trên sơ đồ.
Cái thẻ dài ấy bắt cuộn qua ba nhóm quan hệ mới tới được chỗ bấm.

Tách ra thì mỗi màn hình ngắn lại, và đường đi giữa chúng là hai chiều: ảnh
ở giữa vòng tròn dẫn sang thẻ, nút *"Các việc khác"* dưới thẻ dẫn ngược về
vòng tròn. Cả hai dùng CHUNG `lopPhu`, nên không bao giờ chồng lên nhau.

⚠ **Ranh giới giữa hai màn hình là *"nói về CON NGƯỜI"* hay *"nói về QUAN
HỆ"*.** Sửa hồ sơ nằm ở THẺ vì sửa ngày sinh là sửa cái đang đọc — chỗ đúng
của nó là ngay dưới thứ nó sắp sửa. Thêm cha mẹ, gỡ nối, xoá thì nằm ở VÀNH.

⚠ Hai cửa, MỘT bộ hàm xử lý. Nơi gọi truyền đúng một `xuLy` và nó đi xuyên
qua cả hai màn hình — thẻ mở menu thì chuyền tiếp, menu mở thẻ cũng vậy. Hai
bộ khác nhau là thứ đẻ ra cảnh cùng một nút mà lúc chạy lúc không, tuỳ người
dùng đã đi qua màn hình nào.

## MỤC CÒN TRỐNG: MẶC ĐỊNH ẨN, CÓ CÔNG TẮC MỞ RA (21/08/2026)

Trường trống thì ẨN CẢ HÀNG — luật 14/08/2026, `CLAUDE.md` mục 7, **vẫn còn
nguyên giá trị và mặc định của thẻ vẫn đúng như thế**. Dùng
utils/text.coGiaTri(), đừng tự kiểm theo kiểu riêng.

Thêm ngày 21/08/2026, sau khi chủ dự án hỏi *"tại sao bấm ⓘ không hiện đủ
thông tin như khi sửa hồ sơ"*: dưới bảng có một dòng bấm được —
**"Còn N mục chưa điền"** — mở ra thì các hàng trống hiện lên đúng CHỖ CỦA
CHÚNG trong bảng, nhãn mờ và giá trị là một dấu "—".

## Vì sao là công tắc, không phải đảo hẳn luật

Hai nhu cầu thật, ngược nhau, và cái thẻ phải phục vụ cả hai:

  · ĐỌC một người   → hàng trống là nhiễu. Mười ba dòng gạch để tìm ba dòng
                      có chữ là bắt người ta làm việc của cái máy.
  · RÀ để đi điền   → hàng trống chính là thứ cần thấy. Thẻ ngắn trông y hệt
                      dữ liệu bị mất, và người dùng không có cách nào biết
                      app còn hỏi được những gì.

Ẩn hẳn thì hỏng nhu cầu thứ hai; hiện hẳn thì hỏng nhu cầu thứ nhất. Bản
ngày 21/08 đã thử hiện hẳn và chụp ảnh (`kiem-thu/td-0.png`) — đọc được,
nhưng chủ dự án chốt công tắc, và công tắc đúng hơn: nó nói ra CON SỐ mục
còn thiếu ngay cả khi đang đóng, tức là giải quyết nhu cầu thứ hai mà không
tốn một dòng nào của nhu cầu thứ nhất.

⚠ **HÀNG TRỐNG PHẢI NẰM ĐÚNG CHỖ CỦA NÓ, không dồn xuống cuối.** Mở công tắc
ra mà bảy hàng trống xếp thành một cụm ở đáy thì thứ tự đọc vỡ, và người
dùng không đối chiếu được với form — mà đối chiếu với form đúng là việc họ
đang làm. Vì thế bấm công tắc là VẼ LẠI cả bảng, không phải lật `display`.

⚠ **Trạng thái công tắc nhớ qua các lần mở thẻ, trong cùng một phiên.** Ai
bật nó lên là đang đi rà cả một loạt người; bắt bật lại cho từng người là
bắt trả lời một câu hỏi đã trả lời rồi. Tải lại trang thì về mặc định ẩn.

⚠ **Hàng trống KHÔNG được mang chữ "Không rõ" hay "..."** — nửa ấy của luật
cũ không bị đụng tới. Dấu "—" là quy ước bảng kê cho ô chưa điền, không phải
một lời khẳng định về người ta.

Điểm dừng của chat 1.6: "xem xong một người là biết đủ, không phải cuộn
tìm". Vì thế thẻ này gom cả BA nhóm quan hệ — cha mẹ, vợ/chồng, con — chứ
không chỉ mấy dòng ngày tháng. Mỗi người trong đó là một nút bấm được.

## Vì sao thẻ KHÔNG tự gọi setFocusPerson

`tree-view.js` cũng thuộc lớp `pages`, và nó `import` file này. Để file này
`import` ngược lại là dựng một vòng tròn module — trình duyệt vẫn nạp được,
nhưng một trong hai file sẽ thấy hàm của file kia là `undefined` tuỳ thứ tự
nạp, và lỗi ấy chỉ hiện ra trên GitHub Pages chứ không hiện lúc chạy thử.
Nên nơi gọi truyền vào `onChonNguoi`, thẻ chỉ báo ra ngoài "người dùng vừa
chọn ai", không tự quyết định.

## Ảnh người: XONG ở bước 28

Hai chỗ, cùng một hàm `veAnhTron()` trừ tâm vòng tròn (nó tính bề ngang bằng
phần trăm nên phải dựng riêng): đầu THẺ 60px, và TÂM menu vòng tròn.

⚠ Cùng một luật hai lớp với `render.js`: bóng người mặc định nằm sẵn trong
`<img>`, ảnh thật chỉ THAY vào khi đã tải về được. Gán thẳng rồi bắt
`onerror` thì trên mạng chậm người dùng thấy một ô trống trước đã.
