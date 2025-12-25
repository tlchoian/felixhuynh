-- Add new columns to contracts table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Active';

-- Update type options: ensure column can accept new values
-- The type column already exists as text so no change needed

-- Add comment for documentation
COMMENT ON COLUMN public.contracts.status IS 'Contract status: Active, Expired, Cancelled';
COMMENT ON COLUMN public.contracts.start_date IS 'Contract start date';