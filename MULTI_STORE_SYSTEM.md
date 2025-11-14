# 👥 Super Admin & Multi-Store Management System

## 📊 Current System Overview

### 1. WHO IS A SUPER ADMIN?

**Super Admin Identification:**
```
Profile Field: is_super_admin (boolean)
- TRUE = Super Admin (Platform Owner/Administrator)
- FALSE = Regular User (Shop Owner/Manager/Cashier)
```

**Current Logic in Code:**
```typescript
// From App.tsx, Dashboard.tsx
const isSuperAdmin = profile.is_super_admin;

if (profileData.is_super_admin) {
  // Show Admin Dashboard (Super Admin Dashboard)
  // Can onboard shops, view platform metrics, manage system
} else {
  // Show Overview/POS (Shop Dashboard)
  // Can only manage their own shop
}
```

**Super Admin Properties:**
- `is_super_admin`: true
- `shop_id`: null (Super Admins don't belong to a specific shop)
- Role: Not assigned (different from regular users)
- Access: Platform-wide, can see all shops

**Regular User Properties:**
- `is_super_admin`: false
- `shop_id`: One specific shop UUID
- Role: 'owner' | 'manager' | 'cashier'
- Access: Only their assigned shop

---

## 🏪 CURRENT ISSUE: Multi-Store Users

**Problem**: Currently, a user can only be assigned to ONE shop_id:
```typescript
Profile = {
  id: string;           // User's auth ID
  shop_id: string;      // ❌ ONLY ONE SHOP - This is the problem!
  role: UserRole;
  is_super_admin: boolean;
}
```

**Example Scenario**:
- User "John" owns 3 shops: Shop A, Shop B, Shop C
- But `profiles.shop_id` can only store ONE shop UUID
- When John logs in, he only sees Shop A
- He cannot access Shop B or Shop C from the dashboard
- He has to log out and back in with different accounts (bad UX)

---

## ✅ SOLUTION: Add User-Shop Association Table

### Step 1: Create `user_shop_assignments` Table

```sql
CREATE TABLE public.user_shop_assignments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner', -- 'owner', 'manager', 'cashier'
  is_primary BOOLEAN DEFAULT false,   -- Primary shop for this user
  status TEXT DEFAULT 'active',       -- 'active', 'inactive'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, shop_id) -- User can only be assigned once per shop
);

-- Add RLS policies
ALTER TABLE public.user_shop_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assignments"
ON public.user_shop_assignments FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can only be assigned by super admins"
ON public.user_shop_assignments FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT id FROM profiles WHERE is_super_admin = true
));
```

### Step 2: Modify `profiles` Table

```sql
-- Keep shop_id for backward compatibility (points to PRIMARY shop)
-- Add new field:
ALTER TABLE public.profiles 
ADD COLUMN primary_shop_id UUID REFERENCES public.shops(id),
ADD COLUMN assigned_shops BIGINT DEFAULT 0; -- count of assigned shops

-- Migration: Set primary_shop_id = shop_id for existing users
UPDATE public.profiles 
SET primary_shop_id = shop_id 
WHERE shop_id IS NOT NULL;
```

---

## 🎯 Multi-Store UI Implementation

### New Components Needed:

#### 1. **ShopSelector Component** (Dropdown/Switcher)
```typescript
// Shows all shops user has access to
// Allows switching between shops
// Highlights primary shop

export default function ShopSelector({ 
  currentShopId, 
  shops,
  onSelectShop 
}) {
  return (
    <select onChange={(e) => onSelectShop(e.target.value)}>
      {shops.map(shop => (
        <option key={shop.id} value={shop.id}>
          {shop.name} 
          {shop.id === currentShopId ? ' (Current)' : ''}
          {shop.is_primary ? ' ⭐ Primary' : ''}
        </option>
      ))}
    </select>
  );
}
```

#### 2. **MultiStoreNavigation Component**
```
Dashboard Header:
┌─────────────────────────────────┐
│ Till Rwanda | Shop: [dropdown ▼] │
│            Shop A ⭐ Primary      │
│            Shop B                 │
│            Shop C                 │
│            + Add Shop             │
└─────────────────────────────────┘
```

#### 3. **StoreManagement Page** (For Shop Owners with Multiple Stores)
```
My Stores
├─ Shop A (Primary)
│  ├─ Status: Active
│  ├─ Staff: 5
│  ├─ Monthly Revenue: 1.5M RWF
│  └─ Action: Switch | Settings | Remove
├─ Shop B
│  ├─ Status: Active
│  ├─ Staff: 3
│  ├─ Monthly Revenue: 890K RWF
│  └─ Action: Switch | Settings | Remove
└─ Shop C
   ├─ Status: Active
   ├─ Staff: 2
   ├─ Monthly Revenue: 450K RWF
   └─ Action: Switch | Settings | Remove
```

---

## 📱 User Experience Flow

### Scenario: John owns 3 shops

**Current (Broken)**:
```
1. John logs in
2. Dashboard shows: Shop A only
3. John cannot see Shop B or C
4. Must log out and use different account to access other shops
   ❌ BAD UX
```

**Proposed (Fixed)**:
```
1. John logs in
2. Dashboard header shows: "Shop: [Shop A ⭐]" (dropdown)
3. John clicks dropdown → sees:
   - Shop A (Primary)
   - Shop B
   - Shop C
4. John clicks "Shop B"
5. Dashboard updates → Shows Shop B data
6. All data (sales, products, expenses) switch to Shop B
7. John can freely switch between shops
   ✅ GREAT UX
```

---

## 🔧 Implementation Roadmap

### Phase 1: Backend Setup (1-2 hours)
- [ ] Create `user_shop_assignments` table
- [ ] Add RLS policies
- [ ] Create migration scripts
- [ ] Update Supabase schema

### Phase 2: Database Queries (1-2 hours)
- [ ] Query to get all shops for a user
- [ ] Query to get primary shop
- [ ] Query to switch shops (update active shop)
- [ ] Query to add shop assignment
- [ ] Query to remove shop assignment

### Phase 3: Frontend Components (2-3 hours)
- [ ] ShopSelector component
- [ ] Shop switcher dropdown in navbar
- [ ] Store Management page
- [ ] Integration with existing pages

### Phase 4: State Management (1-2 hours)
- [ ] Add `activeShop` to App state
- [ ] Handle shop switching logic
- [ ] Persist active shop in localStorage
- [ ] Update all queries to use `activeShop`

### Phase 5: Testing & UI Polish (1-2 hours)
- [ ] Test switching between shops
- [ ] Verify data isolation (one shop can't see another's data)
- [ ] Mobile responsiveness
- [ ] Error handling

---

## 💾 Database Changes Summary

### New Table
```
user_shop_assignments (
  id, 
  user_id, 
  shop_id, 
  role, 
  is_primary,
  status
)
```

### Modified Tables
```
profiles (add: primary_shop_id, assigned_shops)
```

### New RLS Policies
```
- Users can view their own assignments
- Super admins can manage all assignments
```

---

## 🔐 Security Considerations

✅ **Multi-Shop Data Isolation**:
- RLS prevents users from seeing shops they don't own
- Each query filtered by `shop_id`
- Super Admins can view all shops with their policies

✅ **Role Enforcement**:
- `is_primary` field designates primary shop
- User can only access assigned shops
- Default login → Primary shop

✅ **Audit Trail**:
- `created_at`, `updated_at` track when assignments change
- Log shop switches in activity table (future)

---

## 📊 Current vs Proposed Architecture

### BEFORE (Current):
```
User ────┐
         ├──→ ONE shop_id (rigid)
         └── Can only access this one shop
         
Jane's Shop (stuck here)
```

### AFTER (Proposed):
```
User ────┐
         ├──→ Primary Shop (default)
         ├──→ Shop 1 ─────→ Can switch between ANY
         ├──→ Shop 2 ─────→ assigned shops
         └──→ Shop 3 ─────→ Seamlessly!

user_shop_assignments
├─ User_1 + Shop_A (primary)
├─ User_1 + Shop_B
├─ User_1 + Shop_C
└─ Many-to-Many relationship!
```

---

## ⚡ Quick Implementation Timeline

- **Today**: Design final
- **Tomorrow**: Backend (1 hour)
- **Tomorrow**: Frontend (2-3 hours)
- **Tomorrow**: Testing (1 hour)

**Total Effort**: ~5 hours → Major UX improvement! 🚀

---

## 🎯 Benefits

✅ Users with multiple shops have excellent UX  
✅ No need for multiple accounts  
✅ Seamless shop switching  
✅ Super Admins can manage user-shop assignments  
✅ Scalable for future growth  
✅ Better data security with many-to-many relationship  

---

## Next Steps

**Question for you**:
1. Do you want to implement multi-store support NOW?
2. Or wait until you have users with multiple stores?
3. Should we also add a "Stores I Manage" feature for managers/cashiers?

Let me know! 🚀
