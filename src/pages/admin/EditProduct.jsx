import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { supabase } from '../../utils/supabase';
import { getInventoryState, getTotalStockFromVariants, toSafeStock } from '../../utils/inventory';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedBlob = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to process image crop.');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error('Failed to create cropped image.'));
      },
      'image/jpeg',
      0.92
    );
  });
};

const CATEGORY_CACHE_TTL_MS = 5 * 60 * 1000;
let categoryCache = {
  data: null,
  expiresAt: 0
};

const HIGHLIGHT_TAGS = [
  {
    value: 'best_seller',
    label: 'Best Seller',
    help: 'Show this product in the Best Sellers page.'
  },
  {
    value: 'new_arrival',
    label: 'New Arrival',
    help: 'Show this product in the New Arrivals page.'
  }
];

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [inventoryStock, setInventoryStock] = useState('0');

  const [imageMode, setImageMode] = useState('url');
  const [imageState, setImageState] = useState({ uploading: false, error: '', success: '' });
  const [cropSource, setCropSource] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAspect, setCropAspect] = useState(1);
  const [cropPixels, setCropPixels] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState('');

  const [product, setProduct] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    discount_price: '',
    is_available: true,
    image_url: '',
    category_id: '',
    tags: []
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    return () => {
      if (croppedPreviewUrl) {
        URL.revokeObjectURL(croppedPreviewUrl);
      }
    };
  }, [croppedPreviewUrl]);

  const fetchCategories = async () => {
    if (categoryCache.data && categoryCache.expiresAt > Date.now()) {
      setCategories(categoryCache.data);
      return;
    }

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name', { ascending: true });

    if (error) {
      setCategories([]);
      return;
    }

    const normalized = data || [];
    setCategories(normalized);
    categoryCache = {
      data: normalized,
      expiresAt: Date.now() + CATEGORY_CACHE_TTL_MS
    };
  };

  const fetchProduct = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, description, price, discount_price, is_available, image_url, category_id, tags')
      .eq('id', id)
      .single();

    const { data: variantData } = await supabase
      .from('product_variants')
      .select('stock')
      .eq('product_id', id);

    if (data) {
      setProduct({
        ...data,
        discount_price: data.discount_price ?? '',
        tags: Array.isArray(data.tags) ? data.tags : []
      });
      setImageMode('url');
    }

    setInventoryStock(String(getTotalStockFromVariants(variantData || [])));
    setLoading(false);
  };

  const toggleProductTag = (tagValue) => {
    setProduct((previous) => {
      const currentTags = Array.isArray(previous.tags) ? previous.tags : [];
      const hasTag = currentTags.includes(tagValue);

      return {
        ...previous,
        tags: hasTag
          ? currentTags.filter((tag) => tag !== tagValue)
          : [...currentTags, tagValue]
      };
    });
  };

  const hasTag = (tagValue) => {
    return Array.isArray(product.tags) && product.tags.includes(tagValue);
  };

  const onFileSelected = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageState({ uploading: false, error: 'Please select a valid image file.', success: '' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setCropSource(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setShowCropper(true);
      setCroppedBlob(null);
      if (croppedPreviewUrl) {
        URL.revokeObjectURL(croppedPreviewUrl);
      }
      setCroppedPreviewUrl('');
      setImageState({ uploading: false, error: '', success: '' });
    };
    reader.readAsDataURL(file);
  };

  const applyCrop = async () => {
    if (!cropSource || !cropPixels) {
      setImageState({ uploading: false, error: 'Please select a crop area first.', success: '' });
      return;
    }

    try {
      const blob = await getCroppedBlob(cropSource, cropPixels);
      const previewUrl = URL.createObjectURL(blob);

      if (croppedPreviewUrl) {
        URL.revokeObjectURL(croppedPreviewUrl);
      }

      setCroppedBlob(blob);
      setCroppedPreviewUrl(previewUrl);
      setShowCropper(false);
      setImageState({ uploading: false, error: '', success: 'Crop applied. Upload to cloud when ready.' });
    } catch (error) {
      setImageState({ uploading: false, error: error.message || 'Failed to crop image.', success: '' });
    }
  };

  const uploadCroppedImage = async () => {
    if (!croppedBlob) {
      setImageState({ uploading: false, error: 'Please crop an image before uploading.', success: '' });
      return;
    }

    setImageState({ uploading: true, error: '', success: '' });

    const filePath = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, croppedBlob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      setImageState({ uploading: false, error: uploadError.message || 'Upload failed.', success: '' });
      return;
    }

    const { data } = supabase.storage.from('products').getPublicUrl(filePath);
    const imageUrl = data?.publicUrl || '';

    if (croppedPreviewUrl) {
      URL.revokeObjectURL(croppedPreviewUrl);
    }

    setProduct((previous) => ({ ...previous, image_url: imageUrl }));
    setCropSource('');
    setCroppedBlob(null);
    setCroppedPreviewUrl('');
    setShowCropper(false);
    setImageState({ uploading: false, error: '', success: 'Image uploaded to Cloud successfully.' });
    setFormSuccess('Image uploaded. Save product to persist this link in the database.');
  };

  const syncProductInventory = async ({ productId, productSlug, targetStock }) => {
    const safeTargetStock = toSafeStock(targetStock);

    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, stock')
      .eq('product_id', productId);

    if (variantsError) {
      throw new Error(variantsError.message || 'Unable to load current inventory.');
    }

    const variantRows = Array.isArray(variants) ? variants : [];

    if (variantRows.length === 0) {
      const generatedSku = `INV-${(productSlug || 'ITEM').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)}-${productId.slice(0, 8)}`;

      const { error: insertError } = await supabase.from('product_variants').insert([
        {
          product_id: productId,
          color: 'Default',
          stock: safeTargetStock,
          sku: generatedSku
        }
      ]);

      if (insertError) {
        throw new Error(insertError.message || 'Unable to save inventory.');
      }

      return;
    }

    const currentTotal = getTotalStockFromVariants(variantRows);
    const delta = safeTargetStock - currentTotal;

    if (delta === 0) {
      return;
    }

    const updates = [];

    if (delta > 0) {
      const first = variantRows[0];
      updates.push({
        id: first.id,
        stock: toSafeStock(first.stock) + delta
      });
    } else {
      let remainingReduction = Math.abs(delta);

      for (const variant of variantRows) {
        if (remainingReduction <= 0) {
          break;
        }

        const currentStock = toSafeStock(variant.stock);

        if (!currentStock) {
          continue;
        }

        const reduction = Math.min(currentStock, remainingReduction);
        updates.push({
          id: variant.id,
          stock: currentStock - reduction
        });
        remainingReduction -= reduction;
      }
    }

    for (const updateItem of updates) {
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ stock: updateItem.stock })
        .eq('id', updateItem.id);

      if (updateError) {
        throw new Error(updateError.message || 'Unable to save inventory.');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    setFormSuccess('');

    const safeProduct = { ...product };

    const missingFields = [];

    if (!safeProduct.name?.trim()) {
      missingFields.push('Product name');
    }

    if (!safeProduct.description?.trim()) {
      missingFields.push('Description');
    }

    if (!Number.isFinite(Number(safeProduct.price)) || Number(safeProduct.price) <= 0) {
      missingFields.push('Base price (must be greater than 0)');
    }

    if (!safeProduct.category_id) {
      missingFields.push('Category');
    }

    if (!safeProduct.image_url?.trim()) {
      missingFields.push('Cover image (URL or uploaded image)');
    }

    if (!Number.isFinite(Number(inventoryStock)) || Number(inventoryStock) < 0) {
      missingFields.push('Inventory quantity (must be 0 or more)');
    }

    if (missingFields.length) {
      setFormError(`Please complete required fields: ${missingFields.join(', ')}.`);
      setSaving(false);
      return;
    }

    if (!safeProduct.slug) {
      safeProduct.slug = safeProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    safeProduct.name = safeProduct.name.trim();
    safeProduct.description = safeProduct.description.trim();
    safeProduct.image_url = safeProduct.image_url.trim();
    safeProduct.price = Number(safeProduct.price);

    const rawOriginalPrice = typeof safeProduct.discount_price === 'string'
      ? safeProduct.discount_price.trim()
      : safeProduct.discount_price;

    if (rawOriginalPrice === '' || rawOriginalPrice === null || typeof rawOriginalPrice === 'undefined') {
      safeProduct.discount_price = null;
    } else {
      const parsedOriginalPrice = Number(rawOriginalPrice);

      if (!Number.isFinite(parsedOriginalPrice) || parsedOriginalPrice <= safeProduct.price) {
        setFormError('For sale items, Original Price must be greater than Selling Price.');
        setSaving(false);
        return;
      }

      safeProduct.discount_price = parsedOriginalPrice;
    }

    const safeInventoryStock = toSafeStock(inventoryStock);
    safeProduct.tags = Array.isArray(safeProduct.tags)
      ? Array.from(
          new Set(
            safeProduct.tags
              .filter((tag) => typeof tag === 'string')
              .map((tag) => tag.trim())
              .filter(Boolean)
          )
        )
      : [];

    let response;

    if (id === 'new') {
      response = await supabase
        .from('products')
        .insert([safeProduct])
        .select('id, slug')
        .single();
    } else {
      response = await supabase
        .from('products')
        .update(safeProduct)
        .eq('id', id)
        .select('id, slug')
        .single();
    }

    if (response.error) {
      setFormError(response.error.message || 'Unable to save product.');
      setSaving(false);
      return;
    }

    const savedProductId = response.data?.id || id;
    const savedSlug = response.data?.slug || safeProduct.slug;

    try {
      await syncProductInventory({
        productId: savedProductId,
        productSlug: savedSlug,
        targetStock: safeInventoryStock
      });
    } catch (inventoryError) {
      setFormError(inventoryError.message || 'Product saved but inventory update failed.');
      setSaving(false);
      return;
    }

    setSaving(false);
    navigate('/admin/products');
  };

  const previewImage = croppedPreviewUrl || product.image_url;
  const inventoryState = getInventoryState(inventoryStock);
  const sellingPriceValue = Number(product.price || 0);
  const originalPriceValue = Number(product.discount_price || 0);
  const saleItemEnabled = `${product.discount_price ?? ''}`.trim() !== '';
  const hasValidSalePricing = saleItemEnabled
    && Number.isFinite(sellingPriceValue)
    && Number.isFinite(originalPriceValue)
    && sellingPriceValue > 0
    && originalPriceValue > sellingPriceValue;
  const saleDiscountPercent = hasValidSalePricing
    ? Math.max(1, Math.round(((originalPriceValue - sellingPriceValue) / originalPriceValue) * 100))
    : 0;

  return (
    <>
      {showCropper && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-2xl border border-outline-variant/20">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="plusJakartaSans text-2xl font-extrabold text-on-surface">Crop Image</h3>
                <p className="text-sm text-on-surface-variant mt-1">Adjust frame and zoom before uploading to Supabase Storage.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCropper(false)}
                className="p-2 rounded-lg hover:bg-surface-container-low text-outline transition-colors"
                aria-label="Close cropper"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="relative w-full h-[360px] md:h-[420px] rounded-xl overflow-hidden bg-black">
              <Cropper
                image={cropSource}
                crop={crop}
                zoom={zoom}
                aspect={cropAspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCropPixels(pixels)}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2">Zoom</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="w-full"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2">Aspect Ratio</span>
                <select
                  value={String(cropAspect)}
                  onChange={(event) => setCropAspect(Number(event.target.value))}
                  className="w-full bg-surface-container-low border-0 rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary"
                >
                  <option value="1">Square (1:1)</option>
                  <option value="1.3333333333">Landscape (4:3)</option>
                  <option value="1.7777777778">Wide (16:9)</option>
                </select>
              </label>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCropper(false)}
                className="px-5 py-2.5 rounded-full bg-surface-container-low text-on-surface-variant font-semibold hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCrop}
                className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary-container font-bold hover:scale-105 transition-transform"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-secondary font-semibold tracking-wider text-xs uppercase">Inventory Management</span>
          <h2 className="plusJakartaSans text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight">
            {id === 'new' ? 'Add New Product' : 'Edit Product'}
          </h2>
          <p className="text-on-surface-variant max-w-xl">Curate your collection. Use our AI assistant to perfect your product descriptions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 rounded-full bg-surface-container-low text-on-surface-variant font-semibold transition-all hover:bg-surface-container-high active:scale-95">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || imageState.uploading} className="px-8 py-3 rounded-full bg-primary-container text-on-primary-container font-bold shadow-lg shadow-primary/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:hover:scale-100">
            <span className="material-symbols-outlined text-xl">save</span>
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </header>

      {formError && (
        <div className="mb-6 rounded-xl border border-error/30 bg-error-container/10 px-4 py-3 text-sm font-semibold text-error">
          {formError}
        </div>
      )}

      {!formError && formSuccess && (
        <div className="mb-6 rounded-xl border border-[#128C7E]/30 bg-[#128C7E]/10 px-4 py-3 text-sm font-semibold text-[#128C7E]">
          {formSuccess}
        </div>
      )}

      {loading && id !== 'new' && (
        <div className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface-variant">
          Loading product details...
        </div>
      )}

      <form className="grid grid-cols-1 lg:grid-cols-12 gap-8" onSubmit={handleSave}>
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-on-surface-variant ml-2 mb-2 block">Product Name</span>
                <input required type="text" value={product.name} onChange={e => setProduct({...product, name: e.target.value})} className="w-full bg-surface-container-low border-0 rounded-lg py-4 px-6 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all" placeholder="e.g. Handcrafted Wooden Safari Set" />
              </label>
              <div className="relative group">
                <label className="block">
                  <div className="flex justify-between items-center ml-2 mb-2">
                    <span className="text-sm font-bold text-on-surface-variant">Description</span>
                    <button type="button" className="flex items-center gap-1.5 text-xs font-bold text-secondary-dim bg-secondary-container/50 px-3 py-1.5 rounded-full hover:bg-secondary-container transition-all">
                      <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                      AI Generate
                    </button>
                  </div>
                  <textarea required value={product.description || ''} onChange={e => setProduct({...product, description: e.target.value})} className="w-full bg-surface-container-low border-0 rounded-lg py-4 px-6 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all" placeholder="Tell the story of this toy..." rows="6"></textarea>
                </label>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm space-y-6">
            <h3 className="text-lg font-bold plusJakartaSans">Cover Image</h3>
            <div className="space-y-4">
              <div className="inline-flex bg-surface-container-low rounded-full p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${imageMode === 'url' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${imageMode === 'upload' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  Upload + Crop
                </button>
              </div>

              {imageMode === 'url' ? (
                <label className="block">
                  <span className="text-sm font-bold text-on-surface-variant ml-2 mb-2 block">Image URL</span>
                  <input
                    type="url"
                    value={product.image_url || ''}
                    onChange={(event) => setProduct({ ...product, image_url: event.target.value })}
                    className="w-full bg-surface-container-low border-0 rounded-lg py-4 px-6 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
                    placeholder="https://example.com/image.png"
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="block">
                      <span className="text-sm font-bold text-on-surface-variant ml-2 mb-2 block">Upload Image</span>
                      <label htmlFor="product-image-upload" className="w-full bg-surface-container-low border-0 rounded-lg py-4 px-6 flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors">
                        <span className="text-on-surface-variant text-sm font-medium">Choose from device</span>
                        <span className="material-symbols-outlined text-on-surface-variant">upload</span>
                        <input id="product-image-upload" type="file" accept="image/*" onChange={onFileSelected} className="hidden" />
                      </label>
                    </div>
                    <label className="block">
                      <span className="text-sm font-bold text-on-surface-variant ml-2 mb-2 block">Crop Aspect</span>
                      <select
                        value={String(cropAspect)}
                        onChange={(event) => setCropAspect(Number(event.target.value))}
                        className="w-full bg-surface-container-low border-0 rounded-lg py-4 px-6 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
                      >
                        <option value="1">Square (1:1)</option>
                        <option value="1.3333333333">Landscape (4:3)</option>
                        <option value="1.7777777778">Wide (16:9)</option>
                      </select>
                    </label>
                  </div>

                  {cropSource && (
                    <button
                      type="button"
                      onClick={() => setShowCropper(true)}
                      className="px-5 py-2.5 rounded-full bg-secondary-container text-on-secondary-container font-bold hover:scale-105 transition-transform"
                    >
                      Open Cropper
                    </button>
                  )}

                  {croppedPreviewUrl && (
                    <button
                      type="button"
                      onClick={uploadCroppedImage}
                      disabled={imageState.uploading}
                      className="px-5 py-2.5 rounded-full bg-primary-container text-on-primary-container font-bold hover:scale-105 transition-transform disabled:opacity-70 disabled:hover:scale-100"
                    >
                      {imageState.uploading ? 'Uploading...' : 'Upload Cropped Image'}
                    </button>
                  )}

                  {imageState.error && (
                    <div className="rounded-lg border border-error/20 bg-error-container/10 px-4 py-3 text-sm font-semibold text-error">
                      {imageState.error}
                    </div>
                  )}

                  {!imageState.error && imageState.success && (
                    <div className="rounded-lg border border-[#128C7E]/20 bg-[#128C7E]/10 px-4 py-3 text-sm font-semibold text-[#128C7E]">
                      {imageState.success}
                    </div>
                  )}
                </div>
              )}

              {previewImage && (
                <div className="relative aspect-video bg-surface-container rounded-xl overflow-hidden max-w-sm">
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm space-y-6">
            <h3 className="text-lg font-bold plusJakartaSans">Pricing & Stock</h3>
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-on-surface-variant uppercase ml-2 mb-2 block tracking-wider">Selling Price</span>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">₹</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={product.price}
                    onChange={(event) => {
                      const rawValue = event.target.value;

                      if (rawValue === '') {
                        setProduct({ ...product, price: '' });
                        return;
                      }

                      const normalized = rawValue.replace(/^0+(?=\d)/, '');
                      setProduct({ ...product, price: normalized });
                    }}
                    className="w-full bg-surface-container-low border-0 rounded-lg py-4 pl-10 pr-6 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
                    placeholder="0.00"
                  />
                </div>
              </label>

              <div className="pt-1 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-on-surface block">Sale Item</span>
                  <span className="text-[10px] text-on-surface-variant font-medium">Enable strike-through original price in storefront.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saleItemEnabled}
                    onChange={(event) => {
                      const enabled = event.target.checked;

                      if (!enabled) {
                        setProduct((previous) => ({ ...previous, discount_price: '' }));
                        return;
                      }

                      const selling = Number(product.price || 0);
                      const suggestedOriginal = Number.isFinite(selling) && selling > 0
                        ? String(Math.ceil(selling * 1.2))
                        : '';

                      setProduct((previous) => ({
                        ...previous,
                        discount_price: previous.discount_price || suggestedOriginal
                      }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-container"></div>
                </label>
              </div>

              {saleItemEnabled && (
                <>
                  <label className="block">
                    <span className="text-xs font-bold text-on-surface-variant uppercase ml-2 mb-2 block tracking-wider">Original Price (MRP)</span>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={product.discount_price}
                        onChange={(event) => {
                          const rawValue = event.target.value;

                          if (rawValue === '') {
                            setProduct({ ...product, discount_price: '' });
                            return;
                          }

                          const normalized = rawValue.replace(/^0+(?=\d)/, '');
                          setProduct({ ...product, discount_price: normalized });
                        }}
                        className="w-full bg-surface-container-low border-0 rounded-lg py-4 pl-10 pr-6 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </label>

                  {hasValidSalePricing ? (
                    <div className="rounded-lg border border-error/25 bg-error-container/10 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-error mb-1">Sale Active</p>
                      <p className="text-sm font-semibold text-on-surface">
                        Selling at ₹{sellingPriceValue.toFixed(2)} from ₹{originalPriceValue.toFixed(2)} ({saleDiscountPercent}% off)
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low px-4 py-3">
                      <p className="text-sm font-semibold text-on-surface-variant">
                        Enter an Original Price greater than Selling Price to activate sale pricing.
                      </p>
                    </div>
                  )}
                </>
              )}

              <label className="block">
                <span className="text-xs font-bold text-on-surface-variant uppercase ml-2 mb-2 block tracking-wider">Inventory Quantity</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={inventoryStock}
                  onChange={(event) => setInventoryStock(event.target.value)}
                  className="w-full bg-surface-container-low border-0 rounded-lg py-4 px-6 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
                  placeholder="0"
                />
              </label>

              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${inventoryState.chipClass}`}>
                {inventoryState.label}
              </div>

              <p className="text-xs text-on-surface-variant font-medium">
                Inventory status is reflected on Dashboard, Shop, Best Sellers, and New Arrivals.
              </p>

              <div className="pt-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-on-surface block">Available for Sale</span>
                  <span className="text-[10px] text-on-surface-variant font-medium">Product will be visible in shop</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={product.is_available} onChange={e => setProduct({...product, is_available: e.target.checked})} className="sr-only peer" />
                  <div className="w-14 h-8 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-container"></div>
                </label>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm space-y-6">
            <h3 className="text-lg font-bold plusJakartaSans">Organization</h3>
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-on-surface-variant uppercase ml-2 mb-2 block tracking-wider">Category</span>
                <select value={product.category_id || ''} onChange={e => setProduct({...product, category_id: e.target.value})} className="w-full bg-surface-container-low border-0 rounded-lg py-4 px-6 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all appearance-none cursor-pointer">
                  <option value="">Select Category...</option>
                  {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </label>

              <div className="rounded-xl border border-outline-variant/20 p-4 bg-surface-container-low/30 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Storefront Tags</p>
                <div className="space-y-2">
                  {HIGHLIGHT_TAGS.map((tagOption) => (
                    <label key={tagOption.value} className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low border border-outline-variant/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasTag(tagOption.value)}
                        onChange={() => toggleProductTag(tagOption.value)}
                        className="mt-1 rounded border-outline-variant text-primary focus:ring-primary"
                      />
                      <span>
                        <span className="text-sm font-bold text-on-surface block">{tagOption.label}</span>
                        <span className="text-xs text-on-surface-variant">{tagOption.help}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-tertiary-container/10 rounded-2xl border-2 border-tertiary-container/20">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-tertiary" style={{fontVariationSettings: "'FILL' 1"}}>tips_and_updates</span>
                  <span className="text-sm font-bold text-tertiary-dim">AI Strategy Tip</span>
                </div>
                <p className="text-xs text-on-tertiary-container leading-relaxed">
                  Most products in the <b>Wooden Toys</b> category perform better with lifestyle images showing tactile play.
                </p>
              </div>
            </div>
          </section>
        </div>
      </form>
    </>
  );
};

export default EditProduct;
