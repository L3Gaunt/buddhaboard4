import { supabase } from './supabase';
import type { Database } from '../types/supabase';

export type TicketData = Database['public']['Tables']['tickets']['Row'];
export type TicketInsert = Database['public']['Tables']['tickets']['Insert'];
export type TicketUpdate = Database['public']['Tables']['tickets']['Update'];

export async function getTickets(filters?: {
  status?: TicketData['status'][];
  assigned_to?: string;
  customer_id?: string;
}) {
  let query = supabase.from('tickets').select('*');

  if (filters?.status) {
    query = query.in('status', filters.status);
  }
  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }
  if (filters?.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }

  console.log('Filters:', filters);
  const { data, error } = await query.order('created_at', { ascending: false });
  console.log('Query result:', { data, error });
  if (error) throw error;
  return data;
}

export async function getTicketById(id: number) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createTicket(ticket: TicketInsert) {
  const { data, error } = await supabase
    .from('tickets')
    .insert(ticket)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTicket(id: number, updates: TicketUpdate) {
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addMessageToTicket(
  ticketId: number,
  message: {
    id: string;
    sender: string;
    message: string;
    timestamp: string;
    attachments?: Array<{
      url: string;
      name: string;
      type: string;
      size: number;
    }>;
  }
) {
  const { data: ticket } = await getTicketById(ticketId);
  const conversation = [...(ticket.conversation || []), message];

  const { data, error } = await supabase
    .from('tickets')
    .update({ conversation })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Optional: Real-time subscriptions
export function subscribeToTicketUpdates(
  ticketId: number,
  callback: (ticket: TicketData) => void
) {
  return supabase
    .channel(`ticket:${ticketId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tickets',
        filter: `id=eq.${ticketId}`,
      },
      (payload) => callback(payload.new as TicketData)
    )
    .subscribe();
} 