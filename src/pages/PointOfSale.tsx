import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { ProductVariant, Customer, PaymentMethod, Profile, UserRole } from '../appTypes';
import { ShoppingCart, Trash2, UserPlus, CreditCard, AlertTriangle, DollarSign, Smartphone, Landmark, Tag, Search } from 'lucide-react'; // FIX: Removed X
import ReceiptModal from '../components/ReceiptModal';
import PaymentModal from '../components/PaymentModal';
import ApplyDiscountModal from '../components/ApplyDiscountModal';
import QuantityModal from '../components/QuantityModal';
import { toast } from 'react-hot-toast';

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

export default function PointOfSale({ shopId, profile, userRole }: PointOfSaleProps) {
  // Log props to satisfy build
  console.log("POS loaded for:", profile.full_name, "Role:", userRole);

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
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [cartDiscountPercent, setCartDiscountPercent] = useState(0); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [selectedVariantForQuantity, setSelectedVariantForQuantity] = useState<ProductVariant | null>(null);
  const [showCartOnMobile, setShowCartOnMobile] = useState(false);

  async function fetchVariants() {
    setLoadingProducts(true);
    const { data, error } = await supabase.from('product_variants').select('*, products(name, category, id, shop_id)').eq('products.shop_id', shopId).gt('stock_quantity', 0).order('name', { ascending: true });
    if (error) { console.error("Error fetching items:", error.message); } 
    else if (data) {
        const sellableItems: ProductVariant[] = data.filter(item => item.products !== null).map(item => {
            const productInfo = item.products as { name: string, category: string, id: number };
            return ({ ...item, product_id: productInfo.id, name: `${productInfo.name} - ${item.name || item.attribute_1 || ''}`}) as ProductVariant;
        });
        setVariants(sellableItems);
    }
    setLoadingProducts(false);
  }

  async function fetchCustomers() { 
    setLoadingCustomers(true); 
    const { data, error } = await supabase.from('customers').select('*').eq('shop_id', shopId).order('name', { ascending: true }); 
    if (error) toast.error(error.message); 
    else if (data) setCustomers(data); 
    setLoadingCustomers(false);
  }
  
  useEffect(() => { if (shopId) { fetchVariants(); fetchCustomers(); } }, [shopId]);

  const addToCart = (variantToAdd: ProductVariant) => {
    const existingItem = cart.find((item) => item.id === variantToAdd.id);
    if (existingItem) {
      if (existingItem.quantity + 1 > variantToAdd.stock_quantity) { toast.error(`Not enough stock for ${variantToAdd.name}.`); return; }
      setCart(cart.map((item) => item.id === variantToAdd.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setSelectedVariantForQuantity(variantToAdd);
      setIsQuantityModalOpen(true);
    }
  };

  const handleConfirmQuantity = (quantity: number) => {
    if (!selectedVariantForQuantity) return;
    if (quantity > selectedVariantForQuantity.stock_quantity) { toast.error(`Not enough stock.`); return; }
    const itemDiscount = cartDiscountPercent;
    const itemPrice = selectedVariantForQuantity.price;
    const discountedPrice = itemPrice * (1 - itemDiscount / 100);
    setCart([...cart, { ...selectedVariantForQuantity, quantity: quantity, discount_percentage: itemDiscount, final_price: discountedPrice } as CartItemVariant]);
    setIsQuantityModalOpen(false);
    setSelectedVariantForQuantity(null);
  };

  const removeFromCart = (variantId: number) => { setCart(cart.filter((item) => item.id !== variantId)); };
  const subTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.final_price * item.quantity, 0);
  const totalDiscountAmount = subTotal - cartTotal;
  const filteredVariants = useMemo(() => { if (!searchTerm) return variants; const lowerCaseSearch = searchTerm.toLowerCase(); return variants.filter(v => v.name?.toLowerCase().includes(lowerCaseSearch) || v.attribute_1?.toLowerCase().includes(lowerCaseSearch) || v.attribute_2?.toLowerCase().includes(lowerCaseSearch)); }, [variants, searchTerm]);

  const handleApplyDiscount = (discount: number) => {
    if (isNaN(discount) || discount < 0 || discount > 100) { toast.error('Invalid percentage.'); return; }
    const newCart = cart.map(item => { const discountedPrice = item.price * (1 - discount / 100); return { ...item, discount_percentage: discount, final_price: discountedPrice } as CartItemVariant; });
    setCartDiscountPercent(discount);
    setCart(newCart);
    setShowDiscountModal(false);
    toast.success(`Discount of ${discount}% applied.`);
  };
  const handleOpenDiscountModal = () => { if (cart.length === 0) return toast.error('Add items to cart first.'); setShowDiscountModal(true); }

  const handleCheckout = async (paymentMethod: PaymentMethod, transactionRef: string | null) => {
    if (cart.length === 0) return toast.error('Cart is empty!');
    setShowPaymentModal(false); 
    setIsProcessing(true); 

    const payload = { shop_id: shopId, customer_id: selectedCustomerId, payment_method: paymentMethod, transaction_ref: transactionRef, discount_percent: cartDiscountPercent, items: cart.map(item => ({ variant_id: item.id, quantity: item.quantity, })), };
    const salePromise = supabase.functions.invoke('complete-sale', { body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' }, });

    toast.promise(salePromise, {
       loading: 'Processing Sale...',
       success: (response: any) => {
            if (response.data.error) throw new Error(response.data.error); 
            const customerName = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : null;
            setLastSaleDetails({ ...response.data.receiptDetails, customerName: customerName, });
            setShowReceipt(true); setCart([]); setCartDiscountPercent(0); setSelectedCustomerId(null); fetchVariants();
            setIsProcessing(false);
            return 'Sale Complete!';
       },
       error: (err) => {
            setIsProcessing(false);
            return `Sale failed: ${err.message}`;
       }
    });
  };

  const handleOpenPaymentModal = (method: PaymentMethod) => { if (cart.length === 0) return toast.error('Cart is empty!'); setSelectedPaymentMethod(method); setShowPaymentModal(true); };
  const handleCompleteSaleCredit = async () => { if (cart.length === 0) return toast.error('Cart is empty!'); if (!selectedCustomerId) return toast.error('Please select a customer.'); const customer = customers.find(c => c.id === selectedCustomerId); if (!customer) return toast.error("Customer not found."); if (customer.credit_limit > 0 && (customer.credit_balance + cartTotal) > customer.credit_limit) { toast.error(`Credit limit exceeded.\nLimit: ${customer.credit_limit.toLocaleString()} RWF`); return; } await handleCheckout('credit', null); };

  return (
    <div className="relative flex flex-col h-[calc(100vh-9rem)] gap-4 p-4">
      {/* Products Section - Full width on mobile, 7/12 on desktop */}
      <div className="md:hidden flex gap-2 mb-2">
        <button 
          onClick={() => setShowCartOnMobile(false)}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${!showCartOnMobile ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'}`}
        >
          Products
        </button>
        <button 
          onClick={() => setShowCartOnMobile(true)}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors relative ${showCartOnMobile ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'}`}
        >
          Cart {cart.length > 0 && <span className="absolute top-0 right-0 bg-danger-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{cart.length}</span>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Products Panel - Hidden on mobile if cart is shown */}
        <div className={`md:col-span-7 h-full overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-card ${showCartOnMobile ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-brand-600 pb-2">Products & Variants</h2>
          <div className="relative mt-4"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field w-full rounded-lg" /></div>
          {loadingProducts ? ( <p className="text-center py-10 text-slate-500 dark:text-slate-400">Loading products...</p> ) : (<div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{filteredVariants.map((variant) => { const isLowStock = variant.stock_quantity <= LOW_STOCK_THRESHOLD; return (<button key={variant.id} onClick={() => addToCart(variant)} className={` relative flex flex-col items-center justify-center rounded-xl border p-4 text-center shadow-card hover:shadow-card-hover transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${isLowStock ? 'border-danger-300 bg-danger-50 dark:bg-danger-900/30' : 'border-slate-200 bg-white dark:bg-slate-700/50 dark:border-slate-700'} hover:border-brand-500 dark:hover:bg-slate-700 `}> {isLowStock && <AlertTriangle className="absolute top-2 right-2 h-4 w-4 text-danger-500 animate-pulse" />} {variant.image_url ? (<img src={variant.image_url} alt={variant.name || 'Product'} className="mb-2 h-16 w-16 rounded-lg object-cover"/>) : (<div className="mb-2 h-16 w-16 rounded-lg bg-slate-100 dark:bg-slate-600 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">No Image</div>)} <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{variant.name}</span> <span className="mt-1 text-sm text-slate-500 dark:text-slate-400">{variant.price.toLocaleString()} RWF</span> <span className={`mt-1 text-xs font-medium ${isLowStock ? 'text-danger-600 font-bold' : 'text-brand-600 dark:text-brand-400'}`}> (Stock: {variant.stock_quantity}) </span> </button>); })}</div>)}
        </div>

        {/* Cart Panel - Right on desktop, full-width tab on mobile */}
        <div className={`md:col-span-5 flex flex-col rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-card ${showCartOnMobile ? 'flex md:flex' : 'hidden md:flex'}`}>
          <h2 className="flex items-center text-lg font-semibold text-slate-900 dark:text-white border-b border-brand-600 pb-2"><ShoppingCart className="mr-2 h-5 w-5 text-brand-600" /> Current Sale</h2>
          <div className="mt-4"><label htmlFor="customer-select" className="label-style">Select Customer</label><div className="mt-1 flex rounded-lg shadow-card overflow-hidden"><select id="customer-select" value={selectedCustomerId ?? ''} onChange={(e) => setSelectedCustomerId(e.target.value ? parseInt(e.target.value) : null)} className="input-field flex-1 rounded-none rounded-l-lg border-0 focus:ring-brand-500" disabled={loadingCustomers}><option value="">-- Walk-in / Cash Sale --</option>{loadingCustomers ? (<option disabled>Loading...</option>) : (customers.map((customer) => (<option key={customer.id} value={customer.id}>{customer.name} {customer.phone ? `(${customer.phone})` : ''} - Bal: {customer.credit_balance.toLocaleString()} RWF</option>)))}</select><button type="button" className="relative inline-flex items-center space-x-2 rounded-r-lg border-0 bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-800 transition-colors focus:ring-brand-500"><UserPlus className="h-5 w-5" /><span>New</span></button></div></div>
          <div className="mt-4 flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700">
            <div className="flex justify-end pr-2 text-xs font-semibold text-slate-500 dark:text-slate-400 pb-2">Price | Final Price</div>
            {cart.length === 0 ? (<p className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">Cart is empty.</p>) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded transition-colors">
                  <div><p className="font-medium text-slate-900 dark:text-white">{item.name}</p><p className="text-sm text-slate-500 dark:text-slate-400">{item.quantity} x {item.price.toLocaleString()} RWF</p></div>
                  <div className='flex items-center gap-2'><p className="font-medium text-slate-800 dark:text-slate-200">{(item.price * (1 - cartDiscountPercent / 100) * item.quantity).toLocaleString()} RWF</p><button onClick={() => removeFromCart(item.id)} className="text-danger-500 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/30 p-1.5 rounded transition-colors"><Trash2 className="h-4 w-4" /></button></div>
                </div>
              ))
            )}
          </div>
          <div className="mt-auto border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-4">
            <div className="mb-2 flex items-center justify-between text-sm text-danger-600 dark:text-danger-500"><span className="font-medium">Discount:</span><span className="font-bold">{cartDiscountPercent}% (-{totalDiscountAmount.toLocaleString()} RWF)</span></div>
            <div className="mb-2 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400"><span className="font-medium">Subtotal:</span><span>{subTotal.toLocaleString()} RWF</span></div>
            <div className="mb-4 flex items-center justify-between text-xl font-black text-slate-900 dark:text-white bg-brand-50 dark:bg-brand-900/20 rounded-lg px-3 py-2"><span>Total Due:</span><span className="text-brand-600">{cartTotal.toLocaleString()} RWF</span></div>
            <button onClick={handleOpenDiscountModal} disabled={cart.length === 0 || isProcessing} className="mb-4 flex w-full items-center justify-center rounded-lg bg-warning-100 px-4 py-2.5 text-sm font-semibold text-warning-700 shadow-card hover:shadow-card-hover hover:bg-warning-200 disabled:opacity-50 dark:bg-warning-900/30 dark:text-warning-300 dark:hover:bg-warning-900/50 transition-all"><Tag className="mr-2 h-4 w-4" /> Apply Discount ({cartDiscountPercent}%)</button>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3"><button onClick={() => handleOpenPaymentModal('cash')} disabled={isProcessing || cart.length === 0} className="payment-button bg-success-600 hover:bg-success-700 text-white shadow-card hover:shadow-card-hover transition-all"><DollarSign className="mr-2 h-5 w-5" /> Cash</button><button onClick={() => handleOpenPaymentModal('mtn_momo')} disabled={isProcessing || cart.length === 0} className="payment-button bg-warning-500 hover:bg-warning-600 text-white shadow-card hover:shadow-card-hover transition-all"><Smartphone className="mr-2 h-5 w-5" /> MTN MoMo</button></div>
              <div className="grid grid-cols-2 gap-3"><button onClick={() => handleOpenPaymentModal('airtel_money')} disabled={isProcessing || cart.length === 0} className="payment-button bg-danger-600 hover:bg-danger-700 text-white shadow-card hover:shadow-card-hover transition-all"><Smartphone className="mr-2 h-5 w-5" /> Airtel Money</button><button onClick={() => handleOpenPaymentModal('bank_transfer')} disabled={isProcessing || cart.length === 0} className="payment-button bg-brand-600 hover:bg-brand-700 text-white shadow-card hover:shadow-card-hover transition-all"><Landmark className="mr-2 h-5 w-5" /> Bank Transfer</button></div>
              <button onClick={handleCompleteSaleCredit} disabled={isProcessing || cart.length === 0 || !selectedCustomerId} className="payment-button w-full bg-slate-600 hover:bg-slate-700 text-white disabled:bg-slate-400 shadow-card hover:shadow-card-hover transition-all rounded-lg"><CreditCard className="mr-2 h-5 w-5" /> Pay Later (Credit)</button>
            </div>
          </div>
        </div>
      </div>
      <ReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} saleDetails={lastSaleDetails} />
      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onConfirm={handleCheckout} total={cartTotal} paymentMethod={selectedPaymentMethod} isProcessing={isProcessing} />
      <ApplyDiscountModal isOpen={showDiscountModal} onClose={() => setShowDiscountModal(false)} onConfirm={handleApplyDiscount} currentDiscount={cartDiscountPercent} isProcessing={isProcessing} />
      <QuantityModal isOpen={isQuantityModalOpen} onClose={() => setIsQuantityModalOpen(false)} onConfirm={handleConfirmQuantity} variant={selectedVariantForQuantity} isProcessing={isProcessing} />
    </div>
  );
}