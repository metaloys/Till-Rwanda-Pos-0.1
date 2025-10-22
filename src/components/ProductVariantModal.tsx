import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { Product, ProductVariant } from '../appTypes';
import { X, PlusCircle, Trash2, Loader2, MinusCircle } from 'lucide-react';

// --- ADD THE CONSTANT HERE ---
const LOW_STOCK_THRESHOLD = 5; // Used for highlighting low stock
// --- END ADDITION ---

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null; // The parent product being edited
  onVariantUpdate: () => void; // Function to call to refresh the parent list
}

export default function ProductVariantModal({
  isOpen,
  onClose,
  product,
  onVariantUpdate,
}: VariantModalProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // State for the new variant form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [attribute1, setAttribute1] = useState('');
  const [attribute2, setAttribute2] = useState('');

  useEffect(() => {
    if (isOpen && product) {
      fetchVariants(product.id);
    } else {
      setVariants([]); // Clear when closed
      // Clear form when closed
      setName(''); setPrice(''); setStock(''); setAttribute1(''); setAttribute2('');
    }
  }, [isOpen, product]);

  async function fetchVariants(productId: number) {
    setLoading(true);
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching variants:', error.message);
      alert(error.message);
    } else if (data) {
      setVariants(data);
    }
    setLoading(false);
  }

  // Handle adding a new variant
  const handleAddVariant = async (e: FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsProcessing(true);

    const variantData = {
      product_id: product.id,
      name: name || `${attribute1 || ''} ${attribute2 || ''}`.trim(),
      attribute_1: attribute1 || null,
      attribute_2: attribute2 || null,
      price: parseFloat(price),
      stock_quantity: parseInt(stock, 10),
    };

    try {
      const { error } = await supabase.from('product_variants').insert(variantData);
      if (error) throw new Error(error.message);

      // Clear form fields
      setName(''); setPrice(''); setStock(''); setAttribute1(''); setAttribute2('');
      fetchVariants(product.id); // Refresh list
      onVariantUpdate(); // Notify parent component
    } catch (error: any) {
      alert(`Error adding variant: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle deleting a variant
  const handleDeleteVariant = async (variantId: number) => {
    if (!product || !confirm('Are you sure you want to delete this variant? Stock will be lost.')) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw new Error(error.message);

      fetchVariants(product.id); // Refresh list
      onVariantUpdate(); // Notify parent component
    } catch (error: any) {
      alert(`Error deleting variant: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={20} /></button>

        <h2 className="mb-4 text-2xl font-bold text-gray-800">
          Variants for: {product.name}
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Define size, color, or other options. Each variant has its own price and stock.
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT: Add New Variant Form */}
          <div className="lg:col-span-1 rounded-lg border border-dashed border-gray-300 p-4">
            <h3 className="mb-3 text-lg font-semibold">Add New Variant</h3>
            <form onSubmit={handleAddVariant} className="space-y-3">
              <div><label htmlFor="name" className="label-style">Variant Name (e.g., Small Red)</label><input id="name" type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} disabled={isProcessing} /></div>
              <div className="grid grid-cols-2 gap-2">
                 <div><label htmlFor="attr1" className="label-style">Attribute 1 (Size)</label><input id="attr1" type="text" className="input-field" value={attribute1} onChange={(e) => setAttribute1(e.target.value)} disabled={isProcessing} /></div>
                 <div><label htmlFor="attr2" className="label-style">Attribute 2 (Color)</label><input id="attr2" type="text" className="input-field" value={attribute2} onChange={(e) => setAttribute2(e.target.value)} disabled={isProcessing} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <div><label htmlFor="price" className="label-style">Price (RWF)</label><input id="price" type="number" step="0.01" required className="input-field" value={price} onChange={(e) => setPrice(e.target.value)} disabled={isProcessing} /></div>
                 <div><label htmlFor="stock" className="label-style">Initial Stock</label><input id="stock" type="number" required className="input-field" value={stock} onChange={(e) => setStock(e.target.value)} disabled={isProcessing} /></div>
              </div>
              <button type="submit" disabled={isProcessing || !price || !stock} className="w-full rounded-md bg-green-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50">
                {isProcessing ? 'Adding...' : 'Create Variant'}
              </button>
            </form>
          </div>

          {/* RIGHT: Variant List */}
          <div className="lg:col-span-2 overflow-x-auto">
            <h3 className="mb-3 text-lg font-semibold">Current Variants ({variants.length})</h3>
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-500" /></div>
            ) : variants.length === 0 ? (
                <p className="text-gray-500">No variants defined. Add one using the form.</p>
            ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="th-style">Variant Name</th>
                            <th className="th-style">Price</th>
                            <th className="th-style">Stock</th>
                            <th className="th-style text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {variants.map((variant) => (
                            <tr key={variant.id}>
                                <td className="td-style font-medium">{variant.name || `${variant.attribute_1 || ''} ${variant.attribute_2 || ''}`.trim()}</td>
                                <td className="td-style">{variant.price.toLocaleString()} RWF</td>
                                <td className={`td-style font-semibold ${variant.stock_quantity <= LOW_STOCK_THRESHOLD ? 'text-red-600' : 'text-gray-900'}`}>{variant.stock_quantity}</td>
                                <td className="td-style text-right whitespace-nowrap">
                                    {/* Edit button placeholder here */}
                                    <button onClick={() => handleDeleteVariant(variant.id)} disabled={isProcessing} className="action-button bg-red-100 text-red-700 hover:bg-red-200 ml-2">
                                        <Trash2 className="h-3 w-3" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
          </div>
        </div>
        <div className="mt-6 text-right">
             <button onClick={onClose} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-300">
                 Done
             </button>
         </div>
      </div>
    </div>
  );
}