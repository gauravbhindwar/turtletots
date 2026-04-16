import React from 'react';
import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useFavoritesStore from '../store/favoritesStore';

const Favorites = () => {
  const addToCart = useCartStore((state) => state.addToCart);
  const { favoriteItems, toggleFavorite } = useFavoritesStore();

  if (!favoriteItems.length) {
    return (
      <section className="px-8 mt-12">
        <div className="max-w-3xl mx-auto bg-surface-container-lowest rounded-2xl p-10 text-center shadow-sm border border-outline-variant/20">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary-container/30 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">favorite</span>
          </div>
          <h2 className="plusJakartaSans text-3xl font-extrabold tracking-tight mb-2">No favourites yet</h2>
          <p className="text-on-surface-variant mb-8">Tap the heart icon on any toy to save it in this session.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
            <span className="material-symbols-outlined">arrow_back</span>
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="px-8 mt-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="plusJakartaSans text-4xl font-extrabold tracking-tight">Your Favourites</h2>
          <p className="text-on-surface-variant font-medium mt-1">{favoriteItems.length} saved in this session</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {favoriteItems.map((product) => (
          <div key={product.id || product.slug} className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_60px_-15px_rgba(109,90,0,0.08)] transition-all group">
            <Link to={`/product/${product.slug}`} className="block relative rounded-xl overflow-hidden bg-surface-container-high h-72 mb-6 cursor-pointer">
              <img alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={product.image_url} />
            </Link>
            <div>
              <h3 className="plusJakartaSans font-extrabold text-xl mb-2">{product.name}</h3>
              <p className="text-primary font-black text-2xl mb-6">₹{Number(product.price || 0).toFixed(2)}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => addToCart({ id: product.slug || product.id, ...product })}
                  className="flex-1 bg-primary-container text-on-primary-container h-12 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                  Add
                </button>
                <button
                  onClick={() => toggleFavorite(product)}
                  className="w-12 h-12 rounded-full bg-error-container/15 text-error hover:scale-105 transition-transform"
                  aria-label={`Remove ${product.name} from favorites`}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Favorites;