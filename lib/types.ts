export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      check_ins: { Row: CheckIn; Insert: Partial<CheckIn>; Update: Partial<CheckIn> }
      goals: { Row: Goal; Insert: Partial<Goal>; Update: Partial<Goal> }
      village_rooms: { Row: VillageRoom; Insert: Partial<VillageRoom>; Update: Partial<VillageRoom> }
      village_memberships: { Row: VillageMembership; Insert: Partial<VillageMembership>; Update: Partial<VillageMembership> }
      village_messages: { Row: VillageMessage; Insert: Partial<VillageMessage>; Update: Partial<VillageMessage> }
      friday_reflections: { Row: FridayReflection; Insert: Partial<FridayReflection>; Update: Partial<FridayReflection> }
      coach_conversations: { Row: CoachConversation; Insert: Partial<CoachConversation>; Update: Partial<CoachConversation> }
      coach_messages: { Row: SavedCoachMessage; Insert: Partial<SavedCoachMessage>; Update: Partial<SavedCoachMessage> }
      legal_consents: { Row: LegalConsent; Insert: Partial<LegalConsent>; Update: never }
    }
    Views: Record<string, never>
    Functions: {
      record_legal_consent: { Args: Record<PropertyKey, never>; Returns: undefined }
    }
    Enums: Record<string, never>
  }
}

export interface LegalConsent {
  id: number
  user_id: string
  terms_version: string
  privacy_version: string
  accepted_at: string
}

export interface Profile {
  id: string
  name: string | null
  role: string | null
  company: string | null
  avatar_url: string | null
  streak_count: number
  last_checkin_date: string | null
  onboarded: boolean
  created_at: string
}

export type MoodType = 'tense' | 'meh' | 'steady' | 'grounded' | 'thriving'
export type GoalCategory = 'Career' | 'Wellness' | 'Reflection' | 'Personal'
export type TimeOfDay = 'morning' | 'midday' | 'evening'

export interface CheckIn {
  id: string
  user_id: string
  mood: MoodType
  mood_score: number
  energy: number
  emotion_tags: string[]
  journal_text: string | null
  time_of_day: TimeOfDay | null
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  category: GoalCategory
  notes: string | null
  progress: number
  deadline: string | null
  week_of: string | null
  is_complete: boolean
  created_at: string
}

export interface VillageRoom {
  id: string
  name: string
  description: string | null
  is_featured: boolean
  created_at: string
}

export interface VillageMembership {
  user_id: string
  room_id: string
  joined_at: string
  is_moderator: boolean
}

export interface VillageMessage {
  id: string
  room_id: string
  user_id: string
  content: string
  message_type: 'text' | 'audio' | 'video'
  audio_url: string | null
  created_at: string
  profiles?: { name: string | null }
}

export interface FridayReflection {
  id: string
  user_id: string
  content: string | null
  wins: string[]
  week_of: string | null
  created_at: string
}

export interface CoachMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface CoachConversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface SavedCoachMessage extends CoachMessage {
  id: number
  conversation_id: string
  user_id: string
  created_at: string
}
