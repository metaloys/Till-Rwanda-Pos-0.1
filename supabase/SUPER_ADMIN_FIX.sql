-- ============================================================================
-- COMPREHENSIVE SUPER ADMIN FIX: View All Data Across All Shops
-- ============================================================================
-- This fixes the bug where super admins can see shops but NOT the data 
-- (sales, products, expenses, etc) because RLS policies filtered by shop_id
-- 
-- STEPS:
-- 1. Go to Supabase SQL Editor
-- 2. Paste this ENTIRE script
-- 3. Click Run
-- 4. Hard refresh browser (Ctrl+F5)
-- 5. Super Admin now sees ALL data from ALL shops!
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop all old data table policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view products from their shop" ON public.products CASCADE;
DROP POLICY IF EXISTS "Super admins view all products, users view their shop's products" ON public.products CASCADE;

DROP POLICY IF EXISTS "Users can view sales from their shop" ON public.sales CASCADE;
DROP POLICY IF EXISTS "Super admins view all sales, users view their shop's sales" ON public.sales CASCADE;

DROP POLICY IF EXISTS "Users can view customers from their shop" ON public.customers CASCADE;
DROP POLICY IF EXISTS "Super admins view all customers, users view their shop's customers" ON public.customers CASCADE;

DROP POLICY IF EXISTS "Users can view expenses from their shop" ON public.expenses CASCADE;
DROP POLICY IF EXISTS "Super admins view all expenses, users view their shop's expenses" ON public.expenses CASCADE;

DROP POLICY IF EXISTS "Users can view product variants from their shop" ON public.product_variants CASCADE;
DROP POLICY IF EXISTS "Super admins view all product variants, users view their shop's variants" ON public.product_variants CASCADE;

DROP POLICY IF EXISTS "Users can view sale items from their shop" ON public.sale_items CASCADE;
DROP POLICY IF EXISTS "Super admins view all sale items, users view their shop's items" ON public.sale_items CASCADE;

DROP POLICY IF EXISTS "Users can view credit payments from their shop" ON public.credit_payments CASCADE;
DROP POLICY IF EXISTS "Super admins view all credit payments, users view their shop's payments" ON public.credit_payments CASCADE;

-- ============================================================================
-- STEP 2: Create NEW FIXED POLICIES for all data tables
-- ============================================================================

-- PRODUCTS
CREATE POLICY "Super admins view all products, users view their shop's products"
ON public.products FOR SELECT
USING (
  (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- SALES
CREATE POLICY "Super admins view all sales, users view their shop's sales"
ON public.sales FOR SELECT
USING (
  (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- CUSTOMERS
CREATE POLICY "Super admins view all customers, users view their shop's customers"
ON public.customers FOR SELECT
USING (
  (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- EXPENSES
CREATE POLICY "Super admins view all expenses, users view their shop's expenses"
ON public.expenses FOR SELECT
USING (
  (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- PRODUCT_VARIANTS (more complex - joins through products)
CREATE POLICY "Super admins view all variants, users view their shop's variants"
ON public.product_variants FOR SELECT
USING (
  (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR product_id IN (
    SELECT id FROM public.products 
    WHERE shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- SALE_ITEMS (more complex - joins through sales)
CREATE POLICY "Super admins view all sale items, users view their shop's items"
ON public.sale_items FOR SELECT
USING (
  (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR sale_id IN (
    SELECT id FROM public.sales 
    WHERE shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- CREDIT_PAYMENTS (more complex - joins through customers)
CREATE POLICY "Super admins view all credit payments, users view their shop's payments"
ON public.credit_payments FOR SELECT
USING (
  (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR customer_id IN (
    SELECT id FROM public.customers 
    WHERE shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- ============================================================================
-- STEP 3: VERIFICATION
-- ============================================================================
-- After running this script, verify:
--
-- 1. Check SELECT policies created:
-- SELECT policyname FROM pg_policies 
-- WHERE tablename IN ('products', 'sales', 'customers', 'expenses', 
--                    'product_variants', 'sale_items', 'credit_payments')
-- AND policyname LIKE 'Super admins%';
-- (Should return 7 new policies)
--
-- 2. Hard refresh browser (Ctrl+F5)
--
-- 3. Login as Super Admin and verify:
-- ✅ Platform Admin Dashboard shows all shops
-- ✅ Revenue Dashboard shows metrics for ALL shops combined
-- ✅ Top 5 shops chart shows data from all shops
-- ✅ 30-day revenue trend shows platform-wide metrics
--
-- ============================================================================
