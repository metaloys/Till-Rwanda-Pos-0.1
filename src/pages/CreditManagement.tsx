import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Customer, Profile, UserRole } from '../appTypes';
import { CircleDollarSign, MessageSquareText, Loader2, Phone } from 'lucide-react'; // Removed unused icons
import CustomerHistoryModal from '../components/CustomerHistoryModal';
import RecordPaymentModal from '../components/RecordPaymentModal'; // 1. IMPORT THE NEW MODAL
import { toast } from 'react-hot-toast'; // 2. IMPORT TOAST

interface CreditManagementProps {
  shopId: string;
  profile: Profile;
  userRole: UserRole;
}

export default function CreditManagement({ shopId }: CreditManagementProps) {
  const [debtors, setDebtors] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<number | null>(null);
  
  // State for Customer History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  
  // --- 3. NEW STATE FOR PAYMENT MODAL ---
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  // --- END NEW STATE ---

  async function fetchDebtors() { setLoading(true); const { data, error } = await supabase.from('customers').select('*').gt('credit_balance', 0).order('name', { ascending: true }); if (error) { console.error('Error fetching debtors:', error.message); toast.error(error.message); } else if (data) { setDebtors(data as Customer[]); } setLoading(false); }
  useEffect(() => { if(shopId) fetchDebtors(); }, [shopId]);

  // --- 4. OLD FUNCTION IS NOW JUST AN OPENER ---
  const handleOpenPaymentModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowPaymentModal(true);
  };

  // --- 5. NEW FUNCTION TO HANDLE THE CONFIRMATION ---
  const handleConfirmPayment = async (amount: number, method: string) => {
    if (!selectedCustomer) return toast.error("No customer selected.");
    if (isProcessing || sendingReminderId) return;

    if (isNaN(amount) || amount <= 0) {
      return toast.error('Invalid amount entered.');
    }
    if (amount > selectedCustomer.credit_balance) {
      return toast.error(`Payment exceeds balance owed.`);
    }

    setIsProcessing(true);
    
    const paymentPromise = new Promise(async (resolve, reject) => {
      try {
        const newBalance = selectedCustomer.credit_balance - amount;

        // 1. Update customer balance
        const { error: updateError } = await supabase
          .from('customers')
          .update({ credit_balance: newBalance })
          .eq('id', selectedCustomer.id);
        if (updateError) throw updateError;

        // 2. Insert payment record (FIX: ADD SHOP_ID FOR RLS)
        const { error: paymentInsertError } = await supabase
          .from('credit_payments')
          .insert({ 
            customer_id: selectedCustomer.id, 
            amount: amount, 
            payment_method: method, 
            payment_date: new Date().toISOString(), 
            shop_id: shopId // This fixes the RLS security
          });
        if (paymentInsertError) throw paymentInsertError;
        
        resolve(`Payment recorded. New balance: ${newBalance.toLocaleString()} RWF`);
      } catch (error: any) {
        reject(new Error(error.message));
      }
    });

    toast.promise(paymentPromise, {
      loading: 'Recording Payment...',
      success: (message) => {
        fetchDebtors(); // Refresh list
        setShowPaymentModal(false); // Close modal
        setIsProcessing(false);
        return message as string;
      },
      error: (err) => {
        setIsProcessing(false);
        return `Error: ${err.message}`;
      }
    });
  };
  // --- END NEW FUNCTIONS ---

  const handleSendReminder = async (customer: Customer) => { 
      if (!customer.phone) return toast.error(`${customer.name} has no phone number saved.`); 
      if (sendingReminderId || isProcessing) return; 
      setSendingReminderId(customer.id); 
      
      const reminderPromise = supabase.functions.invoke('send-reminder', { 
          body: JSON.stringify({ customerId: customer.id }), 
          headers: { 'Content-Type': 'application/json' } 
      });

      toast.promise(reminderPromise, {
          loading: `Sending reminder to ${customer.name}...`,
          success: (response: any) => {
              if (response.data.error) throw new Error(response.data.error);
              setSendingReminderId(null);
              return 'Reminder sent!';
          },
          error: (err) => {
              setSendingReminderId(null);
              return `Failed: ${err.message}`;
          }
      });
  };
  
  const handleViewHistory = (customer: Customer) => { setHistoryCustomer(customer); setShowHistoryModal(true); };

  return ( 
    <>
      <div className="relative rounded-lg bg-white p-4 md:p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">Customer Credit Balances</h2>
        <button onClick={fetchDebtors} disabled={loading || isProcessing || !!sendingReminderId} className="mt-2 text-xs text-indigo-600 hover:underline disabled:opacity-50">{loading ? 'Refreshing...' : 'Refresh List'}</button>
        {loading ? (
          <p className="py-10 text-center text-slate-500">Loading...</p>
        ) : (
          <>
            <div className="mt-4 hidden md:block flow-root overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr><th className="th-style">Name</th><th className="th-style">Phone</th><th className="th-style">Balance Owed (RWF)</th><th className="th-style">Actions</th></tr></thead><tbody className="divide-y divide-slate-200 bg-white">{!loading && debtors.length === 0 ? (<tr><td colSpan={4} className="td-style text-center text-slate-500">No customers with outstanding credit.</td></tr>) : (debtors.map((customer) => (<tr key={customer.id}><td className="td-style font-medium"><button onClick={() => handleViewHistory(customer)} className="text-indigo-600 hover:text-indigo-800 hover:underline" title="View Credit History">{customer.name}</button></td><td className="td-style text-sm text-slate-500">{customer.phone || 'N/A'}</td><td className="td-style font-semibold text-red-600">{customer.credit_balance.toLocaleString()} RWF</td><td className="td-style space-x-2 whitespace-nowrap">
              {/* 6. BUTTON NOW OPENS MODAL */}
              <button onClick={() => handleOpenPaymentModal(customer)} disabled={isProcessing || !!sendingReminderId} className="action-button bg-green-100 text-green-700 hover:bg-green-200"><CircleDollarSign className="-ml-0.5 mr-1 h-3 w-3" /> Payment</button>
              <button onClick={() => handleSendReminder(customer)} disabled={isProcessing || !!sendingReminderId || !customer.phone} className="action-button bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed" title={!customer.phone ? "No phone" : "Send reminder"}>{sendingReminderId === customer.id ? (<Loader2 className="mr-1 h-4 w-4 animate-spin" />) : (<MessageSquareText className="-ml-0.5 mr-1 h-3 w-3" />)}{sendingReminderId === customer.id ? '...' : 'Reminder'}</button>
            </td></tr>)))}</tbody></table></div>
            <div className="mt-4 space-y-4 md:hidden">
              {!loading && debtors.length === 0 ? (<p className="py-10 text-center text-slate-500">No customers with outstanding credit.</p>) : (
                debtors.map((customer) => (
                  <div key={customer.id} className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <button onClick={() => handleViewHistory(customer)} className="text-left" title="View Credit History"><div className="font-bold text-slate-900">{customer.name}</div><div className="text-sm text-slate-600 flex items-center mt-1"><Phone className="mr-1.5 h-4 w-4" /> {customer.phone || 'N/A'}</div></button>
                      <div className="text-right flex-shrink-0 ml-2"><div className="font-bold text-lg text-red-600">{customer.credit_balance.toLocaleString()} RWF</div><div className="text-xs text-slate-500">Balance</div></div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
                      {/* 7. BUTTON NOW OPENS MODAL */}
                      <button onClick={() => handleOpenPaymentModal(customer)} disabled={isProcessing || !!sendingReminderId} className="action-button justify-center bg-green-100 text-green-700 hover:bg-green-200"><CircleDollarSign className="mr-1 h-4 w-4" /> Payment</button>
T                     <button onClick={() => handleSendReminder(customer)} disabled={isProcessing || !!sendingReminderId || !customer.phone} className="action-button justify-center bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50">
                        {sendingReminderId === customer.id ? (<Loader2 className="mr-1 h-4 w-4 animate-spin" />) : (<MessageSquareText className="mr-1 h-4 w-4" />)}
                        {sendingReminderId === customer.id ? '...' : 'Reminder'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
        <CustomerHistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} customer={historyCustomer}/>
        
        {/* 8. RENDER THE NEW MODAL */}
        <RecordPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handleConfirmPayment}
          customer={selectedCustomer}
          isProcessing={isProcessing}
        />
      </div>
    </>
  );
}