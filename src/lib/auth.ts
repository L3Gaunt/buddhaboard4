import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { 
  type Agent,
  type AgentStatus,
  type Customer,
  type AgentId,
  createAgentId,
  createCustomerId
} from '../types';

export type AgentData = Database['public']['Tables']['agents']['Row'];
export type UserData = Database['public']['Tables']['users']['Row'];

export type SignInData = {
  email: string;
  password: string;
};

export async function signIn(email: string, password: string) {
  console.log('Starting signin process for:', { email });
  
  try {
    console.log('Attempting to sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('Signin response:', { 
      success: !!data?.user,
      error: error?.message,
      user: data?.user ? { 
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      } : null
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Signin process error:', error);
    throw error;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getAgentProfile(userId: AgentId | string): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data ? {
    ...data,
    id: createAgentId(data.id),
    avatar: data.avatar || '',
    metadata: data.metadata ? {
      department: (data.metadata as any)?.department,
      skills: (data.metadata as any)?.skills || [],
      languages: (data.metadata as any)?.languages || []
    } : {}
  } : null;
}

export async function getUserProfile(userId: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data ? {
    ...data,
    id: createCustomerId(data.id),
    createdAt: new Date(data.created_at),
    metadata: data.metadata ? {
      lastLogin: (data.metadata as any)?.lastLogin ? new Date((data.metadata as any).lastLogin) : undefined,
    } : undefined,
    avatar: data.avatar || undefined,
    company: data.company || undefined,
    phone: data.phone || undefined
  } : null;
}

export async function updateAgentStatus(userId: AgentId | string, status: AgentStatus) {
  const { error } = await supabase
    .from('agents')
    .update({ status })
    .eq('id', userId);
    
  if (error) throw error;
}

export async function createUserProfile(userData: Omit<Database['public']['Tables']['users']['Insert'], 'id' | 'created_at'>) {
  // Generate avatar URL using DiceBear API
  const seed = Math.random().toString(36).substring(7);
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

  const { data, error } = await supabase
    .from('users')
    .insert({
      ...userData,
      avatar: avatarUrl
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// Subscribe to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};