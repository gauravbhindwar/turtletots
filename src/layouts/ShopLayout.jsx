import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useFavoritesStore from '../store/favoritesStore';
import { useAuthSession } from '../hooks/useAuthSession';
import { supabase } from '../utils/supabase';
import { getTotalStockFromVariants, getInventoryState } from '../utils/inventory';

const ShopLayout = () => {
  const { cartItems } = useCartStore();
  const { favoriteItems, toggleFavorite, isFavorite } = useFavoritesStore();
  const { isAuthenticated, role } = useAuthSession();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [navbarProducts, setNavbarProducts] = useState([]);
  const [navbarCategories, setNavbarCategories] = useState([]);
  
  // Fetch products for navbar search
  useEffect(() => {
    let isMounted = true;
    
    const fetchSearchProducts = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          supabase.from('categories').select('id, name, slug').order('name', { ascending: true }),
          supabase.from('products').select('id, slug, name, description, price, discount_price, image_url, is_available, categories(name, slug), product_variants(stock)').eq('is_available', true).order('created_at', { ascending: false })
        ]);
        
        if (!isMounted) return;
        
        if (!categoriesRes.error && categoriesRes.data) {
          setNavbarCategories(categoriesRes.data);
        }
        
        if (!productsRes.error && productsRes.data) {
          const processedProducts = (productsRes.data || []).map((product, index) => {
            const productCategory = Array.isArray(product.categories) ? product.categories[0] : product.categories;
            const totalStock = getTotalStockFromVariants(product.product_variants);
            const effectiveStock = product.is_available ? totalStock : 0;
            const sellingPrice = Number(product.price || 0);
            const originalPrice = Number(product.discount_price || 0);
            const isOnSale = Number.isFinite(originalPrice) && originalPrice > sellingPrice && sellingPrice > 0;
            const saleDiscountPercent = isOnSale ? Math.max(1, Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)) : 0;
            
            return {
              ...product,
              id: product.id || product.slug || `navbar-${index}`,
              price: sellingPrice,
              discount_price: isOnSale ? originalPrice : null,
              category_slug: productCategory?.slug || '',
              category_name: productCategory?.name || 'Uncategorized',
              inventory: getInventoryState(effectiveStock),
              is_on_sale: isOnSale,
              sale_discount_percent: saleDiscountPercent
            };
          });
          setNavbarProducts(processedProducts);
        }
      } catch (error) {
        console.error('Error fetching search products:', error);
      }
    };
    
    fetchSearchProducts();
    return () => { isMounted = false; };
  }, []);
  
  // Compute navbar search results
  const navbarSearchResults = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return [];
    return navbarProducts.slice(0, 6).filter((product) => 
      product.name.toLowerCase().includes(searchLower) ||
      (product.description && product.description.toLowerCase().includes(searchLower))
    );
  }, [navbarProducts, searchQuery]);

  // Compute mobile search results
  const mobileSearchResults = useMemo(() => {
    const searchLower = mobileSearchQuery.toLowerCase().trim();
    if (!searchLower) return [];
    return navbarProducts.slice(0, 8).filter((product) => 
      product.name.toLowerCase().includes(searchLower) ||
      (product.description && product.description.toLowerCase().includes(searchLower))
    );
  }, [navbarProducts, mobileSearchQuery]);
  
  const categoryNameBySlug = useMemo(() => {
    return navbarCategories.reduce((acc, category) => {
      acc[category.slug] = category.name;
      return acc;
    }, {});
  }, [navbarCategories]);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const favoritesCount = favoriteItems.length;
  const isPrivileged = role === 'admin' || role === 'manager';
  const accountTarget = isAuthenticated ? (isPrivileged ? '/admin' : '/profile') : '/login';

  const activeClass = "text-yellow-700 dark:text-yellow-400 border-b-4 border-yellow-400 rounded-full px-1 hover:scale-105 transition-transform font-bold";
  const inactiveClass = "text-stone-600 dark:text-stone-400 font-medium hover:scale-105 hover:text-yellow-600 transition-transform";

  return (
    <div className="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full flex justify-between items-center px-4 sm:px-6 lg:px-8 h-20 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl z-50 shadow-[0_40px_60px_-15px_rgba(109,90,0,0.06)]">
        <div className="flex items-center gap-12">
          <Link to="/" className="inline-flex items-center" aria-label="TurtleTots Home">
            <div className="h-12 sm:h-14 w-[130px] sm:w-[170px] md:w-[190px] rounded-md overflow-hidden">
              <img src="/turtletots.jpeg" alt="TurtleTots" className="w-full h-full object-cover object-top scale-[1.06]" />
            </div>
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link className={location.pathname === '/' ? activeClass : inactiveClass} to="/">Shop All</Link>
            <Link className={location.pathname === '/new-arrivals' ? activeClass : inactiveClass} to="/new-arrivals">New Arrivals</Link>
            <Link className={location.pathname === '/best-sellers' ? activeClass : inactiveClass} to="/best-sellers">Best Sellers</Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
        <div className="hidden lg:flex relative items-center bg-surface-container-low px-4 py-2 rounded-full border-none group">
          <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm w-48 font-medium outline-none" 
            placeholder="Search toys..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchOverlay(true)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 hover:bg-surface-container rounded transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-on-surface-variant">close</span>
            </button>
          )}
          
          {/* Navbar Search Overlay */}
          {showSearchOverlay && (searchQuery || navbarSearchResults.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 z-50 min-w-full max-h-[450px] overflow-y-auto">
              {searchQuery ? (
                navbarSearchResults.length > 0 ? (
                  <div className="divide-y divide-outline-variant/10">
                    {navbarSearchResults.map((product) => {
                      const favoriteKey = product.id || product.slug;
                      const productIsFavorite = isFavorite(favoriteKey);
                      return (
                        <button
                          key={product.slug}
                          onClick={() => {
                            navigate(`/product/${product.slug}`);
                            setShowSearchOverlay(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex gap-3 p-3 hover:bg-surface-container-lowest transition-colors text-left group"
                        >
                          <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-surface-container-high">
                            <img alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" src={product.image_url} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-0.5">{categoryNameBySlug[product.category_slug] || 'Uncategorized'}</p>
                            <h4 className="font-bold text-sm leading-snug line-clamp-2 text-on-surface">{product.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="font-black text-primary text-xs">₹{Number(product.price || 0).toFixed(2)}</p>
                              {product.is_on_sale && (
                                <p className="text-on-surface-variant line-through text-xs">₹{Number(product.discount_price || 0).toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(product);
                            }}
                            className="w-7 h-7 rounded-full bg-error-container/10 text-error hover:scale-110 transition-transform shrink-0 flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: productIsFavorite ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                          </button>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl block mb-2 opacity-50">search_off</span>
                    <p className="font-medium text-sm">No toys found for "{searchQuery}"</p>
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
          <div className="flex items-center gap-4">
            <Link to="/favorites" className="w-10 h-10 relative flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-yellow-700" style={{ fontVariationSettings: favoritesCount > 0 ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-on-error text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {favoritesCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="w-10 h-10 relative flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-yellow-700">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-on-error text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <Link to={accountTarget} className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-sm">
                <span className="material-symbols-outlined">person</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 rounded-full bg-primary-container text-on-primary-container font-bold text-sm shadow-sm hover:scale-105 transition-transform"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-24">
        <Outlet />
      </main>

      {/* BottomNavBar (Mobile only) */}
      <div className="md:hidden fixed bottom-0 w-full h-20 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md flex justify-between items-center px-4 z-50 rounded-t-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {[{
          to: '/',
          icon: 'home',
          label: 'Home'
        },{
          to: '/new-arrivals',
          icon: 'auto_awesome',
          label: 'New'
        },{
          to: '/best-sellers',
          icon: 'workspace_premium',
          label: 'Best'
        }].map((item) => {
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center rounded-full w-14 h-14 transition-all active:scale-90 ${isActive ? 'bg-yellow-400 text-stone-900 shadow-lg -translate-y-4' : 'text-stone-400 dark:text-stone-500'}`}
              aria-label={item.to === '/best-sellers' ? 'Best Sellers' : item.to === '/new-arrivals' ? 'New Arrivals' : 'Home'}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="plusJakartaSans text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Mobile Search Button */}
        <button
          onClick={() => setShowMobileSearch(true)}
          className="flex flex-col items-center justify-center rounded-full w-14 h-14 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-400 transition-colors"
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-xl">search</span>
          <span className="plusJakartaSans text-[10px] font-bold">Search</span>
        </button>
      </div>

      {/* Mobile Search Modal */}
      {showMobileSearch && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/40 z-50" onClick={() => setShowMobileSearch(false)} />
          <div className="md:hidden fixed top-0 left-0 right-0 bottom-20 z-50 bg-white dark:bg-stone-900 flex flex-col">
            {/* Search Header */}
            <div className="flex items-center gap-2 p-4 bg-surface-container-lowest border-b border-outline-variant/10 sticky top-0">
              <button
                onClick={() => setShowMobileSearch(false)}
                className="p-2 text-on-surface-variant"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="flex-1 flex items-center gap-2 bg-surface-container-low rounded-full px-3 py-2">
                <span className="material-symbols-outlined text-on-surface-variant">search</span>
                <input
                  type="text"
                  placeholder="Search toys..."
                  value={mobileSearchQuery}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-medium text-on-surface placeholder-on-surface-variant"
                />
                {mobileSearchQuery && (
                  <button
                    onClick={() => setMobileSearchQuery('')}
                    className="p-1 hover:bg-surface-container rounded transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">close</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Search Results */}
            <div className="flex-1 overflow-y-auto">
              {mobileSearchQuery ? (
                mobileSearchResults.length > 0 ? (
                  <div className="divide-y divide-outline-variant/10">
                    {mobileSearchResults.map((product) => {
                      const favoriteKey = product.id || product.slug;
                      const productIsFavorite = isFavorite(favoriteKey);
                      return (
                        <button
                          key={product.slug}
                          onClick={() => {
                            navigate(`/product/${product.slug}`);
                            setShowMobileSearch(false);
                            setMobileSearchQuery('');
                          }}
                          className="w-full flex gap-3 p-4 hover:bg-surface-container-lowest transition-colors text-left"
                        >
                          <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-surface-container-high">
                            <img alt={product.name} className="w-full h-full object-cover" src={product.image_url} />
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
                              e.stopPropagation();
                              toggleFavorite(product);
                            }}
                            className="w-8 h-8 rounded-full bg-error-container/10 text-error hover:scale-110 transition-transform shrink-0 flex items-center justify-center mt-1"
                          >
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: productIsFavorite ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                          </button>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-on-surface-variant mt-12">
                    <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">search_off</span>
                    <p className="font-medium">No toys found for "{mobileSearchQuery}"</p>
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-on-surface-variant mt-12">
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">search</span>
                  <p className="font-medium">Start typing to search...</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShopLayout;
