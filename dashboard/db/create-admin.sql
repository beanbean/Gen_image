-- CREATE ADMIN USER
-- Email: dqcong@gmail.com
-- Password: Go123456
-- Run this on Supabase SQL Editor

-- 1. Check if user already exists
SELECT * FROM "user" WHERE email = 'dqcong@gmail.com';

-- 2. Delete existing user if any (optional, comment out if you don't want to override)
DELETE FROM account WHERE user_id IN (SELECT id FROM "user" WHERE email = 'dqcong@gmail.com');
DELETE FROM "user" WHERE email = 'dqcong@gmail.com';

-- 3. Create admin user
INSERT INTO "user" (id, email, name, email_verified, team_id, zalo_id, created_at, updated_at)
VALUES (
  'admin-congdau-001',
  'dqcong@gmail.com',
  'Cong Dau (Admin)',
  true,  -- Email verified
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- 4. Create account record for email/password auth
-- Password: Go123456
-- Hash: $2b$10$OvionRlWg.6ymIu7E.FBYOFM.qf8dmrvqd.hzC1KoR7mXFrhD2qce
INSERT INTO account (
  id,
  account_id,
  provider_id,
  user_id,
  password,
  created_at,
  updated_at
)
VALUES (
  'admin-account-001',
  'dqcong@gmail.com',
  'credential',
  'admin-congdau-001',
  '$2b$10$OvionRlWg.6ymIu7E.FBYOFM.qf8dmrvqd.hzC1KoR7mXFrhD2qce',
  NOW(),
  NOW()
);

-- 5. Verify admin user created
SELECT u.id, u.email, u.name, u.email_verified, u.created_at
FROM "user" u
WHERE u.email = 'dqcong@gmail.com';

SELECT a.id, a.account_id, a.provider_id, a.user_id, a.created_at
FROM account a
WHERE a.user_id = 'admin-congdau-001';

-- SUCCESS MESSAGE
SELECT 'Admin user created successfully!' AS status,
       'Email: dqcong@gmail.com' AS email,
       'Password: Go123456' AS password;
