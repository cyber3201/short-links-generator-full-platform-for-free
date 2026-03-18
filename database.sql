-- Create tables for the URL Shortener
-- We assume Supabase Auth is being used, so we reference auth.users

-- 1. URL Table
CREATE TABLE public.urls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable for anonymous links, or required if login needed
    original_url TEXT NOT NULL,
    short_code TEXT NOT NULL UNIQUE,
    short_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    clicks INTEGER DEFAULT 0,
    top_location TEXT DEFAULT 'Unknown', -- Could be expanded into a separate clicks tracking table
    is_active BOOLEAN DEFAULT true
);

-- Index for fast lookup by short code
CREATE INDEX idx_urls_short_code ON public.urls(short_code);
CREATE INDEX idx_urls_user_id ON public.urls(user_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.urls ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own URLs (or anonymous URLs if we don't have auth)
CREATE POLICY "Users can view their own URLs" 
ON public.urls FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Anyone can insert URLs (even anonymous users)
CREATE POLICY "Anyone can insert URLs" 
ON public.urls FOR INSERT 
WITH CHECK (true);

-- Policy: Anyone can increment clicks/read url for redirection (or we do it via a postgres function/backend)
CREATE POLICY "Anyone can view short URLs for redirection"
ON public.urls FOR SELECT
USING (true);

-- Policy: Anyone can update clicks (might want to restrict to service role in a real app)
CREATE POLICY "Anyone can update clicks"
ON public.urls FOR UPDATE
USING (true);

-- 2. Optional: Click Tracking Table (for advanced analytics)
CREATE TABLE public.clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url_id UUID REFERENCES public.urls(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    country TEXT,
    city TEXT,
    referrer TEXT,
    user_agent TEXT
);

CREATE INDEX idx_clicks_url_id ON public.clicks(url_id);

ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view clicks of their URLs"
ON public.clicks FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.urls
        WHERE urls.id = clicks.url_id AND urls.user_id = auth.uid()
    )
);

CREATE POLICY "Anyone can insert clicks"
ON public.clicks FOR INSERT
WITH CHECK (true);

-- 3. Storage Setup (For User Profile Avatars)
-- You must run this command to create the storage bucket for image uploads!
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Storage Policy: Anyone can view avatars
CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Storage Policy: Authenticated users can upload avatars
CREATE POLICY "Anyone can upload an avatar."
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- 4. User Profiles Table (To store name, profession, and signup logs)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nom TEXT,
    prenom TEXT,
    profession TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Function to handle new user signups and automatically insert profile data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nom, prenom, profession)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nom',
    NEW.raw_user_meta_data->>'prenom',
    NEW.raw_user_meta_data->>'profession'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function securely anytime a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
