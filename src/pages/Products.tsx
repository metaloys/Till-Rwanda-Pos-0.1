import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { Product, UserRole, Profile } from '../appTypes';
import { Edit, Package, Tag } from 'lucide-react';
import ProductVariantModal from '../components/ProductVariantModal';

interface ProductsProps {
  shopId: string;
  userRole: UserRole;
  profile: Profile;
}

export default function Products({ shopId }: ProductsProps) {
  // To satisfy build, we can just log them
  console.log(userRole, profile); 

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
    const { data, error } = await supabase.from('products').select('id, name, created_at, category, image_url, has_variants');
    if (error) { console.error('Error fetching products:', error.message); } 
    else if (data) { setProducts(data as Product[]); }
    setLoading(false);
  }

  useEffect(() => { if(shopId) fetchProducts(); }, [shopId]);

  const openVariantManagement = (product: Product) => { setSelectedProduct(product); setShowVariantModal(true); };
  const startEditing = (product: Product) => { setEditingProduct(product); setName(product.name); setCategory(product.category || ''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cancelEditing = () => { setEditingProduct(null); setName(''); setCategory(''); };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const productData = { name, category: category || null, has_variants: editingProduct ? editingProduct.has_variants : false, shop_id: shopId };
    try {
      if (editingProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
        if (error) throw new Error(error.message);
        alert('Product updated!');
      } else {
        const { data: newProduct, error } = await supabase.from('products').insert(productData).select().single();
        if (error || !newProduct) throw new Error(error?.message || 'Failed to create product.');
        alert('Product added! Please add variants next.');
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
      <div className="lg:col-span-1">
        <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-lg">
          <h2 className="card-header">{editingProduct ? `Edit ${editingProduct.name}` : 'Add New Parent Product'}</h2>
          <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
            <div><label htmlFor="name" className="label-style">Product Name</label><input id="name" type="text" required className="input-field" value={name} onChange={(e) => setName(e.target.value)} disabled={isProcessing}/></div>
            <div><label htmlFor="category" className="label-style">Category (Opt)</label><input id="category" type="text" className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} disabled={isProcessing}/></div>
            <div className="flex items-center space-x-3">
              <button type="submit" className="flex-1 rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50" disabled={isProcessing}>
                 {isProcessing ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
              </button>
              {editingProduct && (<button type="button" onClick={cancelEditing} className="rounded-md bg-slate-200 dark:bg-slate-600 px-4 py-2 font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-300 dark:hover:bg-slate-500" disabled={isProcessing}>Cancel</button>)}
            </div>
          </form>
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="rounded-lg bg-white dark:bg-slate-800 p-4 md:p-6 shadow-lg">
          <h2 className="card-header">Your Products</h2>
           <button onClick={fetchProducts} disabled={loading || isProcessing} className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50">
             {loading ? 'Refreshing...' : 'Refresh List'}
           </button>
           
          {loading ? (<p className="py-10 text-center text-slate-500 dark:text-slate-400">Loading...</p>) : (
            <>
              <div className="mt-4 hidden md:block flow-root overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-700"><tr><th className="th-style">Name</th><th className="th-style">Category</th><th className="th-style">Variants?</th><th className="th-style">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                    {products.length === 0 ? (
                      <tr><td colSpan={4} className="td-style text-center text-slate-500 dark:text-slate-400">No products yet.</td></tr>
                    ) : (
                      products.map((product) => (
                        <tr key={product.id}>
                          <td className="td-style font-medium text-slate-900 dark:text-white">{product.name}</td>
                          <td className="td-style text-slate-500 dark:text-slate-400">{product.category || 'N/A'}</td>
                          <td className="td-style">{product.has_variants ? <span className="text-purple-600 dark:text-purple-400 font-medium">Yes</span> : <span className="text-slate-500 dark:text-slate-400">No</span>}</td>
                          <td className="td-style space-x-2 whitespace-nowrap">
                            <button onClick={() => openVariantManagement(product)} disabled={isProcessing} className="action-button bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900"><Package className="mr-1 h-3 w-3" /> Manage Variants</button>
                            <button onClick={() => startEditing(product)} disabled={isProcessing} className="action-button bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900"><Edit className="mr-1 h-3 w-3" /> Edit Details</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 space-y-4 md:hidden">
                {products.length === 0 ? (<p className="py-10 text-center text-slate-500 dark:text-slate-400">No products yet.</p>) : (
                  products.map((product) => (
                    <div key={product.id} className="rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 dark:text-white">{product.name}</div>
                        {product.has_variants ? (
                          <span className="rounded-full bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">Variants</span>
                        ) : (
                          <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">Simple</span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center"><Tag className="mr-2 h-4 w-4" /> {product.category || 'No Category'}</div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                        <button onClick={() => openVariantManagement(product)} disabled={isProcessing} className="action-button justify-center bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900">
                          <Package className="mr-1.5 h-4 w-4" /> Manage Variants
                        </button>
                        <button onClick={() => startEditing(product)} disabled={isProcessing} className="action-button justify-center bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900">
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