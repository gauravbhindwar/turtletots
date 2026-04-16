import React, { useState } from 'react';
import useCartStore from '../store/cartStore';
import seedData from '../../assets.json';

const Home = () => {
  const addToCart = useCartStore(state => state.addToCart);
  // Optional: In a real app we'd fetch these from our useProducts hook.
  // Using seedData here for exact Stitch UI replication for now.
  const { products, categories, hero_image } = seedData;

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
                {categories.map((cat, i) => (
                  <label key={cat.slug} className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-primary-container/10 transition-colors group">
                    <input className="rounded-md border-outline-variant text-primary focus:ring-primary" type="checkbox" defaultChecked={i === 1} />
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
                <input className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary" type="range" />
                <div className="flex justify-between mt-3 text-xs font-bold text-on-surface-variant">
                  <span>₹0</span>
                  <span>₹10,000+</span>
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
              <p className="text-on-surface-variant font-medium mt-1">Showing {products.length} items</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-white shadow-sm"><span className="material-symbols-outlined">grid_view</span></button>
              <button className="p-2 rounded-lg text-on-surface-variant"><span className="material-symbols-outlined">view_list</span></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.slug} className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_60px_-15px_rgba(109,90,0,0.08)] transition-all group">
                <div className="relative rounded-xl overflow-hidden bg-surface-container-high h-72 mb-6 cursor-pointer">
                  <img alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={product.image_url} />
                  {product.discount_price && (
                    <span className="absolute top-4 left-4 bg-error text-on-error px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Sale</span>
                  )}
                  <button className="absolute top-4 right-4 bg-white/80 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center text-error hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                  </button>
                </div>
                <div>
                  <h3 className="plusJakartaSans font-extrabold text-xl mb-2">{product.name}</h3>
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
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
