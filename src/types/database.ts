export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; timezone: string; created_at: string }
        Insert: { id: string; display_name?: string | null; timezone?: string; created_at?: string }
        Update: { display_name?: string | null; timezone?: string }
        Relationships: []
      }
      families: {
        Row: { id: string; name: string; owner_user_id: string; created_at: string }
        Insert: { id?: string; name: string; owner_user_id: string; created_at?: string }
        Update: { name?: string; owner_user_id?: string }
        Relationships: []
      }
      family_memberships: {
        Row: { id: string; family_id: string; user_id: string; role: 'owner' | 'member' | 'viewer'; joined_at: string }
        Insert: { id?: string; family_id: string; user_id: string; role: 'owner' | 'member' | 'viewer'; joined_at?: string }
        Update: { role?: 'owner' | 'member' | 'viewer' }
        Relationships: []
      }
      pets: {
        Row: {
          id: string; family_id: string; created_by: string; creation_request_id: string; name: string
          species: 'cat' | 'dog'; breed: string | null; sex: 'female' | 'male' | 'unknown' | null
          birth_date: string | null; birth_date_approximate: boolean; photo_path: string | null; created_at: string; updated_at: string
        }
        Insert: Record<string, never>
        Update: { photo_path?: string | null; name?: string; breed?: string | null; sex?: 'female' | 'male' | 'unknown' | null }
        Relationships: []
      }
      weight_records: {
        Row: { id: string; pet_id: string; value_kg: number; measured_at: string; created_by: string; created_at: string }
        Insert: { id?: string; pet_id: string; value_kg: number; measured_at?: string; created_by: string; created_at?: string }
        Update: { value_kg?: number; measured_at?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_pet_with_weight: {
        Args: {
          p_request_id: string
          p_name: string
          p_species: 'cat' | 'dog'
          p_breed: string | null
          p_sex: 'female' | 'male' | 'unknown' | null
          p_birth_date: string | null
          p_birth_date_approximate: boolean
          p_weight_kg: number | null
        }
        Returns: { pet_id: string; family_id: string }[]
      }
    }
    Enums: {
      membership_role: 'owner' | 'member' | 'viewer'
      pet_species: 'cat' | 'dog'
      pet_sex: 'female' | 'male' | 'unknown'
    }
    CompositeTypes: Record<string, never>
  }
}
