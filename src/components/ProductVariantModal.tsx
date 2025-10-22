import { useState, useEffect, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { Product, ProductVariant } from '../appTypes';
import { X, Trash2, Loader2, Upload, Edit, XCircle } from 'lucide-react';

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

  const resetFormState = () => { setName(''); setPrice(''); setStock(''); setAttribute1(''); setAttribute2(''); setImageFile(null); setEditingVariant(null); setCurrentImageUrl(null); if (fileInputRef.current) { fileInputRef.current.value = ''; } };
  useEffect(() => { if (isOpen && product) { fetchVariants(product.id); } else { setVariants([]); resetFormState(); } }, [isOpen, product]);
  async function fetchVariants(productId: number) { setLoading(true); const { data, error } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('name', { ascending: true }); if (error) { console.error('Error fetching variants:', error.message); alert(error.message); } else if (data) { setVariants(data); } setLoading(false); }
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) { setImageFile(e.target.files[0]); } else { setImageFile(null); } };
  const startEditing = (variant: ProductVariant) => { setEditingVariant(variant); setName(variant.name || ''); setPrice(variant.price.toString()); setStock(variant.stock_quantity.toString()); setAttribute1(variant.attribute_1 || ''); setAttribute2(variant.attribute_2 || ''); setCurrentImageUrl(variant.image_url); if (fileInputRef.current) { fileInputRef.current.value = ''; } const formElement = document.getElementById('variant-form'); if (formElement) formElement.scrollIntoView({ behavior: 'smooth' }); };

  const handleFormSubmit = async (e: FormEvent) => { e.preventDefault(); if (!product) return; setIsProcessing(true); let imageUrlToSave: string | null = currentImageUrl; try { if (imageFile) { const baseId = editingVariant?.id || product.id; const fileExt = imageFile.name.split('.').pop(); const fileName = `variant-${baseId}-${Date.now()}.${fileExt}`; const filePath = `product_variants/${fileName}`; const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(filePath, imageFile, { upsert: true }); if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`); imageUrlToSave = `${supabase.storage.from('product-images').getPublicUrl(uploadData.path).data.publicUrl}`; } const variantData = { name: name || `${attribute1 || ''} ${attribute2 || ''}`.trim(), attribute_1: attribute1 || null, attribute_2: attribute2 || null, price: parseFloat(price), stock_quantity: parseInt(stock, 10), image_url: imageUrlToSave, }; if (editingVariant) { const { error } = await supabase.from('product_variants').update(variantData).eq('id', editingVariant.id); if (error) throw new Error(error.message); alert('Variant updated!'); } else { const { error } = await supabase.from('product_variants').insert({ ...variantData, product_id: product.id, }); if (error) throw new Error(error.message); alert('Variant created!'); } resetFormState(); fetchVariants(product.id); onVariantUpdate(); } catch (error: any) { alert(`Error: ${error.message}`); } finally { setIsProcessing(false); } };
  const handleDeleteVariant = async (variantId: number) => { if (!product || !confirm('Are you sure?')) return; setIsProcessing(true); try { const { error } = await supabase.from('product_variants').delete().eq('id', variantId); if (error) throw new Error(error.message); fetchVariants(product.id); onVariantUpdate(); } catch (error: any) { alert(`Error: ${error.message}`); } finally { setIsProcessing(false); } };

  if (!isOpen || !product) return null;

  return ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"><div className="relative w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl"><button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" title="Close"><X size={20} /></button><h2 className="mb-4 text-2xl font-bold text-gray-800">Variants for: {product.name}</h2><p className="mb-6 text-sm text-gray-500">Each variant has its own price and stock.</p><div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><div id="variant-form" className="lg:col-span-1 rounded-lg border border-dashed border-gray-300 p-4"><h3 className="mb-3 text-lg font-semibold flex justify-between items-center">{editingVariant ? 'Edit Variant' : 'Add New Variant'}{editingVariant && (<button type="button" onClick={resetFormState} className="text-sm text-gray-500 hover:text-red-500 flex items-center" disabled={isProcessing}><XCircle className="h-4 w-4 mr-1" /> Cancel</button>)}</h3><form onSubmit={handleFormSubmit} className="space-y-3"><div><label htmlFor="name" className="label-style">Variant Name</label><input id="name" type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} disabled={isProcessing} /></div><div className="grid grid-cols-2 gap-2"><div><label htmlFor="attr1" className="label-style">Attr 1 (Size)</label><input id="attr1" type="text" className="input-field" value={attribute1} onChange={(e) => setAttribute1(e.target.value)} disabled={isProcessing} /></div><div><label htmlFor="attr2" className="label-style">Attr 2 (Color)</label><input id="attr2" type="text" className="input-field" value={attribute2} onChange={(e) => setAttribute2(e.target.value)} disabled={isProcessing} /></div></div><div className="grid grid-cols-2 gap-2"><div><label htmlFor="price" className="label-style">Price (RWF)</label><input id="price" type="number" step="0.01" required className="input-field" value={price} onChange={(e) => setPrice(e.target.value)} disabled={isProcessing} /></div><div><label htmlFor="stock" className="label-style">Stock</label><input id="stock" type="number" required className="input-field" value={stock} onChange={(e) => setStock(e.target.value)} disabled={isProcessing} /></div></div><div><label htmlFor="image-upload" className="label-style flex items-center"><Upload className="mr-2 h-4 w-4" /> Variant Image</label>{currentImageUrl && !imageFile && (<div className="mt-2 text-xs text-gray-500 flex items-center space-x-2"><img src={currentImageUrl} alt="Current" className="h-8 w-8 rounded object-cover" /><span>Choose new file to replace.</span></div>)}<input id="image-upload" type="file" accept="image/*" ref={fileInputRef} className="input-field file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" onChange={handleFileChange} disabled={isProcessing}/>
              {/* --- FIX: Changed typeL to type --- */}
              <button type="submit" disabled={isProcessing || !price || !stock} className="w-full rounded-md bg-green-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 mt-4">{isProcessing ? 'Saving...' : editingVariant ? 'Save Changes' : 'Create Variant'}</button>
              {/* --- END FIX --- */}
            </div></form></div><div className="lg:col-span-2 overflow-x-auto"><h3 className="mb-3 text-lg font-semibold">Current Variants ({variants.length})</h3>{loading ? (<div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-500" /></div>) : variants.length === 0 ? (<p className="text-gray-500">No variants defined.</p>) : (<table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="th-style">Image</th><th className="th-style">Variant Name</th><th className="th-style">Price</th><th className="th-style">Stock</th><th className="th-style text-right">Actions</th></tr></thead><tbody className="divide-y divide-gray-200 bg-white">{variants.map((variant) => (<tr key={variant.id}><td className="td-style">{variant.image_url ? (<img src={variant.image_url} alt={variant.name || 'Variant'} className="h-10 w-10 rounded object-cover" />) : (<div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-600">No Img</div>)}</td><td className="td-style font-medium">{variant.name || `${variant.attribute_1 || ''} ${variant.attribute_2 || ''}`.trim()}</td><td className="td-style">{variant.price.toLocaleString()} RWF</td><td className={`td-style font-semibold ${variant.stock_quantity <= LOW_STOCK_THRESHOLD ? 'text-red-600' : 'text-gray-900'}`}>{variant.stock_quantity}</td><td className="td-style text-right whitespace-nowrap"><button onClick={() => startEditing(variant)} disabled={isProcessing} className="action-button bg-yellow-100 text-yellow-700 hover:bg-yellow-200"><Edit className="h-3 w-3" /> Edit</button><button onClick={() => handleDeleteVariant(variant.id)} disabled={isProcessing} className="action-button bg-red-100 text-red-700 hover:bg-red-200 ml-2"><Trash2 className="h-3 w-3" /> Delete</button></td></tr>))}</tbody></table>)}</div></div><div className="mt-6 text-right"><button onClick={onClose} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-300">Done</button></div></div></div> );
}

