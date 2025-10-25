import { useState, useEffect, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { Product, ProductVariant } from '../appTypes';
import { X, PlusCircle, Trash2, Loader2, Upload, Edit, XCircle } from 'lucide-react';
import RestockModal from './RestockModal';
import ConfirmModal from './ConfirmModal';
import { toast } from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

const LOW_STOCK_THRESHOLD = 5;
const MAX_IMAGE_SIZE_MB = 0.15;
const MAX_IMAGE_WIDTH = 500;

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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const resetFormState = () => {
    setName(''); setPrice(''); setStock('');
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
  
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      const options = {
        maxSizeMB: MAX_IMAGE_SIZE_MB,
        maxWidthOrHeight: MAX_IMAGE_WIDTH,
        useWebWorker: true,
      };

      const compressionPromise = imageCompression(file, options);
      
      toast.promise(compressionPromise, {
        loading: 'Compressing image...',
        success: (compressedFile) => {
          setImageFile(compressedFile);
          setCurrentImageUrl(URL.createObjectURL(compressedFile));
          return 'Image compressed successfully!';
        },
        error: (err) => {
          console.error("Compression Error:", err);
          return `Image compression failed: ${err.message}`;
        }
      });
    } else {
      setImageFile(null);
    }
  };

  const startEditing = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setName(variant.name || '');
    setPrice(variant.price.toString());
    setStock(variant.stock_quantity.toString());
    setCurrentImageUrl(variant.image_url);
    if (fileInputRef.current) { fileInputRef.current.value = ''; }
    const formElement = document.getElementById('variant-form');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!product) { toast.error("Error: No product selected."); return; }
    setIsProcessing(true);
    
    const submitPromise = new Promise(async (resolve, reject) => {
      let imageUrlToSave: string | null = currentImageUrl;
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
            name: name,
            price: parseFloat(price),
            stock_quantity: parseInt(stock, 10),
            image_url: imageUrlToSave,
          };

          if (editingVariant) {
              const { error } = await supabase.from('product_variants').update(variantData).eq('id', editingVariant.id);
              if (error) throw error;
              resolve('Option updated successfully!');
          } else {
              const { error } = await supabase.from('product_variants').insert({ ...variantData, product_id: product.id, });
              if (error) throw error;
              resolve('New option created!');
          }
          
          resetFormState(); 
          fetchVariants(product.id);
          onVariantUpdate(); 
      } catch (error: any) {
        reject(new Error(error.message));
      }
    });

    toast.promise(submitPromise, {
      loading: 'Saving option...',
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

  const openDeleteModal = (variant: ProductVariant) => { setSelectedVariant(variant); setShowDeleteModal(true); };
  
  const handleDeleteVariant = async () => { 
    if (!product || !selectedVariant) return; 
    setIsProcessing(true); 
    
    // --- FIX: This is now a real Promise ---
    const deletePromise = (async () => {
      const { error } = await supabase.from('product_variants').delete().eq('id', selectedVariant.id);
      if (error) throw error;
    })();
    // --- END FIX ---

    toast.promise(deletePromise, { 
      loading: 'Deleting...', 
      success: () => { 
        fetchVariants(product.id); 
        onVariantUpdate(); 
        setIsProcessing(false); 
        setShowDeleteModal(false); 
        return 'Option deleted.'; 
      }, 
      error: (err) => { 
        setIsProcessing(false); 
        setShowDeleteModal(false); 
        return `Error: ${err.message}`; 
      } 
    }); 
  };
  
  const handleOpenRestockModal = (variant: ProductVariant) => { setSelectedVariant(variant); setShowRestockModal(true); };
  
  const handleConfirmRestock = async (amountToAdd: number) => { 
    if (!selectedVariant || !product) return toast.error("No variant selected."); 
    setIsProcessing(true); 
    
    // --- FIX: This is now a real Promise ---
    const restockPromise = (async () => {
      const { error } = await supabase.rpc('update_stock', { variant_id_to_update: selectedVariant.id, quantity_change: amountToAdd });
      if (error) throw error;
    })();
    // --- END FIX ---
    
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

  if (!isOpen || !product) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="relative w-full max-w-4xl rounded-lg bg-white dark:bg-slate-800 p-4 md:p-6 shadow-xl">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300" title="Close"><X size={20} /></button>
          <h2 className="card-header">Manage Options for: {product.name}</h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Add options like "500ml", "1kg", or "Red, Large". Each has its own price and stock.</p>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div id="variant-form" className="lg:col-span-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-4">
              <h3 className="card-header mb-3 flex justify-between items-center">
                  {editingVariant ? 'Edit Option' : 'Add New Option'}
                  {editingVariant && (<button type="button" onClick={resetFormState} className="text-sm text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-500 flex items-center" disabled={isProcessing}><XCircle className="h-4 w-4 mr-1" /> Cancel</button>)}
              </h3>
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div><label htmlFor="name" className="label-style">Option Name (e.g., "500ml", "1kg")</label><input id="name" type="text" required className="input-field" value={name} onChange={(e) => setName(e.target.value)} disabled={isProcessing} /></div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div><label htmlFor="price" className="label-style">Price (RWF)</label><input id="price" type="number" step="0.01" required className="input-field" value={price} onChange={(e) => setPrice(e.target.value)} disabled={isProcessing} /></div>
                  <div><label htmlFor="stock" className="label-style">Stock</label><input id="stock" type="number" required className="input-field" value={stock} onChange={(e) => setStock(e.target.value)} disabled={isProcessing} /></div>
                </div>
                <div>
                    <label htmlFor="image-upload" className="label-style flex items-center"><Upload className="mr-2 h-4 w-4" /> Option Image (Opt)</label>
                    {currentImageUrl && !imageFile && ( <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2"> <img src={currentImageUrl} alt="Current" className="h-8 w-8 rounded object-cover" /> <span>Image set.</span> </div> )}
                    {currentImageUrl && imageFile && ( <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2"> <img src={currentImageUrl} alt="New Preview" className="h-8 w-8 rounded object-cover" /> <span>New image selected.</span> </div> )}
                    <input id="image-upload" type="file" accept="image/*" ref={fileInputRef} className="input-field file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-700 dark:file:text-slate-300 dark:hover:file:bg-slate-600" onChange={handleFileChange} disabled={isProcessing} />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Image will be compressed to ~150KB.</p>
                  </div>
                <button type="submit" disabled={isProcessing || !price || !stock || !name} className="w-full rounded-md bg-green-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50">
                  {isProcessing ? 'Saving...' : editingVariant ? 'Save Changes' : 'Create Option'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2">
              <h3 className="card-header mb-3">Current Options ({variants.length})</h3>
              {loading ? (<div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>) : 
              variants.length === 0 ? (<p className="text-slate-500 dark:text-slate-400">No options defined.</p>) : (
                  <>
                    <div className="hidden md:block flow-root overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                          <thead className="bg-slate-50 dark:bg-slate-700">
                              <tr><th className="th-style">Image</th><th className="th-style">Option Name</th><th className="th-style">Price</th><th className="th-style">Stock</th><th className="th-style text-right">Actions</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                              {variants.map((variant) => (
                                  <tr key={variant.id}>
                                      <td className="td-style">{variant.image_url ? ( <img src={variant.image_url} alt={variant.name || 'Variant'} className="h-10 w-10 rounded object-cover" /> ) : ( <div className="h-10 w-10 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-600 dark:text-slate-400">No Img</div> )}</td>
                                      <td className="td-style font-medium text-slate-900 dark:text-white">{variant.name}</td>
                                      <td className="td-style text-slate-600 dark:text-slate-300">{variant.price.toLocaleString()} RWF</td>
                                      <td className={`td-style font-semibold ${variant.stock_quantity <= LOW_STOCK_THRESHOLD ? 'text-red-600 dark:text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{variant.stock_quantity}</td>
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
                                      <p className="font-bold text-slate-900 dark:text-white">{variant.name}</p>
                                      <p className="text-sm text-slate-700 dark:text-slate-300">{variant.price.toLocaleString()} RWF</p>
                                      <p className={`text-sm font-semibold ${variant.stock_quantity <= LOW_STOCK_THRESHOLD ? 'text-red-600 dark:text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>Stock: {variant.stock_quantity}</p>
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
        title="Delete Option?"
        isProcessing={isProcessing}
      >
        <p className="dark:text-slate-300">Are you sure you want to delete <span className="font-bold">{selectedVariant?.name}</span>? This is permanent.</p>
      </ConfirmModal>
    </>
  );
}