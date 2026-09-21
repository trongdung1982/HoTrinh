// ============================================================
// giapha-supabase · js/services/repo.js
// Vai trò  : Nạp/lưu cây gia phả, dựng chỉ mục, giữ trạng thái phiên.
// Lớp      : services — được gọi bởi: pages · gọi: services/sb,
//            services/hinh-dang, utils, state
// Phụ thuộc: services/sb.js, services/hinh-dang.js, utils/graph.js, state.js
// Phiên bản: 0.5.0 · Cập nhật: 21/09/2026 (b124a)
//            0.5.0 thêm `timNguoiMoiCay()` — cửa cho ô gợi ý lúc thêm người.
//            0.4.0 mô hình một người một bản ghi: kho mã xin của máy chủ
//            (`dayKhoMa`/`xinMa`) · đặt lại số chống ghi đè sau mỗi lần Lưu.
// Sổ tay   : so-tay/luu-du-lieu.md
// ============================================================
//
// ═══ RANH GIỚI ĐỔI KHO LƯU TRỮ ═══
//
// File này và `sb.js` là **hai file duy nhất** phải viết lại khi đổi Drive
// sang Supabase; `domains/` và `pages/` không đổi một dòng. Đó không phải may
// mắn mà là luật phân lớp của `CLAUDE.md` mục 5 trả công.
//
// ═══ CHỮ KÝ HÀM Ở ĐÂY LÀ HỢP ĐỒNG ═══
//
// `khoiTao` · `napCay` · `luuCay(apDung, moTa)` · `suaDuoc` · `docDuoc` giữ
// ĐÚNG hình dạng của bản Apps Script. Mười ba file trong `pages/` gọi chúng,
// và mười ba file ấy là phần đã chạy đúng suốt 84 bước.
//
// ═══ CHỖ DUY NHẤT KHÁC HÌNH SO VỚI BẢN CŨ ═══
//
// `state.headRevisionId` (vân tay Drive) đổi thành `state.revision` (số
// nguyên của `trees`). Cùng vai trò, khác chỗ: số ấy tăng bên trong cùng giao
// dịch với lần ghi, nên không có khe hở giữa lúc kiểm và lúc ghi.

import * as sb from './sb.js';
import { rapCay, soSanh, coGiDeGhi, tangSoSauKhiLuu } from './hinh-dang.js';
import { state, notify } from '../state.js';
import { buildIndex } from '../utils/graph.js';
import { sinhMaCay, napKho, soMaTrongKho } from '../utils/id.js';
import { DATA_VERSION } from '../config.js';

/**
 * Gọi khi mở app: lấy danh tính và quyền, rồi nạp cây.
 *
 * ⚠ Có BA kết cục, không phải hai như bản Apps Script. Trên nền Google, người
 *   dùng bao giờ cũng đã đăng nhập sẵn — chỉ hỏi "có quyền đọc file không".
 *   Ở đây thêm kết cục thứ ba: **chưa đăng nhập**. `pages/khoi-dong.js` nhìn
 *   cờ `daDangNhap` để mở màn hình đăng nhập, chứ không mở màn hình
 *   "bạn chưa được cấp quyền" — hai câu ấy nói với hai người khác nhau, và
 *   nói nhầm thì người ta đi tìm người quản lý trong khi chỉ cần gõ mật khẩu.
 *
 * @returns {Promise<object>} chính là phiên máy chủ trả về
 */
export async function khoiTao() {
  const phien = await sb.layPhien();
  state.phien = phien;

  if (!phien.daDangNhap) return phien;   // chưa đăng nhập
  if (!phien.docDuoc)    return phien;   // đăng nhập rồi nhưng chưa ở cây nào

  await napCay();
  state.focusPersonId = chonNguoiTrungTam(phien);

  // Công tắc *Hiện hàng ngày giỗ*, nhớ riêng cho từng cây của từng người.
  // ⚠ Trước 05/09/2026 nó không được lưu ở đâu cả — tắt trình duyệt là mất.
  state.hienNgayGio = phien.hienNgayGio === true;

  return phien;
}

/**
 * Đọc cây, ráp lại thành hình JSON cũ, dựng chỉ mục tra cứu.
 * Ném lỗi nếu máy chủ từ chối hoặc dữ liệu hỏng — `pages/khoi-dong.js` bắt và
 * hiện màn hình lỗi kèm nút Thử lại.
 */
export async function napCay() {
  const treeId = state.phien && state.phien.treeId;
  if (!treeId) throw new Error('Chưa biết đang mở gia phả nào.');

  // Xin mã ĐI CÙNG CHUYẾN với lần đọc cây — hai việc không phụ thuộc nhau, nối
  // tiếp là cộng thêm một vòng mạng vào đúng chỗ người dùng đang chờ màn hình.
  const [kq] = await Promise.all([sb.layDong(treeId), dayKhoMa()]);
  if (!kq)    throw new Error('Máy chủ không trả về gì khi đọc cây gia phả.');
  if (!kq.ok) throw new Error(kq.loi || 'Máy chủ từ chối trả cây gia phả.');

  const cay = kiemPhienBan(rapCay(kq.dong));

  state.treeId   = treeId;
  state.tree     = cay;
  state.index    = buildIndex(cay);
  state.revision = cay.tree.revision;

  // Bản Apps Script còn một cờ `daLocNguoiConSong` — máy chủ cắt chi tiết
  // người còn sống trước khi trả cây cho người chỉ có quyền xem. Trên nền này
  // **chưa làm**: `02-rls.sql` lọc theo DÒNG, còn việc ấy phải lọc theo CỘT.
  // Đừng đặt lại cờ ấy về `true` cho tới khi có luật thật đứng sau nó.
  state.daLocNguoiConSong = false;

  console.log(
    '[repo] nạp cây: ' + state.index.personById.size + ' người, ' +
    state.index.unionById.size + ' hôn nhân, revision ' + state.revision);

  canhBaoThieuUid(cay);
  return cay;
}

// ============================================================
// KHO MÃ — xin của máy chủ, đổ vào `utils/id.js`
// ============================================================
//
// Từ `luoc-do/26`, mã người/hôn nhân/ảnh duy nhất trên TOÀN phần mềm, nên
// `nextId()` không được tự đếm trong cây đang mở nữa (lý lẽ đầy đủ ở khối
// "KHO MÃ" của `utils/id.js`). File này là chỗ duy nhất được gọi `sb.js`, nên
// nó là chỗ duy nhất đi xin.
//
// ⚠ Lô nhỏ, và có CHỦ Ý. Sổ đếm của Postgres chỉ tiến: mã xin mà không dùng
//   là mất luôn, nên xin thừa một lô lớn ở mỗi lần mở app sẽ đẩy số mã vọt
//   lên trong khi cây chỉ có bảy trăm người. Xin đủ cho một lượt sửa tay, rồi
//   đổ đầy lại sau mỗi lần Lưu.
//
// ⚠ Nhập GEDCOM/Excel thêm hàng trăm người một lúc thì lô này KHÔNG đủ —
//   đường ấy phải tự gọi `xinMa()` với đúng số bản ghi sắp thêm trước khi bắt
//   đầu. Chưa nối; xem `KE-HOACH.md` mục "Còn treo".
const KHO_MOI_LO = { P: 5, U: 3, M: 3 };

/**
 * Đổ đầy những loại mã đã cạn. Người chỉ có quyền xem thì không xin gì —
 * họ không tạo được bản ghi nào, xin là đốt mã suông.
 *
 * Không bao giờ ném lỗi: hết mã thì `nextId()` rơi về phép đếm trong cây và
 * máy chủ chặn bằng `trungma` nếu trùng — còn ném lỗi ở đây là chặn cả việc
 * mở gia phả chỉ vì một sổ đếm.
 */
async function dayKhoMa() {
  if (!suaDuoc()) return;
  const can = Object.keys(KHO_MOI_LO).filter((l) => soMaTrongKho(l) === 0);
  if (!can.length) return;
  try {
    const kq = await Promise.all(can.map((l) => sb.capMa(l, KHO_MOI_LO[l])));
    can.forEach((l, i) => { if (kq[i] && kq[i].ok) napKho(l, kq[i].ds); });
  } catch (e) {
    console.warn('[repo] chưa xin được mã mới: ' + (e && e.message ? e.message : e));
  }
}

/**
 * Xin trước một lô mã — cho đường thêm hàng loạt (nhập GEDCOM/Excel), nơi
 * biết trước sẽ tạo bao nhiêu bản ghi.
 *
 * @param {'P'|'U'|'M'} loai
 * @param {number} so
 * @returns {Promise<{ok:boolean, loi:string|null, so:number}>}
 */
export async function xinMa(loai, so) {
  const kq = await sb.capMa(loai, so);
  if (!kq.ok) return { ok: false, loi: kq.loi, so: 0 };
  napKho(loai, kq.ds);
  return { ok: true, loi: null, so: kq.ds.length };
}

/**
 * Ô gợi ý *"người này đã có trong phần mềm chưa"* lúc thêm người mới (b124a).
 *
 * Đi thẳng xuống máy chủ mỗi lần gõ, KHÔNG nhớ tạm: danh sách phụ thuộc quyền
 * xem của người đang đăng nhập và đổi khi họ được nhận vào một cây khác, nên
 * một bản nhớ tạm ở đây là một bản có thể sai mà không ai biết. Mười dòng bốn
 * chữ thì gọi lại rẻ hơn nhớ.
 */
export async function timNguoiMoiCay(chuoi) {
  if (!state.treeId) return { ok: false, loi: 'Chưa biết đang mở gia phả nào.', ds: [] };
  return sb.timNguoiMoiCay(state.treeId, chuoi);
}

/**
 * Chọn người đứng giữa sơ đồ, theo thứ tự ưu tiên.
 *
 * Mỗi bước đều kiểm người đó CÒN trong chỉ mục hay không. Giá trị lưu ở
 * `user_settings` là một mã chép từ lúc trước; người đó có thể đã bị xoá từ
 * lâu. Không kiểm thì sơ đồ mở ra trống trơn mà không báo gì.
 */
function chonNguoiTrungTam(phien) {
  const con = (id) => !!(id && state.index && state.index.personById.has(id));

  if (con(phien.nguoiTrungTamMacDinh)) return phien.nguoiTrungTamMacDinh;

  const goc = state.tree && state.tree.tree && state.tree.tree.rootPersonId;
  if (con(goc)) return goc;

  const dau = state.index && state.index.personById.keys().next();
  return (dau && !dau.done) ? dau.value : null;
}

/**
 * Lưu cây.
 *
 * ⚠ KHÔNG nhận sẵn một cây đã sửa, mà nhận HÀM SỬA. Luật này chốt 17/08/2026
 * và vẫn nguyên giá trị: *giao diện chỉ đổi SAU khi máy chủ xác nhận*. Nếu
 * nơi gọi sửa thẳng vào `state.tree` rồi mới gọi lưu, thì lúc máy chủ từ chối
 * — hết quyền, xung đột, mất mạng — màn hình đã hiện một điều không đúng sự
 * thật, và không còn bản gốc nào để lùi về.
 *
 * Cách làm: nhân đôi cây, cho `apDung` sửa trên BẢN SAO, **so hai bản** rồi
 * gửi đúng phần khác biệt. Máy chủ gật thì bản sao mới trở thành `state.tree`.
 * Máy chủ lắc thì `state.tree` chưa hề bị đụng vào.
 *
 * Xung đột thì CỐ Ý KHÔNG cập nhật `state.revision`. Nghe có vẻ tiện — "cập
 * nhật rồi lưu lại là xong" — nhưng đó chính là ghi đè mất bản của người kia,
 * tức tự tay làm đúng cái việc mà cả cơ chế này sinh ra để chặn. Đường ra duy
 * nhất là nạp lại cây.
 *
 * @param {function(object):void} apDung  sửa trên bản sao cây; không trả về gì
 * @param {{action?:string, target?:string, note?:string, diff?:object}} [moTa]
 *        `ts` và `by` do máy chủ điền, gửi lên cũng bỏ qua.
 * @returns {Promise<{ok:boolean, lyDo:string|null, loi:string|null,
 *                    revision?:number}>}
 */
export async function luuCay(apDung, moTa) {
  if (!state.tree) {
    return tuChoi('chuanapcay', 'Chưa nạp được gia phả nên chưa lưu được gì.');
  }
  if (!suaDuoc()) {
    return tuChoi('khongcoquyen',
      'Bạn chỉ có quyền xem gia phả, không sửa được. ' +
      'Cần sửa thì nhờ người quản lý đổi quyền cho tài khoản của bạn.');
  }

  // Nhân đôi bằng JSON: cây vốn là dữ liệu JSON thuần, không hàm, không Date,
  // không tham chiếu vòng — nên phép này an toàn.
  const banNhap = JSON.parse(JSON.stringify(state.tree));
  if (typeof apDung === 'function') apDung(banNhap);

  const ops = soSanh(state.tree, banNhap);

  // Mở form rồi bấm Lưu mà không sửa gì phải là một việc KHÔNG xảy ra chuyện
  // gì cả — không một vòng mạng, không một dòng nhật ký, không tăng số bản
  // ghi. Bản Drive không phân biệt được điều này; ở đây thì phân biệt được,
  // vì ta đang cầm trong tay đúng danh sách những gì đã đổi.
  if (!coGiDeGhi(ops)) {
    return { ok: true, lyDo: 'khongdoigi', loi: null, revision: state.revision };
  }

  let kq;
  try {
    kq = await sb.luuCay(state.treeId, state.revision, ops, moTa || null);
  } catch (e) {
    return tuChoi('khongnoiduoc',
      'Không gọi được máy chủ nên chưa lưu được. ' +
      (e && e.message ? e.message : String(e)));
  }

  if (!kq)    return tuChoi('khongtraloi', 'Máy chủ không trả về gì khi lưu.');
  if (!kq.ok) return kq;   // máy chủ đã viết sẵn câu giải thích trong kq.loi

  // Từ đây trở xuống mới được đụng vào state.
  //
  // ⚠ KHÔNG nạp lại cây từ máy chủ ở đây, dù nghe có vẻ chắc chắn hơn. Nạp
  //   lại là một vòng mạng nữa cho mỗi lần sửa một ô, và nó vứt đi bản đã
  //   đúng đang nằm sẵn trong tay. Máy chủ vừa gật nghĩa là bản sao này CHÍNH
  //   LÀ thứ vừa được ghi xuống.
  banNhap.tree.revision  = kq.revision;
  banNhap.tree.updatedAt = (kq.tree && kq.tree.updated_at) || banNhap.tree.updatedAt;
  banNhap.tree.updatedBy = (kq.tree && kq.tree.updated_by) || banNhap.tree.updatedBy;

  // ⚠ Số của CÂY ở trên chưa đủ từ `luoc-do/26`: mỗi bản ghi có số riêng, và
  //   trigger vừa tăng chúng. Không đặt lại thì lần Lưu thứ hai gửi số cũ lên
  //   và bị từ chối bằng `xungdot` — xem `hinh-dang.tangSoSauKhiLuu()`.
  tangSoSauKhiLuu(banNhap, ops);

  // Mục nhật ký mới, ở dạng rút gọn đúng như lúc nạp — chỉ đủ cho
  // `utils/id.js` không cấp lại mã. Xem lời cảnh báo ở `hinh-dang.rapCay`.
  if (moTa && moTa.target) {
    if (!Array.isArray(banNhap.changeLog)) banNhap.changeLog = [];
    banNhap.changeLog.push({ target: moTa.target, diff: moTa.diff || {} });
  }

  state.tree     = banNhap;
  state.index    = buildIndex(banNhap);
  state.revision = kq.revision;
  state.dirty    = false;
  notify();

  // Đổ đầy kho mã cho lượt sửa sau. KHÔNG chờ: lần Lưu đã xong rồi, bắt màn
  // hình đứng thêm một vòng mạng nữa chỉ để chuẩn bị cho việc chưa xảy ra là
  // trả tiền sai lúc.
  dayKhoMa().catch(() => {});

  console.log('[repo] đã lưu: revision ' + kq.revision + ' · ' + tomTat(ops));
  return kq;
}

/** Một câu ngắn kể lần ghi vừa rồi đụng vào bao nhiêu dòng. */
function tomTat(ops) {
  const phan = [];
  for (const ten of ['persons', 'unions', 'children', 'media', 'sources']) {
    const o = ops[ten];
    if (!o) continue;
    if (o.luu.length) phan.push(ten + ' +' + o.luu.length);
    if (o.xoa.length) phan.push(ten + ' -' + o.xoa.length);
  }
  return phan.length ? phan.join(', ') : 'chỉ khối thông tin cây';
}

/** Lời từ chối của chính trình duyệt, cùng khuôn với kết quả máy chủ trả về. */
function tuChoi(lyDo, loi) {
  return { ok: false, lyDo, loi, revision: null };
}

/** Người đang dùng có sửa được không. Lấy từ phiên, KHÔNG tự suy từ email. */
export function suaDuoc() {
  return !!(state.phien && state.phien.suaDuoc);
}

/** Người đang dùng có đọc được không. */
export function docDuoc() {
  return !!(state.phien && state.phien.docDuoc);
}

// ============================================================
// Kiểm tra dữ liệu sau khi nạp
// ============================================================

/**
 * Từ chối thẳng dữ liệu MỚI HƠN app.
 *
 * Mở ra rồi lưu đè sẽ nuốt mất những trường mà app đời này chưa biết đến.
 * Thà không mở còn hơn mở rồi làm mất dữ liệu — và trên Postgres thì mất
 * theo kiểu tệ hơn Drive: `hinh-dang.veBang()` chỉ chép những cột nó biết
 * tên, nên cột mới sẽ bị ghi `null` đè lên mà không có gì kêu.
 */
function kiemPhienBan(cay) {
  const v = Number(cay.version);
  if (!Number.isFinite(v)) {
    throw new Error('Gia phả không ghi số phiên bản dữ liệu.');
  }
  if (v > DATA_VERSION) {
    throw new Error('Dữ liệu là phiên bản ' + v + ', mới hơn app ' +
                    '(phiên bản ' + DATA_VERSION + '). Tải lại trang để lấy ' +
                    'bản app mới trước khi mở.');
  }
  return cay;
}

/**
 * KÊU LÊN khi có bản ghi thiếu `uid`, nhưng **không tự điền**.
 *
 * Bản Apps Script tự điền ngay lúc nạp (`repo.themUidNeuThieu`), và ở đó việc
 * ấy đúng: cả cây là một file, điền xong thì lần lưu sau ghi cả file nên uid
 * xuống đĩa cùng chuyến.
 *
 * Ở đây thì KHÔNG, và cái bẫy nằm đúng chỗ đó: lần lưu sau chỉ gửi phần khác
 * biệt, mà khác biệt tính bằng cách so với `state.tree` — chính là bản đã
 * được điền. Tức uid mới sẽ **không bao giờ** được gửi lên. Mỗi lần mở app
 * lại điền lại, mỗi lần đều thành công, và không ai biết là chúng chưa từng
 * xuống tới cơ sở dữ liệu.
 *
 * Nên chỗ đúng để điền uid là **script di dời dữ liệu**, chạy một lần, ghi
 * thẳng vào bảng. Hàm này chỉ đứng canh xem việc ấy đã làm chưa.
 */
function canhBaoThieuUid(cay) {
  let thieu = 0;
  for (const ten of ['persons', 'unions']) {
    for (const b of cay[ten] || []) if (b && b.id && !b.uid) thieu++;
  }
  if (thieu) {
    console.warn('[repo] ' + thieu + ' bản ghi chưa có uid. Chạy script di ' +
                 'dời để điền, đừng để app tự điền — xem canhBaoThieuUid().');
  }
}

// ============================================================
// DỰNG GIA PHẢ MỚI
// ============================================================

/**
 * Dựng một gia phả MỚI, rỗng, và người gọi thành quản trị của nó.
 *
 * @param {string} ten        tên gia phả
 * @param {{maCay?:string, note?:string, conSong?:()=>boolean}} tuyChon
 *        `maCay` thiếu thì tự gợi ý từ tên. `conSong` giữ nguyên từ bản Drive:
 *        màn hình đóng giữa chừng thì đừng vẽ tiếp lên chỗ không còn.
 * @returns {Promise<{ok:boolean, moi:{fileId:string,ten:string,tenFile:string}|null,
 *                    lyDo:string|null, loi:string|null}>}
 *
 * ⚠ Hình dạng trả về giữ **đúng** hợp đồng của bản Apps Script (`moi.fileId`,
 *   `lyDo: 'daDong'`), vì `pages/import-export.js` và `pages/chon-gia-pha.js`
 *   đang đọc đúng những tên ấy. Đổi ở đây là sửa lan sang hai file không liên
 *   quan gì tới b104.
 *
 * Bản Drive dựng ba thư mục rồi phải đi TÌM lại cây vừa tạo, vì
 * `gas.taoFileDuLieuMoi()` không trả về gì và Drive đánh chỉ mục có độ trễ.
 * Cả đoạn ấy biến mất: trên Postgres đây là hai câu `insert` trong một giao
 * dịch, và máy chủ trả về ngay mã cây.
 */
export async function taoGiaPhaMoi(ten, tuyChon = {}) {
  const conSong = typeof tuyChon.conSong === 'function' ? tuyChon.conSong : null;
  const ngungRoi = () => (conSong ? !conSong() : false);

  const tenSach = String(ten == null ? '' : ten).trim();
  // ⚠ Gợi ý mã bằng `utils/id.js`, KHÔNG viết lại phép sinh mã ở đây. Hàm ấy
  //   thuần, và nó biết hai thứ mà một phép ghép chuỗi vội vàng không biết:
  //   bỏ những từ chung ("gia phả", "họ", "dòng tộc"), và xen kẽ chữ–số để mã
  //   cây không tự khớp khuôn mã bản ghi (`LVTS1234` chứa `S1234`).
  //   Màn hình khu Gia phả điền sẵn mã này rồi để người dùng sửa; hai màn hình
  //   cũ không có ô mã nên nhận thẳng gợi ý.
  const maCay = String(tuyChon.maCay || '').trim() || sinhMaCay(tenSach, tenSach);

  const kq = await sb.taoGiaPhaMoi(tenSach, maCay, tuyChon.note || '');
  if (ngungRoi()) return { ok: false, moi: null, lyDo: 'daDong', loi: null };

  if (!kq.ok) {
    return { ok: false, moi: null, lyDo: 'maychutuchoi', loi: kq.loi };
  }
  return {
    ok: true, lyDo: null, loi: null,
    moi: { fileId: kq.cay.fileId, ten: kq.cay.ten, tenFile: kq.cay.maCay },
  };
}
