import React, { useState } from 'react';
import { X, QrCode } from 'lucide-react'; // Using Lucide icons like in your other modal

// Define the props it will receive
interface MobileMoneyModalProps {
  amount: number;
  onPaymentStart: (phone: string) => void; // Function to call when user clicks "Pay"
  onClose: () => void;
  isProcessing: boolean; // To disable button while starting
}

// Simple icons for providers, you can replace with better SVGs or images
const MtnIcon = () => (
  <span className="rounded-sm bg-[#ffcc00] px-2 py-1 text-xs font-bold text-[#004f9f]">MTN</span>
);
const AirtelIcon = () => (
  <span className="rounded-sm bg-[#e40000] px-2 py-1 text-xs font-bold text-white">Airtel</span>
);

export const MobileMoneyModal: React.FC<MobileMoneyModalProps> = ({
  amount,
  onPaymentStart,
  onClose,
  isProcessing,
}) => {
  // State to manage which view is active: 'phone' or 'qr'
  const [view, setView] = useState<'phone' | 'qr'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Function to detect the provider
  const getProvider = () => {
    if (phoneNumber.startsWith('078') || phoneNumber.startsWith('079')) {
      return <MtnIcon />;
    }
    if (phoneNumber.startsWith('073') || phoneNumber.startsWith('072')) {
      return <AirtelIcon />;
    }
    return null; // No icon if not matched
  };

  const handlePayClick = () => {
    if (phoneNumber.length < 10) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }
    onPaymentStart(phoneNumber);
  };

  return (
    // Re-using the style from your existing PaymentModal.tsx
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 disabled:text-gray-200"
          disabled={isProcessing}
        >
          <X size={20} />
        </button>

        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold text-gray-800">Initiate MoMo Payment</h2>
        </div>

        <div className="mb-4 border-b border-gray-200 pb-4 text-center">
          <p className="text-sm text-gray-500">Total Due:</p>
          <p className="text-3xl font-extrabold text-blue-600">{amount.toLocaleString()} RWF</p>
        </div>

        {view === 'phone' ? (
          // VIEW 1: Phone Number Input
          <div className="space-y-4">
            <p className="text-center text-sm text-gray-600">Enter customer's phone number to pay.</p>
            <div className="relative">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="07..."
                maxLength={10}
                className="input-field w-full py-3 px-4 text-lg" // Assuming 'input-field' is a global style you have
                autoFocus
              />
              <div className="absolute inset-y-0 right-3 flex items-center">
                {getProvider()}
              </div>
            </div>
            <button 
              onClick={handlePayClick} 
              className="w-full rounded-md bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={phoneNumber.length !== 10 || isProcessing}
            >
              {isProcessing ? 'Starting...' : 'Send Payment Request'}
            </button>
            <button 
              onClick={() => setView('qr')} 
              className="flex w-full items-center justify-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              disabled={isProcessing}
            >
              <QrCode size={16} />
              Prefer to scan?
            </button>
          </div>
        ) : (
          // VIEW 2: QR Code Display
          <div className="space-y-4">
            <p className="text-center text-sm text-gray-600">Scan code with customer's MoMo or Bank app.</p>
            <div className="flex w-full justify-center">
              <div className="flex h-48 w-48 flex-col items-center justify-center rounded-lg bg-gray-100 p-4 ring-1 ring-gray-300">
                <QrCode size={64} className="text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">QR Code (Coming Soon)</p>
              </div>
            </div>
            <button 
              onClick={() => setView('phone')} 
              className="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              disabled={isProcessing}
            >
              Pay with Phone Number instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
};