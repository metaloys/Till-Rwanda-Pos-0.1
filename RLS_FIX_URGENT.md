# 🚨 CRITICAL FIX - Run This NOW

## Problem
You're still seeing "infinite recursion detected in policy for relation 'profiles'"

**Why**: Old broken policies are still in Supabase from previous deployment attempts. The `DROP POLICY` approach isn't fully cleaning them.

## Solution: Use Clean Slate Script (Takes 30 seconds)

### Step 1: Open Supabase SQL Editor
Go to **supabase.com** → Your Project → **SQL Editor** → **New Query**

### Step 2: Copy the Clean Slate Script
Open this file: `supabase/rls_policies_clean_slate.sql`
- Select all (Ctrl+A)
- Copy (Ctrl+C)

### Step 3: Paste and Run
1. Paste into Supabase SQL Editor (Ctrl+V)
2. Click **Run**
3. Wait for: `Command executed successfully`

### Step 4: Hard Refresh Browser
1. In your app, press **Ctrl+Shift+Delete** (or **Ctrl+F5**)
2. This clears cache and reloads
3. Check console (F12)
4. Should see: **NO "infinite recursion" errors** ✅

---

## What This Script Does

```sql
-- 1. DISABLE RLS on all tables (wipes ALL old policies)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- ...all other tables

-- 2. ENABLE RLS on all tables (fresh start)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ...all other tables

-- 3. CREATE fresh clean policies (no recursion)
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);
-- ...all other policies
```

**Key difference**: 
- Old approach: DROP each policy individually → Sometimes leaves broken state
- New approach: Disable RLS (removes everything) → Re-enable → Create fresh

---

## Verify Success

After running script, run this in Supabase SQL Editor:

```sql
SELECT COUNT(*) as total_policies FROM pg_policies WHERE schemaname = 'public';
```

**Should show**: `32` policies (if not, something went wrong)

---

## Expected Result

✅ Service Worker registered successfully  
✅ No "infinite recursion" errors in console  
✅ App loads without errors  
✅ Can login and see your data  
✅ RLS enforces multi-tenant isolation at database level  

---

## If Still Getting Errors

Run these verification queries in Supabase:

```sql
-- Check RLS is actually enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' ORDER BY tablename;
-- All should show: true

-- View all active policies
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' ORDER BY tablename;
-- Should show ~32 policies
```

---

## Files

- ✅ `supabase/rls_policies_clean_slate.sql` - **USE THIS ONE** (fixes recursion)
- ⚠️ `supabase/rls_policies.sql` - Old version (causes recursion with old data)

---

**Status**: 🔴 NEEDS IMMEDIATE ACTION

Run `rls_policies_clean_slate.sql` in Supabase NOW to fix the infinite recursion error.
