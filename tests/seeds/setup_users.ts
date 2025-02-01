import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/supabase';

// Initialize Supabase client with service role key for admin operations
export const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);

export const testUsers = {
  admins: [
    { email: 'admin@buddhaboard.com', password: 'n1rvana', name: 'Main Admin' },
    { email: 'admin2@buddhaboard.com', password: 'n1rvana', name: 'Secondary Admin' }
  ],
  agents: [
    { email: 'agent1@buddhaboard.com', password: 'n1rvana', name: 'Sarah Johnson' },
    { email: 'agent2@buddhaboard.com', password: 'n1rvana', name: 'Michael Chen' },
    { email: 'agent3@buddhaboard.com', password: 'n1rvana', name: 'Emma Rodriguez' }
  ],
  customers: [
    { email: 'john.doe@example.com', password: 'n1rvana', name: 'John Doe' },
    { email: 'jane.smith@example.com', password: 'n1rvana', name: 'Jane Smith' },
    { email: 'maria.garcia@example.com', password: 'n1rvana', name: 'Maria Garcia' },
    { email: 'david.wilson@example.com', password: 'n1rvana', name: 'David Wilson' },
  ]
};

export async function createConfirmedUser(email: string, password: string) {
  const { data: { user }, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { confirmed: true }
  });

  if (error) throw error;
  return user;
} 