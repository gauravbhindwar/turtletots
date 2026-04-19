import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

const PAGE_SIZE = 30;
const QUERY_LIMIT = 200;
const REQUEST_TIMEOUT_MS = 12000;
const SEARCH_DEBOUNCE_MS = 300;
const TAG_LABELS = {
  best_seller: 'Best Seller',
  new_arrival: 'New Arrival'
};

const getProductStock = (product) => {
  if (!Array.isArray(product?.product_variants)) {
    return 0;
  }

  return product.product_variants.reduce((sum, variant) => sum + Math.max(0, Number(variant?.stock || 0)), 0);
};

const getProductStatusMeta = (product) => {
  if (!product?.is_available) {
    return {
      key: 'not_for_sale',
      label: 'Not for Sale',
      dotClass: 'bg-outline',
      textClass: 'text-outline'
    };
  }

  const totalStock = getProductStock(product);

  if (totalStock <= 0) {
    return {
      key: 'out_of_stock',
      label: 'Out of Stock',
      dotClass: 'bg-error animate-pulse',
      textClass: 'text-error'
    };
  }

  return {
    key: 'in_stock',
    label: 'Available',
    dotClass: 'bg-success',
    textClass: 'text-[#128C7E]'
  };
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [highlightFilter, setHighlightFilter] = useState('all');
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    const debounceId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(debounceId);
  }, [searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, debouncedSearchTerm, statusFilter, categoryFilter, highlightFilter]);

  const fetchCategories = async () => {
    const { data, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true });

    if (categoriesError) {
      return;
    }

    setCategories(data || []);
  };

  const fetchProducts = async (page = 0) => {
    setLoading(true);
    setError('');

    const pageStart = page * PAGE_SIZE;
    const pageEnd = pageStart + PAGE_SIZE;

    const controller = new AbortController();
    const abortTimeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const timeoutError = new Error('REQUEST_TIMEOUT');

    try {
      let queryPromise = supabase
        .from('products')
        .select('id, name, slug, price, discount_price, image_url, is_available, category_id, created_at, tags, categories(name), product_variants(stock)')
        .order('created_at', { ascending: false })
        .limit(QUERY_LIMIT)
        .abortSignal(controller.signal);

      if (debouncedSearchTerm) {
        // Escape PostgREST LIKE special chars so a search for "50%" finds "50%" literally.
        const escapedSearch = debouncedSearchTerm.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
        queryPromise = queryPromise.or(`name.ilike.%${escapedSearch}%,slug.ilike.%${escapedSearch}%`);
      }

      if (categoryFilter !== 'all') {
        queryPromise = queryPromise.eq('category_id', categoryFilter);
      }

      if (highlightFilter === 'sale') {
        queryPromise = queryPromise.not('discount_price', 'is', null);
      }

      if (highlightFilter === 'best_seller') {
        queryPromise = queryPromise.contains('tags', ['best_seller']);
      }

      if (highlightFilter === 'new_arrival') {
        queryPromise = queryPromise.contains('tags', ['new_arrival']);
      }

      if (statusFilter === 'not_for_sale') {
        queryPromise = queryPromise.eq('is_available', false);
      }

      if (statusFilter === 'in_stock' || statusFilter === 'out_of_stock') {
        queryPromise = queryPromise.eq('is_available', true);
      }

      const hardTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(timeoutError), REQUEST_TIMEOUT_MS + 1000);
      });

      const { data, error: fetchError } = await Promise.race([queryPromise, hardTimeoutPromise]);

      if (fetchError) {
        setProducts([]);
        setHasNextPage(false);
        setError(fetchError.message || 'Unable to load products right now.');
        return;
      }

      const rows = data || [];
      const statusFilteredRows = rows.filter((product) => {
        const stock = getProductStock(product);

        if (statusFilter === 'in_stock') {
          return stock > 0;
        }

        if (statusFilter === 'out_of_stock') {
          return stock <= 0;
        }

        return true;
      });

      setTotalResults(statusFilteredRows.length);
      setHasNextPage(statusFilteredRows.length > pageEnd);
      setProducts(statusFilteredRows.slice(pageStart, pageEnd));
    } catch (fetchError) {
      const isTimeout = fetchError?.name === 'AbortError' || fetchError?.message === 'REQUEST_TIMEOUT';
      setProducts([]);
      setTotalResults(0);
      setHasNextPage(false);
      setError(isTimeout ? 'Products request timed out.' : 'Unable to load products right now.');
    } finally {
      clearTimeout(abortTimeoutId);
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if(window.confirm('Are you sure you want to delete this product?')) {
      const { error: deleteError } = await supabase.from('products').delete().eq('id', id);

      if (deleteError) {
        setError(deleteError.message || 'Unable to delete product.');
        return;
      }

      fetchProducts(currentPage);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setCurrentPage(0);
  };

  const handleCategoryFilterChange = (event) => {
    setCategoryFilter(event.target.value);
    setCurrentPage(0);
  };

  const handleHighlightFilterChange = (event) => {
    setHighlightFilter(event.target.value);
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setHighlightFilter('all');
    setCurrentPage(0);
  };

  const canGoPrev = currentPage > 0;
  const canGoNext = hasNextPage;

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-on-surface font-headline">Manage Products</h2>
          <p className="text-on-surface-variant font-medium">Configure and update your curated toy collection.</p>
        </div>
        <Link to="/admin/product/new" className="self-start md:self-auto bg-primary-container text-on-primary-container px-6 md:px-8 py-3 md:py-4 rounded-full font-bold flex items-center gap-2 shadow-sm hover:scale-105 transition-transform active:scale-95">
          <span className="material-symbols-outlined">add_circle</span>
          Add Product
        </Link>
      </header>

      <section className="mb-6 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-4 md:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="sm:col-span-2 xl:col-span-2 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by product name or slug"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
              type="text"
            />
          </div>

          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="not_for_sale">Not for Sale</option>
          </select>

          <select
            value={categoryFilter}
            onChange={handleCategoryFilterChange}
            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>

          <div className="flex gap-3">
            <select
              value={highlightFilter}
              onChange={handleHighlightFilterChange}
              className="flex-1 px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Highlights</option>
              <option value="sale">On Sale</option>
              <option value="best_seller">Best Seller</option>
              <option value="new_arrival">New Arrival</option>
            </select>
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs font-black uppercase tracking-wider text-on-surface-variant"
            >
              Reset
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs font-semibold text-on-surface-variant">
          {loading ? 'Loading products...' : `${totalResults} result${totalResults === 1 ? '' : 's'} found`}
        </p>
      </section>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
        {error && (
          <div className="mx-4 md:mx-8 mt-6 rounded-xl border border-error/30 bg-error-container/10 px-4 py-3 text-sm font-semibold text-error">
            {error}
          </div>
        )}

        <div className="hidden xl:block overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Image</th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Product Name</th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Price</th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Category</th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Highlights</th>
              <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {loading ? (
              <tr><td colSpan="7" className="p-8 text-center text-on-surface-variant">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-on-surface-variant">No products found.</td></tr>
            ) : products.map((product) => {
              const statusMeta = getProductStatusMeta(product);

              return (
              <tr key={product.id} className="hover:bg-surface-container-low/30 transition-colors group">
                <td className="px-8 py-4">
                  <div className="w-16 h-16 rounded-xl bg-surface-container-high overflow-hidden shrink-0">
                    {product.image_url ? (
                      <img className="w-full h-full object-cover" src={product.image_url} alt={product.name} />
                    ) : (
                      <div className="w-full h-full bg-surface-variant flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline">image</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-on-surface plusJakartaSans text-lg">{product.name}</p>
                  <p className="text-xs text-on-surface-variant">SLUG: {product.slug}</p>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-black text-on-surface">₹{Number(product.price || 0).toFixed(2)}</p>
                    {Number(product.discount_price || 0) > Number(product.price || 0) && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-on-surface-variant line-through">₹{Number(product.discount_price || 0).toFixed(2)}</p>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-error">
                          {Math.max(1, Math.round(((Number(product.discount_price || 0) - Number(product.price || 0)) / Number(product.discount_price || 0)) * 100))}% Off
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 bg-secondary-container/30 text-on-secondary-container text-xs font-bold rounded-full whitespace-nowrap">
                    {product.categories?.name || 'Uncategorized'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className={`w-2 h-2 rounded-full ${statusMeta.dotClass}`}></span>
                    <span className={`text-sm font-semibold whitespace-nowrap ${statusMeta.textClass}`}>{statusMeta.label}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {(Array.isArray(product.tags) && product.tags.length > 0) || Number(product.discount_price || 0) > Number(product.price || 0) ? (
                    <div className="flex flex-wrap gap-2">
                      {Number(product.discount_price || 0) > Number(product.price || 0) && (
                        <span className="px-2.5 py-1 rounded-full bg-error-container/30 text-error text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                          Sale
                        </span>
                      )}
                      {product.tags.map((tag) => (
                        <span key={`${product.id}-${tag}`} className="px-2.5 py-1 rounded-full bg-primary-container/30 text-on-primary-container text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                          {TAG_LABELS[tag] || tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-on-surface-variant font-medium">None</span>
                  )}
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <Link to={`/admin/product/${product.id}`} className="p-2 hover:bg-primary-container/20 rounded-lg text-primary transition-colors inline-block">
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </Link>
                    <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-error-container/10 rounded-lg text-error transition-colors">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        <div className="xl:hidden divide-y divide-surface-container">
          {loading ? (
            <div className="p-6 text-center text-on-surface-variant">Loading...</div>
          ) : products.length === 0 ? (
            <div className="p-6 text-center text-on-surface-variant">No products found.</div>
          ) : products.map((product) => {
            const statusMeta = getProductStatusMeta(product);

            return (
              <article key={product.id} className="p-4 sm:p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-xl bg-surface-container-high overflow-hidden shrink-0">
                    {product.image_url ? (
                      <img className="w-full h-full object-cover" src={product.image_url} alt={product.name} />
                    ) : (
                      <div className="w-full h-full bg-surface-variant flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline">image</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface plusJakartaSans text-lg leading-tight">{product.name}</p>
                    <p className="text-xs text-on-surface-variant break-all">SLUG: {product.slug}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Price</p>
                    <p className="font-black text-on-surface">₹{Number(product.price || 0).toFixed(2)}</p>
                    {Number(product.discount_price || 0) > Number(product.price || 0) && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-on-surface-variant line-through">₹{Number(product.discount_price || 0).toFixed(2)}</p>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-error">
                          {Math.max(1, Math.round(((Number(product.discount_price || 0) - Number(product.price || 0)) / Number(product.discount_price || 0)) * 100))}% Off
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusMeta.dotClass}`}></span>
                      <span className={`text-sm font-semibold ${statusMeta.textClass}`}>{statusMeta.label}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 bg-secondary-container/30 text-on-secondary-container text-xs font-bold rounded-full whitespace-nowrap">
                    {product.categories?.name || 'Uncategorized'}
                  </span>

                  {Number(product.discount_price || 0) > Number(product.price || 0) && (
                    <span className="px-2.5 py-1 rounded-full bg-error-container/30 text-error text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                      Sale
                    </span>
                  )}

                  {Array.isArray(product.tags) && product.tags.map((tag) => (
                    <span key={`${product.id}-${tag}`} className="px-2.5 py-1 rounded-full bg-primary-container/30 text-on-primary-container text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                      {TAG_LABELS[tag] || tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Link to={`/admin/product/${product.id}`} className="p-2 hover:bg-primary-container/20 rounded-lg text-primary transition-colors inline-block">
                    <span className="material-symbols-outlined text-xl">edit</span>
                  </Link>
                  <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-error-container/10 rounded-lg text-error transition-colors">
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 md:px-8 py-5 border-t border-surface-container bg-surface-container-low/20">
          <p className="text-xs font-semibold text-on-surface-variant">
            Page {currentPage + 1} • {totalResults} result{totalResults === 1 ? '' : 's'}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
              disabled={!canGoPrev}
              className="px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant text-sm font-bold disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={!canGoNext}
              className="px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant text-sm font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Products;
