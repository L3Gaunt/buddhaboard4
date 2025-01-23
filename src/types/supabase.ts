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
          avatar: string | null
          created_at: string
          email: string
          id: string
          metadata: Json | null
          name: string
          role: Database["public"]["Enums"]["agent_role"]
          status: Database["public"]["Enums"]["agent_status"]
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id: string
          metadata?: Json | null
          name: string
          role?: Database["public"]["Enums"]["agent_role"]
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          name?: string
          role?: Database["public"]["Enums"]["agent_role"]
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          assigned_to: string | null
          conversation: Json[]
          created_at: string
          customer_id: string
          last_updated: string
          metadata: Json | null
          number: number
          priority: string
          status: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          conversation?: Json[]
          created_at?: string
          customer_id: string
          last_updated?: string
          metadata?: Json | null
          number?: number
          priority: string
          status: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          conversation?: Json[]
          created_at?: string
          customer_id?: string
          last_updated?: string
          metadata?: Json | null
          number?: number
          priority?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          metadata: Json | null
          name: string
          phone: string | null
        }
        Insert: {
          avatar?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          name: string
          phone?: string | null
        }
        Update: {
          avatar?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      kb_articles: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          content: string
          status: 'draft' | 'published' | 'archived'
          view_count: number
          helpful_count: number
          not_helpful_count: number
          author_id: string | null
          last_updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          content: string
          status?: 'draft' | 'published' | 'archived'
          view_count?: number
          helpful_count?: number
          not_helpful_count?: number
          author_id?: string | null
          last_updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          content?: string
          status?: 'draft' | 'published' | 'archived'
          view_count?: number
          helpful_count?: number
          not_helpful_count?: number
          author_id?: string | null
          last_updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_articles_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_articles_last_updated_by_fkey"
            columns: ["last_updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      kb_tags: {
        Row: {
          id: string
          name: string
          slug: string
          color: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          color?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          color?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      kb_article_tags: {
        Row: {
          article_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          article_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          article_id?: string
          tag_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_article_tags_article_id_fkey"
            columns: ["article_id"]
            referencedRelation: "kb_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_article_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "kb_tags"
            referencedColumns: ["id"]
          }
        ]
      }
      kb_article_feedback: {
        Row: {
          id: string
          article_id: string
          user_id: string | null
          is_helpful: boolean
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          article_id: string
          user_id?: string | null
          is_helpful: boolean
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          article_id?: string
          user_id?: string | null
          is_helpful?: boolean
          comment?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_article_feedback_article_id_fkey"
            columns: ["article_id"]
            referencedRelation: "kb_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_article_feedback_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      kb_article_stats: {
        Row: {
          id: string
          title: string
          status: 'draft' | 'published' | 'archived'
          view_count: number
          helpful_count: number
          not_helpful_count: number
          tag_count: number
          related_articles_count: number
          feedback_count: number
          created_at: string
          updated_at: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_articles_id_fkey"
            columns: ["id"]
            referencedRelation: "kb_articles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      get_ticket_by_hash: {
        Args: { hash: string }
        Returns: {
          number: number
          title: string
          priority: string
          status: string
          created_at: string
          last_updated: string
          assigned_to: string | null
          customer_id: string
          conversation: Json[]
          metadata: Json | null
        }
      }
      validate_conversation_format: {
        Args: { conversation: Json[] }
        Returns: boolean
      }
      increment_article_view: {
        Args: {
          article_id: string
        }
        Returns: void
      }
    }
    Enums: {
      agent_role: "admin" | "agent" | "supervisor"
      agent_status: "online" | "offline" | "busy" | "away"
      article_status: 'draft' | 'published' | 'archived'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
