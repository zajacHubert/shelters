export type Urgency = 'pilne' | 'potrzebne' | 'mile_widziane';

export type Database = {
  public: {
    Tables: {
      shelters: {
        Row: {
          id: string;
          name: string;
          city: string;
          email: string;
          password_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city: string;
          email: string;
          password_hash: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['shelters']['Insert']>;
        Relationships: [];
      };
      needs: {
        Row: {
          id: number;
          shelter_id: string;
          name: string;
          urgency: Urgency;
          quantity: number;
          allegro_link: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          shelter_id: string;
          name: string;
          urgency: Urgency;
          quantity: number;
          allegro_link?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['needs']['Insert']>;
        Relationships: [];
      };
    };
    Enums: {
      urgency_level: Urgency;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
