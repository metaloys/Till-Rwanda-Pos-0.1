import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { Expense } from '../appTypes';
import { ReceiptText, Upload, Repeat2 } from 'lucide-react'; // Added Repeat2 icon

const DEFAULT_CATEGORIES = ['Rent', 'Utilities', 'Stock Purchase', 'Transport', 'Salaries', 'Airtime', 'Other'];
// Options for recurrence interval
const RECURRENCE_OPTIONS = [
    { value: '', label: 'Does Not Repeat' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' },
];

export default function ExpenseTracking() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // --- NEW STATE FOR RECURRENCE ---
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  // --- END NEW STATE ---

  // Fetch all expenses
  async function fetchExpenses() { /* ... same as before ... */
    setLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) { console.error('Error fetching expenses:', error.message); alert(error.message); } 
    else if (data) { setExpenses(data); }
    setLoading(false);
  }

  useEffect(() => { fetchExpenses(); }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => { /* ... same as before ... */
    if (e.target.files && e.target.files.length > 0) {
      setReceiptFile(e.target.files[0]);
    } else {
      setReceiptFile(null);
    }
  };

  // Handle the form submission to add a new expense
  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    let uploadedReceiptUrl: string | null = null;
    
    try {
      // 1. Upload the file to Supabase Storage (if selected)
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `receipts/${fileName}`; 

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, receiptFile, { cacheControl: '3600', upsert: false });

        if (uploadError) throw new Error(`Receipt upload failed: ${uploadError.message}`);
        uploadedReceiptUrl = `${supabase.storage.from('receipts').getPublicUrl(uploadData.path).data.publicUrl}`;
      }
      
      // 2. Insert the expense record
      const expenseData = {
        description: description,
        amount: parseFloat(amount),
        category: category || null,
        expense_date: expenseDate,
        receipt_url: uploadedReceiptUrl,
        // --- NEW RECURRENCE DATA ---
        is_recurring: isRecurring,
        recurrence_interval: isRecurring ? recurrenceInterval : null,
        next_due_date: isRecurring ? nextDueDate : null,
        // --- END RECURRENCE DATA ---
      };

      const { error: insertError } = await supabase.from('expenses').insert(expenseData);
      if (insertError) throw new Error(insertError.message);

      // 3. Clear the form
      setDescription(''); setAmount(''); setCategory(DEFAULT_CATEGORIES[0]);
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setReceiptFile(null);
      setIsRecurring(false); setRecurrenceInterval(''); setNextDueDate('');
      (document.getElementById('receipt') as HTMLInputElement).value = ''; 

      // 4. Refresh and Alert
      fetchExpenses();
      alert('Expense added successfully!');

    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSignedUrl = async (path: string): Promise<string | null> => { /* ... same as before ... */
    const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 60); 
    if (error) { console.error('Error creating signed URL:', error.message); alert(`Could not generate link for receipt: ${error.message}`); return null; }
    return data?.signedUrl ?? null;
  };
  const handleViewReceipt = async (receiptUrl: string) => { /* ... same as before ... */
    const publicIndex = receiptUrl.indexOf('public/'); if (publicIndex === -1) { alert('Could not parse public URL structure.'); return; }
    const relativePath = receiptUrl.substring(publicIndex + 'public/'.length); 
    const filePath = relativePath.split('/').slice(1).join('/');
    if (filePath) {
        const signedUrl = await getSignedUrl(filePath);
        if (signedUrl) { window.open(signedUrl, '_blank'); }
    } else { alert('Could not find file path.'); }
  };


  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* LEFT COLUMN: Add New Expense Form */}
      <div className="lg:col-span-1">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Record New Expense</h2>
          <form onSubmit={handleAddExpense} className="mt-4 space-y-4">
            <div><label htmlFor="expense-date" className="label-style">Date of Expense</label><input id="expense-date" type="date" required className="input-field" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} disabled={isProcessing}/></div>
            <div><label htmlFor="description" className="label-style">Description</label><input id="description" type="text" required className="input-field" placeholder="e.g., MTN Airtime, Office Rent" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isProcessing}/></div>
             <div><label htmlFor="category" className="label-style">Category</label><select id="category" required className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} disabled={isProcessing}>{DEFAULT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
            <div><label htmlFor="amount" className="label-style">Amount (RWF)</label><input id="amount" type="number" step="0.01" required className="input-field" placeholder="e.g., 5000" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isProcessing}/></div>
            
            {/* --- NEW RECURRENCE SECTION --- */}
            <div className="border-t pt-4">
                <div className="flex items-center space-x-2">
                    <input
                       id="is_recurring" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       checked={isRecurring} onChange={(e) => { setIsRecurring(e.target.checked); setRecurrenceInterval(''); setNextDueDate(''); }} disabled={isProcessing}
                    />
                    <label htmlFor="is_recurring" className="label-style text-base cursor-pointer">
                        Recurring Expense?
                    </label>
                </div>
                {isRecurring && (
                    <div className="mt-3 space-y-3 rounded-md bg-gray-50 p-4">
                        <div>
                           <label htmlFor="interval" className="label-style">Repeats Every:</label>
                           <select id="interval" required className="input-field" value={recurrenceInterval} onChange={(e) => setRecurrenceInterval(e.target.value)} disabled={isProcessing}>
                               {RECURRENCE_OPTIONS.map(opt => <option key={opt.value} value={opt.value} disabled={!opt.value}>{opt.label}</option>)}
                           </select>
                        </div>
                        {recurrenceInterval && (
                          <div>
                            <label htmlFor="next_due" className="label-style">Next Due Date:</label>
                            <input id="next_due" type="date" required className="input-field" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} disabled={isProcessing}/>
                          </div>
                        )}
                    </div>
                )}
            </div>
            {/* --- END RECURRENCE SECTION --- */}

            <div>
               <label htmlFor="receipt" className="label-style flex items-center"><Upload className="mr-2 h-4 w-4" /> Receipt Image (Optional)</label>
               <input id="receipt" type="file" accept="image/*, application/pdf" className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={handleFileChange} disabled={isProcessing}/>
               {receiptFile && <p className="mt-1 text-xs text-gray-500">Selected: {receiptFile.name}</p>}
             </div>
            
            <button type="submit" className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50" disabled={isProcessing}>
              {isProcessing ? 'Saving...' : 'Add Expense'}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Expense List */}
      <div className="lg:col-span-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="flex items-center text-lg font-semibold text-gray-900">
             <ReceiptText className="mr-2 h-5 w-5" /> Recorded Expenses
           </h2>
          <button onClick={fetchExpenses} disabled={loading || isProcessing} className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50">
            {loading ? 'Refreshing...' : 'Refresh List'}
          </button>
          <div className="mt-4 flow-root">
            {loading && expenses.length === 0 ? (<p>Loading expenses...</p>) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="th-style">Date</th>
                    <th className="th-style">Description</th>
                    <th className="th-style">Category</th>
                    <th className="th-style">Amount</th>
                    {/* --- ADD RECURRENCE HEADER --- */}
                    <th className="th-style">Recurrence</th>
                    <th className="th-style">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {expenses.length === 0 ? (
                    <tr><td colSpan={6} className="td-style text-center text-gray-500">No expenses recorded yet.</td></tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="td-style text-sm text-gray-500">{expense.expense_date}</td>
                        <td className="td-style font-medium text-gray-900">{expense.description}</td>
                        <td className="td-style text-sm text-gray-500">{expense.category || 'N/A'}</td>
                        <td className="td-style font-medium text-red-700">{expense.amount.toLocaleString()} RWF</td>
                        {/* --- DISPLAY RECURRENCE STATUS --- */}
                        <td className="td-style text-sm text-gray-500">
                           {expense.is_recurring ? (
                               <div className="flex items-center space-x-1 font-medium text-purple-700">
                                   <Repeat2 className="h-4 w-4" />
                                   <span className="capitalize">{expense.recurrence_interval}</span>
                               </div>
                           ) : (
                               'One-time'
                           )}
                        </td>
                        {/* --- END RECURRENCE DISPLAY --- */}
                        <td className="td-style">
                            {expense.receipt_url ? (
                                <button
                                    onClick={() => handleViewReceipt(expense.receipt_url as string)}
                                    className="action-button bg-purple-100 text-purple-700 hover:bg-purple-200"
                                >
                                    View Receipt
                                </button>
                            ) : (
                                'N/A'
                            )}
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