// Create admin user in database
// Usage: node create-admin.js

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bike_reservation'
  });

  try {
    console.log('Creating admin account...\n');

    const email = 'admin@example.com';
    const password = 'Admin@123456';
    const name = 'Admin User';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert admin user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, role, is_active) VALUES ($1, $2, $3, $4, true) RETURNING id, email, name, role',
      [email, passwordHash, name, 'ADMIN']
    );

    console.log('✅ Admin account created!\n');
    console.log('Credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`\nLogin at: http://localhost:3000/admin/login\n`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    await pool.end();
    process.exit(1);
  }
}

createAdmin();
