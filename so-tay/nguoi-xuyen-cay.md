# Sổ tay — NGƯỜI XUYÊN CÂY (một người nằm ở nhiều cây)

*Lập 22/09/2026. Đóng băng 22/09, **thiết kế chốt 23/09** — ô kéo người bật
lại 23/09 để thử, trước b127b/b127c. Đọc hết file này trước khi đụng kéo người, báo trùng, gộp.*

## Trạng thái hôm nay — tóm một dòng

Máy chủ **vẫn là** "một người một bản ghi" (nền móng, không lùi được). Giao
diện **không còn cửa nào** để đưa một người đã có ở cây khác vào cây đang mở.
Thêm người nào cũng là người MỚI, như trước b124a.

| Thứ | Trạng thái |
|---|---|
| Mã người toàn cục, một dòng `persons` cho mọi cây, `tree_persons` (b121–b122, `luoc-do/26` + `27`) | **GIỮ, đang chạy.** Mọi cây đứng trên nó. Đây không phải "tính năng xuyên cây" mà là cách lưu mọi người |
| Chống ghi đè theo bản ghi (`revision`), hoàn tác xuyên cây | **GIỮ** — `so-tay/luu-du-lieu.md` |
| Ô *"Người này đã có trong phần mềm chưa?"* ở form thêm người (b124a, b124a2) | **BẬT LẠI 23/09** theo lời chủ dự án, để thử `30` — trước b127b/b127c. Tắt: `person-edit.js`, `CAN_KEO_NGUOI_XUYEN_CAY = false` |
| Hàm máy chủ `tim_nguoi_moi_cay()` + hàng rào 3b nới trong `luu_cay()` (`luoc-do/28`) | **CÒN TRÊN MÁY CHỦ**, không ai gọi tới. ⚠ Nghĩa là: ai tự soạn lệnh REST vẫn kéo được người ở cây mình ĐƯỢC XEM. Không mở thêm lỗ nào so với 21/09, nhưng đừng viết là "đã khoá ở máy chủ" |
| `repo.timNguoiMoiCay` · `repo.docNguoiTheoMa` · `sb.*` cùng tên · `o-goi-y.js dongNguoiCayKhac` | Còn nguyên, không ai gọi |
| b124b *Báo trùng người giữa các cây* + hàm gộp | **CHƯA DỰNG, đóng băng theo** — cùng một câu hỏi bên dưới |
| b124c nới hẹp luật tự duyệt đơn gắn mã (`THIET-KE-NHIEU-CAY.md` 11.10) | **KHÔNG thuộc chức năng này**, vẫn là việc kế tiếp được |

⚠ **Dữ liệu thử còn lại:** lần thử 22/09 đã kéo một người từ cây `TH957` sang
`T388` — họ vẫn nằm ở cả hai cây, cùng những hôn nhân đã khai ở `T388`. Dữ liệu
giả, không khẩn. Muốn dọn: xoá người ấy **trong app, ở cây `T388`** — xoá chỉ
rút họ khỏi cây ấy, bản ghi và cây `TH957` còn nguyên.

## Vì sao đóng băng — lời chủ dự án, 22/09/2026

Thử thật: sửa ở cây này thì cây kia cập nhật (**đúng**), nhưng **thẻ gia đình
lẫn lộn**. Chủ dự án chỉ ra gốc — không phải lỗi mã mà là câu hỏi thiết kế
chưa ai trả lời:

> Một người là duy nhất nên thông tin cá nhân **và thông tin gia đình** của
> người đó là duy nhất. Thêm một người vào cây khác **tương đương kéo cả một
> nhánh sơ đồ** vào cây đang xử lý — mà hiện nay mỗi sơ đồ là độc lập. Việc gắn
> chỉ có ý nghĩa khi thêm người ở cây khác thì **bấm người đó sẽ vẽ đủ mối quan
> hệ của họ**. Phải giải quyết quan hệ của bể thông tin **người + gia đình +
> cây**: người xuyên cây thì ranh giới cây thế nào, **còn là ranh giới cứng
> không?** Chưa thảo luận ra thì code sẽ sai hoài, sửa hoài không xong.

Chỗ mâu thuẫn, nói bằng chính các luật đã chốt:

- 17/09 điều 1 (`THIET-KE-NHIEU-CAY.md` mục 6): **quan hệ dùng CHUNG** — cha
  của ông X là sự thật về ông X.
- Nhưng cây vẫn là **một danh sách người** (`tree_persons`), và `doc_cay()`
  chỉ trả những gì có một chân trong danh sách ấy. Hôn nhân của ông X ở cây A
  mà vợ không thuộc cây B thì sang B thành cặp thiếu một nửa; cạnh con có một
  đầu ngoài cây thì bị bỏ.
- Nên cùng một ông X, thẻ gia đình ở hai cây **kể hai chuyện khác nhau** — mà
  bản ghi thì chỉ có một. Vá ở tầng vẽ không hết được, vì chưa ai nói thẻ ấy
  PHẢI kể chuyện nào.

⚠ **Chưa ai tái hiện bằng máy** chính xác thẻ nào lẫn thế nào. Hai mục
dưới đây là hai chỗ đã biết từ trước, **nghi vấn** là nguồn, chưa đo:

- `doc_cay` bỏ cạnh con có một đầu ngoài cây.
- Cờ `deleted` và xoá cứng hôn nhân là CHUNG mọi cây — xoá một cặp ở cây B là
  mất ở cây A. *(Chưa lộ vì trước 21/09 không cây nào dùng chung người.)*

## Câu hỏi PHẢI chốt trước khi viết lại một dòng mã

Ghi câu trả lời vào `THIET-KE-NHIEU-CAY.md` mục 6, rồi mới mở phiên mã.

1. **Cây là gì?** Một danh sách người do tay chọn (hôm nay) — hay một **cửa sổ
   nhìn vào đồ thị chung**, định nghĩa bằng một người gốc + luật lan (huyết
   thống, bao nhiêu đời, có kèm dâu/rể không)?
2. **Ranh giới cứng hay mềm?** Người xuyên cây đứng ở mép cây: vẽ họ **đến
   đâu**? Chỉ họ · họ + vợ/chồng · cả nhánh? Cái phần "bên kia" hiện ra thế nào
   — ẩn hẳn, hay **nốt tròn bấm được** như luật ẩn nhánh không cùng huyết thống
   (`tai-lieu/QUY-TAC-VE`) — bấm thì mở sang cây kia, hay vẽ tại chỗ?
3. **Thẻ gia đình của một người xuyên cây kể gì?** Mọi hôn nhân, mọi con trong
   cả phần mềm (đúng với "một người, thông tin gia đình duy nhất") — hay chỉ
   những gì trong cây đang mở? Nếu kể hết: người xem cây B có được thấy tên vợ
   ông X mà vợ ấy chỉ nằm ở cây A kín không?
4. **Thêm/sửa/xoá quan hệ từ cây B** mà một đầu nằm ngoài B: ai duyệt — quản
   trị B, quản trị A, hay cả hai? Xoá cặp ở B có được xoá ở A không?
5. **Kéo một người vào = kéo gì theo?** Chỉ người ấy, hay tự thêm cả cha mẹ/
   vợ/con vào `tree_persons` của cây mới?

✓ **Cả năm câu đã chốt 23/09/2026** — `THIET-KE-NHIEU-CAY.md` mục 6, *HAI HÀNG
RÀO*: cây (`tree_persons`) vẫn là ranh vẽ cứng; người ngoài cây có dây nối vào
(vùng biên) không có thẻ riêng, không vẽ, chỉ bổ sung dòng "vợ/con: …" vào thẻ
người trong cây; kéo người vào cây chỉ kéo đúng một bản ghi; A–B đã có quan hệ
thì khoá, sai thì gửi đề nghị chỉnh sửa cho QTHT duyệt; người không thuộc cây
nào là trạng thái hợp lệ, quản lý ở `quantri.html`. Trực hệ có hai nhánh
riêng — vẽ (từ người trung tâm) và sửa (từ người tài khoản sở hữu, duyệt
trong cây).

## Cách mở lại, theo thứ tự

1. ✓ Chốt năm câu — 23/09/2026.
2. ✓ Phép thử nhỏ — 23/09/2026, đạt 11/11:
   `../kiem-thu/ban-thu-sql/do-buoc0-vanh-dai.mjs`. Nó cũng tái hiện đúng hai
   lỗi của `doc_cay()` hôm nay (con rỗng · hôn nhân thiếu một nửa).
   ⚠ Bẫy khi đo `doc_cay()` thật: nó gọi `co_the_xem_cay()`, nên phải có dòng
   `tree_members` + `set local role authenticated`; và `select set_config(...)`
   tự in ra một dòng JSON — lấy dòng `{` **cuối**, không phải dòng đầu.
3. **b127**, một phiên một bước. Không chạm `domains/`.

   | Bước | Việc | Điểm dừng |
   |---|---|---|
   | ✓ **b127a** | `luoc-do/30` — đo `../kiem-thu/ban-thu-sql/do-b127a.mjs` 37/37: cây 681 persons/unions/children/media không đổi một dòng, vành đai rỗng, 48→52 ms; người NPG đưa sang NTB có thẻ giống hệt | Đạt trên bàn thử 23/09 |
   | **b127b** | `sb.js` · `hinh-dang.js` · `utils/graph.js` map riêng · `person-detail.js` tra map ấy | Cây `T388` (còn người kéo từ `TH957`): thẻ đủ vợ/con; sơ đồ không đổi một nét |
   | **b127c** | Chặn khai nhầm ở `luu_cay()`: A–B đã có quan hệ thì khoá; đề nghị chỉnh sửa → QTHT duyệt | Khai quan hệ thứ hai cho một cặp → bị chặn |
   ✓ **b127b** 23/09 — `sb.js` · `hinh-dang.js` · `graph.js` (`vanhDaiById`) ·
   `person-detail.js` (`timNguoiThe`) · `form-sap-thu-tu.js`. Đo
   `../kiem-thu/kiem-vanh-dai.mjs` 14/14 (Chrome thật, mã `supabase/js`).
   Còn: chủ dự án bấm trên cây `T388`. Luật thẻ: `so-tay/the-thong-tin.md`.
   - `vanh_dai` kéo theo cả **anh chị em** của người xuyên cây — thẻ không có
     dòng anh chị em nên không hiện; máy chủ vẫn gửi bản ghi của họ.
   - *Sắp thứ tự con* vốn đưa ĐỦ các con (kể cả ngoài cây) cho
     `reorderChildren()`, nên sắp được; con vành đai nay hiện tên thay vì bị
     ghi nhầm "trong thùng rác".
4. Mới bật `CAN_KEO_NGUOI_XUYEN_CAY = true` trong `person-edit.js`. Bật trước
   bước 3 là tái hiện đúng lỗi 22/09.
5. b124b (Báo trùng + gộp) đi sau cùng — gộp hai người là đổ hai nhánh vào nhau,
   nên càng phụ thuộc câu 1–5.

## Bản đồ mã đang nằm yên

| Chỗ | Làm gì |
|---|---|
| `luoc-do/28-keo-nguoi-co-san.sql` | `tim_nguoi_moi_cay()` · hàng rào 3b nới · `v_keo_vao` — bốn chỗ phải đi cùng nhau: `so-tay/luu-du-lieu.md` mục *KÉO người cây khác* |
| `js/pages/person-edit.js` | `khoiTimNguoiCoSan()` · `nguoiCoSanChon` · `dungNguoiCoSan()` · `capNhatKhoaCaNhan()` · nhánh `nguoiCoSanChon ?` ở ba hàm lưu |
| `js/services/repo.js` · `sb.js` | `timNguoiMoiCay` · `docNguoiTheoMa` |
| `js/pages/quan-tri/o-goi-y.js` | `dongNguoiCayKhac` (ô gợi ý tự nó vẫn dùng ở Mời + Tài khoản) |
| Bài đo | `../kiem-thu/ban-thu-sql/do-b124a.mjs` · `../kiem-thu/do-chon-that.mjs` (bài này đo ô đã tắt — sẽ báo không thấy ô cho tới khi bật lại) |
