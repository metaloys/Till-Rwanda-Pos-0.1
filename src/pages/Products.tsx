import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { Product, UserRole, Profile } from '../appTypes';
import { Edit, Package, Tag } from 'lucide-react'; // Added Tag for mobile
import ProductVariantModal from '../components/ProductVariantModal';

interface ProductsProps {
  shopId: string;
  userRole: UserRole;
  profile: Profile;
}

export default function Products({ shopId }: ProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');

  async function fetchProducts() {
    setLoading(true);
    // RLS handles filtering, just select the columns
    const { data, error } = await supabase.from('products').select('id, name, created_at, category, image_url, has_variants');
    if (error) {
        console.error('Error fetching products:', error.message);
    } else if (data) {
        setProducts(data as Product[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if(shopId) fetchProducts(); // Fetch products only when shopId is available
  }, [shopId]);

  const openVariantManagement = (product: Product) => {
    setSelectedProduct(product);
    setShowVariantModal(true);
  };

  const startEditing = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingProduct(null);
    setName('');
    setCategory('');
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const productData = { name, category: category || null, has_variants: editingProduct ? editingProduct.has_variants : false, shop_id: shopId };
    try {
      if (editingProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
        if (error) throw new Error(error.message);
        alert('Product updated successfully!');
      } else {
        const { data: newProduct, error } = await supabase.from('products').insert(productData).select().single();
        if (error || !newProduct) throw new Error(error?.message || 'Failed to create product.');
        alert('Parent Product added! Please add variants next.');
        setSelectedProduct(newProduct as Product);
        setShowVariantModal(true);
      }
      cancelEditing();
      fetchProducts();
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
          <h2 className="text-lg font-semibold text-gray-900">
            {editingProduct ? `Edit ${editingProduct.name}` : 'Add New Parent Product'}
          </h2>
          <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
            <div><label htmlFor="name" className="label-style">Product Name</label><input id="name" type="text" required className="input-field" value={name} onChange={(e) => setName(e.target.value)} disabled={isProcessing}/></div>
            <div><label htmlFor="category" className="label-style">Category (Opt)</label><input id="category" type="text" className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} disabled={isProcessing}/></div>
            <div className="flex items-center space-x-3">
              <button type="submit" className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50" disabled={isProcessing}>
                 {isProcessing ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
              </button>
              {editingProduct && (<button type="button" onClick={cancelEditing} className="rounded-md bg-gray-200 px-4 py-2 font-semibold text-gray-700 shadow-sm hover:bg-gray-300" disabled={isProcessing}>Cancel</button>)}
            </div>
          </form>
        </div>
      </div>

      {/* --- LIST (Right Column) --- */}
      <div className="lg:col-span-2">
        <div className="rounded-lg bg-white p-4 md:p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Your Products</h2>
           <button onClick={fetchProducts} disabled={loading || isProcessing} className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50">
             {loading ? 'Refreshing...' : 'Refresh List'}
           </button>
           
          {loading ? (
            <p className="py-10 text-center text-gray-500">Loading products...</p>
          ) : (
            <>
              {/* --- DESKTOP TABLE (Hidden on mobile) --- */}
              <div className="mt-4 hidden md:block flow-root overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50"><tr><th className="th-style">Name</th><th className="th-style">Category</th><th className="th-style">Variants?</th><th className="th-style">Actions</th></tr></thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {products.length === 0 ? (
                      <tr><td colSpan={4} className="td-style text-center text-gray-500">No products yet.</td></tr>
                    ) : (
                      products.map((product) => (
                        <tr key={product.id}>
                          <td className="td-style font-medium text-gray-900">{product.name}</td>
                          <td className="td-style text-gray-500">{product.category || 'N/A'}</td>
                          <td className="td-style">{product.has_variants ? <span className="text-purple-600 font-medium">Yes</span> : <span className="text-gray-500">No</span>}</td>
                          <td className="td-style space-x-2 whitespace-nowrap">
                            <button onClick={() => openVariantManagement(product)} disabled={isProcessing} className="action-button bg-purple-100 text-purple-700 hover:bg-purple-200"><Package className="mr-1 h-3 w-3" /> Manage Variants</button>
                            <button onClick={() => startEditing(product)} disabled={isProcessing} className="action-button bg-yellow-100 text-yellow-700 hover:bg-yellow-200"><Edit className="mr-1 h-3 w-3" /> Edit Details</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* --- MOBILE CARD LIST (Visible on mobile) --- */}
              <div className="mt-4 space-y-4 md:hidden">
                {products.length === 0 ? (<p className="py-10 text-center text-gray-500">No products yet.</p>) : (
                  products.map((product) => (
                    <div key={product.id} className="rounded-lg border bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-900">{product.name}</div>
                        {product.has_variants ? (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">Variants</span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">Simple</span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <div className="flex items-center"><Tag className="mr-2 h-4 w-4" /> {product.category || 'No Category'}</div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
                        <button onClick={() => openVariantManagement(product)} disabled={isProcessing} className="action-button justify-center bg-purple-100 text-purple-700 hover:bg-purple-200">
                          <Package className="mr-1.5 h-4 w-4" /> Manage Variants
                        </button>
                        <button onClick={() => startEditing(product)} disabled={isProcessing} className="action-button justify-center bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
                          <Edit className="mr-1.5 h-4 w-4" /> Edit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <ProductVariantModal isOpen={showVariantModal} onClose={() => {setShowVariantModal(false); setSelectedProduct(null);}} product={selectedProduct} onVariantUpdate={fetchProducts}/>
    </div>
  );
}
