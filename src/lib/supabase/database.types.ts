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
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string | null;
          email_address: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address?: string | null;
          email_address?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          address?: string | null;
          email_address?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      floors: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          level: number;
          building_width: number | null;
          building_depth: number | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          level?: number;
          building_width?: number | null;
          building_depth?: number | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          level?: number;
          building_width?: number | null;
          building_depth?: number | null;
          image_url?: string | null;
          created_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          floor_id: string;
          name: string;
          type: string;
          width: number;
          depth: number;
          area: number;
          floor_area: number;
          wall_area: number;
          ceiling_area: number;
          position_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          floor_id: string;
          name: string;
          type?: string;
          width: number;
          depth: number;
          area: number;
          floor_area: number;
          wall_area: number;
          ceiling_area: number;
          position_json?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          floor_id?: string;
          name?: string;
          type?: string;
          width?: number;
          depth?: number;
          area?: number;
          floor_area?: number;
          wall_area?: number;
          ceiling_area?: number;
          position_json?: Json;
          created_at?: string;
        };
      };
      room_work_items: {
        Row: {
          id: string;
          room_id: string;
          work_type: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          work_type: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          work_type?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      work_catalog: {
        Row: {
          id: string;
          type: string;
          label: string;
          unit: string;
          description: string | null;
          applicable_room_types: string[];
          default_unit_price: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          label: string;
          unit?: string;
          description?: string | null;
          applicable_room_types?: string[];
          default_unit_price?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          label?: string;
          unit?: string;
          description?: string | null;
          applicable_room_types?: string[];
          default_unit_price?: number | null;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          project_id: string;
          direction: string;
          from_address: string;
          to_address: string;
          subject: string | null;
          body_text: string | null;
          body_html: string | null;
          thread_id: string | null;
          provider_message_id: string | null;
          status: string;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          direction?: string;
          from_address: string;
          to_address: string;
          subject?: string | null;
          body_text?: string | null;
          body_html?: string | null;
          thread_id?: string | null;
          provider_message_id?: string | null;
          status?: string;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          direction?: string;
          from_address?: string;
          to_address?: string;
          subject?: string | null;
          body_text?: string | null;
          body_html?: string | null;
          thread_id?: string | null;
          provider_message_id?: string | null;
          status?: string;
          sent_at?: string | null;
          created_at?: string;
        };
      };
      message_attachments: {
        Row: {
          id: string;
          message_id: string;
          filename: string;
          content_type: string | null;
          size_bytes: number | null;
          storage_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          filename: string;
          content_type?: string | null;
          size_bytes?: number | null;
          storage_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          filename?: string;
          content_type?: string | null;
          size_bytes?: number | null;
          storage_path?: string | null;
          created_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_hash: string;
          prefix: string;
          scopes: string[];
          created_at: string;
          last_used_at: string | null;
          revoked_at: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          key_hash: string;
          prefix: string;
          scopes?: string[];
          created_at?: string;
          last_used_at?: string | null;
          revoked_at?: string | null;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          key_hash?: string;
          prefix?: string;
          scopes?: string[];
          created_at?: string;
          last_used_at?: string | null;
          revoked_at?: string | null;
          expires_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_project_owner: {
        Args: { project_uuid: string };
        Returns: boolean;
      };
      set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      touch_api_key: {
        Args: { key_hash_input: string };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
