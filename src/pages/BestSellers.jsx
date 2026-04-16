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
            <div className="relative overflow-hidden bg-secondary-container rounded-3xl p-12 mb-16 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 z-10">
                    <div className="inline-block bg-tertiary text-on-tertiary px-4 py-1 rounded-full text-sm font-bold mb-6">Trending Now</div>
                    <h1 className="text-5xl md:text-7xl font-black text-on-secondary-container plusJakartaSans tracking-tighter leading-none mb-6">
                        Our All-Time <br/><span className="text-primary">Best Sellers</span>
                    </h1>
                    <p className="text-lg text-on-secondary-container/80 max-w-md mb-8 font-medium">
                        Discover the toys that have captured hearts across the globe. Expertly curated for maximum play value and durability.
                    </p>
                    <button className="bg-primary-container text-on-primary-container px-10 py-4 rounded-full text-lg font-extrabold shadow-lg hover:scale-105 transition-transform">
                        Explore Trends
                    </button>
                </div>
                <div className="flex-1 relative">
                    <img className="rounded-xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 w-full object-cover aspect-video md:aspect-square" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBR_kIVdH6GJPcmzQWfcCcd1uEqpzeA7-ZgLbXDwEanlQTmmh9UGjwcF-Y3u9iOX_7C0Nu8rgOrBtPPYlhAOIlw8laZ4IrrnjC31WOZHkgmpsi5Zj-oCwFqWAl4Z4XAMD-_FoiSDKt2DA3HeBW9sBEu2D4wSXK6fPb7erPpN740CUs1gtvbLJo1Rv-oRLfgExt5jn3B79GHMW6d5V5uMqB8pQwif6AYKmSYaeXeut_YszjfAo8zQ2_buF6MpCvwHn_5YOVyP-hhQ1hp" alt="Best Seller display" />
                    <div className="absolute -top-6 -left-6 bg-primary-container w-24 h-24 rounded-full flex items-center justify-center border-8 border-white shadow-xl animate-bounce">
                        <span className="material-symbols-outlined text-4xl text-on-primary-container" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
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
