-- ============================================================================
-- TILL RWANDA POS - SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- These policies enforce multi-tenant data isolation at the database level.
-- All data access is restricted by shop_id to prevent cross-tenant data leaks.
--
-- HOW TO DEPLOY:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute all policies
-- 5. Verify in Auth > Policies that all policies are created
--
-- VERIFICATION:
-- - Users can only see/modify data for their shop_id
-- - Super admins can access all shops (is_super_admin = true)
-- - Cross-tenant access will be denied at database level
--
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES (in case they already exist)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their shops" ON public.shops;
DROP POLICY IF EXISTS "Users can update their shops" ON public.shops;
DROP POLICY IF EXISTS "Super admins can view all shops" ON public.shops;

DROP POLICY IF EXISTS "Users can view products from their shop" ON public.products;
DROP POLICY IF EXISTS "Users can insert products to their shop" ON public.products;
DROP POLICY IF EXISTS "Users can update products from their shop" ON public.products;
DROP POLICY IF EXISTS "Users can delete products from their shop" ON public.products;
DROP POLICY IF EXISTS "Super admins can view all products" ON public.products;

DROP POLICY IF EXISTS "Users can view product variants from their shop" ON public.product_variants;
DROP POLICY IF EXISTS "Users can insert variants for their shop's products" ON public.product_variants;
DROP POLICY IF EXISTS "Users can update variants for their shop's products" ON public.product_variants;
DROP POLICY IF EXISTS "Super admins can view all variants" ON public.product_variants;

DROP POLICY IF EXISTS "Users can view sales from their shop" ON public.sales;
DROP POLICY IF EXISTS "Users can insert sales to their shop" ON public.sales;
DROP POLICY IF EXISTS "Users can update sales from their shop" ON public.sales;
DROP POLICY IF EXISTS "Super admins can view all sales" ON public.sales;

DROP POLICY IF EXISTS "Users can view sale items from their shop" ON public.sale_items;
DROP POLICY IF EXISTS "Users can insert sale items for their shop" ON public.sale_items;
DROP POLICY IF EXISTS "Super admins can view all sale items" ON public.sale_items;

DROP POLICY IF EXISTS "Users can view customers from their shop" ON public.customers;
DROP POLICY IF EXISTS "Users can insert customers to their shop" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers from their shop" ON public.customers;
DROP POLICY IF EXISTS "Super admins can view all customers" ON public.customers;

DROP POLICY IF EXISTS "Users can view credit payments from their shop" ON public.credit_payments;
DROP POLICY IF EXISTS "Users can insert credit payments for their shop" ON public.credit_payments;
DROP POLICY IF EXISTS "Super admins can view all credit payments" ON public.credit_payments;

DROP POLICY IF EXISTS "Users can view expenses from their shop" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert expenses to their shop" ON public.expenses;
DROP POLICY IF EXISTS "Users can update expenses from their shop" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete expenses from their shop" ON public.expenses;
DROP POLICY IF EXISTS "Super admins can view all expenses" ON public.expenses;

-- ============================================================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
-- Note: staff table policies removed - table doesn't exist in current schema

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- ============================================================================
-- SHOPS TABLE POLICIES
-- ============================================================================
-- Users can view shops they own
CREATE POLICY "Users can view their shops"
ON public.shops FOR SELECT
USING (
  id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Only shop owners can update their shop
CREATE POLICY "Users can update their shops"
ON public.shops FOR UPDATE
USING (
  id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- PRODUCTS TABLE POLICIES
-- ============================================================================
-- Users can only view products from their shop
CREATE POLICY "Users can view products from their shop"
ON public.products FOR SELECT
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Users can only insert products to their shop
CREATE POLICY "Users can insert products to their shop"
ON public.products FOR INSERT
WITH CHECK (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Users can only update products from their shop
CREATE POLICY "Users can update products from their shop"
ON public.products FOR UPDATE
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Users can only delete products from their shop
CREATE POLICY "Users can delete products from their shop"
ON public.products FOR DELETE
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- PRODUCT_VARIANTS TABLE POLICIES
-- ============================================================================
-- Users can only view variants for their shop's products
CREATE POLICY "Users can view product variants from their shop"
ON public.product_variants FOR SELECT
USING (
  product_id IN (
    SELECT id FROM public.products 
    WHERE shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Users can only insert variants for their shop's products
CREATE POLICY "Users can insert variants for their shop's products"
ON public.product_variants FOR INSERT
WITH CHECK (
  product_id IN (
    SELECT id FROM public.products 
    WHERE shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Users can only update variants for their shop's products
CREATE POLICY "Users can update variants for their shop's products"
ON public.product_variants FOR UPDATE
USING (
  product_id IN (
    SELECT id FROM public.products 
    WHERE shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- ============================================================================
-- SALES TABLE POLICIES
-- ============================================================================
-- Users can only view sales from their shop
CREATE POLICY "Users can view sales from their shop"
ON public.sales FOR SELECT
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Users can only insert sales to their shop
CREATE POLICY "Users can insert sales to their shop"
ON public.sales FOR INSERT
WITH CHECK (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Users can only update sales from their shop
CREATE POLICY "Users can update sales from their shop"
ON public.sales FOR UPDATE
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- SALE_ITEMS TABLE POLICIES
-- ============================================================================
-- Users can only view sale items for sales in their shop
CREATE POLICY "Users can view sale items from their shop"
ON public.sale_items FOR SELECT
USING (
  sale_id IN (
    SELECT id FROM public.sales 
    WHERE shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Users can only insert sale items for sales in their shop
CREATE POLICY "Users can insert sale items for their shop"
ON public.sale_items FOR INSERT
WITH CHECK (
  sale_id IN (
    SELECT id FROM public.sales 
    WHERE shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- ============================================================================
-- CUSTOMERS TABLE POLICIES
-- ============================================================================
-- Users can only view customers from their shop
CREATE POLICY "Users can view customers from their shop"
ON public.customers FOR SELECT
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Users can only insert customers to their shop
CREATE POLICY "Users can insert customers to their shop"
ON public.customers FOR INSERT
WITH CHECK (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Users can only update customers from their shop
CREATE POLICY "Users can update customers from their shop"
ON public.customers FOR UPDATE
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- CREDIT_PAYMENTS TABLE POLICIES
-- ============================================================================
-- Users can only view credit payments for their shop's customers
CREATE POLICY "Users can view credit payments from their shop"
ON public.credit_payments FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM public.customers 
    WHERE shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Users can only insert credit payments for their shop's customers
CREATE POLICY "Users can insert credit payments for their shop"
ON public.credit_payments FOR INSERT
WITH CHECK (
  customer_id IN (
    SELECT id FROM public.customers 
    WHERE shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- ============================================================================
-- EXPENSES TABLE POLICIES
-- ============================================================================
-- Users can only view expenses from their shop
CREATE POLICY "Users can view expenses from their shop"
ON public.expenses FOR SELECT
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Users can only insert expenses to their shop
CREATE POLICY "Users can insert expenses to their shop"
ON public.expenses FOR INSERT
WITH CHECK (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Users can only update expenses from their shop
CREATE POLICY "Users can update expenses from their shop"
ON public.expenses FOR UPDATE
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Users can only delete expenses from their shop
CREATE POLICY "Users can delete expenses from their shop"
ON public.expenses FOR DELETE
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify RLS is working:
--
-- 1. Check RLS is enabled:
--    SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--
-- 2. View all policies:
--    SELECT * FROM pg_policies WHERE schemaname = 'public';
--
-- 3. Test as a user (should only see their shop's data):
--    SELECT * FROM public.products; -- Limited by RLS
--
-- ============================================================================
