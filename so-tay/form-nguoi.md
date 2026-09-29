# Sổ tay — Form thêm/sửa người (`pages/person-edit.js`)

*Dời từ ghi chú đầu file `person-edit.js` ngày 29/09/2026 (210 → 21 dòng).
Mã trích "luật N" là trích đúng số ở đây — đừng đánh số lại.*

Form HIỆN ĐỦ MỌI Ô, kèm chữ mờ gợi ý. Thẻ thông tin ẩn hàng trống vì nó KỂ về
một người; form thì HỎI, mà câu hỏi không hiện ra thì không ai trả lời được.

## Lưu và rà (luật 1–3)

1. **Thứ được rà phải đúng là thứ được ghi.** Bản ghi mới tính đúng MỘT lần
   bằng `updatePerson()`, dùng lại cho cả phép rà lẫn lần ghi. Tính hai lần là
   mở khe cho một lỗi gõ phím lọt qua phép rà rồi rơi xuống máy chủ.
2. **Rà trên cây mới, chỉ mục mới.** `validateAll(..., 'person')` chỉ soi hai
   cái ngày của chính người đó; phép soi QUAN HỆ đọc `index` và vẫn thấy năm
   sinh CŨ. Nên dựng cây mới, `buildIndex()` lại, rồi mới rà.
3. **Giao diện chỉ đổi sau khi máy chủ xác nhận.** Form không đụng `state.tree`;
   `repo.luuCay()` nhận hàm sửa và tự lo. Máy chủ lắc đầu thì màn hình vẫn đúng
   bản cũ, không có gì phải lùi.

⚠ **Chín luật rà soát chỉ chạy ở trình duyệt** (`domains/validate.js`). Máy chủ
(`luu_cay()`) gác quyền và rào cây, KHÔNG chạy lại chín luật — chép chúng sang
SQL là dựng bản thứ hai, và hai bản sẽ trôi lệch nhau. Hệ quả nói thẳng: người
có quyền sửa gọi thẳng máy chủ (không qua app) vẫn qua mặt được chín luật.

## Thêm người (luật 4–7)

4. **Một lần Lưu, không phải hai.** Thêm con = tạo người + (đôi khi) tạo cặp +
   nối con vào cặp — cả ba đi trong ĐÚNG MỘT lần `luuCay()`. Lưu nửa chừng là
   để lại một người lơ lửng hoặc một cặp vô hình.
5. **Rà cả hai câu hỏi.** `validateAll(…, 'person')` hỏi *"bản ghi ổn không"*,
   `validateAll(…, 'child')` hỏi *"mối nối ổn không"*. Gọi cả hai, lời trùng
   gộp lại bằng `gopRaSoat` trước khi hiện.
6. **Lời nhắc của riêng form** (`loiNhacCuaForm`) khi bấm thêm mà chưa gõ chữ
   tên nào. Nó KHÔNG phải phép rà thứ mười — chín luật chỉ sống ở
   `validate.js`; đây là lời của màn hình, và nó nói rõ mình là ai.
7. **Thứ tự anh chị em có BA lựa chọn**: vẫn thêm · thêm và sắp lại theo tuổi ·
   huỷ. Không chặn (con vợ cả chép trước con vợ thứ là lệ có thật), không tự
   sắp. Phép sắp chạy TRƯỚC phép rà — luật 1.

## Xoá, nối, gỡ nối (luật 8–10)

8. **Xoá thì phải kể tên hậu quả, và hậu quả đọc từ cây MỚI.** Dựng cây đã xoá,
   `buildIndex()` lại, so hai bên — đoán bằng chỉ mục cũ là đoán sai. Một dòng
   gọi đúng tên (*"xoá xong thì bà Nhàn không còn nối với ai"*) mới là thứ
   người ta dừng lại đọc.
9. **Quan hệ cha mẹ – con đi qua CẶP, không nối thẳng người với người.** Gỡ một
   người khỏi hàng vợ/chồng của cặp còn con ⟹ người ấy thôi làm cha/mẹ của mọi
   con cặp ấy. Gỡ "cha" thì không giữ được "mẹ". Nên màn hình kể cha mẹ theo
   CẶP, một nút = một việc. Bỏ hôn nhân mà giữ quan hệ cha con = đổi `status`
   (`'divorced'`), không đổi `partners`.
10. **Gỡ xong phải hỏi tiếp *"cặp này còn khẳng định được gì không?"*** —
    `union.conLyDoTonTai()`. Câu trả lời là không thì cả cặp bị xoá mềm theo,
    và hộp xác nhận phải KỂ RA trước khi làm.

## Sửa quan hệ đã có (luật 11)

11. **Khối Quan hệ SỬA quan hệ đã có, không thêm và không bớt.** Chỉ đổi chữ
    trong mục đã có — `children[].relation`, `union.status`, `union.ranks` —
    nên không lần nào phải hỏi câu của luật 10.
    - `status` và thứ bậc sửa được từ HAI cửa (form Sửa cặp + khối này), và
      chỉ được vì cả hai gọi ĐÚNG MỘT hàm `union.updateUnion()`.
    - ⚠ Thứ bậc sửa ở đây luôn khoá theo NGƯỜI đang mở màn hình (`mocId`) —
      `DAC-TA-RANK_V01.md`. "Thứ mấy" chỉ có nghĩa từ MỘT phía.
    - ⚠ `relation` thuộc về CẶP, không thuộc về người: đổi từ phía cha thì thẻ
      của cả con cũng đổi — đúng, không phải lỗi.
    - ⚠ Đánh dấu sai là TẮT phép rà, không phải báo lỗi: `validate.js` bỏ qua
      phép rà tuổi với quan hệ khác `'birth'`. Nên mặc định mọi ô chọn là thứ
      ĐANG LƯU, không bao giờ là giá trị app tự đoán.

## Hỏi thứ bậc lúc nhập (luật 12)

12. **Cuộc hôn nhân thứ hai phải được HỎI, không được đoán — và chỉ hỏi khi nó
    là thứ hai.** Ô mọc ra trong form / hộp Kết nối chỉ với người ĐÃ đứng
    trong ít nhất một cặp khác (lần đầu thì không hỏi).
    - ⚠ Số điền sẵn (*"số cặp đang có + 1"*) là GỢI Ý, ô để mở: gia phả cũ chép
      thứ bậc theo lệ, có nhà bà cưới sau vẫn là chính thất.
    - ⚠ Hỏi theo TỪNG người, có thể hai ô trong một hộp (nối hai người đều đã
      có cặp) — vợ 1/vợ 2 của A có thể cùng thời, chồng 1/chồng 2 của C là nối
      tiếp; cùng con số, hai nghĩa, chỉ chứa nổi khi con số gắn với NGƯỜI.
      Bài nghiệm thu: ví dụ A–B–C–D (`kiem-thu-bac-nhap.mjs`).
    - ⚠ Gõ sai thì không đoán hộ: ghi thứ 1 và kể ra trong khối cảnh báo
      (`loiThuBacGoSai`), cùng luật ô Đời.

## Ba hộp thoại kiểu My Family Tree (luật 13)

13. **Câu hỏi về chỗ nối nằm TRONG chính form, không đứng trước, không đứng
    sau.** Chủ dự án chốt từ ba ảnh My Family Tree
    (`tai-lieu/anh/My Family Tree - them *.png`): thêm một người là MỘT màn
    hình, mọi câu hỏi hiện cùng lúc, sửa lại được trước khi bấm. Hỏi trước form
    thì chọn nhầm phải đóng mở lại; hỏi sau khi bấm thì *một cửa canh đặt SAU
    khi người ta đã quyết thì không canh gì cả*. Nút "Nối vào cặp sẵn có" chỉ
    còn cho cặp một người CHƯA có con — cặp mà khối trong form không kể.
    - ⚠ Thêm vợ/chồng: ô tích vẽ theo TỪNG người con (như ảnh), nhưng nhận theo
      CẢ CẶP (luật 9) — tích một ô là tích cả nhóm và nói ra vì sao.
    - ⚠ Con của cặp đã đủ hai người: chỉ KỂ, không cho tích (`addPartner`
      không nhét được người thứ ba).
    - ⚠ Đổi chỗ nối là xoá mọi câu trả lời đã cho: `daXemCanhBao` ·
      `daXemThuTu` · `sapXepLai` về `false`, ô thứ bậc vẽ lại.
    - Ô chọn quan hệ con đủ NĂM mã (`QUAN_HE_CON_NHAN`), không còn ô tích
      "con nuôi" — ở cả ba cửa: thêm con · thêm cha/mẹ · hộp Kết nối.

## Cấu trúc file

- Nền dùng chung (`N`, `o`, hộp, nút, ô nhập, ghi) ở `pages/form-nen.js` từ
  đợt 7 (b158). Màn hình mới → một file `form-*.js` riêng, đừng thêm vào đây.
- Biến `let` mới của form người phải thêm vào `donDepNguoi()` — nền dọn nó qua
  `dangKyDonDep`; quên thì trạng thái sống sót qua lần đóng hộp.
