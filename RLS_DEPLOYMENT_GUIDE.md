# 🔒 Deploying RLS Policies - Quick Guide

## ✅ Fixed Issue
The RLS policies file had references to a `staff` table that doesn't exist in your schema. This has been removed in commit `ed6b1ff`.

---

## 📋 How to Deploy (Step by Step)

### Step 1: Open Supabase SQL Editor
1. Go to **https://app.supabase.com**
2. Select your **Till Rwanda** project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Copy the RLS Policies
1. In VS Code, open `supabase/rls_policies.sql`
2. **Select All** (Ctrl+A)
3. **Copy** (Ctrl+C)

### Step 3: Paste into Supabase
1. In the Supabase SQL Editor, paste the entire content
2. You should see the SQL script with all the policies

### Step 4: Execute
1. Click **Run** button (or Ctrl+Enter)
2. Wait for completion (should take 5-10 seconds)

---

## ✅ Verification Steps

After deployment, verify the policies are working:

### In Supabase Dashboard:

1. **Check RLS is Enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   ORDER BY tablename;
   ```
   - Should show all tables with `rowsecurity = true`

2. **View All Policies Created:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'public' 
   ORDER BY tablename, policyname;
   ```
   - Should show ~30+ policies across all tables

3. **Check Profile Policies Specifically:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename = 'profiles';
   ```

---

## 🧪 Test RLS is Working

### As a Regular User:
```sql
-- Should only see their own profile
SELECT * FROM public.profiles;

-- Should only see their own shop's products
SELECT * FROM public.products;
```

### As a Super Admin:
```sql
-- Should see ALL profiles
SELECT * FROM public.profiles;

-- Should see ALL products from ALL shops
SELECT * FROM public.products;
```

---

## 🔍 What the Policies Do

| Table | Policy | Effect |
|-------|--------|--------|
| `profiles` | Users see own profile | Can't view other users |
| `shops` | Users see their shops | Multi-tenant isolation |
| `products` | Filter by shop_id | Only see own shop's products |
| `product_variants` | Filter by product's shop | Can't see other shops' variants |
| `sales` | Filter by shop_id | Isolation per shop |
| `sale_items` | Filter by sale's shop | Related data isolation |
| `customers` | Filter by shop_id | Per-shop customer data |
| `credit_payments` | Filter by customer's shop | Credit isolation |
| `expenses` | Filter by shop_id | Expense isolation |

**Super Admin Override**: All policies include `OR is_super_admin = true` to allow super admins to see everything.

---

## ❌ Troubleshooting

### Error: "relation does not exist"
- This has been fixed in the latest version
- Use the corrected `supabase/rls_policies.sql` from commit `ed6b1ff`

### Error: "Policy already exists"
- Run this to drop existing policies:
  ```sql
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  -- etc for each policy
  ```
- Then run the full script again

### Error: "User does not have permission"
- Make sure you're signed in as a database admin
- Check your Supabase permissions

### Policies created but not working
- Verify: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- All should show `rowsecurity = t` (true)

---

## ✨ Security Benefits After Deployment

After RLS is deployed:
- ✅ **Multi-tenant isolation at database level** - Not just app logic
- ✅ **No cross-shop data leaks** - Even if app has bugs
- ✅ **Super admin bypass** - Platform owner can see everything
- ✅ **Defense in depth** - Database layer security + app layer security

---

## 📞 Need Help?

If deployment fails:
1. Check the error message carefully
2. Verify all tables exist: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`
3. If a table is missing, comment out that table's policies
4. Run one section at a time to isolate the issue

**All RLS policies are now ready to deploy!** 🚀
