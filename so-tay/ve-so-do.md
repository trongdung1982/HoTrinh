# Sổ tay · vẽ sơ đồ (bố trí toạ độ)

Gồm      : `js/domains/layout.js` — tính toạ độ ô, điểm thả, nét · `js/pages/tree-view.js` — nút Cũ/Mới chọn cách xếp
Liên quan: `domains/bloodline.js` (tập người vẽ) · `domains/render.js` (vẽ) · `../tai-lieu/QUY-TAC-VE_V14.md` · bộ kiểm `../kiem-thu/`

## Luật chung
- **Hai cách xếp nằm cạnh nhau** (b128b): cũ `datMoiKhoi()` + bốn lượt vá · mới
  `datBaKhoi()` (mục 4b). App mặc định MỚI; nút mờ dưới 🔍 đổi qua lại, nhớ ở
  `localStorage` (`giapha.xepBaKhoi`). ⚠ **Chỉ gỡ nút / cách cũ khi chủ dự án
  yêu cầu** (chốt 25/09/2026). Bộ kiểm: `LAYOUT.xepBaKhoi` (config) — bật
  bằng `--import ./ba-khoi.mjs`.
- Chùm MỘT con được gãy khuỷu (nhóm 9b). Chùm ≥2 con: điểm thả phải nằm TRONG
  khoảng các con — đo bằng `../kiem-thu/do-b128b.mjs [đời]`.

## Lỗi đã gặp — áp cho MỌI file trong "Gồm"
- **Dải nhiều vợ: điểm thả rơi ngoài đàn con** — U0064·U0071·U0074 (cây 681).
  Hai khe liền nhau cách 136px, hai đàn con kề nhau cách ≥148px → KHÔNG THỂ
  cùng khớp nếu dải cứng. Cách mới giãn dải đúng phần thiếu (`xepDai()`).
  ⚠ Phiên trước chẩn đoán nhầm là `canChumConVaoGiua` bỏ dở — lượt ấy bỏ qua
  hẳn cặp kề nhau, không bao giờ chạm ca này. Đọc mã trước khi tin chẩn đoán.
- **Người trung tâm văng ra mép, cha mẹ ở mép kia** — P0185. Ghép khối con
  theo BAO HÌNH chữ nhật: cả khối cháu chắt của người anh chắn chỗ cả những
  hàng cô không đứng. Cách mới ghép theo VIỀN TỪNG HÀNG (`canhPhai()`).
- **Union riêng của người được hấp thụ** (con ghi một mình mẹ, U0180) không
  thuộc dải nào → rơi lưới an toàn. Cách mới cho dải nhận union ấy.
- **LỖI DỮ LIỆU trông như lỗi vẽ** — U0180: Hạt, Thu ghi là con bà Hồi mà
  lấy chính con trai bà (U0108, U0109). Không cách xếp nào cho điểm thả nằm
  trong khoảng hai cô. Còn chờ chủ dự án sửa dữ liệu — đừng vá bằng mã.

## Vì sao làm thế này
- Khối tính TỪ DƯỚI LÊN, mỗi khối trả điểm nối cạnh dưới (`noi`) → khối trên
  chỉ việc căn theo, không cần lượt vá sau (thuật toán chủ dự án tả, b128b).
- Nhìn bằng mắt: `../kiem-thu/xem-b128b.mjs <cây> <tâm> <đời> cu|moi` (nạp
  mã `supabase/`); so số: `../kiem-thu/so-b128b.mjs [đời]`.
