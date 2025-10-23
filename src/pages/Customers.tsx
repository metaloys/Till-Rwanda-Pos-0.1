import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { Customer, UserRole, Profile } from '../appTypes';
import { Edit, UserPlus, Phone, MapPin, ShieldCheck } from 'lucide-react'; // Added icons for mobile

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

  async function fetchCustomers() {
    const { data, error } = await supabase.from('customers').select('*').order('name', { ascending: true });
    if (error) console.error('Error fetching customers:', error.message);
    else if (data) setCustomers(data as Customer[]);
    setLoading(false);
  }

  useEffect(() => { setLoading(true); fetchCustomers(); }, [shopId]);

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
    const customerData = { name: name, phone: phone || null, address: address || null, credit_limit: parseFloat(creditLimit || '0'), shop_id: shopId };
    try {
      if (editingCustomer) {
        const { error } = await supabase.from('customers').update(customerData).eq('id', editingCustomer.id);
        if (error) throw new Error(error.message);
        alert('Customer updated successfully!');
      } else {
        const { error } = await supabase.from('customers').insert(customerData);
        if (error) throw new Error(error.message);
        alert('Customer added successfully!');
      }
      cancelEditing();
      fetchCustomers();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* --- FORM (Left Column) --- */}
      <div className="lg:col-span-1">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">{editingCustomer ? `Edit ${editingCustomer.name}` : 'Add New Customer'}</h2>
          <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
            <div><label htmlFor="customer-name" className="label-style">Name</label><input id="customer-name" type="text" required className="input-field" value={name} onChange={(e) => setName(e.target.value)} disabled={isProcessing}/></div>
            <div><label htmlFor="customer-phone" className="label-style">Phone (e.g., +2507...)</label><input id="customer-phone" type="tel" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isProcessing}/></div>
            <div><label htmlFor="customer-address" className="label-style">Address (Opt)</label><input id="customer-address" type="text" className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} disabled={isProcessing}/></div>
            <div><label htmlFor="credit-limit" className="label-style">Credit Limit (RWF)</label><input id="credit-limit" type="number" step="0.01" required className="input-field" placeholder="0 (no limit)" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} disabled={isProcessing}/><p className="mt-1 text-xs text-gray-500">Enter 0 for no limit.</p></div>
            <div className="flex items-center space-x-3">
              <button type="submit" className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50" disabled={isProcessing}>{isProcessing ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Add Customer'}</button>
              {editingCustomer && (<button type="button" onClick={cancelEditing} className="rounded-md bg-gray-200 px-4 py-2 font-semibold text-gray-700 shadow-sm hover:bg-gray-300" disabled={isProcessing}>Cancel</button>)}
            </div>
          </form>
        </div>
      </div>
      
      {/* --- LIST (Right Column) --- */}
      <div className="lg:col-span-2">
        <div className="rounded-lg bg-white p-4 md:p-6 shadow">
          <h2 className="flex items-center text-lg font-semibold text-gray-900"><UserPlus className="mr-2 h-5 w-5" /> Your Customers</h2>
          <button onClick={fetchCustomers} disabled={loading || isProcessing} className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50">{loading ? 'Refreshing...' : 'Refresh List'}</button>
          
          {loading ? (
            <p className="py-10 text-center text-gray-500">Loading customers...</p>
          ) : (
            <>
              {/* --- DESKTOP TABLE (Hidden on mobile) --- */}
              <div className="mt-4 hidden md:block flow-root overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50"><tr><th className="th-style">Name</th><th className="th-style">Phone</th><th className="th-style">Address</th><th className="th-style">Credit Limit</th><th className="th-style">Actions</th></tr></thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {customers.length === 0 ? (<tr><td colSpan={5} className="td-style text-center text-gray-500">No customers yet.</td></tr>) : (
                      customers.map((customer) => (
                        <tr key={customer.id}>
                          <td className="td-style font-medium text-gray-900">{customer.name}</td>
                          <td className="td-style text-gray-500">{customer.phone || 'N/A'}</td>
                          <td className="td-style text-gray-500">{customer.address || 'N/A'}</td>
                          <td className="td-style text-gray-500">{customer.credit_limit > 0 ? `${customer.credit_limit.toLocaleString()} RWF` : 'No Limit'}</td>
                          <td className="td-style space-x-2 whitespace-nowrap"><button onClick={() => startEditing(customer)} disabled={isProcessing} className="action-button bg-yellow-100 text-yellow-700 hover:bg-yellow-200"><Edit className="mr-1 h-3 w-3" /> Edit</button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* --- MOBILE CARD LIST (Visible on mobile) --- */}
              <div className="mt-4 space-y-4 md:hidden">
                {customers.length === 0 ? (<p className="py-10 text-center text-gray-500">No customers yet.</p>) : (
                  customers.map((customer) => (
                    <div key={customer.id} className="rounded-lg border bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-900">{customer.name}</div>
                        <button onClick={() => startEditing(customer)} disabled={isProcessing} className="action-button bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
                          <Edit className="mr-1 h-3 w-3" /> Edit
                        </button>
                      </div>
                      <div className="mt-2 space-y-1.5 text-sm text-gray-600">
                        <div className="flex items-center"><Phone className="mr-2 h-4 w-4" /> {customer.phone || 'No phone'}</div>
                        <div className="flex items-center"><MapPin className="mr-2 h-4 w-4" /> {customer.address || 'No address'}</div>
                        <div className="flex items-center"><ShieldCheck className="mr-2 h-4 w-4" />
                          Limit: <span className="ml-1 font-medium">{customer.credit_limit > 0 ? `${customer.credit_limit.toLocaleString()} RWF` : 'No Limit'}</span>
                        </div>
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
  );
}