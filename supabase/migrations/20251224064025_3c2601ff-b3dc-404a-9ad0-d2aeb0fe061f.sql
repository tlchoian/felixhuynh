-- Add uplink_device_id column to network_devices table
ALTER TABLE public.network_devices
ADD COLUMN uplink_device_id UUID REFERENCES public.network_devices(id) ON DELETE SET NULL;