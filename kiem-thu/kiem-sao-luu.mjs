// ============================================================
// giapha-supabase · kiem-thu/kiem-sao-luu.mjs
// Vai trò  : Kiểm `sao-luu/SaoLuu.gs` — mã trigger sao lưu chạy trên Apps
//            Script — bằng cách chạy CHÍNH file ấy trong Node, với một
//            Supabase giả và một Google Drive giả.
// Chạy     : cd supabase/kiem-thu && node kiem-sao-luu.mjs
// Phiên bản: 0.4.0 · Cập nhật: 28/09/2026 (b142a) — phép 11b: đối chiếu số
//            dòng đọc được với số thật của máy chủ
// ============================================================
//
// ═══ VÌ SAO BÀI KIỂM NÀY TỒN TẠI ═══
//
// Bản sao lưu là thứ **không ai nhìn cho tới ngày cần tới**. Một trigger chạy
// nền mỗi ngày, ghi ra một file mà không ai mở, và mọi kiểu hỏng của nó đều
// im lặng: đọc thiếu một bảng, phân trang bỏ sót từ dòng 1001, khoá bị lọt
// vào file, dọn nhầm bản cuối cùng còn lại. Cả bốn kiểu ấy đều cho ra một
// file trông rất bình thường.
//
// ⚠ Bài kiểm ĐỌC THẲNG `sao-luu/SaoLuu.gs` rồi chạy nó, chứ không chép lại
//   logic sang JavaScript. Chép lại là kiểm một bản sao — bản sao ấy đúng
//   không nói gì về bản thật. Apps Script chạy V8 nên cùng một mã chạy được
//   trong Node; thứ duy nhất phải giả là bảy đối tượng của Google.
//
// Bài kiểm KHÔNG cần mạng, KHÔNG cần Supabase, KHÔNG cần tài khoản Google.

import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const DAY = dirname(fileURLToPath(import.meta.url));
const FILE_GS = resolve(DAY, '../sao-luu/SaoLuu.gs');
const FILE_SQL = resolve(DAY, '../luoc-do/01-bang.sql');

const NGUON_GS = readFileSync(FILE_GS, 'utf8');

// Bốn giá trị giả, đúng khuôn thật. Từ bản 0.2.0 sao lưu không dùng khoá bí
// mật nữa mà đăng nhập bằng email + mật khẩu rồi đọc bằng phiếu — nên thứ
// **không được lọt** vào file sao lưu nay là mật khẩu và phiếu, chứ không còn
// là khoá. Phép 5 đi tìm đúng ba chuỗi này trong bản sao lưu sinh ra.
const KHOA_CONG_KHAI_THU = 'sb_publishable_KHOA_GIA_KHONG_CO_THAT_0123';
const EMAIL_THU  = 'sao-luu@thunghiem.test';
const MAT_KHAU_THU = 'mat-khau-gia-khong-co-that-0123456789';
const PHIEU_THU = 'eyJhbGciOiJIUzI1NiJ9.PHIEU_GIA_KHONG_CO_THAT.chu-ky-gia';

// Khoá bí mật giả — chỉ dùng cho phép 10, nơi phải chứng minh rằng dán nhầm
// nó vào ô khoá công khai thì bị chặn ngay, không gọi mạng lần nào.
const KHOA_BI_MAT_THU = 'sb_secret_KHOA_GIA_KHONG_CO_THAT_0123456789';
const URL_THU = 'https://thunghiem.supabase.co';
// Tài khoản KHÔI PHỤC ảnh (b154) — khác tài khoản sao lưu, phiếu khác.
const EMAIL_KP = 'khoi-phuc@thunghiem.test';
const MAT_KHAU_KP = 'mat-khau-khoi-phuc-gia-9876543210';
const PHIEU_KP = 'eyJhbGciOiJIUzI1NiJ9.PHIEU_KHOI_PHUC_GIA.chu-ky-gia';
// Vé người bấm trên trang Quản trị (web app, b155d). QTHT ghi được ảnh như
// tài khoản khôi phục, nên dùng chung một phiếu với nó.
const VE_QT = PHIEU_KP;
const VE_THUONG = 'eyJhbGciOiJIUzI1NiJ9.VE_NGUOI_THUONG.chu-ky-gia';
const LUC_THU = new Date('2026-09-03T10:30:00Z');   // 17:30 giờ Việt Nam

let dat = 0;
let hong = 0;
// Mã file/thư mục Drive giả — DÙNG CHUNG cả bài: nhiều môi trường giả chia một
// thư mục (đêm hai, web app), đếm riêng thì mã trùng nhau và phép "ngoài thư
// mục" đạt/hỏng oan.
let soId = 0;
const moiFile = {};            // mã file → file, cho DriveApp.getFileById

// ============================================================
// GIẢ LẬP BẢY ĐỐI TƯỢNG CỦA GOOGLE
// ============================================================

function dungMoiTruong(kichBan = {}) {
  const duLieu = kichBan.duLieu || {};
  const nguoiDung = kichBan.nguoiDung || [];
  const khoAnh = kichBan.khoAnh || {};
  const maLoi = kichBan.maLoi || 0;

  const nhatKy = { goi: [], thu: [], log: [], baoCao: [] };

  // ---- Supabase giả -------------------------------------------------
  const UrlFetchApp = {
    fetch(url, opt) {
      nhatKy.goi.push(url);
      if (maLoi) return traLoi(maLoi, '{"message":"gia vo hong"}');

      const u = new URL(url);
      const duong = u.pathname;

      // ---- Cửa đăng nhập: đổi email + mật khẩu lấy phiếu ----
      // Phải đứng TRƯỚC phép kiểm phiếu bên dưới — lúc gọi cửa này thì đương
      // nhiên chưa có phiếu nào để mà kiểm.
      if (duong === '/auth/v1/token') {
        if (opt.headers.apikey !== KHOA_CONG_KHAI_THU) {
          return traLoi(401, '{"message":"khoa cong khai sai"}');
        }
        const gui = JSON.parse(opt.payload);
        if (gui.email === EMAIL_KP && gui.password === MAT_KHAU_KP) {
          return traLoi(200, JSON.stringify({ access_token: PHIEU_KP }));
        }
        if (gui.email !== EMAIL_THU || gui.password !== MAT_KHAU_THU) {
          return traLoi(400, '{"error":"invalid_grant"}');
        }
        return traLoi(200, JSON.stringify({ access_token: PHIEU_THU }));
      }

      // ---- Web app (b155d): Supabase xác nhận vé của NGƯỜI BẤM ----
      // VE_QT = vé của một Quản trị hệ thống (cũng là phiếu ghi được ảnh —
      // như máy thật, QTHT qua luật `ghi_anh`); VE_THUONG = vé thật, không QTHT.
      if (duong === '/auth/v1/user') {
        const ve = String(opt.headers.Authorization || '').replace('Bearer ', '');
        return [VE_QT, VE_THUONG].includes(ve) ? traLoi(200, '{"id":"u"}') : traLoi(401, '{"msg":"invalid JWT"}');
      }
      if (duong === '/rest/v1/rpc/la_quan_tri_he_thong' &&
          opt.headers.Authorization !== 'Bearer ' + PHIEU_THU) {
        nhatKy.hoiQtht.push(opt.headers.Authorization);
        return traLoi(200, opt.headers.Authorization === 'Bearer ' + VE_QT ? 'true' : 'false');
      }

      // ---- Tải ảnh LÊN kho (khoiPhucAnh, b154) ----
      // Chỉ phiếu của tài khoản KHÔI PHỤC ghi được; phiếu sao lưu bị từ chối
      // như RLS thật (vai `sao_luu` không qua `ghi_anh`). Đứng trước phép kiểm
      // phiếu chung vì phiếu ở đây là phiếu khác.
      if (duong.startsWith('/storage/v1/object/anh/') && opt.method === 'post') {
        const ten = decodeURIComponent(duong.slice('/storage/v1/object/anh/'.length));
        if (opt.headers.Authorization !== 'Bearer ' + PHIEU_KP) {
          return traLoi(400, '{"statusCode":"403","message":"new row violates row-level security policy"}');
        }
        if (khoAnhThat[ten] !== undefined) {
          return traLoi(400, '{"statusCode":"409","error":"Duplicate","message":"The resource already exists"}');
        }
        khoAnhThat[ten] = Buffer.from(opt.payload).toString();
        nhatKy.taiLen.push(ten);
        return traLoi(200, '{"Key":"anh/' + ten + '"}');
      }

      // Khoá công khai nói "khách của project nào", phiếu nói "đã đăng nhập
      // là ai". Supabase đòi cả hai, và RLS chỉ đọc được `auth.uid()` từ phiếu.
      if (opt.headers.apikey !== KHOA_CONG_KHAI_THU ||
          opt.headers.Authorization !== 'Bearer ' + PHIEU_THU) {
        return traLoi(401, '{"message":"thieu khoa hoac phieu"}');
      }

      // ---- Danh sách tài khoản: nay là một hàm SQL, không còn Admin API ----
      // Phải đứng TRƯỚC nhánh `/rest/v1/` chung, kẻo bị bắt nhầm thành một
      // bảng tên `rpc/ds_tai_khoan`.
      if (duong === '/rest/v1/rpc/ds_tai_khoan') {
        return traLoi(200, JSON.stringify(nguoiDung));
      }
      // Sáu bảng hệ thống (`luoc-do/44`, b137). `heThongHong` = máy chủ chưa
      // dán `44` → 404, bản sao lưu gia phả vẫn phải ghi được.
      if (duong === '/rest/v1/rpc/sao_luu_bang_he_thong') {
        if (kichBan.heThongHong) return traLoi(404, '{"message":"function not found"}');
        return traLoi(200, JSON.stringify(kichBan.heThong || { ok: true, bang: {
          cau_hinh: [{ chi_mot_dong: true }], tai_khoan: [{ user_id: 'u1' }, { user_id: 'u2' }],
          doi_ma_toan_cuc: [], de_xuat_gan_nguoi: [], de_nghi_quan_he: [], de_xuat_dong_ho: [] } }));
      }
      // Số dòng thật (`luoc-do/45`, b142a). Mặc định = đúng số dòng máy chủ giả
      // có, tức đọc đủ. `demThat` đè từng bảng để giả cảnh RLS giấu bớt dòng;
      // `demThatHong` = máy chủ chưa dán `45`.
      if (duong === '/rest/v1/rpc/sao_luu_dem_that') {
        if (kichBan.demThatHong) return traLoi(404, '{"message":"function not found"}');
        const d = {};
        for (const [t, hang] of Object.entries(duLieu)) d[t] = hang.length;
        return traLoi(200, JSON.stringify({ ok: true, dem: { ...d, ...(kichBan.demThat || {}) } }));
      }

      // Báo kết quả vào Nhật ký hệ thống (`luoc-do/49`, b147). `nhatKyHong` =
      // máy chủ chưa dán `49` → 404; bản sao lưu vẫn phải đi tiếp y như cũ.
      if (duong === '/rest/v1/rpc/ghi_sao_luu_dem') {
        nhatKy.baoCao.push(JSON.parse(opt.payload).p_ket_qua);
        if (kichBan.nhatKyHong) return traLoi(404, '{"message":"function not found"}');
        return traLoi(200, '{"ok":true,"suKien":"sao_luu_dem"}');
      }

      // Dấu vân tay file vừa ghi (`luoc-do/54`, b155a). `dauHong` = chưa dán `54`.
      if (duong === '/rest/v1/rpc/ghi_bam_sao_luu') {
        nhatKy.dau.push(JSON.parse(opt.payload));
        if (kichBan.dauHong) return traLoi(404, '{"message":"function not found"}');
        return traLoi(200, '{"ok":true}');
      }

      if (duong.startsWith('/rest/v1/')) {
        const bang = duong.slice('/rest/v1/'.length);
        // `hongBang` = đọc đúng một bảng thì máy chủ trả 500 (hỏng SAU đăng nhập).
        if (kichBan.hongBang === bang) return traLoi(500, '{"message":"gia vo hong bang"}');
        const hang = duLieu[bang] || [];
        if (opt.headers.Prefer === 'count=exact') {
          return traLoi(200, JSON.stringify(hang.slice(0, 1)),
                        { 'content-range': '0-0/' + hang.length });
        }
        const gioiHan = Number(u.searchParams.get('limit'));
        const bo = Number(u.searchParams.get('offset')) || 0;
        return traLoi(200, JSON.stringify(hang.slice(bo, bo + gioiHan)));
      }

      if (duong.startsWith('/storage/v1/object/list/')) {
        const than = JSON.parse(opt.payload);
        const muc = khoAnh[than.prefix] || lietKeTuKhoThat(than.prefix);
        return traLoi(200, JSON.stringify(
          muc.slice(than.offset, than.offset + than.limit)));
      }

      // ---- Tải ảnh VỀ (b154) — `anhHong` = những đường dẫn trả 404 ----
      if (duong.startsWith('/storage/v1/object/authenticated/anh/')) {
        const ten = decodeURIComponent(duong.slice('/storage/v1/object/authenticated/anh/'.length));
        nhatKy.taiVe.push(ten);
        if ((kichBan.anhHong || []).includes(ten) || khoAnhThat[ten] === undefined) {
          return traLoi(404, '{"message":"Object not found"}');
        }
        return traLoi(200, khoAnhThat[ten], {}, taoBlob(khoAnhThat[ten]));
      }

      return traLoi(404, '{"message":"khong co duong nay"}');
    }
  };

  function traLoi(ma, chu, dau = {}, blob = null) {
    return {
      getResponseCode: () => ma,
      getContentText: () => chu,
      getHeaders: () => dau,
      getBlob: () => blob
    };
  }

  // Kho ảnh "thật" của máy chủ giả: đường dẫn → nội dung. Liệt kê được suy ra
  // từ đây khi kịch bản không đưa `khoAnh` dựng sẵn.
  const khoAnhThat = Object.assign({}, kichBan.khoAnhThat || {});
  nhatKy.taiVe = [];
  nhatKy.taiLen = [];
  nhatKy.dau = [];
  nhatKy.hoiQtht = [];
  function lietKeTuKhoThat(tienTo) {
    const ds = Object.keys(khoAnhThat).sort();
    if (tienTo === '') {
      return [...new Set(ds.map((d) => d.split('/')[0]))].map((c) => ({ name: c, id: null }));
    }
    return ds.filter((d) => d.startsWith(tienTo)).map((d) => ({
      name: d.slice(tienTo.length), id: 'o-' + d,
      metadata: { size: khoAnhThat[d].length }, updated_at: 'x' }));
  }
  function taoBlob(noiDung, ten = '') {
    return {
      _noiDung: noiDung, _ten: ten,
      setName(t) { this._ten = t; return this; },
      getContentType: () => 'image/jpeg',
      getBytes() { return [...Buffer.from(this._noiDung)]; },
      getDataAsString() { return String(this._noiDung); }
    };
  }

  // ---- Google Drive giả ---------------------------------------------
  function taoFile(ten, noiDung, cha = null) {
    const f = {
      _ten: ten, _noiDung: noiDung, _thungRac: false, _id: 'f' + (++soId), _cha: cha,
      getId() { return this._id; },
      getParents() {
        const ds = this._cha ? [this._cha] : [];
        let i = 0;
        return { hasNext: () => i < ds.length, next: () => ds[i++] };
      },
      getName() { return this._ten; },
      getSize() { return this._noiDung.length; },
      setTrashed(v) { this._thungRac = v; },
      isTrashed() { return this._thungRac; },
      getBlob() { return taoBlob(this._noiDung, this._ten); }
    };
    moiFile[f._id] = f;
    return f;
  }
  // ⚠ `getFiles()` của Drive thật trả CẢ tệp trong thùng rác — nên bản giả
  //   cũng trả, và mã phải tự hỏi `isTrashed()`. Riêng hàm `duyet()` cuối bài
  //   lọc bỏ để các phép cũ đếm file như trước.
  function taoThuMuc(ten) {
    const tep = [];
    const con = [];
    const tm = {
      _ten: ten, _tep: tep, _con: con, _id: 'd' + (++soId),
      getId() { return this._id; },
      getName() { return ten; },
      createFile(t, n) {
        const f = typeof t === 'string' ? taoFile(t, n, tm) : taoFile(t._ten, t._noiDung, tm);
        tep.push(f); return f;
      },
      getFiles() {
        let i = 0;
        return { hasNext: () => i < tep.length, next: () => tep[i++] };
      },
      getFoldersByName(t) {
        const ds = con.filter((c) => c._ten === t);
        let i = 0;
        return { hasNext: () => i < ds.length, next: () => ds[i++] };
      },
      getFolders() {
        let i = 0;
        return { hasNext: () => i < con.length, next: () => con[i++] };
      },
      createFolder(t) { const c = taoThuMuc(t); con.push(c); return c; }
    };
    return tm;
  }
  const thuMucCo = kichBan.thuMuc || taoThuMuc('Sao luu gia pha (Supabase)');
  const DriveApp = {
    getFoldersByName() {
      let xong = false;
      return { hasNext: () => !xong, next: () => { xong = true; return thuMucCo; } };
    },
    createFolder(t) { return taoThuMuc(t); },
    getFolderById() { return thuMucCo; },
    getFileById(id) {
      if (!moiFile[id]) throw new Error('No item with the given ID could be found');
      return moiFile[id];
    }
  };
  // Web app (b155d): trả chữ JSON như ContentService thật.
  const ContentService = {
    MimeType: { JSON: 'json' },
    createTextOutput(chu) { return { _chu: chu, setMimeType() { return this; } }; }
  };

  // ---- Script Properties giả -----------------------------------------
  const kho = Object.assign({
    SUPABASE_URL: URL_THU,
    KHOA_CONG_KHAI: KHOA_CONG_KHAI_THU,
    EMAIL_SAO_LUU: EMAIL_THU,
    MAT_KHAU_SAO_LUU: MAT_KHAU_THU
  }, kichBan.thuocTinh || {});
  const PropertiesService = {
    getScriptProperties: () => ({
      getProperty: (k) => (k in kho ? kho[k] : null),
      setProperty: (k, v) => { kho[k] = v; }
    })
  };

  // ---- Còn lại --------------------------------------------------------
  const MailApp = {
    sendEmail(den, tieuDe, than) { nhatKy.thu.push({ den, tieuDe, than }); }
  };
  const Session = { getEffectiveUser: () => ({ getEmail: () => 'thu@thu.thu' }) };
  const Logger = { log: (x) => nhatKy.log.push(String(x)) };

  const lich = [];
  const ScriptApp = {
    newTrigger(ham) {
      return { timeBased: () => ({
        everyDays: () => ({ atHour: () => ({ create() { lich.push(ham); } }) })
      }) };
    },
    getProjectTriggers: () => lich.map((h, i) => ({
      getHandlerFunction: () => h, _i: i
    })),
    deleteTrigger: (t) => { lich.splice(lich.indexOf(t.getHandlerFunction()), 1); }
  };

  const Utilities = {
    // Như Apps Script thật: mảng byte CÓ DẤU (-128…127).
    DigestAlgorithm: { SHA_256: 'sha256' },
    Charset: { UTF_8: 'utf8' },
    computeDigest(alg, chu, cs) {
      return [...createHash(alg).update(Buffer.from(chu, cs)).digest()].map((b) => (b > 127 ? b - 256 : b));
    },
    formatDate(d, _tz, khuon) {
      // Giờ Việt Nam = UTC+7. Đủ dùng cho bài kiểm; Apps Script làm thật.
      const v = new Date(d.getTime() + 7 * 3600 * 1000);
      const hai = (n) => String(n).padStart(2, '0');
      const Y = v.getUTCFullYear(), M = hai(v.getUTCMonth() + 1);
      const D = hai(v.getUTCDate()), h = hai(v.getUTCHours());
      const p = hai(v.getUTCMinutes());
      if (khuon === 'yyyy-MM-dd-HHmm') return `${Y}-${M}-${D}-${h}${p}`;
      return `${D}/${M}/${Y} ${h}:${p}`;
    }
  };

  // Đồng hồ đứng yên, để tên file sinh ra là con số đoán trước được.
  const NgayThat = Date;
  function NgayGia(...a) { return a.length ? new NgayThat(...a) : new NgayThat(LUC_THU); }
  // `dongHo` = đồng hồ chạy (b154, đo giới hạn thời gian của phần chép ảnh).
  NgayGia.now = kichBan.dongHo || (() => LUC_THU.getTime());

  const ten = ['UrlFetchApp', 'DriveApp', 'PropertiesService', 'MailApp',
               'Session', 'Logger', 'ScriptApp', 'Utilities', 'Date', 'ContentService'];
  const gia = [UrlFetchApp, DriveApp, PropertiesService, MailApp,
               Session, Logger, ScriptApp, Utilities, NgayGia, ContentService];

  const nap = new Function(...ten, NGUON_GS + `
    return { kiemTraKetNoi, saoLuuNgay, datLichSaoLuu, goLichSaoLuu, khoiPhucAnh, doGet, doPost,
             gomSaoLuu_, docBang_, docKhoAnh_, donBanCu_, docCauHinh_,
             THU_TU_DOC, BANG_HE_THONG, KHUON_TEN_FILE };
  `);

  return { api: nap(...gia), nhatKy, thuMuc: thuMucCo, kho, lich, taoThuMuc, taoFile, khoAnhThat };
}

// ============================================================
// DỮ LIỆU GIẢ
// ============================================================

function cayGia({ soNguoi = 5, soNhatKy = 3 } = {}) {
  const cay = '00000000-0000-4000-8000-000000000001';
  const d = {
    trees: [{ id: cay, tree_code: 'THU', name: 'Cây thử', revision: 7 }],
    tree_members: [{ tree_id: cay, user_id: 'u1', role: 'quan_tri_he_thong' }],
    branches: [],
    branch_access: [],
    persons: [],
    unions: [],
    union_children: [],
    media: [],
    sources: [],
    change_log: [],
    imports: [],
    user_settings: [{ user_id: 'u1', tree_id: cay, focus_person_id: 'P0001' }]
  };
  for (let i = 1; i <= soNguoi; i++) {
    d.persons.push({ tree_id: cay, id: 'P' + String(i).padStart(4, '0'),
                     names: [{ type: 'chinh', full: 'Người ' + i }] });
  }
  for (let i = 1; i <= soNhatKy; i++) {
    d.change_log.push({ id: i, tree_id: cay, action: 'sua', target: 'P0001' });
  }
  return d;
}

// ============================================================
// CÁC PHÉP KIỂM
// ============================================================

console.log('KIỂM SAO LƯU — chạy thẳng sao-luu/SaoLuu.gs trong Node\n');

// ---- 1. Danh sách bảng khớp lược đồ ---------------------------------
//
// ⚠ Đọc CẢ thư mục `luoc-do/`, không riêng `01-bang.sql` (đổi ở b122b). Bảng
//   mọc thêm ở file sau — `tree_persons` của `26` là ví dụ, và thiếu nó thì
//   bản sao lưu có đủ người mà không biết người nào của cây nào.
//
// ⚠ CHUA_SAO_LUU là danh sách những bảng CỐ Ý chưa sao lưu, không phải chỗ
//   giấu rác. Mỗi tên ở đây là một lỗ đã biết, có ghi ở `KE-HOACH.md`; thêm
//   một tên vào đây mà không ghi ra là biến bộ kiểm thành thứ gật bừa.
// b137: sáu bảng hệ thống đã vào (`BANG_HE_THONG` của SaoLuu.gs, qua hàm `44`).
// b146: `bao_trung_nguoi` — con trỏ gộp đã nằm ở `persons.meta.gopVao` +
//   `change_log.truoc`; mất bảng chỉ mất đơn đang chờ (báo lại được).
// b155a: `ban_sao_luu_da_ghi` (`54`) — sổ dấu vân tay; khôi phục về hôm qua
//   KHÔNG được xoá dấu của các bản ghi sau hôm qua, nên nó đứng ngoài cả sao
//   lưu lẫn 19 bảng khôi phục.
const CHUA_SAO_LUU = ['nhat_ky_he_thong', 'nhat_ky_lo_rac', 'bao_trung_nguoi', 'ban_sao_luu_da_ghi'];
{
  const thuMuc = dirname(FILE_SQL);
  const trongSql = [];
  for (const f of readdirSync(thuMuc).filter((x) => x.endsWith('.sql')).sort()) {
    const van = readFileSync(resolve(thuMuc, f), 'utf8');
    for (const m of van.matchAll(/create table if not exists public\.(\w+)/g)) {
      if (!trongSql.includes(m[1])) trongSql.push(m[1]);
    }
  }
  trongSql.sort();
  const { api } = dungMoiTruong();
  const trongGs = [...Object.keys(api.THU_TU_DOC), ...api.BANG_HE_THONG].sort();
  const thieu = trongSql.filter((t) => !trongGs.includes(t) && !CHUA_SAO_LUU.includes(t));
  const thua = trongGs.filter((t) => !trongSql.includes(t));
  kiem('mọi bảng của luoc-do/ đều được sao lưu, không thừa bảng nào',
       thieu.length === 0 && thua.length === 0 && trongSql.length === 23,
       `sql=${trongSql.length} gs=${trongGs.length}` +
       (thieu.length ? ' · THIẾU: ' + thieu.join(',') : '') +
       (thua.length ? ' · THỪA: ' + thua.join(',') : ''));
}

// ---- 2. Phân trang: bảng vượt một nghìn dòng -------------------------
{
  const duLieu = cayGia({ soNguoi: 5, soNhatKy: 2500 });
  const { api, nhatKy } = dungMoiTruong({ duLieu });
  const doc = api.docBang_(api.docCauHinh_(), 'change_log');
  const ma = new Set(doc.map((r) => r.id));
  const soGoi = nhatKy.goi.filter((u) => u.includes('/change_log')).length;
  kiem('đọc đủ 2500 dòng qua 3 trang, không sót không trùng',
       doc.length === 2500 && ma.size === 2500 && doc[0].id === 1 &&
       doc[2499].id === 2500 && soGoi === 3,
       `đọc ${doc.length} dòng · ${ma.size} mã khác nhau · ${soGoi} lượt gọi`);
}

// ---- 3b. Chưa dán `44`: bản sao lưu gia phả VẪN có, file nói rõ thiếu gì --
{
  const { api } = dungMoiTruong({ duLieu: cayGia({ soNguoi: 5, soNhatKy: 2 }), heThongHong: true });
  const ban = api.gomSaoLuu_(api.docCauHinh_());
  kiem('hàm hệ thống hỏng → vẫn đủ bảng gia phả, file mang loiBangHeThong',
       ban.dem.persons === 5 && ban.loiBangHeThong !== '' && !('tai_khoan' in ban.bang),
       'persons=' + ban.dem.persons + ' · loi=' + String(ban.loiBangHeThong).slice(0, 60));
}

// ---- 3. Bản sao lưu có đủ mọi phần -----------------------------------
{
  const duLieu = cayGia({ soNguoi: 681, soNhatKy: 40 });
  const { api } = dungMoiTruong({
    duLieu,
    nguoiDung: [{ id: 'u1', email: 'a@b.c', created_at: 'x' }],
    khoAnh: { '': [{ name: 'cay1', id: null }],
              'cay1/': [{ name: 'M0001-nho.jpg', id: 'o1',
                          metadata: { size: 4000 }, updated_at: 'y' }] }
  });
  const ban = api.gomSaoLuu_(api.docCauHinh_());
  const thieuBang = Object.keys(api.THU_TU_DOC).filter((t) => !(t in ban.bang));
  kiem('file sao lưu chứa đủ 12 bảng + tài khoản + kho ảnh',
       thieuBang.length === 0 && Array.isArray(ban.nguoiDung) &&
       ban.khoAnh && Array.isArray(ban.khoAnh.tep),
       thieuBang.length ? 'thiếu ' + thieuBang.join(',') : 'đủ');

  const thieuHT = api.BANG_HE_THONG.filter((t) => !Array.isArray(ban.bang[t]));
  kiem('file sao lưu chứa đủ sáu bảng hệ thống (b137), không ghi lỗi',
       thieuHT.length === 0 && ban.dem.tai_khoan === 2 && ban.loiBangHeThong === '',
       thieuHT.length ? 'thiếu ' + thieuHT.join(',') : 'tai_khoan=' + ban.dem.tai_khoan);

  kiem('số đếm khớp đúng số dòng có thật',
       ban.dem.persons === 681 && ban.dem.change_log === 40 &&
       ban.dem.trees === 1 && ban.dem.nguoiDung === 1 && ban.dem.anh === 1,
       `persons=${ban.dem.persons} change_log=${ban.dem.change_log} ` +
       `nguoiDung=${ban.dem.nguoiDung} anh=${ban.dem.anh}`);

  kiem('kho ảnh đi xuống hai bậc, đếm tệp chứ không đếm thư mục',
       ban.khoAnh.tep.length === 1 &&
       ban.khoAnh.tep[0].ten === 'cay1/M0001-nho.jpg' &&
       ban.khoAnh.tongByte === 4000,
       JSON.stringify(ban.khoAnh.tep));

  // ⚠ Phép đáng giá nhất trong bài: thứ mở được cửa KHÔNG được có mặt trong
  //   thứ ghi ra Drive. Bản sao lưu bị chia sẻ nhầm mà mang theo mật khẩu hay
  //   phiếu thì người nhận đăng nhập được vào cơ sở dữ liệu SỐNG.
  //
  //   Từ bản 0.2.0 danh sách thứ phải canh dài ra: mật khẩu và phiếu đăng
  //   nhập, chứ không chỉ khoá. Vẫn canh cả `sb_secret_` để bắt trường hợp ai
  //   đó quay lại cách cũ mà quên bài kiểm này.
  const chu = JSON.stringify(ban);
  const loLot = [
    ['mật khẩu', MAT_KHAU_THU],
    ['phiếu đăng nhập', PHIEU_THU],
    ['khoá bí mật', 'sb_secret_']
  ].filter(([, v]) => chu.includes(v)).map(([t]) => t);
  kiem('mật khẩu · phiếu · khoá bí mật KHÔNG lọt vào nội dung bản sao lưu',
       loLot.length === 0,
       loLot.length ? 'CÓ LỌT: ' + loLot.join(', ') : 'sạch');
}

// ---- 4. Chạy trọn một lần sao lưu ------------------------------------
{
  const { api, thuMuc, nhatKy, kho } = dungMoiTruong({ duLieu: cayGia() });
  api.saoLuuNgay();
  const tep = [...duyet(thuMuc)];
  kiem('ghi đúng một file, tên mang dấu thời gian đoán trước được',
       tep.length === 1 && tep[0].getName() === 'giapha-sao-luu-2026-09-03-1730.json',
       tep.length ? tep[0].getName() : '(không có file nào)');

  const doc = JSON.parse(tep[0]._noiDung);
  kiem('file đọc lại được bằng JSON.parse và mang đúng nhãn khuôn',
       doc.khuon === 'giapha-sao-luu' && doc.nguon === URL_THU &&
       doc.taoLucVn === '03/09/2026 17:30',
       `${doc.khuon} · ${doc.taoLucVn}`);

  kiem('lần đầu chưa có số cũ để so → không gửi thư cảnh báo nào',
       nhatKy.thu.length === 0, `${nhatKy.thu.length} thư`);

  kiem('số đếm được nhớ lại để lần sau so',
       JSON.parse(kho.DEM_LAN_TRUOC).persons === 5, kho.DEM_LAN_TRUOC);
}

// ---- 5. Sụt giảm dữ liệu -> hét lên, nhưng VẪN ghi -------------------
{
  const truoc = { persons: 681, change_log: 40 };
  const { api, thuMuc, nhatKy } = dungMoiTruong({
    duLieu: cayGia({ soNguoi: 5, soNhatKy: 40 }),
    thuocTinh: { DEM_LAN_TRUOC: JSON.stringify(truoc) }
  });
  api.saoLuuNgay();
  const tep = [...duyet(thuMuc)];
  kiem('681 → 5 người: có gửi thư cảnh báo',
       nhatKy.thu.length === 1 && /ít dữ liệu hơn/.test(nhatKy.thu[0].tieuDe),
       nhatKy.thu.map((t) => t.tieuDe).join(' | ') || '(không thư)');
  kiem('sụt giảm vẫn GHI file — không từ chối sao lưu',
       tep.length === 1, `${tep.length} file`);
  kiem('bảng không sụt (change_log 40 → 40) không bị nhắc trong thư',
       nhatKy.thu.length === 1 && nhatKy.thu[0].than.includes('persons') &&
       !nhatKy.thu[0].than.includes('change_log'),
       (nhatKy.thu[0] || {}).than ? 'đúng phần nhắc' : '(không thư)');
}

// ---- 6. Không sụt thì im lặng ----------------------------------------
{
  const { api, nhatKy } = dungMoiTruong({
    duLieu: cayGia({ soNguoi: 681 }),
    thuocTinh: { DEM_LAN_TRUOC: JSON.stringify({ persons: 680, change_log: 3 }) }
  });
  api.saoLuuNgay();
  kiem('681 người sau 680 người: không thư, không ồn',
       nhatKy.thu.length === 0, `${nhatKy.thu.length} thư`);
}

// ---- 7. Nghi ngờ thì KHÔNG dọn bản cũ --------------------------------
{
  const moi = dungMoiTruong();
  const thuMuc = moi.taoThuMuc('cu');
  for (let i = 1; i <= 40; i++) {
    thuMuc.createFile('giapha-sao-luu-2026-0' + (i <= 20 ? '1' : '2') +
                      '-' + String((i % 28) + 1).padStart(2, '0') +
                      '-0200.json', '{}');
  }
  const { api } = dungMoiTruong({
    duLieu: cayGia({ soNguoi: 5 }), thuMuc,
    thuocTinh: { DEM_LAN_TRUOC: JSON.stringify({ persons: 681 }) }
  });
  const truoc = [...duyet(thuMuc)].length;
  api.saoLuuNgay();
  const sau = [...duyet(thuMuc)].length;
  kiem('sụt giảm đáng ngờ thì bỏ qua bước dọn, không xoá bản cũ nào',
       sau === truoc + 1, `${truoc} file → ${sau} file`);
}

// ---- 8. Dọn bản cũ: giữ N gần nhất + một bản mỗi tháng ----------------
{
  const moi = dungMoiTruong();
  const thuMuc = moi.taoThuMuc('cu');
  // 5 tháng, mỗi tháng 10 bản.
  for (const thang of ['05', '06', '07', '08', '09']) {
    for (let ngay = 1; ngay <= 10; ngay++) {
      thuMuc.createFile('giapha-sao-luu-2026-' + thang + '-' +
                        String(ngay).padStart(2, '0') + '-0200.json', '{}');
    }
  }
  thuMuc.createFile('so-tay-cua-toi.txt', 'khong phai ban sao luu');

  const daXoa = moi.api.donBanCu_(thuMuc, 12);
  const con = [...duyet(thuMuc)].map((f) => f.getName());
  const conSaoLuu = con.filter((t) => t.startsWith('giapha-sao-luu-'));
  const thangCon = new Set(conSaoLuu.map((t) => t.slice(15, 22)));

  // 12 bản gần nhất phủ tháng 09 (10 bản) và hai bản cuối tháng 08.
  // Ngoài ra giữ thêm một bản cho mỗi tháng 07, 06, 05 → 15 bản.
  kiem('giữ 12 bản gần nhất cộng một bản cho mỗi tháng cũ',
       conSaoLuu.length === 15 && daXoa === 35 && thangCon.size === 5,
       `còn ${conSaoLuu.length} bản · ${thangCon.size} tháng · xoá ${daXoa}`);
  kiem('file không phải bản sao lưu thì không đụng tới',
       con.includes('so-tay-cua-toi.txt'), con.join(' '));
  kiem('bản mới nhất luôn còn',
       conSaoLuu.includes('giapha-sao-luu-2026-09-10-0200.json'),
       conSaoLuu.slice(0, 3).join(' '));
}

// ---- 9. Máy chủ hỏng -> ném lỗi, gửi thư, KHÔNG ghi file dở ----------
{
  const { api, thuMuc, nhatKy } = dungMoiTruong({
    duLieu: cayGia(), maLoi: 500
  });
  let daNem = false;
  try { api.saoLuuNgay(); } catch (e) { daNem = true; }
  kiem('máy chủ trả 500: ném lỗi tiếp cho Google ghi sổ',
       daNem, daNem ? 'có ném' : 'NUỐT LỖI');
  kiem('máy chủ trả 500: gửi thư báo hỏng',
       nhatKy.thu.length === 1 && /SAO LƯU HỎNG/.test(nhatKy.thu[0].tieuDe),
       nhatKy.thu.map((t) => t.tieuDe).join(' | ') || '(không thư)');
  kiem('máy chủ trả 500: KHÔNG để lại file sao lưu dở dang',
       [...duyet(thuMuc)].length === 0, `${[...duyet(thuMuc)].length} file`);
}

// ---- 10. Khoá sai bị chặn trước khi chạm mạng ------------------------
{
  // ⚠ PHÉP NÀY ĐÃ ĐẢO CHIỀU Ở BẢN 0.2.0. Trước: dán khoá CÔNG KHAI vào ô khoá
  //   bí mật là lỗi. Nay ngược lại — sao lưu không dùng khoá bí mật nữa, nên
  //   dán khoá BÍ MẬT vào là lỗi. Để nó ở đây còn có việc thứ hai: ngày ai đó
  //   định "cho gọn" bằng cách quay lại khoá bí mật, phép này đỏ ngay.
  const a = dungMoiTruong({
    thuocTinh: { KHOA_CONG_KHAI: KHOA_BI_MAT_THU }
  });
  let loiA = '';
  try { a.api.saoLuuNgay(); } catch (e) { loiA = e.message; }
  kiem('dán nhầm khoá BÍ MẬT: chặn ngay, không gọi mạng lần nào',
       /khoá BÍ MẬT/i.test(loiA) && a.nhatKy.goi.length === 0,
       `${a.nhatKy.goi.length} lượt gọi · ${loiA.slice(0, 45)}`);

  const b = dungMoiTruong({ thuocTinh: { KHOA_CONG_KHAI: '' } });
  let loiB = '';
  try { b.api.saoLuuNgay(); } catch (e) { loiB = e.message; }
  kiem('chưa điền khoá: câu lỗi chỉ đúng chỗ phải mở',
       /Script\s*\n?\s*Properties/.test(loiB) || /Script Properties/.test(loiB),
       loiB.slice(0, 60));

  // Thiếu mật khẩu cũng phải chặn tại chỗ. Không có phép này thì thiếu mật
  // khẩu sẽ đi tới tận cửa đăng nhập rồi mới hỏng, với câu lỗi của Supabase
  // chứ không phải câu lỗi tiếng Việt chỉ đúng ô phải điền.
  const mk = dungMoiTruong({ thuocTinh: { MAT_KHAU_SAO_LUU: '' } });
  let loiMk = '';
  try { mk.api.saoLuuNgay(); } catch (e) { loiMk = e.message; }
  kiem('thiếu mật khẩu: chặn trước khi gọi mạng, câu lỗi nêu đủ bốn ô',
       /MAT_KHAU_SAO_LUU/.test(loiMk) && mk.nhatKy.goi.length === 0,
       `${mk.nhatKy.goi.length} lượt gọi · ${loiMk.slice(0, 45)}`);

  // Sai mật khẩu thì hỏng ở cửa đăng nhập — và câu lỗi phải nói đúng chỗ ấy,
  // không được đổ cho bảng hay cho RLS.
  const sai = dungMoiTruong({ thuocTinh: { MAT_KHAU_SAO_LUU: 'sai-mat-khau' } });
  let loiSai = '';
  try { sai.api.saoLuuNgay(); } catch (e) { loiSai = e.message; }
  kiem('sai mật khẩu: câu lỗi chỉ vào tài khoản sao lưu, không đổ cho bảng',
       /đăng nhập/i.test(loiSai) && /EMAIL_SAO_LUU|MAT_KHAU_SAO_LUU/.test(loiSai),
       loiSai.slice(0, 60));

  const c = dungMoiTruong({ thuocTinh: { SUPABASE_URL: 'https://x.supabase.co/' } });
  c.api.saoLuuNgay();
  kiem('địa chỉ thừa dấu / ở cuối vẫn chạy, không đẻ ra //rest',
       c.nhatKy.goi.every((u) => !u.includes('.co//')),
       c.nhatKy.goi[0] || '(không gọi)');
}

// ---- 11. kiemTraKetNoi chỉ nhìn, không ghi ---------------------------
{
  const { api, thuMuc, nhatKy } = dungMoiTruong({
    duLieu: cayGia({ soNguoi: 681, soNhatKy: 40 }),
    nguoiDung: [{ id: 'u1', email: 'a@b.c' }]
  });
  const ket = api.kiemTraKetNoi();
  kiem('kiemTraKetNoi đếm đúng mà KHÔNG ghi file, KHÔNG gửi thư',
       /persons: 681/.test(ket) && /change_log: 40/.test(ket) &&
       [...duyet(thuMuc)].length === 0 && nhatKy.thu.length === 0,
       `${[...duyet(thuMuc)].length} file · ${nhatKy.thu.length} thư`);
  kiem('đếm bằng header content-range, không tải cả bảng về',
       nhatKy.goi.filter((u) => u.includes('/persons')).length === 1 &&
       nhatKy.goi.some((u) => u.includes('/persons?select=*&limit=1')),
       nhatKy.goi.find((u) => u.includes('/persons')) || '(không gọi)');
}

// ---- 11b. Đối chiếu với số THẬT của máy chủ (b142a) -------------------
//
// ⚠ Lỗ b142a: cây không có dòng `sao_luu` bị RLS giấu SẠCH — file vẫn đẹp,
//   `dem` trong file khớp chính nó. Chỉ số đếm phía máy chủ lộ ra chỗ thiếu.
{
  const du = dungMoiTruong({ duLieu: cayGia({ soNguoi: 59 }) });
  du.api.saoLuuNgay();
  const banDu = JSON.parse([...duyet(du.thuMuc)][0]._noiDung);
  kiem('đọc đủ: file mang demMayChu, không cờ thiếu, không thư',
       banDu.demMayChu && banDu.demMayChu.persons === 59 && banDu.thieuSoVoiMayChu === '' &&
       banDu.loiDemThat === '' && du.nhatKy.thu.length === 0,
       `thieu='${banDu.thieuSoVoiMayChu}' · ${du.nhatKy.thu.length} thư`);

  const moi = dungMoiTruong();
  const thuMuc = moi.taoThuMuc('cu');
  for (let i = 1; i <= 40; i++) {
    thuMuc.createFile('giapha-sao-luu-2026-08-' + String((i % 28) + 1).padStart(2, '0') +
                      '-' + String(i).padStart(4, '0') + '.json', '{}');
  }
  const thieu = dungMoiTruong({ duLieu: cayGia({ soNguoi: 59 }), thuMuc,
                                demThat: { trees: 3, persons: 740 } });
  const truoc = [...duyet(thuMuc)].length;
  thieu.api.saoLuuNgay();
  const sau = [...duyet(thuMuc)].length;
  const tepMoi = [...duyet(thuMuc)].find((f) => f.getName().startsWith('giapha-sao-luu-2026-09'));
  const ban = JSON.parse(tepMoi._noiDung);
  kiem('RLS giấu cây: file mang cờ thiếu, nêu đúng hai bảng thiếu',
       /persons: máy chủ có 740, sao lưu đọc được 59/.test(ban.thieuSoVoiMayChu) &&
       /trees: máy chủ có 3/.test(ban.thieuSoVoiMayChu) && !/change_log/.test(ban.thieuSoVoiMayChu),
       ban.thieuSoVoiMayChu.slice(0, 120));
  kiem('RLS giấu cây: gửi thư ⛔ THIẾU, chỉ vào luoc-do/45',
       thieu.nhatKy.thu.length === 1 && /THIẾU/.test(thieu.nhatKy.thu[0].tieuDe) &&
       thieu.nhatKy.thu[0].than.includes('45-sao-luu-du-cay'),
       thieu.nhatKy.thu.map((t) => t.tieuDe).join(' | ') || '(không thư)');
  kiem('RLS giấu cây: VẪN ghi file, KHÔNG dọn bản cũ',
       sau === truoc + 1, `${truoc} file → ${sau} file`);

  const hong = dungMoiTruong({ duLieu: cayGia({ soNguoi: 5 }), demThatHong: true });
  hong.api.saoLuuNgay();
  const banHong = JSON.parse([...duyet(hong.thuMuc)][0]._noiDung);
  kiem('chưa dán 45: vẫn ghi đủ, file nói không đối chiếu được, không thư',
       banHong.dem.persons === 5 && banHong.demMayChu === null &&
       banHong.loiDemThat !== '' && banHong.thieuSoVoiMayChu === '' && hong.nhatKy.thu.length === 0,
       `loi='${String(banHong.loiDemThat).slice(0, 50)}' · ${hong.nhatKy.thu.length} thư`);

  const kt = dungMoiTruong({ duLieu: cayGia({ soNguoi: 59 }), demThat: { persons: 740 } });
  const ket = kt.api.kiemTraKetNoi();
  kiem('kiemTraKetNoi nói THIẾU khi máy chủ có nhiều hơn',
       /THIẾU/.test(ket) && /persons: máy chủ có 740/.test(ket), ket.split('\n').slice(-6).join(' / '));
  const kt2 = dungMoiTruong({ duLieu: cayGia({ soNguoi: 59 }) });
  kiem('kiemTraKetNoi nói ĐỦ khi khớp', /ĐỦ/.test(kt2.api.kiemTraKetNoi()), '');
}

// ---- 11b. Báo kết quả vào Nhật ký hệ thống (b147, `luoc-do/49`) -------
{
  const a = dungMoiTruong({ duLieu: cayGia({ soNguoi: 5 }) });
  a.api.saoLuuNgay();
  const f = [...duyet(a.thuMuc)][0];
  const b0 = a.nhatKy.baoCao[0] || {};
  kiem('lần chạy đạt: báo đúng MỘT dòng, ok, tên file, số byte, số đếm',
       a.nhatKy.baoCao.length === 1 && b0.ok === true && b0.tenFile === f.getName() &&
       b0.soByte === f.getSize() && b0.dem && b0.dem.persons === 5 && !b0.thieu && !b0.canhBao,
       JSON.stringify(b0).slice(0, 160));

  const t = dungMoiTruong({ duLieu: cayGia({ soNguoi: 5 }), demThat: { persons: 740 } });
  t.api.saoLuuNgay();
  kiem('bản thiếu so với máy chủ: báo kèm câu thiếu',
       /persons: máy chủ có 740/.test((t.nhatKy.baoCao[0] || {}).thieu || ''),
       JSON.stringify(t.nhatKy.baoCao[0] || {}).slice(0, 160));

  const c = dungMoiTruong({ duLieu: cayGia({ soNguoi: 5 }), nhatKyHong: true });
  let nem = false;
  try { c.api.saoLuuNgay(); } catch (e) { nem = true; }
  kiem('chưa dán 49: vẫn ghi file, không ném, không thư',
       !nem && [...duyet(c.thuMuc)].length === 1 && c.nhatKy.thu.length === 0,
       `nem=${nem} · ${[...duyet(c.thuMuc)].length} file · ${c.nhatKy.thu.length} thư`);

  const h = dungMoiTruong({ duLieu: cayGia({ soNguoi: 5 }), hongBang: 'persons' });
  let nemH = false;
  try { h.api.saoLuuNgay(); } catch (e) { nemH = true; }
  const bh = h.nhatKy.baoCao[0] || {};
  kiem('hỏng sau đăng nhập: báo ok:false kèm lỗi, VẪN ném + gửi thư như cũ',
       nemH && h.nhatKy.baoCao.length === 1 && bh.ok === false && /500/.test(bh.loi || '') &&
       h.nhatKy.thu.length === 1,
       `nem=${nemH} · ${JSON.stringify(bh).slice(0, 120)} · ${h.nhatKy.thu.length} thư`);
}

// ---- 12. Đặt lịch hai lần vẫn chỉ một lịch ---------------------------
{
  const { api, lich } = dungMoiTruong();
  api.datLichSaoLuu();
  api.datLichSaoLuu();
  kiem('bấm đặt lịch hai lần không đẻ ra hai trigger chạy chồng nhau',
       lich.length === 1 && lich[0] === 'saoLuuNgay', `${lich.length} lịch`);
  api.goLichSaoLuu();
  kiem('gỡ lịch thì gỡ sạch', lich.length === 0, `${lich.length} lịch`);
}

// ---- 13. Mã nguồn không cất khoá thật --------------------------------
{
  // Canh cả khoá lẫn mật khẩu: từ bản 0.2.0 thứ nguy hiểm nhất có thể bị dán
  //   nhầm vào file này là MẬT KHẨU của tài khoản sao lưu, không phải khoá.
  const nghi = NGUON_GS.match(
    /sb_secret_[A-Za-z0-9_-]{8,}|sb_publishable_[A-Za-z0-9_-]{8,}|eyJ[A-Za-z0-9_-]{20,}/g);
  kiem('SaoLuu.gs không chứa khoá thật nào — repo này để Public',
       nghi === null, nghi ? nghi.join(' ') : 'sạch');

  // Bốn tên thuộc tính phải xuất hiện đủ trong mã, kèm dòng `Phụ thuộc` ở đầu
  // file. Thiếu một cái là hướng dẫn và mã đã lệch nhau.
  const thieuTen = ['SUPABASE_URL', 'KHOA_CONG_KHAI', 'EMAIL_SAO_LUU',
                    'MAT_KHAU_SAO_LUU'].filter((t) => !NGUON_GS.includes(t));
  kiem('mã nêu đủ bốn tên thuộc tính mà hướng dẫn bảo điền',
       thieuTen.length === 0, thieuTen.join(',') || 'đủ bốn');

  // ⚠ Không được còn LỆNH GỌI nào tới cửa Admin API: nó bắt buộc khoá bí mật,
  //   nên còn sót một lượt gọi tới đó là cả thiết kế 0.2.0 vô nghĩa.
  //
  //   Phải bỏ dòng ghi chú ra trước khi soi, theo đúng quy ước của
  //   `/kiem-tra`: *"chú thích nhắc tên thì KHÔNG tính — chỉ lệnh thật mới
  //   tính"*. `docNguoiDung_` cố ý nhắc lại cửa cũ để kể vì sao bỏ nó, và một
  //   phép kiểm cấm người ta viết ghi chú là một phép kiểm sai.
  //
  //   ⚠ Ngược lại, phép soi khoá bên trên KHÔNG được bỏ ghi chú: repo để
  //   Public, nên một cái khoá nằm trong ghi chú vẫn là khoá đã lên mạng.
  const dongLenh = NGUON_GS.split('\n')
    .filter((d) => !/^\s*(\/\/|\*|\/\*)/.test(d))
    .join('\n');
  kiem('không còn LỆNH gọi /auth/v1/admin/ — cửa ấy bắt buộc khoá bí mật',
       !dongLenh.includes('/auth/v1/admin'),
       dongLenh.includes('/auth/v1/admin') ? 'VẪN CÒN' : 'sạch');
}

// ---- 14. Ảnh: chép sang Drive, không chép lại, không xoá theo (b154) --
//
// ⚠ Lỗ b154: trước bản 0.7.0 sao lưu chỉ LIỆT KÊ ảnh — mất kho Supabase là
//   mất hẳn. Và app xoá ảnh là xoá thật, nên Drive tuyệt đối không xoá theo.
{
  const C1 = '00000000-0000-4000-8000-0000000000a1';
  const C2 = '00000000-0000-4000-8000-0000000000a2';
  const kho = {
    [C1 + '/anh_P1_1.jpg']: 'ANH-MOT', [C1 + '/anh_P1_1_lon.jpg']: 'ANH-MOT-LON',
    [C2 + '/anh_P9_2.jpg']: 'ANH-HAI'
  };
  const a = dungMoiTruong({ duLieu: cayGia(), khoAnhThat: kho });
  a.api.saoLuuNgay();
  const d1 = anhTrenDrive(a.thuMuc, C1);
  const d2 = anhTrenDrive(a.thuMuc, C2);
  kiem('chép đủ 3 ảnh vào Anh/<mã cây>/, đúng tên, đúng nội dung',
       d1['anh_P1_1.jpg'] === 'ANH-MOT' && d1['anh_P1_1_lon.jpg'] === 'ANH-MOT-LON' &&
       d2['anh_P9_2.jpg'] === 'ANH-HAI' && Object.keys(d1).length === 2,
       JSON.stringify({ d1, d2 }));
  const b0 = a.nhatKy.baoCao[0] || {};
  kiem('báo nhật ký: chép thêm 3, còn 0; file JSON vẫn đúng một ở gốc',
       b0.dem && b0.dem.anh_chep_them === 3 && b0.dem.anh_chua_chep === 0 && !b0.canhBao &&
       [...duyet(a.thuMuc)].length === 1,
       JSON.stringify(b0.dem));
  kiem('số ảnh KHÔNG vào DEM_LAN_TRUOC (kẻo "chưa chép" giảm bị báo sụt)',
       !('anh_chua_chep' in JSON.parse(a.kho.DEM_LAN_TRUOC)), a.kho.DEM_LAN_TRUOC);
  kiem('đọc ảnh qua cửa authenticated, không qua đường công khai',
       a.nhatKy.goi.some((u) => u.includes('/storage/v1/object/authenticated/anh/')) &&
       !a.nhatKy.goi.some((u) => u.includes('/object/public/')), '');

  // Đêm hai: kho mất một tấm (app xoá thật), thêm một tấm, một tấm bị tải đè.
  delete kho[C2 + '/anh_P9_2.jpg'];
  kho[C1 + '/anh_P1_3.jpg'] = 'ANH-BA';
  kho[C1 + '/anh_P1_1.jpg'] = 'ANH-MOT-DA-DOI';
  const b = dungMoiTruong({ duLieu: cayGia(), khoAnhThat: kho, thuMuc: a.thuMuc });
  b.api.saoLuuNgay();
  kiem('đêm hai chỉ tải tấm mới + tấm đổi cỡ, không tải lại tấm đã có',
       b.nhatKy.taiVe.length === 2 && b.nhatKy.taiVe.includes(C1 + '/anh_P1_3.jpg') &&
       b.nhatKy.taiVe.includes(C1 + '/anh_P1_1.jpg'),
       b.nhatKy.taiVe.join(' '));
  const e1 = anhTrenDrive(a.thuMuc, C1);
  kiem('tấm bị tải đè: Drive giữ bản MỚI, một bản (bản cũ vào thùng rác)',
       e1['anh_P1_1.jpg'] === 'ANH-MOT-DA-DOI' && Object.keys(e1).length === 3, JSON.stringify(e1));
  kiem('tấm app đã xoá khỏi kho: Drive VẪN GIỮ',
       anhTrenDrive(a.thuMuc, C2)['anh_P9_2.jpg'] === 'ANH-HAI', '');
}

// ---- 15. Ảnh: hết giờ thì dừng, ảnh hỏng không làm hỏng bản sao lưu ---
{
  const C = '00000000-0000-4000-8000-0000000000b1';
  const kho = {};
  for (let i = 1; i <= 10; i++) kho[C + '/a' + String(i).padStart(2, '0') + '.jpg'] = 'X' + i;
  // Mỗi lần hỏi giờ trôi 40 giây: được vài tấm thì chạm 270 giây.
  let t = LUC_THU.getTime();
  const a = dungMoiTruong({ duLieu: cayGia(), khoAnhThat: kho, dongHo: () => (t += 40000) });
  a.api.saoLuuNgay();
  const b0 = a.nhatKy.baoCao[0] || {};
  const n1 = Object.keys(anhTrenDrive(a.thuMuc, C)).length;
  kiem('hết giờ: dừng giữa chừng, báo số còn lại, file JSON vẫn ghi',
       n1 > 0 && n1 < 10 && b0.dem.anh_chua_chep === 10 - n1 && b0.ok === true &&
       [...duyet(a.thuMuc)].length === 1,
       `chép ${n1} · báo ${JSON.stringify(b0.dem && b0.dem.anh_chua_chep)}`);
  const b = dungMoiTruong({ duLieu: cayGia(), khoAnhThat: kho, thuMuc: a.thuMuc });
  b.api.saoLuuNgay();
  kiem('đêm sau chép nốt phần còn lại, không tải lại phần đã có',
       Object.keys(anhTrenDrive(a.thuMuc, C)).length === 10 && b.nhatKy.taiVe.length === 10 - n1,
       `${b.nhatKy.taiVe.length} lượt tải`);

  const h = dungMoiTruong({ duLieu: cayGia(), khoAnhThat: { [C + '/a.jpg']: 'A', [C + '/b.jpg']: 'B' },
                            anhHong: [C + '/a.jpg'] });
  let nem = false;
  try { h.api.saoLuuNgay(); } catch (e) { nem = true; }
  const bh = h.nhatKy.baoCao[0] || {};
  kiem('một ảnh 404: không ném, tấm kia vẫn chép, báo cảnh báo nêu tên tấm hỏng',
       !nem && anhTrenDrive(h.thuMuc, C)['b.jpg'] === 'B' && bh.dem.anh_chua_chep === 1 &&
       /Chép ảnh: .*a\.jpg/.test(bh.canhBao || '') && h.nhatKy.thu.length === 0,
       `nem=${nem} · ${JSON.stringify(bh).slice(0, 160)}`);

  const k = dungMoiTruong({ duLieu: cayGia() });
  k.api.saoLuuNgay();
  kiem('kho trống: không dựng thư mục Anh', !k.thuMuc._con.length, '');
}

// ---- 16. Khôi phục ảnh (b154) ------------------------------------------
{
  const C = '00000000-0000-4000-8000-0000000000c1';
  const D = '00000000-0000-4000-8000-0000000000c2';
  const kho = { [C + '/p.jpg']: 'P', [C + '/q.jpg']: 'Q', [D + '/r.jpg']: 'R',
                [C + '/mo-coi.jpg']: 'M' };
  const a = dungMoiTruong({ duLieu: cayGia(), khoAnhThat: kho });
  a.api.saoLuuNgay();

  // Dữ liệu gia phả trỏ tới p (bản nhỏ) + q (bản lớn) + r (dòng đang ở thùng
  // rác — vẫn phải về). `mo-coi.jpg` đã được app dọn hẳn: không dòng nào trỏ.
  // Thêm một mã tệp Drive đời Apps Script (không có '/') — phải bị bỏ qua.
  const cayGiaAnh = () => Object.assign(cayGia(), { media: [
    { id: 'M1', drive_file_id: C + '/p.jpg', drive_file_id_lon: C + '/q.jpg', deleted: false },
    { id: 'M2', drive_file_id: D + '/r.jpg', drive_file_id_lon: '', deleted: true },
    { id: 'M3', drive_file_id: '1AbCdriveCu', drive_file_id_lon: '', deleted: false }] });

  // Kho mất sạch, trừ một tấm.
  const kp = { EMAIL_KHOI_PHUC: EMAIL_KP, MAT_KHAU_KHOI_PHUC: MAT_KHAU_KP };
  const b = dungMoiTruong({ duLieu: cayGiaAnh(), khoAnhThat: { [C + '/q.jpg']: 'Q' },
                            thuMuc: a.thuMuc, thuocTinh: kp });
  const ket = b.api.khoiPhucAnh();
  kiem('khôi phục: tải lên đúng 2 tấm thiếu, bỏ qua tấm kho còn, nội dung đúng',
       b.nhatKy.taiLen.length === 2 && b.khoAnhThat[C + '/p.jpg'] === 'P' &&
       b.khoAnhThat[D + '/r.jpg'] === 'R' && /tải lên 2 tấm, 1 tấm kho đã có/.test(ket),
       ket.split('\n')[0]);
  kiem('ảnh app đã dọn hẳn (không dòng media nào trỏ): KHÔNG tải lên — không đẻ ảnh mồ côi',
       b.khoAnhThat[C + '/mo-coi.jpg'] === undefined && /bỏ qua 1 tấm không còn ai dùng/.test(ket),
       ket.split('\n')[0]);
  kiem('khôi phục xong: nhắc xoá hai dòng mật khẩu, không lộ mật khẩu',
       /XONG/.test(ket) && !ket.includes(MAT_KHAU_KP) &&
       !b.nhatKy.log.join('\n').includes(MAT_KHAU_KP), '');
  kiem('chạy lại lần hai: không tải gì nữa',
       /tải lên 0 tấm, 3 tấm kho đã có/.test(dungMoiTruong({ duLieu: cayGiaAnh(),
         khoAnhThat: b.khoAnhThat, thuMuc: a.thuMuc, thuocTinh: kp }).api.khoiPhucAnh()), '');

  const chi = dungMoiTruong({ duLieu: cayGiaAnh(), thuMuc: a.thuMuc,
                              thuocTinh: Object.assign({ KHOI_PHUC_CAY: D }, kp) });
  chi.api.khoiPhucAnh();
  kiem('KHOI_PHUC_CAY: chỉ tải ảnh của đúng cây ấy',
       chi.nhatKy.taiLen.length === 1 && chi.nhatKy.taiLen[0] === D + '/r.jpg',
       chi.nhatKy.taiLen.join(' '));

  const thieu = dungMoiTruong({ duLieu: cayGia(), thuMuc: a.thuMuc });
  let loi = '';
  try { thieu.api.khoiPhucAnh(); } catch (e) { loi = e.message; }
  kiem('chưa điền tài khoản khôi phục: dừng, câu lỗi nêu đúng hai ô, không gọi mạng',
       /EMAIL_KHOI_PHUC/.test(loi) && /MAT_KHAU_KHOI_PHUC/.test(loi) && thieu.nhatKy.goi.length === 0,
       loi.slice(0, 80));

  // Điền nhầm tài khoản SAO LƯU vào ô khôi phục: máy chủ từ chối (vai chỉ đọc).
  const nham = dungMoiTruong({ duLieu: cayGiaAnh(), thuMuc: a.thuMuc,
    thuocTinh: { EMAIL_KHOI_PHUC: EMAIL_THU, MAT_KHAU_KHOI_PHUC: MAT_KHAU_THU } });
  const ketNham = nham.api.khoiPhucAnh();
  kiem('tài khoản không ghi được ảnh: báo "bị từ chối", còn lại 3 tấm, bảo chạy lại',
       /bị từ chối/.test(ketNham) && /còn 3 tấm/.test(ketNham) && nham.nhatKy.taiLen.length === 0,
       ketNham.replace(/\n/g, ' / ').slice(0, 160));

  const trong = dungMoiTruong({ duLieu: cayGia(), thuocTinh: kp });
  let loiTrong = '';
  try { trong.api.khoiPhucAnh(); } catch (e) { loiTrong = e.message; }
  kiem('Drive chưa có ảnh nào: nói thẳng, không tạo thư mục',
       /chưa có thư mục/.test(loiTrong) && !trong.thuMuc._con.length, loiTrong.slice(0, 80));
}

// ---- 17. Dấu vân tay file sao lưu (b155a, `luoc-do/54`) -----------------
//
// ⚠ Nút Khôi phục chỉ nhận file khớp dấu này. Tính sai (khác chuỗi đã ghi,
//   byte có dấu đổi hex sai) thì mọi bản sao lưu đều bị nút từ chối — và chỉ
//   lộ ra đúng ngày cần khôi phục.
{
  const a = dungMoiTruong({ duLieu: cayGia() });
  a.api.saoLuuNgay();
  const f = [...duyet(a.thuMuc)][0];
  const mong = createHash('sha256').update(Buffer.from(f._noiDung, 'utf8')).digest('hex');
  const d = a.nhatKy.dau[0] || {};
  kiem('báo đúng MỘT dấu, = SHA-256 hex của nguyên văn file đã ghi, kèm tên file',
       a.nhatKy.dau.length === 1 && d.p_bam === mong && d.p_ten_file === f.getName() &&
       /^[0-9a-f]{64}$/.test(d.p_bam), JSON.stringify(d).slice(0, 140));
  kiem('dấu đạt: không cảnh báo', !(a.nhatKy.baoCao[0] || {}).canhBao, '');

  const h = dungMoiTruong({ duLieu: cayGia(), dauHong: true });
  let nem = false;
  try { h.api.saoLuuNgay(); } catch (e) { nem = true; }
  const bh = h.nhatKy.baoCao[0] || {};
  kiem('chưa dán 54: vẫn ghi file, không ném, cảnh báo nói nút Khôi phục sẽ không nhận',
       !nem && [...duyet(h.thuMuc)].length === 1 && bh.ok === true &&
       /dấu vân tay/.test(bh.canhBao || '') && /54/.test(bh.canhBao || ''),
       `nem=${nem} · ${String(bh.canhBao).slice(0, 120)}`);
}

// ---- 18. Web app (b155d) — trang Quản trị gọi thẳng máy sao lưu ---------
//
// ⚠⚠ Web app để "Anyone" và chạy bằng quyền Drive của chủ dự án. Hàng rào DUY
//   NHẤT là vé Supabase của người bấm phải là QTHT. Các phép dưới canh nó.
{
  const C = '00000000-0000-4000-8000-0000000000d1';
  const kho = { [C + '/p.jpg']: 'P', [C + '/q.jpg']: 'Q' };
  const cayGiaAnh = () => Object.assign(cayGia(), { media: [
    { id: 'M1', drive_file_id: C + '/p.jpg', drive_file_id_lon: C + '/q.jpg', deleted: false }] });
  // Hai đêm sao lưu → hai file + ảnh trên Drive; thêm một file LẠ cùng thư mục.
  const a = dungMoiTruong({ duLieu: cayGiaAnh(), khoAnhThat: kho });
  a.api.saoLuuNgay();
  const b = dungMoiTruong({ duLieu: cayGiaAnh(), khoAnhThat: kho, thuMuc: a.thuMuc,
                            dongHo: () => LUC_THU.getTime() });
  a.thuMuc.createFile('giapha-sao-luu-2026-09-02-0200.json', '{"cu":1}');
  const la = a.thuMuc.createFile('so-tay-rieng.txt', 'bí mật riêng của chủ dự án');
  const ngoai = b.taoThuMuc('thu-muc-khac').createFile('giapha-sao-luu-2026-09-01-0200.json', '{"ngoai":1}');

  const goi = (env, yc) => JSON.parse(env.api.doPost({ postData: { contents: JSON.stringify(yc) } })._chu);

  const khongVe = goi(b, { viec: 'danh-sach' });
  kiem('không vé → từ chối, không đọc Drive', khongVe.ok === false && /vé/.test(khongVe.loi) && !khongVe.ds,
       JSON.stringify(khongVe).slice(0, 100));
  const veGia = goi(b, { viec: 'danh-sach', ve: 'eyJ.gia.mao' });
  kiem('vé giả → từ chối', veGia.ok === false && /không hợp lệ/.test(veGia.loi) && !veGia.ds,
       JSON.stringify(veGia).slice(0, 100));
  const thuong = goi(b, { viec: 'danh-sach', ve: VE_THUONG });
  kiem('vé thật nhưng KHÔNG phải QTHT → từ chối', thuong.ok === false && /Quản trị hệ thống/.test(thuong.loi) && !thuong.ds,
       JSON.stringify(thuong).slice(0, 100));
  const taiThuong = goi(b, { viec: 'tai', ve: VE_THUONG, id: [...duyet(a.thuMuc)][0].getId() });
  kiem('người thường cũng KHÔNG tải được file', taiThuong.ok === false && !taiThuong.noiDung, '');

  const ds = goi(b, { viec: 'danh-sach', ve: VE_QT });
  kiem('QTHT: danh sách chỉ file sao lưu đúng khuôn, mới nhất trước, không kèm nội dung',
       ds.ok === true && ds.ds.length === 2 && ds.ds[0].ten === 'giapha-sao-luu-2026-09-03-1730.json' &&
       ds.ds[1].ten === 'giapha-sao-luu-2026-09-02-0200.json' && !('noiDung' in ds.ds[0]) &&
       !JSON.stringify(ds).includes('so-tay-rieng'),
       JSON.stringify(ds).slice(0, 200));

  const goc = [...duyet(a.thuMuc)].find((f) => f.getName() === 'giapha-sao-luu-2026-09-03-1730.json');
  const tai = goi(b, { viec: 'tai', ve: VE_QT, id: ds.ds[0].id });
  kiem('QTHT tải: đúng NGUYÊN VĂN file (dấu vân tay sẽ khớp)',
       tai.ok === true && tai.noiDung === goc._noiDung && tai.ten === goc.getName(), tai.loi || '');
  const taiLa = goi(b, { viec: 'tai', ve: VE_QT, id: la.getId() });
  kiem('mã file KHÁC trong cùng thư mục (không đúng khuôn) → từ chối', taiLa.ok === false && !taiLa.noiDung, '');
  const taiNgoai = goi(b, { viec: 'tai', ve: VE_QT, id: ngoai.getId() });
  kiem('file đúng khuôn tên nhưng NGOÀI thư mục sao lưu → từ chối', taiNgoai.ok === false && !taiNgoai.noiDung, '');
  const taiBay = goi(b, { viec: 'tai', ve: VE_QT, id: 'khong-co' });
  kiem('mã file không có → từ chối gọn, không ném', taiBay.ok === false, '');

  // Kho mất cả hai ảnh → khôi phục ảnh bằng VÉ NGƯỜI BẤM, không cần mật khẩu điền tạm.
  const c = dungMoiTruong({ duLieu: cayGiaAnh(), khoAnhThat: {}, thuMuc: a.thuMuc });
  const anh = goi(c, { viec: 'khoi-phuc-anh', ve: VE_QT });
  kiem('khôi phục ảnh qua web app: tải lên đủ 2 tấm bằng vé người bấm',
       anh.ok === true && anh.taiLen === 2 && c.khoAnhThat[C + '/p.jpg'] === 'P' && /tải lên 2 tấm/.test(anh.cau),
       JSON.stringify(anh).slice(0, 160));
  const anhThuong = goi(c, { viec: 'khoi-phuc-anh', ve: VE_THUONG });
  kiem('người thường gọi khôi phục ảnh → từ chối', anhThuong.ok === false && anhThuong.taiLen === undefined, '');

  // Sao lưu ngay (b155e): QTHT → một file mới; người thường → không file nào.
  const d = dungMoiTruong({ duLieu: cayGia() });
  const slThuong = goi(d, { viec: 'sao-luu-ngay', ve: VE_THUONG });
  kiem('sao lưu ngay bằng vé người thường → từ chối, KHÔNG ghi file',
       slThuong.ok === false && [...duyet(d.thuMuc)].length === 0, JSON.stringify(slThuong).slice(0, 100));
  const sl = goi(d, { viec: 'sao-luu-ngay', ve: VE_QT });
  kiem('sao lưu ngay bằng vé QTHT → ghi đúng một file, câu trả lời nêu tên file',
       sl.ok === true && [...duyet(d.thuMuc)].length === 1 && /giapha-sao-luu-/.test(sl.cau || ''),
       JSON.stringify(sl).slice(0, 140));
  const h = dungMoiTruong({ duLieu: cayGia(), hongBang: 'persons' });
  const slHong = goi(h, { viec: 'sao-luu-ngay', ve: VE_QT });
  kiem('sao lưu ngay hỏng giữa chừng → ok:false kèm câu lỗi, không ném ra ngoài',
       slHong.ok === false && /500/.test(slHong.loi || ''), JSON.stringify(slHong).slice(0, 140));

  const lan = goi(b, { viec: 'xoa-het', ve: VE_QT });
  kiem('việc lạ → từ chối', lan.ok === false && /không biết việc/.test(lan.loi), '');
  const toan = JSON.stringify([khongVe, veGia, thuong, ds, tai, anh]);
  kiem('không phản hồi nào lộ mật khẩu / phiếu của tài khoản sao lưu',
       !toan.includes(MAT_KHAU_THU) && !toan.includes(PHIEU_THU), '');
  kiem('doGet chỉ báo sống, không dữ liệu', JSON.parse(b.api.doGet()._chu).ok === true &&
       !('ds' in JSON.parse(b.api.doGet()._chu)), '');
}

// ------------------------------------------------------------
console.log('\n' + (hong === 0 ? 'TẤT CẢ ĐẠT' : 'CÓ PHÉP HỎNG') +
            ' — ' + dat + ' đạt, ' + hong + ' hỏng.');
process.exitCode = hong === 0 ? 0 : 1;

// ------------------------------------------------------------
function kiem(ten, dieuKien, chiTiet) {
  if (dieuKien) { dat++; console.log('  ĐẠT  ' + ten); }
  else { hong++; console.log('  HỎNG ' + ten + '  →  ' + chiTiet); }
}

function* duyet(thuMuc) {
  const it = thuMuc.getFiles();
  while (it.hasNext()) { const f = it.next(); if (!f.isTrashed()) yield f; }
}

/** Tệp (chưa vào thùng rác) trong `Anh/<cay>/` của thư mục sao lưu → { tên: nội dung }. */
function anhTrenDrive(thuMuc, cay) {
  const anh = thuMuc._con.find((c) => c._ten === 'Anh');
  const tm = anh && anh._con.find((c) => c._ten === cay);
  const ra = {};
  if (tm) for (const f of duyet(tm)) ra[f.getName()] = f._noiDung;
  return ra;
}
