// ============================================================
// giapha-supabase · ham-may-chu/tao-tai-khoan/index.ts
// Vai trò  : Edge Function — Quản trị hệ thống (1) tạo tài khoản mới, (2) đặt lại
//            mật khẩu một tài khoản. Cả hai: mật khẩu tạm do máy chủ sinh.
// Lớp      : máy chủ (Supabase Edge Function) — được gọi bởi: services/sb.js
// Phụ thuộc: không thư viện nào — chỉ `fetch` tới Auth + REST của chính dự án
// Phiên bản: 0.2.0 · Cập nhật: 03/10/2026 (b171)
// Sổ tay   : so-tay/tao-tai-khoan.md
// ============================================================
//
// ⚠ Đuôi `.ts` chỉ vì bảng điều khiển Supabase đòi tên ấy. Nội dung là
//   JavaScript thuần — không kiểu, không bước build (`CLAUDE.md` mục 3).
//
// ⚠⚠ KHOÁ `service_role` KHÔNG NẰM Ở ĐÂY. Supabase tự đặt nó vào biến môi
//   trường của mọi Edge Function. File này lên repo Public — đừng bao giờ
//   dán khoá nào vào nó.
//
// ⚠ Hàm CHỈ tạo người dùng. Họ tên · quyền tạo cây · lời mời QTHT do trang
//   gọi tiếp các hàm SQL đã có — để luật và nhật ký nằm một chỗ.
//
// ⚠ Cổng kiểm: gọi `la_quan_tri_he_thong()` BẰNG THẺ CỦA NGƯỜI GỌI. Thẻ giả
//   hay hết hạn thì PostgREST từ chối → hàm từ chối. Vì thế tắt được
//   "Enforce JWT verification" mà không hở.
//
// ⚠ Đặt lại mật khẩu (`viec: 'dat_lai_mat_khau'`): không đặt cho CHÍNH MÌNH (đã
//   có Đổi mật khẩu) và không đặt cho một QTHT khác — như vậy là chiếm tài
//   khoản có quyền cao nhất mà không qua "hai chữ ký".
//
// Luôn trả HTTP 200 kèm { ok, loi } — cùng khuôn với các hàm SQL.

const URL_DU_AN = Deno.env.get('SUPABASE_URL');
const KHOA_CONG_KHAI = Deno.env.get('SUPABASE_ANON_KEY');
const KHOA_BI_MAT = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Bỏ 0/O, 1/I/l — người nhận đọc mật khẩu qua điện thoại được.
const BANG_CHU = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function traLoi(obj) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function sinhMatKhau(dai = 10) {
  const so = crypto.getRandomValues(new Uint32Array(dai));
  let kq = '';
  for (const n of so) kq += BANG_CHU[n % BANG_CHU.length];
  return kq;
}

async function laQuanTriHeThong(theNguoiGoi) {
  const r = await fetch(URL_DU_AN + '/rest/v1/rpc/la_quan_tri_he_thong', {
    method: 'POST',
    headers: {
      apikey: KHOA_CONG_KHAI,
      Authorization: theNguoiGoi,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  if (!r.ok) return false;
  return (await r.json()) === true;
}

async function datLaiMatKhau(the, userId) {
  const quan = { apikey: KHOA_BI_MAT, Authorization: 'Bearer ' + KHOA_BI_MAT };
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { ok: false, loi: 'Mã tài khoản không đúng khuôn.' };

  const ai = await fetch(URL_DU_AN + '/auth/v1/user', {
    headers: { apikey: KHOA_CONG_KHAI, Authorization: the },
  });
  const nguoiGoi = ai.ok ? await ai.json().catch(() => ({})) : {};
  if (!nguoiGoi.id) return { ok: false, loi: 'Chưa đăng nhập.' };
  if (nguoiGoi.id === userId) {
    return { ok: false, loi: 'Mật khẩu của chính bạn thì đổi ở khu Tài khoản → Đổi mật khẩu.' };
  }

  const t = await fetch(URL_DU_AN + '/rest/v1/tai_khoan?select=la_quan_tri_he_thong&user_id=eq.' + userId,
    { headers: quan });
  const hang = t.ok ? ((await t.json())[0] || null) : null;
  if (!hang) return { ok: false, loi: 'Không có tài khoản này.' };
  if (hang.la_quan_tri_he_thong) {
    return { ok: false, loi: 'Không đặt lại mật khẩu của một Quản trị hệ thống khác được. ' +
      'Nhờ chính họ đổi, hoặc vào Supabase → Authentication → Users.' };
  }

  const matKhau = sinhMatKhau();
  const r = await fetch(URL_DU_AN + '/auth/v1/admin/users/' + userId, {
    method: 'PUT',
    headers: { ...quan, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: matKhau }),
  });
  const u = await r.json().catch(() => ({}));
  if (!r.ok) {
    return { ok: false, loi: 'Máy chủ Auth từ chối: ' + String(u.msg || u.message || u.error_description || r.status) };
  }

  // Nhật ký: người làm = người gọi (hàm này chỉ service_role gọi được).
  await fetch(URL_DU_AN + '/rest/v1/rpc/ghi_nhat_ky', {
    method: 'POST',
    headers: { ...quan, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_loai: 'qtht', p_su_kien: 'dat_lai_mat_khau',
      p_doi_tuong: String(u.email || userId), p_chi_tiet: {}, p_nguoi: nguoiGoi.id }),
  }).catch(() => {});

  return { ok: true, loi: null, userId, email: u.email || '', matKhau };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return traLoi({ ok: false, loi: 'Chỉ nhận POST.' });

  const the = req.headers.get('Authorization') || '';
  if (!/^Bearer\s+\S+/.test(the)) return traLoi({ ok: false, loi: 'Chưa đăng nhập.' });
  if (!(await laQuanTriHeThong(the))) {
    return traLoi({ ok: false, loi: 'Chỉ Quản trị hệ thống được tạo tài khoản.' });
  }

  let vao = {};
  try { vao = await req.json(); } catch (_) { /* để trống, kiểm ở dưới */ }
  if (vao.viec === 'dat_lai_mat_khau') {
    return traLoi(await datLaiMatKhau(the, String(vao.userId || '')));
  }
  const email = String(vao.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return traLoi({ ok: false, loi: 'Địa chỉ email không đúng khuôn.' });
  }

  const matKhau = sinhMatKhau();
  const quan = { apikey: KHOA_BI_MAT, Authorization: 'Bearer ' + KHOA_BI_MAT };

  const r = await fetch(URL_DU_AN + '/auth/v1/admin/users', {
    method: 'POST',
    headers: { ...quan, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: matKhau, email_confirm: true }),
  });
  const u = await r.json().catch(() => ({}));
  if (!r.ok) {
    const m = String(u.msg || u.message || u.error_description || u.error || r.status);
    if (/already|exists|registered/i.test(m)) {
      return traLoi({ ok: false, loi: 'Email ' + email + ' đã có tài khoản.' });
    }
    return traLoi({ ok: false, loi: 'Máy chủ Auth từ chối: ' + m });
  }

  // Mã ngắn do trigger `sau_khi_tao_user` (`luoc-do/11`) sinh ngay trong lệnh tạo.
  let maNgan = '';
  const t = await fetch(URL_DU_AN + '/rest/v1/tai_khoan?select=ma_ngan&user_id=eq.' + u.id, {
    headers: quan,
  });
  if (t.ok) maNgan = ((await t.json())[0] || {}).ma_ngan || '';

  return traLoi({ ok: true, loi: null, userId: u.id, email, maNgan, matKhau });
});
