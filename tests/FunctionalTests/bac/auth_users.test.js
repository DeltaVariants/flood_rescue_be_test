import request from 'supertest';
import app from '../../../src/app.js';

describe('RBAC & Auth Tests (Bắc)', () => {
    it('should block Citizen from accessing Admin routes (403 Forbidden)', async () => {
        // TODO: Viết logic supertest chọc vào route Admin với token Citizen
    });
});
