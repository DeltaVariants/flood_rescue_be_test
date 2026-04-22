import { connectTestDb, disconnectTestDb, clearTestDb, dropTestDb } from '../../setup/testDb.js';

/**
 * Wrapper sử dụng lại các hàm có sẵn của dự án trong `tests/setup/testDb.js`.
 * Dùng cho các file test integration.
 */

export const connectTestDB = async () => {
    await connectTestDb();
};

export const clearTestDB = async () => {
    await clearTestDb();
};

export const closeTestDB = async () => {
    await dropTestDb(); // Optional: drop db after all tests finish
    await disconnectTestDb();
};
