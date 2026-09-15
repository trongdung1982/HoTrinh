# b118e — Luật gọn: dọn rác và tiết kiệm token

*15/09/2026 21:54 → 22:05 · Opus*

## Việc đã làm

- `QUY-TAC-GON.md` (mới): rác là gì và chỗ đúng của nó · 8 luật ĐỌC · 8 luật
  VIẾT · trần, sổ nợ, khi nào dọn.
- `kiem-thu/do-gon.mjs` (mới) = `/kiem-tra` **phép 10**. Đo: ghi chú đầu file
  `js/` (≤ 30 dòng) · dòng / byte / dòng dài nhất của bốn file nạp mỗi phiên ·
  dòng dài trong `INDEX.md` · tài liệu sai quy ước tên · file mã không ai nhắc
  tên. Chỉ XEM: file mã > 1.500 dòng, dấu `TẠM`.
- `kiem-thu/moc-gon.json` (mới): sổ nợ, **34 khoản** lúc lập.
- Ba lệnh phiên: `/kiem-tra` thêm phép 10 · `/khoi-tao` lấy dòng cuối `INDEX`
  bằng `awk` thay vì đọc cả file · `/ket-thuc` xoá việc xong (không gạch ngang),
  đo `CHI-DAN` bằng script, không chép lịch sử phiên bản vào đầu file.
- `KE-HOACH.md`: xoá 8 dòng gạch ngang; thêm bước **b118f** (trả nợ file nạp mỗi
  phiên) trước b118d; thêm dòng *Còn treo* về `GEMINI.md`.

## Vì sao làm thế này

### Vì sao phải có script, khi luật chống phình đã có từ b112

Chủ dự án hỏi: có nên chia `khu-thanh-vien.js` để đỡ token không. Đo ra thì
chia file không phải chỗ tốn. Chỗ tốn là **rác**, và đo lại thấy luật b112 đã
bị lách ở cả bốn nơi nó đặt:

- `CHI-DAN.md` giữ đúng 78/80 dòng, nhưng một ô dài **1.488 ký tự**.
- `KE-HOACH.md` ghi *"xong rồi thì xoá"*, nhưng còn **8 dòng gạch ngang**.
- `INDEX.md` đặt 110 ký tự một dòng, nhưng **29 dòng** dài quá 250.
- Ghi chú đầu file theo khuôn 6 dòng, nhưng **28 file** quá 30 dòng —
  `person-edit.js` 212 dòng, gần hết là lịch sử phiên bản.

Không luật nào sai cả. Chúng chết vì không có phép đo: đếm dòng thì dòng dài ra,
còn "xoá việc xong" không ai kiểm thì gạch ngang cho nhanh. b112 đã rút ra
*"không sửa lệnh thì luật mới sống được đúng một phiên"*. Bước này đi thêm một
nấc: **không có phép đo trong lệnh thì luật chỉ sống tới lần đầu có người vội.**

### Vì sao đo bằng byte, không bằng dòng

Số dòng là thứ duy nhất đã có trần, và cũng là thứ đã bị lách. Byte gần với
token hơn, và không kéo dài ra được như một dòng.

### Vì sao sổ nợ chỉ được hạ, thay vì bắt trả hết ngay

Nếu 34 khoản đều là LỖI ngay hôm nay thì phép 10 đỏ suốt, và một phép đỏ suốt
thì người ta học cách lờ nó đi. Sổ nợ biến câu hỏi thành *"hôm nay có tệ hơn
hôm qua không"*: trả được thì `--ha-moc` khoá mức mới, còn **tăng thì đỏ**.
`--lap-moc` từ chối chạy khi đã có sổ, nên không có đường "lập lại cho xanh".

### Vì sao không cắt ghi chú đầu file ngay trong bước này

Cắt lịch sử là việc không lùi được bằng trí nhớ — mỗi dòng ⚠ phải có nơi trú
(b112). Làm cho 28 file cùng lúc là một phiên riêng, lại đụng mã giữa lúc b118d
đang chuyển khu. Nên chọn luật **D1**: sửa file nào thì trả nợ đầu file ấy,
đằng nào cũng đã mở nó ra.

### Vì sao b118f đứng trước b118d

Nợ ở `KE-HOACH.md` (21,5 KB) và `CHI-DAN.md` (9,7 KB) phải trả lại **mỗi phiên**.
b118d còn bốn khu, tức ít nhất bốn phiên. Thứ tự chủ dự án chốt 14/09 cũng đặt
*"rà soát chống phình"* lên đầu. Chủ dự án muốn đổi thứ tự thì chỉ việc dời
một dòng.

### Vì sao không tách `khu-thanh-vien.js` bây giờ

Chỗ cắt tự nhiên có sẵn: dòng 1771–1953 là mẩu vẽ chung năm file dùng, và dòng
1374–1770 là phần đơn đề xuất. Nhưng b118d sắp xoá mã tạm, khu Quản trị sẽ tự
nhỏ đi; tách bây giờ là tách luôn phần sắp bỏ. Luật V7 ghi việc tách vào sau
khi xong đợt đang làm, và phải hỏi trước.

## Đã thử mà hỏng

- **Viết `tail -n 3` để lấy dòng cuối `INDEX.md`** vào ba file. Sai: file kết
  thúc bằng mục *Quy tắc giữ nhật ký gọn*, không kết thúc bằng bảng. Đã đổi sang
  `awk` lọc giữa `## Các bước` và heading kế tiếp, chạy thử ra đúng dòng b118c.
  Nếp: **lệnh ghi vào tài liệu phải chạy thử trước khi ghi.**
- **Đo độ dài dòng bằng `awk` ra 1.808 và 881** — `awk` trên máy này đếm byte,
  chữ Việt có dấu 2–3 byte một chữ. Đếm bằng Node thì ra 1.488 và 710. Đã sửa số
  trong tài liệu. Nếp: đo chữ Việt bằng Node, không bằng `awk length`.
- **Script đếm thừa một dòng** (4.118 so với `wc -l` ra 4.117) vì dấu xuống
  dòng cuối file mở thêm một phần tử rỗng. Sửa trước khi lập sổ.
- Sửa `CHI-DAN.md` lần đầu đẩy file lên **81 dòng**. Rút phần kể chuyện `MUC-LUC`
  590 dòng thành nửa câu, về lại 78.

## Kiểm chứng ngược

Hạ tay khoản `person-edit.js` trong sổ từ 212 xuống 211 → phép 10 báo
**LỖI: 1 · "nợ cũ 211, đã TĂNG"**, mã thoát 1. Trả sổ về bản sao lưu, md5 khớp,
chạy lại ra mã 0. Chạy `--lap-moc` lần hai → *TỪ CHỐI*, mã 2.

## Còn treo

- **b118f** — trả nợ `KE-HOACH.md` · `CHI-DAN.md` · `MEMORY.md` (mục trong
  `KE-HOACH.md`).
- 28 file nợ ghi chú đầu file — trả theo D1.
- `GEMINI.md` còn ghi *"7 phép"*; Antigravity chưa biết phép 10.
- Hai tài liệu sai quy ước tên: `KE-HOACH-HA-TANG-Supabase_V01.md` (nhiều file
  trỏ tới) và `khoi-tao-du-an-moi v2.md` (mẫu lệnh cho claude.ai, không thuộc
  app). **Hỏi chủ dự án** trước khi đổi tên hay chuyển ra ngoài repo.
- Bảng *Các bước* của `INDEX.md` đã quá 40 dòng, vượt luật gộp của chính file
  ấy. Chưa gộp — gộp là sửa dòng cũ, cần làm theo cách an toàn riêng.

## File đã đụng tới

| | File |
|---|---|
| **Mới** | `QUY-TAC-GON.md` · `kiem-thu/do-gon.mjs` · `kiem-thu/moc-gon.json` · `nhat-ky/b118e-luat-gon.md` |
| **Sửa** | `CHI-DAN.md` · `KE-HOACH.md` · `KIEN-TRUC.md` (9 → 10 phép) · `nhat-ky/INDEX.md` (thêm một dòng) |
| **Sửa, ngoài repo** | `../CLAUDE.md` 1.3.0 → 1.4.0 (mục 6, 8) · `../.claude/commands/kiem-tra.md` · `khoi-tao.md` · `ket-thuc.md` |
| **Không đụng** | mọi file trong `js/` |
