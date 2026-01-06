// DEBUG: Test database connection and verify user/password
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:ec8YjCnX2m8Gu7@db.vkhqqybnvnoagxqglnkn.supabase.co:5432/postgres';

async function debugAuth() {
  const client = new Client({ connectionString: DATABASE_URL });

  console.log('🔍 DEBUGGING AUTHENTICATION\n');
  console.log('DATABASE_URL:', DATABASE_URL.replace(/:[^:@]+@/, ':***@'));

  try {
    await client.connect();
    console.log('✅ Database connected\n');

    // 1. Check if user table exists
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('user', 'account', 'session')
      ORDER BY table_name
    `);

    console.log('📋 Tables found:');
    console.table(tablesResult.rows);

    // 2. Check user exists
    const userResult = await client.query(
      'SELECT id, email, name, email_verified, created_at FROM "user" WHERE email = $1',
      ['dqcong@gmail.com']
    );

    console.log('\n👤 User record:');
    if (userResult.rows.length === 0) {
      console.log('❌ USER NOT FOUND - Need to run INSERT-ADMIN-USER.sql first!');
      process.exit(1);
    }
    console.table(userResult.rows);
    const userId = userResult.rows[0].id;

    // 3. Check account exists
    const accountResult = await client.query(
      'SELECT id, account_id, provider_id, user_id, password FROM account WHERE user_id = $1',
      [userId]
    );

    console.log('\n🔐 Account record:');
    if (accountResult.rows.length === 0) {
      console.log('❌ ACCOUNT NOT FOUND - Need to run INSERT-ADMIN-USER.sql first!');
      process.exit(1);
    }

    const account = accountResult.rows[0];
    console.table([{
      id: account.id,
      account_id: account.account_id,
      provider_id: account.provider_id,
      user_id: account.user_id,
      has_password: !!account.password,
      password_preview: account.password ? account.password.substring(0, 20) + '...' : null
    }]);

    // 4. Verify password hash
    const testPassword = 'Go123456';
    const storedHash = account.password;

    console.log('\n🔑 Password verification:');
    console.log('Test password:', testPassword);
    console.log('Stored hash:', storedHash);

    if (!storedHash) {
      console.log('❌ NO PASSWORD HASH STORED!');
      process.exit(1);
    }

    const isValid = await bcrypt.compare(testPassword, storedHash);
    console.log('Hash matches:', isValid ? '✅ YES' : '❌ NO');

    if (!isValid) {
      console.log('\n⚠️  PASSWORD HASH MISMATCH!');
      console.log('Generate new hash:');
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log(newHash);
      console.log('\nRun this SQL to update:');
      console.log(`UPDATE account SET password = '${newHash}' WHERE user_id = '${userId}';`);
    }

    // 5. Check database schema for account table
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'account'
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Account table schema:');
    console.table(schemaResult.rows);

  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error('Full error:', err);
  } finally {
    await client.end();
  }
}

debugAuth();
