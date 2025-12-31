-- Add module_permissions column to store granular access levels
-- Format: {"module_name": "none" | "read" | "write"}
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS module_permissions JSONB DEFAULT '{"wiki": "write", "tasks": "write"}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.module_permissions IS 'Granular module permissions: none (no access), read (view only), write (full access)';