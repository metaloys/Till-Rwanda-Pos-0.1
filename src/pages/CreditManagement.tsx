import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Customer } from '../appTypes';
import { CircleDollarSign, MessageSquareText, Loader2, History } from 'lucide-react';
import CustomerHistoryModal from '../components/CustomerHistoryModal';

const SHOP_NAME = "Your Shop";

export default function CreditManagement() {
  const [debtors, setDebtors] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<number | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  // Fetch debtors
  async function fetchDebtors() { /* ... same as before ... */
    setLoading(true); const { data, error } = await supabase.from('customers').select('*').gt('credit_balance', 0).order('name', { ascending: true }); if (error) { console.error('Error fetching debtors:', error.message); alert(error.message); } else if (data) { setDebtors(data); } setLoading(false);
   }
  useEffect(() => { fetchDebtors(); }, []);

  // --- UPDATED: Handle recording payment (Now logs transaction) ---
  const handleRecordPayment = async (customer: Customer) => {
    if (isSubmittingPayment || sendingReminderId) return;

    // --- 1. PROMPT FOR AMOUNT AND METHOD ---
    const amountStr = prompt(
      `Enter payment amount for ${customer.name} (Owes ${customer.credit_balance.toLocaleString()} RWF):\n\nOptionally, include method (e.g., 5000 momo):`,
      '',
    );
    if (!amountStr) return;

    // Basic parsing to separate amount and method
    const parts = amountStr.trim().split(/\s+/);
    const amount = parseFloat(parts[0]);
    const method = parts[1] ? parts[1].toLowerCase() : 'cash'; // Default to cash if no method specified

    if (isNaN(amount) || amount <= 0) {
      alert('Invalid amount entered. Please enter a positive number.');
      return;
    }
    if (amount > customer.credit_balance) {
      alert(`Payment amount (${amount.toLocaleString()} RWF) exceeds the balance owed (${customer.credit_balance.toLocaleString()} RWF).`);
      return;
    }
    // --- END PROMPT ---

    setIsSubmittingPayment(true);
    try {
      const newBalance = customer.credit_balance - amount;

      // Start Database Transactions (Ideally all in one transaction for safety)

      // 2. Update the customer's balance
      const { error: updateError } = await supabase
        .from('customers')
        .update({ credit_balance: newBalance })
        .eq('id', customer.id);
      if (updateError) throw new Error(`Failed to update balance: ${updateError.message}`);

      // 3. Insert the payment record into the new table
      const { error: paymentInsertError } = await supabase
        .from('credit_payments')
        .insert({
          customer_id: customer.id,
          amount: amount,
          payment_method: method, // Save the method
          payment_date: new Date().toISOString() // Save the current time as payment date
        });
      if (paymentInsertError) {
        // If payment fails, ideally rollback balance change, but for MVP we alert
        throw new Error(`Failed to log payment transaction: ${paymentInsertError.message}. (Balance was updated)`);
      }

      alert(`Payment of ${amount.toLocaleString()} RWF (${method.toUpperCase()}) recorded for ${customer.name}.\nNew balance: ${newBalance.toLocaleString()} RWF.`);
      fetchDebtors(); // Refresh list

    } catch (error: any) {
      alert(`Error processing payment: ${error.message}`);
    } finally {
      setIsSubmittingPayment(false);
    }
  };
  // --- END UPDATED PAYMENT LOGIC ---

  // Handle sending reminder (no change needed)
  const handleSendReminder = async (customer: Customer) => { /* ... same as before ... */
    if (!customer.phone) return alert(`Customer ${customer.name} has no phone number saved.`); if (sendingReminderId || isSubmittingPayment) return; setSendingReminderId(customer.id); try { const session = await supabase.auth.getSession(); if (!session?.data?.session?.access_token) throw new Error("Auth error."); const { data, error } = await supabase.functions.invoke('send-reminder', { body: JSON.stringify({ customerId: customer.id }), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.data.session.access_token}` } }); let errorMessage = error?.message; if (error) { try { const errorResponseBody = await (error as any).context?.response?.json(); if (errorResponseBody?.error) errorMessage = errorResponseBody.error; } catch(e) {} throw new Error(errorMessage); } if (data?.error) throw new Error(data.error); console.log('Function Response:', data); alert(`Reminder sent to ${customer.name}!`); } catch (error: any) { console.error("Error invoking edge function:", error); alert(`Failed to send reminder: ${error.message}`); } finally { setSendingReminderId(null); }
  };

  // Handle view history (no change needed)
  const handleViewHistory = (customer: Customer) => { setHistoryCustomer(customer); setShowHistoryModal(true); };

  return (
    <div className="relative rounded-lg bg-white p-6 shadow">
      {/* ...Header and Refresh button... */}
      <h2 className="text-lg font-semibold text-gray-900">Customer Credit Balances</h2>
       <button onClick={fetchDebtors} disabled={loading || isSubmittingPayment || !!sendingReminderId} className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50">
         {loading ? 'Refreshing...' : 'Refresh List'}
       </button>
      <div className="mt-4 flow-root">
        {/* ...Table and Loading States... */}
        {loading && debtors.length === 0 ? (<p>Loading...</p>) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr><th className="th-style">Name</th><th className="th-style">Phone</th><th className="th-style">Balance Owed (RWF)</th><th className="th-style">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {!loading && debtors.length === 0 ? (<tr><td colSpan={4} className="td-style text-center text-gray-500">No customers with outstanding credit.</td></tr>) : (
                debtors.map((customer) => (
                  <tr key={customer.id}>
                    <td className="td-style font-medium">
                        <button onClick={() => handleViewHistory(customer)} className="text-blue-600 hover:text-blue-800 hover:underline" title="View Credit History">{customer.name}</button>
                    </td>
                    <td className="td-style text-sm text-gray-500">{customer.phone || 'N/A'}</td>
                    <td className="td-style font-semibold text-red-600">{customer.credit_balance.toLocaleString()} RWF</td>
                    <td className="td-style space-x-2 whitespace-nowrap">
                       <button onClick={() => handleRecordPayment(customer)} disabled={isSubmittingPayment || !!sendingReminderId} className="action-button bg-green-100 text-green-700 hover:bg-green-200">
                         <CircleDollarSign className="-ml-0.5 mr-1 h-3 w-3" /> Payment
                       </button>
                       <button onClick={() => handleSendReminder(customer)} disabled={isSubmittingPayment || !!sendingReminderId || !customer.phone} className="action-button bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed" title={!customer.phone ? "No phone" : "Send reminder"}>
                         {sendingReminderId === customer.id ? (<Loader2 className="mr-1 h-3 w-3 animate-spin" />) : (<MessageSquareText className="-ml-0.5 mr-1 h-3 w-3" />)}
                         {sendingReminderId === customer.id ? 'Sending...' : 'Reminder'}
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <CustomerHistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} customer={historyCustomer}/>
    </div>
  );
}