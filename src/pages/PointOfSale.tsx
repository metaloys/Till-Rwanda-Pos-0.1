import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { ProductVariant, Customer, PaymentMethod, Profile, UserRole } from '../appTypes';
import { ShoppingCart, Trash2, UserPlus, CreditCard, AlertTriangle, X, DollarSign, Smartphone, Landmark, Tag, Search } from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';
import PaymentModal from '../components/PaymentModal';

const LOW_STOCK_THRESHOLD = 5;

type CartItemVariant = ProductVariant & { 
  quantity: number;
  discount_percentage: number; 
  final_price: number;
};

interface PointOfSaleProps {
  shopId: string;
  profile: Profile;
  userRole: UserRole;
}

export default function PointOfSale({ shopId }: PointOfSaleProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItemVariant[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSaleDetails, setLastSaleDetails] = useState<React.ComponentProps<typeof ReceiptModal>['saleDetails']>(null);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  
  const [cartDiscountPercent, setCartDiscountPercent] = useState(0); 
  const [searchTerm, setSearchTerm] = useState('');

  // --- UPDATED: fetchVariants now safely handles orphan variants ---
  async function fetchVariants() {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from('product_variants')
      .select('*, products(name, category, id)') 
      .gt('stock_quantity', 0)
      .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching items:", error.message);
    } else if (data) {
        const sellableItems: ProductVariant[] = data
            // --- FIX: Filter out variants whose parent product is null ---
            .filter(item => item.products !== null) 
            .map(item => {
                const productInfo = item.products as { name: string, category: string, id: number };
                return ({ ...item, product_id: productInfo.id, name: `${productInfo.name} - ${item.name || item.attribute_1 || ''}`}) as ProductVariant;
            });
        setVariants(sellableItems);
    }
    setLoadingProducts(false);
  }
  // --- END UPDATE ---

  async function fetchCustomers() { 
    setLoadingCustomers(true); 
    const { data, error } = await supabase.from('customers').select('*').order('name', { ascending: true }); 
    if (error) alert(error.message); 
    else if (data) setCustomers(data); 
    setLoadingCustomers(false);
  }
  
  useEffect(() => { 
    if (shopId) {
      fetchVariants(); 
      fetchCustomers(); 
    }
  }, [shopId]);

  const addToCart = (variantToAdd: ProductVariant) => {
    const existingItem = cart.find((item) => item.id === variantToAdd.id);
    const itemDiscount = cartDiscountPercent;
    const itemPrice = variantToAdd.price;
    const discountedPrice = itemPrice * (1 - itemDiscount / 100);

    if (existingItem) {
      if (existingItem.quantity + 1 > variantToAdd.stock_quantity) {
        alert(`Not enough stock for ${variantToAdd.name}.`); return;
      }
      setCart(cart.map((item) => item.id === variantToAdd.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...variantToAdd, quantity: 1, discount_percentage: itemDiscount, final_price: discountedPrice } as CartItemVariant]);
    }
  };

  const removeFromCart = (variantId: number) => { setCart(cart.filter((item) => item.id !== variantId)); };

  const subTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.final_price * item.quantity, 0);
  const totalDiscountAmount = subTotal - cartTotal;

  const filteredVariants = useMemo(() => {
    if (!searchTerm) return variants;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return variants.filter(v => v.name?.toLowerCase().includes(lowerCaseSearch) || v.attribute_1?.toLowerCase().includes(lowerCaseSearch) || v.attribute_2?.toLowerCase().includes(lowerCaseSearch));
  }, [variants, searchTerm]);

  const handleApplyDiscount = () => {
    if (cart.length === 0) return alert('Add items first.');
    const discountStr = prompt('Discount %:', cartDiscountPercent.toString());
    if (!discountStr) return; 
    const discount = parseFloat(discountStr);
    if (isNaN(discount) || discount < 0 || discount > 100) return alert('Invalid percentage.');
    const newCart = cart.map(item => {
        const discountedPrice = item.price * (1 - discount / 100);
        return { ...item, discount_percentage: discount, final_price: discountedPrice } as CartItemVariant;
    });
    setCartDiscountPercent(discount);
    setCart(newCart);
    alert(`Discount of ${discount}% applied.`);
  };

  const handleCheckout = async (paymentMethod: PaymentMethod, transactionRef: string | null) => {
    if (cart.length === 0) return alert('Cart is empty!');
    
    setShowPaymentModal(false); 
    setIsProcessing(true); 

    try {
        const payload = {
            shop_id: shopId,
            customer_id: selectedCustomerId,
            payment_method: paymentMethod,
            transaction_ref: transactionRef,
            discount_percent: cartDiscountPercent,
            items: cart.map(item => ({
                variant_id: item.id,
                quantity: item.quantity,
            })),
        };

        const { data, error } = await supabase.functions.invoke('complete-sale', {
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        });

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.error);

        const customerName = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : null;
        
        setLastSaleDetails({
            ...data.receiptDetails,
            customerName: customerName,
        });
        setShowReceipt(true);
        
        setCart([]);
        setCartDiscountPercent(0);
        setSelectedCustomerId(null);
        fetchVariants();

    } catch (error: any) {
        alert(`Sale failed: ${error.message}`);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleOpenPaymentModal = (method: PaymentMethod) => {
    if (cart.length === 0) return alert('Cart is empty!');
    setSelectedPaymentMethod(method);
    setShowPaymentModal(true);
  };
  
  const handleCompleteSaleCredit = async () => {
    if (cart.length === 0) return alert('Cart is empty!');
    if (!selectedCustomerId) return alert('Please select a customer for a credit sale.');
    
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;
    if (customer.credit_limit > 0 && (customer.credit_balance + cartTotal) > customer.credit_limit) {
        alert(`Credit limit exceeded for ${customer.name}.\nLimit: ${customer.credit_limit.toLocaleString()} RWF\nNew Balance would be: ${(customer.credit_balance + cartTotal).toLocaleString()} RWF`);
        return;
    }
    
    await handleCheckout('credit', null); 
  };

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-9rem)]">
      
      <div className="md:col-span-7 h-full overflow-y-auto rounded-lg bg-white p-4 shadow order-2 md:order-1">
        <h2 className="text-lg font-semibold text-gray-900">Products & Variants</h2>
        <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
        </div>
        
        {loadingProducts ? ( <p>Loading products...</p> ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredVariants.map((variant) => {
              const isLowStock = variant.stock_quantity <= LOW_STOCK_THRESHOLD;
              return (
                <button
                  key={variant.id}
                  onClick={() => addToCart(variant)}
                  className={` relative flex flex-col items-center justify-center rounded-lg border p-4 text-center shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${isLowStock ? 'border-red-300 bg-red-50 hover:border-red-500' : 'border-gray-200 bg-white hover:border-blue-500 hover:shadow-md'} `}
                >
                  {isLowStock && <AlertTriangle className="absolute top-2 right-2 h-4 w-4 text-red-500" />}
                  {variant.image_url ? (<img src={variant.image_url} alt={variant.name || 'Product'} className="mb-2 h-16 w-16 rounded object-cover"/>) : (<div className="mb-2 h-16 w-16 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">No Image</div>)}
                  <span className="font-semibold text-gray-800 text-sm">{variant.name}</span> 
                  <span className="mt-1 text-sm text-gray-500">{variant.price.toLocaleString()} RWF</span> 
                  <span className={`mt-1 text-xs ${isLowStock ? 'font-bold text-red-600' : 'text-blue-600'}`}> (Stock: {variant.stock_quantity}) </span> 
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="md:col-span-5 flex flex-col rounded-lg bg-white p-4 shadow order-1 md:order-2 md:h-full">
         <h2 className="flex items-center text-lg font-semibold text-gray-900"><ShoppingCart className="mr-2 h-5 w-5" /> Current Sale</h2>
         <div className="mt-4"><label htmlFor="customer-select" className="block text-sm font-medium text-gray-700">Select Customer</label><div className="mt-1 flex rounded-md shadow-sm"><select id="customer-select" value={selectedCustomerId ?? ''} onChange={(e) => setSelectedCustomerId(e.target.value ? parseInt(e.target.value) : null)} className="input-field flex-1 rounded-none rounded-l-md" disabled={loadingCustomers}><option value="">-- Walk-in / Cash Sale --</option>{loadingCustomers ? (<option disabled>Loading...</option>) : (customers.map((customer) => (<option key={customer.id} value={customer.id}>{customer.name} {customer.phone ? `(${customer.phone})` : ''} - Bal: {customer.credit_balance.toLocaleString()} RWF</option>)))}</select><button type="button" className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"><UserPlus className="h-5 w-5 text-gray-400" /><span>New</span></button></div></div>
        
        <div className="mt-4 flex-1 overflow-y-auto divide-y divide-gray-200">
           <div className="flex justify-end pr-2 text-xs font-semibold text-gray-500">Price | Final Price</div>
          {cart.length === 0 ? (<p className="flex h-full items-center justify-center text-gray-500">Cart is empty.</p>) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.quantity} x {item.price.toLocaleString()} RWF</p>
                </div>
                <div className='flex items-center gap-2'>
                  <p className="font-medium text-gray-800">{(item.price * (1 - cartDiscountPercent / 100) * item.quantity).toLocaleString()} RWF</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-auto border-t-2 border-dashed border-gray-200 pt-4">
          <div className="mb-2 flex items-center justify-between text-sm text-red-600"><span className="font-medium">Discount:</span><span className="font-bold">{cartDiscountPercent}% (-{totalDiscountAmount.toLocaleString()} RWF)</span></div>
          <div className="mb-2 flex items-center justify-between text-sm text-gray-600"><span className="font-medium">Subtotal:</span><span>{subTotal.toLocaleString()} RWF</span></div>
          <div className="mb-4 flex items-center justify-between text-xl font-bold text-gray-900"><span>Total Due:</span><span>{cartTotal.toLocaleString()} RWF</span></div>
          <button onClick={handleApplyDiscount} disabled={cart.length === 0 || isProcessing} className="mb-4 flex w-full items-center justify-center rounded-md bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-200 disabled:opacity-50"><Tag className="mr-2 h-4 w-4" /> Apply Discount ({cartDiscountPercent}%)</button>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleOpenPaymentModal('cash')} disabled={isProcessing || cart.length === 0} className="payment-button bg-green-600 hover:bg-green-500 text-white"><DollarSign className="mr-2 h-5 w-5" /> Cash</button>
              <button onClick={() => handleOpenPaymentModal('mtn_momo')} disabled={isProcessing || cart.length === 0} className="payment-button bg-yellow-500 hover:bg-yellow-400 text-black"><Smartphone className="mr-2 h-5 w-5" /> MTN MoMo</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleOpenPaymentModal('airtel_money')} disabled={isProcessing || cart.length === 0} className="payment-button bg-red-600 hover:bg-red-500 text-white"><Smartphone className="mr-2 h-5 w-5" /> Airtel Money</button>
              <button onClick={() => handleOpenPaymentModal('bank_transfer')} disabled={isProcessing || cart.length === 0} className="payment-button bg-blue-600 hover:bg-blue-500 text-white"><Landmark className="mr-2 h-5 w-5" /> Bank Transfer</button>
            </div>
            <button onClick={handleCompleteSaleCredit} disabled={isProcessing || cart.length === 0 || !selectedCustomerId} className="payment-button w-full bg-orange-600 hover:bg-orange-500 text-white disabled:bg-gray-400"><CreditCard className="mr-2 h-5 w-5" /> Pay Later (Credit)</button>
          </div>
        </div>
      </div>

      <ReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} saleDetails={lastSaleDetails} />
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleCheckout} 
        total={cartTotal}
        paymentMethod={selectedPaymentMethod}
        isProcessing={isProcessing}
      />
    </div>
  );
}