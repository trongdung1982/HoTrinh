# b114 — quantri3: bản đồ và chốt thiết kế

*15/09/2026 01:35 · Claude Code CLI (Sonnet 5 → Opus 5)*

---

## Làm được gì

- Đối chiếu prototype `../codex/dua_claude.ai/quantri3.html` (2620 dòng, ngoài
  repo) với mã đang chạy: mỗi route · chip · nút → hàm `sb.js` đã có / hàm máy
  chủ phải viết / không cần máy chủ. Ghi ở `THIET-KE-QUAN-TRI.md` **mục 9**.
- Tìm ra **bốn chỗ prototype nói NGƯỢC luật đã có** (không phải chỗ thiếu hàm),
  hỏi thẳng chủ dự án cả bốn. Cả bốn chọn bản prototype:
  ① xoá tài khoản = khoá mềm 60 ngày · ② bổ nhiệm QTHT = hai chữ ký ·
  ③ thùng rác cây 120 ngày · ④ chủ xoá cây thì cây ẩn ngay, QTHT xử lý sau.
  Ghi ở `THIET-KE-NHIEU-CAY.md` **mục 11.9**, dòng trỏ ở 11.5 · 11.6 · `CHI-DAN.md`.
- Rà lại bảng agent con dựng, **sửa ba ô sai**, và chia việc còn lại thành năm
  nhóm A–E (`THIET-KE-QUAN-TRI.md` **9.5**).
- Không một dòng mã nào đổi. `/kiem-tra` đạt cả 9.

## Vì sao làm thế

**Vì sao chưa sửa mã, dù chủ dự án nhắn *"sửa quantri.html theo thiết kế
này"*.** `KE-HOACH.md` đã chia việc ấy thành b114 → b118 từ 14/09, và b114 là
bước chỉ đọc, với lý do viết sẵn: sửa bốn khu mà chưa có bản đồ là đoán, đoán
sai ở khu thứ ba thì làm lại hai khu đầu. Câu nhắn mở đầu bằng chính nhãn
*"b114 — quantri3"* nên đọc nó là lệnh bắt đầu chuỗi, không phải lệnh bỏ chuỗi.
Bước này tự trả lời được vì sao nó cần: nó bắt ra bốn chỗ đổi luật mà nếu gõ
mã thẳng thì mỗi chỗ sẽ bị giải bằng cách âm thầm chọn một bên.

**Vì sao hỏi cả bốn câu, không tự chọn.** Mỗi câu lật một luật đã chốt, và câu
④ lật đúng một dòng ⚠ (*"lá đơn xin xoá không được khoá cây lại"*). Đó là loại
quyết định chỉ chủ dự án được làm. Mỗi lựa chọn trong câu hỏi ghi rõ cái giá —
chủ dự án chọn ④ khi đã đọc *"xoá nhầm thì cây bị ẩn suốt lúc chờ"*. Ký ức
*"chủ dự án hiếm khi đổi ý"* không áp ở đây: prototype là thứ họ đã duyệt SAU
luật cũ, nên chọn prototype chính là giữ ý mới nhất của họ.

**Vì sao ghi luật mới vào `THIET-KE-NHIEU-CAY.md` mà không sửa đè mục cũ.**
File ấy là nguồn đúng về quyền; `THIET-KE-QUAN-TRI.md` chỉ chép gọn để người
làm giao diện khỏi lật file. Mục 11.5 và 11.6 giữ nguyên, thêm một khối *ĐỔI
15/09* ở đầu — vì lý lẽ của luật cũ (*"đơn còn chờ, có thể bị từ chối"*) vẫn
là thứ người sửa `16` cần biết để hiểu mình đang đánh đổi gì. Hai điều của
11.6 giữ nguyên và được viết lại rõ ở 11.9: vẫn hai chữ ký cho bước vào thùng
rác, và thùng rác không đóng cửa với máy sao lưu.

**Vì sao nhóm D (SQL bốn luật) đứng SAU giao diện.** Nó đụng
`la_quan_tri_he_thong()` và `co_the_xem_cay()` — nền móng quyền. Luật thứ tự
của `KE-HOACH.md`: việc đụng vai đứng sau việc không đụng. Trong lúc chờ, nút
nào máy chủ chưa hỗ trợ thì **mờ sẵn kèm lý do**, không giả vờ chạy — đúng
luật *"không giả vờ giải quyết bằng giao diện"* của khu Sao lưu.

**Vì sao tạo tài khoản bị đẩy sang nhóm E.** `auth.admin.createUser` cần khoá
`service_role`. Repo này Public và git giữ cả bản đã xoá, nên khoá ấy chỉ được
sống trong biến bí mật của một Edge Function — một hạ tầng dự án chưa có.

**Vì sao ô tab *Vòng đời* không hỏi ngay.** Nó không chặn khung (b115), và câu
trả lời phụ thuộc cách vẽ khu Gia phả (b116). Hỏi lúc ấy thì hỏi kèm hình.

## Đã thử mà hỏng

1. **Tin bảng của agent con.** Giao việc đọc 2620 dòng cho một agent con để giữ
   ngữ cảnh gọn là đúng; nhưng nó ghi ba ô *"THIẾU"* sai — cây mặc định hệ
   thống (đã có, `datCayMacDinh`), ô *Cây hiển thị tại sơ đồ* (gán nhầm hàm,
   thật ra `chonGiaPha`), thu hồi lời mời (đã có, `goThanhVien`). Nó đọc tên
   hàm mà không đọc chú thích của hàm. Bắt được vì một phép đọc `THIET-KE-NHIEU-CAY.md`
   tình cờ nhắc `cau_hinh.cay_mac_dinh`.
   **Nếp:** mỗi ô *"thiếu"* phải có một lệnh grep làm chứng. Và **danh sách
   hàm `export` của `sb.js` (56) KHÔNG phải danh sách hàm máy chủ** —
   `luoc-do/` định nghĩa hơn 70, nhiều hàm chưa bọc. Grep `luoc-do/` trước.
2. **Chép nguyên câu *"bốn tab NGANG"* của kế hoạch.** Cả `PHOI-HOP-AI.md` lẫn
   `KE-HOACH.md` tả prototype là tab ngang thay thanh dọc. CSS của nó nói
   khác: thanh trái 245px, dưới 850px mới thành hàng thẻ — đúng mục 3 cũ.
   Người viết trước đọc bản HTML ở màn hình hẹp hoặc đọc lướt. **Nếp:** tả bố
   cục thì đọc `@media`, không đọc ấn tượng.
3. **`find` khắp Dropbox tìm prototype** — quá 120 giây, bị đẩy ra nền. Đường
   dẫn nằm sẵn trong `PHOI-HOP-AI.md`. **Nếp:** đường dẫn lạ thì đọc hòm thư
   và `KE-HOACH.md` trước, đừng quét ổ.
4. **In thân hàm SQL bằng `grep -l … | tail -1` rồi `sed` quanh dòng khớp** —
   ra khối `grant`, vì dòng nhắc tên hàm CUỐI CÙNG là dòng `revoke`. `awk` thì
   hỏng vì thoát ngoặc. **Nếp:** neo vào đúng chuỗi `create or replace function public.<tên>`.
5. **`/kiem-tra` phép 6 bằng `head -8`** báo sáu file thiếu dòng `Phiên bản` —
   khối ghi chú của chúng dài 9–11 dòng. Phép 5 bằng một biểu thức có tham
   chiếu ngược thì grep từ chối. Cả hai chạy lại bằng cách đơn giản hơn, đạt.

## Còn treo

- **Tài liệu đi trước máy chủ ở bốn luật.** SQL đang chạy vẫn là luật cũ
  (30 ngày, xin rồi mới ẩn, một chữ ký, xoá cứng) cho tới **b118b**.
- Ba câu nhỏ chốt lúc viết SQL — `THIET-KE-NHIEU-CAY.md` 11.9 cuối.
- Nghĩa tab *Vòng đời* — hỏi ở b116.
- Nhóm E (tạo tài khoản · công khai theo từng trường · nhật ký hệ thống) — sau b120.

## File đã đụng

| Loại | File |
|---|---|
| **Mới** | `nhat-ky/b114-ban-do-quantri3.md` |
| **Sửa** | `THIET-KE-QUAN-TRI.md` *(mục 9 mới)* · `THIET-KE-NHIEU-CAY.md` *(mục 11.9 + hai dòng trỏ)* · `CHI-DAN.md` *(một dòng định tuyến)* · `KE-HOACH.md` · `nhat-ky/INDEX.md` |
| **Sửa, ngoài repo** | `../PHOI-HOP-AI.md` — xoá bàn giao quantri3, nội dung ⚠ đã dời sang `KE-HOACH.md` |
| **Chép nguyên · xoá** | *(không)* |
