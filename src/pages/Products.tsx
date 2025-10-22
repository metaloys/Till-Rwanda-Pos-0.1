import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { Product } from '../appTypes';
import { PlusCircle, Edit, XCircle, Trash2, Package } from 'lucide-react'; // Added Package icon
import ProductVariantModal from '../components/ProductVariantModal'; // 1. IMPORT THE MODAL

const LOW_STOCK_THRESHOLD = 5; // Used for display purposes

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // --- NEW STATE FOR VARIANT MODAL ---
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // --- END NEW STATE ---

  // State for the form (now ONLY for parent product details)
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  // Price and Stock are NO LONGER needed here!

  // Fetch all parent products
  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) console.error('Error fetching products:', error.message);
    else if (data) setProducts(data);
    setLoading(false);
  }

  useEffect(() => { setLoading(true); fetchProducts(); }, []);

  // --- NEW: Open Variant Management Modal ---
  const openVariantManagement = (product: Product) => {
    setSelectedProduct(product);
    setShowVariantModal(true);
  };
  // --- END NEW ---

  // Pre-fill form for editing (only parent fields remain)
  const startEditing = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category || '');
    // Reset the rest
    // setPrice(''); setStock(''); // These fields are removed/disabled
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingProduct(null);
    setName(''); setCategory('');
  };

  // --- UPDATED: Handle form submission (Add OR Edit Parent Product) ---
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const productData = {
      name: name,
      category: category || null,
      // Default to no variants when creating a new parent product
      has_variants: editingProduct ? editingProduct.has_variants : false, 
      // price and stock are GONE
    };

    try {
      if (editingProduct) {
        // --- EDIT LOGIC ---
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw new Error(error.message);
        alert('Product updated successfully!');
        // --- END EDIT LOGIC ---
      } else {
        // --- ADD LOGIC ---
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('You must be logged in.');

        const { data: newProduct, error } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single(); // Get the ID of the new product
            
        if (error || !newProduct) throw new Error(error?.message || 'Failed to create product.');

        alert('Parent Product added successfully! Please add variants next.');
        // --- Automatically open variant modal after creation ---
        setSelectedProduct(newProduct);
        setShowVariantModal(true);
        // --- END AUTO OPEN ---
      }
      cancelEditing();
      fetchProducts();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  // --- END UPDATED FUNCTION ---

  // Handle adding stock is now more complex. We need to do it in the variant modal.
  // We'll keep this as a placeholder, but the main logic is now in the modal.
  const handleAddStock = async (product: Product) => {
     alert(`Please use the 'Manage Variants' button to adjust stock for ${product.name}'s specific options.`);
  };


  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* LEFT COLUMN: Add/Edit Parent Product Form */}
      <div className="lg:col-span-1">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingProduct ? `Edit ${editingProduct.name} Details` : 'Add New Parent Product'}
          </h2>
          <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
            <div><label htmlFor="name" className="label-style">Product Name</label><input id="name" type="text" required className="input-field" value={name} onChange={(e) => setName(e.target.value)} disabled={isProcessing}/></div>
            <div><label htmlFor="category" className="label-style">Category (Opt)</label><input id="category" type="text" className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} disabled={isProcessing}/></div>
            
            {/* Note: Price and Stock removed from here */}

            <div className="flex items-center space-x-3">
              <button type="submit" className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50" disabled={isProcessing}>
                 {isProcessing ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
              </button>
              {editingProduct && (
                <button type="button" onClick={cancelEditing} className="rounded-md bg-gray-200 px-4 py-2 font-semibold text-gray-700 shadow-sm hover:bg-gray-300" disabled={isProcessing}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Product List */}
      <div className="lg:col-span-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Your Products</h2>
           <button onClick={() => { setLoading(true); fetchProducts(); }} disabled={loading || isProcessing} className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50">
             {loading ? 'Refreshing...' : 'Refresh List'}
           </button>
          <div className="mt-4 flow-root">
            {loading && products.length === 0 ? (<p>Loading...</p>) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="th-style">Name</th>
                    <th className="th-style">Category</th>
                    <th className="th-style">Variants?</th>
                    <th className="th-style">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {products.length === 0 ? (
                    <tr><td colSpan={5} className="td-style text-center text-gray-500">No products yet.</td></tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id}>
                        <td className="td-style font-medium text-gray-900">{product.name}</td>
                        <td className="td-style text-gray-500">{product.category || 'N/A'}</td>
                        <td className="td-style">
                            {product.has_variants ? 
                              <span className="text-purple-600 font-medium">Yes</span> : 
                              <span className="text-gray-500">No</span>
                            }
                        </td>
                        <td className="td-style space-x-2 whitespace-nowrap">
                          {/* --- UPDATED ACTION BUTTONS --- */}
                          <button onClick={() => openVariantManagement(product)} disabled={isProcessing} className="action-button bg-purple-100 text-purple-700 hover:bg-purple-200">
                            <Package className="mr-1 h-3 w-3" /> Manage Variants
                          </button>
                          <button onClick={() => startEditing(product)} disabled={isProcessing} className="action-button bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
                            <Edit className="mr-1 h-3 w-3" /> Edit Details
                          </button>
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

      {/* --- ADD THE VARIANT MODAL --- */}
      <ProductVariantModal
          isOpen={showVariantModal}
          onClose={() => {setShowVariantModal(false); setSelectedProduct(null);}}
          product={selectedProduct}
          onVariantUpdate={fetchProducts} // Refresh parent list after a change
      />
      {/* --- END MODAL --- */}
    </div>
  );
}