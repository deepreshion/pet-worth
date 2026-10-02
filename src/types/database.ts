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
        Update: Record<string, never>
        Relationships: []
      }
      weight_records: {
        Row: { id: string; pet_id: string; value_kg: number; measured_at: string; created_by: string; created_at: string }
        Insert: { id?: string; pet_id: string; value_kg: number; measured_at?: string; created_by: string; created_at?: string }
        Update: { value_kg?: number; measured_at?: string }
        Relationships: []
      }
      medical_events: {
        Row: { id: string; pet_id: string; created_by: string; creation_request_id: string; type: 'vaccination' | 'vet_visit' | 'analysis' | 'procedure'; title: string; notes: string | null; event_date: string; event_time: string | null; event_timezone: string; created_at: string; updated_at: string }
        Insert: Record<string, never>
        Update: Record<string, never>
        Relationships: []
      }
      medical_attachments: {
        Row: { id: string; event_id: string; created_by: string; storage_path: string; file_name: string; media_type: string; size_bytes: number; created_at: string }
        Insert: Record<string, never>
        Update: Record<string, never>
        Relationships: []
      }
      reminders: {
        Row: { id: string; event_id: string; created_by: string; scheduled_at: string; notification_id: number; created_at: string; updated_at: string }
        Insert: Record<string, never>
        Update: Record<string, never>
        Relationships: []
      }
      activity_logs: {
        Row: { id: number; family_id: string; actor_user_id: string; action: 'medical_event_created' | 'medical_event_updated' | 'medical_event_deleted' | 'medical_attachment_added' | 'medical_attachment_removed'; entity_type: 'medical_event' | 'medical_attachment'; entity_id: string; metadata: Json; created_at: string }
        Insert: Record<string, never>
        Update: Record<string, never>
        Relationships: []
      }
      storage_cleanup_outbox: {
        Row: { id: string; family_id: string; created_by: string; bucket_id: string; object_path: string; created_at: string }
        Insert: Record<string, never>
        Update: Record<string, never>
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
      update_pet_with_weight: {
        Args: {
          p_pet_id: string
          p_name: string
          p_species: 'cat' | 'dog'
          p_breed: string | null
          p_sex: 'female' | 'male' | 'unknown' | null
          p_birth_date: string | null
          p_birth_date_approximate: boolean
          p_weight_kg: number | null
        }
        Returns: string
      }
      replace_pet_photo_path: {
        Args: { p_pet_id: string; p_new_photo_path: string }
        Returns: string | null
      }
      save_medical_event: {
        Args: { p_event_id: string; p_pet_id: string; p_request_id: string; p_type: 'vaccination' | 'vet_visit' | 'analysis' | 'procedure'; p_title: string; p_notes: string; p_event_date: string; p_event_time: string | null; p_event_timezone: string; p_reminder_enabled: boolean; p_notification_id: number | null; p_new_attachments: Json; p_retained_attachment_ids: string[] }
        Returns: { event_id: string; removed_storage_paths: string[]; reminder_notification_id: number | null; reminder_scheduled_at: string | null }[]
      }
      delete_medical_event: {
        Args: { p_event_id: string }
        Returns: { removed_storage_paths: string[]; reminder_notification_id: number | null }[]
      }
      ack_storage_cleanup: { Args: { p_outbox_id: string }; Returns: boolean }
    }
    Enums: {
      membership_role: 'owner' | 'member' | 'viewer'
      pet_species: 'cat' | 'dog'
      pet_sex: 'female' | 'male' | 'unknown'
      medical_event_type: 'vaccination' | 'vet_visit' | 'analysis' | 'procedure'
    }
    CompositeTypes: Record<string, never>
  }
}
