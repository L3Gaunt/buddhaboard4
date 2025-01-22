import { supabase } from './supabase';
import type { Database } from '../types/supabase';
import { type Ticket, type Message, createTicketId, createCustomerId, createAgentId, createMessageId } from '../types';
import type { Json } from '../types/supabase';

export type TicketData = Database['public']['Tables']['tickets']['Row'];
export type TicketInsert = Database['public']['Tables']['tickets']['Insert'];
export type TicketUpdate = Database['public']['Tables']['tickets']['Update'];

type JsonObject = { [key: string]: Json | undefined };

interface DatabaseMessage extends JsonObject {
  id: string;
  isFromCustomer: boolean;
  message: string;
  timestamp: string;
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;
  metadata?: Record<string, unknown>;
}

// Type guard to check if a value is a DatabaseMessage
function isDatabaseMessage(value: Json): value is DatabaseMessage {
  if (typeof value !== 'object' || value === null) return false;
  const msg = value as Record<string, unknown>;
  return (
    typeof msg.id === 'string' &&
    typeof msg.isFromCustomer === 'boolean' &&
    typeof msg.message === 'string' &&
    typeof msg.timestamp === 'string'
  );
}

// Transform database ticket to frontend ticket
function transformTicket(data: TicketData): Ticket {
  // Ensure conversation is properly initialized and typed
  const conversation = Array.isArray(data.conversation) ? data.conversation : [];
  
  return {
    id: createTicketId(data.number),
    number: data.number,
    title: data.title,
    priority: data.priority as Ticket['priority'],
    status: data.status as Ticket['status'],
    createdAt: new Date(data.created_at),
    lastUpdated: new Date(data.last_updated),
    assignedTo: data.assigned_to ? createAgentId(data.assigned_to) : undefined,
    customer_id: createCustomerId(data.customer_id),
    conversation: conversation.map(msg => {
      const message = msg as any;
      return {
        id: createMessageId(message.id),
        isFromCustomer: message.isFromCustomer,
        message: message.message,
        timestamp: new Date(message.timestamp),
        attachments: message.attachments,
        metadata: message.metadata
      };
    }),
    metadata: data.metadata as Record<string, unknown> | undefined
  };
}

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
  return data.map(transformTicket);
}

export async function getTicketById(number: number) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('number', number)
    .single();

  if (error) throw error;
  if (!data) throw new Error(`Ticket with number ${number} not found`);
  
  return transformTicket(data);
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

export async function updateTicket(number: number, updates: TicketUpdate) {
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('number', number)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addMessageToTicket(
  ticketNumber: number,
  message: {
    id: string;
    isFromCustomer: boolean;
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
  const ticket = await getTicketById(ticketNumber);
  if (!ticket) throw new Error(`Ticket with number ${ticketNumber} not found`);

  const conversation = [...(ticket.conversation || []), message];

  const { data, error } = await supabase
    .from('tickets')
    .update({ conversation })
    .eq('number', ticketNumber)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTicketPriority(number: number, priority: string) {
  return updateTicket(number, {
    priority
  });
}

export async function closeTicket(number: number) {
  return updateTicket(number, {
    status: 'closed'
  });
}

// Optional: Real-time subscriptions
export function subscribeToTicketUpdates(
  ticketNumber: number,
  callback: (ticket: TicketData) => void
) {
  return supabase
    .channel(`ticket:${ticketNumber}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tickets',
        filter: `number=eq.${ticketNumber}`,
      },
      (payload) => callback(payload.new as TicketData)
    )
    .subscribe();
}

export type UnauthenticatedTicketData = {
  title: string;
  priority: TicketData['priority'];
  email?: string;
  name?: string;
  firstMessage: string; // The initial message from the customer
};

export async function createUnauthenticatedTicket(ticket: UnauthenticatedTicketData) {
  console.log('Creating unauthenticated ticket:', ticket);
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer_ticket`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        action: 'create',
        ...ticket
      }),
    }
  );

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  const { data, error } = await response.json();
  console.log('Response data:', data);
  if (error) {
    console.error('Error creating ticket:', error);
    throw new Error(error);
  }
  return data;
} 