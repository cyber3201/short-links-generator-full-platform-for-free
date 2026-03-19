-- ========================================
-- Database Update: Add IP Address Tracking
-- Run this in your Supabase SQL Editor
-- ========================================

-- Add ip_address column to clicks table
ALTER TABLE public.clicks ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Ensure RLS policies allow inserting ip_address
-- (The existing insert policy should cover this since it allows all inserts)
