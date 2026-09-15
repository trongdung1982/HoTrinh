# QUY TẮC GỌN — dọn rác, tiết kiệm token, ghi theo chức năng

*Nhánh Supabase · lập 15/09/2026 (b118e) · sửa 15/09/2026: mục 5 sổ tay · đo bằng `kiem-thu/do-gon.mjs`*

⚠ **Không đọc file này mỗi phiên.** Đọc khi: gặp lỗi hoặc điều đáng chú ý cần
ghi lại, sắp viết ghi chú đầu file, `/kiem-tra` phép 10 báo LỖI, hoặc sắp đọc
trọn một file dài.

## 0. Vì sao có file này

Luật chống phình có từ b112 nhưng bị lách, vì không ai đo. Đo lại ngày
15/09/2026: `CHI-DAN.md` giữ đúng 78/80 dòng nhưng một ô dài **1.488 ký tự** ·
`KE-HOACH.md` còn **8 dòng** gạch ngang · **29 dòng** `INDEX.md` dài quá 250 ký
tự · **28 file** mã có ghi chú đầu file quá 30 dòng, gần hết là lịch sử phiên
bản. Và **899 dòng ⚠** rải trong mã — cùng một lỗi ghi ở năm nơi mà vẫn xảy ra
hai lần.

Nên mọi luật dưới đây có phép đo, chạy ở `/kiem-tra` phép 10; và ghi chép đổi
từ **theo phiên** sang **theo chức năng** (mục 5).

## 1. Rác là gì, và chỗ đúng của nó

| Rác | Chỗ đúng |
|---|---|
| Chuyện *"phiên này làm gì"* | lời commit (`git log`) |
| Lịch sử phiên bản trong ghi chú đầu file mã | lời commit |
| Cùng một lỗi / lời dặn ghi ở nhiều file | **một** mục trong `so-tay/<chức-năng>.md` |
| Việc đã xong còn trong `KE-HOACH.md` (kể cả gạch ngang) | xoá — `git log` giữ |
| Lời giải thích dài trong một ô `CHI-DAN.md` | sổ tay hoặc file mà ô ấy trỏ tới |
| Dấu `TẠM` mà bước gỡ nó đã đóng | gỡ — hoặc ghi vào *Còn treo* |
| File mã không ai `import`, khối CSS/HTML không ai dùng | xoá — **hỏi trước** (`CLAUDE.md` mục 9) |
| Tài liệu tên `_Vxx` hoặc có dấu cách trong `supabase/` | tên cố định, hoặc ra ngoài repo — **hỏi trước** |

**KHÔNG phải rác, và KHÔNG sửa:** `nhat-ky/` — kho lưu trữ b87 → b118e, **đóng
15/09/2026**, không thêm, không sửa, không đọc đầu phiên · `BAT-DAU.md` · 10
file `domains/` chép nguyên *(phép 9)* · `js/vendor/` · dòng ⚠ còn hiệu lực mà
chưa có chỗ trú khác.

## 2. Luật ĐỌC — ít token nhất cho cùng một hiểu biết

- **Đ1. Mở phiên chỉ nạp đúng thứ `/khoi-tao` ghi.** Không đọc `nhat-ky/`.
- **Đ2. Tìm rồi mới đọc.** `Grep` tên hàm / tên mục → `Read` có `offset` +
  `limit`. Đọc trọn chỉ khi file dưới ~300 dòng hoặc sắp viết lại phần lớn nó.
- **Đ3. Sắp sửa file có dòng `Sổ tay:` thì đọc sổ tay ấy trước** — nó thay cho
  việc lục nhật ký và đọc ghi chú rải rác.
- **Đ4. Tài liệu dài đọc theo MỤC** `CHI-DAN.md` chỉ. Tra chuyện cũ: `Grep`
  trong `nhat-ky/` hoặc `git log --grep`.
- **Đ5. Đầu ra lệnh phải ngắn** — `wc`, `grep -c`, `head`, `cut -c1-200`. Bộ
  kiểm in phép **hỏng**, không in hàng trăm dòng ĐẠT.
- **Đ6. Không đọc lại file vừa sửa** để kiểm — kiểm bằng bộ kiểm, phép đo.
- **Đ7. Rà việc Antigravity bằng `git diff --stat`** rồi diff từng file.
- **Đ8. Ảnh chụp là thứ tốn nhất.** Nhìn đúng ảnh của khu vừa đổi. *Vẫn phải
  nhìn* — bộ kiểm chữ không thấy hình xấu.

## 3. Luật VIẾT — không đẻ thêm rác

- **V1. Ghi chú đầu file trong `js/` ≤ 30 dòng.** Khuôn 6 dòng (`CLAUDE.md`
  mục 6) + dòng `Sổ tay:` nếu có + điều người sửa file **hôm nay** phải biết.
  Dòng `Phiên bản` chỉ nói bản mới nhất.
- **V2. File đọc mỗi phiên** (`CLAUDE.md` · `MEMORY.md` · `CHI-DAN.md` ·
  `KE-HOACH.md`) chỉ giữ **hiện trạng + luật đang sống**.
- **V3. Ô `CHI-DAN.md`** = file nào · mục nào · tối đa một ⚠ ngắn.
- **V4. Việc xong thì XOÁ dòng** trong `KE-HOACH.md`, cả bảng *Thứ tự làm*.
- **V5. Giàn giáo tạm ghi `TẠM (bXXX)`** — bXXX là bước sẽ gỡ nó.
- **V6. Một khu một file.** File mã quá 1.500 dòng thì ghi vào *Còn treo*,
  tách khi đợt đang làm đã xong, và hỏi trước.
- **V7. Dòng `MEMORY.md` ≤ 250 ký tự.** Ký ức giữ lỗi của **máy và công cụ**
  (git, Chrome, Dropbox, Bash); lỗi của **phần mềm** vào sổ tay.

## 4. Trần, sổ nợ, và DỌN DẦN KHI CHẠM

**Trần** nằm ở đầu `kiem-thu/do-gon.mjs` — một chỗ. **Sổ nợ**
`kiem-thu/moc-gon.json` = mọi chỗ đã vượt trần lúc lập sổ.

| Kết quả | Nghĩa |
|---|---|
| **LỖI** | vượt trần ở chỗ chưa có nợ, hoặc nợ cũ **tăng** → không được báo xong |
| **NỢ CŨ** | vượt từ trước và chưa tăng → vẫn ĐẠT |

Sổ chỉ được **hạ** (`--ha-moc`), không thêm, không nâng, **không sửa bằng tay**.

⛔ **Không mở đợt rà soát toàn bộ.** Chủ dự án chốt 15/09/2026: *"không nên ôm
đồm làm 1 lần mà từ từ. Bắt đầu từ bước sắp tới, những chỗ đã qua cứ để đó."*

- **D1. Sửa file nào thì dọn file ấy** — trả nợ ghi chú đầu file, rút gọn đúng
  đoạn mình đang sửa trong `KE-HOACH.md` / `CHI-DAN.md`. Chỗ không chạm tới để
  nguyên.
- **D2. `/ket-thuc`** xoá việc xong khỏi `KE-HOACH.md`.
- **D3. Thấy rác ở chỗ không liên quan việc đang làm** thì để đó.

**Cắt an toàn:** xoá một dòng ⚠ chỉ khi ý của nó **đã nằm** ở sổ tay hoặc chỗ
trú khác còn sống — kiểm bằng mắt từng dòng, không cắt lướt.

## 5. Sổ tay theo chức năng — ghi dần khi gặp

- **S1. Chỉ ghi khi việc đang làm gặp lỗi hoặc điều đáng chú ý.** Không tạo sổ
  tay trước cho đủ bộ, không đi gom chuyện cũ.
- **S2. Gặp lỗi A** → xác định A liên quan những file nào (x, y, z…) → ghi A vào
  `so-tay/<chức-năng>.md` → **xoá dấu vết của A** ở những file đã đọc thấy nó
  (ghi chú trong mã, `KE-HOACH.md`, `CHI-DAN.md`, `THIET-KE-*.md`) → đầu mỗi
  file mã liên quan thêm dòng `// Sổ tay   : so-tay/<chức-năng>.md`.
- **S3. Không rà cả phần mềm tìm thêm dấu vết của A.** Chỗ chưa thấy để nguyên;
  lần sau chạm tới thì gộp nốt. *(Riêng `nhat-ky/` không bao giờ sửa.)*
- **S4. Tên sổ theo chức năng** (`bang-quyen.md`, `cua-may-chu.md`), không theo
  bước hay ngày. Một điều chỉ ở **một** sổ; điều áp cho nhiều chức năng vào
  `so-tay/chung.md`. Sổ vượt 12 KB thì tách chức năng nhỏ hơn.
- **S5. Việc của phiên nằm ở lời commit** — việc đã làm · chưa chạy thật · sổ
  tay nào đổi. Không viết `nhat-ky/bXX-*.md` nữa.

**Khuôn một sổ tay:**

```
# Sổ tay · <chức năng>

Gồm      : <file> — <làm gì, một dòng> · <file> — …
Liên quan: <chức năng / file / bảng SQL nó gọi hoặc bị gọi>

## Luật chung
- …

## Lỗi đã gặp — áp cho MỌI file trong "Gồm"
- **<tên ngắn>** — triệu chứng · nguyên nhân · cách tránh · phép kiểm bắt nó

## Vì sao làm thế này
- …
```
