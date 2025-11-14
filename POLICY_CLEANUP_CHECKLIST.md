# 🎯 POLICY CLEANUP CHECKLIST

Based on what you showed me, there are MANY conflicting policies. You must delete them ALL.

## PROFILES - Delete These (Keep NONE):
- ☐ Allow select for shop members
- ☐ Allow update own profile
- ☐ profiles_select_policy
- ☐ profiles_update_policy
- ☐ Users can update own profile
- ☐ Users can update their own profile
- ☐ Users can view own profile
- ☐ Users can view their own profile

## SHOPS - Delete These:
- ☐ Allow members to read their own shop
- ☐ Users can update their shops
- ☐ Users can view their own shop, Admins can view all
- ☐ Users can view their shop
- ☐ Users can view their shops

## PRODUCTS - Delete These:
- ☐ Allow shop members CRUD on products
- ☐ products_delete_policy
- ☐ products_insert_policy
- ☐ products_select_policy
- ☐ products_update_policy
- ☐ Users can delete products from their shop
- ☐ Users can insert products to their shop
- ☐ Users can only manage their own shop data
- ☐ Users can only see their shop's products
- ☐ Users can update products from their shop
- ☐ Users can view products from their shop
- ☐ Users can view products in their shop

## PRODUCT_VARIANTS - Delete These:
- ☐ Allow shop members CRUD on variants
- ☐ product_variants_delete_policy
- ☐ product_variants_insert_policy
- ☐ product_variants_select_policy
- ☐ product_variants_update_policy
- ☐ Users can insert variants for their shop's products
- ☐ Users can only manage their own shop data
- ☐ Users can update variants for their shop's products
- ☐ Users can view product variants from their shop

## SALES - Delete These:
- ☐ Allow shop members CRUD on sales
- ☐ sales_delete_policy
- ☐ sales_insert_policy
- ☐ sales_select_policy
- ☐ sales_update_policy
- ☐ Users can insert sales to their shop
- ☐ Users can only manage their own shop data
- ☐ Users can update sales from their shop
- ☐ Users can view sales from their shop

## SALE_ITEMS - Delete These:
- ☐ Allow shop members access to sale items
- ☐ sale_items_delete_policy
- ☐ sale_items_insert_policy
- ☐ sale_items_select_policy
- ☐ sale_items_update_policy
- ☐ Users can insert sale items for their shop
- ☐ Users can only manage their own shop data
- ☐ Users can view sale items from their shop

## CUSTOMERS - Delete These:
- ☐ Allow individual delete access
- ☐ Allow individual update access
- ☐ Allow shop members CRUD on customers
- ☐ customers_delete_policy
- ☐ customers_insert_policy
- ☐ customers_select_policy
- ☐ customers_update_policy
- ☐ Users can insert customers to their shop
- ☐ Users can only manage their own shop data
- ☐ Users can update customers from their shop
- ☐ Users can view customers from their shop

## CREDIT_PAYMENTS - Delete These:
- ☐ Allow authenticated credit_payments access
- ☐ credit_payments_delete_policy
- ☐ credit_payments_insert_policy
- ☐ credit_payments_select_policy
- ☐ credit_payments_update_policy
- ☐ Users can insert credit payments for their shop
- ☐ Users can only manage their own shop data
- ☐ Users can view credit payments from their shop

## EXPENSES - Delete These:
- ☐ Allow individual delete access
- ☐ Allow individual insert access
- ☐ Allow individual read access
- ☐ Allow individual update access
- ☐ expenses_delete_policy
- ☐ expenses_insert_policy
- ☐ expenses_select_policy
- ☐ expenses_update_policy
- ☐ Users can delete expenses from their shop
- ☐ Users can insert expenses to their shop
- ☐ Users can only manage their own shop data
- ☐ Users can update expenses from their shop
- ☐ Users can view expenses from their shop

---

## HOW TO DELETE - SQL METHOD (EASY - Takes 30 seconds!)

**DO THIS INSTEAD OF MANUAL DELETION:**

1. Open file: `supabase/rls_cleanup_all.sql` in your project
2. Go to **Supabase SQL Editor** → Copy entire file content
3. **Paste it** into the SQL Editor
4. Click **"Run"** button
5. **Wait** - all policies deleted automatically ✅

---

## AFTER RUNNING SQL CLEANUP

**Verify it worked:**

Copy and paste this into SQL Editor:

```sql
SELECT COUNT(*) as total_policies FROM pg_policies WHERE schemaname = 'public';
```

**Result should be: `0`**

If you see `0`, great! All policies deleted.

Then run:

```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

**Result should show all `false`** (RLS disabled)

---

## ✅ YOU'RE DONE!

Once you confirm:
- Total policies = 0
- All RLS = false

Report back and we'll rebuild fresh policies!

**DO THIS NOW!** 30 seconds and we're unblocked 🚀
