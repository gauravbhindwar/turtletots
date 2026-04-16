import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import useCartStore from '../store/cartStore';
import { useToast } from '../components/ToastProvider';
import WhatsAppBrandIcon from '../components/WhatsAppBrandIcon';
import { getStoreSettings } from '../utils/storeSettings';
import { getInventoryState, getTotalStockFromVariants } from '../utils/inventory';

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [waNumber, setWaNumber] = useState(import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210');
  const { addToCart } = useCartStore();
  const { showToast } = useToast();

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    let isMounted = true;

    const hydrateWhatsAppNumber = async () => {
      const settings = await getStoreSettings();
      const configuredNumber = settings?.whatsapp_order_number?.trim();

      if (isMounted && configuredNumber) {
        setWaNumber(configuredNumber);
      }
    };

    hydrateWhatsAppNumber();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchProduct = async () => {
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('products')
      .select('id, slug, name, description, price, discount_price, image_url, is_available, categories(name), product_variants(stock)')
      .eq('slug', slug)
      .maybeSingle();
    
    if (fetchError) {
      setError(fetchError.message || 'Unable to load product details.');
      setProduct(null);
      setLoading(false);
      return;
    }

    if (data) {
      setProduct(data);
    } else {
      setProduct(null);
      setError('Product not found.');
    }

    setLoading(false);
  };

  const handleAddToCart = () => {
    if(!product) return;

    const stockState = getInventoryState(product.is_available ? getTotalStockFromVariants(product.product_variants) : 0);

    if (stockState.totalStock <= 0) {
      showToast('This product is currently out of stock for cart checkout.', { type: 'info' });
      return;
    }

    addToCart({ ...product, quantity });
    showToast(`${product.name} added to cart!`, { type: 'success' });
  };

  const handleWhatsAppOrder = () => {
    if(!product) return;
    const message = `Hello! I would like to order ${quantity}x of ${product.name} (₹${(product.price * quantity).toFixed(2)}) from TurtleTots.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encoded}`, '_blank');
  };

  if (loading) return <div className="p-32 text-center text-xl font-bold">Loading product details...</div>;
  if (!product) return <div className="p-32 text-center text-xl font-bold text-error">{error || 'Product not found.'}</div>;

  const inventoryState = getInventoryState(product.is_available ? getTotalStockFromVariants(product.product_variants) : 0);
  const canAddToCart = product.is_available && inventoryState.totalStock > 0;

  return (
    <main className="pt-7 pb-24 px-4 md:px-12 lg:px-24 max-w-[1440px] mx-auto min-h-screen">
      <div className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant mb-8 cursor-pointer hover:text-primary transition-colors w-fit" onClick={() => navigate(-1)}>
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Shop
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Product Gallery (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-6 gap-4">
          {/* Main Image */}
          <div className="col-span-6 bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm relative group border border-outline-variant/10">
            {product.image_url ? (
              <img className="w-full h-[600px] object-contain p-12 transition-transform duration-500 group-hover:scale-105" src={product.image_url} alt={product.name} />
            ) : (
              <div className="w-full h-[600px] flex items-center justify-center bg-surface-variant text-outline">
                <span className="material-symbols-outlined text-6xl">image</span>
              </div>
            )}
            
            {product.discount_price && (
              <div className="absolute top-6 left-6">
                <span className="bg-primary-container text-on-primary-container px-4 py-2 rounded-full plusJakartaSans font-bold text-sm shadow-sm">- Sale</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Info (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div>
            <span className="text-sm font-bold text-secondary uppercase tracking-widest block mb-2">{product.categories?.name}</span>
            <h1 className="plusJakartaSans text-5xl font-extrabold tracking-tight text-on-surface mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-3">
              <div className="flex text-primary">
                <span className="material-symbols-outlined fill-current text-xl">star</span>
                <span className="material-symbols-outlined fill-current text-xl">star</span>
                <span className="material-symbols-outlined fill-current text-xl">star</span>
                <span className="material-symbols-outlined fill-current text-xl">star</span>
                <span className="material-symbols-outlined fill-current text-xl">star_half</span>
              </div>
              <span className="text-on-surface-variant font-medium">4.8 (124 reviews)</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-4xl plusJakartaSans font-black text-on-surface">
              ₹{Number(product.price || 0).toFixed(2)}
            </span>
            {product.discount_price && (
              <span className="text-xl plusJakartaSans font-bold text-on-surface-variant line-through">
                ₹{Number(product.discount_price || 0).toFixed(2)}
              </span>
            )}
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${inventoryState.chipClass}`}>
              {inventoryState.shortLabel}
            </span>
          </div>

          <p className="text-lg text-on-surface-variant leading-relaxed">
            {product.description || "The perfect addition to any toybox. Safe for kids and incredibly fun!"}
          </p>

          <div className="pt-6 border-t border-surface-variant/50">
            <span className="block text-sm font-bold text-on-surface mb-4 uppercase tracking-wider">Quantity</span>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center bg-surface-container rounded-full p-1 h-14 w-36 shadow-sm border border-outline-variant/10">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-full flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors font-black text-xl">
                    -
                  </button>
                  <span className="flex-1 text-center font-bold text-lg">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-full flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors font-black text-xl">
                    +
                  </button>
                </div>
                
                <button onClick={handleAddToCart} disabled={!canAddToCart} className={`flex-1 h-14 font-headline font-bold rounded-full shadow-sm flex items-center justify-center gap-2 transition-all ${canAddToCart ? 'bg-primary-container text-on-primary-container hover:bg-primary hover:text-white' : 'bg-surface-variant text-outline cursor-not-allowed'}`}>
                  <span className="material-symbols-outlined">shopping_basket</span>
                  {canAddToCart ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>

              {product.is_available && inventoryState.totalStock <= 0 && (
                <p className="text-xs font-semibold text-on-surface-variant">
                  This item is out of stock for cart checkout, but you can still contact us via WhatsApp.
                </p>
              )}

              {product.is_available && (
                <button onClick={handleWhatsAppOrder} className="w-full h-14 bg-[#25D366] text-white font-headline font-bold rounded-full flex items-center justify-center gap-3 shadow-md hover:brightness-105 transition-all">
                  <WhatsAppBrandIcon className="w-6 h-6" />
                  Order via WhatsApp
                </button>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-surface-variant/50">
            <div className="flex gap-6">
              <div className="flex items-center gap-2 text-sm text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-primary text-xl">local_shipping</span>
                Fast Delivery
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
                Safe & Certified
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetails;
