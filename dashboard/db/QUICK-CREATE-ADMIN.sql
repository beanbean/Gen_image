-- SIMPLE INSERT ADMIN USER
-- Copy và paste script này vào Supabase SQL Editor
-- https://app.supabase.com/project/vkhqqybnvnoagxqglnkn/sql

-- Xóa user cũ nếu có
DELETE FROM account WHERE account_id = 'dqcong@gmail.com';
DELETE FROM "user" WHERE email = 'dqcong@gmail.com';

-- Tạo user mới
INSERT INTO "user" (id, email, name, email_verified, created_at, updated_at)
VALUES (
  'admin-congdau-001',
  'dqcong@gmail.com',
  'Cong Dau (Admin)',
  true,
  NOW(),
  NOW()
);

-- Tạo account với password: Go123456
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

-- Kiểm tra kết quả
SELECT 'SUCCESS - Admin user created!' as status;
SELECT id, email, name, email_verified FROM "user" WHERE email = 'dqcong@gmail.com';
SELECT id, account_id, provider_id FROM account WHERE account_id = 'dqcong@gmail.com';
