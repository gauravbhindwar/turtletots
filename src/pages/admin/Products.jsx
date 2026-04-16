import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)');
    
    if (data) setProducts(data);
    setLoading(false);
  };

  const deleteProduct = async (id) => {
    if(window.confirm('Are you sure you want to delete this product?')) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  };

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tighter text-on-surface font-headline">Manage Products</h2>
          <p className="text-on-surface-variant font-medium">Configure and update your curated toy collection.</p>
        </div>
        <Link to="/admin/product/new" className="bg-primary-container text-on-primary-container px-8 py-4 rounded-full font-bold flex items-center gap-2 shadow-sm hover:scale-105 transition-transform active:scale-95">
          <span className="material-symbols-outlined">add_circle</span>
          Add Product
        </Link>
      </header>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Image</th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Product Name</th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Price</th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Category</th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
              <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-on-surface-variant">Loading...</td></tr>
            ) : products.map(product => (
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
                  <p className="font-black text-on-surface">₹{product.price.toFixed(2)}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-secondary-container/30 text-on-secondary-container text-xs font-bold rounded-full">
                    {product.categories?.name || 'Uncategorized'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${product.is_available ? 'bg-success' : 'bg-error'}`}></span>
                    <span className={`text-sm font-medium ${product.is_available ? 'text-on-surface' : 'text-error'}`}>
                      {product.is_available ? 'Available' : 'Out of Stock'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/admin/product/${product.id}`} className="p-2 hover:bg-primary-container/20 rounded-lg text-primary transition-colors inline-block">
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </Link>
                    <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-error-container/10 rounded-lg text-error transition-colors">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Products;
