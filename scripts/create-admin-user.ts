#!/usr/bin/env tsx
/**
 * Create Admin User in Supabase Auth
 *
 * Usage: npm run create-admin
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Missing required environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  console.log('🔐 Creating admin user...\n');

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const userExists = existingUsers?.users.some(u => u.email === ADMIN_EMAIL);

  if (userExists) {
    console.log(`⚠️  Admin user ${ADMIN_EMAIL} already exists`);
    console.log('🔄 Updating password to match .env.local...\n');

    // Get the user ID
    const user = existingUsers?.users.find(u => u.email === ADMIN_EMAIL);
    if (user) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: ADMIN_PASSWORD }
      );

      if (updateError) {
        console.error('❌ Failed to update password:', updateError.message);
        process.exit(1);
      }

      console.log('✅ Password updated successfully!\n');
    }

    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    console.log('\n🔗 Login at: http://localhost:3000/admin/login\n');
    return;
  }

  // Create admin user
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true, // Skip email confirmation for development
  });

  if (error) {
    console.error('❌ Failed to create admin user:', error.message);
    process.exit(1);
  }

  console.log('✅ Admin user created successfully!\n');
  console.log('📧 Email:', ADMIN_EMAIL);
  console.log('🔑 Password:', ADMIN_PASSWORD);
  console.log('\n🔗 Login at: http://localhost:3000/admin/login\n');
}

createAdminUser().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
