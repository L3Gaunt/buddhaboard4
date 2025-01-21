import { TicketPriority, TicketStatus, AgentRole, AgentStatus } from '../types';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: number;
          title: string;
          description: string;
          priority: TicketPriority;
          status: TicketStatus;
          number: string;
          created_at: string;
          assigned_to: string | null;
          last_updated: string;
          metadata: Json | null;
        };
        Insert: Omit<Database['public']['Tables']['tickets']['Row'], 'id' | 'created_at' | 'last_updated'>;
        Update: Partial<Omit<Database['public']['Tables']['tickets']['Row'], 'id'>>;
      };
      conversations: {
        Row: {
          id: string;
          ticket_id: number;
          sender: string;
          message: string;
          timestamp: string;
          attachments: {
            url: string;
            name: string;
            type: string;
            size: number;
          }[] | null;
          metadata: Json | null;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'timestamp'>;
        Update: Partial<Omit<Database['public']['Tables']['conversations']['Row'], 'id'>>;
      };
      agents: {
        Row: {
          id: string;
          name: string;
          role: AgentRole;
          status: AgentStatus;
          avatar: string;
          email: string;
          metadata: {
            department?: string;
            skills?: string[];
            languages?: string[];
            [key: string]: unknown;
          } | null;
        };
        Insert: Omit<Database['public']['Tables']['agents']['Row'], 'id'>;
        Update: Partial<Omit<Database['public']['Tables']['agents']['Row'], 'id'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      ticket_priority: TicketPriority;
      ticket_status: TicketStatus;
      agent_role: AgentRole;
      agent_status: AgentStatus;
    };
  };
} 