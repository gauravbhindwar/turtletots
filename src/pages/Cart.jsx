import React from 'react';
import useCartStore from '../store/cartStore';
import WhatsAppBrandIcon from '../components/WhatsAppBrandIcon';
import { getStoreSettings } from '../utils/storeSettings';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const fallbackWhatsApp = import.meta.env.VITE_WHATSAPP_NUMBER || '+1234567890';
  const [waNumber, setWaNumber] = React.useState(fallbackWhatsApp);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  React.useEffect(() => {
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

  const handleWhatsAppCheckout = () => {
    const message = `Hello! I would like to order the following from TurtleTots:\n\n${cartItems
      .map((item) => `- ${item.quantity}x ${item.name} (₹${(item.price * item.quantity).toFixed(2)})`)
      .join('\n')}\n\nTotal: ₹${subtotal.toFixed(2)}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encoded}`, '_blank');
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-32 h-[60vh]">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">shopping_cart</span>
        <h2 className="plusJakartaSans text-2xl font-bold">Your cart is empty</h2>
        <p className="text-on-surface-variant mt-2 mb-6">Looks like you haven't added any toys yet.</p>
        <button onClick={() => window.location.href = '/'} className="bg-primary-container text-on-primary-container px-6 py-3 rounded-full font-bold">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="px-8 mt-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2">
        <h2 className="plusJakartaSans text-3xl font-extrabold mb-8">Shopping Cart</h2>
        <div className="space-y-6">
          {cartItems.map((item) => (
            <div key={item.id} className="flex gap-6 p-4 bg-white rounded-xl shadow-sm">
              <div className="w-32 h-32 rounded-lg overflow-hidden shrink-0 bg-surface">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="plusJakartaSans font-bold text-xl">{item.name}</h3>
                <p className="text-on-surface-variant mb-4">₹{item.price.toFixed(2)} each</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-surface-container-low rounded-full px-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex justify-center items-center font-bold text-lg">-</button>
                    <span className="w-8 text-center font-bold px-2">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex justify-center items-center font-bold text-lg">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-error font-medium hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">delete</span> Remove
                  </button>
                </div>
              </div>
              <div className="flex items-center">
                <p className="font-black text-xl">₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="bg-surface-container-low rounded-2xl p-8 sticky top-28">
          <h3 className="plusJakartaSans font-bold text-2xl mb-6">Order Summary</h3>

          <div className="flex justify-between font-medium mb-4 text-on-surface-variant">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium mb-4 text-on-surface-variant">
            <span>Shipping</span>
            <span>Calculated Next</span>
          </div>
          <div className="border-t border-outline-variant my-4"></div>
          <div className="flex justify-between font-black text-2xl mb-8">
            <span>Total</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <button onClick={handleWhatsAppCheckout} className="w-full bg-[#25D366] text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#1DA851] transition-colors shadow-lg">
            <WhatsAppBrandIcon className="w-6 h-6" />
            Order via WhatsApp
          </button>
          <p className="text-xs text-on-surface-variant text-center mt-4">You will be redirected to WhatsApp to confirm your order directly with us.</p>
        </div>
      </div>
    </div>
  );
};

export default Cart;
