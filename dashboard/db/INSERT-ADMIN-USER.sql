-- ============================================
-- TẠO TÀI KHOẢN ADMIN
-- Email: dqcong@gmail.com
-- Password: Go123456
-- ============================================

-- Bước 1: Xóa user cũ nếu có
DELETE FROM account WHERE account_id = 'dqcong@gmail.com';
DELETE FROM "user" WHERE email = 'dqcong@gmail.com';

-- Bước 2: Tạo user mới
INSERT INTO "user" (id, email, name, email_verified, created_at, updated_at)
VALUES (
  'admin-congdau-001',
  'dqcong@gmail.com',
  'Cong Dau (Admin)',
  true,
  NOW(),
  NOW()
);

-- Bước 3: Tạo account với password Go123456
INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
VALUES (
  'admin-account-001',
  'dqcong@gmail.com',
  'credential',
  'admin-congdau-001',
  '$2b$10$OvionRlWg.6ymIu7E.FBYOFM.qf8dmrvqd.hzC1KoR7mXFrhD2qce',
  NOW(),
  NOW()
);

-- Bước 4: Kiểm tra kết quả
SELECT 'SUCCESS - Admin user created!' as message;
