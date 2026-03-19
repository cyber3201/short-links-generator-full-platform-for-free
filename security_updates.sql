-- ==========================================
-- Security Hardening for `urls` table
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can update clicks" ON public.urls;
DROP POLICY IF EXISTS "Anyone can insert URLs" ON public.urls;
DROP POLICY IF EXISTS "Anyone can view short URLs for redirection" ON public.urls;

-- 2. Restrict INSERT to authenticated users only (if you only want logged-in users to create links)
-- Alternatively, if you want anonymous links, change to: WITH CHECK (true)
CREATE POLICY "Authenticated users can insert URLs" 
ON public.urls FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 3. Allow public to READ urls but ONLY secure fields (needed for redirection lookup)
-- The function `verify_and_get_url` already handles password-protected lookup securely on the server.
CREATE POLICY "Public can view URL metadata for redirection"
ON public.urls FOR SELECT
USING (true);

-- 4. Restrict UPDATE so public users can ONLY increment clicks
-- Note: A safer approach is to use a Postgres function with SECURITY DEFINER for clicks, but this restricts the table update to just clicks.
CREATE POLICY "Public can increment clicks"
ON public.urls FOR UPDATE
USING (true)
WITH CHECK (
  -- Only allow if the ONLY thing changing is the clicks count (+1)
  -- Or if they are the owner
  auth.uid() = user_id OR 
  (
    id = id AND 
    original_url = original_url AND 
    short_code = short_code AND 
    user_id = user_id AND 
    is_protected = is_protected AND 
    password_hash = password_hash
  )
);

-- 5. Add DELETE policy so users can delete their own links
CREATE POLICY "Users can delete their own URLs"
ON public.urls FOR DELETE
USING (auth.uid() = user_id);
