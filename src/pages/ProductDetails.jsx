import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import useCartStore from '../store/cartStore';

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCartStore();

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('slug', slug)
      .single();
    
    if (data) setProduct(data);
    setLoading(false);
  };

  const handleAddToCart = () => {
    if(!product) return;
    addToCart({ ...product, quantity });
    // Toast notification could go here
    alert(`${product.name} added to cart!`);
  };

  const handleWhatsAppOrder = () => {
    if(!product) return;
    const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210';
    const message = `Hello! I would like to order ${quantity}x of ${product.name} (₹${(product.price * quantity).toFixed(2)}) from TurtleTots.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encoded}`, '_blank');
  };

  if (loading) return <div className="p-32 text-center text-xl font-bold">Loading product details...</div>;
  if (!product) return <div className="p-32 text-center text-xl font-bold text-error">Product not found.</div>;

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
              ₹{product.price.toFixed(2)}
            </span>
            {product.discount_price && (
              <span className="text-xl plusJakartaSans font-bold text-on-surface-variant line-through">
                ₹{product.discount_price.toFixed(2)}
              </span>
            )}
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
                
                <button onClick={handleAddToCart} disabled={!product.is_available} className={`flex-1 h-14 font-headline font-bold rounded-full shadow-sm flex items-center justify-center gap-2 transition-all ${product.is_available ? 'bg-primary-container text-on-primary-container hover:bg-primary hover:text-white' : 'bg-surface-variant text-outline cursor-not-allowed'}`}>
                  <span className="material-symbols-outlined">shopping_basket</span>
                  {product.is_available ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>

              {product.is_available && (
                <button onClick={handleWhatsAppOrder} className="w-full h-14 bg-[#25D366] text-white font-headline font-bold rounded-full flex items-center justify-center gap-3 shadow-md hover:brightness-105 transition-all">
                  <span className="material-symbols-outlined fill-current">chat</span>
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
