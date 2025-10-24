import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Sale, SaleItem, ProductVariant, Customer } from '../appTypes';
import { X, Loader2, Calendar, User, DollarSign, Tag, ShoppingBag } from 'lucide-react';

interface SaleDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: number | null;
}

// Define a type for the full, detailed sale
type DetailedSale = Sale & {
  customers: Pick<Customer, 'name'> | null;
  sale_items: Array<SaleItem & {
    product_variants: (Pick<ProductVariant, 'name'> & {
      products: Pick<Product, 'name'>
    }) | null;
  }>;
};

export default function SaleDetailsModal({ isOpen, onClose, saleId }: SaleDetailsProps) {
  const [sale, setSale] = useState<DetailedSale | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && saleId) {
      fetchSaleDetails(saleId);
    } else {
      setSale(null); // Clear data when closed
    }
  }, [isOpen, saleId]);

  async function fetchSaleDetails(id: number) {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers ( name ),
        sale_items (
          *,
          product_variants (
            name,
            products ( name )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching sale details:', error.message);
      alert(`Error: ${error.message}`);
      setSale(null);
    } else if (data) {
      setSale(data as DetailedSale);
    }
    setLoading(false);
  }

  const formatPaymentMethod = (method: string) => method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  // Helper to calculate total before discount
  const subtotal = sale?.sale_items.reduce((acc, item) => acc + (item.price_at_sale * item.quantity), 0) ?? 0;
  const discountAmount = sale?.sale_items.reduce((acc, item) => {
    const itemTotal = item.price_at_sale * item.quantity;
    const discount = itemTotal * (item.discount_percentage / 100);
    return acc + discount;
  }, 0) ?? 0;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`relative w-full max-w-lg rounded-lg bg-white shadow-xl transition-all ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 rounded-full"
        >
          <X size={20} />
        </button>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          </div>
        ) : !sale ? (
          <div className="p-6 text-center">
            <p className="text-lg font-medium text-red-600">Sale Details Not Found</p>
          </div>
        ) : (
          <div className="p-6">
            <h2 className="mb-4 text-center text-xl font-bold text-slate-900">
              Sale Details (ID: #{sale.id})
            </h2>
            
            {/* Sale Info */}
            <div className="mb-4 border-b pb-4 text-sm text-slate-600 space-y-2">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" /> Date: {new Date(sale.created_at as string).toLocaleString()}
              </div>
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" /> Customer: {sale.customers?.name ?? 'Walk-in'}
              </div>
              <div className="flex items-center">
                <Tag className="mr-2 h-4 w-4" /> Method: {formatPaymentMethod(sale.payment_method)}
              </div>
              {sale.transaction_reference && (
                <div className="flex items-center">
                  <Tag className="mr-2 h-4 w-4" /> Ref: {sale.transaction_reference}
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="mb-4 max-h-48 space-y-2 overflow-y-auto text-sm">
              {sale.sale_items.map((item) => (
                <div key={item.id} className="flex justify-between p-2 rounded-md bg-slate-50">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                      {item.quantity}x
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">{item.product_variants?.products.name}</p>
                      <p className="text-xs text-slate-500">{item.product_variants?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-800">{(item.price_at_sale * (1 - item.discount_percentage / 100) * item.quantity).toLocaleString()} RWF</p>
                    {item.discount_percentage > 0 && (
                      <p className="text-xs text-red-600 line-through">{(item.price_at_sale * item.quantity).toLocaleString()} RWF</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed pt-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal:</span>
                <span>{subtotal.toLocaleString()} RWF</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm font-medium text-red-600">
                  <span>Discount:</span>
                  <span>-{discountAmount.toLocaleString()} RWF</span>
                </div>
              )}
              <div className="mt-2 flex justify-between text-xl font-bold text-slate-900 border-t pt-2">
                <span>TOTAL:</span>
                <span>{sale.total_amount.toLocaleString()} RWF</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}