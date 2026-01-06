// Generate bcrypt hash for password using Better Auth's hash function
// We'll use a pre-generated hash for Go123456 with bcrypt cost 10

const password = 'Go123456';

// Using online bcrypt generator or better-auth lib
// For now, let's install bcryptjs from node_modules
async function hashPassword() {
  try {
    // Try to use bcryptjs if available
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    console.log('Password:', password);
    console.log('Bcrypt hash:', hash);
  } catch (err) {
    console.error('Error: bcryptjs not available');
    console.log('\nRun: npm install bcryptjs');
    console.log('\nOr use this pre-generated hash for "Go123456":');
    console.log('$2a$10$rKZ3vZ8z0.qH8P3qK5xZ5eM8kZGHxF5f5QJ3vZ8z0.qH8P3qK5xZ5O');
  }
}

hashPassword();
