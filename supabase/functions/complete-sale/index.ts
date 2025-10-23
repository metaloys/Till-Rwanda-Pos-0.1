import { createClient } from 'npm:@supabase/supabase-js@^2.0';

interface SalePayload {
  shop_id: string;
  customer_id: number | null;
  payment_method: string;
  transaction_ref: string | null;
  discount_percent: number;
  items: Array<{
    variant_id: number;
    quantity: number;
  }>;
}

// Define the structure of our internal types
type ProductVariant = {
  id: number;
  product_id: number;
  price: number;
  stock_quantity: number;
  name: string | null;
  products: { name: string };
};

type CreditCheckResult = {
  success: boolean;
  message: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }); }
  if (req.method !== 'POST') { return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }

  try {
    const payload: SalePayload = await req.json();
    const { shop_id, customer_id, payment_method, transaction_ref, discount_percent, items } = payload;
    
    if (!shop_id || !items || items.length === 0) {
      throw new Error("Missing shop_id or sale items.");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server configuration error.");
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // --- CRITICAL: Get the user ID from the JWT for the cashier field ---
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    let cashierId: string | undefined;

    if (token) {
        // We use the admin client to verify and decode the JWT
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userData.user) {
            cashierId = userData.user.id;
        } else {
            console.warn("Could not retrieve user ID from token:", userError?.message);
        }
    }
    // --- END CRITICAL STEP ---


    // Fetch REAL prices and stock
    const variantIds = items.map(item => item.variant_id);
    const { data: variants, error: variantError } = await supabaseAdmin
      .from('product_variants')
      .select('id, product_id, price, stock_quantity, name, products( name )')
      .in('id', variantIds);

    if (variantError) throw new Error(`DB Error (Variants): ${variantError.message}`);
    if (!variants || variants.length !== items.length) { throw new Error("One or more products could not be found."); }
    
    let subtotal = 0;
    let finalSaleItems = [];
    let cartForReceipt = [];
    
    for (const item of items) {
      const variant = variants.find(v => v.id === item.variant_id) as ProductVariant;
      if (variant.stock_quantity < item.quantity) { throw new Error(`Not enough stock for variant ID ${item.variant_id}.`); }
      const itemPrice = variant.price;
      const finalPrice = itemPrice * (1 - discount_percent / 100);
      subtotal += itemPrice * item.quantity;
      
      finalSaleItems.push({
        shop_id: shop_id,
        product_id: variant.product_id,
        variant_id: variant.id,
        quantity: item.quantity,
        price_at_sale: itemPrice,
        discount_percentage: discount_percent,
      });
      
      const fullVariantName = `${variant.products.name} - ${variant.name}`;
      cartForReceipt.push({ name: fullVariantName, price: itemPrice, final_price: finalPrice, quantity: item.quantity });
    }
    
    const totalDiscount = subtotal * (discount_percent / 100);
    const finalTotal = subtotal - totalDiscount;

    if (payment_method === 'credit' && customer_id) {
        const { data: creditCheckData, error } = await supabaseAdmin.rpc('check_and_update_credit', { p_customer_id: customer_id, p_sale_amount: finalTotal });
        if (error) throw new Error(`Credit check failed: ${error.message}`);
        const result = creditCheckData[0] as CreditCheckResult; 
        if (!result || !result.success) { throw new Error(result.message || 'Credit check failed or was denied.'); }
    }

    // 6. Create the Sale record
    const { data: sale, error: saleError } = await supabaseAdmin
      .from('sales')
      .insert({
          total_amount: finalTotal,
          payment_method: payment_method,
          customer_id: customer_id,
          transaction_reference: transaction_ref,
          shop_id: shop_id,
          is_returned: false,
          cashier_id: cashierId, // <--- SAVING THE CASHIER ID
      })
      .select('id')
      .single();
      
    if (saleError || !sale) throw new Error(saleError?.message || 'Failed to create sale record');

    // 7. Link sale_items to the new sale
    const itemsWithSaleId = finalSaleItems.map(item => ({ ...item, sale_id: sale.id }));
    const { error: itemsError } = await supabaseAdmin.from('sale_items').insert(itemsWithSaleId);
    if (itemsError) throw new Error(itemsError.message);

    // 8. Update stock
    for (const item of items) {
      const { error: stockError } = await supabaseAdmin.rpc('update_stock', { variant_id_to_update: item.variant_id, quantity_change: -item.quantity });
      if (stockError) console.error(`Stock update error: ${stockError.message}`);
    }

    // 9. EBM SIMULATION
    console.log("--- EBM INVOICE SIMULATION (RRA VSDC API) ---");
    const ebmInvoice = { tin: "YOUR_SHOP_TIN_HERE", invoiceNumber: `SALE-${sale.id}`, date: new Date().toISOString(), items: cartForReceipt.map(item => ({ itemCode: item.name, quantity: item.quantity, unitPrice: item.price, total: item.quantity * item.price, taxCode: 'B' })), totalAmount: finalTotal };
    console.log(JSON.stringify(ebmInvoice, null, 2));
    console.log("--- SIMULATION END ---");

    // 10. Return success data to the app
    return new Response(JSON.stringify({ 
        success: true, saleId: sale.id,
        receiptDetails: { items: cartForReceipt, total: finalTotal, subtotal, discountAmount: totalDiscount, discountPercent: discount_percent, paymentMethod: payment_method, saleId: sale.id }
    }), { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 200 });

  } catch (error) {
    console.error('Sale Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 400 });
  }
});