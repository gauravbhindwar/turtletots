import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const getProductKey = (product) => product?.id || product?.slug;

const normalizeFavoriteProduct = (product) => {
  const key = getProductKey(product);

  return {
    id: key,
    slug: product?.slug || String(key || ''),
    name: product?.name || 'Untitled Product',
    price: Number(product?.price || 0),
    discount_price: product?.discount_price ? Number(product.discount_price) : null,
    image_url: product?.image_url || '',
    category_slug: product?.category_slug || '',
    description: product?.description || '',
    is_available: product?.is_available !== false
  };
};

const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favoriteItems: [],
      toggleFavorite: (product) => {
        const key = getProductKey(product);
        if (!key) return;

        set((state) => {
          const alreadyFavorite = state.favoriteItems.some((item) => (item.id || item.slug) === key);

          if (alreadyFavorite) {
            return {
              favoriteItems: state.favoriteItems.filter((item) => (item.id || item.slug) !== key)
            };
          }

          return {
            favoriteItems: [...state.favoriteItems, normalizeFavoriteProduct(product)]
          };
        });
      },
      isFavorite: (productId) => {
        return get().favoriteItems.some((item) => (item.id || item.slug) === productId);
      },
      clearFavorites: () => set({ favoriteItems: [] })
    }),
    {
      name: 'turtletots-favorites-session',
      storage: createJSONStorage(() => sessionStorage)
    }
  )
);

export default useFavoritesStore;