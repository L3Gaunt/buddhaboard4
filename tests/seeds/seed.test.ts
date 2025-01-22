import { describe, it, expect } from 'vitest';
import { supabase, testUsers, createConfirmedUser } from './setup';
import type { Database, Json } from '../../src/types/supabase';

type TicketInsert = Database['public']['Tables']['tickets']['Insert'];

function generateRandomTicket(customerId: string, agentId: string, index: number): TicketInsert {
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const statuses = ['open', 'in_progress', 'resolved', 'closed'];
  const titles = [
    'Login issues with the platform',
    'Need help with billing',
    'Feature request: Dark mode',
    'App crashes on startup',
    'Password reset not working',
    'Integration problems with API',
    'Performance is slow',
    'Data export not working',
    'Cannot update profile picture',
    'Mobile app sync issues'
  ];
  const descriptions = [
    'I\'m experiencing difficulties with the system.',
    'The application is not responding as expected.',
    'I need assistance with this functionality.',
    'This feature is not working properly.',
    'I\'m getting unexpected errors.'
  ];

  const randomDate = new Date();
  randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));

  return {
    title: titles[index % titles.length],
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    assigned_to: agentId,
    customer_id: customerId,
    created_at: randomDate.toISOString(),
    conversation: [
      {
        id: `${index}-1`,
        isFromCustomer: true,
        message: 'Hi, I need help with this issue.',
        timestamp: randomDate.toISOString()
      },
      {
        id: `${index}-2`,
        isFromCustomer: false,
        message: 'I\'ll be happy to help you with this. Can you provide more details?',
        timestamp: new Date(randomDate.getTime() + 1000 * 60 * 30).toISOString()
      }
    ],
    metadata: {
      browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
      version: '1.0.0',
      platform: ['Windows', 'MacOS', 'Linux'][Math.floor(Math.random() * 3)]
    }
  };
}

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
      .select('id, email');
    
    const { data: agents } = await supabase
      .from('agents')
      .select('id, email');

    expect(customers).toBeDefined();
    expect(agents).toBeDefined();
    if (!customers || !agents || customers.length === 0 || agents.length === 0) {
      throw new Error('No customers or agents found');
    }

    // Generate 50 tickets distributed among agents and customers
    const tickets: TicketInsert[] = [];
    for (let i = 0; i < 50; i++) {
      const customer = customers[i % customers.length];
      const agent = agents[i % agents.length];
      tickets.push(generateRandomTicket(customer.id, agent.id, i));
    }

    const { error: ticketError } = await supabase
      .from('tickets')
      .upsert(tickets, { onConflict: 'number' });

    if (ticketError) {
      console.error('Error creating tickets:', ticketError);
      throw ticketError;
    }
  });
}); 