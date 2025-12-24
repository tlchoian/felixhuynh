-- Create locations table
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policies - locations should be readable by all authenticated users
CREATE POLICY "Authenticated users can view locations"
ON public.locations
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can manage locations
CREATE POLICY "Admins can manage locations"
ON public.locations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed data for the 4 Mvillage locations
INSERT INTO public.locations (name, address, description) VALUES
  ('Mvillage Silk', NULL, 'Chi nhánh Mvillage Silk'),
  ('Mvillage 88 VNG', NULL, 'Chi nhánh Mvillage 88 Võ Nguyên Giáp'),
  ('Mvillage 117 Trần Phú', NULL, 'Chi nhánh Mvillage 117 Trần Phú'),
  ('Mvillage 17 Lý Thường Kiệt', NULL, 'Chi nhánh Mvillage 17 Lý Thường Kiệt');

-- Add location_id column to network_devices
ALTER TABLE public.network_devices
ADD COLUMN location_id UUID REFERENCES public.locations(id);

-- Migrate existing location text to location_id
UPDATE public.network_devices nd
SET location_id = l.id
FROM public.locations l
WHERE LOWER(nd.location) = LOWER(l.name)
   OR nd.location ILIKE '%' || l.name || '%'
   OR l.name ILIKE '%' || nd.location || '%';