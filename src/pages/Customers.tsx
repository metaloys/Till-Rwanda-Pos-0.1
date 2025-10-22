import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { Customer } from '../appTypes';
import { Edit, UserPlus, XCircle } from 'lucide-react'; // Added icons

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- NEW STATE FOR EDITING ---
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  // --- END NEW STATE ---

  // State for the form (used for both add and edit)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(''); // New state for credit limit

  // Fetch all customers
  async function fetchCustomers() {
    // No setLoading(true) for background refresh
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching customers:', error.message);
    } else if (data) {
      setCustomers(data);
    }
    setLoading(false); // Only set initial loading false
  }

  // Fetch on load
  useEffect(() => {
    setLoading(true);
    fetchCustomers();
  }, []);

  // --- NEW: Pre-fill form for editing ---
  const startEditing = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone || '');
    setAddress(customer.address || '');
    setCreditLimit(customer.credit_limit.toString()); // Pre-fill credit limit
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
  };

  // --- NEW: Cancel editing ---
  const cancelEditing = () => {
    setEditingCustomer(null);
    // Clear form
    setName(''); setPhone(''); setAddress(''); setCreditLimit('');
  };

  // --- UPDATED: Handle form submission (Add OR Edit) ---
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const customerData = {
      name: name,
      phone: phone || null,
      address: address || null,
      credit_limit: parseFloat(creditLimit || '0'), // Save credit limit, default to 0 if empty
      // user_id is set automatically by DB on insert
    };

    try {
      if (editingCustomer) {
        // --- EDIT LOGIC ---
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', editingCustomer.id); // Specify which customer to update
        if (error) throw new Error(error.message);
        alert('Customer updated successfully!');
        // --- END EDIT LOGIC ---
      } else {
        // --- ADD LOGIC ---
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('You must be logged in.');
        // user_id is already included in customerData via the DB default
        const { error } = await supabase.from('customers').insert(customerData);
        if (error) throw new Error(error.message);
        alert('Customer added successfully!');
        // --- END ADD LOGIC ---
      }
      cancelEditing(); // Clear form and reset editing state
      fetchCustomers(); // Refresh list

    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* LEFT COLUMN: Add/Edit Customer Form */}
      <div className="lg:col-span-1">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingCustomer ? `Edit ${editingCustomer.name}` : 'Add New Customer'}
          </h2>
          <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
            <div><label htmlFor="customer-name" className="label-style">Name</label><input id="customer-name" type="text" required className="input-field" value={name} onChange={(e) => setName(e.target.value)} disabled={isProcessing}/></div>
            <div><label htmlFor="customer-phone" className="label-style">Phone (e.g., +2507...)</label><input id="customer-phone" type="tel" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isProcessing}/></div>
            <div><label htmlFor="customer-address" className="label-style">Address (Opt)</label><input id="customer-address" type="text" className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} disabled={isProcessing}/></div>
            {/* --- NEW CREDIT LIMIT FIELD --- */}
            <div>
                <label htmlFor="credit-limit" className="label-style">
                    Credit Limit (RWF)
                </label>
                <input
                    id="credit-limit" type="number" step="0.01" required
                    className="input-field" placeholder="0 (means no limit)"
                    value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)}
                    disabled={isProcessing}
                />
                 <p className="mt-1 text-xs text-gray-500">Enter 0 if no specific limit is needed.</p>
            </div>
            {/* --- END CREDIT LIMIT FIELD --- */}

            <div className="flex items-center space-x-3">
              <button type="submit" className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50" disabled={isProcessing}>
                 {isProcessing ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Add Customer'}
              </button>
              {editingCustomer && (
                <button type="button" onClick={cancelEditing} className="rounded-md bg-gray-200 px-4 py-2 font-semibold text-gray-700 shadow-sm hover:bg-gray-300" disabled={isProcessing}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Customer List */}
      <div className="lg:col-span-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="flex items-center text-lg font-semibold text-gray-900">
             <UserPlus className="mr-2 h-5 w-5" /> Your Customers
          </h2>
           <button onClick={fetchCustomers} disabled={loading || isProcessing} className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50">
             {loading ? 'Refreshing...' : 'Refresh List'}
           </button>
          <div className="mt-4 flow-root">
            {loading && customers.length === 0 ? (<p>Loading...</p>) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="th-style">Name</th>
                    <th className="th-style">Phone</th>
                    <th className="th-style">Address</th>
                    {/* --- ADD CREDIT LIMIT HEADER --- */}
                    <th className="th-style">Credit Limit</th>
                    <th className="th-style">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {customers.length === 0 ? (
                    <tr><td colSpan={5} className="td-style text-center text-gray-500">No customers yet.</td></tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="td-style font-medium text-gray-900">{customer.name}</td>
                        <td className="td-style text-gray-500">{customer.phone || 'N/A'}</td>
                        <td className="td-style text-gray-500">{customer.address || 'N/A'}</td>
                        {/* --- ADD CREDIT LIMIT CELL --- */}
                        <td className="td-style text-gray-500">
                            {customer.credit_limit > 0 ? `${customer.credit_limit.toLocaleString()} RWF` : 'No Limit'}
                        </td>
                        {/* --- ADD EDIT BUTTON --- */}
                        <td className="td-style space-x-2 whitespace-nowrap">
                           <button onClick={() => startEditing(customer)} disabled={isProcessing} className="action-button bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
                             <Edit className="mr-1 h-3 w-3" /> Edit
                           </button>
                            {/* We can add Delete later */}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Ensure helper styles are in src/index.css
/*
.label-style { @apply block text-sm font-medium text-gray-700; }
.input-field { @apply mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500; }
.th-style { @apply px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 tracking-wider; }
.td-style { @apply px-4 py-3 whitespace-nowrap; }
.action-button { @apply inline-flex items-center rounded px-2 py-1 text-xs font-medium disabled:opacity-50; }
*/