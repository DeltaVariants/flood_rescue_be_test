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
    // Các rules:
    rules: {
      "no-unused-vars": "warn", // Cảnh báo nếu có biến khai báo nhưng không dùng
      "no-console": "off", // Cho phép sử dụng console.log (vì backend thường cần log)
      eqeqeq: "error", // Bắt buộc dùng === thay vì ==
      semi: ["error", "always"], // Bắt buộc phải có dấu chấm phẩy ở cuối dòng
    },
  },
];
