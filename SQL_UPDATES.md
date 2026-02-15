# SQL Updates Required

Run the following SQL in your Supabase SQL Editor to fix the RLS policies and create the default admin user:

```sql
-- Update RLS policies to allow development testing
DROP POLICY IF EXISTS "Admins can create shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can view their shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can view shipments they are involved in" ON public.shipments;
DROP POLICY IF EXISTS "Admins can update their shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can delete their shipments" ON public.shipments;
DROP POLICY IF EXISTS "Checkpoints are viewable through shipments" ON public.checkpoints;

-- Create new permissive policies for development
CREATE POLICY "Allow shipment creation" ON public.shipments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow shipment viewing" ON public.shipments
  FOR SELECT USING (true);

CREATE POLICY "Allow shipment updates" ON public.shipments
  FOR UPDATE USING (true);

CREATE POLICY "Allow shipment deletion" ON public.shipments
  FOR DELETE USING (true);

CREATE POLICY "Allow checkpoint viewing" ON public.checkpoints
  FOR SELECT USING (true);

CREATE POLICY "Allow checkpoint creation" ON public.checkpoints
  FOR INSERT WITH CHECK (true);

-- Insert default admin user
INSERT INTO public.users (id, email, user_type, full_name)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin@global-go.local', 'admin', 'Default Admin')
ON CONFLICT (email) DO NOTHING;

-- Add images column if missing
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::text[];
```

## What This Does

1. **Removes restrictive RLS policies** - These were requiring authentication that wasn't set up
2. **Creates permissive policies** - Allows all CRUD operations for development (⚠️ NOT FOR PRODUCTION)
3. **Creates default admin user** - Allows shipments to reference this admin in the database

## Production Note
Replace these permissive policies with proper auth-based policies before deploying to production.
