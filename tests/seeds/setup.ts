import { createClient } from '@supabase/supabase-js';
import { beforeAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/supabase';

let supabase: SupabaseClient<Database>;

async function cleanupTestData() {
  try {
    // First clean up database records
    await supabase.from('tickets').delete().neq('number', 0);
    await supabase.from('users').delete().neq('id', '');
    await supabase.from('agents').delete().neq('id', '');

    // Then clean up auth users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    for (const user of users || []) {
      if (user.email?.includes('@example.com') || user.email?.includes('@buddhaboard.com')) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error(`Error deleting user ${user.email}:`, deleteError);
        }
      }
    }
  } catch (error) {
    console.error('Error in cleanupTestData:', error);
  }
}

beforeAll(async () => {
  // Make sure to use service role key for admin operations
  supabase = createClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key instead of anon key
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  // Clean up any existing test data before starting
  await cleanupTestData();
});

export const testUsers = {
  admins: [
    { email: 'admin@buddhaboard.com', password: 'password123', name: 'Main Admin' },
    { email: 'admin2@buddhaboard.com', password: 'password123', name: 'Secondary Admin' }
  ],
  agents: [
    { email: 'agent1@buddhaboard.com', password: 'password123', name: 'Sarah Johnson' },
    { email: 'agent2@buddhaboard.com', password: 'password123', name: 'Michael Chen' },
    { email: 'agent3@buddhaboard.com', password: 'password123', name: 'Emma Rodriguez' }
  ],
  customers: [
    { email: 'john.doe@example.com', password: 'password123', name: 'John Doe' },
    { email: 'jane.smith@example.com', password: 'password123', name: 'Jane Smith' },
    { email: 'maria.garcia@example.com', password: 'password123', name: 'Maria Garcia' },
    { email: 'david.wilson@example.com', password: 'password123', name: 'David Wilson' },
  ]
};

export async function createConfirmedUser(email: string, password: string) {
  const { data: { user }, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // This automatically confirms the email
    user_metadata: { confirmed: true }
  });

  if (error) throw error;
  return user;
}

export { supabase }; 