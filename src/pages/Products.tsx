import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { Product, UserRole, Profile } from '../appTypes';
import { Edit, Package, Tag } from 'lucide-react';
import ProductVariantModal from '../components/ProductVariantModal';
import CacheStats from '../components/CacheStats';
import { toast } from 'react-hot-toast';

interface ProductsProps {
  shopId: string;
  userRole: UserRole;
  profile: Profile;
}

export default function Products({ shopId, userRole, profile }: ProductsProps) {
  // Log props to satisfy build
  console.log("Products page loaded for:", profile.full_name, "Role:", userRole);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('id, name, created_at, category, image_url, has_variants').eq('shop_id', shopId);
    if (error) { console.error('Error fetching products:', error.message); toast.error(error.message); } 
    else if (data) { setProducts(data as Product[]); }
    setLoading(false);
  }, [shopId]);

  useEffect(() => { 
    if(shopId) fetchProducts(); 
  }, [shopId, fetchProducts]);

  const openVariantManagement = (product: Product) => { setSelectedProduct(product); setShowVariantModal(true); };
  const startEditing = (product: Product) => { setEditingProduct(product); setName(product.name); setCategory(product.category || ''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cancelEditing = () => { setEditingProduct(null); setName(''); setCategory(''); };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const productData = { name, category: category || null, has_variants: true, shop_id: shopId };
    
    const promise = (async () => {
      if (editingProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;
        return { data: null, isEditing: true };
      } else {
        const { data: newProduct, error } = await supabase.from('products').insert(productData).select().single();
        if (error || !newProduct) throw (error || new Error('Failed to create product.'));
        return { data: newProduct, isEditing: false };
      }
    })();

    toast.promise(promise, {
      loading: 'Saving product...',
      success: (result: any) => {
        cancelEditing();
        fetchProducts();
        setIsProcessing(false);
        
        if (!result.isEditing && result.data) {
          setSelectedProduct(result.data as Product);
          setShowVariantModal(true);
          return 'Product added! Please add options now.';
        }
        return `Product ${editingProduct ? 'updated' : 'added'}!`;
      },
      error: (err) => {
        setIsProcessing(false);
        return `Error: ${err.message}`;
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-card hover:shadow-card-hover transition-all">
          <h2 className="card-header">{editingProduct ? `Edit ${editingProduct.name}` : 'Add New Product'}</h2>
          
          {/* Cache Stats */}
          <div className="mb-6 mt-4">
            <CacheStats shopId={shopId} />
          </div>

          <form onSubmit={handleFormSubmit} className="mt-4 space-y-4 animate-fade-in">
            <div><label htmlFor="name" className="label-style">Product Name (e.g., "Soda")</label><input id="name" type="text" required className="input-field" value={name} onChange={(e) => setName(e.target.value)} disabled={isProcessing}/></div>
            <div><label htmlFor="category" className="label-style">Category (Opt)</label><input id="category" type="text" className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} disabled={isProcessing}/></div>
            <div className="flex items-center space-x-3">
              <button type="submit" className="flex-1 rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white shadow-card hover:shadow-card-hover hover:bg-brand-700 transition-all disabled:opacity-50" disabled={isProcessing}>
                 {isProcessing ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
              </button>
              {editingProduct && (<button type="button" onClick={cancelEditing} className="rounded-lg bg-slate-200 dark:bg-slate-600 px-4 py-2 font-semibold text-slate-700 dark:text-slate-200 shadow-card hover:shadow-sm hover:bg-slate-300 dark:hover:bg-slate-500 transition-all" disabled={isProcessing}>Cancel</button>)}
            </div>
          </form>
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 md:p-6 shadow-card hover:shadow-card-hover transition-all">
          <h2 className="card-header">Your Products</h2>
           <button onClick={fetchProducts} disabled={loading || isProcessing} className="mt-2 text-xs text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50 transition-colors">
             {loading ? 'Refreshing...' : 'Refresh List'}
           </button>
           
          {loading ? (
            <p className="py-10 text-center text-slate-500 dark:text-slate-400">Loading products...</p>
          ) : (
            <>
              <div className="mt-4 hidden md:block flow-root overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  {/* --- FIX: Corrected classNameT to className --- */}
                  <thead className="bg-brand-50 dark:bg-slate-700/50"><tr><th className="th-style text-brand-700 dark:text-brand-300">Name</th><th className="th-style text-brand-700 dark:text-brand-300">Category</th><th className="th-style text-brand-700 dark:text-brand-300">Options?</th><th className="th-style text-brand-700 dark:text-brand-300">Actions</th></tr></thead>
                  {/* --- END FIX --- */}
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                    {products.length === 0 ? (
                      <tr><td colSpan={4} className="td-style text-center text-slate-500 dark:text-slate-400">No products yet.</td></tr>
                    ) : (
                      products.map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="td-style font-medium text-slate-900 dark:text-white">{product.name}</td>
                          <td className="td-style text-slate-500 dark:text-slate-400">{product.category || 'N/A'}</td>
                          <td className="td-style"><span className="text-brand-600 dark:text-brand-400 font-medium">Yes</span></td>
                          <td className="td-style space-x-2 whitespace-nowrap">
                            <button onClick={() => openVariantManagement(product)} disabled={isProcessing} className="action-button bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 dark:hover:bg-brand-900 hover:shadow-card transition-all"><Package className="mr-1 h-3 w-3" /> Manage Options</button>
                            <button onClick={() => startEditing(product)} disabled={isProcessing} className="action-button bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300 dark:hover:bg-warning-900 hover:shadow-card transition-all"><Edit className="mr-1 h-3 w-3" /> Edit</button>
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
                    <div key={product.id} className="rounded-2xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4 shadow-card hover:shadow-card-hover transition-all">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 dark:text-white">{product.name}</div>
                        <span className="rounded-full bg-brand-100 dark:bg-brand-900/50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-300">Has Options</span>
                      </div>
                      <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center"><Tag className="mr-2 h-4 w-4" /> {product.category || 'No Category'}</div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                        <button onClick={() => openVariantManagement(product)} disabled={isProcessing} className="action-button justify-center bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 dark:hover:bg-brand-900 hover:shadow-card transition-all">
                          <Package className="mr-1.5 h-4 w-4" /> Manage Options
                        </button>
                        <button onClick={() => startEditing(product)} disabled={isProcessing} className="action-button justify-center bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300 dark:hover:bg-warning-900 hover:shadow-card transition-all">
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