/**
 * PHÒNG THI TRỰC TUYẾN — Backend (Google Apps Script)
 * ============================================================
 * File này gắn (bound) vào 1 Google Sheet đóng vai trò "Excel"
 * chứa 3 tab bắt buộc:
 *
 * 1) Tab "MaThi" — danh sách mã dự thi
 *    Cột: MaDuThi | HoTen | DaThi | DiemSo | SoCauDung | ThoiGianNop
 *    - MaDuThi: mã bạn tự đặt, ví dụ TSA001, TSA002...
 *    - HoTen: (không bắt buộc điền trước, có thể để trống)
 *    - DaThi: để trống hoặc FALSE ban đầu — script sẽ tự ghi TRUE khi nộp bài
 *    - DiemSo, SoCauDung, ThoiGianNop: để trống — script tự điền
 *
 * 2) Tab "PhanThi" — cấu hình các phần thi
 *    Cột: TenPhan | ThuTu | SoPhut
 *    Ví dụ:
 *      Toán học - Tư duy Logic - Phân tích số liệu | 1 | 40
 *      Ngôn ngữ                                     | 2 | 40
 *      Giải quyết vấn đề                            | 3 | 40
 *
 * 3) Tab "CauHoi" — ngân hàng câu hỏi
 *    Cột: TenPhan | STT | CauHoi | A | B | C | D | DapAnDung
 *    - TenPhan phải khớp chính xác với tên ở tab PhanThi
 *    - STT là số thứ tự DUY NHẤT xuyên suốt toàn bộ đề (1, 2, 3... không lặp)
 *    - DapAnDung ghi 1 trong 4 chữ: A / B / C / D
 *
 * CÀI ĐẶT:
 *  - Vào Google Sheet của bạn → Tiện ích mở rộng (Extensions) → Apps Script
 *  - Dán toàn bộ nội dung file này vào (thay thế nội dung mặc định)
 *  - Bấm Triển khai (Deploy) → New deployment → chọn loại "Web app"
 *    - Execute as: Me
 *    - Who has access: Anyone
 *  - Copy URL được cấp, dán vào biến APPS_SCRIPT_URL trong file
 *    assets/js/config.js của web
 * ============================================================
 */

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'layDeThi') return layDeThi(e.parameter.ma);
    if (action === 'traCuu') return traCuu(e.parameter.ma);
    return respond({ error: 'Hành động không hợp lệ.' });
  } catch (err) {
    return respond({ error: 'Lỗi máy chủ: ' + err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'nopBai') {
      return nopBai(body.ma, body.traLoi || {});
    }
    return respond({ error: 'Hành động không hợp lệ.' });
  } catch (err) {
    return respond({ error: 'Lỗi máy chủ: ' + err.message });
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error('Không tìm thấy tab "' + name + '" trong Google Sheet.');
  return sh;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i].every(c => c === '')) continue; // bỏ dòng trống
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = data[i][idx]));
    rows.push(obj);
  }
  return rows;
}

function timMaThi(ma) {
  const sheet = getSheet('MaThi');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colMa = headers.indexOf('MaDuThi');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colMa]).trim().toUpperCase() === String(ma).trim().toUpperCase()) {
      const obj = {};
      headers.forEach((h, idx) => (obj[h] = data[i][idx]));
      return { rowIndex: i + 1, headers, obj };
    }
  }
  return null;
}

function daThiRoi(obj) {
  return obj.DaThi === true || String(obj.DaThi).trim().toUpperCase() === 'TRUE';
}

/** Trả về đề thi cho 1 mã dự thi hợp lệ & chưa thi. KHÔNG bao giờ trả về đáp án đúng. */
function layDeThi(ma) {
  if (!ma) return respond({ error: 'Thiếu mã dự thi.' });
  const found = timMaThi(ma);
  if (!found) return respond({ error: 'Mã dự thi không tồn tại. Vui lòng kiểm tra lại.' });
  if (daThiRoi(found.obj)) {
    return respond({ error: 'Mã dự thi này đã được sử dụng để làm bài. Mỗi mã chỉ được thi 1 lần.' });
  }

  const phanThi = sheetToObjects(getSheet('PhanThi')).sort((a, b) => a.ThuTu - b.ThuTu);

  const cauHoi = sheetToObjects(getSheet('CauHoi')).map(row => {
    const clone = Object.assign({}, row);
    delete clone.DapAnDung; // ẩn đáp án đúng khỏi client
    return clone;
  });

  return respond({
    hoTen: found.obj.HoTen || '',
    phanThi,
    cauHoi
  });
}

/** Chấm điểm ở server (client không thể tự sửa điểm), ghi kết quả vào MaThi, khoá mã lại. */
function nopBai(ma, traLoi) {
  if (!ma) return respond({ error: 'Thiếu mã dự thi.' });
  const found = timMaThi(ma);
  if (!found) return respond({ error: 'Mã dự thi không tồn tại.' });
  if (daThiRoi(found.obj)) {
    return respond({ error: 'Mã dự thi này đã nộp bài trước đó.' });
  }

  const chSheet = getSheet('CauHoi');
  const chData = chSheet.getDataRange().getValues();
  const chHeaders = chData[0];
  const idxSTT = chHeaders.indexOf('STT');
  const idxDapAn = chHeaders.indexOf('DapAnDung');
  const idxPhan = chHeaders.indexOf('TenPhan');

  let dung = 0;
  let tong = 0;
  const chiTietPhan = {};

  for (let i = 1; i < chData.length; i++) {
    if (chData[i].every(c => c === '')) continue;
    const stt = String(chData[i][idxSTT]);
    const dapAnDung = String(chData[i][idxDapAn]).trim().toUpperCase();
    const tenPhan = chData[i][idxPhan];

    tong++;
    if (!chiTietPhan[tenPhan]) chiTietPhan[tenPhan] = { dung: 0, tong: 0 };
    chiTietPhan[tenPhan].tong++;

    const traLoiUser = traLoi[stt];
    if (traLoiUser && String(traLoiUser).trim().toUpperCase() === dapAnDung) {
      dung++;
      chiTietPhan[tenPhan].dung++;
    }
  }

  const diem = tong > 0 ? Math.round((dung / tong) * 1000) / 100 : 0; // thang 10, 2 chữ số thập phân

  const sheet = getSheet('MaThi');
  const headers = sheet.getDataRange().getValues()[0];
  const colDaThi = headers.indexOf('DaThi') + 1;
  const colDiem = headers.indexOf('DiemSo') + 1;
  const colSoCauDung = headers.indexOf('SoCauDung') + 1;
  const colThoiGianNop = headers.indexOf('ThoiGianNop') + 1;

  sheet.getRange(found.rowIndex, colDaThi).setValue(true);
  sheet.getRange(found.rowIndex, colDiem).setValue(diem);
  if (colSoCauDung > 0) sheet.getRange(found.rowIndex, colSoCauDung).setValue(dung + '/' + tong);
  if (colThoiGianNop > 0) sheet.getRange(found.rowIndex, colThoiGianNop).setValue(new Date());

  return respond({ diem, dung, tong, chiTietPhan });
}

function traCuu(ma) {
  if (!ma) return respond({ error: 'Thiếu mã dự thi.' });
  const found = timMaThi(ma);
  if (!found) return respond({ error: 'Mã dự thi không tồn tại.' });
  if (!daThiRoi(found.obj)) {
    return respond({ error: 'Mã dự thi này chưa hoàn thành bài thi.' });
  }
  return respond({
    hoTen: found.obj.HoTen || '',
    diem: found.obj.DiemSo,
    soCauDung: found.obj.SoCauDung || '',
    thoiGianNop: found.obj.ThoiGianNop ? new Date(found.obj.ThoiGianNop).toLocaleString('vi-VN') : ''
  });
}
