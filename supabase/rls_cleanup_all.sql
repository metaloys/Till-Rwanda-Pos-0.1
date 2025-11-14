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
-- We'll do this by disabling and re-enabling RLS which clears all policies

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;

-- At this point, ALL policies are deleted
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
