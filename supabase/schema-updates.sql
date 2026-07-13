-- Run this in Supabase SQL Editor AFTER the initial schema.sql

-- 1. Check-in time of day (morning/midday/evening)
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS time_of_day text DEFAULT 'morning';

-- 2. Goals notes field
ALTER TABLE goals ADD COLUMN IF NOT EXISTS notes text;

-- 3. Village audio messages
ALTER TABLE village_messages ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';
ALTER TABLE village_messages ADD COLUMN IF NOT EXISTS audio_url text;

-- 4. Village moderators
ALTER TABLE village_memberships ADD COLUMN IF NOT EXISTS is_moderator boolean DEFAULT false;

-- 5. Moderators can update other members' rows in their rooms
CREATE POLICY IF NOT EXISTS "Moderators can assign moderators" ON village_memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM village_memberships mod_check
      WHERE mod_check.room_id = village_memberships.room_id
        AND mod_check.user_id = auth.uid()
        AND mod_check.is_moderator = true
    )
  );

-- 6. Supabase Storage bucket for voice messages (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('village-audio', 'village-audio', true, 10485760, ARRAY['audio/webm', 'audio/mp4', 'audio/ogg'])
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload audio
CREATE POLICY IF NOT EXISTS "Auth users can upload audio" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'village-audio' AND auth.role() = 'authenticated');

-- Allow public read of audio files
CREATE POLICY IF NOT EXISTS "Public can read audio" ON storage.objects
  FOR SELECT USING (bucket_id = 'village-audio');
