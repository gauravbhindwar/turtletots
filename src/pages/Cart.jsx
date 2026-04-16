import React from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import { supabase } from '../utils/supabase';
import { useAuthSession } from '../hooks/useAuthSession';

const Cart = () => {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated } = useAuthSession();
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '+1234567890'; // User to modify this in .env
  const [placingOrder, setPlacingOrder] = React.useState(false);
  const [orderError, setOrderError] = React.useState('');
  const [orderSuccess, setOrderSuccess] = React.useState('');

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleWhatsAppCheckout = () => {
    const message = `Hello! I would like to order the following from TurtleTots:\n\n${cartItems
      .map((item) => `- ${item.quantity}x ${item.name} (₹${(item.price * item.quantity).toFixed(2)})`)
      .join('\n')}\n\nTotal: ₹${subtotal.toFixed(2)}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encoded}`, '_blank');
  };

  const handlePlaceOrder = async () => {
    setOrderError('');
    setOrderSuccess('');

    if (!isAuthenticated || !user?.id) {
      navigate('/login?next=/cart');
      return;
    }

    if (!cartItems.length) {
      setOrderError('Your cart is empty. Add at least one product.');
      return;
    }

    setPlacingOrder(true);

    const orderNumber = `TT-${Date.now()}`;
    const totalAmount = subtotal;

    const { data: orderData, error: orderInsertError } = await supabase
      .from('orders')
      .insert([
        {
          order_number: orderNumber,
          user_id: user.id,
          status: 'pending',
          total_amount: totalAmount,
          shipping_address: profile?.address || ''
        }
      ])
      .select('id, order_number')
      .single();

    if (orderInsertError) {
      setOrderError(orderInsertError.message || 'Unable to place order right now.');
      setPlacingOrder(false);
      return;
    }

    const orderItemsPayload = cartItems.map((item) => ({
      order_id: orderData.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price
    }));

    const { error: itemsInsertError } = await supabase.from('order_items').insert(orderItemsPayload);

    if (itemsInsertError) {
      setOrderError(itemsInsertError.message || 'Order created, but failed to attach order items.');
      setPlacingOrder(false);
      return;
    }

    clearCart();
    setOrderSuccess(`Order ${orderData.order_number} placed successfully.`);
    setPlacingOrder(false);
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

          {orderError && (
            <div className="mb-4 rounded-lg border border-error/30 bg-error-container/10 px-3 py-2 text-xs font-semibold text-error">
              {orderError}
            </div>
          )}

          {!orderError && orderSuccess && (
            <div className="mb-4 rounded-lg border border-[#128C7E]/30 bg-[#128C7E]/10 px-3 py-2 text-xs font-semibold text-[#128C7E]">
              {orderSuccess}
            </div>
          )}

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
          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder}
            className="w-full bg-primary-container text-on-primary-container py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:brightness-95 transition-colors shadow-md mb-4 disabled:opacity-70"
          >
            <span className="material-symbols-outlined">receipt_long</span>
            {placingOrder ? 'Placing Order...' : 'Place Order'}
          </button>
          <button onClick={handleWhatsAppCheckout} className="w-full bg-[#25D366] text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#1DA851] transition-colors shadow-lg">
            <span className="material-symbols-outlined">chat</span>
            Order via WhatsApp
          </button>
          <p className="text-xs text-on-surface-variant text-center mt-4">You will be redirected to WhatsApp to confirm your order directly with us.</p>
        </div>
      </div>
    </div>
  );
};

export default Cart;
