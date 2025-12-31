-- Add entity and resolution_notes columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS entity text DEFAULT 'Cá nhân',
ADD COLUMN IF NOT EXISTS resolution_notes text;

-- Create an index on entity for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_entity ON public.tasks(entity);