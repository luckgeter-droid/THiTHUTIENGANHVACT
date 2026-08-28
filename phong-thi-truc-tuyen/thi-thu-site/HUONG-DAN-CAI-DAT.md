# Hướng dẫn cài đặt — Phòng Thi Trực Tuyến

Hệ thống gồm 2 phần:
1. **Google Sheet** — đóng vai trò "file Excel" chứa câu hỏi, mã dự thi và điểm.
2. **Trang web tĩnh** (các file `.html` trong thư mục này) — chạy hoàn toàn trên trình duyệt, không cần thuê server.

Làm theo đúng thứ tự các bước dưới đây (mất khoảng 10–15 phút cho lần đầu).

---

## Bước 1 — Tạo Google Sheet

1. Vào [sheets.google.com](https://sheets.google.com) → **Tạo bảng tính trống**.
2. Đặt tên bất kỳ, ví dụ "Dữ liệu thi thử TSA".
3. Nhập dữ liệu vào: **Tệp (File) → Nhập (Import) → Tải lên (Upload)** → chọn file
   `mau-du-lieu/du-lieu-mau.xlsx` đi kèm → khi hộp thoại hỏi, chọn **"Thay thế bảng tính"
   (Replace spreadsheet)**.
4. Bạn sẽ thấy 4 tab: `HUONG-DAN`, `MaThi`, `PhanThi`, `CauHoi`. Đọc kỹ tab `HUONG-DAN`,
   sau đó điền:
   - Tab **MaThi**: liệt kê toàn bộ mã dự thi bạn sẽ phát cho thí sinh (cột `MaDuThi`).
     Các cột `DaThi`, `DiemSo`, `SoCauDung`, `ThoiGianNop` **để trống** — hệ thống tự ghi.
   - Tab **PhanThi**: chỉnh tên phần thi / số phút nếu cần (mặc định 3 phần × 40 phút = 120 phút).
   - Tab **CauHoi**: nhập toàn bộ câu hỏi thật, xoá các dòng ví dụ (in nghiêng).
     Nhớ cột `TenPhan` phải khớp **chính xác từng chữ** với tên ở tab `PhanThi`.
5. Xong thì có thể **xoá tab `HUONG-DAN`** (chỉ để tham khảo, không được hệ thống đọc).

> File Sheet này chính là "Excel" của bạn — bất cứ lúc nào cũng có thể tải về dạng
> `.xlsx` qua **Tệp → Tải xuống → Microsoft Excel (.xlsx)** để xem/backup/báo cáo.

---

## Bước 2 — Gắn Google Apps Script vào Sheet

1. Trong chính Google Sheet vừa tạo: **Tiện ích mở rộng (Extensions) → Apps Script**.
2. Xoá hết nội dung mặc định trong file `Code.gs`, dán toàn bộ nội dung file
   `google-apps-script/Code.gs` (đi kèm trong thư mục này) vào.
3. Bấm biểu tượng 💾 **Lưu**.
4. Bấm nút **Triển khai (Deploy) → New deployment**.
   - Chọn loại: **Web app**.
   - Execute as: **Me (email của bạn)**.
   - Who has access: **Anyone**.
   - Bấm **Deploy**. Lần đầu Google sẽ yêu cầu bạn **cấp quyền (Authorize access)** —
     chọn tài khoản Google của bạn → bấm "Advanced" → "Go to ... (unsafe)" → Allow.
     (Cảnh báo "unsafe" là bình thường vì đây là script do chính bạn viết/dán, không phải
     ứng dụng bên thứ ba.)
5. Sau khi Deploy xong, Google cho bạn 1 **Web app URL** dạng:
   `https://script.google.com/macros/s/AKfycb................/exec`
   → **copy URL này**, sẽ dùng ở Bước 3.

> Mỗi khi bạn **sửa lại nội dung `Code.gs`** sau này, phải bấm **Deploy → Manage deployments
> → biểu tượng bút chì → New version → Deploy** thì thay đổi mới có hiệu lực (không tự cập nhật).

---

## Bước 3 — Kết nối trang web với Apps Script

1. Mở file `assets/js/config.js` bằng Notepad/VSCode.
2. Thay dòng:
   ```js
   const APPS_SCRIPT_URL = 'DÁN_URL_APPS_SCRIPT_CỦA_BẠN_VÀO_ĐÂY';
   ```
   thành URL bạn copy ở Bước 2, ví dụ:
   ```js
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
3. Lưu file lại.

---

## Bước 4 — Đưa trang web lên mạng (để thí sinh truy cập được)

Chọn 1 trong các cách sau (đều **miễn phí**):

- **Firebase Hosting** (giống trang mẫu bạn gửi `hs-center...web.app`):
  cài `firebase-tools`, chạy `firebase init hosting`, chọn thư mục này, `firebase deploy`.
- **Netlify / Vercel**: kéo thả cả thư mục này vào trang [app.netlify.com/drop](https://app.netlify.com/drop) — có link chạy ngay, không cần cài gì.
- **GitHub Pages**: đẩy thư mục lên 1 repo GitHub, bật Pages trong Settings.

Nếu chỉ muốn **thử nghiệm trên máy mình trước**, bạn có thể mở thẳng file `index.html`
bằng trình duyệt (không cần deploy) — mọi tính năng vẫn chạy được vì không cần server riêng,
chỉ cần đã hoàn tất Bước 1–3.

---

## Bước 5 — Kiểm thử (test) trước khi phát mã thật

1. Mở `index.html` → **Vào phòng thi** → nhập 1 mã bạn đã tạo ở tab `MaThi`
   (ví dụ `TSA001`) → kiểm tra đề hiện đúng câu hỏi, đúng số phút từng phần.
2. Làm thử vài câu, đợi hết giờ 1 phần → kiểm tra có **tự động chuyển phần** không.
3. Bấm **Nộp bài** ở phần cuối → kiểm tra trang kết quả hiện điểm đúng.
4. Mở lại Google Sheet, tab `MaThi` → kiểm tra dòng `TSA001` đã tự động có
   `DaThi = TRUE`, có `DiemSo`, `SoCauDung`, `ThoiGianNop`.
5. Thử nhập lại mã `TSA001` lần 2 ở "Vào phòng thi" → hệ thống phải báo
   **"Mã dự thi này đã được sử dụng"** — đúng như yêu cầu mỗi mã chỉ thi 1 lần.
6. Vào **Tra cứu điểm**, nhập `TSA001` → phải hiện đúng điểm vừa nộp.

Sau khi test ổn, bạn có thể **xoá dòng test** khỏi tab `MaThi` (hoặc đặt `DaThi = FALSE`
lại để thi thử tiếp) trước khi phát mã thật cho thí sinh.

---

## Lưu ý quan trọng

- **Chưa chống được mở nhiều tab / nhiều thiết bị cùng lúc bằng 1 mã trước khi nộp bài**
  — hệ thống chỉ khoá mã lại **sau khi đã nộp bài thành công**. Nếu cần chặt chẽ hơn
  (khoá mã ngay khi bắt đầu làm bài), báo mình để bổ sung thêm.
- Đáp án đúng **không bao giờ** được gửi về trình duyệt của thí sinh — điểm luôn được
  chấm ở phía Google Apps Script (phía "server"), nên thí sinh không thể mở Console
  trình duyệt để xem trước đáp án hoặc tự sửa điểm.
- Nếu thí sinh **lỡ tải lại trang (F5)** giữa lúc làm bài, hệ thống vẫn giữ đúng thời
  gian còn lại và các câu đã trả lời (không bị mất giờ hay mất bài làm).
- Muốn đổi tổng thời gian / số phần thi / số câu: chỉ cần sửa trực tiếp trong Google
  Sheet (tab `PhanThi`, `CauHoi`), **không cần sửa code**.
