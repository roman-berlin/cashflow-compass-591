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
      ammo_state: {
        Row: {
          created_at: string
          id: string
          tranche_1_used: boolean
          tranche_2_used: boolean
          tranche_3_used: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tranche_1_used?: boolean
          tranche_2_used?: boolean
          tranche_3_used?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tranche_1_used?: boolean
          tranche_2_used?: boolean
          tranche_3_used?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      auth_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          token_type: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          token_type: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          token_type?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contributions: {
        Row: {
          amount: number
          contribution_type: string
          created_at: string
          currency: string
          id: string
          snapshot_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          contribution_type: string
          created_at?: string
          currency?: string
          id?: string
          snapshot_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          contribution_type?: string
          created_at?: string
          currency?: string
          id?: string
          snapshot_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: true
            referencedRelation: "portfolio_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      market_state: {
        Row: {
          as_of_date: string
          created_at: string
          drawdown_percent: number | null
          high_52w: number
          id: string
          last_price: number
          ticker: string
          user_id: string
        }
        Insert: {
          as_of_date: string
          created_at?: string
          drawdown_percent?: number | null
          high_52w: number
          id?: string
          last_price: number
          ticker?: string
          user_id: string
        }
        Update: {
          as_of_date?: string
          created_at?: string
          drawdown_percent?: number | null
          high_52w?: number
          id?: string
          last_price?: number
          ticker?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_snapshots: {
        Row: {
          cash_percent: number | null
          cash_value: number
          cost_basis_cash: number
          cost_basis_sp: number
          cost_basis_ta: number
          created_at: string
          id: string
          percent_sp: number | null
          percent_ta: number | null
          snapshot_month: string
          stocks_percent: number | null
          stocks_value: number
          total_value: number | null
          user_id: string
          value_sp: number
          value_ta: number
        }
        Insert: {
          cash_percent?: number | null
          cash_value: number
          cost_basis_cash?: number
          cost_basis_sp?: number
          cost_basis_ta?: number
          created_at?: string
          id?: string
          percent_sp?: number | null
          percent_ta?: number | null
          snapshot_month: string
          stocks_percent?: number | null
          stocks_value: number
          total_value?: number | null
          user_id: string
          value_sp?: number
          value_ta?: number
        }
        Update: {
          cash_percent?: number | null
          cash_value?: number
          cost_basis_cash?: number
          cost_basis_sp?: number
          cost_basis_ta?: number
          created_at?: string
          id?: string
          percent_sp?: number | null
          percent_ta?: number | null
          snapshot_month?: string
          stocks_percent?: number | null
          stocks_value?: number
          total_value?: number | null
          user_id?: string
          value_sp?: number
          value_ta?: number
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          attempt_count: number
          created_at: string
          id: string
          identifier: string
          window_start: string
        }
        Insert: {
          action: string
          attempt_count?: number
          created_at?: string
          id?: string
          identifier: string
          window_start?: string
        }
        Update: {
          action?: string
          attempt_count?: number
          created_at?: string
          id?: string
          identifier?: string
          window_start?: string
        }
        Relationships: []
      }
      recommendations_log: {
        Row: {
          created_at: string
          drawdown_percent: number | null
          id: string
          market_status: string | null
          recommendation_text: string
          recommendation_type: string
          snapshot_id: string | null
          transfer_amount: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          drawdown_percent?: number | null
          id?: string
          market_status?: string | null
          recommendation_text: string
          recommendation_type: string
          snapshot_id?: string | null
          transfer_amount?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          drawdown_percent?: number | null
          id?: string
          market_status?: string | null
          recommendation_text?: string
          recommendation_type?: string
          snapshot_id?: string | null
          transfer_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_log_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "portfolio_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          ammo_tranche_count: number
          cash_max_pct: number
          cash_min_pct: number
          cash_target_percent: number
          contribution_split_cash_percent: number
          contribution_split_stocks_percent: number
          created_at: string
          currency: string
          id: string
          monthly_contribution_total: number
          rebuild_threshold: number
          snp_target_percent: number | null
          stocks_target_percent: number
          stop_cash_threshold: number
          ta125_target_percent: number | null
          tranche_1_trigger: number
          tranche_2_trigger: number
          tranche_3_trigger: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ammo_tranche_count?: number
          cash_max_pct?: number
          cash_min_pct?: number
          cash_target_percent?: number
          contribution_split_cash_percent?: number
          contribution_split_stocks_percent?: number
          created_at?: string
          currency?: string
          id?: string
          monthly_contribution_total?: number
          rebuild_threshold?: number
          snp_target_percent?: number | null
          stocks_target_percent?: number
          stop_cash_threshold?: number
          ta125_target_percent?: number | null
          tranche_1_trigger?: number
          tranche_2_trigger?: number
          tranche_3_trigger?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ammo_tranche_count?: number
          cash_max_pct?: number
          cash_min_pct?: number
          cash_target_percent?: number
          contribution_split_cash_percent?: number
          contribution_split_stocks_percent?: number
          created_at?: string
          currency?: string
          id?: string
          monthly_contribution_total?: number
          rebuild_threshold?: number
          snp_target_percent?: number | null
          stocks_target_percent?: number
          stop_cash_threshold?: number
          ta125_target_percent?: number | null
          tranche_1_trigger?: number
          tranche_2_trigger?: number
          tranche_3_trigger?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_owner: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "admin" | "user"
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
      app_role: ["owner", "admin", "user"],
    },
  },
} as const
