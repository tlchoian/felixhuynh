
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create credentials table
CREATE TABLE public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  url TEXT,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Cloud',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credentials"
  ON public.credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials"
  ON public.credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials"
  ON public.credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials"
  ON public.credentials FOR DELETE
  USING (auth.uid() = user_id);

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Domain',
  provider TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'Yearly',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contracts"
  ON public.contracts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contracts"
  ON public.contracts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contracts"
  ON public.contracts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contracts"
  ON public.contracts FOR DELETE
  USING (auth.uid() = user_id);

-- Create network_devices table
CREATE TABLE public.network_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Workstation',
  mac_address TEXT,
  location TEXT NOT NULL,
  vlan_id INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Online',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.network_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own network devices"
  ON public.network_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own network devices"
  ON public.network_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network devices"
  ON public.network_devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network devices"
  ON public.network_devices FOR DELETE
  USING (auth.uid() = user_id);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium',
  requester TEXT NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'todo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create wiki_docs table
CREATE TABLE public.wiki_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wiki_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wiki docs"
  ON public.wiki_docs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wiki docs"
  ON public.wiki_docs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wiki docs"
  ON public.wiki_docs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wiki docs"
  ON public.wiki_docs FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at
  BEFORE UPDATE ON public.credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_devices_updated_at
  BEFORE UPDATE ON public.network_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wiki_docs_updated_at
  BEFORE UPDATE ON public.wiki_docs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
