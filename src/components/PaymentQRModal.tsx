import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Loader2, Smartphone } from 'lucide-react';
import type { PaymentMethod } from '../appTypes';
import { toast } from 'react-hot-toast';

interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // We'll call this when cashier confirms payment
  totalAmount: number;
  paymentMethod: PaymentMethod | null;
  isProcessing: boolean;
}

export default function PaymentQRModal({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  paymentMethod,
  isProcessing,
}: PaymentQRModalProps) {
  
  const [isLoadingQR, setIsLoadingQR] = useState(true);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null); // Transaction reference

  useEffect(() => {
    if (isOpen && totalAmount > 0) {
      generateQR();
    } else {
      // Reset when closed
      setIsLoadingQR(true);
      setQrImage(null);
      setTxRef(null);
    }
  }, [isOpen, totalAmount]);

  // This function calls our new Edge Function to get the simulated QR code
  async function generateQR() {
    setIsLoadingQR(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-qr-code', {
        body: JSON.stringify({ 
          amount: totalAmount,
          tx_ref: `TILL-RWANDA-${Date.now()}` 
        }),
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      // Save the QR image (Base64) and the transaction reference
      setQrImage(data.meta.authorization.qr_image);
      setTxRef(data.data.tx_ref);
      
    } catch (error: any) {
      toast.error(`Could not generate QR Code: ${error.message}`);
      onClose(); // Close the modal if it fails
    } finally {
      setIsLoadingQR(false);
    }
  }

  const handleConfirm = () => {
    // We pass the transaction reference (or a default) back to the main checkout function
    onConfirm();
  };

  if (!isOpen) return null;

  const methodName = paymentMethod === 'mtn_momo' ? 'MTN MoMo' : 'Airtel Money';
  const methodColor = paymentMethod === 'mtn_momo' ? 'text-yellow-500' : 'text-red-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-sm rounded-lg bg-white dark:bg-slate-800 p-6 shadow-xl">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300" disabled={isProcessing}>
          <X size={20} />
        </button>

        <div className="mb-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Smartphone className={`h-6 w-6 ${methodColor}`} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{methodName} Payment</h2>
          </div>
        </div>

        <div className="mb-4 border-b border-slate-200 dark:border-slate-700 pb-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Due:</p>
          <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{totalAmount.toLocaleString()} RWF</p>
        </div>

        <div className="flex h-64 w-full items-center justify-center">
          {isLoadingQR ? (
            <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
              <p className="mt-4 text-sm font-medium">Generating Secure QR Code...</p>
            </div>
          ) : (
            <img 
              src={qrImage} 
              alt="Payment QR Code" 
              className="h-64 w-64 rounded-lg border-4 border-slate-900 dark:border-slate-100" 
            />
          )}
        </div>
        
        <div className="mt-4 text-center">
          <p className="font-semibold text-slate-800 dark:text-slate-200">Please scan the code to pay.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Waiting for payment confirmation...</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isProcessing}
            className="w-full rounded-md bg-slate-200 px-4 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleConfirm}
            className="w-full rounded-md bg-green-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50" 
            disabled={isProcessing || isLoadingQR}
          >
            {isProcessing ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}