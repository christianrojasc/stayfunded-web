# StayFunded — Supabase Setup Guide

## Step 1: Create Project

1. Go to **https://database.new**
2. Sign in or create a Supabase account
3. Create a new project:
   - **Name:** `stayfunded`
   - **Database Password:** (save this somewhere safe)
   - **Region:** Choose closest to you (e.g. `us-east-1`)
4. Wait ~2 minutes for project to finish provisioning

## Step 2: Run Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste and click **Run**
5. You should see "Success. No rows returned." for each statement

## Step 3: Get Your Keys

1. Go to **Settings → API** in your Supabase dashboard
2. Copy:
   - **Project URL** (looks like `https://xyzabcdef.supabase.co`)
   - **anon / public key** (the long `eyJ...` string under "Project API keys")

## Step 4: Configure Both Projects

Replace the placeholders in `.env.local` for both projects:

**`/Users/christian/stayfunded-web/.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_ACTUAL_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ACTUAL_ANON_KEY
```

**`/Users/christian/stayfunded-landing/.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_ACTUAL_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ACTUAL_ANON_KEY
```

After saving, restart both dev servers.

## Step 5: Configure Auth Settings

In Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3005` (change to production URL later)
- **Redirect URLs:** Add `http://localhost:3005/**`

Under **Authentication → Providers → Email:**
- Make sure **Email provider** is enabled
- Optionally disable "Confirm email" for faster testing (under Auth settings)

## Step 6: Test Auth

1. Visit `http://localhost:3005/login`
2. Click "Sign Up"
3. Enter email + password
4. You should be redirected to the dashboard

## Architecture

```
stayfunded-landing (port 3000)
  /login → Sign In page → redirects to localhost:3005
  /signup → Sign Up page → redirects to localhost:3005

stayfunded-web (port 3005)
  /login → App login (also has sign up toggle)
  /* → Protected routes (redirect to /login if no session)
```

Both apps share the same Supabase project / users table.

## Files Created

| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Database schema to run in SQL Editor |
| `lib/supabase.ts` | Supabase client (both projects) |
| `lib/supabase-storage.ts` | Async data layer (mirrors storage.ts) |
| `components/AuthContext.tsx` | React auth context + useAuth() hook |
| `components/AppShell.tsx` | Conditional sidebar (hides on /login) |
| `app/login/page.tsx` | Login/signup form |
| `app/login/layout.tsx` | Fullscreen layout (no sidebar) |
| `middleware.ts` | Server-side route protection |
| `.env.local` | Supabase key template |
