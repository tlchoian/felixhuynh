-- Add allowed_modules column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN allowed_modules text[] DEFAULT ARRAY['wiki', 'tasks']::text[];

-- Update existing admin users to have all modules
UPDATE public.profiles p
SET allowed_modules = ARRAY['credentials', 'contracts', 'network', 'tasks', 'wiki']::text[]
FROM public.user_roles ur
WHERE p.id = ur.user_id AND ur.role = 'admin';

-- Update the handle_new_user function to set default modules
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, allowed_modules)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    ARRAY['wiki', 'tasks']::text[]
  );
  RETURN NEW;
END;
$function$;