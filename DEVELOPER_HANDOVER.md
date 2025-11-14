# Till Rwanda POS - Developer Handover Guide

**Created:** November 14, 2025  
**For:** New Developer continuing the project  
**From:** Previous Senior Developer Notes

---

## 📚 TABLE OF CONTENTS

1. [System Architecture Overview](#system-architecture-overview)
2. [How the Application Works](#how-the-application-works)
3. [Frontend Logic & Flow](#frontend-logic--flow)
4. [Supabase Functions Explained](#supabase-functions-explained)
5. [Database & Multi-Tenancy](#database--multi-tenancy)
6. [Authentication Flow](#authentication-flow)
7. [Data Flow Examples](#data-flow-examples)
8. [Common Patterns & Best Practices](#common-patterns--best-practices)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Development Workflow](#development-workflow)

---

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                             │
│         (React App - Frontend - Till Rwanda POS)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/HTTPS Requests
                       │ (Vite Dev Server or Production)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  REACT APPLICATION                          │
│  ├─ Components (UI, Modals, Forms)                          │
│  ├─ Pages (Dashboard sections)                              │
│  ├─ State Management (React Hooks)                          │
│  └─ Supabase Client (Frontend SDK)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌──────────────────┐      ┌──────────────────────┐
│  SUPABASE AUTH   │      │ SUPABASE DATABASE    │
│  (JWT tokens)    │      │  (PostgreSQL)        │
│                  │      │                      │
│ ├─ Login         │      │ ├─ profiles          │
│ ├─ Register      │      │ ├─ shops             │
│ ├─ Password      │      │ ├─ products          │
│ │  Reset         │      │ ├─ product_variants  │
│ └─ Sign Out      │      │ ├─ sales             │
└──────────────────┘      │ ├─ sale_items        │
                          │ ├─ customers         │
         ┌─────────────────┼─ ├─ credit_payments  │
         │                 │ └─ expenses          │
         │                 └──────────────────────┘
         │                           ▲
         │                           │
         ▼                           ▼
┌──────────────────────────────────────────────┐
│       SUPABASE EDGE FUNCTIONS (Deno)         │
│    (Backend business logic, serverless)      │
│                                              │
│ ├─ complete-sale/                           │
│ ├─ invite-staff/                            │
│ ├─ delete-staff/                            │
│ ├─ toggle-staff-status/                     │
│ ├─ onboard-new-shop/                        │
│ └─ send-reminder/                           │
└──────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Frontend-Centric**: Most logic runs in React (client-side)
2. **Multi-Tenant**: All data filtered by `shop_id` for isolation
3. **Serverless Backend**: Supabase Edge Functions handle complex operations
4. **Real-Time Capable**: Supabase Realtime can be used for live updates
5. **No State Management Library**: Using React Context + Hooks only
6. **Tailwind CSS**: All styling via utility classes, no custom CSS

---

## 🔄 HOW THE APPLICATION WORKS

### User Journey - From Login to Sale

```
1. USER VISITS APP
   └─> App.tsx checks if user is logged in
   └─> If NOT logged in → show Auth.tsx (login/register page)
   └─> If logged in → fetch user profile from Supabase

2. USER LOGS IN
   └─> Auth.tsx sends credentials to Supabase
   └─> Supabase returns JWT token
   └─> Token stored in browser (Supabase handles this)
   └─> App.tsx receives session and fetches profile

3. PROFILE LOADED
   └─> Dashboard.tsx renders with profile data
   └─> Shows navigation based on role:
       ├─ Owner → all features
       ├─ Manager → reports + management
       └─ Cashier → POS only

4. USER NAVIGATES TO POS
   └─> PointOfSale.tsx component loads
   └─> Fetches products from database
   └─> User scans/selects products
   └─> Products added to cart (local state)
   └─> User applies discounts/selects customer
   └─> User selects payment method
   └─> Click "Complete Sale"

5. COMPLETE SALE FLOW
   └─> Frontend sends sale data to Edge Function
   └─> Edge Function validates and saves to database
   └─> Returns success/error response
   └─> Frontend shows receipt
   └─> Frontend updates local state
   └─> User can print receipt

6. USER VIEWS REPORTS
   └─> SalesHistory.tsx fetches sales data
   └─> Filters by date/customer/method
   └─> Displays in table or charts
   └─> Can export or print
```

### Application Entry Point

**`src/main.tsx`** - Application starts here
- Mounts React app to DOM
- Imports App.tsx

**`src/App.tsx`** - Main application logic
```
Check if user session exists
├─ YES → Render Dashboard
└─ NO → Render Auth
```

**`src/Dashboard.tsx`** - Main navigation hub
```
Loads user profile from Supabase
Checks subscription status
Renders navigation menu
Handles page switching
Based on role, shows different menu items
Handles logout
```

---

## 💻 FRONTEND LOGIC & FLOW

### Component Hierarchy

```
App.tsx
├─ Auth.tsx (if not logged in)
│  ├─ Login form
│  └─ Registration form
│
└─ Dashboard.tsx (if logged in)
   ├─ Sidebar (SidebarContent)
   │  └─ Navigation links
   ├─ Header
   │  └─ Page title + Mobile menu toggle
   └─ Main content (based on currentPage state)
      ├─ Overview.tsx
      ├─ PointOfSale.tsx
      │  ├─ ProductList
      │  ├─ CartDisplay
      │  └─ Modals (ReceiptModal, PaymentModal, etc.)
      ├─ Products.tsx
      ├─ Customers.tsx
      ├─ CreditManagement.tsx
      ├─ SalesHistory.tsx
      ├─ ExpenseTracking.tsx
      ├─ Reports.tsx
      ├─ CreditAgingReport.tsx
      ├─ StaffManagement.tsx
      └─ SuperAdminDashboard.tsx
```

### State Management Pattern (React Hooks)

**No Redux/Context API** - Using simple React useState for each component

Example from PointOfSale.tsx:
```typescript
const [cart, setCart] = useState<CartItem[]>([]); // Current cart items
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
```

**Why this approach?**
- Simple and understandable
- No extra dependencies
- Easy to trace data flow
- Good enough for current app size

### Supabase Client Setup

**`src/supabaseClient.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Why environment variables?**
- Keep secrets out of code
- Different URLs for dev/production
- Easy to update without changing code

### Data Fetching Pattern

**Generic fetch pattern used throughout:**

```typescript
// Example: Fetching products
const [products, setProducts] = useState<Product[]>([]);
const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId);
      
      if (error) throw error;
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  fetchProducts();
}, [shopId]); // Refetch when shopId changes
```

**Pattern explanation:**
1. Initialize loading state
2. Use `useEffect` to fetch on mount/dependency change
3. Use async/await (not .then())
4. Error handling with try/catch
5. Always set loading state in finally block
6. Show error/loading UI to user

### Modal Pattern

**Modals are controlled components:**

```typescript
// In parent component (PointOfSale.tsx)
const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
const [lastSale, setLastSale] = useState<Sale | null>(null);

// Show modal after successful sale
const handleCompleteSale = async () => {
  // ... create sale ...
  setLastSale(saleData);
  setIsReceiptModalOpen(true);
};

// Pass control to modal
<ReceiptModal 
  isOpen={isReceiptModalOpen}
  onClose={() => setIsReceiptModalOpen(false)}
  sale={lastSale}
/>
```

**In modal component:**
```typescript
interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
}

export default function ReceiptModal({ isOpen, onClose, sale }: ReceiptModalProps) {
  if (!isOpen) return null; // Don't render if closed
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      {/* Modal content */}
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

**Why this pattern?**
- Parent controls when modal shows/hides
- Easy to pass data to modal
- Predictable behavior
- No accidental memory leaks

---

## ⚙️ SUPABASE FUNCTIONS EXPLAINED

### What are Edge Functions?

- **Serverless Functions**: Code that runs on Supabase servers, not in browser
- **Written in Deno**: TypeScript-like runtime (similar to Node.js but stricter)
- **No cold starts**: Optimized for fast execution
- **Direct database access**: Can read/write to database securely
- **Environment variables**: Secrets stored securely

### Function Location & Structure

```
supabase/functions/
├── complete-sale/
│   ├── index.ts          # Main function code
│   └── deno.json         # Dependencies
├── invite-staff/
├── delete-staff/
├── toggle-staff-status/
├── onboard-new-shop/
└── send-reminder/
```

### How to Call Edge Functions from React

```typescript
// In React component
const response = await fetch('http://localhost:54321/functions/v1/complete-sale', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    shop_id: shopId,
    total_amount: 50000,
    payment_method: 'cash',
    items: [...]
  })
});

const result = await response.json();
```

### Edge Function 1: `complete-sale`

**Purpose:** Process and save a sale transaction securely

**Location:** `supabase/functions/complete-sale/index.ts`

**Flow:**
```
1. User clicks "Complete Sale" in POS
2. React sends sale data to this function
3. Function validates:
   - User is authenticated
   - Shop exists
   - Products have stock
   - Customer credit is sufficient (if credit payment)
4. Function performs atomic operations:
   - Create sale record
   - Create sale_items records
   - Update product stock quantities
   - Update customer credit balance (if credit)
5. Return success response with sale ID
6. React shows receipt with sale ID
```

**Why use Edge Function?**
- ✅ Atomicity: All database changes succeed or all fail
- ✅ Security: Validate data server-side
- ✅ Performance: No need to do multiple queries from frontend
- ✅ Consistency: Ensure data integrity

**Example code structure:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Get authenticated user and database client
  const { shop_id, total_amount, items } = await req.json();

  // 1. Validate
  const sale = {
    shop_id,
    total_amount,
    payment_method: 'cash'
  };

  // 2. Insert sale
  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert([sale])
    .select();

  if (saleError) {
    return new Response(JSON.stringify({ error: saleError }), { status: 400 });
  }

  // 3. Insert sale_items
  const saleItems = items.map(item => ({
    sale_id: saleData[0].id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    price_at_sale: item.price,
    shop_id
  }));

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems);

  // 4. Update stock
  for (const item of items) {
    await supabase.rpc('decrement_stock', {
      variant_id: item.variant_id,
      quantity: item.quantity
    });
  }

  // 5. Return result
  return new Response(JSON.stringify({ success: true, sale_id: saleData[0].id }));
});
```

### Edge Function 2: `invite-staff`

**Purpose:** Send SMS invitation to new staff member

**Location:** `supabase/functions/invite-staff/index.ts`

**Flow:**
```
1. Shop owner goes to Staff Management page
2. Enters staff member's phone number
3. Clicks "Send Invite"
4. React sends to this function
5. Function:
   - Creates new user in auth system
   - Creates staff profile in database
   - Sends SMS via Twilio with invite link
   - Returns success
6. React shows "Invite sent" message
```

**Uses Twilio:** Third-party SMS service

**Example:**
```typescript
// Send SMS via Twilio
const twilioResponse = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`
    },
    body: new URLSearchParams({
      From: TWILIO_PHONE,
      To: phoneNumber,
      Body: `You've been invited to Till Rwanda POS. Click here: https://till.app/join/${inviteCode}`
    })
  }
);
```

### Edge Function 3: `delete-staff`

**Purpose:** Permanently remove staff member

**Location:** `supabase/functions/delete-staff/index.ts`

**Flow:**
```
1. Shop owner clicks delete on staff member
2. ConfirmModal appears
3. Owner confirms deletion
4. React sends to this function with staff_id
5. Function:
   - Checks permissions (only owner can delete)
   - Soft delete: Mark as deactivated OR hard delete: Remove from database
   - Return success
6. UI updates - staff removed from list
```

### Edge Function 4: `toggle-staff-status`

**Purpose:** Activate/deactivate staff member (without deleting)

**Location:** `supabase/functions/toggle-staff-status/index.ts`

**Flow:**
```
1. Owner clicks toggle on staff member status
2. This function:
   - Updates profile.status = 'active' or 'deactivated'
   - Updates profile.deactivated_at timestamp
   - Returns new status
3. UI shows staff as inactive/active
4. Inactive staff cannot log in
```

### Edge Function 5: `onboard-new-shop`

**Purpose:** Set up everything for a new business

**Location:** `supabase/functions/onboard-new-shop/index.ts`

**Called when:** New shop owner creates account

**Flow:**
```
1. User completes registration
2. This function runs automatically (or on demand)
3. Creates:
   - Shop record with trial_ends_at (30 days from now)
   - Profile record for owner
   - Default product categories
   - Default expense categories
   - Sample products (optional)
4. Returns shop setup data
5. Frontend redirects owner to dashboard
```

### Edge Function 6: `send-reminder`

**Purpose:** Send reminders/notifications

**Location:** `supabase/functions/send-reminder/index.ts`

**Examples:**
- Subscription expiring soon
- Low stock alerts
- Daily sales summary
- Credit payment reminders

**Could use:**
- SMS (Twilio)
- Email (SendGrid)
- Push notifications
- WhatsApp API

---

## 🗄️ DATABASE & MULTI-TENANCY

### Multi-Tenancy Concept

**Definition:** Multiple businesses (shops) using the same database, but data is isolated.

**How it works:**

```typescript
// Every table has shop_id
const products = await supabase
  .from('products')
  .select('*')
  .eq('shop_id', currentShopId); // ← CRITICAL: Filter by shop_id

// Without this filter, user A could see user B's data!
```

**Security:** 
- Row-Level Security (RLS) can be set up in Supabase to enforce at database level
- Frontend must always filter by shop_id
- Backend functions must validate shop_id

### Profile Structure

```typescript
type Profile = {
  id: string;                    // UUID from auth.users
  full_name: string | null;
  shop_id: string | null;        // Which shop this user belongs to
  shop_name: string | null;      // Cached shop name
  role: 'owner' | 'manager' | 'cashier';
  is_super_admin: boolean;       // Platform admin (not per-shop)
  status: 'active' | 'deactivated';
  is_active: boolean;            // From shops table join
  trial_ends_at: string | null;  // From shops table join
};
```

**Why cache shop_name in profile?**
- Faster queries (don't need JOIN)
- Reduces database calls
- Must update if shop name changes

### Sales & Stock Management

**Stock Flow in complete-sale function:**

```
BEFORE SALE:
Product "Milk" Variant "1L"
├─ stock_quantity: 100
└─ price: 5000 RWF

USER SELLS 5 LITERS:
├─ Create sale record
├─ Create 5 sale_item records (one per unit)
└─ Decrement stock: 100 - 5 = 95

AFTER SALE:
Product "Milk" Variant "1L"
├─ stock_quantity: 95
└─ price: 5000 RWF
```

**Update stock query:**
```typescript
await supabase
  .from('product_variants')
  .update({ stock_quantity: 95 })
  .eq('id', variantId)
  .eq('shop_id', shopId);
```

### Customer Credit Management

**Credit Flow:**

```
CUSTOMER "John"
├─ credit_limit: 50000 RWF (set by owner)
└─ credit_balance: 30000 RWF (owes shop)

JOHN BUYS 15000 RWF ON CREDIT:
├─ Create sale with payment_method = 'credit'
├─ Update credit_balance: 30000 + 15000 = 45000 RWF
└─ Alert: Credit balance near limit!

JOHN PAYS 20000 RWF:
├─ Create credit_payment record
├─ Update credit_balance: 45000 - 20000 = 25000 RWF
└─ Alert: Payment received!
```

### Expenses Table

**Used for tracking business expenses:**

```typescript
type Expense = {
  id: number;
  user_id: string;              // Which staff member recorded it
  expense_date: string;         // When it happened
  description: string;          // What it was for
  category: string;             // "Rent", "Utilities", "Supplies", etc.
  amount: number;               // How much
  receipt_url: string | null;   // Photo of receipt
  is_recurring: boolean;        // Does it repeat?
  recurrence_interval: string;  // "monthly", "weekly", etc.
  next_due_date: string | null; // When it repeats
  shop_id: string;              // Which shop
};
```

**Why recurrence fields?**
- Rent usually repeats monthly
- Utilities repeat monthly
- Supplies might repeat weekly
- send-reminder function can notify about upcoming recurring expenses

---

## 🔐 AUTHENTICATION FLOW

### Registration Flow

```
STEP 1: User fills registration form
┌──────────────────────┐
│ Email                │
│ Password             │
│ Full Name            │
│ Shop Name            │
│ Phone                │
└──────────────────────┘
         │
         ▼
STEP 2: Auth.tsx sends to Supabase
const { data, error } = await supabase.auth.signUp({
  email: 'john@example.com',
  password: 'securepassword123'
});
         │
         ▼
STEP 3: Supabase creates auth user
(JWT token stored in browser)
         │
         ▼
STEP 4: Frontend calls onboard-new-shop function
fetch('/functions/v1/onboard-new-shop', {
  email: 'john@example.com',
  full_name: 'John Doe',
  shop_name: 'John\'s Store'
})
         │
         ▼
STEP 5: Function creates profile & shop records
INSERT INTO profiles (...) 
INSERT INTO shops (...)
         │
         ▼
STEP 6: User redirected to Dashboard
(Profile loaded, dashboard shows)
```

### Login Flow

```
STEP 1: User enters email & password
         │
         ▼
STEP 2: Auth.tsx calls supabase.auth.signInWithPassword()
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'john@example.com',
  password: 'securepassword123'
});
         │
         ▼
STEP 3: Supabase validates & returns JWT token
(Token stored in browser automatically)
         │
         ▼
STEP 4: App.tsx gets session
const { data: { session } } = await supabase.auth.getSession();
         │
         ▼
STEP 5: Fetch user profile from database
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();
         │
         ▼
STEP 6: Dashboard rendered with profile
```

### Session Management

**Supabase stores JWT in:**
- `localStorage` (for web)
- `AsyncStorage` (for mobile)
- Automatically sent with every request

**Never manually manage tokens!**
```typescript
// ❌ WRONG - Don't do this
const token = localStorage.getItem('token');
const response = await fetch('/api/products', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// ✅ RIGHT - Supabase handles it
const response = await supabase
  .from('products')
  .select('*');
```

### Logout

```typescript
const handleLogout = async () => {
  await supabase.auth.signOut();
  window.location.reload(); // Refresh page
};
```

**What happens:**
1. Token removed from browser
2. Session cleared
3. Page reloads
4. App.tsx sees no session
5. User sent to Auth page

---

## 📊 DATA FLOW EXAMPLES

### Example 1: Processing a Sale

```
USER IN POS COMPONENT
│
├─ State: cart = [
│    { product_id: 1, variant_id: 5, quantity: 3, price: 10000 },
│    { product_id: 2, variant_id: 8, quantity: 1, price: 25000 }
│  ]
├─ Selected customer: John (id: 123)
├─ Payment method: credit
│
└─ Clicks "Complete Sale"
   │
   ├─ Prepare payload:
   │  {
   │    shop_id: "abc-123",
   │    customer_id: 123,
   │    total_amount: 55000,
   │    payment_method: "credit",
   │    items: [
   │      { product_id: 1, variant_id: 5, quantity: 3, price_at_sale: 10000 },
   │      { product_id: 2, variant_id: 8, quantity: 1, price_at_sale: 25000 }
   │    ]
   │  }
   │
   └─ Call complete-sale function ──────────────────┐
                                                    │
                        ┌───────────────────────────┘
                        │
                        ▼
                  EDGE FUNCTION
                        │
                        ├─ Validate user has permission
                        ├─ Check product stock
                        ├─ Check customer credit limit
                        │
                        ├─ INSERT into sales table
                        │  (get sale_id = 999)
                        │
                        ├─ INSERT into sale_items table (2 rows)
                        │
                        ├─ UPDATE product_variants
                        │  ├─ product_id:1, variant_id:5 → stock: 97
                        │  └─ product_id:2, variant_id:8 → stock: 19
                        │
                        ├─ UPDATE customers
                        │  └─ customer_id:123 → credit_balance: 55000
                        │
                        └─ RETURN { success: true, sale_id: 999 }
                        │
        ┌───────────────┘
        │
        ▼
    REACT COMPONENT
        │
        ├─ setLastSale(saleData)
        ├─ setIsReceiptModalOpen(true)
        ├─ setCart([])  // Clear cart
        ├─ Show toast: "Sale completed successfully!"
        │
        └─ USER SEES RECEIPT
           With items, total, and sale ID #999
```

### Example 2: Inviting Staff Member

```
OWNER IN STAFF MANAGEMENT PAGE
│
├─ Enters phone number: "+250788123456"
├─ Enters name: "James"
├─ Enters role: "cashier"
│
└─ Clicks "Send Invite"
   │
   ├─ Prepare payload:
   │  {
   │    shop_id: "abc-123",
   │    phone: "+250788123456",
   │    name: "James",
   │    role: "cashier"
   │  }
   │
   └─ Call invite-staff function ────────────────┐
                                                 │
                         ┌───────────────────────┘
                         │
                         ▼
                   EDGE FUNCTION
                         │
                         ├─ Validate owner has permission
                         │
                         ├─ Create auth user
                         │  └─ Generate temporary password
                         │
                         ├─ CREATE profile
                         │  {
                         │    id: (uuid from auth),
                         │    full_name: "James",
                         │    shop_id: "abc-123",
                         │    role: "cashier",
                         │    status: "active"
                         │  }
                         │
                         ├─ Send SMS via Twilio
                         │  "Hello James! You're invited to Till Rwanda POS.
                         │   Email: james@generated.com
                         │   Password: TempPass123!
                         │   Login at: till.app"
                         │
                         └─ RETURN { success: true, email: "james@..." }
                         │
         ┌───────────────┘
         │
         ▼
     REACT COMPONENT
         │
         ├─ Show toast: "Invite sent to +250788123456"
         └─ Refresh staff list
            (James appears in staff table)
```

### Example 3: Viewing Credit Aging Report

```
OWNER CLICKS "CREDIT AGING" IN MENU
│
└─ CreditAgingReport.tsx loads
   │
   ├─ FETCH from customers table
   │  .select('*')
   │  .eq('shop_id', shopId)
   │  .gt('credit_balance', 0)  // Only customers who owe money
   │
   └─ For each customer, calculate AGE:
      ├─ Query sales table
      │  Find LAST sale for this customer
      │  Calculate days_since_last_transaction
      │
      └─ Display table:
         ┌────────────┬──────────┬────────────┬─────────┐
         │ Customer   │ Balance  │ Last Sale  │ Days    │
         ├────────────┼──────────┼────────────┼─────────┤
         │ John       │ 45,000   │ 2025-11-10 │ 4 days  │
         │ Mary       │ 120,000  │ 2025-10-20 │ 25 days │
         │ Peter      │ 5,000    │ 2025-08-15 │ 91 days │
         └────────────┴──────────┴────────────┴─────────┘
         
         RED FLAG: Peter owes money for 91 days! Owner should follow up.
```

---

## 🎯 COMMON PATTERNS & BEST PRACTICES

### 1. Always Include shop_id

```typescript
// ❌ WRONG - Could fetch another shop's data!
const { data } = await supabase
  .from('products')
  .select('*');

// ✅ RIGHT - Only this shop's data
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('shop_id', shopId);
```

### 2. Async/Await Not .then()

```typescript
// ❌ WRONG - Callback hell
supabase
  .from('products')
  .select('*')
  .then(response => {
    const { data, error } = response;
    if (error) {
      // ...
    } else {
      setProducts(data);
    }
  })
  .catch(err => console.error(err));

// ✅ RIGHT - Clean, readable
try {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId);

  if (error) throw error;
  setProducts(data);
} catch (error) {
  console.error('Error fetching products:', error);
  toast.error('Failed to fetch products');
}
```

### 3. Loading & Error States

```typescript
const [products, setProducts] = useState<Product[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetch = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId);

      if (error) throw error;
      setProducts(data);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  fetch();
}, [shopId]);

// In JSX:
return (
  <>
    {isLoading && <div>Loading products...</div>}
    {error && <div className="text-red-600">{error}</div>}
    {products.length === 0 && !isLoading && <div>No products found</div>}
    {products.map(p => (
      <div key={p.id}>{p.name}</div>
    ))}
  </>
);
```

### 4. Controlled Components for Forms

```typescript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  phone: ''
});

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        ...formData,
        shop_id: shopId
      }]);

    if (error) throw error;
    toast.success('Customer added!');
    setFormData({ name: '', email: '', phone: '' });
  } catch (error) {
    toast.error('Failed to add customer');
  }
};

return (
  <form onSubmit={handleSubmit}>
    <input
      type="text"
      name="name"
      value={formData.name}
      onChange={handleChange}
      placeholder="Customer name"
    />
    <input
      type="email"
      name="email"
      value={formData.email}
      onChange={handleChange}
      placeholder="Email"
    />
    <button type="submit">Add Customer</button>
  </form>
);
```

### 5. Proper Error Handling

```typescript
try {
  const { data, error } = await supabase
    .from('sales')
    .insert([saleData]);

  if (error) {
    // Supabase error
    if (error.code === '23505') { // Unique constraint
      throw new Error('Sale with this ID already exists');
    } else if (error.code === '23503') { // Foreign key
      throw new Error('Customer or product not found');
    } else {
      throw error;
    }
  }

  return data;
} catch (error) {
  console.error('Sale error:', error);
  
  if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred');
  }
  
  throw error; // Rethrow if needed
}
```

### 6. Debouncing Search

```typescript
const [searchTerm, setSearchTerm] = useState('');
const [searchResults, setSearchResults] = useState<Product[]>([]);

useEffect(() => {
  const timeout = setTimeout(async () => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .ilike('name', `%${searchTerm}%`); // Case-insensitive search

    setSearchResults(data || []);
  }, 300); // Wait 300ms after user stops typing

  return () => clearTimeout(timeout);
}, [searchTerm, shopId]);

return (
  <>
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search products..."
    />
    {searchResults.map(p => (
      <div key={p.id}>{p.name}</div>
    ))}
  </>
);
```

---

## 🔧 TROUBLESHOOTING GUIDE

### Issue 1: Data from Wrong Shop

**Problem:** Seeing another shop's customers/products

**Solution:** Always filter by shop_id
```typescript
// Add this to every query:
.eq('shop_id', shopId)

// OR use RLS policies in Supabase to enforce this at database level
```

### Issue 2: Sale Not Processing

**Problem:** Complete sale function returns error

**Causes & Solutions:**
- ❌ Stock too low → Check `product_variants.stock_quantity`
- ❌ Customer credit exceeded → Check `customers.credit_balance` vs `credit_limit`
- ❌ Invalid variant ID → Ensure variant belongs to product
- ❌ Function error → Check browser console and Supabase function logs

**Debug:**
```typescript
console.log('Sale data:', saleData);
const response = await fetch('.../complete-sale', {
  method: 'POST',
  body: JSON.stringify(saleData)
});

const result = await response.json();
console.log('Response:', result);
if (!response.ok) {
  console.error('Error:', result);
}
```

### Issue 3: Profile Not Loading

**Problem:** Dashboard shows but profile is undefined

**Solution:**
```typescript
// Ensure profile query includes needed fields:
const { data: profile } = await supabase
  .from('profiles')
  .select(`
    *,
    shops (
      is_active,
      trial_ends_at
    )
  `)
  .eq('id', userId)
  .single();
```

### Issue 4: Modals Not Closing

**Problem:** Modal stays open after action

**Solution:** Ensure onClose is called
```typescript
// ❌ WRONG - Modal still open
const handleSubmit = async () => {
  await saveData();
  // Forgot to call onClose!
};

// ✅ RIGHT
const handleSubmit = async () => {
  await saveData();
  onClose(); // Close the modal
};
```

### Issue 5: Realtime Updates Not Working

**Problem:** Data on screen doesn't update when database changes

**Solution:** Enable Realtime subscription
```typescript
const subscription = supabase
  .channel(`products:${shopId}`)
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'products', filter: `shop_id=eq.${shopId}` },
    (payload) => {
      console.log('Product changed:', payload);
      // Refetch or update state
    }
  )
  .subscribe();

// Clean up on unmount:
return () => {
  supabase.removeChannel(subscription);
};
```

### Issue 6: SMS Not Sending (invite-staff)

**Problem:** Staff don't receive SMS

**Causes:**
- ❌ Twilio credentials invalid → Check `.env` variables
- ❌ Phone number invalid → Must include country code (+250 for Rwanda)
- ❌ Twilio account out of credits
- ❌ Twilio number not verified for development

**Debug:**
```typescript
// Add logging in Edge Function
console.log('Twilio request:', {
  phone: phoneNumber,
  message: messageText
});

const twilioResponse = await fetch(...);
const twilioData = await twilioResponse.json();
console.log('Twilio response:', twilioData);
```

### Issue 7: Performance Slow

**Problem:** App feels sluggish

**Solutions:**
- ❌ Fetching too much data → Use pagination
- ❌ No loading indicators → Show spinners
- ❌ Heavy computations on UI thread → Use Web Workers or move to function
- ❌ Too many re-renders → Check React DevTools

**Example pagination:**
```typescript
const [page, setPage] = useState(0);
const pageSize = 50;

const { data: sales } = await supabase
  .from('sales')
  .select('*', { count: 'exact' })
  .eq('shop_id', shopId)
  .order('created_at', { ascending: false })
  .range(page * pageSize, (page + 1) * pageSize - 1);
```

---

## 🚀 DEVELOPMENT WORKFLOW

### Setting Up Environment

**1. Clone repository**
```bash
git clone https://github.com/metaloys/Till-Rwanda-Pos-0.1.git
cd till_rwanda_app
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**

Create `.env.local` in project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**4. Start development server**
```bash
npm run dev
```

Open http://localhost:5173

### Common Development Tasks

**Add a new page:**

1. Create file: `src/pages/MyNewPage.tsx`
2. Add interface/props
3. Export component
4. Add to Dashboard navigation
5. Add route type

**Add a new Edge Function:**

1. Create directory: `supabase/functions/my-function/`
2. Create `index.ts` and `deno.json`
3. Write function code
4. Call from React using fetch

**Add a new database table:**

1. In Supabase dashboard, create table via UI
2. Or write SQL migration
3. Update `appTypes.ts` with TypeScript type
4. Create component to manage table

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/add-barcode-scanning

# Make changes
git add .
git commit -m "Add barcode scanning support"

# Push to GitHub
git push origin feature/add-barcode-scanning

# Create Pull Request on GitHub
# After review, merge to main
```

### Testing

**Manual Testing:**
1. Use test accounts for different roles
2. Test on mobile browser (Chrome DevTools)
3. Test in dark mode
4. Check console for errors

**Test Cases for POS:**
- ✅ Add 1 product to cart
- ✅ Add multiple items
- ✅ Apply discount to item
- ✅ Apply discount to cart
- ✅ Select customer with credit
- ✅ Complete cash sale
- ✅ Complete credit sale
- ✅ Print receipt
- ✅ Verify stock decremented
- ✅ Verify customer credit updated

### Building for Production

```bash
# Build minified version
npm run build

# Test production build locally
npm run preview

# Deploy (typically to Vercel)
# Vercel auto-deploys from GitHub
```

---

## 📝 QUICK REFERENCE

### Key Files & Their Purpose

| File | Purpose |
|------|---------|
| `src/App.tsx` | Auth check & routing |
| `src/Dashboard.tsx` | Main navigation & page switching |
| `src/supabaseClient.ts` | Supabase configuration |
| `src/appTypes.ts` | TypeScript type definitions |
| `src/Auth.tsx` | Login/registration UI |
| `src/pages/PointOfSale.tsx` | POS interface (MOST IMPORTANT) |
| `src/pages/Products.tsx` | Product management |
| `src/pages/Customers.tsx` | Customer management |
| `src/components/*.tsx` | Reusable components & modals |
| `supabase/functions/*/index.ts` | Backend logic |

### Common Queries Cheatsheet

```typescript
// Fetch all products for this shop
const { data } = await supabase
  .from('products')
  .select('*, product_variants(*)')
  .eq('shop_id', shopId);

// Insert new customer
const { data } = await supabase
  .from('customers')
  .insert([{ name, phone, shop_id: shopId }])
  .select();

// Update customer credit
const { data } = await supabase
  .from('customers')
  .update({ credit_balance: newBalance })
  .eq('id', customerId)
  .eq('shop_id', shopId)
  .select();

// Delete product (soft delete recommended)
const { data } = await supabase
  .from('products')
  .delete()
  .eq('id', productId)
  .eq('shop_id', shopId);

// Count records
const { count } = await supabase
  .from('sales')
  .select('*', { count: 'exact' })
  .eq('shop_id', shopId);

// Order by latest
const { data } = await supabase
  .from('sales')
  .select('*')
  .eq('shop_id', shopId)
  .order('created_at', { ascending: false })
  .limit(10);

// Filter by date range
const { data } = await supabase
  .from('sales')
  .select('*')
  .eq('shop_id', shopId)
  .gte('created_at', startDate)
  .lte('created_at', endDate);

// Text search
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('shop_id', shopId)
  .ilike('name', `%${searchTerm}%`);
```

### Useful Keyboard Shortcuts

- `Ctrl+K` or `Cmd+K` in VS Code: Command palette
- `Ctrl+Shift+F` or `Cmd+Shift+F`: Search across files
- `Ctrl+/` or `Cmd+/`: Toggle comment
- `F12` or `Cmd+Option+I`: Open DevTools

---

## 🎓 NEXT DEVELOPER SHOULD KNOW

**Before starting:**
1. Read this entire guide
2. Set up local development environment
3. Test all features manually
4. Review the code structure
5. Understand multi-tenancy concept

**First tasks:**
1. Create test account and explore UI
2. Trace through a complete sale flow
3. Read complete-sale Edge Function code
4. Understand how stock is decremented
5. Test creating/inviting staff

**Red Flags to Avoid:**
- ❌ Removing shop_id filter from queries
- ❌ Hardcoding URLs instead of using env vars
- ❌ Forgetting to close modals after action
- ❌ Using .then() instead of async/await
- ❌ Modifying authentication flow
- ❌ Direct SQL queries (use Supabase SDK)

---

## 📞 REFERENCES & RESOURCES

**Documentation:**
- Supabase Docs: https://supabase.com/docs
- React Docs: https://react.dev
- TypeScript Docs: https://www.typescriptlang.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Vite: https://vitejs.dev
- Deno: https://deno.com

**Key Concepts:**
- Multi-tenancy: https://en.wikipedia.org/wiki/Multitenancy
- JWT Authentication: https://jwt.io/introduction
- Atomic Operations: https://en.wikipedia.org/wiki/Atomicity_(database_systems)

---

**Last Updated:** November 14, 2025  
**Handover By:** Senior Developer  
**For:** New Developer Taking Over  

**NEXT DEVELOPER CHECKLIST:**
- [ ] Read this guide completely
- [ ] Set up environment locally
- [ ] Create test account
- [ ] Process first sale manually
- [ ] Review complete-sale function
- [ ] Test staff invitation
- [ ] Check product inventory update
- [ ] Verify customer credit update
- [ ] Explore database schema in Supabase
- [ ] Review all Edge Functions
- [ ] Set up git branches locally
- [ ] Make a small fix to test workflow

---
