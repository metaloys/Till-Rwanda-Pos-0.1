import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Customer, Profile, UserRole } from '../appTypes';
import { CircleDollarSign, MessageSquareText, Loader2, History, User, Phone, DollarSign } from 'lucide-react'; // Added icons
import CustomerHistoryModal from '../components/CustomerHistoryModal';

interface CreditManagementProps {
  shopId: string;
  profile: Profile;
  userRole: UserRole;
}

export default function CreditManagement({ shopId }: CreditManagementProps) {
  const [debtors, setDebtors] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<number | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  async function fetchDebtors() { setLoading(true); const { data, error } = await supabase.from('customers').select('*').gt('credit_balance', 0).order('name', { ascending: true }); if (error) { console.error('Error fetching debtors:', error.message); alert(error.message); } else if (data) { setDebtors(data as Customer[]); } setLoading(false); }
  useEffect(() => { if(shopId) fetchDebtors(); }, [shopId]);

  const handleRecordPayment = async (customer: Customer) => { if (isSubmittingPayment || sendingReminderId) return; const amountStr = prompt(`Payment for ${customer.name} (Owes ${customer.credit_balance.toLocaleString()} RWF):\n\nEnter amount (e.g., 5000 momo):`,''); if (!amountStr) return; const parts = amountStr.trim().split(/\s+/); const amount = parseFloat(parts[0]); const method = parts[1] ? parts[1].toLowerCase() : 'cash'; if (isNaN(amount) || amount <= 0) { alert('Invalid amount.'); return; } if (amount > customer.credit_balance) { alert(`Payment exceeds balance owed.`); return; } setIsSubmittingPayment(true); try { const newBalance = customer.credit_balance - amount; const { error: updateError } = await supabase.from('customers').update({ credit_balance: newBalance }).eq('id', customer.id); if (updateError) throw new Error(`Failed to update balance: ${updateError.message}`); const { error: paymentInsertError } = await supabase.from('credit_payments').insert({ customer_id: customer.id, amount: amount, payment_method: method, payment_date: new Date().toISOString(), shop_id: shopId }); if (paymentInsertError) { throw new Error(`Failed to log payment: ${paymentInsertError.message}.`); } alert(`Payment of ${amount.toLocaleString()} RWF (${method.toUpperCase()}) recorded. New balance: ${newBalance.toLocaleString()} RWF.`); fetchDebtors(); } catch (error: any) { alert(`Error: ${error.message}`); } finally { setIsSubmittingPayment(false); } };
  const handleSendReminder = async (customer: Customer) => { if (!customer.phone) return alert(`${customer.name} has no phone number saved.`); if (sendingReminderId || isSubmittingPayment) return; setSendingReminderId(customer.id); try { const session = await supabase.auth.getSession(); if (!session?.data?.session?.access_token) throw new Error("Auth error."); const { data, error } = await supabase.functions.invoke('send-reminder', { body: JSON.stringify({ customerId: customer.id }), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.data.session.access_token}` } }); let errorMessage = error?.message; if (error) { try { const errorResponseBody = await (error as any).context?.response?.json(); if (errorResponseBody?.error) errorMessage = errorResponseBody.error; } catch(e) {} throw new Error(errorMessage); } if (data?.error) throw new Error(data.error); alert(`Reminder sent to ${customer.name}!`); } catch (error: any) { console.error("Error invoking edge function:", error); alert(`Failed to send reminder: ${error.message}`); } finally { setSendingReminderId(null); } };
  const handleViewHistory = (customer: Customer) => { setHistoryCustomer(customer); setShowHistoryModal(true); };

  return ( <div className="relative rounded-lg bg-white p-4 md:p-6 shadow"><h2 className="text-lg font-semibold text-gray-900">Customer Credit Balances</h2><button onClick={fetchDebtors} disabled={loading || isSubmittingPayment || !!sendingReminderId} className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50">{loading ? 'Refreshing...' : 'Refresh List'}</button>
    {loading ? (
      <p className="py-10 text-center text-gray-500">Loading customer balances...</p>
    ) : (
      <>
        {/* --- DESKTOP TABLE (Hidden on mobile) --- */}
        <div className="mt-4 hidden md:block flow-root overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="th-style">Name</th><th className="th-style">Phone</th><th className="th-style">Balance Owed (RWF)</th><th className="th-style">Actions</th></tr></thead><tbody className="divide-y divide-gray-200 bg-white">{!loading && debtors.length === 0 ? (<tr><td colSpan={4} className="td-style text-center text-gray-500">No customers with outstanding credit.</td></tr>) : (debtors.map((customer) => (<tr key={customer.id}><td className="td-style font-medium"><button onClick={() => handleViewHistory(customer)} className="text-blue-600 hover:text-blue-800 hover:underline" title="View Credit History">{customer.name}</button></td><td className="td-style text-sm text-gray-500">{customer.phone || 'N/A'}</td><td className="td-style font-semibold text-red-600">{customer.credit_balance.toLocaleString()} RWF</td><td className="td-style space-x-2 whitespace-nowrap"><button onClick={() => handleRecordPayment(customer)} disabled={isSubmittingPayment || !!sendingReminderId} className="action-button bg-green-100 text-green-700 hover:bg-green-200"><CircleDollarSign className="-ml-0.5 mr-1 h-3 w-3" /> Payment</button><button onClick={() => handleSendReminder(customer)} disabled={isSubmittingPayment || !!sendingReminderId || !customer.phone} className="action-button bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed" title={!customer.phone ? "No phone" : "Send reminder"}>{sendingReminderId === customer.id ? (<Loader2 className="mr-1 h-3 w-3 animate-spin" />) : (<MessageSquareText className="-ml-0.5 mr-1 h-3 w-3" />)}{sendingReminderId === customer.id ? 'Sending...' : 'Reminder'}</button></td></tr>)))}</tbody></table>
        </div>

        {/* --- MOBILE CARD LIST (Visible on mobile) --- */}
        <div className="mt-4 space-y-4 md:hidden">
          {!loading && debtors.length === 0 ? (<p className="py-10 text-center text-gray-500">No customers with outstanding credit.</p>) : (
            debtors.map((customer) => (
              <div key={customer.id} className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <button onClick={() => handleViewHistory(customer)} className="text-left" title="View Credit History">
                    <div className="font-bold text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-600 flex items-center mt-1"><Phone className="mr-1.5 h-4 w-4" /> {customer.phone || 'N/A'}</div>
                  </button>
                  <div className="text-right">
                    <div className="font-bold text-lg text-red-600">{customer.credit_balance.toLocaleString()} RWF</div>
                    <div className="text-xs text-gray-500">Balance Owed</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
                  <button onClick={() => handleRecordPayment(customer)} disabled={isSubmittingPayment || !!sendingReminderId} className="action-button justify-center bg-green-100 text-green-700 hover:bg-green-200">
                    <CircleDollarSign className="mr-1 h-4 w-4" /> Payment
                  </button>
                  <button onClick={() => handleSendReminder(customer)} disabled={isSubmittingPayment || !!sendingReminderId || !customer.phone} className="action-button justify-center bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50">
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
  <CustomerHistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} customer={historyCustomer}/></div> );
}