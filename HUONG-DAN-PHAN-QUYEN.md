# Hướng dẫn phân quyền — dành cho chủ dự án

*Cập nhật 21/09/2026 · Thao tác trên trang Quản trị thay cho SQL Editor (b106) · Tên mục và tên vai trò đã soi lại đúng giao diện b118d · Luật trực hệ + hàng chờ duyệt*

> File này viết cho người **không lập trình**. Mỗi bước ghi rõ bấm gì, và
> ghi rõ **nhìn thấy gì thì biết là xong**.
>
> Luật này thay hẳn ý tưởng "chia chi/nhánh" treo từ 24/08/2026. Vì sao đổi,
> và các con số dẫn tới quyết định: `luoc-do/06-quyen-truc-he.sql` mục 1.

---

## 1. Luật, nói bằng tiếng thường

Một tài khoản muốn **sửa** gia phả thì phải qua hai cửa:

1. **Gắn với một người cụ thể** trong gia phả — "tài khoản này là ông A, mã `P0012`".
2. **Được quản trị viên duyệt.**

Qua đủ hai cửa rồi thì người ấy sửa được **trực hệ** của mình:

| Hướng | Sửa được ai |
|---|---|
| **Lên** | Bố mẹ, ông bà, cụ, kỵ… — **chỉ đường thẳng**, không sang bác/chú/cô/dì |
| **Xuống** | Toàn bộ con, cháu, chắt… không giới hạn đời |
| **Cộng** | Vợ/chồng của những người trên — sửa được **và thêm mới được** |

Chưa gắn mã, hoặc chưa được duyệt → **chỉ xem**, và xem được **toàn bộ** gia phả.

**Ba điều nên biết trước khi có người thắc mắc:**

- **Không ai sửa được anh chị em ruột của mình.** Em ruột không phải tổ tiên,
  cũng không phải con cháu. Muốn sửa thì nhờ bố (bố là trực hệ của cả hai),
  hoặc nhờ quản trị viên. Đây là điều bạn đã biết và vẫn chọn — không phải lỗi.
- **Luật chạy hai chiều.** Con cháu sửa được hồ sơ của bạn, vì bạn nằm trong
  đường trực hệ của họ. Nhờ vậy hồ sơ các cụ đã mất vẫn có người chăm.
- **Quản trị gia phả sửa được tất cả**, và gắn được cho **nhiều tài khoản**.

---

## 2. Cài đặt lần đầu — dán HAI file, đúng thứ tự

⚠ **Phải dán cả hai.** Dán file thứ nhất mà quên file thứ hai thì
**không ai lưu được gì nữa** — kể cả bạn. (Đó là cố ý: hỏng đằng cấm chứ
không hỏng đằng cho qua. Dán nốt file thứ hai là hết.)

**Bước 1.** Mở Supabase → bảng bên trái chọn **SQL Editor** → nút **New query**.

**Bước 2.** Mở file `supabase/luoc-do/06-quyen-truc-he.sql` bằng Notepad →
`Ctrl+A` → `Ctrl+C` → dán vào ô SQL Editor → bấm **Run**.

*Xong đúng khi:* hiện một bảng 3 dòng, cột `gia_tri` khớp cột `mong_doi`:

| muc | gia_tri | mong_doi |
|---|---|---|
| cot moi | 2 | 2 |
| vai quan tri nhan duoc | co | co |
| ham pham_vi_sua | 1 | 1 |

**Bước 3.** Bấm **New query** lần nữa. Mở `supabase/luoc-do/03-ham-luu-cay.sql`
→ `Ctrl+A` → `Ctrl+C` → dán → **Run**.

*Xong đúng khi:* hiện `Success. No rows returned`.

---

## 3. Gắn mã người, duyệt đơn và đổi vai trò — làm trên màn hình Quản trị

⚠ **KHÔNG dùng SQL Editor để gõ lệnh `update` nữa.** Trước b106, app chưa có
màn hình quản lý nên phải gõ SQL thủ công. Từ b106, toàn bộ việc duyệt đơn,
gắn mã người, đổi vai trò và bật tin cậy **được làm trực tiếp trên giao diện
trang Quản trị (`QuanTri.html`)**. Thao tác trên giao diện vừa nhanh, vừa được
máy chủ kiểm tra bảo đảm toàn vẹn dữ liệu (không gắn trùng mã người, không tự
đổi vai trò của chính mình, đúng thẩm quyền chủ cây / Quản trị hệ thống).

### Các bước thao tác trên giao diện:

1. **Mở trang Quản trị**: trên thanh menu hoặc Cài đặt, bấm **Quản trị**
   (địa chỉ `…/QuanTri.html`). Bấm **Gia phả**, chọn cây cần thao tác.
2. **Duyệt đơn xin vào** — *nhận người vào cây*:
   - Bấm mục **Đơn xin vào** ở thanh bên trái *(số bên cạnh là số đơn đang chờ)*.
   - Mỗi đơn có đúng hai nút: **Duyệt** và **Từ chối**. Bấm xong hiện một hộp
     hỏi lại, và **trong hộp ấy có ô *Mã người trong sơ đồ***.
   - **Điền mã** (ví dụ `P0012`) → họ vừa xem được, vừa sửa được trực hệ của
     người ấy. **Để trống** → chỉ xem. Bảng ở ngoài không có ô này; nó chỉ
     hiện trong hộp sau khi bấm Duyệt.
   - Duyệt cấp quyền cho **đúng cây ấy**, không lan sang cây khác.
   - Nút Duyệt mờ đi nghĩa là bạn không có thẩm quyền: duyệt đơn là việc của
     **chủ gia phả** và **Quản trị hệ thống**.
3. **Cho quyền sửa, gắn mã người, đổi vai trò** — mục **Thành viên & quyền**:
   - Cột **Quyền** là một dòng chữ bấm được (ví dụ *Khách*). Bấm vào nó để
     **đổi vai trò**: *Quản trị gia phả* · *Thành viên* · *Khách*.
   - Cuối mỗi dòng là nút **Chọn hành động**, mở ra:
     - **Gắn / đổi mã người** — nối tài khoản với một người trong sơ đồ. Gắn
       rồi thì họ sửa được trực hệ của người ấy; để trống thì chỉ xem.
     - **Bật tin cậy (ghi thẳng)** / **Tắt tin cậy (ghi thẳng)** — bật thì
       người ấy ghi thẳng, không qua hàng chờ duyệt nội dung.
     - **Bàn giao chủ sở hữu** — trao cây cho người khác.
     - **Xóa khỏi gia phả** — gỡ hẳn quyền truy cập cây này.
   - Mục nào mờ thì rê chuột vào sẽ hiện câu vì sao.

⚠ **Một người trong gia phả chỉ gắn được với một tài khoản.** Gắn `P0012` cho
người thứ hai thì máy chủ từ chối. Đó là chủ ý: nếu không, hai người cùng nhận
mình là một cụ và cả hai cùng sửa được trực hệ của cụ, mà không có gì bất thường
hiện lên màn hình.

⚠ **Luật "không ai tự đặt quyền cho chính mình":** trên dòng của chính bạn,
chữ Quyền và các mục trong nút **Chọn hành động** đều mờ sẵn kèm lý do — chủ gia phả
hay Quản trị hệ thống cũng không tự hạ hay tự nâng vai trò mình được. Muốn gắn
mã người cho chính mình thì dùng mục **Đề xuất mã người cho mình**, rồi một
Quản trị hệ thống **khác** duyệt.

### Bảng phân định vai trò trong gia phả:

| Hạng | Mã trong bảng | Sửa dữ liệu | Duyệt nội dung | Duyệt đơn · Đổi vai trò · Gắn mã |
|---|---|---|---|---|
| **Quản trị hệ thống** | `quan_tri_he_thong` | ghi thẳng | ✓ | ✓ (mọi cây) |
| **Chủ cây** *(cột chu_so_huu)* | `quan_tri` hoặc `sua` | ghi thẳng | ✓ | ✓ (cây của mình) |
| **Quản trị gia phả** | `quan_tri` | ghi thẳng | ✓ | ✗ |
| **Thành viên** | `sua` | theo trực hệ, chờ duyệt | ✗ | ✗ |
| **Khách** | `xem` | ✗ | ✗ | ✗ |

- **Quản trị gia phả (`quan_tri`)** là người kiểm duyệt nội dung của cây, **không**
  phải người quản trị hệ thống và không đổi được quyền thành viên khác.
- **Chủ cây (`chu_so_huu`)** là người lập ra cây, nắm toàn quyền phân quyền trên cây đó.

---

## 4. Xem hiện ai đang có quyền gì

Cách xem nhanh và chuẩn xác nhất là mở trang **Quản trị** → **Gia phả** → chọn
cây → mục **Thành viên & quyền**. Bảng hiển thị đầy đủ mọi tài khoản, vai trò,
mã người được gắn, trạng thái duyệt và cờ tin cậy.

Nếu cần tra cứu trực tiếp bằng SQL trong **SQL Editor** (chỉ để kiểm tra tầng dữ liệu):

```sql
select m.email, m.role, m.person_id, m.approved,
       coalesce(p.names->0->>'given', '') as ten_nguoi_duoc_gan
  from public.tree_members m
  left join public.persons p on p.id = m.person_id   -- mã người duy nhất mọi cây (`26`)
 where m.tree_id = (select id from public.trees where tree_code = 'NTB')
 order by m.role, m.email;
```

Đọc bảng ấy: `approved = false` **hoặc** `person_id` trống → người đó **chỉ xem
được**, dù cột `role` ghi `sua`.

---

## 5. Khi có người báo "tôi không sửa được"

Hỏi họ **câu báo lỗi hiện trên màn hình**, rồi tra bảng này:

| Câu họ thấy | Nghĩa là | Cách gỡ |
|---|---|---|
| *"chưa được gắn với một người trong gia phả, hoặc quản trị viên chưa duyệt"* | Chưa qua cửa 1 hoặc cửa 2 | Vào trang Quản trị duyệt đơn hoặc gắn mã người (mục 3) |
| *"Người P00xx không thuộc trực hệ của bạn"* | Đúng luật, không phải lỗi | Nhờ người khác trong trực hệ, hoặc nhờ quản trị viên |
| *"Hôn nhân U00xx ngoài trực hệ của bạn"* | Họ đang cố thêm/bớt con của một cặp không thuộc trực hệ họ | Như trên |
| *"Bạn chỉ có quyền xem gia phả này"* | Vai là `xem` | Vào trang Quản trị đổi vai sang Thành viên (`sua`) và gắn mã người (mục 3) |
| *"Người khác vừa sửa gia phả trong lúc bạn đang mở"* | Không liên quan phân quyền | Tải lại trang rồi sửa lại |

---

## 6. Hàng chờ duyệt — cách làm việc từ nay

*(Cần dán `luoc-do/07-duyet-dang-ky.sql` một lần. Xem mục 7.)*

Người trong họ **tự xin vào**, bạn không phải đi thêm tay từng người nữa:

1. Họ tự đăng ký tài khoản, đăng nhập.
2. Màn hình hiện **"Bạn chưa được cấp quyền xem"** kèm ô tự giới thiệu và
   nút **Xin vào gia phả**. Bấm xong, đơn vào hàng chờ.
3. Bạn mở trang **Quản trị** (`QuanTri.html`) → **Gia phả** → chọn cây → mục
   **Đơn xin vào**. Mỗi đơn hiện email, lời họ tự giới thiệu, giờ gửi.
4. Bấm **Duyệt** — hộp hiện ra kèm ô **Mã người trong sơ đồ**. Điền mã thì
   họ sửa được trực hệ của người ấy; để trống thì chỉ xem. Gắn sau cũng
   được: mục **Thành viên & quyền** → **Chọn hành động** → **Gắn / đổi mã
   người**.
5. Không phải người trong họ thì bấm **Từ chối** (hỏi lại một nhịp rồi mới xoá).

⚠ **Người đang chờ không xem được gì cả.** Không phải "xem được nhưng không
sửa" — là không thấy một chữ nào, kể cả tên gia phả. Đó là chỗ khác quan
trọng nhất so với trước ngày 04/09/2026.

⚠ **Tài khoản Supabase thì vẫn ai cũng tự đăng ký được.** Cái được kiểm soát
chặt là **chỗ đứng trong gia phả**, không phải chỗ đứng trong danh sách tài
khoản. Người lạ đăng ký xong vẫn không thấy gì — phép thử H9 đã đo: **0 dòng
trên cả tám bảng**.

---

## 6b. Duyệt NỘI DUNG — một trang riêng

*(Cần đã dán `luoc-do/08-kiem-duyet.sql` và `03-ham-luu-cay.sql`. Xem mục 8.)*

Mục 6 duyệt **người**. Mục này duyệt **việc họ sửa** — hai chuyện khác nhau,
hai chỗ khác nhau.

**Vào bằng đường nào:** mở app → **⚙ Cài đặt** → khối **"Duyệt nội dung (n)"**
→ bấm **Mở trang duyệt nội dung**. Trang mở ra là một trang riêng, địa chỉ
`…/QuanTri.html`. Muốn vào thẳng thì đánh dấu trang (bookmark) địa chỉ ấy.

**Trên trang có gì:** một cái bảng, **mỗi dòng là một lần ai đó bấm Lưu** —
không phải một ô dữ liệu. Ba tấm lọc ở trên: **Chờ duyệt · Đã nhận · Đã gạt**.

| Cột | Nói gì |
|---|---|
| Lúc | giờ họ bấm Lưu |
| Ai sửa | email của người sửa |
| Việc | câu app tự ghi: *"Sửa hồ sơ Nguyễn Trọng Hùng bằng form nhập liệu"* |
| Đụng | lần Lưu ấy chạm vào bao nhiêu người / cặp / quan hệ |

**Hai nút ở cột cuối:**

- **Duyệt** — nhận chính thức. Không đụng gì tới dữ liệu, vì dữ liệu đã nằm
  trong gia phả từ lúc họ bấm Lưu; duyệt chỉ là thôi treo cờ.
- **Gạt đi** — hiện ô lý do, rồi nút đỏ **Gạt đi và hoàn tác**. Bấm nút đỏ là
  **dữ liệu quay về đúng như trước lần Lưu ấy**.

⚠ **Gạt không phải "bỏ qua", nó là "làm lại như cũ".** Đọc kỹ cột *Việc* trước
khi bấm.

⚠ **Có lúc máy chủ TỪ CHỐI hoàn tác, và đó là đúng.** Thường gặp nhất: có
người đã sửa tiếp lên đúng những bản ghi ấy — hoàn tác bây giờ là xoá mất công
của họ. Máy chủ hiện một dòng chữ đỏ nói rõ **ai** đã sửa tiếp và **lúc nào**.
Cách xử: gạt cái mới hơn trước, rồi quay lại gạt cái này; hoặc sửa tay.

⚠ **Bấm xong bảng tự đọc lại từ máy chủ**, nên con số trên tấm lọc luôn là số
thật, không phải số nhớ trên màn hình.

⚠ **Trên điện thoại bảng rộng hơn màn hình** — kéo ngang *trong* bảng mới thấy
hai nút ở cột cuối. Trang tự hiện một dòng nhắc khi rơi vào cảnh ấy.

**Ai vào được:** Quản trị hệ thống và Quản trị gia phả. Người khác mở đúng địa chỉ
ấy cũng chỉ thấy một câu *"Trang này dành cho quản trị viên"* — chặn nằm ở máy
chủ, không nằm ở chỗ giấu địa chỉ.

**Ai bị treo cờ chờ duyệt:** chỉ vai **Thành viên** chưa bật cờ tin cậy. Bạn
(Quản trị hệ thống) và Quản trị gia phả ghi thẳng, không qua hàng chờ — nên hàng
chờ trống trơn là chuyện bình thường cho tới khi có người trong họ vào sửa.

### Muốn chắc nút "Gạt đi" hoàn tác đúng — dán một file, 30 giây

Nút ấy là nút **duy nhất trong cả app tự tay đổi ngược dữ liệu**, nên đáng đo
một lần trước khi tin nó. File `kiem-thu/thu-hoan-tac.sql` làm việc ấy hộ bạn.

1. Mở **SQL Editor** trên Supabase → **New query**.
2. Mở `supabase/kiem-thu/thu-hoan-tac.sql` bằng Notepad → `Ctrl+A` → `Ctrl+C`.
3. Dán vào → **Run**. Đợi vài giây.

Nó tự đóng vai một Thành viên bấm Lưu, rồi đóng vai bạn bấm Gạt, rồi **đọc lại
gia phả** xem dữ liệu có quay về đúng bản cũ không. Xong thì **tự dọn**: trả
ghi chú về nguyên văn, bỏ người thử, bỏ hai dòng nhật ký của phép thử, trả vai
tài khoản bạn về như cũ.

*Xong đúng khi:* bảng hiện ra có **19 dòng**, cột **Kết** toàn `DAT` (mấy dòng
`(ghi nhớ)` không tính). Hai dòng phải nhìn kỹ nhất là **A5** *(ghi chú đã quay
về bản cũ)* và **B3** *(người mới đã biến mất)*.

ℹ **Đã chạy 05/09/2026 và đạt 17/17 — cả trên bản sao dựng ở máy lẫn trên máy
chủ thật.** Trên máy chủ thật: `revision 10 → 14`, 59 người không đổi, hai
dòng nhật ký của phép thử tự dọn, vai trò tài khoản trả về `quan_tri_he_thong`.
Đó là lần đầu tiên đường hoàn tác chạy trên Postgres thật.

⚠ **Đừng mở app bấm gì trong lúc nó chạy** — vai của tài khoản bạn bị hạ xuống
`sua` trong vài giây rồi nâng lại. Dòng 14 của bảng kiểm chứng vai đã trả về.

⚠ **Hiện câu lỗi đỏ thay vì bảng thì KHÔNG có gì bị đổi** — cả file là một
lệnh, vấp là Postgres trả lại toàn bộ. Chép câu lỗi ấy gửi cho Claude Code.

⚠ Chạy được nhiều lần, nhưng **mỗi lần số bản ghi (`revision`) tăng vài đơn
vị** và không trả lại được. Ai đang mở app sẽ bị bảo tải lại trang ở lần Lưu
kế tiếp. Đó là bộ đếm chống ghi đè, không phải dữ liệu gia phả.

---

## 7. Cài đặt hàng chờ — dán một file

**SQL Editor** → **New query** → dán cả `luoc-do/07-duyet-dang-ky.sql` → **Run**.

*Xong đúng khi* bảng cuối có 4 dòng, cột `gia_tri` khớp `mong_doi` — đặc biệt
dòng cuối **`thanh vien cu bi khoa ngoai oan` phải bằng `0`**.

⚠ Dán **cả file một lần**, đừng cắt từng khối chạy riêng: trong đó có một lệnh
bật quyền cho những người đã là thành viên từ trước, và nó **phải chạy trước**
lệnh đổi luật ngay dưới. Chạy lệch thứ tự là chính bạn bị khoá ngoài app.

---

## 8. Đổi mã vai — dán SÁU file, đúng thứ tự

*(Làm một lần, 04/09/2026. Xong rồi thì bỏ qua mục này.)*

Mã `chu` đã đổi thành `quan_tri_he_thong`. Mã ấy nằm rải ở **11 hàm, 2 luật
phân quyền, 1 ràng buộc và chính dữ liệu**, nên phải dán lại gần hết —
không có cách nào một file làm xong.

Vẫn ở **SQL Editor**. Mỗi bước: bấm **New query** → mở file bằng Notepad →
`Ctrl+A` → `Ctrl+C` → dán → **Run**.

| Bước | File |
|---|---|
| 1 | `luoc-do/09-doi-ma-vai.sql` |
| 2 | `luoc-do/05-sao-luu.sql` |
| 3 | `luoc-do/06-quyen-truc-he.sql` |
| 4 | `luoc-do/07-duyet-dang-ky.sql` |
| 5 | `luoc-do/08-kiem-duyet.sql` |
| 6 | `luoc-do/03-ham-luu-cay.sql` |

⚠ **Đừng đảo bước 2 và 3.** File `05` đặt lại danh sách vai hợp lệ mà **thiếu
`quan_tri`** — nó ra đời trước vai ấy; `06` mới thêm vào. Làm 06 trước rồi 05 là
tự tay bỏ mất vai quản trị viên.

⚠ **Giữa chừng app sẽ từ chối bạn.** Sau bước 1, dữ liệu đã mang mã mới còn
các hàm vẫn hỏi mã cũ. Đó là quãng bình thường, không phải hỏng — dán nốt là
hết. Và bạn **không bao giờ bị khoá thật**: SQL Editor không đi qua phân
quyền, câu quay về bản cũ nằm ngay đầu file `09`.

*Xong đúng khi:* làm hết bước 6, quay lại tab của bước 1, bôi đen khối `select`
cuối file `09` rồi Run. Năm dòng hiện ra phải khớp cột `mong_doi`, và
**hai dòng cuối phải là `0`** — chúng đếm xem còn chỗ nào trên máy chủ đang
nói mã cũ. Khác `0` nghĩa là còn sót một file chưa dán.

---

## 8b. Tầng quyền cấp hệ thống — dán MỘT file

*(b102, 07/09/2026. **✓ ĐÃ LÀM XONG trên cả hai Supabase — thật và Staging.**
Giữ lại mục này để dựng lại từ đầu khi cần; ngày thường thì bỏ qua.)*

**File:** `luoc-do/11-quyen-he-thong.sql`

Nó dựng hai bảng mới — `tai_khoan` (ai là Quản trị hệ thống, ai được tạo cây)
và `cau_hinh` (cây mặc định) — rồi sửa hai hàm nền móng để bạn đọc và sửa được
**mọi cây**, kể cả cây bạn không có tên trong danh sách thành viên.

### Làm thế nào

1. Mở **Supabase → SQL Editor** → bấm **New query**.
2. Mở `luoc-do/11-quyen-he-thong.sql` bằng Notepad → `Ctrl+A` → `Ctrl+C`.
3. Dán vào ô soạn thảo → bấm **Run**.
4. Kéo xuống cuối, đọc **bảng 16 dòng** hiện ra.

### Đọc bảng ấy thế nào

- Mọi dòng phải là **ĐẠT**, trừ dòng 11 có thể là *CẦN CHÚ Ý* — không sao.
- Nếu thấy chữ **BỎ QUA**, cũng không sao: nó nghĩa là máy chủ này không có
  tài khoản mà dòng ấy đi tìm.
- Thấy chữ **HỎNG** ở bất kỳ dòng nào thì **dừng lại, đừng dùng tiếp**, nhắn
  cho tôi biết dòng nào. Đặc biệt dòng 13 và dòng 14 — hai dòng ấy canh đúng
  hai lỗ hổng đã tìm ra ở b102.

### ⚠ Trên Supabase **Staging** thì làm gì

Staging đang giữ bản cũ (0.1.0) và **bản ấy có lỗ hổng: bất kỳ ai đăng nhập
cũng tự đặt mình thành Quản trị hệ thống được**. Dán bản mới đè lên là vá —
làm y hệt bốn bước trên, chọn project Staging thay vì project thật.

Không việc gì phải hốt hoảng: Staging là máy thử, dữ liệu trong đó là dữ liệu
giả, và chưa ai ngoài bạn có tài khoản ở đó.

*Xong đúng khi:* bảng 16 dòng không còn chữ **HỎNG** nào.

---

## 9. Điều chưa làm, đừng mô tả như đã có

- **Trang duyệt nội dung chưa xem được TRƯỚC/SAU từng ô.** Bảng ở mục 6b nói
  *ai sửa*, *sửa việc gì* (một câu) và *đụng bao nhiêu bản ghi* — nó chưa mở
  ra cho bạn xem giá trị cũ và giá trị mới của từng ô. Muốn soi kỹ một dòng
  thì mở gia phả xem người ấy hiện đang thế nào.
- ~~Chưa ai thử HOÀN TÁC thật.~~ ✓ **Đã chạy trên máy chủ thật 05/09/2026,
  17/17 đạt** — cả hai nhánh: trả giá trị cũ về, và lấy người mới đi. Nút đỏ
  *Gạt đi và hoàn tác* từ nay tin được. Muốn đo lại lúc nào cũng được, cách
  chạy ở cuối mục 6b.
- **Người chỉ có quyền xem vẫn xem được mọi thứ**, kể cả chi tiết người còn
  sống. Việc giấu bớt còn nằm ở `KIEN-TRUC.md` mục 6.
