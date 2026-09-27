# Sổ tay · Xuất Excel và Đời tính từ cây

Gồm      : `js/pages/quan-tri/xuat-excel.js` — hai khuôn xuất · `js/utils/graph.js`
`tinhDoi()` — Đời của mọi người trong một cây · nút *Xuất Excel ▾* và cột *Đời*
ở `js/pages/quan-tri/trang-nguoi.js` · hàng *Đời* của thẻ người `js/pages/person-detail.js`
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

## Đời — TÍNH, không đọc

- Từ b121 một người dùng chung nhiều cây, mỗi cây một đời → Đời không cất
  được trên người. **Máy chủ KHÔNG có cột đời theo cây** (`tree_persons` chỉ
  có `tree_id`, `person_id`); `vn.generation` là số ghi tay trên NGƯỜI, đa số
  trống — nên thẻ cũ ẩn hàng Đời. Nay thẻ, bảng Danh sách người và file Excel
  đều hiện số TÍNH bằng `tinhDoi()`.
- Cách tính: cha mẹ → con +1, vợ ↔ chồng 0. Lan hết đường MÁU trước rồi mới
  qua vợ/chồng (dâu/rể lấy đời người mình lấy). Neo mỗi khối: có ai ghi tay
  `vn.generation` thì theo độ lệch đa số đồng ý; không ai ghi → người cao nhất
  là đời 1. Ra < 1 (tổ tiên của dâu/rể) thì trống.
- **Đã đo 27/09/2026** trên `kiem-thu/cay-nguyen-phuc.json` (681 người, Đời gốc
  từ file Excel cũ): **681/681 khớp**, kể cả khi xoá hết Đời ghi sẵn — tức phần
  tính từ quan hệ tự đúng, không nhờ neo.
- Ô *Đời* trong form sửa người vẫn ghi `vn.generation`; nay nó chỉ còn là NEO.
  Một người ghi lệch với đa số thì bị đa số đè — chưa có chỗ báo ra.

## Bẫy đã gặp

- **SheetJS bản `.mjs` chạy trong Node không ghi/đọc được file** cho tới khi gọi
  `XLSX.set_fs(fs)` — lỗi *"Cannot access file"*. Chỉ bài thử Node cần; trình
  duyệt tải file bằng đường khác.
- **Bản giả `sb-gia.mjs` trả `unions: []`** → ảnh `kq-nguoi*` cho mọi người Đời 1.
  Đó là dữ liệu giả, không phải lỗi; đo Đời bằng cây 681 ở trên.
- **Menu `.action-options` gốc neo mép PHẢI** — nút *Xuất Excel* đứng sát mép
  trái trên điện thoại thì menu tràn ra ngoài. Vá bằng `#tp-xuat-menu{left:0}`
  trong `quan-tri.css`; ảnh `kq-nguoi-xuat-390`.
