import { supabase } from './supabase';
import type { Agent, AgentId, AgentRole, AgentStatus } from '@/types';
import type { Database } from '@/types/supabase';

type AgentUpdate = Database['public']['Tables']['agents']['Update'];

export async function getAllAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('name');

  if (error) throw error;

  return data.map(agent => ({
    id: agent.id as AgentId,
    name: agent.name,
    email: agent.email,
    role: agent.role as AgentRole,
    status: agent.status as AgentStatus,
    avatar: agent.avatar || '',
    metadata: agent.metadata ? {
      department: (agent.metadata as any)?.department,
      skills: (agent.metadata as any)?.skills || [],
      languages: (agent.metadata as any)?.languages || []
    } : undefined
  }));
}

export async function updateAgentProfile(
  agentId: AgentId | string,
  updates: Partial<Agent>
) {
  // Prepare the update data
  const updateData: AgentUpdate = {
    name: updates.name,
    email: updates.email,
    role: updates.role,
    metadata: updates.metadata as any // Safe to cast as Supabase handles JSON serialization
  };

  // Remove undefined values
  const cleanedData = Object.fromEntries(
    Object.entries(updateData).filter(([_, v]) => v !== undefined)
  );

  const { error } = await supabase
    .from('agents')
    .update(cleanedData)
    .eq('id', agentId);

  if (error) throw error;
}

export async function changeAgentPassword(
  agentId: AgentId | string,
  newPassword: string
) {
  // First verify the agent exists
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id')
    .eq('id', agentId)
    .single();

  if (agentError) throw agentError;
  if (!agent) throw new Error('Agent not found');

  // Call the Edge Function to change the password
  const { error } = await supabase.functions.invoke('change_password', {
    body: {
      targetUserId: agentId,
      newPassword
    }
  });

  if (error) throw error;
}

export type CreateAgentData = {
  name: string;
  email: string;
  password: string;
  role: AgentRole;
  department?: string;
  skills?: string[];
  languages?: string[];
};

export async function createAgent(data: CreateAgentData) {
  // First create the auth user via edge function
  const { data: authData, error: authError } = await supabase.functions.invoke('create_agent', {
    body: {
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role
    }
  });

  if (authError) throw authError;
  if (!authData?.userId) throw new Error('No user ID returned from auth creation');

  // Then create the agent profile
  const { data: agent, error: profileError } = await supabase
    .from('agents')
    .insert({
      id: authData.userId,
      name: data.name,
      email: data.email,
      role: data.role,
      status: 'offline',
      metadata: {
        department: data.department,
        skills: data.skills || [],
        languages: data.languages || []
      }
    })
    .select()
    .single();

  if (profileError) throw profileError;
  return agent;
} 