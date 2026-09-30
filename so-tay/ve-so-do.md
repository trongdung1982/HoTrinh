# Sổ tay · vẽ sơ đồ (bố trí toạ độ)

Gồm      : `js/domains/layout.js` — tính toạ độ ô, điểm thả, nét
Liên quan: `domains/bloodline.js` (tập người vẽ) · `domains/render.js` (vẽ) · `../tai-lieu/QUY-TAC-VE_V14.md` · bộ kiểm `../kiem-thu/`

## Luật chung
- **Chỉ còn MỘT cách xếp: BA KHỐI** `datBaKhoi()` (mục 4b, b128b). Cách cũ
  `datMoiKhoi()` + bốn lượt vá cùng nút Cũ/Mới đã gỡ 30/09/2026 theo yêu cầu
  chủ dự án — đọc lại bằng `git log -p`. Gỡ xong, 2.220 sơ đồ (cây 59 + 681,
  ba nấc đời) ra giống từng byte: `../kiem-thu/chup-bo-cuc.mjs`.
- **Chế độ CHỈ CHỮ** (việc 1, 30/09/2026): `domains/so-do-chu.js` chọn hàng
  ngang/dọc rồi gọi `computeLayout(..., {oHang})` — layout hỏi `rongHang()` ·
  `netHang()` · `nut.w/h` thay cho `RONG`/`CAO`/`MUC_NET`. ⚠ Sửa `layout.js`
  thì giữ nguyên HÌNH phép tính và chạy `chup-bo-cuc.mjs` trước/sau + `cmp`:
  chế độ ảnh phải giống từng byte. Đo: `../kiem-thu/do-che-do-chu.mjs` (bảng
  bề rộng chữ chụp từ Chrome) · nhìn: `../kiem-thu/xem-che-do-chu.mjs`.
  Chủ dự án chốt 30/09: KHÔNG nốt cụt · luật "đủ rộng" CHẶT (bề ngang không
  tăng chút nào) · khe riêng `O_CHU` 12/8/28 (layout đọc qua `KHE`/`KHE_VC`/
  `KHE_DOC`) · chữ dọc đọc TỪ TRÊN XUỐNG, bám ĐỈNH ô (quay +90°: đầu chữ
  hướng phải → dòng tên là cột PHẢI, năm cột trái). ⚠ Khe hẹp làm sơ đồ
  "mọi hàng dọc" hẹp hơn nên luật chặt nhận ít hàng ngang hơn — sơ đồ nhỏ có
  khi CAO lên (tâm P0012: 380×458 → 300×508); trung bình vẫn thấp đi.
  VẼ (1c, `render.js renderOChu()`): khung viền MỜ (chủ dự án GIỮ — "đây là
  chế độ chữ") · ngày giỗ theo công tắc · căn giữa: ngang = giữa cả hai
  chiều, dọc = các cột giữa theo bề ngang, chữ bám đỉnh · căn theo SỐ DÒNG
  THẬT: dòng trống không chừa chỗ. ⚠ Dòng nào có chỉ ở `utils/text.dongOChu()`
  — nơi ĐO (`so-do-chu.js`) và nơi VẼ cùng gọi; tự ghép chuỗi ở một bên là
  chữ tràn ô. Chụp bằng mã app thật: `../kiem-thu/xem-che-do-chu.mjs`.
  CHIỀU DÀI ô (chủ dự án 30/09): trần = bề rộng `O_CHU.tenChuan` (3 chữ × 6
  chữ cái = 120px); tên dài hơn XUỐNG DÒNG ở `so-do-chu.js ngatTen()`, ô ấy
  dày hơn — hàng dọc: bề rộng RIÊNG từng ô (`oHang().rieng` → `RIENG` ở
  layout, `layDai` cộng dồn bề rộng), hàng ngang: khung cao theo `nguoi.day`.
  Đo: 120px → 9/681 tên xuống dòng; tên trung vị 88px, 90% ≤ 103px.
- ⚠ **Không gãy chữ Z** (chủ dự án bác §9b/b85e, 25/09/2026): điểm thả của MỌI
  chùm nằm TRONG khoảng các con — chùm một con thì thẳng trên đầu con, cả ở
  khối con cháu (`khoiDuoi`, `xepDai`) lẫn khối tổ tiên (`treoToTien`). Đo:
  `node --import ./ba-khoi.mjs ../kiem-thu/do-b128b.mjs 2` — còn lệch chỉ là
  ca hai bên đều có ông bà (cặp hẹp hơn hai cặp cha mẹ), cha mẹ nuôi, U0180.

## Lỗi đã gặp — áp cho MỌI file trong "Gồm"
- **Dải nhiều vợ: điểm thả rơi ngoài đàn con** — U0064·U0071·U0074 (cây 681).
  Hai khe liền nhau cách 136px, hai đàn con kề nhau cách ≥148px → KHÔNG THỂ
  cùng khớp nếu dải cứng. Cách mới giãn dải đúng phần thiếu (`xepDai()`).
  ⚠ Phiên trước chẩn đoán nhầm là `canChumConVaoGiua` bỏ dở — lượt ấy bỏ qua
  hẳn cặp kề nhau, không bao giờ chạm ca này. Đọc mã trước khi tin chẩn đoán.
- **Người trung tâm văng ra mép, cha mẹ ở mép kia** — P0185. Ghép khối con
  theo BAO HÌNH chữ nhật: cả khối cháu chắt của người anh chắn chỗ cả những
  hàng cô không đứng. Cách mới ghép theo VIỀN TỪNG HÀNG (`canhPhai()`).
- **Người không con bị ép sát một bên** — bà Ảo P0349 (tâm P0228, cây 681).
  Ghép VIỀN (sửa P0185) cho bà trượt sát bà Sang, trống 456px về phía ông
  Huấn; cách cũ ghép HỘP nên bà đứng giữa, chủ dự án thấy đẹp hơn. Nay ghép
  viền xong thì khối GIỮA còn trống hai bên đứng giữa khoảng trống
  (`canVaoKhoangTrong()`) — P0185 vẫn đúng vì nó hết chỗ trống.
- **Union riêng của người được hấp thụ** (con ghi một mình mẹ, U0180) không
  thuộc dải nào → rơi lưới an toàn. Cách mới cho dải nhận union ấy.
- **LỖI DỮ LIỆU trông như lỗi vẽ** — U0180: Hạt, Thu ghi là con bà Hồi mà
  lấy chính con trai bà (U0108, U0109). Không cách xếp nào cho điểm thả nằm
  trong khoảng hai cô. Còn chờ chủ dự án sửa dữ liệu — đừng vá bằng mã.

- **Nốt cụt mọc sai hướng** — P0413 (U0182, hôn nhân chỉ một mình ông, con
  ẩn): mọc NGANG như thiếu vợ. Luật chủ dự án: nốt mọc theo hướng sơ đồ sẽ vẽ
  tiếp khi bấm người ấy làm trung tâm. Gốc: union một người hết con hiển thị
  thì không có trong `unionHT`, và `viTriNotCut()` đọc `!u` thành "thiếu bạn
  đời". **Luật chốt** (chủ dự án 25/09/2026, cây TH957): vợ/chồng ẩn → nốt
  NGANG; con ẩn → nốt XUỐNG; ẩn cả hai → vẽ **CẢ HAI nốt**, mỗi nốt đếm phần
  mình (`dungNotCut()` tách, `viTriNotCut()` đọc `sp.ep`). Đừng gộp thành một.
  Con đã xoá hoặc ở cây khác không tính (rào vẽ của cây) — ca lê tình thương.
- **Chỗ đứng nốt** (chủ dự án 25/09/2026): nốt NGANG sát vòng ảnh — trừ khi
  người ngoài cùng dải là bạn đời (bà Hoài, tâm P0010: sát vòng ảnh bà thì đọc
  thành nốt của bà). Nốt XUỐNG thẳng dưới người: nét từ đáy bảng tên, nốt sát
  đáy ô — có nét ngang chạy qua (nét bộ cha mẹ thứ hai) thì lùi về đáy khe
  (`netNgangCat()`). Nốt LÊN bỏ khi cha/mẹ của bộ ấy đang vẽ đủ — bỏ chọn
  dâu/rể từng làm MỌI con mọc nốt lên đè thanh ngang. Chụp cảnh ẩn dâu/rể:
  `AN_DAU_RE=1 node ../kiem-thu/xem-b128b.mjs …`.
- ⚠ **Dâu/rể = người KHÔNG CÙNG HUYẾT THỐNG với người trung tâm** (chủ dự án
  25/09/2026), tính bằng `tapHuyetThong()` (`utils/graph.js`). KHÔNG lọc theo
  "vùng biên" (`edge`): họ hàng xa lấy người trong họ đứng vùng biên mà vẫn là
  huyết thống — 6 lượt cây 59, 4 lượt cây 681 (P0468, P0471 tâm P0469) từng
  bị ẩn oan. Vợ/chồng của CHÍNH người trung tâm cũng ẩn — chủ dự án đã cân
  nhắc giữ lại rồi chốt ẩn (25/09/2026), đừng đổi.
- ⚠ **Hiện dâu/rể thì hiện ĐỦ**: `computeVisibleSet()` chỉ lấy vợ/chồng khi
  cặp CÓ CON đang vẽ, nên chọn "Con" mất hết dâu/rể của các con. Bù bằng bước
  hậu kỳ `themDauRe()` (`utils/graph.js`) — vợ/chồng mọi người `full` trừ tổ
  tiên. Không sửa `bloodline.js` (bản chép nguyên). Chụp theo đường của app:
  `DUOI=1 node ../kiem-thu/xem-b128b.mjs … ` (DUOI = số đời dưới).

## Bộ kiểm — cái bẫy
- ⚠ Bộ kiểm ở `../kiem-thu/` nhắm thẳng `giapha/` ĐÓNG BĂNG. Đo nhánh này
  bằng **`node kiem-thu/chay-supabase.mjs`** (b158): móc `sang-supabase.mjs`
  đổi cả `import`, `fs` lẫn máy chủ giả của bài Chrome sang `supabase/js/`.
  Nhóm 9b (bắt khuỷu, luật chủ dự án đã bác) gỡ khỏi `kiem-buoc-80` cùng lúc
  gỡ cách cũ. `ba-khoi.mjs` · `so-b128b.mjs` nay vô nghĩa (cờ không còn).

## Vì sao làm thế này
- Khối tính TỪ DƯỚI LÊN, mỗi khối trả điểm nối cạnh dưới (`noi`) → khối trên
  chỉ việc căn theo, không cần lượt vá sau (thuật toán chủ dự án tả, b128b).
- Nhìn bằng mắt: `../kiem-thu/xem-b128b.mjs <cây> <tâm> <đời> cu|moi` (nạp
  mã `supabase/`); so số: `../kiem-thu/so-b128b.mjs [đời]`.
