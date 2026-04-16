import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useFavoritesStore from '../store/favoritesStore';
import seedData from '../../assets.json';

const Home = () => {
  const addToCart = useCartStore(state => state.addToCart);
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  // Optional: In a real app we'd fetch these from our useProducts hook.
  // Using seedData here for exact Stitch UI replication for now.
  const { products, categories, hero_image } = seedData;

  const [selectedCategories, setSelectedCategories] = useState(() => categories.map((category) => category.slug));
  const [viewMode, setViewMode] = useState('grid');

  const maxAvailablePrice = useMemo(() => {
    return products.reduce((max, product) => Math.max(max, Number(product.price || 0)), 0);
  }, [products]);

  const [maxPriceFilter, setMaxPriceFilter] = useState(maxAvailablePrice);

  const categoryNameBySlug = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.slug] = category.name;
      return acc;
    }, {});
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const isCategoryMatched = selectedCategories.includes(product.category_slug);
      const isPriceMatched = Number(product.price || 0) <= maxPriceFilter;
      return isCategoryMatched && isPriceMatched;
    });
  }, [products, selectedCategories, maxPriceFilter]);

  const toggleCategory = (slug) => {
    setSelectedCategories((previous) => {
      if (previous.includes(slug)) {
        return previous.filter((item) => item !== slug);
      }

      return [...previous, slug];
    });
  };

  const sliderStep = maxAvailablePrice > 1000 ? 100 : 10;

  return (
    <>
      {/* Hero Section */}
      <section className="px-8 mt-8">
        <div className="relative h-[600px] w-full rounded-xl overflow-hidden shadow-xl bg-surface-container-high">
          <img alt="Hero Toys" className="w-full h-full object-cover" src={hero_image} />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/40 via-stone-900/10 to-transparent flex flex-col justify-center px-16">
            <h1 className="plusJakartaSans font-extrabold text-7xl text-white max-w-xl leading-tight tracking-tight">
              TurtleTots: <br /><span className="text-primary-container">Where Fun Lives!</span>
            </h1>
            <p className="text-white/90 text-xl mt-6 max-w-md font-medium">Curated playthings designed to spark imagination and bring boundless joy to every home.</p>
            <div className="mt-10 flex gap-4">
              <button className="bg-primary-container text-on-primary-fixed px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                Explore Toys
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Explorer Section */}
      <section className="flex gap-8 px-8 mt-12">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-28 space-y-8">
            {/* Categories */}
            <div>
              <h3 className="plusJakartaSans font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">category</span>
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label
                    key={cat.slug}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group ${selectedCategories.includes(cat.slug) ? 'bg-primary-container/20' : 'bg-white hover:bg-primary-container/10'}`}
                  >
                    <input
                      className="rounded-md border-outline-variant text-primary focus:ring-primary"
                      type="checkbox"
                      checked={selectedCategories.includes(cat.slug)}
                      onChange={() => toggleCategory(cat.slug)}
                    />
                    <span className="font-medium text-on-surface group-hover:text-primary transition-colors">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Price Slider */}
            <div>
              <h3 className="plusJakartaSans font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">payments</span>
                Price Range
              </h3>
              <div className="px-2">
                <input
                  className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                  type="range"
                  min="0"
                  max={maxAvailablePrice}
                  step={sliderStep}
                  value={maxPriceFilter}
                  onChange={(event) => setMaxPriceFilter(Number(event.target.value))}
                />
                <div className="flex justify-between mt-3 text-xs font-bold text-on-surface-variant">
                  <span>₹0</span>
                  <span>₹{maxPriceFilter.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="plusJakartaSans text-4xl font-extrabold tracking-tight">Handpicked Treasures</h2>
              <p className="text-on-surface-variant font-medium mt-1">Showing {filteredProducts.length} items</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-on-surface-variant'}`}
                aria-label="Switch to grid view"
              >
                <span className="material-symbols-outlined">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-on-surface-variant'}`}
                aria-label="Switch to list view"
              >
                <span className="material-symbols-outlined">view_list</span>
              </button>
            </div>
          </div>

          {!filteredProducts.length ? (
            <div className="bg-surface-container-lowest rounded-xl p-10 text-center text-on-surface-variant font-semibold">
              No products match your category or price filters.
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map((product) => {
                const favoriteKey = product.id || product.slug;
                const productIsFavorite = isFavorite(favoriteKey);

                return (
                  <div key={product.slug} className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_60px_-15px_rgba(109,90,0,0.08)] transition-all group">
                    <Link to={`/product/${product.slug}`} className="block relative rounded-xl overflow-hidden bg-surface-container-high h-72 mb-6 cursor-pointer">
                      <img alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={product.image_url} />
                      {product.discount_price && (
                        <span className="absolute top-4 left-4 bg-error text-on-error px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Sale</span>
                      )}
                      <button
                        className="absolute top-4 right-4 bg-white/80 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center text-error hover:scale-110 transition-transform"
                        onClick={(event) => {
                          event.preventDefault();
                          toggleFavorite(product);
                        }}
                        aria-label={productIsFavorite ? `Remove ${product.name} from favourites` : `Add ${product.name} to favourites`}
                      >
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: productIsFavorite ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                      </button>
                    </Link>
                    <div>
                      <Link to={`/product/${product.slug}`}>
                        <h3 className="plusJakartaSans font-extrabold text-xl mb-2 hover:text-primary transition-colors">{product.name}</h3>
                      </Link>
                      <div className="flex items-center gap-2 mb-6">
                        <p className="text-primary font-black text-2xl">₹{product.price.toFixed(2)}</p>
                        {product.discount_price && (
                          <p className="text-on-surface-variant line-through text-sm">₹{product.discount_price.toFixed(2)}</p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => addToCart({ id: product.slug, ...product })}
                          className="flex-1 bg-primary-container text-on-primary-container h-12 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => {
                const favoriteKey = product.id || product.slug;
                const productIsFavorite = isFavorite(favoriteKey);

                return (
                  <div key={product.slug} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/10 flex flex-col md:flex-row gap-5">
                    <Link to={`/product/${product.slug}`} className="block w-full md:w-56 shrink-0 rounded-xl overflow-hidden bg-surface-container-high h-44">
                      <img alt={product.name} className="w-full h-full object-cover" src={product.image_url} />
                    </Link>
                    <div className="flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">{categoryNameBySlug[product.category_slug] || 'Uncategorized'}</p>
                            <h3 className="plusJakartaSans font-extrabold text-2xl leading-tight">{product.name}</h3>
                          </div>
                          <button
                            className="w-10 h-10 rounded-full bg-error-container/10 text-error hover:scale-105 transition-transform"
                            onClick={() => toggleFavorite(product)}
                            aria-label={productIsFavorite ? `Remove ${product.name} from favourites` : `Add ${product.name} to favourites`}
                          >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: productIsFavorite ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                          </button>
                        </div>
                        <p className="text-on-surface-variant mt-2 text-sm line-clamp-2">{product.description}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-primary font-black text-3xl">₹{product.price.toFixed(2)}</p>
                          {product.discount_price && (
                            <p className="text-on-surface-variant line-through text-base">₹{product.discount_price.toFixed(2)}</p>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <Link to={`/product/${product.slug}`} className="px-5 h-11 rounded-full bg-surface-container-low text-on-surface-variant font-bold inline-flex items-center justify-center hover:bg-surface-container-high transition-colors">
                            Details
                          </Link>
                          <button
                            onClick={() => addToCart({ id: product.slug, ...product })}
                            className="px-5 h-11 rounded-full bg-primary-container text-on-primary-container font-bold flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Home;
