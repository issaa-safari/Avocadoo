// Generated from the live Supabase project (yuakvjrcbielrcknfnrt) via
// mcp__Supabase__generate_typescript_types. Regenerate after schema changes
// rather than hand-editing.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      farmers: {
        Row: {
          created_at: string
          farm_id: string | null
          farmer_id: string
          name: string
          org_id: string
          phone: string | null
          supplier_id: string
        }
        Insert: {
          created_at?: string
          farm_id?: string | null
          farmer_id?: string
          name: string
          org_id: string
          phone?: string | null
          supplier_id: string
        }
        Update: {
          created_at?: string
          farm_id?: string | null
          farmer_id?: string
          name?: string
          org_id?: string
          phone?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farmers_org_id_farm_id_fkey"
            columns: ["org_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["org_id", "farm_id"]
          },
          {
            foreignKeyName: "farmers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "farmers_org_id_supplier_id_fkey"
            columns: ["org_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["org_id", "supplier_id"]
          },
        ]
      }
      farms: {
        Row: {
          block_label: string | null
          created_at: string
          farm_id: string
          geolocation: Json | null
          name: string
          org_id: string
          region_id: string
        }
        Insert: {
          block_label?: string | null
          created_at?: string
          farm_id?: string
          geolocation?: Json | null
          name: string
          org_id: string
          region_id: string
        }
        Update: {
          block_label?: string | null
          created_at?: string
          farm_id?: string
          geolocation?: Json | null
          name?: string
          org_id?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farms_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "farms_org_id_region_id_fkey"
            columns: ["org_id", "region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["org_id", "region_id"]
          },
        ]
      }
      intake_batches: {
        Row: {
          arrival_datetime: string
          bin_count: number | null
          created_at: string
          created_by: string | null
          driver_name: string | null
          farm_id: string
          farmer_id: string
          field_temp_c: number | null
          gross_weight_kg: number
          harvest_date: string | null
          intake_id: string
          org_id: string
          supplier_id: string
          transport_plate: string | null
          variety: string | null
        }
        Insert: {
          arrival_datetime?: string
          bin_count?: number | null
          created_at?: string
          created_by?: string | null
          driver_name?: string | null
          farm_id: string
          farmer_id: string
          field_temp_c?: number | null
          gross_weight_kg: number
          harvest_date?: string | null
          intake_id?: string
          org_id: string
          supplier_id: string
          transport_plate?: string | null
          variety?: string | null
        }
        Update: {
          arrival_datetime?: string
          bin_count?: number | null
          created_at?: string
          created_by?: string | null
          driver_name?: string | null
          farm_id?: string
          farmer_id?: string
          field_temp_c?: number | null
          gross_weight_kg?: number
          harvest_date?: string | null
          intake_id?: string
          org_id?: string
          supplier_id?: string
          transport_plate?: string | null
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_batches_org_id_farm_id_fkey"
            columns: ["org_id", "farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["org_id", "farm_id"]
          },
          {
            foreignKeyName: "intake_batches_org_id_farmer_id_fkey"
            columns: ["org_id", "farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["org_id", "farmer_id"]
          },
          {
            foreignKeyName: "intake_batches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "intake_batches_org_id_supplier_id_fkey"
            columns: ["org_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["org_id", "supplier_id"]
          },
        ]
      }
      org_settings: {
        Row: {
          cold_room_list: Json | null
          commodity_types_enabled: string[]
          created_at: string
          custom_size_grades_json: Json | null
          loss_tolerance_overrides: Json | null
          org_id: string
          pack_table_list: Json | null
          packing_units_enabled: string[]
          updated_at: string
        }
        Insert: {
          cold_room_list?: Json | null
          commodity_types_enabled?: string[]
          created_at?: string
          custom_size_grades_json?: Json | null
          loss_tolerance_overrides?: Json | null
          org_id: string
          pack_table_list?: Json | null
          packing_units_enabled?: string[]
          updated_at?: string
        }
        Update: {
          cold_room_list?: Json | null
          commodity_types_enabled?: string[]
          created_at?: string
          custom_size_grades_json?: Json | null
          loss_tolerance_overrides?: Json | null
          org_id?: string
          pack_table_list?: Json | null
          packing_units_enabled?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      org_users: {
        Row: {
          created_at: string
          email: string
          org_id: string
          permissions_override_json: Json | null
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          org_id: string
          permissions_override_json?: Json | null
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          org_id?: string
          permissions_override_json?: Json | null
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_email: string | null
          brand_primary_color: string | null
          brand_secondary_color: string | null
          company_name: string
          created_at: string
          data_region: string | null
          default_currency: string
          default_timezone: string
          logo_url: string | null
          org_id: string
          subdomain: string
          subscription_status: string
        }
        Insert: {
          billing_email?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          company_name: string
          created_at?: string
          data_region?: string | null
          default_currency?: string
          default_timezone?: string
          logo_url?: string | null
          org_id?: string
          subdomain: string
          subscription_status?: string
        }
        Update: {
          billing_email?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          company_name?: string
          created_at?: string
          data_region?: string | null
          default_currency?: string
          default_timezone?: string
          logo_url?: string | null
          org_id?: string
          subdomain?: string
          subscription_status?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          created_at: string
          name: string
          org_id: string
          region_id: string
        }
        Insert: {
          created_at?: string
          name: string
          org_id: string
          region_id?: string
        }
        Update: {
          created_at?: string
          name?: string
          org_id?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          ip_address: unknown
          log_id: string
          org_id: string
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          ip_address?: unknown
          log_id?: string
          org_id: string
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          ip_address?: unknown
          log_id?: string
          org_id?: string
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      stage_photos: {
        Row: {
          caption: string | null
          geotag: Json | null
          org_id: string
          photo_id: string
          photo_url: string
          reference_id: string
          reference_type: string
          taken_by: string | null
          taken_datetime: string
        }
        Insert: {
          caption?: string | null
          geotag?: Json | null
          org_id: string
          photo_id?: string
          photo_url: string
          reference_id: string
          reference_type: string
          taken_by?: string | null
          taken_datetime?: string
        }
        Update: {
          caption?: string | null
          geotag?: Json | null
          org_id?: string
          photo_id?: string
          photo_url?: string
          reference_id?: string
          reference_type?: string
          taken_by?: string | null
          taken_datetime?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_photos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          name: string
          org_id: string
          supplier_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          name: string
          org_id: string
          supplier_id?: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          name?: string
          org_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_org_and_admin: {
        Args: { p_company_name?: string }
        Returns: string
      }
      current_auth_aal: { Args: never; Returns: string }
      current_org_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["org_role"]
      }
      log_security_event: {
        Args: {
          p_action: string
          p_ip_address?: unknown
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      org_role:
        | "admin"
        | "supervisor"
        | "receiving_clerk"
        | "qc_inspector"
        | "palletizer"
        | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      org_role: [
        "admin",
        "supervisor",
        "receiving_clerk",
        "qc_inspector",
        "palletizer",
        "viewer",
      ],
    },
  },
} as const
