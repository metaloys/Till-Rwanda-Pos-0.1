import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Customer, Profile, UserRole } from '../appTypes';
import { History, Phone, Calendar } from 'lucide-react';

interface CreditAgingReportProps {
  shopId: string;
  profile: Profile;
  userRole: UserRole;
}

type DebtorInfo = Customer & {
  last_credit_sale_date: string | null;
};

export default function CreditAgingReport({ shopId }: CreditAgingReportProps) {
  const [debtorReport, setDebtorReport] = useState<DebtorInfo[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchCreditReport() { 
    setLoading(true); 
    const { data: debtors, error: debtorsError } = await supabase.from('customers').select('*').eq('shop_id', shopId).gt('credit_balance', 0).order('name', { ascending: true }); 
    if (debtorsError) { console.error('Error fetching debtors:', debtorsError.message); alert(debtorsError.message); setLoading(false); return; } 
    if (!debtors || debtors.length === 0) { setDebtorReport([]); setLoading(false); return; } 
    
    const reportData: DebtorInfo[] = []; 
    for (const customer of debtors) { 
      const { data: lastSaleData, error: lastSaleError } = await supabase.from('sales').select('created_at').eq('customer_id', customer.id).eq('shop_id', shopId).eq('payment_method', 'credit').order('created_at', { ascending: false }).limit(1).single(); 
      if (lastSaleError && lastSaleError.code !== 'PGRST116') { console.error(`Error fetching last sale for ${customer.id}:`, lastSaleError.message); reportData.push({ ...customer, last_credit_sale_date: null }); } 
      else { reportData.push({ ...customer, last_credit_sale_date: lastSaleData?.created_at ?? null }); } 
    } 
    reportData.sort((a, b) => { if (a.last_credit_sale_date === null) return 1; if (b.last_credit_sale_date === null) return -1; return new Date(a.last_credit_sale_date).getTime() - new Date(b.last_credit_sale_date).getTime(); }); 
    setDebtorReport(reportData); 
    setLoading(false); 
  }
  
  useEffect(() => { if (shopId) fetchCreditReport(); }, [shopId]);
  
  const calculateDaysAgo = (dateString: string | null): string => { if (!dateString) return 'N/A'; const saleDate = new Date(dateString); const today = new Date(); saleDate.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0); const diffTime = Math.abs(today.getTime() - saleDate.getTime()); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); if (diffDays === 0) return 'Today'; if (diffDays === 1) return 'Yesterday'; return `${diffDays} days ago`; };

  return ( 
    <div className="rounded-lg bg-white dark:bg-slate-800 p-4 md:p-6 shadow-lg">
      <h2 className="card-header flex items-center"><History className="mr-2 h-5 w-5 text-orange-600" />Credit Aging Report</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Customers with balances, ordered by oldest credit purchase.</p>
      <button onClick={fetchCreditReport} disabled={loading} className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50">{loading ? 'Refreshing...' : 'Refresh Report'}</button>
      
      {loading ? (<p className="py-10 text-center text-slate-500 dark:text-slate-400">Loading...</p>) : (
        <>
          <div className="mt-4 hidden md:block flow-root overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700"><tr><th className="th-style">Customer Name</th><th className="th-style">Phone</th><th className="th-style">Balance (RWF)</th><th className="th-style">Last Credit Sale</th><th className="th-style">Approx. Age</th></tr></thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {debtorReport.length === 0 ? (<tr><td colSpan={5} className="td-style text-center text-slate-500 dark:text-slate-400">No outstanding credit found.</td></tr>) : (
                  debtorReport.map((customer) => (
                    <tr key={customer.id}>
                      <td className="td-style font-medium text-slate-900 dark:text-white">{customer.name}</td>
                      <td className="td-style text-sm text-slate-500 dark:text-slate-400">{customer.phone || 'N/A'}</td>
                      <td className="td-style font-semibold text-red-600 dark:text-red-500">{customer.credit_balance.toLocaleString()} RWF</td>
                      <td className="td-style text-sm text-slate-500 dark:text-slate-400">{customer.last_credit_sale_date ? new Date(customer.last_credit_sale_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="td-style text-sm text-slate-500 dark:text-slate-400">{calculateDaysAgo(customer.last_credit_sale_date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 space-y-4 md:hidden">
            {debtorReport.length === 0 ? (<p className="py-10 text-center text-slate-500 dark:text-slate-400">No outstanding credit found.</p>) : (
              debtorReport.map((customer) => (
                <div key={customer.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{customer.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center mt-1"><Phone className="mr-1.5 h-4 w-4" /> {customer.phone || 'N/A'}</div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="font-bold text-lg text-red-600 dark:text-red-500">{customer.credit_balance.toLocaleString()} RWF</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Balance</div>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> Last Credit: {customer.last_credit_sale_date ? new Date(customer.last_credit_sale_date).toLocaleDateString() : 'N/A'}</div>
                    <div className="flex items-center font-medium"><History className="mr-2 h-4 w-4" /> Age: {calculateDaysAgo(customer.last_credit_sale_date)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div> 
  );
}