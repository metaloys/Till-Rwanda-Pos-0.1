# **Till Rwanda POS: A Multi-Tenant Retail Management System**

The **Till Rwanda POS** is a Progressive Web Application (PWA) designed for inventory and credit management in small to medium-sized retail operations in the Rwandan market. It features robust authentication, specialized credit workflow logic, and real-time stock management.

## **Status: v0.1 (MVP Complete)** 🎉

This version represents the initial stable release with all core features required for daily operation and essential local compliance (credit tracking).

| Component | Technology | Status |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Tailwind | Stable |
| **Backend/DB** | Supabase (PostgreSQL) | Stable |
| **Core Feature** | Product Variants, RLS (Ready) | Complete |
| **Critical Function** | Live WhatsApp Reminders (Twilio) | Complete |
| **Access Control** | Owner, Manager, Cashier Roles | Complete |
| **Developed by** | Invoza Ltd. | |

-----

## **Technical Architecture & Key Features**

### **Core Data Model & Persistence**

  * **Product Variants:** The database utilizes a two-tier model (`products` ➡️ `product_variants`). Price and stock are decoupled to `product_variants` to support complex inventory (e.g., Size, Color).
  * **Data Integrity:** Stock adjustments are handled via a PostgreSQL Remote Procedure Call (**RPC**), `update_stock(variant_id, quantity_change)`, which centralizes the stock logic and prevents race conditions during simultaneous sales or returns.
  * **Financial Segregation:** Separate tables track transactional data: `sales`, `sale_items`, `expenses`, and `credit_payments`.

### **Specialized Rwandan Workflow**

  * **Credit Management:** Implements **Credit Limits** and tracks **Credit Aging** (based on last transaction date).
  * **Live Reminders:** Uses a **Supabase Edge Function** (`send-reminder`) securely integrated with **Twilio** to send non-intrusive, culturally appropriate debt reminders without exposing API keys to the client.
  * **Payment Tracking:** Supports and logs multiple local payment channels (MTN MoMo, Airtel Money, Bank Transfer, Cash, Credit) with optional Transaction Reference capture.

### **Authentication & Authorization**

  * **Role-Based Access Control (RBAC):** Access is controlled by roles stored in the `profiles` table.
      * **Owner:** Full CRUD access and Staff Management.
      * **Manager:** Financial/Inventory/Customer management.
      * **Cashier:** Restricted to **POS (New Sale)** and **Sales History** only.
  * **Profile Linkage:** A PostgreSQL trigger automatically creates a `cashier` profile for every new user signing into `auth.users`.

-----

## **Getting Started (Local Development)**

### **Prerequisites**

  * Node.js (v18+)
  * Supabase CLI (for local function management)
  * Twilio Account (for live reminder testing)

### **Setup & Deployment**

1.  **Clone the Repository:**

    ```bash
    git clone [YOUR_REPO_URL] till-rwanda-pos
    cd till-rwanda-pos
    npm install
    ```

2.  **Initialize Supabase:** Link your local CLI to your remote Supabase Project ID and run local setup.

    ```bash
    npx supabase login --token YOUR_ACCESS_TOKEN
    npx supabase link --project-ref YOUR_PROJECT_ID
    # Run all necessary SQL migrations (tables, functions, triggers) in the Dashboard SQL Editor.
    ```

3.  **Secure Secrets & Deploy Function:** Set Twilio and the internal service role key as Supabase secrets.

    ```bash
    # Set the Service Role Key with a custom name
    npx supabase secrets set APP_SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"

    # Set Twilio secrets
    npx supabase secrets set TWILIO_ACCOUNT_SID="YOUR_TWILIO_SID"
    npx supabase secrets set TWILIO_AUTH_TOKEN="YOUR_TWILIO_TOKEN"
    npx supabase secrets set TWILIO_WHATSAPP_NUMBER="whatsapp:+1..." # Twilio Sender

    # Deploy the Edge Function
    npx supabase functions deploy send-reminder --no-verify-jwt
    ```

4.  **Run Application:**

    ```bash
    npm run dev
    ```

-----

## **Security Note: Going Live** ⚠️

The **most critical step** before production deployment is enforcing data isolation.

You **must** enable and configure **Row Level Security (RLS)** on all tables (`customers`, `products`, `sales`, `expenses`, etc.) to ensure that only rows matching the user's `user_id` (or `shop_name` when multi-tenant) are visible. This prevents cross-shop data leaks.

-----

## **Developer Information**

  * **Version Tag:** v0.1
  * **License:** Proprietary (Developed by Invoza Ltd.)