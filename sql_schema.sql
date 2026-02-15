CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT auth.uid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'sender', 'receiver')),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user for development
INSERT INTO public.users (id, email, user_type, full_name)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin@global-go.local', 'admin', 'Default Admin')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.users(id),
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_email TEXT,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  receiver_email TEXT,
  pickup_location TEXT,
  delivery_address TEXT NOT NULL,
  warehouse TEXT,
  transportation TEXT NOT NULL,
  package_name TEXT,
  images TEXT[] DEFAULT '{}',
  cost NUMERIC(10, 2),
  paid BOOLEAN DEFAULT FALSE,
  vehicles_count INT,
  vehicle_type TEXT,
  driver_name TEXT,
  driver_experience TEXT,
  driver_image_url TEXT,
  route_screenshot_url TEXT,
  countdown_duration INT,
  countdown_start_time TIMESTAMP WITH TIME ZONE,
  paused BOOLEAN DEFAULT FALSE,
  pause_timestamp TIMESTAMP WITH TIME ZONE,
  stopped BOOLEAN DEFAULT FALSE,
  stop_reason TEXT,
  current_checkpoint_index INT DEFAULT 0,
  status TEXT DEFAULT 'in_transit' CHECK (status IN ('in_transit', 'paused', 'stopped', 'delivered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  checkpoint_order INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'current', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow anyone (including service role and anon) to insert shipments for development
CREATE POLICY "Allow shipment creation" ON public.shipments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view their shipments" ON public.shipments
  FOR SELECT USING (true);

CREATE POLICY "Users can view shipments they are involved in" ON public.shipments
  FOR SELECT USING (
    sender_email = (SELECT email FROM public.users WHERE id = auth.uid() LIMIT 1)
    OR receiver_email = (SELECT email FROM public.users WHERE id = auth.uid())
    OR auth.uid() = admin_id
  );

CREATE POLICY "Admins can update their shipments" ON public.shipments
  FOR UPDATE USING (true);

CREATE POLICY "Admins can delete their shipments" ON public.shipments
  FOR DELETE USING (true);

CREATE POLICY "Checkpoints are viewable through shipments" ON public.checkpoints
  FOR SELECT USING (true);

CREATE POLICY "Allow checkpoint creation" ON public.checkpoints
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_shipments_admin_id ON public.shipments(admin_id);
CREATE INDEX IF NOT EXISTS idx_shipments_sender_email ON public.shipments(sender_email);
CREATE INDEX IF NOT EXISTS idx_shipments_receiver_email ON public.shipments(receiver_email);
CREATE INDEX IF NOT EXISTS idx_checkpoints_shipment_id ON public.checkpoints(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(created_at);

-- Migration: ensure policies are present and images column exists
-- (This block is safe to run multiple times; it drops conflicting policies first)
DROP POLICY IF EXISTS "Allow shipment creation" ON public.shipments;
DROP POLICY IF EXISTS "Allow shipment viewing" ON public.shipments;
DROP POLICY IF EXISTS "Allow shipment updates" ON public.shipments;
DROP POLICY IF EXISTS "Allow shipment deletion" ON public.shipments;
DROP POLICY IF EXISTS "Allow checkpoint viewing" ON public.checkpoints;
DROP POLICY IF EXISTS "Allow checkpoint creation" ON public.checkpoints;

CREATE POLICY IF NOT EXISTS "Allow shipment creation" ON public.shipments
  FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow shipment viewing" ON public.shipments
  FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow shipment updates" ON public.shipments
  FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Allow shipment deletion" ON public.shipments
  FOR DELETE USING (true);
CREATE POLICY IF NOT EXISTS "Allow checkpoint viewing" ON public.checkpoints
  FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow checkpoint creation" ON public.checkpoints
  FOR INSERT WITH CHECK (true);

-- Ensure images column exists (stored as text array of publicly accessible URLs)
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Ensure default admin user exists
INSERT INTO public.users (id, email, user_type, full_name)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin@global-go.local', 'admin', 'Default Admin')
ON CONFLICT (email) DO NOTHING;
