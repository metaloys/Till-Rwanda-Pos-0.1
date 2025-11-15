# 👥 Access Control & Permissions System

## 📊 Current Permissions Model

### **1. WHO IS A SUPER ADMIN?**
```
Super Admin = Platform Owner/Administrator
├─ Can see: ALL shops on the platform
├─ Can manage: ALL shops (pause, resume, extend, delete)
├─ Can onboard: New shops
├─ Can view: Platform-wide metrics
└─ Access level: FULL PLATFORM ACCESS
```

### **2. WHO IS A SHOP OWNER?**
```
Shop Owner = Owner of ONE shop
├─ Can see: ONLY their own shop
├─ Can manage: Products, staff, sales, expenses
├─ Cannot see: Other shops' data
└─ Access level: SHOP-ONLY ACCESS
```

---

## 🔐 Data Visibility & Isolation

### **Current Architecture (Before Multi-Store)**

```
┌─────────────────────────────────────────┐
│ SUPER ADMIN (is_super_admin = true)     │
├─────────────────────────────────────────┤
│ Can See:                                │
│ ✅ Shop A (all data)                    │
│ ✅ Shop B (all data)                    │
│ ✅ Shop C (all data)                    │
│ ✅ Platform metrics                     │
│                                         │
│ Can Do (ADMIN ACTIONS):                 │
│ • Pause/Resume any shop                 │
│ • Extend trial period                   │
│ • Delete shop                           │
│ • Onboard new shops                     │
│ • View revenue across all shops         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ SHOP OWNER (is_super_admin = false)     │
├─────────────────────────────────────────┤
│ Can See:                                │
│ ✅ Their own shop ONLY (e.g., Shop A)   │
│ ❌ Cannot see Shop B or C               │
│ ❌ Cannot see platform metrics          │
│                                         │
│ Can Do (SHOP ACTIONS):                  │
│ • Add/edit products                     │
│ • Process sales                         │
│ • Manage customers                      │
│ • Record expenses                       │
│ • View own shop metrics                 │
│ • Invite staff                          │
│                                         │
│ Cannot Do:                              │
│ ❌ Pause their own shop                 │
│ ❌ Extend trial period                  │
│ ❌ Delete their shop                    │
│ ❌ See other shops                      │
└─────────────────────────────────────────┘
```

---

## 🛒 Super Admin Shop Actions

### **Three Actions Available in ShopActionsModal:**

#### **1. Pause Shop Access**
```
What it does:
├─ Sets shop is_active = false
├─ Shop owner cannot login/access shop
├─ All shop data is hidden
└─ Can be resumed later

Who can do it: SUPER ADMIN ONLY ✅

When to use:
• Trial expired & customer hasn't paid
• Customer asked for suspension
• Troubleshooting/investigation needed
• Payment issues
```

#### **2. Extend Trial Period**
```
What it does:
├─ Adds X days to trial_ends_at
├─ Shop owner gets more free time
├─ Extends access automatically
└─ Example: Extend by 30 days

Who can do it: SUPER ADMIN ONLY ✅

When to use:
• Customer requested extension
• Trial period troubleshooting
• Special promotional offer
• Retention/win-back strategy
```

#### **3. Delete Shop**
```
What it does:
├─ Permanently removes shop from system
├─ All associated data deleted (cascade)
├─ Cannot be undone
└─ Requires confirmation

Who can do it: SUPER ADMIN ONLY ✅

When to use:
• Test/demo shop cleanup
• Customer requested deletion
• Data privacy (GDPR compliance)
• Duplicate shop removal
⚠️ WARNING: This is PERMANENT!
```

---

## 📋 WHO CAN SEE SHOP DATA?

### **Shop Transactions/Sales:**

```
┌──────────────────────────────────────────────────┐
│ Transaction in Shop A:                           │
│ • Cashier: John sold 5 items for 10,000 RWF    │
└──────────────────────────────────────────────────┘

Who can see it?
├─ ✅ SUPER ADMIN (can see ALL shops' transactions)
├─ ✅ Shop A Owner (can see their own transactions)
├─ ✅ Shop A Manager (can see their shop)
├─ ✅ Shop A Cashier (can see their shop)
└─ ❌ Shop B Owner (CANNOT see Shop A)
└─ ❌ Shop B Manager (CANNOT see Shop A)
└─ ❌ Shop B Cashier (CANNOT see Shop A)
```

### **RLS Policy Logic (Database Level):**

```sql
-- For Sales table
CREATE POLICY "Super admins view all sales..."
ON public.sales FOR SELECT
USING (
  -- SUPER ADMIN PATH: See everything
  (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) = true
  OR
  -- SHOP OWNER PATH: See only their shop
  shop_id IN (SELECT shop_id FROM profiles WHERE id = auth.uid())
);
```

---

## 🔒 Data Isolation Examples

### **Scenario 1: Shop Owner Jane**
```
Jane owns Shop A only
├─ Can see: Shop A products, sales, customers, expenses
├─ Cannot see: Shop B, Shop C data
└─ Cannot do: Pause/delete her own shop

If Jane tries to query Shop B data:
├─ Database RLS rejects it
├─ Query returns 0 rows
└─ Jane gets "No data" message
```

### **Scenario 2: Super Admin Alice**
```
Alice is Super Admin
├─ Can see: Shop A, Shop B, Shop C (ALL data)
├─ Can do: Pause/resume any shop
├─ Can do: Delete any shop
├─ Can do: Onboard new shops
└─ Can view: Platform-wide metrics

If Alice opens Shop A metrics:
├─ Sees all sales from Shop A
├─ Can drill down to individual transactions
└─ Can see customers, expenses, products
```

### **Scenario 3: Manager Bob (Shop A)**
```
Bob is Manager in Shop A
├─ Can see: Shop A data
├─ Cannot see: Shop B, Shop C
├─ Cannot do: Pause/delete shop
├─ CAN do: Process sales, add products

If Bob tries to access Shop B:
├─ Dashboard redirects to Shop A
├─ RLS prevents any Shop B queries
└─ Bob only sees Shop A info
```

---

## 🚀 What's Coming: Multi-Store Support

When we implement multi-store system:

```
Jane will be able to own MULTIPLE shops:

Current (Single Shop):
├─ Shop A (Jane's only shop)
└─ Can only work in Shop A

After Multi-Store (Multiple Shops):
├─ Shop A (Jane's primary)
├─ Shop B (Jane also owns)
└─ Shop C (Jane also owns)

Shop Selector in navbar:
├─ [Select Shop: Shop A ▼]
├─ Click dropdown to see:
│  ├─ Shop A (Primary) ⭐
│  ├─ Shop B
│  └─ Shop C
└─ Switch between shops instantly!
```

---

## 📊 Permission Matrix

| Action | Super Admin | Shop Owner | Manager | Cashier |
|--------|-----------|-----------|---------|---------|
| **View own shop** | ✅ All shops | ✅ Only theirs | ✅ Only theirs | ✅ Only theirs |
| **View other shops** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Add products** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **Process sales** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **View reports** | ✅ All shops | ✅ Own shop | ✅ Own shop | ❌ No |
| **Manage staff** | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Pause shop** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Delete shop** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Extend trial** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Onboard shops** | ✅ Yes | ❌ No | ❌ No | ❌ No |

---

## 🔑 Key Takeaways

✅ **Super Admins** = Platform managers (see everything, control everything)  
✅ **Shop Owners** = Business owners (see only their shop, manage their business)  
✅ **Data is completely isolated** by shop (RLS enforces this at database)  
✅ **Multi-shop support coming soon** (same shop owner, many shops)  
✅ **Permissions are role-based** (determined at login via `is_super_admin` flag)  

---

## ❓ Common Questions

**Q: Can a shop owner delete their own shop?**
A: No. Only Super Admin can delete shops. Shop owner must contact support.

**Q: Can a shop owner pause their own shop?**
A: No. Only Super Admin can pause. Shop owner would need to ask super admin.

**Q: Can two shop owners see each other's data?**
A: No. RLS policies prevent this at database level. Complete data isolation.

**Q: What happens if shop owner Jane wants to own 3 shops?**
A: After multi-store update, Jane can switch between all 3 shops. Each shop still isolated from others.

**Q: Can cashier John access Shop A data if he works in Shop B?**
A: No. Cashier only has access to their assigned shop.

---

## 🎯 Summary

**Super Admin Shop Actions** (Pause, Extend, Delete):
- ✅ Only super admin can do these
- ✅ These control shop-level settings (not data operations)
- ✅ Shop owners cannot do these on themselves

**Shop Data Visibility**:
- ✅ Super admin sees ALL shop data
- ✅ Shop owner/staff see ONLY their shop
- ✅ Complete isolation enforced by RLS policies
- ✅ Cannot query/modify other shops' data

**When multi-store is ready**:
- ✅ Shop owners can own multiple shops
- ✅ Easy switching between shops
- ✅ Each shop still isolated from others
