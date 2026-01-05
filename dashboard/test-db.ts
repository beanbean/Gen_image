import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:ec8YjCnX2m8Gu7@db.vkhqqybnvnoagxqglnkn.supabase.co:5432/postgres';

async function testConnection() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 Testing database connection...');
    const result = await pool.query('SELECT current_database(), current_user, version()');
    console.log('✅ Connection successful!');
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);

    // Check if bot_queue exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'bot_queue'
      ) as exists
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ bot_queue table exists');

      // Count rows
      const count = await pool.query('SELECT COUNT(*) FROM bot_queue');
      console.log(`   ${count.rows[0].count} rows in bot_queue`);
    } else {
      console.log('❌ bot_queue table NOT found');
    }

    await pool.end();
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
