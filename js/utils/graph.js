// ============================================================
// giapha · js/utils/graph.js
// Vai trò  : Duyệt đồ thị dùng chung. MỌI hàm ở đây bắt buộc có tập visited.
// Lớp      : utils
// Phụ thuộc: (không)
// Phiên bản: 0.7.0 · Cập nhật: 25/09/2026 23:59
// Sổ tay   : so-tay/nguoi-xuyen-cay.md (rào thép — hai chỉ mục) · so-tay/ve-so-do.md (dâu/rể)
// ============================================================
//
// ⚠ HAI NHÓM CHỈ MỤC, HAI VIỆC — đừng dùng lẫn (chủ dự án 24/09/2026):
//   • VẼ        — `chiMucVe(tree)`. Chỉ người TRONG cây, và quan hệ đã gọt
//                 còn đúng những đầu trong cây. Rào thép: không ai ngoài cây
//                 lọt tới `domains/` vẽ hình.
//   • THÔNG TIN — `buildIndex(tree)` = `state.index`. Đủ quan hệ + vành đai,
//                 để thẻ/form kể tên cha mẹ, vợ chồng, con ở mọi cây.
//
// CẢNH BÁO: Gia phả là ĐỒ THỊ, không phải cây. Hôn nhân giữa hai nhánh
// cùng họ tạo ra nhiều đường đi giữa hai điểm. Thiếu tập visited là
// treo trình duyệt, không phải chạy chậm.

/**
 * Duyệt theo chiều rộng, có chống lặp sẵn.
 *
 * Tập visited nằm TRONG hàm này, không nhờ nơi gọi tự lo. Đây là lý do
 * mọi lần duyệt đồ thị trong app đều phải đi qua đây thay vì tự viết
 * vòng lặp tại chỗ.
 *
 * @param {string|string[]} startIds
 * @param {(id: string) => string[]} getNeighbors
 * @returns {Set<string>}
 */
export function bfs(startIds, getNeighbors) {
  return new Set(bfsLevels(startIds, getNeighbors).keys());
}

/**
 * NGƯỜI CÙNG HUYẾT THỐNG với `tamId`: mọi tổ tiên (không giới hạn đời) và mọi
 * hậu duệ của họ lẫn của chính `tamId`. Ai ngoài tập này là dâu/rể — định
 * nghĩa của chủ dự án (25/09/2026). Không cắt theo số đời đang vẽ: người họ
 * hàng xa lấy người trong họ vẫn là huyết thống, dù đứng ở vùng biên.
 *
 * @param {object} index  cùng hình dạng `buildIndex()`
 * @param {string} tamId
 * @returns {Set<string>}
 */
export function tapHuyetThong(index, tamId) {
  const unionIds = (bang, id) => bang.get(id) || [];
  const chaMe = (id) => unionIds(index.unionsAsChild, id)
    .flatMap((u) => (index.unionById.get(u) || {}).partners || [])
    .filter((p) => index.personById.has(p));
  const con = (id) => unionIds(index.unionsAsPartner, id)
    .flatMap((u) => ((index.unionById.get(u) || {}).children || []).map((c) => c && c.personId))
    .filter((p) => p && index.personById.has(p));
  if (!index.personById.has(tamId)) return new Set();
  return bfs([...bfs(tamId, chaMe)], con);
}

/**
 * THÊM DÂU/RỂ vào tập vẽ: vợ/chồng của mọi người `full` (trừ tổ tiên của
 * `tamId`) mà chưa có trong tập, gắn nhãn `'edge'`. `computeVisibleSet()` chỉ
 * lấy vợ/chồng khi cặp CÓ CON đang vẽ — chọn đời "Con" là mất hết dâu/rể của
 * các con (chủ dự án 25/09/2026). Trả Map MỚI, không sửa `visible`.
 *
 * @param {object} index
 * @param {Map<string,'full'|'edge'>} visible
 * @param {string} tamId
 * @returns {Map<string,'full'|'edge'>}
 */
export function themDauRe(index, visible, tamId) {
  const toTien = bfs(tamId, (id) => (index.unionsAsChild.get(id) || [])
    .flatMap((u) => (index.unionById.get(u) || {}).partners || [])
    .filter((p) => index.personById.has(p)));
  const ra = new Map(visible);
  for (const [id, kieu] of visible) {
    if (kieu !== 'full' || (id !== tamId && toTien.has(id))) continue;
    for (const u of index.unionsAsPartner.get(id) || []) {
      for (const p of (index.unionById.get(u) || {}).partners || []) {
        if (p && index.personById.has(p) && !ra.has(p)) ra.set(p, 'edge');
      }
    }
  }
  return ra;
}

/**
 * Như `bfs()` nhưng giữ luôn số bước đã đi tới từng đỉnh, và cho phép
 * dừng ở một độ sâu.
 *
 * Cần thêm hàm này vì thuật toán tập hiển thị phải biết SỐ ĐỜI, không chỉ
 * biết "có nằm trong tập hay không": số đời quyết định union nào là trực hệ
 * đời mấy, và quyết định chỗ cắt khi người dùng giới hạn số đời.
 *
 * @param {string|string[]} startIds  các đỉnh xuất phát, đều mang độ sâu 0
 * @param {(id: string) => string[]} getNeighbors
 * @param {number} [maxDepth=0]  0 = không giới hạn (cùng quy ước với
 *                               ancestors/descendants trong DEFAULT_SCOPE)
 * @returns {Map<string, number>}  id -> độ sâu
 */
export function bfsLevels(startIds, getNeighbors, maxDepth = 0) {
  const doSau   = new Map();   // VỪA là kết quả VỪA là tập visited
  const hangDoi = [];

  const dau = Array.isArray(startIds) ? startIds : [startIds];
  for (const id of dau) {
    if (!id || doSau.has(id)) continue;
    doSau.set(id, 0);
    hangDoi.push(id);
  }

  // Đọc bằng con trỏ chứ không dùng shift(): shift() phải dời cả mảng mỗi
  // lần gọi, gia phả lớn thì tốn thấy rõ.
  let viTri = 0;
  while (viTri < hangDoi.length) {
    const id  = hangDoi[viTri++];
    const doi = doSau.get(id);
    if (maxDepth > 0 && doi >= maxDepth) continue;

    const cacKe = getNeighbors(id) || [];
    for (const ke of cacKe) {
      if (!ke || doSau.has(ke)) continue;   // ← ĐÚNG CHỖ NÀY chống lặp vô hạn
      doSau.set(ke, doi + 1);
      hangDoi.push(ke);
    }
  }

  return doSau;
}

/**
 * Dựng chỉ mục tra cứu nhanh, gọi MỘT LẦN sau khi đọc file.
 *
 * Bỏ qua mọi bản ghi có cờ `deleted` — app không xoá cứng, nên dữ liệu
 * luôn còn xác người đã xoá. Chỉ mục là "những gì đang tồn tại".
 *
 * Ném lỗi khi gặp hai bản ghi trùng mã: đó là hỏng dữ liệu ở mức làm sai
 * cả sơ đồ mà không báo gì. Thà dừng và nói rõ còn hơn vẽ ra một cây sai.
 *
 * @param {object} tree  object gốc đọc từ file JSON
 * @returns {{
 *   personById:      Map<string, object>,
 *   unionById:       Map<string, object>,
 *   unionsAsPartner: Map<string, string[]>,
 *   unionsAsChild:   Map<string, string[]>,
 *   vanhDaiById:     Map<string, object>   người ngoài cây, chỉ để điền thẻ
 * }}
 */
export function buildIndex(tree) {
  const personById      = new Map();   // P0001 -> object người
  const unionById       = new Map();   // U0001 -> object hôn nhân
  const unionsAsPartner = new Map();   // P0001 -> ['U0001', …] làm vợ/chồng
  const unionsAsChild   = new Map();   // P0001 -> ['U0001', …] làm con

  const persons = (tree && Array.isArray(tree.persons)) ? tree.persons : [];
  const unions  = (tree && Array.isArray(tree.unions))  ? tree.unions  : [];

  for (const p of persons) {
    if (!p || !p.id || p.deleted) continue;
    if (personById.has(p.id)) {
      throw new Error('Dữ liệu hỏng: có hai người cùng mã ' + p.id + '.');
    }
    personById.set(p.id, p);
    unionsAsPartner.set(p.id, []);
    unionsAsChild.set(p.id, []);
  }

  for (const u of unions) {
    if (!u || !u.id || u.deleted) continue;
    if (unionById.has(u.id)) {
      throw new Error('Dữ liệu hỏng: có hai hôn nhân cùng mã ' + u.id + '.');
    }
    unionById.set(u.id, u);

    // partners là MẢNG hai chiều bình đẳng, không phải hai trường riêng —
    // xem HIEN-PHAP mục dữ liệu. Hôn nhân đồng giới không được phép gãy.
    const partners = Array.isArray(u.partners) ? u.partners : [];
    for (const personId of partners) {
      themMotLan(unionsAsPartner, personId, u.id);
    }

    // children là mảng object { personId, relation, order }, không phải mảng ID.
    const children = Array.isArray(u.children) ? u.children : [];
    for (const con of children) {
      themMotLan(unionsAsChild, con && con.personId, u.id);
    }
  }

  // VÀNH ĐAI (b127b): người ngoài cây có dây nối vào người trong cây. Map
  // RIÊNG, cố ý không trộn vào `personById` — `domains/` chỉ đọc map ấy nên
  // họ không bao giờ được vẽ. Chỉ thẻ thông tin tra map này để điền tên.
  const vanhDaiById = new Map();
  for (const p of (tree && Array.isArray(tree.vanhDai)) ? tree.vanhDai : []) {
    if (!p || !p.id || p.deleted || personById.has(p.id)) continue;
    vanhDaiById.set(p.id, p);
  }

  return { personById, unionById, unionsAsPartner, unionsAsChild, vanhDaiById };
}

/**
 * Chỉ mục dành RIÊNG cho việc VẼ sơ đồ — rào thép của hàng rào 1.
 *
 * Sơ đồ chỉ có MỘT tập người: những ai thuộc cây (`tree.persons`). Mỗi hôn
 * nhân được gọt còn vợ/chồng + con trong tập ấy; cặp không còn vợ/chồng nào
 * trong cây thì bỏ (con của họ trong cây đứng như người không cha mẹ). Không
 * mang `vanhDai`. Bản sao — không sửa `tree`, vì `tree` là thứ app sửa rồi lưu.
 *
 * @param {object} tree  `state.tree`
 * @returns {object}     cùng hình dạng `buildIndex()`, `vanhDaiById` rỗng
 */
export function chiMucVe(tree) {
  const persons = (tree && Array.isArray(tree.persons)) ? tree.persons : [];
  const trong = new Set();
  for (const p of persons) if (p && p.id && !p.deleted) trong.add(p.id);

  const unions = [];
  for (const u of (tree && Array.isArray(tree.unions)) ? tree.unions : []) {
    if (!u || !u.id || u.deleted) continue;
    const partners = (Array.isArray(u.partners) ? u.partners : []).filter((id) => trong.has(id));
    if (partners.length === 0) continue;
    const children = (Array.isArray(u.children) ? u.children : [])
      .filter((c) => c && trong.has(c.personId));
    const gon = { partners, children };
    if (Array.isArray(u.partnerOrder)) gon.partnerOrder = u.partnerOrder.filter((id) => trong.has(id));
    unions.push(Object.assign({}, u, gon));
  }
  return buildIndex({ persons, unions });
}

/**
 * Ghi `unionId` vào danh sách của `personId`, bỏ qua nếu người đó không có
 * trong chỉ mục (đã xoá, hoặc union trỏ tới một mã không tồn tại).
 *
 * Chống trùng vì hai lý do có thật:
 *  - cùng một union lỡ ghi một người hai lần trong `partners`;
 *  - CON NUÔI: một người nằm trong `children` của hai union khác nhau là
 *    chuyện HỢP LỆ, nên `unionsAsChild` phải là mảng chứ không phải một giá
 *    trị đơn. Đây là ca 0.10 còn treo — cấu trúc đã chừa sẵn chỗ.
 */
function themMotLan(bang, personId, unionId) {
  if (!personId) return;
  const danhSach = bang.get(personId);
  if (!danhSach) return;                    // người đã xoá hoặc mã lạ
  if (danhSach.indexOf(unionId) === -1) danhSach.push(unionId);
}
