/* PHÒNG THI TRỰC TUYẾN — tiện ích dùng chung
   ========================================================================= */

/**
 * Gọi API GET tới Apps Script (dùng cho layDeThi, traCuu)
 */
async function goiApiGet(action, params = {}) {
  const url = new URL(window.CONFIG.APPS_SCRIPT_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString());
    return await res.json();
  } catch (err) {
    return { error: 'Không thể kết nối tới máy chủ. Kiểm tra lại kết nối mạng hoặc URL cấu hình.' };
  }
}

/**
 * Gọi API POST tới Apps Script (dùng cho nopBai)
 */
async function goiApiPost(action, payload = {}) {
  try {
    const res = await fetch(window.CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // tránh preflight CORS của Apps Script
      body: JSON.stringify(Object.assign({ action }, payload))
    });
    return await res.json();
  } catch (err) {
    return { error: 'Không thể kết nối tới máy chủ. Kiểm tra lại kết nối mạng hoặc URL cấu hình.' };
  }
}

/** Toast thông báo góc màn hình */
function showToast(message, type = 'info') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="dot"></span><span class="msg"></span>`;
    document.body.appendChild(toast);
  }
  const dot = toast.querySelector('.dot');
  dot.style.background = type === 'error' ? '#D64545' : type === 'success' ? '#1F7A5C' : '#2D6CDF';
  toast.querySelector('.msg').textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3200);
}

/** Định dạng giây -> mm:ss */
function dinhDangThoiGian(giay) {
  const g = Math.max(0, Math.floor(giay));
  const m = Math.floor(g / 60);
  const s = g % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

/** Chuẩn hoá mã dự thi người dùng nhập (bỏ khoảng trắng, viết hoa) */
function chuanHoaMa(ma) {
  return String(ma || '').trim().toUpperCase();
}

window.PT = {
  goiApiGet,
  goiApiPost,
  showToast,
  dinhDangThoiGian,
  chuanHoaMa
};
