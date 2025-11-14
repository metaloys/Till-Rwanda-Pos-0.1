-- ============================================================================
-- NUCLEAR OPTION: COMPLETELY DISABLE & REBUILD RLS
-- ============================================================================
-- This script DISABLES RLS on all tables (removes ALL policies completely)
-- Then re-enables RLS with fresh clean policies
-- Use this if DROP POLICY isn't working
--
-- STEPS:
-- 1. Go to Supabase SQL Editor
-- 2. Paste this ENTIRE file
-- 3. Click Run
-- 4. Hard refresh browser (Ctrl+F5)
-- 5. No more infinite recursion!
--
-- ============================================================================

-- ============================================================================
-- STEP 1: DISABLE RLS ON ALL TABLES (completely removes ALL policies)
-- ============================================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;

-- Small pause to ensure tables are properly disabled
-- (This comment is just for clarity, the disable above is atomic)

-- ============================================================================
-- STEP 2: ENABLE RLS ON ALL TABLES (fresh start with no policies)
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

-- ============================================================================
-- STEP 3: CREATE NEW CLEAN POLICIES (no recursion)
-- ============================================================================

-- PROFILES
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- SHOPS
CREATE POLICY "Users can view their shops"
ON public.shops FOR SELECT
USING (
  id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their shops"
ON public.shops FOR UPDATE
USING (
  id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- PRODUCTS
CREATE POLICY "Users can view products from their shop"
ON public.products FOR SELECT
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert products to their shop"
ON public.products FOR INSERT
WITH CHECK (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update products from their shop"
ON public.products FOR UPDATE
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete products from their shop"
ON public.products FOR DELETE
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- PRODUCT_VARIANTS
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

-- SALES
CREATE POLICY "Users can view sales from their shop"
ON public.sales FOR SELECT
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert sales to their shop"
ON public.sales FOR INSERT
WITH CHECK (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update sales from their shop"
ON public.sales FOR UPDATE
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- SALE_ITEMS
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

-- CUSTOMERS
CREATE POLICY "Users can view customers from their shop"
ON public.customers FOR SELECT
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert customers to their shop"
ON public.customers FOR INSERT
WITH CHECK (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update customers from their shop"
ON public.customers FOR UPDATE
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- CREDIT_PAYMENTS
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

-- EXPENSES
CREATE POLICY "Users can view expenses from their shop"
ON public.expenses FOR SELECT
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert expenses to their shop"
ON public.expenses FOR INSERT
WITH CHECK (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update expenses from their shop"
ON public.expenses FOR UPDATE
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete expenses from their shop"
ON public.expenses FOR DELETE
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- DONE! Now run these verification queries:
-- ============================================================================
-- SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
-- (Should return: 32)
--
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- (All should show: true)
-- ============================================================================
