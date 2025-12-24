-- Add logo_url column to app_settings table
ALTER TABLE public.app_settings ADD COLUMN logo_url text DEFAULT NULL;