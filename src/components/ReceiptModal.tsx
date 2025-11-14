import { X } from 'lucide-react';
import type { CartItem } from '../appTypes';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleDetails: {
    items: CartItem[];
    total: number;
    paymentMethod: string;
    customerName?: string | null;
    saleId?: number | null;
    // --- RECEIPT DATA FIELDS ---
    subtotal: number;       // New: Subtotal before discount
    discountAmount: number; // New: Actual RWF discount amount
    discountPercent: number; // New: Percentage
  } | null;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  saleDetails,
}: ReceiptModalProps) {
  if (!isOpen || !saleDetails) return null;

  const { items, total, paymentMethod, customerName, saleId, subtotal, discountAmount, discountPercent } = saleDetails;
  const saleDate = new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-elevated animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Receipt Header */}
        <h2 className="mb-4 text-center text-xl font-black text-slate-900 dark:text-white border-b border-brand-600 pb-3">
          Sale Receipt
        </h2>
        <div className="mb-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg">
          <p>Sale ID: {saleId ?? 'N/A'}</p>
          <p>Date: {saleDate.toLocaleString()}</p>
          {customerName && <p>Customer: <span className="font-medium text-slate-700 dark:text-slate-300">{customerName}</span></p>}
        </div>

        {/* Items List */}
        <div className="mb-4 max-h-40 space-y-1.5 overflow-y-auto text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 px-1 py-1 rounded transition-colors">
              <span className="max-w-[70%] truncate text-slate-700 dark:text-slate-300">
                {item.quantity} x {item.name}
              </span>
              <span className="text-right">
                 {/* Show the original price if no discount, otherwise show discounted final price */}
                 {item.discount_percentage > 0 && 
                    <span className="mr-2 text-xs line-through text-slate-400">{(item.price * item.quantity).toLocaleString()}</span>
                 }
                <span className="font-medium text-slate-900 dark:text-slate-100">{(item.final_price * item.quantity).toLocaleString()} RWF</span>
              </span>
            </div>
          ))}
        </div>

        {/* Discount & Totals Section */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="mb-2 flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span>{subtotal.toLocaleString()} RWF</span>
            </div>
            
            {/* Discount Line */}
            {discountAmount > 0 && (
                <div className="mb-2 flex justify-between text-base font-semibold text-danger-600 dark:text-danger-400">
                    <span>Discount ({discountPercent}%):</span>
                    <span>-{discountAmount.toLocaleString()} RWF</span>
                </div>
            )}
            
            <div className="mb-2 flex justify-between text-xl font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2 bg-brand-50 dark:bg-brand-900/20 px-2 py-2 rounded-lg">
                <span>TOTAL:</span>
                <span className="text-brand-600 dark:text-brand-400">{total.toLocaleString()} RWF</span>
            </div>
        </div>

        {/* Payment Method */}
        <div className="mt-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
          Payment Method: <span className="font-medium capitalize text-slate-900 dark:text-slate-100">{paymentMethod.replace('_', ' ')}</span>
        </div>

        {/* Print Button (placeholder) */}
        <button
          onClick={() => alert('Printing not implemented yet!')}
          className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white shadow-card hover:shadow-card-hover hover:bg-brand-700 transition-all"
        >
          Print Receipt
        </button>
      </div>
    </div>
  );
}