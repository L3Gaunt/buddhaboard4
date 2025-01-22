import { describe, it, expect } from 'vitest';
import { supabase, testUsers, createConfirmedUser } from './setup';

describe('Seed Test Data', () => {
  async function cleanupUser(userId: string) {
    const { error: agentError } = await supabase
      .from('agents')
      .delete()
      .eq('id', userId);
    
    if (agentError) {
      console.error('Error deleting agent:', agentError);
      throw agentError;
    }

    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (userError) {
      console.error('Error deleting user:', userError);
      throw userError;
    }
  }

  it('should create admin users and profiles', async () => {
    for (const admin of testUsers.admins) {
      try {
        // Create confirmed auth user
        const user = await createConfirmedUser(admin.email, admin.password);
        expect(user).toBeDefined();
        if (!user) throw new Error('Failed to create admin user');

        // Create agent profile
        const { error: profileError } = await supabase
          .from('agents')
          .upsert({
            id: user.id,
            email: admin.email,
            name: admin.name,
            role: 'admin',
            status: 'online',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.name.toLowerCase().replace(' ', '')}`,
            metadata: {
              department: 'Management',
              skills: ['customer service', 'technical support', 'management'],
              languages: ['en']
            }
          }, { onConflict: 'id' });
        
        if (profileError) {
          console.error('Error creating admin profile:', profileError);
          throw profileError;
        }
      } catch (error: any) {
        // Skip if user already exists
        if (error?.message?.includes('already been registered')) {
          console.log(`Admin ${admin.email} already exists, skipping...`);
          continue;
        }
        throw error;
      }
    }
  });

  it('should create agent users and profiles', async () => {
    for (const agent of testUsers.agents) {
      try {
        const user = await createConfirmedUser(agent.email, agent.password);
        expect(user).toBeDefined();
        if (!user) throw new Error('Failed to create agent user');

        const { error: profileError } = await supabase
          .from('agents')
          .upsert({
            id: user.id,
            email: agent.email,
            name: agent.name,
            role: agent.name === 'Emma Rodriguez' ? 'supervisor' : 'agent',
            status: 'online',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.name.toLowerCase().replace(' ', '')}`,
            metadata: {
              department: 'Support',
              skills: ['customer service', 'technical support'],
              languages: ['en']
            }
          }, { onConflict: 'id' });

        if (profileError) {
          console.error('Error creating agent profile:', profileError);
          throw profileError;
        }
      } catch (error: any) {
        if (error?.message?.includes('already been registered')) {
          console.log(`Agent ${agent.email} already exists, skipping...`);
          continue;
        }
        throw error;
      }
    }
  });

  it('should create customer users and profiles', async () => {
    for (const customer of testUsers.customers) {
      try {
        const user = await createConfirmedUser(customer.email, customer.password);
        expect(user).toBeDefined();
        if (!user) throw new Error('Failed to create customer user');

        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: customer.email,
            name: customer.name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.name.toLowerCase().replace(' ', '')}`,
            phone: '+1234567890',
            company: 'Test Company',
            metadata: {
              preferences: {
                language: 'en',
                notifications: true
              },
              lastLogin: new Date().toISOString()
            }
          }, { onConflict: 'id' });

        if (profileError) {
          console.error('Error creating customer profile:', profileError);
          throw profileError;
        }
      } catch (error: any) {
        if (error?.message?.includes('already been registered')) {
          console.log(`Customer ${customer.email} already exists, skipping...`);
          continue;
        }
        throw error;
      }
    }
  });

  it('should create sample tickets', async () => {
    const { data: customers } = await supabase
      .from('users')
      .select('id, email')
      .limit(2);
    
    const { data: agents } = await supabase
      .from('agents')
      .select('id, email')
      .limit(2);

    expect(customers).toBeDefined();
    expect(agents).toBeDefined();
    if (!customers || !agents || customers.length === 0 || agents.length === 0) {
      throw new Error('No customers or agents found');
    }

    const { error: ticketError } = await supabase
      .from('tickets')
      .upsert([
        {
          title: 'Cannot access dashboard',
          description: 'I\'m getting a 404 error when trying to access the main dashboard.',
          priority: 'high',
          status: 'in_progress',
          assigned_to: agents[0].id,
          customer_id: customers[0].id,
          conversation: [
            {
              id: '1',
              sender: customers[0].id,
              message: 'I cannot access the dashboard. Getting 404 error.',
              timestamp: new Date().toISOString()
            },
            {
              id: '2',
              sender: agents[0].id,
              message: 'I\'ll look into this right away. Can you please clear your browser cache and try again?',
              timestamp: new Date().toISOString()
            }
          ],
          metadata: {
            browser: 'Chrome',
            version: '121.0.0'
          }
        }
      ], { onConflict: 'number' });

    if (ticketError) {
      console.error('Error creating ticket:', ticketError);
      throw ticketError;
    }
  });
}); 