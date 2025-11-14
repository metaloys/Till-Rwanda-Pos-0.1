-- ============================================================================
-- NUCLEAR RLS CLEANUP - DELETE ALL POLICIES AT ONCE
-- ============================================================================
-- This script deletes EVERY SINGLE RLS POLICY from all tables
-- Run this FIRST to clear everything
-- Then disable RLS
-- Then rebuild fresh
--
-- STEPS:
-- 1. Go to Supabase SQL Editor
-- 2. Paste this ENTIRE script
-- 3. Click Run
-- 4. All policies will be deleted
-- 5. Then run the verification queries below
--
-- ============================================================================

-- Delete ALL policies from ALL tables
-- First we DROP policies, then DISABLE RLS

-- PROFILES - Drop all policies
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN 
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.profiles CASCADE';
    END LOOP;
END $$;

-- SHOPS - Drop all policies
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN 
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'shops' AND schemaname = 'public'
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.shops CASCADE';
    END LOOP;
END $$;

-- PRODUCTS - Drop all policies
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN 
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'products' AND schemaname = 'public'
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.products CASCADE';
    END LOOP;
END $$;

-- PRODUCT_VARIANTS - Drop all policies
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN 
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'product_variants' AND schemaname = 'public'
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.product_variants CASCADE';
    END LOOP;
END $$;

-- SALES - Drop all policies
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN 
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'sales' AND schemaname = 'public'
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.sales CASCADE';
    END LOOP;
END $$;

-- SALE_ITEMS - Drop all policies
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN 
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'sale_items' AND schemaname = 'public'
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.sale_items CASCADE';
    END LOOP;
END $$;

-- CUSTOMERS - Drop all policies
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN 
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'customers' AND schemaname = 'public'
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.customers CASCADE';
    END LOOP;
END $$;

-- CREDIT_PAYMENTS - Drop all policies
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN 
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'credit_payments' AND schemaname = 'public'
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.credit_payments CASCADE';
    END LOOP;
END $$;

-- EXPENSES - Drop all policies
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN 
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'expenses' AND schemaname = 'public'
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.expenses CASCADE';
    END LOOP;
END $$;

-- Now disable RLS on all tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;

-- At this point, ALL policies should be deleted
-- Verify: run this query
-- SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
-- Should return: 0

-- ============================================================================
-- VERIFICATION QUERY (run this after the above)
-- ============================================================================
-- SELECT COUNT(*) as total_policies FROM pg_policies WHERE schemaname = 'public';
-- (Should return: 0)
--
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- (All should show: false)
--
-- ============================================================================
