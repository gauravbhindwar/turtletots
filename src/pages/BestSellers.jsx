import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Link } from 'react-router-dom';
import { getInventoryState, getTotalStockFromVariants } from '../utils/inventory';

const REQUEST_TIMEOUT_MS = 12000;

const BestSellers = () => {
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
                    .select('id, slug, name, description, price, image_url, is_available, product_variants(stock)')
                    .eq('is_available', true)
                    .contains('tags', ['best_seller'])
                    .order('views_count', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(8)
                    .abortSignal(controller.signal);

                if (!isMounted) {
                    return;
                }

                if (fetchError) {
                    setError(fetchError.message || 'Unable to load best sellers right now.');
                    setProducts([]);
                    return;
                }

                const rows = (data || []).map((product, index) => ({
                    ...product,
                    id: product.id || product.slug || `best-${index}`,
                    inventory: getInventoryState(product.is_available ? getTotalStockFromVariants(product.product_variants) : 0)
                }));

                setProducts(rows);
            } catch (fetchError) {
                if (!isMounted) {
                    return;
                }

                const isTimeout = fetchError?.name === 'AbortError';
                setError(isTimeout
                    ? 'Best sellers request timed out.'
                    : 'Unable to load best sellers right now.');
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
            <div className="relative isolate overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] mb-12 sm:mb-16 border border-[#93aff6]/35 bg-[linear-gradient(135deg,#d8e5ff_0%,#c3d5ff_45%,#a9c0f7_100%)] shadow-[0_28px_80px_-30px_rgba(52,90,186,0.35)]">
                <div className="absolute inset-y-0 right-0 hidden lg:block w-[48%] bg-[radial-gradient(circle_at_40%_25%,rgba(255,220,120,0.28),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0))]"></div>
                <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/30 blur-3xl"></div>
                <div className="absolute right-10 top-10 h-28 w-28 rounded-full border border-white/35 bg-white/20 blur-2xl"></div>

                <div className="relative grid gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.95fr)] lg:items-center lg:px-12 lg:py-12">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#b45b00] px-4 py-2 text-[11px] sm:text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-[#b45b00]/20">
                            <span className="material-symbols-outlined text-base">whatshot</span>
                            Trending Now
                        </div>

                        <h1 className="plusJakartaSans mt-5 text-[2.4rem] sm:text-6xl lg:text-[5rem] leading-[0.92] tracking-[-0.05em] font-black text-[#0c4ea3]">
                            Our All-Time
                            <span className="block text-[#8b6e00]">Best Sellers</span>
                        </h1>

                        <p className="mt-5 max-w-xl text-sm sm:text-lg leading-relaxed font-medium text-[#23579f]">
                            Discover the toys families return to again and again. These favorites earn their place through lasting quality, open-ended play, and timeless appeal.
                        </p>

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <a
                                href="#best-sellers-grid"
                                className="inline-flex items-center justify-center rounded-full bg-[#ffd437] px-6 py-3.5 text-sm sm:text-base font-extrabold text-[#5b4b00] shadow-xl shadow-[#d6b316]/30 transition-transform hover:scale-[1.02]"
                            >
                                Explore Trends
                            </a>
                            <div className="inline-flex items-center justify-center rounded-full border border-[#7ba0f4]/35 bg-white/55 px-5 py-3 text-xs sm:text-sm font-semibold text-[#23579f] backdrop-blur-sm">
                                Loved by playrooms, classrooms, and gifting shelves
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute left-1/2 top-0 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[6px] border-white bg-[#ffcf37] shadow-[0_14px_35px_rgba(0,0,0,0.12)] sm:h-20 sm:w-20">
                            <span className="material-symbols-outlined text-2xl sm:text-3xl text-[#5f4b00]" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        </div>

                        <div className="grid gap-4 sm:gap-5 md:grid-cols-[minmax(0,1fr)_160px]">
                            <div className="overflow-hidden rounded-[2rem] bg-[#7f5605] shadow-[0_24px_60px_-30px_rgba(73,45,0,0.55)]">
                                <img className="h-full w-full object-cover aspect-[4/3] md:aspect-[1.05/1]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBR_kIVdH6GJPcmzQWfcCcd1uEqpzeA7-ZgLbXDwEanlQTmmh9UGjwcF-Y3u9iOX_7C0Nu8rgOrBtPPYlhAOIlw8laZ4IrrnjC31WOZHkgmpsi5Zj-oCwFqWAl4Z4XAMD-_FoiSDKt2DA3HeBW9sBEu2D4wSXK6fPb7erPpN740CUs1gtvbLJo1Rv-oRLfgExt5jn3B79GHMW6d5V5uMqB8pQwif6AYKmSYaeXeut_YszjfAo8zQ2_buF6MpCvwHn_5YOVyP-hhQ1hp" alt="Best Seller display" />
                            </div>

                            <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
                                {[
                                    { value: 'Top', label: 'ranked' },
                                    { value: 'Play', label: 'tested' },
                                    { value: 'Gift', label: 'ready' }
                                ].map((item) => (
                                    <div key={item.label} className="rounded-[1.5rem] border border-white/45 bg-white/55 px-3 py-4 text-center backdrop-blur-sm">
                                        <p className="text-base sm:text-xl font-black text-[#0c4ea3]">{item.value}</p>
                                        <p className="mt-1 text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#6a7fb2]">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
                <div>
                    <h2 className="text-4xl font-black plusJakartaSans tracking-tight mb-2">Explore the Collection</h2>
                    <p className="text-on-surface-variant">Filter through award-winning toys</p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 w-full md:w-auto">
                    <button className="bg-secondary text-on-secondary px-6 py-2 rounded-full font-bold whitespace-nowrap">All Best Sellers</button>
                    <button className="bg-surface-variant text-on-surface-variant px-6 py-2 rounded-full font-bold whitespace-nowrap hover:bg-surface-container-high transition-colors">Ages 0-3</button>
                    <button className="bg-surface-variant text-on-surface-variant px-6 py-2 rounded-full font-bold whitespace-nowrap hover:bg-surface-container-high transition-colors">Creative Play</button>
                </div>
            </div>

            {/* Product Grid */}
            {loading ? (
                <div className="text-center py-20">Loading Best Sellers...</div>
            ) : (
                <>
                    {error && (
                        <div className="text-center py-4 mb-6 text-error font-semibold bg-error-container/15 rounded-xl">
                            {error}
                        </div>
                    )}

                    {products.length === 0 ? (
                        <div className="text-center py-20 text-on-surface-variant font-semibold">No products tagged as Best Seller right now.</div>
                    ) : (
                        <div id="best-sellers-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                            {products.map(product => (
                                <div key={product.id} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-[0_40px_40px_rgba(109,90,0,0.06)] transition-all group">
                                    <Link to={`/product/${product.slug}`} className="block">
                                        <div className="relative bg-surface-container-high rounded-lg aspect-square mb-6 overflow-hidden">
                                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase text-tertiary z-10 shadow-sm">Best Seller</div>
                                            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={product.image_url || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1'} alt={product.name} />
                                        </div>
                                        <h3 className="text-lg font-bold mb-1 leading-tight text-on-surface group-hover:text-primary transition-colors">{product.name}</h3>
                                        <p className="text-xs text-on-surface-variant mb-4 line-clamp-1">{product.description}</p>
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="text-xl font-black">₹{Number(product.price || 0).toLocaleString('en-IN')}</span>
                                                <span className={`text-[10px] ${product.inventory.textClass}`}>{product.inventory.shortLabel}</span>
                                            </div>
                                            <button className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full text-xs font-bold hover:bg-secondary transition-colors hover:text-on-secondary">View</button>
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

export default BestSellers;
