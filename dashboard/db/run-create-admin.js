// Create admin user via PostgreSQL
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:ec8YjCnX2m8Gu7@db.vkhqqybnvnoagxqglnkn.supabase.co:5432/postgres';

async function createAdminUser() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-admin.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        const result = await client.query(statement);
        if (result.rows && result.rows.length > 0) {
          console.log('\nResult:');
          console.table(result.rows);
        }
      } catch (err) {
        // Some statements may fail (like DELETE if user doesn't exist), that's ok
        if (!err.message.includes('does not exist')) {
          console.error('Warning:', err.message);
        }
      }
    }

    console.log('\n✅ Admin user created successfully!');
    console.log('📧 Email: dqcong@gmail.com');
    console.log('🔑 Password: Go123456');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdminUser();
