// Check if user exists in database
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:ec8YjCnX2m8Gu7@db.vkhqqybnvnoagxqglnkn.supabase.co:5432/postgres';

async function checkUser() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check user table
    const userResult = await client.query(
      'SELECT id, email, name, email_verified, created_at FROM "user" WHERE email = $1',
      ['dqcong@gmail.com']
    );

    console.log('👤 User table:');
    if (userResult.rows.length > 0) {
      console.table(userResult.rows);
    } else {
      console.log('❌ User not found in "user" table');
    }

    // Check account table
    const accountResult = await client.query(
      'SELECT id, account_id, provider_id, user_id, created_at FROM account WHERE account_id = $1',
      ['dqcong@gmail.com']
    );

    console.log('\n🔐 Account table:');
    if (accountResult.rows.length > 0) {
      console.table(accountResult.rows);
    } else {
      console.log('❌ Account not found in "account" table');
    }

    // Check if password is set
    const passwordCheck = await client.query(
      'SELECT id, account_id, password IS NOT NULL as has_password FROM account WHERE account_id = $1',
      ['dqcong@gmail.com']
    );

    if (passwordCheck.rows.length > 0) {
      console.log('\n🔑 Password check:');
      console.table(passwordCheck.rows);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkUser();
