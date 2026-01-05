#!/usr/bin/env node
/**
 * Create test user via Better Auth API
 * Usage: node scripts/create-test-user.js
 */

const VERCEL_URL = process.env.VERCEL_URL || 'https://gen-image-chl.vercel.app';

async function createTestUser() {
  console.log('🔐 Creating test user via Better Auth...\n');

  const userData = {
    email: 'dqcong@gmail.com',
    password: 'Test@123',
    name: 'CongDau',
  };

  try {
    // 1. Sign up user with Better Auth
    console.log('1️⃣ Signing up user...');
    const signUpResponse = await fetch(`${VERCEL_URL}/api/auth/sign-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!signUpResponse.ok) {
      const error = await signUpResponse.text();
      throw new Error(`Sign up failed: ${error}`);
    }

    console.log('✅ User created in Better Auth');

    // 2. Create team and captain
    console.log('\n2️⃣ Creating team...');
    const teamResponse = await fetch(`${VERCEL_URL}/api/teams/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'CongDau',
        teamName: 'Đội alpha',
        zaloId: '0123456789',
      }),
    });

    if (!teamResponse.ok) {
      const error = await teamResponse.text();
      console.error('⚠️ Team creation failed:', error);
      console.log('You may need to run the SQL manually on Supabase');
    } else {
      const teamData = await teamResponse.json();
      console.log('✅ Team created:', teamData);
    }

    console.log('\n🎉 Test user created successfully!');
    console.log('\n📧 Login credentials:');
    console.log('   Email:', userData.email);
    console.log('   Password:', userData.password);
    console.log('\n🔗 Login URL:', `${VERCEL_URL}/login`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Manual fallback: Run db/create-test-user-simple.sql on Supabase');
    process.exit(1);
  }
}

createTestUser();
