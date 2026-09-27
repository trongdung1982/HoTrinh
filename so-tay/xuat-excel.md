# Sổ tay · Xuất Excel và Đời tính từ cây

Gồm      : `js/pages/quan-tri/xuat-excel.js` — hai khuôn xuất · `luoc-do/40-luu-doi.sql`
— Đời LƯU ở `tree_persons.doi`, trigger tính lại · `js/utils/graph.js` `tinhDoi()` —
đáp án đối chiếu · nút *Xuất Excel ▾* và cột *Đời* ở `js/pages/quan-tri/trang-nguoi.js`
· thẻ người `js/pages/person-detail.js` (đọc `state.doi`) — hàng *Đời* trong bảng
VÀ dòng ngay dưới mã người ở đầu thẻ (b125g-2, chủ dự án 27/09)
Liên quan: đường NHẬP Excel là `domains/excel.js` (sheet `DuLieu`) — khuôn khác hẳn

## Luật — chủ dự án chốt 27/09/2026 (b125f)

- **Hai khuôn, bấm là tải**: *Xuất Excel ▾* mở menu (`.action-menu` của
  quantri3) — *Bảng phẳng* hoặc *Hai sheet (Người + Gia đình)*. Không có ô chọn
  riêng cạnh nút.
- **Cả hai KHÔNG nạp lại được** qua màn Nhập — chỉ để xem, sửa tay, báo cáo.
  Không có cột "Mã số" (mã Excel thời trước app); `ID` là `p.id` thật.
- **Bảng phẳng**: một dòng một người. Sau cột thông tin: `ID cha`/`ID mẹ` (thêm
  `ID cha nuôi`, `ID mẹ kế`… theo loại quan hệ có trong cây) · `ID phối ngẫu 1…N`
  · `ID con 1…N` rồi `ID con nuôi 1…N`, `ID con riêng 1…N`… **Không có cột "số
  thứ tự hôn nhân"/"số thứ tự con"** — vị trí cột đã nói thứ tự (chủ dự án:
  *"id phối ngẫu 1 hiển nhiên là hôn nhân 1"*). Phối ngẫu xếp theo thứ bậc của
  người kia (vợ cả trước), rồi ngày cưới; con theo thứ tự hôn nhân rồi thứ tự con.
- **Đánh số cột**: phối ngẫu và con LUÔN có số (1, 2…). Cha/mẹ chỉ có số khi
  trong cây có người mang từ hai cặp cùng loại — thường chỉ `ID cha`/`ID mẹ`.
  Loại không ai dùng thì không có cột. Không bao giờ bỏ sót cặp thứ hai (lỗi
  của bản b125e cũ: chỉ nhớ union cha mẹ ĐẦU TIÊN).
- **Hai sheet**: `Nguoi` — thông tin cá nhân, KHÔNG cột quan hệ. `GiaDinh` —
  một dòng một cuộc hôn nhân: `ID chồng` · `ID vợ` · thứ tự hôn nhân của chồng
  / của vợ (vắng `ranks` = 1) · tình trạng · ngày cưới · ghi chú · `ID con 1…`,
  `ID con nuôi 1…`. Người nhiều hôn nhân nằm ở nhiều dòng.
- **Chồng/vợ chỉ là NHÃN lúc xuất** (như GEDCOM, `CLAUDE.md` mục 7): nam →
  chồng, nữ → vợ; cùng giới hoặc chưa rõ giới thì xếp theo thứ tự `partners`.
  Dữ liệu vẫn là mảng `partners` — đừng thêm trường chồng/vợ vào đâu cả.

## Đời — LƯU theo cây, máy chủ tự tính lại (b125g)

- Từ b121 một người dùng chung nhiều cây, mỗi cây một đời → Đời không cất
  được trên người, mà ở **`tree_persons.doi`** (cặp cây–người, `luoc-do/40`).
  `vn.generation` là số ghi tay trên NGƯỜI, đa số trống, không còn dùng.
  Thẻ, bảng Danh sách người và file Excel đều đọc số ĐÃ LƯU.
- **Chỉ tính lại nhánh bị đổi** (chủ dự án chốt 27/09): trigger câu lệnh trên
  `union_children` · `unions` · `persons` (giới tính, xoá mềm) · `tree_persons`
  (vào/ra cây) đưa NGƯỜI GỐC bị đổi dòng cha vào `tinh_lai_doi()`; hàm ấy tính
  gốc + con cháu theo dòng cha **ở mọi cây chứa gốc**, và chỉ `update` dòng có
  số khác. Bắt được cả sáu lối: thêm người · gắn cha · gỡ cha · xoá (mềm/rút
  khỏi cây) · kéo người từ cây khác · Từ chối (hoàn tác) — và đổi giới tính cha.
  Không sửa `luu_cay()`, không kéo theo chuỗi dán lại nào.
- **Trình duyệt không bao giờ gửi `doi` lên**: nó nằm ngoài cây JSON
  (`state.doi`, `hinh-dang.rapDoi()`), `authenticated` chỉ có luật ĐỌC trên
  `tree_persons`. Luật "cột mới: BỐN chỗ" của `luu-du-lieu.md` không áp — cột
  không thuộc `persons`.
- Sau mỗi lần Lưu, `repo.lamTuoiDoi()` đọc lại (không chờ), có số đổi mới vẽ
  lại. Xuất Excel đọc lại Đời lúc bấm (`sb.docDoi`). ⚠ Bảng Danh sách người
  KHÔNG đọc lại sau Lưu một dòng (vẽ lại xoá ô đang gõ) — đổi giới tính cha ở
  bảng thì cột Đời đúng lại khi tải trang; file Excel thì đúng ngay.
- `layDong()` đọc Đời hỏng (chưa dán `40`) thì cây VẪN mở, hàng Đời trống.
- **`tinhDoi()` JS là đáp án**, app không gọi nữa. `doi_tinh()` SQL là bản
  dịch của nó — đổi luật thì đổi CẢ HAI, chạy lại `do-b125g.mjs`.
- **Đo 27/09/2026** (`../kiem-thu/ban-thu-sql/do-b125g.mjs`, 44/44): điền một
  lần khớp JS ở cả hai cây (59 + 681 người); thêm bố cho cụ tổ cây 681 → 548
  người +1, đúng 549 dòng bị ghi (đếm `xmin`), 95–128 ms cả lần lưu; kiểm
  chứng ngược tắt trigger thì phép so báo lệch. ⚠ Đếm dòng bị ghi phải so
  `xmin` trước/sau — `luu_cay()` có khối `exception` nên dòng mang mã giao
  dịch CON, so với `pg_current_xact_id()` ra 0.
- **Tính theo DÒNG CHA của chính người ấy** (chủ dự án chốt lần cuối,
  27/09/2026, vòng 4): lần ngược cha → ông nội → cụ nội… tới người không còn
  cha trong cây = Đời 1. **Vợ và chồng mỗi người một dòng cha, nên một cặp có
  thể khác đời** (ví dụ chủ dự án: ông C đời 7 lấy bà B có cha + ông nội
  trong cây → bà B đời 3). Không có "cụ tổ" chung của cây.
- Lịch sử để khỏi đi lại: vòng 2 tính cả khối rồi neo; vòng 3 tính từ cụ tổ đi
  xuống, dâu lấy đời chồng — cả hai **bị bỏ**, chủ dự án: *"tôi sai bạn đúng"*
  rồi chốt dòng cha.
- "Cha" = người NAM trong cặp sinh ra người ấy; nhiều cặp thì đẻ → thừa tự →
  nuôi → nuôi dưỡng; **cha dượng (`step`) không nối dòng**. Vòng dữ liệu hỏng
  (tự làm tổ tiên mình) → trống, không treo.
- **Đã đo 27/09/2026** trên cây 681 (`kiem-thu/cay-nguyen-phuc.json`, Đời gốc
  từ Excel cũ): **548/548 người CÓ cha trong cây khớp**, 1,3 ms. **133 lệch —
  cả 133 là người KHÔNG có cha trong cây** (vợ lấy vào họ): Excel gốc ghi họ
  theo đời chồng, luật dòng cha cho Đời 1. Đó là hệ quả của luật, không phải
  lỗi. **Chủ dự án chốt 27/09/2026: người không có cha trong cây = Đời 1**
  (không để trống) — đừng "sửa" cho bà vợ lấy đời chồng.
- Số ghi tay `vn.generation` không còn tác dụng gì với Đời hiển thị.

## Bẫy đã gặp

- **SheetJS bản `.mjs` chạy trong Node không ghi/đọc được file** cho tới khi gọi
  `XLSX.set_fs(fs)` — lỗi *"Cannot access file"*. Chỉ bài thử Node cần; trình
  duyệt tải file bằng đường khác.
- **Bản giả `sb-gia.mjs`** không có quan hệ; từ b125g nó trả Đời BỊA theo mã
  (1…6) qua `layDong().dong.doi` + `docDoi()`. Số ấy không nói gì về luật —
  đo Đời bằng bàn thử ở trên.
- **Menu `.action-options` gốc neo mép PHẢI** — nút *Xuất Excel* đứng sát mép
  trái trên điện thoại thì menu tràn ra ngoài. Vá bằng `#tp-xuat-menu{left:0}`
  trong `quan-tri.css`; ảnh `kq-nguoi-xuat-390`.
