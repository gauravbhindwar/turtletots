import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useFavoritesStore from '../store/favoritesStore';
import { supabase } from '../utils/supabase';
import { getInventoryState, getTotalStockFromVariants } from '../utils/inventory';

const HOME_HERO_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfYhv3d-un4C0rNmRWV4E3skjiDojogHJ0rW-C0WLn3ZFlHwhXw3n3SZt107EZYOntu0DaQ7ssVuxLBjpvuWZmmagK1DfVmCv-5N3x3JGNy-YbULyGzXBAjTv03cjdS2a-B8zt6_zkRt_jVnrKg4fxhcBrUS1phex2FRwXAu8cGndcXtxX8Ii550Dp3fhK0bW7mERpX66a3vh4SaXw4tqTPDIRvsCXQ4yIqAGkBex1uBrsm7CH2isvZWjg7ly9PJyjIny1rW8T4L0n';

const Home = () => {
  const addToCart = useCartStore((state) => state.addToCart);
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchCatalog = async () => {
      setLoading(true);
      setError('');

      const [categoriesRes, productsRes] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, slug')
          .order('name', { ascending: true }),
        supabase
          .from('products')
          .select('id, slug, name, description, price, discount_price, image_url, is_available, categories(name, slug), product_variants(stock)')
          .eq('is_available', true)
          .order('created_at', { ascending: false })
      ]);

      if (!isMounted) {
        return;
      }

      if (categoriesRes.error || productsRes.error) {
        setCategories([]);
        setProducts([]);
        setError(productsRes.error?.message || categoriesRes.error?.message || 'Unable to load shop items right now.');
        setLoading(false);
        return;
      }

      const categoryRows = categoriesRes.data || [];
      const productRows = (productsRes.data || []).map((product, index) => {
        const totalStock = getTotalStockFromVariants(product.product_variants);
        const effectiveStock = product.is_available ? totalStock : 0;
        const sellingPrice = Number(product.price || 0);
        const originalPrice = Number(product.discount_price || 0);
        const isOnSale = Number.isFinite(originalPrice) && originalPrice > sellingPrice && sellingPrice > 0;
        const saleDiscountPercent = isOnSale
          ? Math.max(1, Math.round(((originalPrice - sellingPrice) / originalPrice) * 100))
          : 0;

        return {
          ...product,
          id: product.id || product.slug || `home-${index}`,
          price: sellingPrice,
          discount_price: isOnSale ? originalPrice : null,
          category_slug: product.categories?.slug || '',
          category_name: product.categories?.name || 'Uncategorized',
          inventory: getInventoryState(effectiveStock),
          is_on_sale: isOnSale,
          sale_discount_percent: saleDiscountPercent
        };
      });

      setCategories(categoryRows);
      setProducts(productRows);
      setLoading(false);
    };

    fetchCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [viewMode, setViewMode] = useState('grid');

  const maxAvailablePrice = useMemo(() => {
    return products.reduce((max, product) => Math.max(max, Number(product.price || 0)), 0);
  }, [products]);

  const [maxPriceFilter, setMaxPriceFilter] = useState(0);

  useEffect(() => {
    if (!categories.length) {
      setSelectedCategories([]);
      return;
    }

    setSelectedCategories((previous) => {
      if (!previous.length) {
        return categories.map((category) => category.slug);
      }

      return previous.filter((slug) => categories.some((category) => category.slug === slug));
    });
  }, [categories]);

  useEffect(() => {
    if (!maxAvailablePrice) {
      setMaxPriceFilter(0);
      return;
    }

    setMaxPriceFilter((previous) => {
      if (!previous || previous > maxAvailablePrice) {
        return maxAvailablePrice;
      }

      return previous;
    });
  }, [maxAvailablePrice]);

  const categoryNameBySlug = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.slug] = category.name;
      return acc;
    }, {});
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const isCategoryMatched = !product.category_slug || selectedCategories.includes(product.category_slug);
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

  const heroStats = useMemo(() => {
    const inStockCount = products.filter((product) => product.inventory?.totalStock > 0).length;
    const onSaleCount = products.filter((product) => product.is_on_sale).length;

    return [
      { label: 'Toys in Stock', value: inStockCount },
      { label: 'Categories', value: categories.length },
      { label: 'On Sale', value: onSaleCount }
    ];
  }, [products, categories]);

  return (
    <>
      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 mt-4 sm:mt-8">
        <div className="relative w-full rounded-[2rem] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] bg-[#090b10] border border-white/10">
          <div className="relative flex flex-col lg:grid lg:grid-cols-12 lg:min-h-[560px]">
            <div className="order-2 lg:order-1 lg:col-span-5 px-6 sm:px-8 lg:px-12 py-8 lg:py-10 bg-gradient-to-br from-black/80 via-black/65 to-transparent">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2 text-[11px] sm:text-xs font-black uppercase tracking-[0.18em] text-white w-fit">
                <span className="material-symbols-outlined text-sm">toys</span>
                Playtime, Curated Daily
              </div>

              <div className="mt-5 max-w-xl">
                <h1 className="plusJakartaSans font-extrabold text-[42px] leading-[0.96] sm:text-6xl lg:text-[70px] text-white tracking-[-0.03em]">
                  TurtleTots
                  <span className="block text-primary-container mt-1 sm:mt-2">Where Fun Lives!</span>
                </h1>

                <p className="text-white/90 text-base sm:text-lg mt-5 max-w-lg font-medium leading-relaxed">
                  Curated playthings designed to spark imagination, build confidence, and bring boundless joy to every home.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/best-sellers"
                    className="bg-primary-container text-on-primary-fixed px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-black text-sm sm:text-base shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                  >
                    Explore Best Sellers
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                  <Link
                    to="/new-arrivals"
                    className="bg-white/15 text-white border border-white/35 backdrop-blur-md px-6 sm:px-7 py-3 sm:py-3.5 rounded-full font-bold text-sm sm:text-base hover:bg-white/20 transition-colors"
                  >
                    New Arrivals
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-xs sm:max-w-sm mt-6">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-3">
                    <p className="text-white text-lg sm:text-2xl font-black leading-none">{stat.value}</p>
                    <p className="text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-7 relative min-h-[320px] sm:min-h-[420px] lg:min-h-[560px] bg-black">
              <img
                alt="Hero Toys"
                className="absolute inset-0 w-full h-full object-cover lg:object-contain lg:object-center"
                src={HOME_HERO_IMAGE}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent lg:bg-gradient-to-l lg:from-black/10 lg:via-transparent lg:to-black/35"></div>
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
              {error && <p className="text-error text-sm font-semibold mt-2">{error}</p>}
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

          {loading ? (
            <div className="bg-surface-container-lowest rounded-xl p-10 text-center text-on-surface-variant font-semibold">
              Loading products...
            </div>
          ) : !filteredProducts.length ? (
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
                      {product.is_on_sale && (
                        <span className="absolute top-4 left-4 bg-error text-on-error px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                          Sale {product.sale_discount_percent}%
                        </span>
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
                        <p className="text-primary font-black text-2xl">₹{Number(product.price || 0).toFixed(2)}</p>
                        {product.is_on_sale && (
                          <p className="text-on-surface-variant line-through text-sm">₹{Number(product.discount_price || 0).toFixed(2)}</p>
                        )}
                      </div>

                      <div className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-5 ${product.inventory.chipClass}`}>
                        {product.inventory.shortLabel}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => addToCart({ ...product, quantity: 1 })}
                          disabled={product.inventory.totalStock <= 0}
                          className={`flex-1 h-12 rounded-full font-bold flex items-center justify-center gap-2 transition-colors ${
                            product.inventory.totalStock > 0
                              ? 'bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim'
                              : 'bg-surface-variant text-outline cursor-not-allowed'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                          {product.inventory.totalStock > 0 ? 'Add' : 'Out of Stock'}
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
                            {product.is_on_sale && (
                              <span className="inline-flex mt-2 px-2.5 py-1 rounded-full bg-error text-on-error text-[10px] font-black uppercase tracking-widest">
                                Sale {product.sale_discount_percent}% Off
                              </span>
                            )}
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
                          <p className="text-primary font-black text-3xl">₹{Number(product.price || 0).toFixed(2)}</p>
                          {product.is_on_sale && (
                            <p className="text-on-surface-variant line-through text-base">₹{Number(product.discount_price || 0).toFixed(2)}</p>
                          )}
                        </div>

                        <div className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${product.inventory.chipClass}`}>
                          {product.inventory.shortLabel}
                        </div>

                        <div className="flex gap-3">
                          <Link to={`/product/${product.slug}`} className="px-5 h-11 rounded-full bg-surface-container-low text-on-surface-variant font-bold inline-flex items-center justify-center hover:bg-surface-container-high transition-colors">
                            Details
                          </Link>
                          <button
                            onClick={() => addToCart({ ...product, quantity: 1 })}
                            disabled={product.inventory.totalStock <= 0}
                            className={`px-5 h-11 rounded-full font-bold flex items-center justify-center gap-2 transition-colors ${
                              product.inventory.totalStock > 0
                                ? 'bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim'
                                : 'bg-surface-variant text-outline cursor-not-allowed'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                            {product.inventory.totalStock > 0 ? 'Add' : 'Out of Stock'}
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
