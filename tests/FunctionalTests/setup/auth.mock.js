import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../../../src/modules/users/user.model.js";

/**
 * 1. TẠO TOKEN NHANH (Không lưu vào Database)
 * Sử dụng khi test các API cản Middleware cơ bản (chỉ đọc Role từ JWT).
 */
export const generateTokenOnly = (role = "Citizen", id = new mongoose.Types.ObjectId().toString()) => {
  const tokenPayload = {
    user: {
      id: id,
      email: `${role.replace(/\s+/g, "").toLowerCase()}_${id.substring(0, 4)}@test.com`,
      role: role,
    },
  };
  // Fallback secret in case dotenv isn't loaded properly
  const secret = process.env.JWT_SECRET || "flood_rescue_test_secret_key_12345";
  return jwt.sign(tokenPayload, secret, { expiresIn: "1h" });
};

export const getAdminToken = () => generateTokenOnly("Admin");
export const getCoordinatorToken = () => generateTokenOnly("Rescue Coordinator");
export const getManagerToken = () => generateTokenOnly("Manager");
export const getCitizenToken = () => generateTokenOnly("Citizen");

/**
 * 2. TẠO MOCK USER VÀ TOKEN (Có lưu vào Database Test)
 * Sử dụng khi gọi các API cần truy vấn quan hệ từ `req.user.id` (VD: Lấy Team ID, kiểm tra User isActive...).
 */
export const createUserAndToken = async (role = "Citizen", extraData = {}) => {
  // Tạo số điện thoại ngẫu nhiên 10 số tránh mongoose validation lỗi duplicated
  const randomPhone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
  
  const user = await User.create({
    userName: `test_${role.replace(/\s+/g, "").toLowerCase()}_${Date.now()}`,
    displayName: `Mock ${role}`,
    email: `${role.replace(/\s+/g, "").toLowerCase()}_${Date.now()}@test.com`,
    phoneNumber: randomPhone,
    password: "hashed_dummy_password", // Bypass bcrypt in tests if only testing API
    role: role,
    isActive: true,
    ...extraData
  });

  const token = generateTokenOnly(role, user._id.toString());
  return { user, token };
};
