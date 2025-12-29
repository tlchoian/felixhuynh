-- Create VLAN schemas table
CREATE TABLE public.vlan_schemas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vlan_id integer NOT NULL UNIQUE,
  name text NOT NULL,
  subnet text NOT NULL,
  gateway text NOT NULL,
  range_start text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vlan_schemas ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view VLAN schemas (read-only reference data)
CREATE POLICY "Authenticated users can view VLAN schemas"
ON public.vlan_schemas
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can manage VLAN schemas
CREATE POLICY "Admins can manage VLAN schemas"
ON public.vlan_schemas
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_vlan_schemas_updated_at
BEFORE UPDATE ON public.vlan_schemas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the VLAN data
INSERT INTO public.vlan_schemas (vlan_id, name, subnet, gateway, range_start) VALUES
(10, 'MGMT', '192.168.10.0/24', '192.168.10.1', '192.168.10.2'),
(20, 'WIFI-GUEST', '172.16.0.0/21', '172.16.0.1', '172.16.0.10'),
(30, 'CAMERA', '192.168.30.0/24', '192.168.30.1', '192.168.30.2'),
(40, 'IPTV-360', '10.10.40.0/23', '10.10.40.1', '10.10.40.10');