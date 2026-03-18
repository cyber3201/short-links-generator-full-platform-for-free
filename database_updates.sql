-- Migration: Password Protected Links
-- Execute this entirely in your Supabase SQL Editor

-- 1. Enable pgcrypto for secure hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Update the tracking table
ALTER TABLE public.urls ADD COLUMN IF NOT EXISTS is_password_protected BOOLEAN DEFAULT false;
ALTER TABLE public.urls ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 3. Create the highly secure insertion RPC
-- It hashes the password strictly deep inside the database before saving
CREATE OR REPLACE FUNCTION public.create_short_url_secure(
    p_original_url TEXT,
    p_short_code TEXT,
    p_short_url TEXT,
    p_user_id UUID DEFAULT NULL,
    p_password TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_hash TEXT := NULL;
    v_protected BOOLEAN := false;
    v_result JSONB;
    v_new_id UUID;
BEGIN
    IF p_password IS NOT NULL AND p_password != '' THEN
        v_hash := crypt(p_password, gen_salt('bf'));
        v_protected := true;
    END IF;
    
    INSERT INTO public.urls (original_url, short_code, short_url, user_id, is_password_protected, password_hash)
    VALUES (p_original_url, p_short_code, p_short_url, p_user_id, v_protected, v_hash)
    RETURNING id INTO v_new_id;
    
    v_result := jsonb_build_object(
        'id', v_new_id,
        'short_code', p_short_code,
        'short_url', p_short_url,
        'is_password_protected', v_protected
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Create the secure extraction RPC
-- This prevents the client-side code from ever seeing the original URL unless the hash perfectly matches
CREATE OR REPLACE FUNCTION public.verify_and_get_url(
    p_short_code TEXT,
    p_password TEXT
) RETURNS JSONB AS $$
DECLARE
    v_url RECORD;
BEGIN
    SELECT id, original_url, is_active, is_password_protected, password_hash, clicks, user_id
    INTO v_url
    FROM public.urls
    WHERE short_code = p_short_code;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Link not found.');
    END IF;
    
    IF v_url.is_active = false THEN
        RETURN jsonb_build_object('success', false, 'error', 'This link has been temporarily disabled by its owner.');
    END IF;
    
    -- If it IS protected, verify password
    IF v_url.is_password_protected THEN
        IF p_password IS NULL OR p_password = '' THEN
            RETURN jsonb_build_object('success', false, 'error', 'Password required.');
        END IF;
        
        IF crypt(p_password, v_url.password_hash) = v_url.password_hash THEN
            RETURN jsonb_build_object('success', true, 'url', v_url.original_url, 'id', v_url.id, 'clicks', v_url.clicks, 'user_id', v_url.user_id);
        ELSE
            RETURN jsonb_build_object('success', false, 'error', 'Invalid password.');
        END IF;
    END IF;
    
    -- If it IS NOT protected, return it securely
    RETURN jsonb_build_object('success', true, 'url', v_url.original_url, 'id', v_url.id, 'clicks', v_url.clicks, 'user_id', v_url.user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
