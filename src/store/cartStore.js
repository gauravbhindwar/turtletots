import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set) => ({
      cartItems: [],
      addToCart: (product) => set((state) => {
        // Respect the quantity the user selected (e.g. qty spinner on product page).
        const addQty = Math.max(1, Number(product.quantity) || 1);
        const existing = state.cartItems.find(item => item.id === product.id);
        if (existing) {
          return {
            cartItems: state.cartItems.map(item =>
              item.id === product.id ? { ...item, quantity: item.quantity + addQty } : item
            )
          };
        }
        return { cartItems: [...state.cartItems, { ...product, quantity: addQty }] };
      }),
      removeFromCart: (productId) => set((state) => ({
        cartItems: state.cartItems.filter(item => item.id !== productId)
      })),
      updateQuantity: (productId, quantity) => set((state) => ({
        cartItems: state.cartItems.map(item =>
          item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
        )
      })),
      clearCart: () => set({ cartItems: [] })
    }),
    {
      name: 'turtletots-cart',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

export default useCartStore;
