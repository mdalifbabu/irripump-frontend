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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      farmer_code_history: {
        Row: {
          farmer_id: string
          id: string
          new_code: string
          old_code: string
          reason: string | null
          shifted_at: string | null
        }
        Insert: {
          farmer_id: string
          id?: string
          new_code: string
          old_code: string
          reason?: string | null
          shifted_at?: string | null
        }
        Update: {
          farmer_id?: string
          id?: string
          new_code?: string
          old_code?: string
          reason?: string | null
          shifted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farmer_code_history_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      farmers: {
        Row: {
          code_valid_until: string
          created_at: string | null
          created_by: string | null
          email: string | null
          farmer_code: string
          father_name: string | null
          id: string
          mobile: string
          name_bengali: string
          name_english: string | null
          nid_number: string | null
          photo_url: string | null
          pump_id: string
          registration_date: string | null
          updated_at: string | null
          village: string | null
          whatsapp: string | null
        }
        Insert: {
          code_valid_until: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          farmer_code: string
          father_name?: string | null
          id?: string
          mobile: string
          name_bengali: string
          name_english?: string | null
          nid_number?: string | null
          photo_url?: string | null
          pump_id: string
          registration_date?: string | null
          updated_at?: string | null
          village?: string | null
          whatsapp?: string | null
        }
        Update: {
          code_valid_until?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          farmer_code?: string
          father_name?: string | null
          id?: string
          mobile?: string
          name_bengali?: string
          name_english?: string | null
          nid_number?: string | null
          photo_url?: string | null
          pump_id?: string
          registration_date?: string | null
          updated_at?: string | null
          village?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farmers_pump_id_fkey"
            columns: ["pump_id"]
            isOneToOne: false
            referencedRelation: "pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      lands: {
        Row: {
          coordinates: Json | null
          created_at: string | null
          created_by: string | null
          farmer_id: string
          id: string
          land_identification_number: string | null
          landmark_number: string | null
          pump_id: string
          season: string | null
          size_bigha: number
          size_shatak: number | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          coordinates?: Json | null
          created_at?: string | null
          created_by?: string | null
          farmer_id: string
          id?: string
          land_identification_number?: string | null
          landmark_number?: string | null
          pump_id: string
          season?: string | null
          size_bigha: number
          size_shatak?: number | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          coordinates?: Json | null
          created_at?: string | null
          created_by?: string | null
          farmer_id?: string
          id?: string
          land_identification_number?: string | null
          landmark_number?: string | null
          pump_id?: string
          season?: string | null
          size_bigha?: number
          size_shatak?: number | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lands_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lands_pump_id_fkey"
            columns: ["pump_id"]
            isOneToOne: false
            referencedRelation: "pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_adjustments: {
        Row: {
          adjusted_by: string | null
          adjustment_type: string | null
          amount: number
          created_at: string | null
          farmer_id: string
          id: string
          pump_id: string
          reason: string
          season: string | null
          year: number | null
        }
        Insert: {
          adjusted_by?: string | null
          adjustment_type?: string | null
          amount: number
          created_at?: string | null
          farmer_id: string
          id?: string
          pump_id: string
          reason: string
          season?: string | null
          year?: number | null
        }
        Update: {
          adjusted_by?: string | null
          adjustment_type?: string | null
          amount?: number
          created_at?: string | null
          farmer_id?: string
          id?: string
          pump_id?: string
          reason?: string
          season?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_adjustments_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_adjustments_pump_id_fkey"
            columns: ["pump_id"]
            isOneToOne: false
            referencedRelation: "pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          farmer_id: string
          id: string
          payment_date: string
          payment_method: string | null
          pump_id: string
          recorded_by: string | null
          remarks: string | null
          season: string | null
          transaction_reference: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          farmer_id: string
          id?: string
          payment_date: string
          payment_method?: string | null
          pump_id: string
          recorded_by?: string | null
          remarks?: string | null
          season?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          farmer_id?: string
          id?: string
          payment_date?: string
          payment_method?: string | null
          pump_id?: string
          recorded_by?: string | null
          remarks?: string | null
          season?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_pump_id_fkey"
            columns: ["pump_id"]
            isOneToOne: false
            referencedRelation: "pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          mobile: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          mobile?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          mobile?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pumps: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          installation_date: string | null
          location: string | null
          pump_name_bengali: string
          pump_name_english: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          installation_date?: string | null
          location?: string | null
          pump_name_bengali: string
          pump_name_english: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          installation_date?: string | null
          location?: string | null
          pump_name_bengali?: string
          pump_name_english?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      unit_prices: {
        Row: {
          created_at: string | null
          created_by: string | null
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean | null
          price_per_bigha: number
          pump_id: string
          season: string
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          effective_from: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          price_per_bigha: number
          pump_id: string
          season: string
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          price_per_bigha?: number
          pump_id?: string
          season?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "unit_prices_pump_id_fkey"
            columns: ["pump_id"]
            isOneToOne: false
            referencedRelation: "pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pump_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          is_active: boolean | null
          pump_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          pump_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          pump_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pump_assignments_pump_id_fkey"
            columns: ["pump_id"]
            isOneToOne: false
            referencedRelation: "pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "farmer"
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
      app_role: ["admin", "user", "farmer"],
    },
  },
} as const
