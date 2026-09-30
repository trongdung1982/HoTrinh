# HƯỚNG DẪN DỰNG BẢN SAO LƯU TỰ ĐỘNG

*Lập 03/09/2026 17:30 · Viết lại 04/09/2026 (bỏ khoá bí mật) · Nhánh Supabase
· dành cho CHỦ DỰ ÁN, không phải cho AI*

> Làm một lần, khoảng 30 phút. Sau đó mỗi đêm máy tự chạy, không phải bấm gì nữa.
>
> **Việc này làm TRƯỚC khi nhập dữ liệu thật.** Hôm nay dữ liệu còn là dữ liệu
> giả nên chưa có gì để mất — nhưng cơ chế phải chạy được và phải được nhìn tận
> mắt một lần *trước* ngày gia phả thật vào bảng.
>
> ⚠ **Bản này đã đổi cách làm so với lần đầu (03/09/2026).** Không còn dùng
> khoá bí mật — nó không chạy được từ Apps Script, và loại thay thế thì sắp bị
> khai tử. Nay sao lưu đăng nhập bằng một tài khoản riêng chỉ-đọc. Ai đã làm
> theo bản cũ thì bỏ hết và làm lại từ bước 1; mất thêm khoảng 10 phút.

---

## Nó làm gì, nói bằng một đoạn

Mỗi đêm khoảng 2 giờ sáng, Google tự chạy một đoạn mã. Đoạn mã ấy đọc **toàn
bộ** cơ sở dữ liệu gia phả trên Supabase — mọi người, mọi cuộc hôn nhân, mọi
dòng nhật ký sửa đổi, cả danh sách ai được vào app — rồi ghi tất cả thành **một
file trên Google Drive** của bạn. Giữ 30 bản gần nhất, cộng thêm một bản cho
mỗi tháng đã qua.

Nó còn làm một việc thứ hai, âm thầm nhưng quan trọng: **giữ cho Supabase khỏi
tự tạm dừng.** Gói miễn phí tự ngủ sau 7 ngày không ai đụng tới. Mỗi lần sao
lưu là một lần đụng tới, nên chừng nào việc này còn chạy thì app không tự tắt.

---

## Trước khi bắt đầu — hai điều cần biết

**1. Đây KHÔNG phải dự án Apps Script cũ.** Dự án cũ vẫn đang chạy app mà người
trong họ dùng hằng ngày. **Đừng mở nó ra, đừng dán gì vào nó.** Ta sẽ tạo một
dự án Apps Script hoàn toàn mới, trống trơn, chỉ để làm việc sao lưu.

**2. Dùng tài khoản Google nào thì file sao lưu nằm trong Drive của tài khoản
ấy.** Nên đăng nhập Google bằng `trongdung1982@gmail.com` trước khi bắt đầu.

---

## Bước 1 — Chạy file SQL mở đường cho sao lưu

Chạy đúng một lần. File này **không đụng vào dữ liệu gia phả** — nó chỉ thêm
một vai mới và ba luật đọc.

1. Mở `https://supabase.com`, đăng nhập, bấm vào project gia phả.
2. Cột trái, bấm biểu tượng **SQL Editor** *(hình tờ giấy có chữ SQL)*.
3. Bấm **New query**.
4. Trên máy mở file `Claude_Code\supabase\luoc-do\05-sao-luu.sql`
   *(chuột phải → Open with → Notepad)*, **Ctrl + A**, **Ctrl + C**.
5. Dán vào ô soạn thảo của SQL Editor, bấm **Run** *(hoặc Ctrl + Enter)*.

Chạy xong phải hiện **Success. No rows returned**. Chạy lại nhiều lần cũng
không sao — file viết để không sinh rác.

> **Nó vừa làm gì?** Thêm vai `sao_luu` — một vai **chỉ đọc**, không sửa được
> gì — rồi mở cho vai ấy đọc đủ ba chỗ mà phân quyền vốn che: quyền theo nhánh,
> cài đặt riêng, và danh sách tài khoản. Vì sao phải làm thế thay vì dùng một
> cái "chìa vạn năng": xem khung ở cuối bước 3.

---

## Bước 2 — Tạo tài khoản riêng cho việc sao lưu

Tài khoản này không phải người thật. Nó chỉ để máy dùng khi đi chép dữ liệu.

### 2a. Tạo tài khoản

1. Vẫn ở Supabase, cột trái bấm **Authentication** → **Users**.
2. Bấm nút **Add user** → chọn **Create new user**.
3. Điền:
   - **Email**: `sao-luu@nguyentrongbac.io.vn`
     *(không cần là hộp thư có thật — không ai gửi thư tới đây)*
   - **Password**: bấm nút sinh mật khẩu ngẫu nhiên nếu có, hoặc tự gõ một
     chuỗi **dài, lộn xộn, không liên quan gì tới bạn**.
   - Bật **Auto Confirm User** nếu có ô ấy.
4. Bấm **Create user**.

⚠ **Chép mật khẩu ra chỗ tạm ngay lúc này** — Supabase không cho xem lại. Lỡ
mất thì quay lại đúng màn hình này bấm **Reset password**, không sao cả.

### 2b. Chép mã của tài khoản vừa tạo

Trong danh sách Users, bấm vào dòng vừa tạo. Có một dòng **User UID** — chuỗi
dài kiểu `a1b2c3d4-…`. Bấm chép nó.

### 2c. Cho tài khoản ấy vào cây

1. Cột trái, quay lại **SQL Editor** → **New query**.
2. Dán câu dưới đây, **thay `<DÁN_USER_UID>` bằng chuỗi vừa chép**:

```sql
insert into public.tree_members (tree_id, user_id, role)
select id, '<DÁN_USER_UID>', 'sao_luu' from public.trees
on conflict do nothing;
```

3. Bấm **Run**.

> Câu này thêm tài khoản sao lưu vào **mọi cây đang có**. Cây dựng về sau thì
> **tự có** tài khoản sao lưu — từ khi dán `luoc-do/45-sao-luu-du-cay.sql`
> (28/09/2026). Trước ngày ấy thì không: cây dựng sau bước này bị bỏ sót khỏi
> mọi bản sao lưu, im lặng.

**Tự kiểm:** chạy tiếp câu này, phải ra ít nhất một dòng có `role = sao_luu`:

```sql
select tree_id, role from public.tree_members where role = 'sao_luu';
```

---

## Bước 3 — Lấy khoá CÔNG KHAI

1. Cột trái, bánh răng **Project Settings** → **API Keys**.
2. Tìm dòng **Publishable key**, bấm biểu tượng chép.

Khoá đúng **bắt đầu bằng `sb_publishable_`**.

> ### ⚠ Lần này KHÔNG lấy khoá bí mật — và đây là lý do
>
> Bản sao lưu đầu tiên (03/09/2026) dùng khoá bí mật, và **không chạy nổi**:
>
> - Supabase từ chối khoá `sb_secret_…` khi thấy yêu cầu gửi từ thứ trông
>   giống trình duyệt — nó nhận dạng bằng chữ ký `User-Agent`. Mà Apps Script
>   **luôn** gửi `Mozilla/5.0 (compatible; Google-Apps-Script; …)`, và **Google
>   không cho đổi** dòng ấy. Hai luật đụng nhau, không bên nào nhường.
> - Đường vòng duy nhất là khoá `service_role` đời cũ (`eyJ…`) — nhưng
>   **Supabase khai tử loại khoá ấy cuối năm 2026**, nên đi đường ấy là hẹn
>   trước ngày hỏng.
>
> Nên cách làm đã đổi hẳn: sao lưu **đăng nhập như một người thường** mang vai
> `sao_luu`, dùng khoá công khai — loại khoá sinh ra để lộ, không bị chặn, và
> không có hạn dùng.
>
> **Và cách này chặt hơn cách cũ, không phải đánh đổi.** Khoá bí mật vượt qua
> mọi phân quyền: cầm nó là đọc được *và ghi được* mọi thứ, ở mọi cây, mãi mãi.
> Vai `sao_luu` thì **không ghi được một dòng nào** — mật khẩu này lọt ra ngoài
> cũng không ai sửa được gia phả. Thu lại cũng dễ: xoá một dòng trong
> `tree_members` là xong.

---

## Bước 4 — Tạo dự án Apps Script mới

1. Mở `https://script.google.com`.
2. Góc trái trên, bấm nút **New project** *(hoặc "Dự án mới")*.
3. Trên cùng có chữ **Untitled project** — bấm vào, gõ đè thành:
   `Sao luu gia pha Supabase`, bấm **Rename**.

---

## Bước 5 — Dán mã vào

1. Giữa màn hình có một ô soạn thảo, trong đó sẵn mấy dòng
   `function myFunction() { }`. Bấm vào ô ấy, nhấn **Ctrl + A** rồi **Delete**
   để xoá sạch.
2. Trên máy, mở file:
   `Claude_Code\supabase\sao-luu\SaoLuu.gs`
   *(bấm chuột phải → Open with → Notepad)*.
   Hoặc mở trên mạng:
   `https://github.com/trongdung1982/giapha-supabase/blob/main/sao-luu/SaoLuu.gs`
3. Trong Notepad: **Ctrl + A**, rồi **Ctrl + C**.
4. Quay lại Apps Script, bấm vào ô soạn thảo, **Ctrl + V**.
5. Bấm biểu tượng **đĩa mềm** (Save) trên thanh công cụ.

---

## Bước 6 — Cất bốn giá trị cấu hình

1. Cột trái, bấm bánh răng **Project Settings**.
2. Kéo xuống cuối, mục **Script Properties**.
3. Bấm **Add script property** bốn lần, mỗi lần điền một dòng dưới đây:

| Property | Value |
|---|---|
| `SUPABASE_URL` | `https://hrmwkpnvenezeyhqmmrw.supabase.co` |
| `KHOA_CONG_KHAI` | khoá đã chép ở **bước 3** *(chuỗi `sb_publishable_…`)* |
| `EMAIL_SAO_LUU` | email tài khoản tạo ở **bước 2** *(`sao-luu@nguyentrongbac.io.vn`)* |
| `MAT_KHAU_SAO_LUU` | mật khẩu đã chép ở **bước 2** |

4. Bấm **Save script properties**.

⚠ **Nếu còn dòng `KHOA_BI_MAT` từ lần trước thì xoá hẳn nó đi** (biểu tượng
thùng rác). Bản sao lưu này không dùng khoá bí mật nữa, và để nó nằm lại chỉ
tổ có ngày ai đó tưởng nó còn tác dụng.

⚠ Dán mật khẩu bằng **Ctrl + V**, đừng gõ tay. Và nếu mật khẩu có khoảng trắng
ở đầu hoặc cuối thì giữ nguyên — mã **không** tự cắt, vì cắt lén đi thì lỗi
hiện ra sẽ là "sai mật khẩu", dẫn bạn đi tìm sai chỗ.

> Đây là chỗ riêng tư thật: nó nằm trong tài khoản Google của bạn, không nằm
> trong repo GitHub, không ai khác đọc được.
>
> Và kể cả nếu mật khẩu này lọt ra ngoài: tài khoản `sao_luu` **chỉ đọc được,
> không sửa được gì**. Muốn khoá nó lại thì vào SQL Editor chạy
> `delete from public.tree_members where role = 'sao_luu';` — xong ngay.

**Hai giá trị tuỳ chọn**, chỉ thêm nếu muốn:

| Property | Value | Để làm gì |
|---|---|---|
| `SO_BAN_GIU` | `30` | Giữ bao nhiêu bản gần nhất. Không điền thì mặc định 30 |
| `THU_MUC_DRIVE` | mã thư mục Drive | Chỉ định thư mục sẵn có. Không điền thì tự tạo thư mục `Sao luu gia pha (Supabase)` ở gốc Drive |

---

## Bước 7 — Chạy thử lần đầu, và cho phép

1. Cột trái, bấm biểu tượng **`<>` Editor** để về màn hình mã.
2. Trên thanh công cụ có ô chọn hàm — chọn **`kiemTraKetNoi`**.
3. Bấm **Run**.

**Lần đầu Google sẽ hỏi quyền.** Đây là màn hình bình thường, không phải lỗi:

1. Hiện bảng **Authorization required** → bấm **Review permissions**.
2. Chọn tài khoản Google của bạn.
3. Hiện màn hình chữ đỏ **"Google hasn't verified this app"** —
   **đây là mã do chính bạn vừa dán vào, không phải của người lạ.**
   Bấm chữ nhỏ **Advanced** ở góc dưới trái.
4. Bấm dòng **Go to Sao luu gia pha Supabase (unsafe)**.
5. Bấm **Allow**.

Xong, phần dưới màn hình hiện **Execution log**. Bạn phải thấy đại khái:

```
Kết nối tới: https://hrmwkpnvenezeyhqmmrw.supabase.co

  trees: 1 dòng
  tree_members: 1 dòng
  persons: 3 dòng
  ...
```

**Nếu thấy chữ đỏ** thì đọc câu tiếng Việt trong đó — nó nói thẳng phải làm gì.
Năm câu hay gặp:

| Câu lỗi | Nghĩa là |
|---|---|
| *"Chưa điền đủ cấu hình…"* | Thiếu một trong bốn dòng ở bước 6. Câu lỗi kể đủ tên cả bốn |
| *"KHOA_CONG_KHAI đang là khoá BÍ MẬT"* | Chép nhầm dòng **Secret key**. Lấy đúng dòng **Publishable key** (bước 3) |
| *"Không đăng nhập được tài khoản sao lưu"* | Sai email hoặc mật khẩu (bước 2). Vào Supabase → Authentication → Users bấm **Reset password** rồi dán lại |
| *"Bị từ chối dù đã đăng nhập"* | Đăng nhập được nhưng chưa có quyền: **bước 1 chưa chạy**, hoặc bước 2c chưa thêm dòng `role = sao_luu` |
| *"(tài khoản đăng nhập): 0 người"* | Không đỏ, nhưng sai: hàm `ds_tai_khoan()` chưa có — chạy lại **bước 1** |

---

## Bước 8 — Sao lưu thật một lần

1. Ô chọn hàm, đổi sang **`saoLuuNgay`**.
2. Bấm **Run**.
3. Execution log hiện: `Đã ghi giapha-sao-luu-2026-09-03-1745.json (… byte).`
4. Mở `https://drive.google.com`, tìm thư mục **`Sao luu gia pha (Supabase)`**.
   File phải nằm trong đó.

**Mở file ấy ra nhìn một lần** — đừng bỏ qua bước này. Bấm đúp, Drive hiện nội
dung dạng chữ. Ngay đầu file có khối `"dem"`, đọc được bằng mắt:

```
"dem": {
  "persons": 3,
  "unions": 1,
  ...
}
```

Con số `persons` ở đó phải khớp với số người đang có trong app. Nếu khớp thì
bản sao lưu là thật, không phải một file rỗng trông giống thật.

---

## Bước 9 — Đặt lịch tự động

1. Ô chọn hàm, đổi sang **`datLichSaoLuu`**.
2. Bấm **Run**.
3. Execution log hiện: `Đã đặt lịch: mỗi ngày một lần, khoảng 2 giờ sáng.`

Xong. Từ đêm nay máy tự chạy.

> Bấm lại hàm này nhiều lần cũng không sao — nó gỡ lịch cũ trước khi đặt lịch
> mới, nên không bao giờ có hai lịch chạy chồng nhau.

---

## Về sau

### Kiểm xem nó còn chạy không

`script.google.com` → mở dự án → cột trái bấm biểu tượng **đồng hồ**
(**Executions**). Danh sách mỗi đêm một dòng, cột **Status** phải là
**Completed**. Không thấy dòng nào mới trong hai ngày là có chuyện.

### Ba loại thư có thể tới

| Tiêu đề thư | Nghĩa là | Làm gì |
|---|---|---|
| **⛔ SAO LƯU HỎNG** | Đêm qua không sao lưu được | Mở dự án, chạy `kiemTraKetNoi`, đọc câu lỗi |
| **⛔ Bản sao lưu THIẾU dữ liệu so với máy chủ** | File đã ghi, nhưng máy chủ có nhiều dòng hơn số máy sao lưu đọc được — thường vì một cây chưa có tài khoản sao lưu | Dán lại `luoc-do/45-sao-luu-du-cay.sql` (nó bù cho mọi cây), rồi chạy `saoLuuNgay`. Thư không tới nữa là xong |
| **⚠ Bản sao lưu hôm nay ít dữ liệu hơn hẳn lần trước** | Số người tụt hơn một nửa | Mở app kiểm bằng mắt. Có thể là thật (bạn vừa dọn thùng rác), có thể là mất dữ liệu. **Lần ấy máy KHÔNG dọn bản cũ**, nên bản cũ còn nguyên để cứu |
| Thư của Google về "failure" | Google báo trigger lỗi | Cùng nguyên nhân với thư ⛔ |

### Muốn dừng hẳn

Chạy hàm **`goLichSaoLuu`**. Lịch tự động tắt; sao lưu bấm tay vẫn chạy được.

### Khi `SaoLuu.gs` có bản mới — thay mã, KHÔNG làm lại từ đầu

*(Lần gần nhất: bản **0.11.0**, 30/09/2026 — chép thêm **hai bảng nhật ký
hệ thống** vào file sao lưu, ở ngăn riêng `nhatKy`. **Kèm SQL `65`**: bước 1
dán `luoc-do/65-sao-luu-nhat-ky.sql`, bảng cuối **ĐẠT cả 3 dòng**. Bản trước:
0.9.0 — dấu vân tay + web app, kèm `54`; 0.7.0 — chép ảnh sang Drive.)*

1. **Dán SQL trước** *(chỉ khi bản mới kèm SQL — 0.11.0 kèm `65`)*: Supabase →
   SQL Editor → **New query** → dán cả file SQL ấy → **Run**. Bảng cuối phải
   ra **ĐẠT** mọi dòng.
2. `script.google.com` → mở dự án **Sao luu gia pha Supabase** → bấm vào ô
   soạn thảo → **Ctrl + A** → **Delete**.
3. Chép lại mã mới đúng như **Bước 5** (Notepad hoặc GitHub) → **Ctrl + V** →
   bấm **đĩa mềm** (Save). Bốn giá trị cấu hình và lịch tự động **giữ
   nguyên**, không phải làm lại. ⚠ Đã làm mục *Máy sao lưu làm web app* thì
   thêm: **Deploy** → **Manage deployments** → bút chì → *Version*: **New
   version** → **Deploy** — không thì nút *Sao lưu ngay* vẫn chạy mã cũ.
4. Chọn hàm **`kiemTraKetNoi`** → **Run**. Có hai dòng `nhat_ky_he_thong: …
   dòng` và `nhat_ky_lo_rac: … dòng` (ra `LỖI` ở đó thì `65` chưa dán). Dòng cuối nhật ký phải là
   **`Đối chiếu với máy chủ: ĐỦ`**. Ra **`THIẾU`** kèm tên bảng thì còn cây
   chưa có tài khoản sao lưu — chạy lại bước 1. Ra **`LỖI`** thì bước 1 chưa
   chạy; bản sao lưu vẫn ghi bình thường, chỉ không tự đối chiếu được.
5. Chọn hàm **`saoLuuNgay`** → **Run** (một lần, cho có dòng đầu tiên). Mở
   app → *Quản trị hệ thống → Sao lưu & khôi phục*: bảng *Lịch sử sao lưu* có
   một dòng **Đạt** mang đúng tên file vừa ghi. Bảng vẫn báo *"Chưa có lần
   sao lưu nào báo về"* thì `49` chưa dán — bản sao lưu trên Drive vẫn ghi
   bình thường, chỉ không báo về được.

---

## Máy sao lưu làm web app (từ bản 0.9.0) — tuỳ chọn

Làm bước này thì nút *Khởi tạo quy trình khôi phục dữ liệu…* ở trang Quản trị
**hiện danh sách các bản sao lưu trên Drive** để chọn, và khôi phục xong có
nút **Khôi phục ảnh**. Không làm thì nút vẫn chạy, anh chọn file trong ổ
Google Drive của máy, còn ảnh thì chạy `khoiPhucAnh` bằng tay (mục *Ảnh*).

**Triển khai một lần:**

1. `script.google.com` → mở dự án sao lưu → góc trên phải **Deploy** →
   **New deployment**.
2. Bánh răng cạnh *Select type* → **Web app**.
3. *Description*: `may sao luu`. *Execute as*: **Me**. *Who has access*:
   **Anyone** (đúng chữ *Anyone*, KHÔNG chọn *Anyone with Google account* —
   chọn nhầm thì trang Quản trị không gọi được).
4. **Deploy** → Google hỏi quyền thì **Authorize access** → chọn tài khoản →
   *Advanced* → *Go to … (unsafe)* → **Allow**.
5. Chép dòng **Web app URL** (dạng `https://script.google.com/macros/s/…/exec`).
6. Mở `supabase/js/cau-hinh.js`, dòng `export const SAO_LUU_WEB_APP = '';` →
   dán địa chỉ vào giữa hai dấu nháy → lưu. *(Hoặc gửi địa chỉ cho Claude Code
   dán hộ.)*

**Tự kiểm:** dán địa chỉ ấy vào trình duyệt → phải ra đúng một dòng
`{"ok":true,"may":"giapha-sao-luu",…}`, không có dữ liệu gì khác.

**Ai có địa chỉ cũng lấy được dữ liệu không?** Không. Mọi yêu cầu phải kèm vé
đăng nhập app của một **Quản trị hệ thống**; máy sao lưu hỏi Supabase xác nhận
vé trước khi đụng tới Drive, và chỉ đưa ra file trong thư mục sao lưu.

⚠ **Mỗi lần thay mã `SaoLuu.gs` sau này:** *Deploy* → **Manage deployments** →
bút chì → *Version*: **New version** → *Deploy*. Chỉ bấm Save thì web app vẫn
chạy mã cũ (lịch sao lưu đêm thì chạy mã mới ngay). Địa chỉ không đổi.

## Ảnh (từ bản 0.7.0)

**Sao lưu làm gì với ảnh.** Mỗi lần `saoLuuNgay` chạy, sau khi ghi xong file
JSON, nó chép những tấm ảnh Drive **chưa có** vào thư mục con **`Anh`**,
nằm ngay trong thư mục *Sao luu gia pha (Supabase)*. Trong `Anh` mỗi gia phả
một thư mục, tên là mã cây (một chuỗi dài như `3f2a…-…`).

- Mỗi đêm chép tối đa khoảng **4 phút rưỡi** (Apps Script cắt mọi lượt chạy ở
  6 phút). Nhiều ảnh quá thì đêm sau chép tiếp phần còn lại.
- Ảnh app đã xoá **vẫn nằm lại trên Drive**. Cố ý: khôi phục dữ liệu về hôm
  qua thì ảnh của hôm qua phải còn.
- Tự kiểm: bảng *Lịch sử sao lưu* (hoặc nhật ký Apps Script) có dòng
  **`anh_chua_chep`**. Nó về **0** là mọi ảnh đã có bản trên Drive.

**Lần đầu sau khi thay mã:** chạy `saoLuuNgay` một lần. Nhật ký Apps Script
ra dòng cuối kiểu *"Ảnh: chép thêm 12, còn 0 tấm chưa chép."* Mở Drive →
*Sao luu gia pha (Supabase)* → **Anh**: thấy thư mục các cây, trong có ảnh.
Ra *"còn N tấm chưa chép"* kèm một câu lỗi thì chép câu ấy gửi Claude Code.

### Khôi phục ảnh — hàm `khoiPhucAnh`

Dùng khi ảnh trên app mất (hoặc sau khi khôi phục dữ liệu từ file JSON). Nó
đọc dữ liệu gia phả xem **tấm ảnh nào còn được dùng** (kể cả ảnh của người
đang nằm thùng rác), rồi chỉ tải lên những tấm ấy mà kho Supabase đang thiếu.
Ảnh đã dọn hẳn khỏi app thì Drive vẫn giữ nhưng **không tải lên**, kẻo thành
ảnh mồ côi. Tấm kho còn thì bỏ qua, nên chạy thừa không hại gì.

⚠ Phải khôi phục dữ liệu (file JSON) **trước**, ảnh **sau**. Làm ngược thì
dữ liệu chưa về, máy coi mọi tấm là không ai dùng và không tải tấm nào.

Tài khoản sao lưu cố ý **không ghi được gì**, nên việc này cần tài khoản của
bạn (Quản trị hệ thống), điền **tạm**:

1. `script.google.com` → dự án sao lưu → **Project Settings** (bánh răng) →
   **Script Properties** → **Edit script properties** → **Add script property**
   hai lần:
   - `EMAIL_KHOI_PHUC` = email đăng nhập app của bạn
   - `MAT_KHAU_KHOI_PHUC` = mật khẩu ấy

   *(Chỉ muốn khôi phục một gia phả: thêm `KHOI_PHUC_CAY` = tên thư mục của
   cây ấy trong `Anh`.)* → **Save script properties**.
2. Về **Editor** → chọn hàm **`khoiPhucAnh`** → **Run**.
3. Đọc dòng nhật ký: *"tải lên N tấm, M tấm kho đã có sẵn, bỏ qua K tấm
   không còn ai dùng, còn 0 tấm chưa tải. XONG."* Ra *"còn … Bấm chạy lại"* thì bấm **Run** lần nữa (hết giờ,
   nó làm tiếp). Ra *"bị từ chối"* thì tài khoản ấy không phải Quản trị hệ
   thống, hoặc gia phả đang nằm thùng rác (phục hồi nó trong app trước).
4. **Xoá** hai dòng `EMAIL_KHOI_PHUC`, `MAT_KHAU_KHOI_PHUC` (và
   `KHOI_PHUC_CAY` nếu có) → **Save script properties**. Đừng để mật khẩu
   của bạn nằm lại trong dự án này.
5. Mở app, Ctrl + F5: ảnh hiện lại.

---

## ⚠ Ba điều bản sao lưu này KHÔNG làm — nói thẳng để không ai tưởng nhầm

**1. Không chứa mật khẩu.** Supabase không cho đọc mật khẩu ra, kể cả bằng khoá
bí mật. File có danh sách ai có tài khoản (email, ngày tạo), nhưng nếu phải
dựng lại hệ thống thì mọi người sẽ phải **đặt lại mật khẩu**. Dữ liệu gia phả
về đủ; đường vào thì không.

**2. Ảnh không nằm trong file JSON.** Từ bản 0.7.0 ảnh có bản sao trên Drive
(thư mục `Anh`, mục *Ảnh* ở trên), nhưng nó là **một bản duy nhất, luôn mới
nhất** — không có "ảnh của ngày 12" như file JSON. Tấm bị tải đè thì Drive chỉ
giữ bản mới (bản cũ vào thùng rác Drive, còn 30 ngày).

**3. Khôi phục: đã làm thật một lần, 28/09/2026.** Script đổ ngược
`sao-luu/khoi-phuc.mjs` đổi file JSON thành một file SQL; dán vào SQL Editor,
19 bảng về khớp bản chụp từng dòng. Mật khẩu thì không về. Ảnh về bằng một
bước riêng: hàm `khoiPhucAnh` (mục *Ảnh*) — **chưa chạy thật lần nào**.
**Nhật ký hệ thống** (từ bản 0.11.0) có trong file, ở ngăn `nhatKy`, nhưng
khôi phục **cố ý không đổ lại**: khôi phục về hôm qua mà xoá nhật ký thì mất
luôn dấu vết của việc làm sau hôm qua. Bản trong file là để còn, ngày mất cả
project.

---

## Nếu phải khôi phục

File JSON có khuôn thế này:

```
{
  "khuon": "giapha-sao-luu",
  "taoLucVn": "03/09/2026 17:30",
  "dem":  { "persons": 681, ... },        ← số dòng từng bảng, để đối chiếu
  "bang": { "trees": [...], "persons": [...], ... },   ← chép thô từng bảng
  "nguoiDung": [ ... ],                   ← ai có tài khoản
  "khoAnh":    { "tep": [ ... ] }         ← danh sách ảnh (ảnh ở thư mục Anh)
}
```

Mỗi khoá trong `bang` là **tên một bảng Postgres**, và mỗi dòng bên trong giữ
**đúng tên cột** của bảng ấy. Nghĩa là đổ ngược lại được, không phải đoán.

**Script đổ ngược đã có:** `sao-luu/khoi-phuc.mjs` đổi file JSON thành một
file SQL. Nó **xoá sạch** dữ liệu gia phả hiện có rồi đổ lại bản chụp — mọi
sửa đổi sau lúc chụp sẽ mất. Cả file chạy trong một giao dịch: hỏng giữa
chừng thì không gì bị đổi.

**Đừng tự làm việc này một mình** — nói với Claude Code, đưa file. File SQL
sinh ra chứa cả gia phả: để ở `kiem-thu/` (ngoài repo), **không bao giờ** thả
vào `supabase/`.
