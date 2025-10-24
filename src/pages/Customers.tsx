import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { Customer, UserRole, Profile } from '../appTypes';
import { Edit, UserPlus, Phone, MapPin, ShieldCheck, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal'; 
import { toast } from 'react-hot-toast'; 

interface CustomersProps {
  shopId: string;
  profile: Profile;
  userRole: UserRole;
}

export default function Customers({ shopId }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  async function fetchCustomers() {
    setLoading(true);
    const { data, error } = await supabase.from('customers').select('*').order('name', { ascending: true });
    if (error) { console.error('Error fetching customers:', error.message); toast.error(error.message); } 
    else if (data) { setCustomers(data as Customer[]); }
    setLoading(false);
  }

  useEffect(() => { if (shopId) fetchCustomers(); }, [shopId]);

  const startEditing = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone || '');
    setAddress(customer.address || '');
    setCreditLimit(customer.credit_limit.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingCustomer(null);
    setName(''); setPhone(''); setAddress(''); setCreditLimit('');
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const customerData = { name, phone: phone || null, address: address || null, credit_limit: parseFloat(creditLimit || '0'), shop_id: shopId };
    
    const promise = editingCustomer 
      ? supabase.from('customers').update(customerData).eq('id', editingCustomer.id)
      : supabase.from('customers').insert(customerData);

    toast.promise(promise, {
      loading: 'Saving customer...',
      success: () => {
        cancelEditing();
        fetchCustomers();
        setIsProcessing(false);
        return `Customer ${editingCustomer ? 'updated' : 'added'}!`;
      },
      error: (err) => {
        setIsProcessing(false);
        return `Error: ${err.message}`;
      }
    });
  };

  const openDeleteModal = (customer: Customer) => {
    if (customer.credit_balance > 0) {
      toast.error(`${customer.name} has an outstanding balance. Cannot delete.`);
      return;
    }
    setCustomerToDelete(customer);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsProcessing(true);
    
    const deletePromise = supabase.from('customers').delete().eq('id', customerToDelete.id);

    toast.promise(deletePromise, {
      loading: `Deleting ${customerToDelete.name}...`,
      success: () => {
        fetchCustomers();
        setCustomerToDelete(null);
        setIsProcessing(false);
        return 'Customer deleted.';
      },
      error: (err) => {
        setIsProcessing(false);
        setCustomerToDelete(null);
        if (err.message.includes('foreign key constraint')) {
          return 'Error: Cannot delete customer with existing sales history.';
        }
        return `Error: ${err.message}`;
      }
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-lg">
            <h2 className="card-header">{editingCustomer ? `Edit ${editingCustomer.name}` : 'Add New Customer'}</h2>
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div><label htmlFor="customer-name" className="label-style">Name</label><input id="customer-name" type="text" required className="input-field" value={name} onChange={(e) => setName(e.target.value)} disabled={isProcessing}/></div>
              <div><label htmlFor="customer-phone" className="label-style">Phone</label><input id="customer-phone" type="tel" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isProcessing}/></div>
              <div><label htmlFor="customer-address" className="label-style">Address</label><input id="customer-address" type="text" className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} disabled={isProcessing}/></div>
              <div><label htmlFor="credit-limit" className="label-style">Credit Limit (RWF)</label><input id="credit-limit" type="number" step="0.01" required className="input-field" placeholder="0" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} disabled={isProcessing}/><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Enter 0 for no limit.</p></div>
              <div className="flex items-center space-x-3">
                <button type="submit" className="flex-1 rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50" disabled={isProcessing}>{isProcessing ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Add Customer'}</button>
                {editingCustomer && (<button type="button" onClick={cancelEditing} className="rounded-md bg-slate-200 dark:bg-slate-600 px-4 py-2 font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-300 dark:hover:bg-slate-500" disabled={isProcessing}>Cancel</button>)}
              </div>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white dark:bg-slate-800 p-4 md:p-6 shadow-lg">
            <h2 className="card-header flex items-center"><UserPlus className="mr-2 h-5 w-5" /> Your Customers</h2>
            <button onClick={fetchCustomers} disabled={loading || isProcessing} className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50">{loading ? 'Refreshing...' : 'Refresh List'}</button>
            
            {loading ? (<p className="py-10 text-center text-slate-500 dark:text-slate-400">Loading...</p>) : (
              <>
                <div className="mt-4 hidden md:block flow-root overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700"><tr><th className="th-style">Name</th><th className="th-style">Phone</th><th className="th-style">Address</th><th className="th-style">Credit Limit</th><th className="th-style">Actions</th></tr></thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                      {customers.length === 0 ? (<tr><td colSpan={5} className="td-style text-center text-slate-500 dark:text-slate-400">No customers yet.</td></tr>) : (
                        customers.map((customer) => (
                          <tr key={customer.id}>
                            <td className="td-style font-medium text-slate-900 dark:text-white">{customer.name}</td>
                            <td className="td-style text-slate-500 dark:text-slate-400">{customer.phone || 'N/A'}</td>
                            <td className="td-style text-slate-500 dark:text-slate-400">{customer.address || 'N/A'}</td>
                            <td className="td-style text-slate-500 dark:text-slate-400">{customer.credit_limit > 0 ? `${customer.credit_limit.toLocaleString()} RWF` : 'No Limit'}</td>
                            <td className="td-style space-x-2 whitespace-nowrap">
                              <button onClick={() => startEditing(customer)} disabled={isProcessing} className="action-button bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900"><Edit className="h-4 w-4" /></button>
                              <button onClick={() => openDeleteModal(customer)} disabled={isProcessing} className="action-button bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"><Trash2 className="h-4 w-4" /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 space-y-4 md:hidden">
                  {customers.length === 0 ? (<p className="py-10 text-center text-slate-500 dark:text-slate-400">No customers yet.</p>) : (
                    customers.map((customer) => (
                      <div key={customer.id} className="rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                        <div className="font-bold text-slate-900 dark:text-white">{customer.name}</div>
                        <div className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center"><Phone className="mr-2 h-4 w-4" /> {customer.phone || 'No phone'}</div>
                          <div className="flex items-center"><MapPin className="mr-2 h-4 w-4" /> {customer.address || 'No address'}</div>
                          <div className="flex items-center"><ShieldCheck className="mr-2 h-4 w-4" />
                            Limit: <span className="ml-1 font-medium">{customer.credit_limit > 0 ? `${customer.credit_limit.toLocaleString()} RWF` : 'No Limit'}</span>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                          <button onClick={() => startEditing(customer)} disabled={isProcessing} className="action-button justify-center bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900"><Edit className="mr-1.5 h-4 w-4" /> Edit</button>
                          <button onClick={() => openDeleteModal(customer)} disabled={isProcessing} className="action-button justify-center bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"><Trash2 className="mr-1.5 h-4 w-4" /> Delete</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer?"
        isProcessing={isProcessing}
      >
        <p className="dark:text-slate-300">Are you sure you want to delete <span className="font-bold">{customerToDelete?.name}</span>? This cannot be undone.</p>
        <p className="mt-2 text-sm font-bold text-red-600">Note: Customers with existing sales history cannot be deleted.</p>
      </ConfirmModal>
    </>
  );
}