-- CHECK DATABASE DATA
-- Run this on Supabase SQL Editor to verify tables and data

-- 1. Check Better Auth tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user', 'session', 'account', 'verification')
ORDER BY table_name;

-- 2. Check all users
SELECT id, email, name, email_verified, team_id, zalo_id, created_at
FROM "user"
ORDER BY created_at DESC;

-- 3. Check all teams
SELECT id, name, round, created_at
FROM teams
ORDER BY created_at DESC;

-- 4. Check all captains
SELECT id, username, zalo_id, team_id, created_at
FROM captains
ORDER BY created_at DESC;

-- 5. Check players
SELECT p.id, p.name, p.role, p.avatar_url, t.name as team_name
FROM players p
LEFT JOIN teams t ON p.team_id = t.id
ORDER BY p.created_at DESC;

-- 6. Check accounts (Better Auth)
SELECT id, account_id, provider_id, user_id, created_at
FROM account
ORDER BY created_at DESC;

-- 7. Check if specific email exists
SELECT * FROM "user" WHERE email = 'dqcong@gmail.com';
