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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        {/* Receipt Header */}
        <h2 className="mb-4 text-center text-xl font-bold text-gray-800">
          Sale Receipt
        </h2>
        <div className="mb-4 border-b pb-2 text-xs text-gray-500">
          <p>Sale ID: {saleId ?? 'N/A'}</p>
          <p>Date: {saleDate.toLocaleString()}</p>
          {customerName && <p>Customer: {customerName}</p>}
        </div>

        {/* Items List */}
        <div className="mb-4 max-h-40 space-y-1 overflow-y-auto text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="max-w-[70%] truncate">
                {item.quantity} x {item.name}
              </span>
              <span className="text-right">
                 {/* Show the original price if no discount, otherwise show discounted final price */}
                 {item.discount_percentage > 0 && 
                    <span className="mr-2 text-xs line-through text-gray-400">{(item.price * item.quantity).toLocaleString()}</span>
                 }
                <span className="font-medium">{(item.final_price * item.quantity).toLocaleString()} RWF</span>
              </span>
            </div>
          ))}
        </div>

        {/* Discount & Totals Section */}
        <div className="border-t pt-4">
            <div className="mb-2 flex justify-between text-sm text-gray-600">
                <span>Subtotal:</span>
                <span>{subtotal.toLocaleString()} RWF</span>
            </div>
            
            {/* Discount Line */}
            {discountAmount > 0 && (
                <div className="mb-2 flex justify-between text-base font-semibold text-red-600">
                    <span>Discount ({discountPercent}%):</span>
                    <span>-{discountAmount.toLocaleString()} RWF</span>
                </div>
            )}
            
            <div className="mb-2 flex justify-between text-xl font-bold text-gray-900 border-t pt-2">
                <span>TOTAL:</span>
                <span>{total.toLocaleString()} RWF</span>
            </div>
        </div>

        {/* Payment Method */}
        <div className="mt-4 text-sm text-gray-600 border-t pt-2">
          Payment Method: <span className="font-medium capitalize">{paymentMethod.replace('_', ' ')}</span>
        </div>

        {/* Print Button (placeholder) */}
        <button
          onClick={() => alert('Printing not implemented yet!')}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          Print Receipt
        </button>
      </div>
    </div>
  );
}