-- Add ip_address column to clicks table
ALTER TABLE public.clicks ADD COLUMN IF NOT EXISTS ip_address TEXT;
