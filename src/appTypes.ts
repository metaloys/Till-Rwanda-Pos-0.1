// src/appTypes.ts
export type PaymentMethod = 'cash' | 'mtn_momo' | 'airtel_money' | 'bank_transfer' | 'credit';

export type Product = { id: number; created_at: string; name: string; category: string | null; image_url: string | null; has_variants: boolean; shop_id: string; };
export type ProductVariant = { id: number; created_at: string; product_id: number; name: string | null; attribute_1: string | null; attribute_2: string | null; price: number; stock_quantity: number; image_url: string | null; };

export type CartItem = ProductVariant & { quantity: number; discount_percentage: number; final_price: number; };

export type Sale = { id?: number; created_at?: string; total_amount: number; payment_method: PaymentMethod; customer_id?: number | null; transaction_reference?: string | null; is_returned?: boolean; shop_id: string; };
export type SaleItem = { id?: number; sale_id: number; product_id: number; variant_id: number; quantity: number; price_at_sale: number; discount_percentage: number; shop_id: string; };

export type Customer = { id: number; created_at: string; user_id: string; name: string; phone: string | null; address: string | null; credit_balance: number; credit_limit: number; shop_id: string; };
export type Expense = { id: number; created_at: string; user_id: string; expense_date: string; description: string; category: string | null; amount: number; receipt_url: string | null; is_recurring: boolean; recurrence_interval: string | null; next_due_date: string | null; shop_id: string; };
export type CreditPayment = { id: number; created_at: string; customer_id: number; payment_date: string; amount: number; payment_method: string; recorded_by: string; shop_id: string; };

export type UserRole = 'owner' | 'manager' | 'cashier';

// --- FIX: Add shop status fields to the Profile ---
export type Profile = {
  id: string; 
  created_at: string;
  full_name: string | null;
  shop_name: string | null;
  role: UserRole;
  is_super_admin: boolean;
  shop_id: string | null;
  // These fields will be JOINED from the 'shops' table
  is_active: boolean;
  trial_ends_at: string | null;
};