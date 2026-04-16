import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Link } from 'react-router-dom';

const NewArrivals = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            // Fetch newest products based on created_at descending
            // If created_at is not there, we just fetch normally
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_available', true)
                .order('created_at', { ascending: false })
                .limit(8);

            if (!error && data) {
                setProducts(data);
            }
            setLoading(false);
        };
        fetchProducts();
    }, []);

    return (
        <main className="max-w-screen-2xl mx-auto px-8 pt-12 min-h-screen">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-primary px-12 py-20 rounded-3xl mb-16 flex flex-col items-center justify-center text-center shadow-lg shadow-primary/10 group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                    <div className="inline-block bg-white text-primary px-6 py-2 rounded-full text-sm font-black mb-6 shadow-md uppercase tracking-widest animate-bounce">Just Dropped</div>
                    <h1 className="text-5xl md:text-7xl font-black text-white plusJakartaSans tracking-tighter leading-none mb-6">
                        Fresh Out <br/>The Workshop
                    </h1>
                    <p className="text-xl text-primary-100 max-w-2xl mx-auto mb-8 font-medium">
                        Be the first to explore our newest collection of meticulously crafted, imagination-sparking toys.
                    </p>
                    <button className="bg-surface-container-lowest text-primary px-10 py-4 rounded-full text-lg font-extrabold shadow-xl hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
                        <span className="material-symbols-outlined">auto_awesome</span>
                        Shop Newest Arrivals
                    </button>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
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
                                        <span className="text-xl font-black">₹{product.price.toLocaleString('en-IN')}</span>
                                    </div>
                                    <button className="bg-primary-container text-on-primary-container px-4 py-2 rounded-full text-xs font-bold hover:bg-primary transition-colors hover:text-on-primary">View</button>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
};

export default NewArrivals;
