export type PaymentMethod = 'cash' | 'mtn_momo' | 'airtel_money' | 'bank_transfer' | 'credit';

export type Product = { id: number; created_at: string; name: string; category: string | null; image_url: string | null; has_variants: boolean; };
export type ProductVariant = { id: number; created_at: string; product_id: number; name: string | null; attribute_1: string | null; attribute_2: string | null; price: number; stock_quantity: number; image_url: string | null; };

export type CartItem = ProductVariant & { quantity: number; discount_percentage: number; final_price: number; };

export type Sale = { id?: number; created_at?: string; total_amount: number; payment_method: PaymentMethod; customer_id?: number | null; transaction_reference?: string | null; is_returned: boolean; };
export type SaleItem = { id?: number; sale_id: number; product_id: number; variant_id: number; quantity: number; price_at_sale: number; discount_percentage: number; };

export type Customer = { id: number; created_at: string; user_id: string; name: string; phone: string | null; address: string | null; credit_balance: number; credit_limit: number; };
export type Expense = { id: number; created_at: string; user_id: string; expense_date: string; description: string; category: string | null; amount: number; receipt_url: string | null; is_recurring: boolean; recurrence_interval: string | null; next_due_date: string | null; };
export type CreditPayment = { id: number; created_at: string; customer_id: number; payment_date: string; amount: number; payment_method: string; recorded_by: string; };

export type UserRole = 'owner' | 'manager' | 'cashier';

// ** UPDATED: Profile now includes shop_id **
export type Profile = {
  id: string; 
  created_at: string;
  full_name: string | null;
  shop_name: string | null;
  role: UserRole;
  shop_id: string | null; // <-- NEW REQUIRED FIELD
};