import { supabase } from './supabase';
import type { Agent, AgentRole } from '../types';

export type SignInData = {
  email: string;
  password: string;
};

export type SignUpData = SignInData & {
  name: string;
  role?: AgentRole;
};

export const signIn = async ({ email, password }: SignInData) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signUp = async ({ email, password, name, role = 'agent' }: SignUpData) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  });

  if (authError) throw authError;

  // Create agent record
  const { error: agentError } = await supabase
    .from('agents')
    .insert({
      id: authData.user?.id,
      email,
      name,
      role,
    });

  if (agentError) {
    // Cleanup auth user if agent creation fails
    await supabase.auth.admin.deleteUser(authData.user?.id as string);
    throw agentError;
  }

  return authData;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentAgent = async (): Promise<Agent | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', user.id)
    .single();

  return agent;
};

export const updateAgentStatus = async (status: Agent['status']) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('agents')
    .update({ status })
    .eq('id', user.id);

  if (error) throw error;
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
}; 