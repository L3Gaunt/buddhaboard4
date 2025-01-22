export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          name: string
          role: 'admin' | 'agent' | 'supervisor'
          status: 'online' | 'offline' | 'busy' | 'away'
          avatar: string | null
          email: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          role?: 'admin' | 'agent' | 'supervisor'
          status?: 'online' | 'offline' | 'busy' | 'away'
          avatar?: string | null
          email: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'admin' | 'agent' | 'supervisor'
          status?: 'online' | 'offline' | 'busy' | 'away'
          avatar?: string | null
          email?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
          avatar: string | null
          phone: string | null
          company: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string
          avatar?: string | null
          phone?: string | null
          company?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
          avatar?: string | null
          phone?: string | null
          company?: string | null
          metadata?: Json | null
        }
      }
      tickets: {
        Row: {
          id: number
          number: string
          title: string
          description: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          created_at: string
          last_updated: string
          assigned_to: string | null
          customer_id: string
          conversation: Json[]
          metadata: Json | null
        }
        Insert: {
          id?: number
          number?: string
          title: string
          description: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          created_at?: string
          last_updated?: string
          assigned_to?: string | null
          customer_id: string
          conversation?: Json[]
          metadata?: Json | null
        }
        Update: {
          id?: number
          number?: string
          title?: string
          description?: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          created_at?: string
          last_updated?: string
          assigned_to?: string | null
          customer_id?: string
          conversation?: Json[]
          metadata?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      agent_role: 'admin' | 'agent' | 'supervisor'
      agent_status: 'online' | 'offline' | 'busy' | 'away'
    }
  }
} 