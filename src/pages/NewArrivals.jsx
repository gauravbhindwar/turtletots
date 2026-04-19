import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Link } from 'react-router-dom';
import { getInventoryState, getTotalStockFromVariants } from '../utils/inventory';

const REQUEST_TIMEOUT_MS = 12000;

const NewArrivals = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const fetchProducts = async () => {
            setError('');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

            try {
                const { data, error: fetchError } = await supabase
                    .from('products')
                    .select('id, slug, name, description, price, discount_price, image_url, is_available, product_variants(stock)')
                    .eq('is_available', true)
                    .contains('tags', ['new_arrival'])
                    .order('created_at', { ascending: false })
                    .limit(8)
                    .abortSignal(controller.signal);

                if (!isMounted) {
                    return;
                }

                if (fetchError) {
                    setError(fetchError.message || 'Unable to load new arrivals right now.');
                    setProducts([]);
                    return;
                }

                const rows = (data || []).map((product, index) => ({
                    ...product,
                    id: product.id || product.slug || `new-${index}`,
                    inventory: getInventoryState(product.is_available ? getTotalStockFromVariants(product.product_variants) : 0)
                }));

                setProducts(rows);
            } catch (fetchError) {
                if (!isMounted) {
                    return;
                }

                const isTimeout = fetchError?.name === 'AbortError';
                setError(isTimeout
                    ? 'New arrivals request timed out.'
                    : 'Unable to load new arrivals right now.');
                setProducts([]);
            } finally {
                clearTimeout(timeoutId);
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchProducts();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <main className="max-w-screen-2xl mx-auto px-8 pt-12 min-h-screen">
            {/* Hero Section */}
            <div className="relative isolate overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] mb-12 sm:mb-16 border border-[#8f7600]/20 bg-[linear-gradient(135deg,#8b7300_0%,#9d8200_40%,#735d00_100%)] shadow-[0_30px_80px_-28px_rgba(120,95,0,0.55)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#fff6bf_0%,transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_40%)] opacity-90"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.08]"></div>
                <div className="absolute -left-16 top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -right-16 bottom-4 h-52 w-52 rounded-full bg-[#f8df77]/20 blur-3xl"></div>

                <div className="relative grid gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end lg:px-12 lg:py-14">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white text-primary px-4 py-2 text-[11px] sm:text-xs font-black uppercase tracking-[0.24em] shadow-lg shadow-black/10">
                            <span className="material-symbols-outlined text-base">kid_star</span>
                            Just Dropped
                        </div>

                        <h1 className="plusJakartaSans mt-5 text-[2.5rem] leading-[0.92] sm:text-6xl lg:text-[5.2rem] font-black tracking-[-0.05em] text-white max-w-4xl">
                            Fresh Out
                            <span className="block text-[#fff8d4]">The Workshop</span>
                        </h1>

                        <p className="mt-5 max-w-2xl text-sm sm:text-lg lg:text-xl leading-relaxed font-medium text-[#fff6d8]/92">
                            Meet the latest playroom arrivals, crafted to spark imagination, invite storytelling, and make everyday play feel brand new.
                        </p>

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <a
                                href="#latest-arrivals"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm sm:text-base font-extrabold text-primary shadow-xl shadow-black/10 transition-transform hover:scale-[1.02]"
                            >
                                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                                Shop Newest Arrivals
                            </a>
                            <div className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs sm:text-sm font-semibold text-white/90 backdrop-blur-sm">
                                Small-batch picks refreshed regularly
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:max-w-md lg:justify-self-end">
                        {[
                            { value: '08', label: 'Fresh finds in this edit' },
                            { value: 'New', label: 'Shapes, stories, and textures' },
                            { value: 'Soft', label: 'Warm finishes for calm corners' },
                            { value: 'Gift', label: 'Ready for thoughtful surprises' }
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="rounded-[1.6rem] border border-white/15 bg-white/10 px-4 py-4 sm:px-5 sm:py-5 backdrop-blur-md"
                            >
                                <p className="text-lg sm:text-2xl font-black text-white tracking-tight">{item.value}</p>
                                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-white/80">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
                <div>
                    <h2 className="text-4xl font-black plusJakartaSans tracking-tight mb-2">The Latest Additions</h2>
                    <p className="text-on-surface-variant">Discover what's new in the toybox this week</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">Loading New Arrivals...</div>
            ) : (
                <>
                    {error && (
                        <div className="text-center py-4 mb-6 text-error font-semibold bg-error-container/15 rounded-xl">
                            {error}
                        </div>
                    )}

                    {products.length === 0 ? (
                        <div className="text-center py-20 text-on-surface-variant font-semibold">No products tagged as New Arrival right now.</div>
                    ) : (
                        <div id="latest-arrivals" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                            {products.map(product => (
                                <div key={product.id} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-[0_40px_40px_rgba(109,90,0,0.06)] transition-all group border border-outline-variant/5">
                                    <Link to={`/product/${product.slug}`} className="block">
                                        <div className="relative bg-surface-container-high rounded-lg aspect-square mb-6 overflow-hidden">
                                            <div className="absolute top-3 left-3 bg-secondary text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase z-10 shadow-sm animate-pulse">New!</div>
                                            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={product.image_url || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1'} alt={product.name} />
                                        </div>
                                        <h3 className="text-lg font-bold mb-1 leading-tight text-on-surface group-hover:text-primary transition-colors">{product.name}</h3>
                                        <p className="text-xs text-on-surface-variant mb-4 line-clamp-1">{product.description}</p>
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="text-xl font-black">₹{Number(product.price || 0).toLocaleString('en-IN')}</span>
                                                <span className={`text-[10px] ${product.inventory.textClass}`}>{product.inventory.shortLabel}</span>
                                            </div>
                                            <button className="bg-primary-container text-on-primary-container px-4 py-2 rounded-full text-xs font-bold hover:bg-primary transition-colors hover:text-on-primary">View</button>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </main>
    );
};

export default NewArrivals;
