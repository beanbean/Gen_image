-- ============================================
-- KIỂM TRA USER VÀ PASSWORD
-- Chạy trên Supabase SQL Editor
-- ============================================

-- 1. Kiểm tra user tồn tại
SELECT id, email, name, email_verified, created_at
FROM "user"
WHERE email = 'dqcong@gmail.com';

-- 2. Kiểm tra account (bỏ column has_password)
SELECT id, account_id, provider_id, user_id,
       password IS NOT NULL as has_password,
       LENGTH(password) as password_length,
       SUBSTRING(password, 1, 20) || '...' as password_preview
FROM account
WHERE account_id = 'dqcong@gmail.com';

-- 3. Kiểm tra schema của bảng account
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'account'
ORDER BY ordinal_position;
