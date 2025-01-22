import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { 
  type Agent,
  type AgentRole,
  type AgentStatus,
  type Customer,
  type AgentId,
  AgentStatus as AgentStatusEnum,
  AgentRole as AgentRoleEnum,
  createAgentId
} from '../types';

export type AgentData = Database['public']['Tables']['agents']['Row'];
export type UserData = Database['public']['Tables']['users']['Row'];

export type SignInData = {
  email: string;
  password: string;
};

export type SignUpData = SignInData & {
  name: string;
  role?: AgentRole;
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
    metadata: data.metadata || {}
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
    id: data.id,
    createdAt: new Date(data.created_at),
    metadata: data.metadata || {}
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
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
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

export const signUp = async ({ email, password, name, role = AgentRoleEnum.AGENT }: SignUpData) => {
  console.group('🚀 Starting Signup Process');
  console.log('Input parameters:', { 
    email, 
    passwordLength: password?.length || 0, 
    name, 
    role,
    timestamp: new Date().toISOString()
  });
  
  try {
    console.group('📝 Creating Auth User');
    console.log('Preparing auth signup data:', {
      email,
      metadata: {
        name,
        role,
      }
    });

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

    console.log('Auth API Response:', {
      success: !!authData?.user,
      error: authError ? {
        message: authError.message,
        name: authError.name,
        status: authError.status,
        stack: authError.stack
      } : null,
      session: authData?.session ? {
        expires_at: authData.session.expires_at,
        token_type: authData.session.token_type
      } : null,
      user: authData?.user ? {
        id: authData.user.id,
        email: authData.user.email,
        created_at: authData.user.created_at,
        user_metadata: authData.user.user_metadata,
        app_metadata: authData.user.app_metadata
      } : null
    });

    if (authError) {
      console.error('❌ Auth Error Details:', {
        name: authError.name,
        message: authError.message,
        status: authError.status,
        stack: authError.stack
      });
      console.groupEnd();
      console.groupEnd();
      throw authError;
    }

    if (!authData.user) {
      console.error('❌ No user data returned from auth signup');
      console.groupEnd();
      console.groupEnd();
      throw new Error('No user data returned');
    }

    const agentId = createAgentId(authData.user.id);
    console.log('✅ Auth user created successfully:', { 
      userId: agentId,
      email: authData.user.email,
      created_at: authData.user.created_at
    });
    console.groupEnd();

    try {
      console.group('👤 Creating Agent Profile');
      const agentData = {
        id: agentId,
        email,
        name,
        role,
        status: AgentStatusEnum.OFFLINE,
        avatar: '',
        metadata: {}
      };
      console.log('Agent data to insert:', agentData);

      console.log('Executing database insert...');
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert(agentData)
        .select()
        .single();

      console.log('Database Response:', {
        success: !!agent,
        error: agentError ? {
          code: agentError.code,
          details: agentError.details,
          hint: agentError.hint,
          message: agentError.message
        } : null,
        agent: agent ? {
          id: agent.id,
          email: agent.email,
          name: agent.name,
          role: agent.role,
          status: agent.status
        } : null
      });

      if (agentError) {
        console.error('❌ Agent Creation Error:', {
          code: agentError.code,
          details: agentError.details,
          hint: agentError.hint,
          message: agentError.message,
          stack: agentError.stack
        });
        console.groupEnd();
        console.groupEnd();
        throw agentError;
      }

      console.log('✅ Agent profile created successfully:', {
        id: agent?.id,
        email: agent?.email,
        role: agent?.role
      });
      console.groupEnd();
      console.groupEnd();
      return authData;
    } catch (error) {
      console.error('❌ Agent Creation Process Error:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      console.groupEnd();
      console.groupEnd();
      throw new Error('Failed to create agent profile. Please try again.');
    }
  } catch (error) {
    console.error('❌ Signup Process Error:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    });
    console.groupEnd();
    throw error;
  }
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