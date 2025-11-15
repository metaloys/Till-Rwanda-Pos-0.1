-- ============================================================================
-- EMERGENCY FIX: Super Admin Cannot See Shops
-- ============================================================================
-- This fixes the bug where super admins see ZERO shops because RLS 
-- was filtering by profile.shop_id which is NULL for super admins
--
-- STEPS:
-- 1. Go to Supabase SQL Editor
-- 2. Paste this ENTIRE script
-- 3. Click Run
-- 4. Hard refresh browser (Ctrl+F5)
-- 5. Super Admin can now see ALL shops!
--
-- ============================================================================

-- Drop old SHOPS policies that were too restrictive for super admins
DROP POLICY IF EXISTS "Users can view their shops" ON public.shops CASCADE;
DROP POLICY IF EXISTS "Super admins can view all shops, users view their own" ON public.shops CASCADE;
DROP POLICY IF EXISTS "Users can update their shops" ON public.shops CASCADE;
DROP POLICY IF EXISTS "Super admins can update all shops, users update their own" ON public.shops CASCADE;

-- CREATE NEW FIXED POLICIES

-- SHOPS: Super admins see ALL shops, regular users see only THEIR shop
CREATE POLICY "Super admins view all shops, users view their own"
ON public.shops FOR SELECT
USING (
  -- Super Admin path: Check is_super_admin = true
  (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR
  -- Regular User path: Only see shops they own
  id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- SHOPS: Super admins can update ALL shops
CREATE POLICY "Super admins can update all shops, users update their own"
ON public.shops FOR UPDATE
USING (
  -- Super Admin path: Can update all
  (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR
  -- Regular User path: Only update their own
  id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this script, verify:
--
-- 1. Check policies exist:
-- SELECT policyname FROM pg_policies WHERE tablename = 'shops';
-- (Should return: 2 policies)
--
-- 2. Hard refresh browser (Ctrl+F5)
--
-- 3. Login as Super Admin and check:
-- - Can see all shops in Platform Admin Dashboard
-- - Can view metrics for all shops
-- - Can onboard new shops
--
-- ============================================================================
