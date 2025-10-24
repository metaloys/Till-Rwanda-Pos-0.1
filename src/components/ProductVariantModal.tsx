import { useState, useEffect, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { Product, ProductVariant } from '../appTypes';
import { X, PlusCircle, Trash2, Loader2, Upload, Edit, XCircle } from 'lucide-react';
import RestockModal from './RestockModal'; // 1. IMPORT MODALS
import ConfirmModal from './ConfirmModal';
import { toast } from 'react-hot-toast';

const LOW_STOCK_THRESHOLD = 5;

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onVariantUpdate: () => void;
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
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [attribute1, setAttribute1] = useState('');
  const [attribute2, setAttribute2] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- 2. NEW STATE for Modals ---
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  // --- END NEW STATE ---

  const resetFormState = () => {
    setName(''); setPrice(''); setStock(''); setAttribute1(''); setAttribute2('');
    setImageFile(null); setEditingVariant(null); setCurrentImageUrl(null);
    if (fileInputRef.current) { fileInputRef.current.value = ''; }
  };

  useEffect(() => {
    if (isOpen && product) { fetchVariants(product.id); }
    else { setVariants([]); resetFormState(); }
  }, [isOpen, product]);

  async function fetchVariants(productId: number) {
    setLoading(true);
    const { data, error } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('name', { ascending: true });
    if (error) { console.error('Error fetching variants:', error.message); toast.error(error.message); }
    else if (data) { setVariants(data); }
    setLoading(false);
  }
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) { setImageFile(e.target.files[0]); }
    else { setImageFile(null); }
  };

  const startEditing = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setName(variant.name || '');
    setPrice(variant.price.toString());
    setStock(variant.stock_quantity.toString());
    setAttribute1(variant.attribute_1 || '');
    setAttribute2(variant.attribute_2 || '');
    setCurrentImageUrl(variant.image_url);
    if (fileInputRef.current) { fileInputRef.current.value = ''; }
    const formElement = document.getElementById('variant-form');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!product) { toast.error("Error: No product selected."); return; }
    setIsProcessing(true);
    let imageUrlToSave: string | null = currentImageUrl;
    
    const submitPromise = new Promise(async (resolve, reject) => {
      try {
          if (imageFile) {
              const baseId = editingVariant?.id || product.id;
              const fileExt = imageFile.name.split('.').pop();
              const fileName = `variant-${baseId}-${Date.now()}.${fileExt}`;
              const filePath = `product_variants/${fileName}`;
              const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(filePath, imageFile, { upsert: true });
              if (uploadError) throw uploadError;
              imageUrlToSave = `${supabase.storage.from('product-images').getPublicUrl(uploadData.path).data.publicUrl}`;
          }
          
          const variantData = {
            name: name || `${attribute1 || ''} ${attribute2 || ''}`.trim(),
            attribute_1: attribute1 || null,
            attribute_2: attribute2 || null,
            price: parseFloat(price),
            stock_quantity: parseInt(stock, 10),
            image_url: imageUrlToSave,
          };

          if (editingVariant) {
              const { error } = await supabase.from('product_variants').update(variantData).eq('id', editingVariant.id);
              if (error) throw error;
              resolve('Variant updated successfully!');
          } else {
              const { error } = await supabase.from('product_variants').insert({ ...variantData, product_id: product.id, });
              if (error) throw error;
              resolve('New variant created!');
          }
          
          resetFormState(); 
          fetchVariants(product.id);
          onVariantUpdate(); 
      } catch (error: any) {
        reject(new Error(error.message));
      }
    });

    toast.promise(submitPromise, {
      loading: 'Saving variant...',
      success: (message) => {
        setIsProcessing(false);
        return message as string;
      },
      error: (err) => {
        setIsProcessing(false);
        return `Error: ${err.message}`;
      }
    });
  };

  // --- 3. UPDATED Delete/Restock Logic ---
  const openDeleteModal = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setShowDeleteModal(true);
  };

  const handleDeleteVariant = async () => {
    if (!product || !selectedVariant) return;
    setIsProcessing(true);
    const deletePromise = supabase.from('product_variants').delete().eq('id', selectedVariant.id);
    
    toast.promise(deletePromise, {
        loading: 'Deleting variant...',
        success: () => {
            fetchVariants(product.id);
            onVariantUpdate();
            setIsProcessing(false);
            setShowDeleteModal(false);
            return 'Variant deleted.';
        },
        error: (err) => {
            setIsProcessing(false);
            setShowDeleteModal(false);
            return `Error: ${err.message}`;
        }
    });
  };

  const handleOpenRestockModal = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setShowRestockModal(true);
  };
  
  const handleConfirmRestock = async (amountToAdd: number) => {
    if (!selectedVariant || !product) return toast.error("No variant selected.");
    
    setIsProcessing(true);
    const restockPromise = supabase.rpc('update_stock', {
      variant_id_to_update: selectedVariant.id,
      quantity_change: amountToAdd 
    });

    toast.promise(restockPromise, {
        loading: 'Adding stock...',
        success: () => {
            fetchVariants(product.id);
            onVariantUpdate();
            setShowRestockModal(false);
            setIsProcessing(false);
            return `${amountToAdd} units added.`;
        },
        error: (err) => {
            setIsProcessing(false);
            setShowRestockModal(false);
            return `Error: ${err.message}`;
        }
    });
  };
  // --- END UPDATED LOGIC ---

  if (!isOpen || !product) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="relative w-full max-w-4xl rounded-lg bg-white dark:bg-slate-800 p-4 md:p-6 shadow-xl">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300" title="Close"><X size={20} /></button>
          <h2 className="card-header">Variants for: {product.name}</h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Manage options, prices, and stock for this product.</p>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div id="variant-form" className="lg:col-span-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-4">
              <h3 className="card-header mb-3 flex justify-between items-center">
                  {editingVariant ? 'Edit Variant' : 'Add New Variant'}
                  {editingVariant && (<button type="button" onClick={resetFormState} className="text-sm text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-500 flex items-center" disabled={isProcessing}><XCircle className="h-4 w-4 mr-1" /> Cancel</button>)}
              </h3>
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div><label htmlFor="name" className="label-style">Variant Name</label><input id="name" type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} disabled={isProcessing} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label htmlFor="attr1" className="label-style">Attribute 1</label><input id="attr1" type="text" className="input-field" value={attribute1} onChange={(e) => setAttribute1(e.target.value)} disabled={isProcessing} /></div>
                  <div><label htmlFor="attr2" className="label-style">Attribute 2</label><input id="attr2" type="text" className="input-field" value={attribute2} onChange={(e) => setAttribute2(e.target.value)} disabled={isProcessing} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label htmlFor="price" className="label-style">Price (RWF)</label><input id="price" type="number" step="0.01" required className="input-field" value={price} onChange={(e) => setPrice(e.target.value)} disabled={isProcessing} /></div>
                  <div><label htmlFor="stock" className="label-style">Stock</label><input id="stock" type="number" required className="input-field" value={stock} onChange={(e) => setStock(e.target.value)} disabled={isProcessing} /></div>
                </div>
                <div>
                    <label htmlFor="image-upload" className="label-style flex items-center"><Upload className="mr-2 h-4 w-4" /> Variant Image (Opt)</label>
                    {currentImageUrl && !imageFile && ( <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2"> <img src={currentImageUrl} alt="Current" className="h-8 w-8 rounded object-cover" /> <span>Image set.</span> </div> )}
                    <input id="image-upload" type="file" accept="image/*" ref={fileInputRef} className="input-field file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-700 dark:file:text-slate-300 dark:hover:file:bg-slate-600" onChange={handleFileChange} disabled={isProcessing} />
                    {imageFile && <p className="mt-1 text-xs text-slate-500 truncate font-semibold">Ready to upload: {imageFile.name}</p>}
                  </div>
                <button type="submit" disabled={isProcessing || !price || !stock} className="w-full rounded-md bg-green-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50">
                  {isProcessing ? 'Saving...' : editingVariant ? 'Save Changes' : 'Create Variant'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2">
              <h3 className="card-header mb-3">Current Variants ({variants.length})</h3>
              {loading ? (<div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>) : 
              variants.length === 0 ? (<p className="text-slate-500 dark:text-slate-400">No variants defined.</p>) : (
                  <>
                    <div className="hidden md:block flow-root overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                          <thead className="bg-slate-50 dark:bg-slate-700">
                              <tr><th className="th-style">Image</th><th className="th-style">Variant Name</th><th className="th-style">Price</th><th className="th-style">Stock</th><th className="th-style text-right">Actions</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                              {variants.map((variant) => (
                                  <tr key={variant.id}>
                                      <td className="td-style">{variant.image_url ? ( <img src={variant.image_url} alt={variant.name || 'Variant'} className="h-10 w-10 rounded object-cover" /> ) : ( <div className="h-10 w-10 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-600 dark:text-slate-400">No Img</div> )}</td>
                                      <td className="td-style font-medium text-slate-900 dark:text-white">{variant.name || `${variant.attribute_1 || ''} ${variant.attribute_2 || ''}`.trim()}</td>
                                      <td className="td-style text-slate-600 dark:text-slate-300">{variant.price.toLocaleString()} RWF</td>
                                      <td className={`td-style font-semibold ${variant.stock_quantity <= LOW_STOCK_THRESHOLD ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>{variant.stock_quantity}</td>
                                      <td className="td-style text-right whitespace-nowrap">
                                          <button onClick={() => handleOpenRestockModal(variant)} disabled={isProcessing} className="action-button bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900"><PlusCircle className="h-4 w-4" /></button>
                                          <button onClick={() => startEditing(variant)} disabled={isProcessing} className="action-button bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900 ml-2"><Edit className="h-4 w-4" /></button>
                                          <button onClick={() => openDeleteModal(variant)} disabled={isProcessing} className="action-button bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 ml-2"><Trash2 className="h-4 w-4" /></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                    </div>
                    <div className="space-y-4 md:hidden">
                      {variants.map((variant) => (
                          <div key={variant.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
                              <div className="flex items-start space-x-4">
                                  {variant.image_url ? ( <img src={variant.image_url} alt={variant.name || 'Variant'} className="h-16 w-16 rounded object-cover" /> ) : ( <div className="h-16 w-16 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-600 dark:text-slate-400">No Img</div> )}
                                  <div className="flex-1">
                                      <p className="font-bold text-slate-900 dark:text-white">{variant.name || `${variant.attribute_1 || ''} ${variant.attribute_2 || ''}`.trim()}</p>
                                      <p className="text-sm text-slate-700 dark:text-slate-300">{variant.price.toLocaleString()} RWF</p>
                                      <p className={`text-sm font-semibold ${variant.stock_quantity <= LOW_STOCK_THRESHOLD ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>Stock: {variant.stock_quantity}</p>
                                  </div>
                              </div>
                              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                                  <button onClick={() => handleOpenRestockModal(variant)} disabled={isProcessing} className="action-button justify-center bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900"><PlusCircle className="mr-1.5 h-4 w-4" /> Restock</button>
                                  <button onClick={() => startEditing(variant)} disabled={isProcessing} className="action-button justify-center bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900"><Edit className="mr-1.5 h-4 w-4" /> Edit</button>
                                  <button onClick={() => openDeleteModal(variant)} disabled={isProcessing} className="action-button justify-center bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"><Trash2 className="mr-1.5 h-4 w-4" /> Delete</button>
                              </div>
                          </div>
                      ))}
                    </div>
                  </>
              )}
            </div>
          </div>
          <div className="mt-6 text-right"><button onClick={onClose} className="rounded-md bg-slate-200 dark:bg-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-300 dark:hover:bg-slate-500">Done</button></div>
        </div>
      </div>
      
      <RestockModal
        isOpen={showRestockModal}
        onClose={() => setShowRestockModal(false)}
        onConfirm={handleConfirmRestock}
        variant={selectedVariant}
        isProcessing={isProcessing}
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteVariant}
        title="Delete Variant?"
        isProcessing={isProcessing}
      >
        <p className="dark:text-slate-300">Are you sure you want to delete <span className="font-bold">{selectedVariant?.name}</span>? This is permanent.</p>
      </ConfirmModal>
    </>
  );
}