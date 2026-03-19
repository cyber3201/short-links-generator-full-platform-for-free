-- ==========================================
-- Profile & Storage Updates
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create Storage Bucket for Avatars (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for Avatars
-- Drop existing policies if any to avoid errors
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars." ON storage.objects;

-- Allow public viewing
CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload new avatars
CREATE POLICY "Anyone can upload an avatar."
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Allow authenticated users to update (overwrite) their own avatars
CREATE POLICY "Users can update their own avatars."
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatars."
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');


-- 3. Update Profiles Table
-- Instead of nom/prenom, we will use full_name
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Drop old columns if they exist and are no longer needed
-- (Optional: uncomment if you don't need the old data)
-- ALTER TABLE public.profiles DROP COLUMN nom;
-- ALTER TABLE public.profiles DROP COLUMN prenom;

-- 4. Update the handle_new_user Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, profession)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'profession'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Create secure Account Deletion Function
-- This allows a user to delete their own account from auth.users (which cascades to public tables)
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
BEGIN
  -- Re-verify that the user is the one making the request
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from auth.users (requires SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
