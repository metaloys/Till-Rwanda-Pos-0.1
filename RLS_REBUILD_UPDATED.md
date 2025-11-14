# 🔧 RLS Policy Rebuild - Updated Approach

## Problem You Hit
```
ERROR: 42710: policy "Users can view own profile" for table "profiles" already exists
```

**Why**: The DISABLE/ENABLE approach didn't fully remove existing policies.

## Solution: Use Updated Clean Slate Script

I've updated `supabase/rls_policies_clean_slate.sql` with explicit DROP statements.

### Step 1: Copy Updated File
Open: `supabase/rls_policies_clean_slate.sql` (just updated)
- Select all (Ctrl+A)
- Copy (Ctrl+C)

### Step 2: Run in Supabase
1. Go to **supabase.com** → Your Project → **SQL Editor** → **New Query**
2. Paste (Ctrl+V)
3. Click **Run**
4. Wait for: `Command executed successfully` ✅

### Step 3: Verify & Refresh
1. Run verification query:
```sql
SELECT COUNT(*) as total_policies FROM pg_policies WHERE schemaname = 'public';
```
Should return: `32`

2. Hard refresh browser: **Ctrl+F5**
3. Check console (F12): Should see **NO infinite recursion errors**

---

## What Changed in Updated Script

**Before** (didn't work):
```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Old policies still exist!
```

**Now** (works correctly):
```sql
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles CASCADE;
-- ... all policies explicitly dropped
-- Then policies are recreated fresh
```

**Key difference**: 
- Explicitly drops each policy (guaranteed removal)
- Uses CASCADE to handle any dependencies
- No "already exists" errors

---

## Expected Success Signs

✅ `Command executed successfully` in Supabase  
✅ No "already exists" error  
✅ Verification query returns 32 policies  
✅ Browser console shows NO "infinite recursion" errors  
✅ Can login without 500 errors  
✅ Service Worker registered successfully  

---

## If Still Getting Errors

Run this in Supabase SQL Editor:

```sql
-- See what policies exist
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' ORDER BY tablename;

-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' ORDER BY tablename;
```

Then share the output - we can troubleshoot from there.

---

## Files

- ✅ `supabase/rls_policies_clean_slate.sql` - **UPDATED VERSION - USE THIS**
- ⚠️ `supabase/rls_policies.sql` - Older version (keep for reference)

---

**Next Action**: Run the updated `rls_policies_clean_slate.sql` in Supabase SQL Editor.

Let me know when you've done it! 🚀
