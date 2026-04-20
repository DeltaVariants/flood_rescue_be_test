# Kịch bản Demo ESLint cho Dự án Flood Rescue (Backend)

Dưới đây là nội dung chi tiết kịch bản thuyết trình và thao tác demo ESLint áp dụng trực tiếp vào dự án Node.js hiện tại của nhóm.

---

## 1. Cấu trúc dự án

_(Phần này bạn tự trình bày tổng quan cấu trúc đã có: dự án sử dụng Node.js, Express dặt trong thư mục `src/`, test bằng Jest đặt trong `tests/`... Bạn có thể bỏ qua bước hướng dẫn ở phần này theo yêu cầu)._

---

## 2. Cài đặt ESLint

**Mục tiêu:** Cài đặt ESLint và cấu hình phù hợp với dự án sử dụng Node.js và ES Modules (`"type": "module"`).

**Các bước thực hiện:**

1. Mở terminal tại thư mục gốc của dự án (`BE_Test`) và chạy lệnh cài đặt:

   ```bash
   npm install --save-dev eslint
   ```

2. Tạo file cấu hình `eslint.config.js` (chuẩn Flat Config mới nhất của ESLint) tại thư mục gốc:

   ```javascript
   import globals from "globals";
   import pluginJs from "@eslint/js";

   export default [
     {
       // Định nghĩa môi trường cho Node.js và Jest để tránh báo lỗi các hàm mặc định (như process, test, expect...)
       languageOptions: {
         globals: {
           ...globals.node,
           ...globals.jest,
         },
       },
     },
     pluginJs.configs.recommended, // Sử dụng bộ luật tiêu chuẩn của ESLint
     {
       // Tùy chỉnh thêm một số luật (Rules) theo chuẩn dự án
       rules: {
         "no-unused-vars": "warn", // Cảnh báo nếu có biến khai báo nhưng không dùng
         "no-console": "off", // Cho phép sử dụng console.log (vì backend thường cần log)
         eqeqeq: "error", // Bắt buộc dùng === thay vì ==
         semi: ["error", "always"], // Bắt buộc phải có dấu chấm phẩy ở cuối dòng
       },
     },
   ];
   ```

3. Thêm script chạy ESLint vào file `package.json` trong phần `scripts`:
   ```json
   "scripts": {
     // ... các script cũ ...
     "lint": "eslint .",
     "lint:fix": "eslint . --fix"
   }
   ```

---

## 3. Code có lỗi (Tạo file cố tình vi phạm luật để demo)

**Mục tiêu:** Cho người xem thấy ESLint sẽ phát hiện lỗi "bad practice" như thế nào.

**Các bước thực hiện:**

- Tạo một file mới tên `src/demo-eslint.js` và copy đoạn code sau vào:

  ```javascript
  // File này chứa các lỗi cố ý để demo ESLint

  const unusedVariable = "HelloWorld"; // Báo lỗi: thiếu chấm phẩy và biến không được sử dụng

  function calculateScore(a, b) {
    if (a == b) {
      // Báo lỗi: vi phạm luật eqeqeq (đáng lẽ phải dùng ===)
      console.log("Equal"); // Thiếu chấm phẩy
    }
    return a + b;
  }

  calculateScore(10, "10");
  ```

  _(Giải thích cho khán giả: Code này vẫn có thể chạy được với Node.js, nhưng nó tiềm ẩn lỗi logic và không tuân thủ quy chuẩn chung của team)._

---

## 4. Chạy ESLint và Sửa lỗi

**Mục tiêu:** Trình diễn cách phát hiện và tự động sửa các lỗi vừa tạo.

**Các bước thực hiện:**

1. **Kiểm tra lỗi:**
   Chạy lệnh sau trong terminal:

   ```bash
   npm run lint
   ```

   **Kết quả mong muốn:** Terminal sẽ in ra thông báo lỗi (bôi màu đỏ/vàng), chỉ đích danh từng dòng bị lỗi trong `src/demo-eslint.js`:
   - `unusedVariable is assigned a value but never used (no-unused-vars)`
   - `Expected '===' and instead saw '==' (eqeqeq)`
   - `Missing semicolon (semi)`

2. **Chạy Auto-fix (Tự động sửa lỗi chữ/cấu trúc):**
   Chạy tiếp lệnh:

   ```bash
   npm run lint:fix
   ```

   **Kết quả:**
   - Các lỗi thiếu dấu chấm phẩy (`;`) sẽ tự động được thêm vào code.
   - Các lỗi liên quan đến logic (như `===` hay biến thừa) yêu cầu lập trình viên phải **tự tay cẩn thận xem lại** vì ESLint thường sẽ không tự ý đổi `==` thành `===` vì có thể làm bể logic kinh doanh.

3. **Sửa lỗi thủ công (Manual fix):**
   - Đổi `==` thành `===`.
   - Xóa dòng khai báo biến `unusedVariable` hoặc sử dụng biến đó vào đâu đó.
   - Chạy lại lệnh `npm run lint`. Khi terminal trả về kết quả im lặng (không in ra lỗi gì), nghĩa là code đã "Sạch".

---

## 5. Tích hợp với test / workflow (CI/CD)

**Mục tiêu:** Trình diễn cách kiểm soát hoàn toàn quá trình tự động hóa: Code bị dơ sẽ không được phép merge lên GitHub.

**Các bước thực hiện:**

1. Mở thư mục `.github/workflows/` (Dự án này đang có sẵn file CI như `k6-test.yml` hoặc tạo thêm file mới tên `eslint.yml`).
2. Tích hợp step chạy ESLint trước khi chạy Test:

   ```yaml
   name: Check Code Quality (ESLint)

   on:
     push:
       branches: ["main", "dev"]
     pull_request:
       branches: ["main", "dev"]

   jobs:
     eslint:
       name: Run ESLint
       runs-on: ubuntu-latest
       steps:
         - name: Checkout code
           uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: "20.x"

         - name: Install dependencies
           run: npm ci

         - name: Run ESLint Check
           run: npm run lint
   ```

3. **Giải thích khi demo:**
   - Bạn giải thích: _Khi dòng `run: npm run lint` xảy ra lỗi ở GitHub Actions, job này sẽ bị đánh dấu `Failed` (dấu X màu đỏ)._
   - Điều này giúp GitHub chặn (block) luồng Pull Request, không cho một người team member nào đó merge code chưa chuẩn mực vào nhánh gốc, rèn luyện được kỉ luật cho team.

---

## 6. Nâng cao: Chặn lỗi bằng Git Hook với Husky (Nên thêm vào bài thuyết trình)

**Mục tiêu:** Cho người xem thấy cách chặn code "bẩn" lại ngay trên máy tính của Developer, trước khi code được `git commit`.

**Các bước thực hiện:**

1. **Cài đặt Husky:**
   Chạy lệnh sau trong terminal:
   ```bash
   npm install husky --save-dev
   npx husky init
   ```

2. **Cấu hình Hook `pre-commit`:**
   Lệnh `npx husky init` sẽ tạo ra một thư mục `.husky` và file `.husky/pre-commit` ở thư mục gốc dự án. Mở file `.husky/pre-commit` lên và thay thế nội dung thành:
   ```bash
   # Chỉ check file demo để trình diễn (hoặc đổi thành npm run lint nếu muốn check cả dự án)
   npx eslint tests/ESLint/demo.js
   ```

3. **Trình diễn (Demo) lỗi Hook:**
   - Bạn mở file `tests/ESLint/demo.js`, xóa một cái dấu `;` để tạo ra lỗi.
   - Trở lại terminal, gõ:
     ```bash
     git add .
     git commit -m "Update demo file"
     ```
   - **Kết quả "Wow":** Terminal sẽ in ra thông báo lỗi của ESLint (đỏ rực) và **hủy bỏ quá trình commit**. 
   - **Giải thích cho khán giả:** *"Nhờ pre-commit hook của Husky, dù một dev có nhấn lệnh commit, nếu code chưa qua ải ESLint, nó sẽ không bao giờ được phép nằm trong lịch sử git. Đây là vòng phòng ngự đầu tiên hoàn hảo."*
