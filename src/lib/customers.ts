import { supabase } from '@/lib/supabase';
import type { Database } from '../types/supabase';

export interface CustomerMetadata {
  notes?: string;
  [key: string]: any;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  metadata?: CustomerMetadata;
  created_at: string;
}

type UserRow = Database['public']['Tables']['users']['Row'];

export async function updateCustomerNotes(customerId: string, notes: string) {
  // First get the current customer to preserve existing metadata
  const { data: currentUser, error: fetchError } = await supabase
    .from('users')
    .select('metadata')
    .eq('id', customerId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is the "not found" error code
    throw fetchError;
  }

  // Merge the new notes with existing metadata or create new metadata object
  const updatedMetadata: CustomerMetadata = {
    ...(currentUser?.metadata as CustomerMetadata || {}),
    notes
  };

  const { data, error } = await supabase
    .from('users')
    .update({
      metadata: updatedMetadata
    })
    .eq('id', customerId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as UserRow;
}

export async function getCustomer(customerId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', customerId)
    .single();

  if (error) {
    throw error;
  }

  return data as UserRow;
} 