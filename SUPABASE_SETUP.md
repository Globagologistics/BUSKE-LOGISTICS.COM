# Supabase Backend Setup Guide

## Completed Setup

✅ **Environment Variables** (`.env.local`)
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

✅ **Supabase Client** (`src/lib/supabase.ts`)
- Configured to use your project credentials

✅ **TypeScript Types** (`src/types/database.ts`)
- User, Shipment, Checkpoint, and ShipmentWithCheckpoints types

✅ **Custom Hooks** (`src/hooks/useSupabase.ts`)
- useAdminShipments() - Fetch admin's shipments with real-time updates
- useShipmentWithCheckpoints() - Fetch shipment with its checkpoints
- useUserShipments() - Fetch shipments for sender/receiver
- createShipment() - Create new shipment
- updateShipment() - Update shipment data
- uploadImage() - Upload images to storage

---

## Next Steps: Run SQL Schema

### 1. Open Supabase SQL Editor
1. Go to https://supabase.com → Dashboard
2. Select your project: **buske**
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

### 2. Copy & Paste SQL Schema
1. Open the file: `sql_schema.sql` in this project
2. Copy ALL the SQL code
3. Paste into Supabase SQL Editor
4. Click **Run** (or Ctrl+Enter)

### 3. Verify All Tables Created
After running the SQL, you should see in **Table Editor**:
- `users` table
- `shipments` table
- `checkpoints` table
- Storage buckets: `shipment-images`, `driver-images`, `route-screenshots`

---

## Install Dependencies

Run this command to install Supabase client:

```bash
npm install @supabase/supabase-js
```

---

## Features Built In

### Real-time Updates
The hooks automatically subscribe to real-time changes, so when:
- An admin creates a shipment → all viewers see it instantly
- An admin pauses/resumes → progress bar updates live
- Countdown timer changes → users see real-time progress

### Row-Level Security (RLS)
- Admins can only see/edit their own shipments
- Users can only see shipments they're involved in
- Public users can view shipments by tracking ID

### Image Storage
Three separate storage buckets:
- `shipment-images` - Package photos
- `driver-images` - Driver photos
- `route-screenshots` - Google Maps screenshots

---

## Integration Points Ready

After running the SQL schema, we can integrate with:

1. **AdminForm.tsx** - connect form submission to `createShipment()`
2. **AdminDashboard** - use `useAdminShipments()` hook
3. **AdminDetail.tsx** - use `useShipmentWithCheckpoints()` hook
4. **TrackShipment.tsx** - fetch by tracking ID with real-time updates
5. **Authentication** - connect sign-up/sign-in to Supabase Auth

---

## Credentials Reference

**Project URL:** https://cadrfolvgzwutfwgefug.supabase.co
**Publishable Key:** sb_publishable_HWRwplY9aoz2A-zRh35J5w_o-4Z8fSr
**Service Role Key:** (kept in .env.local)

---

## Troubleshooting

If you get errors when running SQL:
1. Check table names are lowercase
2. Make sure you're running the entire script, not just partial lines
3. Check for any PostgreSQL syntax errors in the console

Once SQL is confirmed working, reply and we'll integrate the hooks into your React components!
