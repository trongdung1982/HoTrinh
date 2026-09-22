# Sổ tay — Ô GỢI Ý (gõ vài chữ, hiện danh sách khớp)

File     : `js/pages/quan-tri/o-goi-y.js` — MỘT bản cho cả bốn chỗ
Nơi gọi  : form Mời (email · mã người) · khu Tài khoản (mã người) ·
           form thêm người, ô *"đã có trong phần mềm chưa"* (`person-edit.js`)
           — ⚠ ô này TẮT từ 22/09/2026, `so-tay/nguoi-xuyen-cay.md`
Đo bằng  : `node ../kiem-thu/do-goi-y.mjs` (toạ độ, trên trang Quản trị giả) ·
           `node ../kiem-thu/do-chon-that.mjs` (cú bấm + điền sẵn, trên form thật)

## Vì sao MỘT bản, không phải bốn

Bốn ô ấy hỏi bốn câu khác nhau nhưng **cư xử giống hệt nhau**: chờ ngừng gõ,
hỏi máy chủ, vẽ danh sách, đi bằng phím mũi tên, chọn thì điền vào ô. Chép ra
bốn bản thì hôm nay chúng giống nhau và lệch dần từ lần sửa thứ hai. File này
**không biết gì về dữ liệu** — nơi gọi truyền `tim`/`ve` vào — nên đổi nguồn
dữ liệu không phải sửa nó.

Sáu cái bẫy nằm ở ghi chú đầu file, dạng rút gọn. Dưới đây là chuyện đầy đủ
của những cái đã trả giá thật.

## ⚠ "Thấy ô chọn mà không chọn được" — 22/09/2026

Chủ dự án thử kéo người từ cây `TH957` sang `T388`: danh sách gợi ý hiện ra
đúng, bấm vào một dòng thì **không thấy gì xảy ra**, phải gõ tay mã người — và
gõ tay thì không nối được ai với ai, vì gõ vào ô TÌM không phải là chọn.

Hai nguyên nhân, cùng nằm trong `o-goi-y.js`, cùng hỏng **im lặng**:

1. **`chon()` bắn lại sự kiện `input`, và lượt ấy MỞ LẠI DANH SÁCH.** Chuỗi
   vừa điền vào ô là tên đúng người vừa chọn, nên lần hỏi sau tìm thấy đúng
   họ; bảng bật lên lại sau 180 ms và **đè lên lời báo "✓ đã chọn"** vừa hiện.
   Nhìn thì y như cú bấm rơi vào hư không — bấm lại, lại thế. Vá: vẫn bắn sự
   kiện (nơi gọi có thể đang nghe) nhưng `boQuaLuotSau` nuốt đúng một lượt.
2. **Rê chuột vẽ lại cả bảng.** `mouseenter` gọi `veBang()`, mà `veBang()` bắt
   đầu bằng `innerHTML = ''`: dòng đang nằm dưới con trỏ bị xoá rồi dựng lại,
   Chrome bắn `mouseenter` cho dòng mới, vòng ấy quay mỗi khung hình; và
   `scrollTop` về 0, nên bảng đang cuộn dở thì **nhảy về đầu đúng lúc người ta
   định bấm**. Vá: đổi màu tại chỗ bằng `toSang()`, chỉ `veBang()` khi danh
   sách thật sự đổi.

Và vì cú bấm là thứ dễ mất nhất trong cả cái ô này, mỗi dòng nay nghe **cả
`mousedown` lẫn `click`**. Chọn hai lần là vô hại: `chon()` đầu tiên đã
`dong()`, `ds` rỗng, nên cú thứ hai tự rơi ra ở dòng `if (!muc) return`.

⚠ **Đừng bỏ `mousedown` để chỉ giữ `click`** — bẫy 3: `blur` xảy ra TRƯỚC
`click`, và `blur` đóng danh sách.

## ⚠ Trên điện thoại — nghi vấn CHƯA xác nhận

Bàn phím ảo mở ra **không** bắn `resize` của `window`, nên toạ độ
`position:fixed` đo trước đó lệch và cú chạm rơi hụt dòng gợi ý. Vá bằng nghe
thêm `window.visualViewport` (bẫy 4, b122d). **Chưa ai bấm lại trên điện
thoại thật** — ảnh 390px đạt (`kq-gan-ma-390.png`) nhưng đó là trang giả trên
máy tính. Hai nguyên nhân ở mục trên cũng có ở điện thoại, nên bấm lại trước
khi kết luận còn lệch hay không.

## Ảnh chụp không phân giải được "đè" với "sát"

Ở độ rộng 1280px, hai hộp cách nhau 1px và hai hộp chồng lên nhau **trông y
như nhau**. Nhìn ảnh không kết luận được — chạy `node ../kiem-thu/do-goi-y.mjs`,
nó đọc toạ độ thật.

⚠ `do-goi-y.mjs` hiện báo *KHÔNG THẤY `.qt-than`* và *KHÔNG THẤY ô nhập mã
người*: trang Quản trị giả đã dựng lại ở b118d, phép đo còn tìm tên cũ. **Nợ
có từ trước b124a2** (đo lại trên bản đã commit, y hệt) — sửa khi chạm tới khu
Tài khoản, đừng tưởng là lỗi mới.

## Đo cú bấm bằng máy — `do-chon-that.mjs`

Chạy **mã thật** của `person-edit.js` trong Chrome, thay đúng một thứ:
`window.supabase` giả (được phép — `sb.js` là file duy nhất chạm vào nó, nên
thay nó là thay cả tầng máy chủ mà không đụng một dòng mã app). Bài đo mở form
*Thêm người con*, gõ, bấm vào dòng thứ hai bằng `elementFromPoint` + `mousedown`
thật, rồi đọc ra: thẻ ✓ có hiện không · bảng có tự mở lại không · các ô có
điền sẵn không · bấm *Bỏ chọn* có xoá trắng lại không.

⚠ Nó KHÔNG thay được một người thật ngồi bấm: chuột thật đi qua `pointerdown`,
cử chỉ chạm, và bàn phím ảo — ba đường bài đo này không dựng lại được.
