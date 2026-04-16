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
        const productCategory = Array.isArray(product.categories) ? product.categories[0] : product.categories;
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
          category_slug: productCategory?.slug || '',
          category_name: productCategory?.name || 'Uncategorized',
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

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

  const searchResults = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return [];
    return products.slice(0, 8).filter((product) => 
      product.name.toLowerCase().includes(searchLower) ||
      (product.description && product.description.toLowerCase().includes(searchLower))
    );
  }, [products, searchQuery]);

  const filteredProducts = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();
    return products.filter((product) => {
      const isCategoryMatched = selectedCategories.length === 0
        || !product.category_slug
        || selectedCategories.includes(product.category_slug);
      const isPriceMatched = Number(product.price || 0) <= maxPriceFilter;
      const isSearchMatched = !searchLower || 
        product.name.toLowerCase().includes(searchLower) ||
        (product.description && product.description.toLowerCase().includes(searchLower));
      return isCategoryMatched && isPriceMatched && isSearchMatched;
    });
  }, [products, selectedCategories, maxPriceFilter, searchQuery]);

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
      {/* Backdrop for search overlay */}
      {showSearchOverlay && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setShowSearchOverlay(false)} />
      )}
      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 mt-1 sm:mt-1">
        <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-[#171a22] bg-[radial-gradient(circle_at_top_left,#262b3a_0%,#0b0d12_45%,#050608_100%)] shadow-[0_28px_75px_-28px_rgba(0,0,0,0.46)]">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,211,61,0.12),transparent_28%,transparent_72%,rgba(255,211,61,0.08))]"></div>
          <div className="absolute left-[-8%] top-[12%] h-44 w-44 rounded-full bg-[#ffd84d]/12 blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[18%] h-56 w-56 rounded-full bg-[#4c83ff]/12 blur-3xl"></div>

          <div className="relative flex flex-col lg:grid lg:grid-cols-12 lg:min-h-[490px]">
            <div className="order-2 lg:order-1 lg:col-span-5 px-5 sm:px-7 lg:px-10 py-6 sm:py-8 lg:py-10 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 py-2 text-[11px] sm:text-xs font-black uppercase tracking-[0.22em] text-white backdrop-blur-md">
                <span className="material-symbols-outlined text-sm">toys</span>
                Playtime, Curated Daily
              </div>

              <div className="mt-5 max-w-xl">
                <p className="text-[#ffd84d] text-xs sm:text-sm font-bold uppercase tracking-[0.3em]">Modern toyroom essentials</p>
                <h1 className="plusJakartaSans mt-2 font-extrabold text-[2.3rem] leading-[0.94] sm:text-[2.8rem] lg:text-[3.35rem] text-white tracking-[-0.05em]">
                  TurtleTots
                  <span className="block mt-1 bg-[linear-gradient(180deg,#ffe67f_0%,#ffcc1d_100%)] bg-clip-text text-transparent">
                    Where Fun
                  </span>
                  <span className="block bg-[linear-gradient(180deg,#ffe67f_0%,#ffcc1d_100%)] bg-clip-text text-transparent">
                    Lives!
                  </span>
                </h1>

                <p className="mt-4 max-w-lg text-sm sm:text-base lg:text-lg text-white/82 font-medium leading-relaxed">
                  Curated playthings designed to spark imagination, build confidence, and turn every corner of your home into a place kids want to return to.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    to="/best-sellers"
                    className="group inline-flex items-center justify-between gap-4 rounded-[1.4rem] bg-[linear-gradient(180deg,#ffe169_0%,#ffcc1d_100%)] px-5 py-2.5 sm:px-6 sm:py-3 text-[#3f3100] shadow-[0_18px_40px_-18px_rgba(255,208,41,0.9)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_45px_-16px_rgba(255,208,41,0.95)]"
                  >
                    <span className="flex flex-col items-start">
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-[#6f5900]/80">Featured edit</span>
                      <span className="text-sm sm:text-base font-black">Explore Best Sellers</span>
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/35 text-[#493900] transition-transform group-hover:translate-x-1">
                      <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
                    </span>
                  </Link>
                  <Link
                    to="/new-arrivals"
                    className="inline-flex items-center justify-center rounded-[1.4rem] border border-white/16 bg-white/8 px-5 py-3 text-sm sm:text-base font-bold text-white backdrop-blur-md transition-colors hover:bg-white/14"
                  >
                    New Arrivals
                  </Link>
                  <a
                    href="#handpicked-treasures"
                    className="inline-flex items-center justify-center gap-2 rounded-[1.4rem] border border-[#ffd84d]/30 bg-[#ffd84d]/10 px-5 py-3 text-sm sm:text-base font-bold text-[#ffe67f] backdrop-blur-md transition-colors hover:bg-[#ffd84d]/16"
                  >
                    Browse Handpicked Items
                    <span className="material-symbols-outlined text-[18px]">south</span>
                  </a>
                </div>
              </div>

              <div className="mt-2 grid w-full max-w-md grid-cols-3 gap-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-[1.55rem] border border-white/12 bg-white/8 px-3 py-3.5 sm:px-4 sm:py-4 backdrop-blur-md">
                    <p className="text-white text-lg sm:text-[1.65rem] font-black leading-tight">{stat.value}</p>
                    <p className="mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-white/68 leading-snug">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-7 relative min-h-[230px] sm:min-h-[320px] lg:min-h-[490px]">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0.05),rgba(5,6,8,0.55))] lg:bg-[linear-gradient(90deg,rgba(5,6,8,0.15),rgba(5,6,8,0.02)_36%,rgba(5,6,8,0.45))]"></div>
              <div className="absolute inset-x-5 top-5 bottom-0 rounded-[1.8rem] border border-white/8 bg-white/[0.03] backdrop-blur-[2px] lg:inset-y-6 lg:left-0 lg:right-8"></div>
              <img
                alt="Hero Toys"
                className="absolute inset-0 h-full w-full object-cover object-center"
                src={HOME_HERO_IMAGE}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,transparent_0%,transparent_24%,rgba(0,0,0,0.28)_78%)]"></div>
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-[240px] rounded-[1.45rem] border border-white/12 bg-black/30 px-4 py-3.5 backdrop-blur-xl">
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.24em] text-[#ffd84d]">Playroom Favorite</p>
                <p className="mt-2 text-white text-sm sm:text-[15px] font-bold leading-snug">Discover collectible pieces and everyday play heroes kids keep reaching for.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Explorer Section */}
      <section className="flex flex-col lg:flex-row gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10">
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
          <div className="flex flex-col gap-4 mb-4 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="plusJakartaSans text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">Handpicked Treasures</h2>
                <p className="text-on-surface-variant font-medium text-sm mt-1">Showing {filteredProducts.length} items</p>
                {error && <p className="text-error text-sm font-semibold mt-2">{error}</p>}
              </div>
              <div className="flex gap-2 items-center shrink-0">
              <button
                type="button"
                onClick={() => setShowMobileFilters((previous) => !previous)}
                className="lg:hidden p-2 sm:p-2.5 rounded bg-white shadow-sm border border-outline-variant/15 text-on-surface-variant text-xl"
                aria-label="Toggle filters"
              >
                <span className="material-symbols-outlined text-sm">tune</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 sm:p-2.5 rounded border text-xl ${viewMode === 'grid' ? 'bg-white shadow-sm border-outline-variant/15' : 'text-on-surface-variant border-transparent'}`}
                aria-label="Switch to grid view"
              >
                <span className="material-symbols-outlined text-sm">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 sm:p-2.5 rounded border text-xl ${viewMode === 'list' ? 'bg-white shadow-sm border-outline-variant/15' : 'text-on-surface-variant border-transparent'}`}
                aria-label="Switch to list view"
              >
                <span className="material-symbols-outlined text-sm">view_list</span>
              </button>              </div>
            </div>
            <div className="w-full relative">
              <div className="flex items-center gap-2 bg-surface-container-lowest rounded-xl border border-outline-variant/10 px-3 py-2">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
                <input
                  type="text"
                  placeholder="Search toys by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchOverlay(true)}
                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-medium text-on-surface placeholder-on-surface-variant"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 hover:bg-surface-container rounded transition-colors"
                    aria-label="Clear search"
                  >
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">close</span>
                  </button>
                )}
              </div>

              {/* Search Results Overlay */}
              {showSearchOverlay && (searchQuery || searchResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 z-50 max-h-[500px] overflow-y-auto">
                  {searchQuery ? (
                    searchResults.length > 0 ? (
                      <div className="divide-y divide-outline-variant/10">
                        {searchResults.map((product) => {
                          const favoriteKey = product.id || product.slug;
                          const productIsFavorite = isFavorite(favoriteKey);
                          return (
                            <Link
                              key={product.slug}
                              to={`/product/${product.slug}`}
                              onClick={() => {
                                setShowSearchOverlay(false);
                                setSearchQuery('');
                              }}
                              className="flex gap-3 p-3 hover:bg-surface-container-lowest transition-colors group"
                            >
                              <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-surface-container-high">
                                <img alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" src={product.image_url} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">{categoryNameBySlug[product.category_slug] || 'Uncategorized'}</p>
                                <h4 className="font-bold text-sm leading-snug line-clamp-2 text-on-surface">{product.name}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                  <p className="font-black text-primary text-sm">₹{Number(product.price || 0).toFixed(2)}</p>
                                  {product.is_on_sale && (
                                    <p className="text-on-surface-variant line-through text-xs">₹{Number(product.discount_price || 0).toFixed(2)}</p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleFavorite(product);
                                }}
                                className="w-8 h-8 rounded-full bg-error-container/10 text-error hover:scale-110 transition-transform shrink-0 flex items-center justify-center"
                              >
                                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: productIsFavorite ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                              </button>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">search_off</span>
                        <p className="font-medium">No toys found for "{searchQuery}"</p>
                      </div>
                    )
                  ) : null}
                </div>
              )}

              {/* Close overlay when clicking outside */}
              {showSearchOverlay && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSearchOverlay(false)}
                />
              )}
            </div>
          </div>

          {showMobileFilters && (
            <div className="lg:hidden mb-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 p-4 space-y-4">
              <div>
                <h3 className="plusJakartaSans font-bold text-base mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">category</span>
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const selected = selectedCategories.includes(cat.slug);

                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => toggleCategory(cat.slug)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selected ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant'}`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="plusJakartaSans font-bold text-base mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">payments</span>
                  Price Range
                </h3>
                <input
                  className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                  type="range"
                  min="0"
                  max={maxAvailablePrice}
                  step={sliderStep}
                  value={maxPriceFilter}
                  onChange={(event) => setMaxPriceFilter(Number(event.target.value))}
                />
                <div className="flex justify-between mt-2 text-xs font-bold text-on-surface-variant">
                  <span>₹0</span>
                  <span>₹{maxPriceFilter.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="bg-surface-container-lowest rounded-xl p-10 text-center text-on-surface-variant font-semibold">
              Loading products...
            </div>
          ) : !filteredProducts.length ? (
            <div className="bg-surface-container-lowest rounded-xl p-10 text-center text-on-surface-variant font-semibold">
              No products match your category or price filters.
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 xl:gap-8">
              {filteredProducts.map((product) => {
                const favoriteKey = product.id || product.slug;
                const productIsFavorite = isFavorite(favoriteKey);

                return (
                  <div key={product.slug} className="bg-surface-container-lowest rounded-3xl p-3 sm:p-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_60px_-15px_rgba(109,90,0,0.08)] transition-all group">
                    <Link to={`/product/${product.slug}`} className="block relative rounded-[2.3rem] overflow-hidden bg-surface-container-high h-56 sm:h-64 xl:h-72 mb-4 sm:mb-6 cursor-pointer">
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
                        <h3 className="plusJakartaSans font-extrabold text-[32px] sm:text-xl mb-2 hover:text-primary transition-colors leading-tight">{product.name}</h3>
                      </Link>
                      <div className="flex items-center gap-2 mb-4 sm:mb-6">
                        <p className="text-primary font-black text-2xl sm:text-2xl">₹{Number(product.price || 0).toFixed(2)}</p>
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
                          className={`flex-1 h-11 sm:h-12 rounded-full font-bold flex items-center justify-center gap-2 transition-colors ${
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
            <div className="space-y-3 sm:space-y-4">
              {filteredProducts.map((product) => {
                const favoriteKey = product.id || product.slug;
                const productIsFavorite = isFavorite(favoriteKey);

                return (
                  <div key={product.slug} className="bg-surface-container-lowest rounded-2xl p-3 sm:p-4 shadow-sm border border-outline-variant/10 flex gap-3 sm:gap-4">
                    <Link to={`/product/${product.slug}`} className="block w-28 h-28 sm:w-36 sm:h-36 md:w-56 md:h-44 shrink-0 rounded-xl overflow-hidden bg-surface-container-high">
                      <img alt={product.name} className="w-full h-full object-cover" src={product.image_url} />
                    </Link>
                    <div className="flex-1 flex flex-col justify-between gap-2 sm:gap-4 min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">{categoryNameBySlug[product.category_slug] || 'Uncategorized'}</p>
                            <h3 className="plusJakartaSans font-extrabold text-lg sm:text-2xl leading-tight">{product.name}</h3>
                            {product.is_on_sale && (
                              <span className="inline-flex mt-2 px-2.5 py-1 rounded-full bg-error text-on-error text-[10px] font-black uppercase tracking-widest">
                                Sale {product.sale_discount_percent}% Off
                              </span>
                            )}
                          </div>
                          <button
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-error-container/10 text-error hover:scale-105 transition-transform shrink-0"
                            onClick={() => toggleFavorite(product)}
                            aria-label={productIsFavorite ? `Remove ${product.name} from favourites` : `Add ${product.name} to favourites`}
                          >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: productIsFavorite ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                          </button>
                        </div>
                        <p className="text-on-surface-variant mt-1 sm:mt-2 text-xs sm:text-sm line-clamp-2">{product.description}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-primary font-black text-2xl sm:text-3xl">₹{Number(product.price || 0).toFixed(2)}</p>
                          {product.is_on_sale && (
                            <p className="text-on-surface-variant line-through text-xs sm:text-base">₹{Number(product.discount_price || 0).toFixed(2)}</p>
                          )}
                        </div>

                        <div className={`inline-flex px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${product.inventory.chipClass}`}>
                          {product.inventory.shortLabel}
                        </div>

                        <div className="flex gap-2 w-full">
                          <Link to={`/product/${product.slug}`} className="px-3 sm:px-4 h-9 sm:h-10 rounded-lg bg-surface-container-low text-on-surface-variant font-semibold text-xs sm:text-sm flex items-center justify-center hover:bg-surface-container-high transition-colors">
                            Details
                          </Link>
                          <button
                            onClick={() => addToCart({ ...product, quantity: 1 })}
                            disabled={product.inventory.totalStock <= 0}
                            className={`px-3 sm:px-4 h-9 sm:h-10 rounded-lg font-semibold flex items-center justify-center gap-1 text-xs sm:text-sm transition-colors ${
                              product.inventory.totalStock > 0
                                ? 'bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim'
                                : 'bg-surface-variant text-outline cursor-not-allowed'
                            }`}
                          >
                            <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                            <span className="hidden sm:inline">{product.inventory.totalStock > 0 ? 'Add' : 'Out of Stock'}</span>
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
