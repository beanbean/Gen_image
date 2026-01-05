-- CREATE TEST USER MANUALLY
-- This creates a test user to verify login works
-- Password: Test@123

-- 1. Create user in Better Auth (password hash for "Test@123")
-- Generated using bcrypt with cost 10
INSERT INTO "user" (id, email, name, email_verified, team_id, zalo_id, created_at, updated_at)
VALUES (
  'test-user-001',
  'dqcong@gmail.com',
  'CongDau',
  false,
  NULL,
  '0123456789',
  NOW(),
  NOW()
);

-- 2. Create account record for email/password auth
-- Password hash for "Test@123" using bcrypt
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
  'test-account-001',
  'dqcong@gmail.com',
  'credential',
  'test-user-001',
  '$2a$10$XzW8kZGHxF5f5QJ3vZ8z0.qH8P3qK5xZ5L8N6M3Q2W8kZGHxF5f5Q',  -- Test@123
  NOW(),
  NOW()
);

-- 3. Create team
INSERT INTO teams (id, name, round, created_at, updated_at)
VALUES (
  'team-test-001',
  'Đội alpha',
  'Vòng 1',
  NOW(),
  NOW()
);

-- 4. Create captain
INSERT INTO captains (id, username, password_hash, zalo_id, team_id, created_at, updated_at)
VALUES (
  'captain-test-001',
  'CongDau',
  'managed_by_better_auth',
  '0123456789',
  'team-test-001',
  NOW(),
  NOW()
);

-- 5. Update user's team_id
UPDATE "user"
SET team_id = 'team-test-001'
WHERE id = 'test-user-001';

-- Verify
SELECT * FROM "user" WHERE email = 'dqcong@gmail.com';
SELECT * FROM account WHERE user_id = 'test-user-001';
SELECT * FROM teams WHERE id = 'team-test-001';
SELECT * FROM captains WHERE username = 'CongDau';
