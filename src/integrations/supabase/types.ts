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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      locations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      references: {
        Row: {
          author: string | null
          category: string
          created_at: string
          display_order: number
          id: string
          note: string | null
          title: string
          url: string | null
          visible: boolean
          year: string | null
        }
        Insert: {
          author?: string | null
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          note?: string | null
          title: string
          url?: string | null
          visible?: boolean
          year?: string | null
        }
        Update: {
          author?: string | null
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          note?: string | null
          title?: string
          url?: string | null
          visible?: boolean
          year?: string | null
        }
        Relationships: []
      }
      response_analysis: {
        Row: {
          created_at: string
          created_by: string
          id: string
          response_id: string
          theme_key: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          response_id: string
          theme_key: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          response_id?: string
          theme_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_analysis_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "public_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_analysis_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_analysis_theme_key_fkey"
            columns: ["theme_key"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["key"]
          },
        ]
      }
      responses: {
        Row: {
          acted_through_art: string | null
          art_is: string | null
          consent: boolean
          created_at: string
          exhibition_id: string | null
          hidden: boolean
          id: string
          language: string | null
          location_id: string | null
          session_id: string | null
        }
        Insert: {
          acted_through_art?: string | null
          art_is?: string | null
          consent: boolean
          created_at?: string
          exhibition_id?: string | null
          hidden?: boolean
          id?: string
          language?: string | null
          location_id?: string | null
          session_id?: string | null
        }
        Update: {
          acted_through_art?: string | null
          art_is?: string | null
          consent?: boolean
          created_at?: string
          exhibition_id?: string | null
          hidden?: boolean
          id?: string
          language?: string | null
          location_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          key: string
          keywords: string[]
          label_de: string
          label_en: string
          sort_order: number
        }
        Insert: {
          key: string
          keywords?: string[]
          label_de: string
          label_en: string
          sort_order?: number
        }
        Update: {
          key?: string
          keywords?: string[]
          label_de?: string
          label_en?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      public_response_themes: {
        Row: {
          response_id: string | null
          theme_key: string | null
        }
        Relationships: [
          {
            foreignKeyName: "response_analysis_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "public_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_analysis_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_analysis_theme_key_fkey"
            columns: ["theme_key"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["key"]
          },
        ]
      }
      public_responses: {
        Row: {
          acted_through_art: string | null
          art_is: string | null
          created_at: string | null
          exhibition_id: string | null
          id: string | null
          language: string | null
        }
        Insert: {
          acted_through_art?: string | null
          art_is?: string | null
          created_at?: string | null
          exhibition_id?: string | null
          id?: string | null
          language?: string | null
        }
        Update: {
          acted_through_art?: string | null
          art_is?: string | null
          created_at?: string | null
          exhibition_id?: string | null
          id?: string | null
          language?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
