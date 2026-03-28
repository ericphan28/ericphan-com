// ============================================================================
// 🗄️ Supabase Database Types — Auto-generated from schema
// Convention: all table names use `freelancer_` prefix
// ============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      freelancer_platforms: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          base_url: string;
          auth_data: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["freelancer_platforms"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["freelancer_platforms"]["Insert"]>;
      };
      freelancer_bids: {
        Row: {
          id: string;
          platform_id: string;
          platform_bid_id: string;
          project_id: string;
          project_title: string;
          project_url: string;
          amount: number;
          currency: string;
          period_days: number;
          description: string;
          status: string;
          project_status: string;
          bid_count: number;
          budget_min: number;
          budget_max: number;
          skills: string[];
          client_name: string | null;
          client_country: string | null;
          submitted_at: string;
          synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["freelancer_bids"]["Row"], "created_at" | "updated_at" | "synced_at">;
        Update: Partial<Database["public"]["Tables"]["freelancer_bids"]["Insert"]>;
      };
      freelancer_messages: {
        Row: {
          id: string;
          platform_id: string;
          thread_id: string;
          project_id: string | null;
          project_title: string | null;
          client_username: string;
          client_name: string | null;
          last_message: string;
          last_message_at: string;
          is_read: boolean;
          message_count: number;
          synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["freelancer_messages"]["Row"], "created_at" | "updated_at" | "synced_at">;
        Update: Partial<Database["public"]["Tables"]["freelancer_messages"]["Insert"]>;
      };
      freelancer_sync_logs: {
        Row: {
          id: string;
          platform_id: string;
          sync_type: string;
          status: string;
          records_synced: number;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["freelancer_sync_logs"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["freelancer_sync_logs"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
