# Till Rwanda POS - Application Documentation

**Version:** 0.2.0 (Security Hardened)  
**Last Updated:** November 14, 2025  
**Audience:** End Users, Business Owners, System Administrators

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Core Features Guide](#core-features-guide)
4. [Point of Sale Operations](#point-of-sale-operations)
5. [Inventory Management](#inventory-management)
6. [Customer Management](#customer-management)
7. [Reporting & Analytics](#reporting--analytics)
8. [Staff Management](#staff-management)
9. [Settings & Configuration](#settings--configuration)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First-Time Login

1. **Open Till Rwanda POS**: Navigate to your application URL
2. **Enter Credentials**: Use email and password provided during registration
3. **Select Shop** (if multi-shop user): Choose your business location
4. **Dashboard**: You'll see your Shop Overview dashboard

### Dashboard Overview

The main dashboard displays:
- **Quick Stats**: Total Sales Today, Customers, Pending Credit
- **Recent Transactions**: Last 5 sales
- **Outstanding Credit**: Customers who owe you money
- **Navigation Menu**: Access all features from the left sidebar

### Theme & Settings

- **Dark Mode**: Click the moon/sun icon in top-right corner
- **Profile**: Access user profile and password reset
- **Logout**: Safely exit the application

---

## User Roles & Permissions

### 👑 Owner
**Full system access and control**
- Manage all sales and inventory
- View all reports and analytics
- Manage staff members
- Modify shop settings
- Access financial reports
- View credit aging reports

### 👨‍💼 Manager
**Operational management access**
- Process sales (POS)
- Manage inventory and products
- View customer information
- Record customer credit/payments
- Generate reports
- Cannot manage staff or settings

### 💼 Cashier
**Sales processing only**
- Process sales (POS)
- View own transactions
- Cannot manage inventory
- Cannot manage customers
- Cannot view reports
- Cannot modify settings

### 🔧 Super Admin (Platform)
**Platform-wide administration**
- View all shops' metrics
- Manage subscription statuses
- Monitor platform health
- Access business management tools

---

## Core Features Guide

### 📊 Shop Overview Dashboard

**What You'll See:**
- Daily sales total
- Number of customers today
- Amount in outstanding credit
- Recent transactions list
- Top products

**What You Can Do:**
- Quick access to all features
- View trending products
- See customer payment status
- Monitor business metrics in real-time

**Tips:**
- Dashboard updates automatically every 30 seconds
- Pin important metrics to your view
- Export daily summary to PDF

---

## Point of Sale Operations

### Starting a Sale

1. **Click "New Sale (POS)"** in the sidebar
2. **Search for Products**: Type product name or code
3. **Add to Cart**: Select product and choose variant (if available)
4. **Set Quantity**: Enter number of items
5. **Review Cart**: Check total items and amount

### Processing Payment

1. **Select Payment Method**:
   - **Cash**: Count money received
   - **Mobile Money**: Enter transaction ID (MTN/Airtel)
   - **Bank Transfer**: Enter transaction reference
   - **Credit**: Customer pays later

2. **Apply Discounts** (Optional):
   - **Per Item**: Discount on specific items
   - **Cart Level**: Discount on entire purchase
   - Enter percentage (e.g., 10% = 10)

3. **Confirm Payment**:
   - Review final amount
   - Confirm payment method details
   - Complete transaction

4. **Receipt**:
   - View receipt on screen
   - Print receipt for customer
   - Email receipt (if enabled)

### Processing Returns

1. Navigate to **Sales History**
2. Find the original sale
3. Click **"Return Sale"**
4. Select items to return
5. Refund amount calculated automatically
6. Complete refund processing

**Return Policy:**
- Returns within 30 days only
- Original payment method must be available
- Restocking fee may apply (configured per shop)

---

## Inventory Management

### Adding Products

1. Navigate to **Products**
2. Click **"Add New Product"**
3. Enter:
   - **Product Name**: Descriptive name
   - **Category**: Choose category (or create new)
   - **Description**: Brief product description
   - **Image**: Upload product photo (optional)
   - **Has Variants**: Check if product has variants

4. Click **"Save Product"**

### Managing Product Variants

**For Products with Variants (sizes, colors, prices):**

1. Navigate to **Products**
2. Find product and click **"Manage Variants"**
3. Click **"Add Variant"**
4. Enter:
   - **Variant Name**: e.g., "Red - Size M"
   - **Attributes**: Size, Color, etc. (optional)
   - **Price**: Selling price
   - **Stock Quantity**: Current inventory count
   - **Image**: Variant-specific image (optional)

5. **Stock Updates**:
   - Automatically decrease when sold
   - Manually adjust using "Restock" button
   - Set low-stock alert threshold

### Organizing Products

**Categories:**
- Products organized by type
- Makes searching faster
- Required for reports

**Stock Management:**
- Track inventory levels
- Low-stock alerts (red flag)
- Restock notifications
- Bulk import/export (Admin only)

---

## Customer Management

### Adding New Customers

1. Navigate to **Customers**
2. Click **"Add New Customer"**
3. Enter:
   - **Full Name**: Customer's legal name
   - **Phone Number**: For SMS notifications
   - **Address**: Delivery/billing address
   - **Email**: Optional
   - **Credit Limit**: Maximum credit allowed (in RWF)

4. Click **"Save Customer"**

### Managing Customer Credit

**Recording Credit Sale:**
1. In POS, select **"Credit"** as payment method
2. Select customer from list
3. Complete sale
4. Amount added to customer's balance

**Recording Payment:**
1. Navigate to **Credit Payments**
2. Find customer
3. Click **"Record Payment"**
4. Enter:
   - **Payment Amount**: Amount paid
   - **Payment Method**: Cash, Mobile Money, Check
   - **Transaction Reference**: For tracking

5. Click **"Record"**

### Viewing Customer History

1. Navigate to **Customers**
2. Click on customer name
3. View:
   - Purchase history
   - Credit payments made
   - Outstanding balance
   - Contact information

---

## Reporting & Analytics

### 📈 Daily Summary Report

**Overview of Today's Business:**

1. Navigate to **Reports** → **Daily Summary**
2. View:
   - Total Sales: Amount and count
   - Total Expenses: By category
   - Net Profit: Sales minus expenses
   - Top Products: Best sellers today
   - Payment Methods: Breakdown of payment types

**Actions:**
- Export to PDF
- Email report
- Schedule daily email delivery

### 📊 Sales History

1. Navigate to **Sales History**
2. **Filters Available**:
   - Date Range: Select start and end date
   - Payment Method: Cash, Credit, Mobile Money
   - Cashier: Filter by staff member
   - Customer: Filter by customer

3. **Actions**:
   - View sale details
   - Print receipt
   - Process return
   - Export to Excel

### 💰 Expense Tracking

1. Navigate to **Expense Tracking**
2. **Add Expense**:
   - **Category**: Rent, Utilities, Supplies
   - **Amount**: In RWF
   - **Date**: When expense occurred
   - **Notes**: Description
   - **Receipt**: Upload receipt image (optional)

3. **View Expenses**:
   - Filter by date range
   - Filter by category
   - See total by category

### 💳 Credit Management

1. Navigate to **Credit Payments**
2. **View Credit Status**:
   - Customer names
   - Total amount owed
   - Payment history
   - Last payment date

3. **Send Payment Reminder**:
   - Click "Send Reminder"
   - SMS sent to customer
   - Email sent (if available)

### 📅 Credit Aging Report

Shows how old customer debts are:
- **0-7 Days**: Just given credit
- **8-30 Days**: Overdue by less than month
- **31-60 Days**: Significantly overdue
- **60+ Days**: Very overdue, follow up required

---

## Staff Management

### Adding Staff Members

1. Navigate to **Staff Management**
2. Click **"Invite Staff"**
3. Enter:
   - **Full Name**: Staff member name
   - **Email**: Work email address
   - **Phone**: Mobile number for SMS
   - **Role**: Owner, Manager, or Cashier
   - **Status**: Active/Inactive

4. **Invitation Sent**: Staff gets SMS/email with link to create account

### Managing Staff

**View Active Staff:**
- Name and role
- Last login
- Email and phone
- Account status

**Staff Actions:**
- **Deactivate**: Prevent login without deleting
- **Delete**: Permanently remove account
- **Change Role**: Update permissions
- **Reset Password**: Help with forgotten passwords

### Activity Tracking

Each transaction is tracked by:
- Cashier who processed it
- Date and time
- Amount and payment method
- Helps with accountability

---

## Settings & Configuration

### Shop Settings

1. Navigate to **Dashboard** → **Settings** (if available)
2. **Shop Information**:
   - Business name
   - Address
   - Phone number
   - Email
   - Logo/image

3. **Preferences**:
   - Receipt format
   - Currency (RWF)
   - Time zone
   - Notification preferences

4. **Subscription**:
   - Current plan
   - Trial end date (if applicable)
   - Active status

---

## Troubleshooting

### Common Issues

**"Network Error" when saving:**
- Check internet connection
- Refresh page (F5)
- Try again in a few moments

**Product doesn't appear in POS:**
- Ensure product is marked "Active"
- Check stock quantity (must be > 0)
- Product must be assigned to your shop

**Can't see another staff member's sales:**
- You may not have permission (Cashiers can only see own sales)
- Ask a Manager or Owner to check

**Customer credit not updating:**
- Ensure you selected "Credit" payment method
- Sale must be completed successfully
- Refresh page to see updated balance

### Getting Help

1. **In-App Support**: Click "Help" button (if available)
2. **Documentation**: Check this guide
3. **Contact Support**: Email support@till-rwanda.com
4. **Status Page**: Check for system issues

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` or `Cmd + N` | New Sale (POS) |
| `Ctrl + P` or `Cmd + P` | Print Receipt |
| `Ctrl + E` or `Cmd + E` | Export Report |
| `Escape` | Close Modal/Cancel |
| `Tab` | Move to next field |
| `Enter` | Confirm/Submit |

---

## Data Backup & Security

### Important Security Notes

1. **Session Timeout**: 
   - Auto-logout after 30 minutes of inactivity
   - Always logout when leaving computer

2. **Password Security**:
   - Use strong passwords (uppercase, lowercase, numbers, symbols)
   - Never share your login credentials
   - Change password regularly

3. **Data Backup**:
   - All data automatically backed up
   - Backup frequency: Daily
   - Retention: 30 days minimum

4. **Multi-Tenancy**:
   - Your shop's data is completely isolated
   - Cannot see other shops' data
   - Cannot modify other shops' records

---

## FAQs

### Q: Can I process sales offline?
**A:** Not in the current version. Internet connection required for all transactions.

### Q: How do I delete a customer?
**A:** Customers cannot be deleted (for record-keeping). Mark as "Inactive" instead.

### Q: Can I edit a completed sale?
**A:** No, to maintain data integrity. Process a return instead.

### Q: What's the credit limit for customers?
**A:** Set per customer (default: 50,000 RWF). Configure in customer profile.

### Q: How many staff members can I add?
**A:** Unlimited. But ensure proper role distribution.

### Q: Can receipts be customized?
**A:** Yes, in Shop Settings (if enabled). Contact admin to modify.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.2.0 | Nov 14, 2025 | Security hardening, UI modernization |
| 0.1.0 | Oct 2024 | Initial MVP release |

---

## Contact & Support

**Email:** support@till-rwanda.com  
**Phone:** +250 XXX XXX XXX  
**Website:** https://till-rwanda.com  
**GitHub Issues:** https://github.com/metaloys/Till-Rwanda-Pos-0.1/issues

---

**Last Updated:** November 14, 2025  
**Next Update Scheduled:** Q1 2026
