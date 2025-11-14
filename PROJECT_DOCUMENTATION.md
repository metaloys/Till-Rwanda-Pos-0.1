# Till Rwanda POS - Project Context & Status

**Last Updated:** November 14, 2025  
**Project Type:** EBM-Compliant Point of Sale System  
**Target Market:** Rwandan SMEs (Retail, Pharmacy, Supermarket, Restaurant)  
**Repository:** Till-Rwanda-Pos-0.1 (metaloys/Till-Rwanda-Pos-0.1)  
**Current Version:** 0.2

---

## 🎯 PROJECT OVERVIEW

**What This System Does:**
A comprehensive Point of Sale system designed for Rwandan small and medium enterprises (SMEs) that integrates with Rwanda Revenue Authority's EBM (Electronic Billing Machine) to simplify tax compliance. The system is multi-tenant, supporting multiple business types with role-based access control.

**Key Value Proposition:**
- Businesses manage inventory, sales, and staff in one unified system
- Multi-shop support with complete data isolation
- Role-based access control (Owner, Manager, Cashier, Super Admin)
- EBM integration for Rwanda Revenue Authority compliance (in progress)
- Automatic receipt generation and sales tracking
- Credit/payment management for customers
- Expense tracking and reporting
- Works for multiple business types (retail, pharmacy, restaurants, supermarkets)

**Business Model:**
- Multi-tenant SaaS architecture
- Subscription-based (tracked via `shops.trial_ends_at` and `shops.is_active`)
- Super Admin dashboard for platform management

---

## ✅ FEATURES CURRENTLY WORKING

### Authentication & User Management
- ✅ User registration and login via Supabase Auth
- ✅ Multi-tenant support with shop isolation
- ✅ Role-based access control (Owner, Manager, Cashier, Super Admin)
- ✅ Staff management (invite, deactivate, delete)
- ✅ User profile management
- ✅ Dark mode support with theme toggle
- ✅ Password reset functionality

### Product & Inventory Management
- ✅ Add/edit/delete products with variants
- ✅ Product categories
- ✅ Product images (with compression)
- ✅ Variant attributes (e.g., size, color)
- ✅ Stock tracking per variant
- ✅ Low stock alerts
- ✅ Variant pricing (different prices for different variants)

### Sales Processing
- ✅ Point of Sale (POS) interface with cart management
- ✅ Multiple payment methods (Cash, MTN Mobile Money, Airtel Money, Bank Transfer, Credit)
- ✅ Receipt generation and printing
- ✅ Discount application (per item and per cart)
- ✅ Sale completion via Edge Functions
- ✅ Transaction reference tracking
- ✅ Return tracking (is_returned flag)
- ✅ Cashier identification per sale

### Customer Management
- ✅ Customer records with contact information
- ✅ Customer credit management (credit limit, balance tracking)
- ✅ Customer purchase history tracking
- ✅ Customer contact information (name, phone, address)

### Payment Management
- ✅ Credit payment recording
- ✅ Multiple payment method support
- ✅ Payment history tracking
- ✅ Payment modal for recording customer payments

### Reporting & Analytics
- ✅ Sales History with filtering
- ✅ Daily Summary Reports
- ✅ Expense Tracking with categories and recurring expenses
- ✅ Credit Aging Report (customer credit overview)
- ✅ Shop Overview dashboard with key metrics
- ✅ Sales data visualization

### Multi-Tenant Features
- ✅ Complete business/shop isolation
- ✅ Separate data per tenant (shop_id on all records)
- ✅ Shop name display in UI
- ✅ Subscription status management
- ✅ Subscription expiration notifications

### Staff Management
- ✅ Staff invite via Twilio (SMS integration)
- ✅ Staff deactivation
- ✅ Staff deletion
- ✅ Role assignment (Owner, Manager, Cashier)
- ✅ View active staff members

### Admin Features
- ✅ Super Admin Dashboard
- ✅ Platform-wide metrics
- ✅ Multi-shop overview capability

---

## 🚧 FEATURES PARTIALLY COMPLETED

- 🔄 **EBM Integration**: Started but not complete - needs Rwanda Revenue Authority API integration
- 🔄 **Mobile Money Integration**: Payment methods added to system but actual payment processing not implemented
- 🔄 **Advanced Analytics**: Basic reports exist, need more advanced charting and insights
- 🔄 **Offline Mode**: No offline support yet - system requires internet connection
- 🔄 **Barcode Scanning**: Infrastructure ready but scanner integration incomplete

---

## ⏳ FEATURES NEEDED (Priority Order)

### Immediate Priority (v0.3)
- ⏳ Complete EBM integration with RRA API
- ⏳ Mobile money payment gateway integration (MTN, Airtel)
- ⏳ Barcode scanning support for faster checkout
- ⏳ Stock level alerts and reorder functionality
- ⏳ Inventory reports and adjustments

### For Pharmacy Support (v0.4)
- ⏳ Batch number tracking for medicines
- ⏳ Expiry date management with automated alerts
- ⏳ Prescription management system
- ⏳ Drug interaction warnings (optional)
- ⏳ Insurance integration (future)

### For Supermarket Support (v0.4)
- ⏳ Advanced barcode scanning
- ⏳ Weight-based items (scale integration)
- ⏳ Bulk pricing and promotional discounts
- ⏳ Multi-location stock transfers
- ⏳ Department-based inventory management
- ⏳ Shelf management

### For Restaurant Support (v0.5)
- ⏳ Table management and reservation system
- ⏳ Recipe/ingredient tracking and costing
- ⏳ Menu modifiers (add cheese, extra sauce, etc.)
- ⏳ Kitchen display system (KDS) integration
- ⏳ Order staging and ticket management

### Universal Improvements (v0.5+)
- ⏳ Mobile app (React Native) for Android/iOS
- ⏳ Offline mode with data sync
- ⏳ WhatsApp notifications for orders/receipts
- ⏳ Advanced analytics dashboard with trends
- ⏳ Inventory forecasting
- ⏳ Customer loyalty program
- ⏳ SMS receipt delivery
- ⏳ API for third-party integrations

---

## 📁 PROJECT STRUCTURE

```
till_rwanda_app/
├── src/                        # Frontend (React + TypeScript)
│   ├── components/             # Reusable UI components
│   │   ├── AppLayout.tsx
│   │   ├── PaymentModal.tsx
│   │   ├── ReceiptModal.tsx
│   │   ├── ProductVariantModal.tsx
│   │   ├── ConfirmModal.tsx
│   │   ├── QuantityModal.tsx
│   │   ├── CustomerHistoryModal.tsx
│   │   ├── RestockModal.tsx
│   │   ├── SaleDetailsModal.tsx
│   │   ├── RecordPaymentModal.tsx
│   │   ├── ApplyDiscountModal.tsx
│   │   └── ThemeToggle.tsx
│   │
│   ├── pages/                  # Page components
│   │   ├── Overview.tsx        # Shop overview dashboard
│   │   ├── PointOfSale.tsx     # POS interface
│   │   ├── Products.tsx        # Product management
│   │   ├── Customers.tsx       # Customer management
│   │   ├── CreditManagement.tsx # Credit payment management
│   │   ├── SalesHistory.tsx    # Sales records
│   │   ├── ExpenseTracking.tsx # Expense management
│   │   ├── Reports.tsx         # Daily summary reports
│   │   ├── CreditAgingReport.tsx # Customer credit aging
│   │   ├── StaffManagement.tsx # Staff management
│   │   ├── SuperAdminDashboard.tsx # Platform admin view
│   │   ├── SubscriptionExpired.tsx # Subscription notice
│   │   └── ResetPassword.tsx   # Password reset
│   │
│   ├── App.tsx                 # Main app component
│   ├── Dashboard.tsx           # Main dashboard with navigation
│   ├── Auth.tsx                # Auth component
│   ├── supabaseClient.ts       # Supabase configuration
│   ├── appTypes.ts             # TypeScript type definitions
│   ├── main.tsx                # Entry point
│   ├── index.css               # Global styles
│   └── App.css                 # App-specific styles
│
├── supabase/                   # Backend (Supabase Edge Functions)
│   ├── config.toml             # Supabase configuration
│   ├── seed.sql                # Database seed data
│   ├── tailwind.config.js      # Tailwind configuration
│   │
│   └── functions/              # Edge Functions (Deno)
│       ├── complete-sale/      # Process sales transactions
│       ├── invite-staff/       # Send staff invitations
│       ├── delete-staff/       # Delete staff members
│       ├── toggle-staff-status/# Activate/deactivate staff
│       ├── onboard-new-shop/   # Onboard new business
│       └── send-reminder/      # Send notifications
│
├── public/                     # Static assets
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── eslint.config.js            # ESLint configuration
├── package.json                # Dependencies
└── PROJECT_DOCUMENTATION.md    # This file
```

---

## 🗄️ DATABASE SCHEMA (Supabase PostgreSQL)

### Core Tables:

**profiles**
- `id` (uuid, PK) - User ID from auth.users
- `created_at` (timestamp)
- `full_name` (text)
- `shop_id` (uuid, FK → shops.id)
- `shop_name` (text)
- `role` (enum: 'owner', 'manager', 'cashier')
- `is_super_admin` (boolean) - Platform admin flag
- `status` (enum: 'active', 'deactivated')
- `deactivated_at` (timestamp, nullable)

**shops** (tenants)
- `id` (uuid, PK)
- `owner_id` (uuid, FK → auth.users)
- `name` (text)
- `phone` (text, nullable)
- `email` (text, nullable)
- `address` (text, nullable)
- `created_at` (timestamp)
- `is_active` (boolean) - Subscription active
- `trial_ends_at` (timestamp, nullable) - Trial/subscription expiration

**products**
- `id` (bigint, PK)
- `created_at` (timestamp)
- `name` (text)
- `category` (text, nullable)
- `image_url` (text, nullable)
- `has_variants` (boolean)
- `shop_id` (uuid, FK → shops.id)

**product_variants**
- `id` (bigint, PK)
- `created_at` (timestamp)
- `product_id` (bigint, FK → products.id)
- `name` (text, nullable)
- `attribute_1` (text, nullable)
- `attribute_2` (text, nullable)
- `price` (numeric)
- `stock_quantity` (integer)
- `image_url` (text, nullable)

**sales**
- `id` (bigint, PK)
- `created_at` (timestamp)
- `total_amount` (numeric)
- `payment_method` (enum: 'cash', 'mtn_momo', 'airtel_money', 'bank_transfer', 'credit')
- `customer_id` (bigint, FK → customers.id, nullable)
- `transaction_reference` (text, nullable)
- `is_returned` (boolean)
- `shop_id` (uuid, FK → shops.id)
- `cashier_id` (uuid, FK → profiles.id, nullable)

**sale_items**
- `id` (bigint, PK)
- `sale_id` (bigint, FK → sales.id)
- `product_id` (bigint, FK → products.id)
- `variant_id` (bigint, FK → product_variants.id)
- `quantity` (integer)
- `price_at_sale` (numeric)
- `discount_percentage` (numeric)
- `shop_id` (uuid, FK → shops.id)

**customers**
- `id` (bigint, PK)
- `created_at` (timestamp)
- `user_id` (uuid, FK → profiles.id)
- `name` (text)
- `phone` (text, nullable)
- `address` (text, nullable)
- `credit_balance` (numeric)
- `credit_limit` (numeric)
- `shop_id` (uuid, FK → shops.id)

**credit_payments**
- `id` (bigint, PK)
- `created_at` (timestamp)
- `customer_id` (bigint, FK → customers.id)
- `payment_date` (date)
- `amount` (numeric)
- `payment_method` (text)
- `recorded_by_id` (uuid, FK → profiles.id)
- `shop_id` (uuid, FK → shops.id)

**expenses**
- `id` (bigint, PK)
- `created_at` (timestamp)
- `user_id` (uuid, FK → profiles.id)
- `expense_date` (date)
- `description` (text)
- `category` (text, nullable)
- `amount` (numeric)
- `receipt_url` (text, nullable)
- `is_recurring` (boolean)
- `recurrence_interval` (text, nullable)
- `next_due_date` (date, nullable)
- `shop_id` (uuid, FK → shops.id)

**Note:** All tables include `shop_id` for complete data isolation in multi-tenant architecture.

---

## 📦 TECH STACK

**Frontend:**
- **Framework**: React 19.1.1 with TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7
- **Styling**: Tailwind CSS 4.1.15 with dark mode support
- **UI Icons**: Lucide React 0.546.0
- **Backend-as-a-Service**: Supabase (@supabase/supabase-js 2.76.1)
- **Notifications**: React Hot Toast 2.6.0
- **Image Optimization**: browser-image-compression 2.0.2
- **SMS Integration**: Twilio SDK 5.10.3
- **Utilities**: UUID 13.0.0
- **Package Manager**: npm

**Backend:**
- **Platform**: Supabase (PostgreSQL database)
- **Edge Functions**: Deno runtime for serverless functions
- **Authentication**: Supabase Auth (JWT-based)
- **Realtime**: Supabase Realtime subscriptions available
- **Database**: PostgreSQL 17

**Development Tools:**
- **Linting**: ESLint 9.36.0 with TypeScript support
- **Type Checking**: TypeScript compiler
- **Language**: ECMAScript modules (type: "module")

**Deployment:** (To be configured)
- Frontend: Vercel/Netlify (recommended)
- Backend: Supabase Cloud
- Database: Supabase Cloud (PostgreSQL)

---

## 🎨 DESIGN SYSTEM

**Color Palette:**
- **Primary**: Indigo (indigo-600) - Main brand color
- **Primary Dark**: Indigo-500 (dark mode)
- **Secondary**: Blue (blue-500) - Accents
- **Success**: Green
- **Warning**: Orange/Yellow
- **Error**: Red-600
- **Neutral**: Slate (50, 100, 200, 400, 500, 600, 700, 800, 900)

**Typography:**
- **Font Family**: System fonts (Tailwind default)
- **Headings**: Bold weight (font-bold, font-black)
- **Body**: Regular weight
- **Small Text**: font-semibold for emphasis

**Design Style:**
- Modern, minimal interface with focus on usability
- Responsive design (mobile-first approach)
- Dark mode support throughout
- Gradient accents for primary actions
- Clear visual hierarchy with strategic color usage
- Tailwind utility classes (no custom CSS files except globals)

**UI Patterns:**
- Modal dialogs for forms and confirmations
- Responsive sidebar navigation (hidden on mobile)
- Sticky header with breadcrumbs
- Card-based layouts
- Toast notifications for feedback
- Gradient buttons for primary actions

---

## 🔗 INTEGRATIONS

**Currently Implemented:**
- ✅ Supabase (Database, Auth, Edge Functions)
- ✅ Twilio (SMS for staff invitations)
- ✅ React Hot Toast (Notifications)

**Planned/Partially Implemented:**
- 🔄 Rwanda Revenue Authority EBM API (not yet live)
- 🔄 MTN Mobile Money API
- 🔄 Airtel Money API
- 🔄 Bank transfer systems
- ⏳ WhatsApp Business API (for receipts/notifications)
- ⏳ Google Analytics (tracking)
- ⏳ Stripe/Payment Gateway (optional)
- ⏳ Email service (SendGrid/Mailgun)

---

## ⚠️ KNOWN ISSUES & NOTES

### Critical Items:
1. **Subscription Check**: Line 32 in Dashboard.tsx - `isSubscriptionActive` must be passed to all sub-components that need it. Currently only checked in Dashboard, not in individual page components.
2. **EBM Integration**: Not yet complete - RRA API integration needed
3. **Mobile Money**: Payment methods defined but gateway not implemented

### Potential Issues to Address:
1. Overview page doesn't receive profile props - may need subscription check
2. SuperAdminDashboard may need additional implementation
3. Edge Functions need error handling improvements
4. Implement offline mode with service workers
5. Add comprehensive logging for transactions

### Code Quality Notes:
- Type definitions in `appTypes.ts` are well-structured
- Multi-tenant data isolation is properly implemented
- Dark mode implementation is thorough
- Error handling could be improved in some modals

---

## 🎯 CURRENT PRIORITY

**What We're Working On Now:**
1. Stabilizing core POS functionality
2. Ensuring multi-tenant data isolation is bulletproof
3. Subscription management improvements

**Next Steps (Recommended):**
1. Complete EBM integration for Rwanda Revenue Authority compliance
2. Implement mobile money payment processing
3. Add barcode scanning support
4. Create mobile app (React Native)
5. Implement offline mode with sync
6. Add advanced analytics and reporting
7. Build pharmacy-specific features (batch/expiry tracking)
8. Build supermarket features (bulk pricing, multi-location)

---

## 💡 IMPORTANT NOTES FOR NEW AI SESSIONS

### Code Style Preferences:
- **Components**: Use functional components with hooks only (no class components)
- **Async Operations**: Use async/await, not .then() chains
- **Styling**: Tailwind utility classes exclusively - no custom CSS unless absolutely necessary
- **State Management**: React hooks (useState, useContext) - no external state library currently
- **Imports**: Use relative imports for same-level files, absolute imports for utilities
- **Typing**: Always use TypeScript types, define interfaces for all components and data structures

### Architecture Decisions:
- **Multi-Tenant**: ALL data queries must filter by `shop_id` for security
- **Authentication**: Handled by Supabase Auth - use `supabase.auth.getSession()`
- **Database Queries**: Use Supabase `.select()`, `.insert()`, `.update()`, `.delete()` methods
- **API Routes**: Edge Functions use REST endpoints - call via `fetch()` or Supabase client
- **Dark Mode**: Use `dark:` prefix in Tailwind - implemented via system preference or manual toggle
- **Responsive Design**: Mobile-first approach with `md:` breakpoint for tablet/desktop

### Critical Patterns to Maintain:
- All responses must check `isSubscriptionActive` before rendering features
- Always include `shop_id` when reading/writing data to maintain multi-tenancy
- Modals should be controlled components (open/close state managed by parent)
- Toast notifications for success/error feedback
- Use `<ConfirmModal>` for destructive actions

### Don't Change:
- Supabase project ID: "till_rwanda_app"
- Authentication flow (should remain Supabase-based)
- Database schema relationships (maintain foreign keys and data integrity)
- Role-based access permissions (Owner > Manager > Cashier > Super Admin)
- The concept of shops as isolated tenants

### Testing Instructions:

**Prerequisites:**
- Node.js 18+ and npm installed
- Supabase account (cloud or local setup)
- Environment variables configured

**Running Locally:**
```bash
# Install dependencies
npm install

# Set up Supabase (if using local)
supabase start

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

**Test Accounts:**
- Super Admin: [Set up in Supabase]
- Shop Owner: [Create via registration flow]
- Manager: [Invite via staff management]
- Cashier: [Invite via staff management]

**Common Commands:**
```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run lint         # Check for linting errors
npm run preview      # Preview production build
```

---

## 📞 GITHUB REPOSITORY

**URL:** https://github.com/metaloys/Till-Rwanda-Pos-0.1  
**Owner:** metaloys  
**Repository Name:** Till-Rwanda-Pos-0.1

**Branch Structure:**
- `main`: Production-ready code (current)
- `development`: Active development branch (if created)
- `feature/*`: Feature branches for specific features
- `bugfix/*`: Bug fix branches

**How to Contribute:**
1. Clone the repo: `git clone https://github.com/metaloys/Till-Rwanda-Pos-0.1.git`
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes and commit: `git commit -m "Add your feature"`
4. Push to GitHub: `git push origin feature/your-feature`
5. Create Pull Request on GitHub

---

## 🚀 ENVIRONMENT SETUP

**Required Environment Variables (.env or .env.local):**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Twilio Configuration (for SMS)
VITE_TWILIO_ACCOUNT_SID=your-account-sid
VITE_TWILIO_AUTH_TOKEN=your-auth-token
VITE_TWILIO_PHONE_NUMBER=+your-twilio-number

# Optional
VITE_APP_URL=http://localhost:5173
```

**Supabase Setup:**
1. Create account at supabase.com
2. Create new project
3. Run seed.sql in SQL editor to create tables
4. Configure authentication methods
5. Copy project URL and anon key to .env

---

## 📊 PROJECT STATS

- **Lines of Code**: ~2000+ (frontend)
- **Number of Pages**: 13 page components
- **Number of Components**: 12+ reusable components
- **Number of Edge Functions**: 6 serverless functions
- **Database Tables**: 9 core tables
- **Current Version**: 0.2
- **Last Updated**: November 14, 2025

---

## 💾 SAVE THIS FILE

**⚠️ IMPORTANT:** Paste this documentation at the start of **EVERY new AI/LLM chat session** to maintain consistent context and ensure the AI understands your project structure, decisions, and requirements.

This document should be updated whenever:
- New features are added
- Database schema changes
- Dependencies are upgraded
- Architecture decisions are made
- New integrations are added
- Major bugs are fixed

---

**Project maintained by:** metaloys  
**Last maintained:** November 14, 2025
