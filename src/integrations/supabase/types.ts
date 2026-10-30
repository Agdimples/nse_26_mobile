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
      buses: {
        Row: {
          id: string
          name: string
          hotel_id: string
          route_label: string
          capacity: number
          marshal_name: string
          marshal_phone: string
          pickup_point: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          hotel_id: string
          route_label: string
          capacity?: number
          marshal_name?: string
          marshal_phone?: string
          pickup_point: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          hotel_id?: string
          route_label?: string
          capacity?: number
          marshal_name?: string
          marshal_phone?: string
          pickup_point?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_template: {
        Row: {
          id: number
          label: string
          direction: string
          time: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          id?: number
          label: string
          direction: string
          time: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          id?: number
          label?: string
          direction?: string
          time?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      transport_config: {
        Row: {
          id: string
          default_policy: string
          policy_descriptions: Json
          updated_at: string
        }
        Insert: {
          id?: string
          default_policy: string
          policy_descriptions?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          default_policy?: string
          policy_descriptions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      accommodations: {
        Row: {
          address: string | null
          amenities: string[] | null
          booking_url: string | null
          created_at: string
          description: string | null
          distance_km: number | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          name: string
          price_range: string | null
          price_tier: number
          rating: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          booking_url?: string | null
          created_at?: string
          description?: string | null
          distance_km?: number | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          price_range?: string | null
          price_tier?: number
          rating?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          booking_url?: string | null
          created_at?: string
          description?: string | null
          distance_km?: number | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          price_range?: string | null
          price_tier?: number
          rating?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          id: string
          posted_by: string | null
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          posted_by?: string | null
          priority?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          posted_by?: string | null
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      buses: {
        Row: {
          capacity: number
          hotel_id: string
          id: string
          marshal_name: string
          marshal_phone: string
          name: string
          pickup_point: string
          route_label: string
          updated_at: string
        }
        Insert: {
          capacity: number
          hotel_id: string
          id?: string
          marshal_name: string
          marshal_phone: string
          name: string
          pickup_point: string
          route_label: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          hotel_id?: string
          id?: string
          marshal_name?: string
          marshal_phone?: string
          name?: string
          pickup_point?: string
          route_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      chatbot_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chatbot_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chatbot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          label: string
          phone: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          phone: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          phone?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      errand_requests: {
        Row: {
          accommodation_id: string | null
          assigned_to: string | null
          category: string
          completed_at: string | null
          created_at: string
          description: string
          id: string
          payment_status: string
          preferred_time: string | null
          room_number: string | null
          status: string
          updated_at: string
          urgency: string
          user_id: string
        }
        Insert: {
          accommodation_id?: string | null
          assigned_to?: string | null
          category: string
          completed_at?: string | null
          created_at?: string
          description: string
          id?: string
          payment_status?: string
          preferred_time?: string | null
          room_number?: string | null
          status?: string
          updated_at?: string
          urgency?: string
          user_id: string
        }
        Update: {
          accommodation_id?: string | null
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          payment_status?: string
          preferred_time?: string | null
          room_number?: string | null
          status?: string
          updated_at?: string
          urgency?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "errand_requests_accommodation_id_fkey"
            columns: ["accommodation_id"]
            isOneToOne: false
            referencedRelation: "accommodations"
            referencedColumns: ["id"]
          },
        ]
      }
      food_order_items: {
        Row: {
          created_at: string
          id: string
          item_name_snapshot: string
          menu_item_id: string | null
          order_id: string
          quantity: number
          unit_price_ngn: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_name_snapshot: string
          menu_item_id?: string | null
          order_id: string
          quantity?: number
          unit_price_ngn?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_name_snapshot?: string
          menu_item_id?: string | null
          order_id?: string
          quantity?: number
          unit_price_ngn?: number
        }
        Relationships: [
          {
            foreignKeyName: "food_order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "food_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      food_orders: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          payment_status: string
          pickup_location: string | null
          status: string
          total_ngn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          payment_status?: string
          pickup_location?: string | null
          status?: string
          total_ngn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          payment_status?: string
          pickup_location?: string | null
          status?: string
          total_ngn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_per_order: number
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_per_order?: number
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_per_order?: number
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          max_per_item: number
          name: string
          price_ngn: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          max_per_item?: number
          name: string
          price_ngn?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          max_per_item?: number
          name?: string
          price_ngn?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      my_agenda: {
        Row: {
          created_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "my_agenda_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string
          display_name: string
          id: string
          interests: string[] | null
          networking_opt_in: boolean
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          display_name?: string
          id: string
          interests?: string[] | null
          networking_opt_in?: boolean
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          display_name?: string
          id?: string
          interests?: string[] | null
          networking_opt_in?: boolean
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      session_speakers: {
        Row: {
          session_id: string
          speaker_id: string
        }
        Insert: {
          session_id: string
          speaker_id: string
        }
        Update: {
          session_id?: string
          speaker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_speakers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_speakers_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          day: number
          description: string | null
          ends_at: string
          id: string
          room: string | null
          session_type: string
          starts_at: string
          title: string
          track: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day?: number
          description?: string | null
          ends_at: string
          id?: string
          room?: string | null
          session_type?: string
          starts_at: string
          title: string
          track?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day?: number
          description?: string | null
          ends_at?: string
          id?: string
          room?: string | null
          session_type?: string
          starts_at?: string
          title?: string
          track?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      schedule_events: {
        Row: {
          category: string | null
          created_at: string
          day: number
          id: string
          location: string
          sort_order: number
          time: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          day: number
          id?: string
          location?: string
          sort_order?: number
          time: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          day?: number
          id?: string
          location?: string
          sort_order?: number
          time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      signup_codes: {
        Row: {
          code: string
          created_at: string
          is_active: boolean
          label: string
          role: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          is_active?: boolean
          label: string
          role: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          is_active?: boolean
          label?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      speakers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string
          id: string
          is_keynote: boolean
          linkedin: string | null
          name: string
          title: string | null
          twitter: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          id?: string
          is_keynote?: boolean
          linkedin?: string | null
          name: string
          title?: string | null
          twitter?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          id?: string
          is_keynote?: boolean
          linkedin?: string | null
          name?: string
          title?: string | null
          twitter?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usher_requests: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          id: string
          location_label: string | null
          note: string | null
          reason: string
          resolved_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          id?: string
          location_label?: string | null
          note?: string | null
          reason: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          id?: string
          location_label?: string | null
          note?: string | null
          reason?: string
          resolved_at?: string | null
          status?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_signup_code: {
        Args: { _code: string }
        Returns: {
          label: string
          role_granted: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "attendee"
        | "super_admin"
        | "front_desk"
        | "kitchen"
        | "program"
        | "logistics"
        | "comms"
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
      app_role: [
        "admin",
        "attendee",
        "super_admin",
        "front_desk",
        "kitchen",
        "program",
        "logistics",
        "comms",
      ],
    },
  },
} as const
