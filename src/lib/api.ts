import { supabase } from './supabase';
import { Agent, Ticket, Conversation, TicketFormData, AgentId, TicketId } from '../types';

// Tickets API
export const getTickets = async (): Promise<Ticket[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(ticket => ({
    ...ticket,
    id: ticket.id,
    createdAt: new Date(ticket.created_at),
    lastUpdated: new Date(ticket.last_updated),
    conversation: [], // Conversations will be loaded separately
  }));
};

export const getTicketConversations = async (ticketId: TicketId): Promise<Conversation[]> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data.map(conv => ({
    ...conv,
    id: conv.id,
    timestamp: new Date(conv.timestamp),
  }));
};

export const createTicket = async (ticketData: TicketFormData): Promise<Ticket> => {
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      title: ticketData.title,
      description: ticketData.description,
      priority: ticketData.priority,
      number: `TICK-${Date.now()}`, // You might want to implement a better ticket numbering system
      status: 'open',
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    id: data.id,
    createdAt: new Date(data.created_at),
    lastUpdated: new Date(data.last_updated),
    conversation: [],
  };
};

export const updateTicket = async (
  ticketId: TicketId,
  updates: Partial<Ticket>
): Promise<void> => {
  const { error } = await supabase
    .from('tickets')
    .update({
      ...updates,
      last_updated: new Date().toISOString(),
    })
    .eq('id', ticketId);

  if (error) throw error;
};

// Agents API
export const getAgents = async (): Promise<Agent[]> => {
  const { data, error } = await supabase
    .from('agents')
    .select('*');

  if (error) throw error;
  return data.map(agent => ({
    ...agent,
    id: agent.id,
  }));
};

export const updateAgentStatus = async (
  agentId: AgentId,
  status: Agent['status']
): Promise<void> => {
  const { error } = await supabase
    .from('agents')
    .update({ status })
    .eq('id', agentId);

  if (error) throw error;
};

// Conversations API
export const addConversation = async (
  ticketId: TicketId,
  message: string,
  sender: string,
  attachments?: Conversation['attachments']
): Promise<Conversation> => {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      ticket_id: ticketId,
      message,
      sender,
      attachments,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    id: data.id,
    timestamp: new Date(data.timestamp),
  };
}; 