import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ShopLayout from './layouts/ShopLayout';
import AdminLayout from './layouts/AdminLayout';
import { RequireAuth, RequireRole } from './components/RoleGuards';
import Home from './pages/Home';
import Cart from './pages/Cart';
import ProductDetails from './pages/ProductDetails';
import BestSellers from './pages/BestSellers';
import NewArrivals from './pages/NewArrivals';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Favorites from './pages/Favorites';

import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import EditProduct from './pages/admin/EditProduct';
import Categories from './pages/admin/Categories';
import Login from './pages/admin/Login';
import Orders from './pages/admin/Orders';
import Support from './pages/admin/Support';
import Settings from './pages/admin/Settings';
import AiAssistant from './pages/admin/AiAssistant';
import Users from './pages/admin/Users';
import { ToastProvider } from './components/ToastProvider';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ShopLayout />}>
            <Route index element={<Home />} />
            <Route path="cart" element={<Cart />} />
            <Route path="product/:slug" element={<ProductDetails />} />
            <Route path="best-sellers" element={<BestSellers />} />
            <Route path="new-arrivals" element={<NewArrivals />} />
            <Route path="favorites" element={<Favorites />} />
            <Route
              path="profile"
              element={(
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              )}
            />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/404" element={<NotFound />} />

          <Route
            path="/admin"
            element={(
              <RequireRole allowedRoles={['admin', 'manager']} redirectTo="/404">
                <AdminLayout />
              </RequireRole>
            )}
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Products />} />
            <Route path="product/:id" element={<EditProduct />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<Orders />} />
            <Route path="support" element={<Support />} />
            <Route path="settings" element={<Settings />} />
            <Route path="ai" element={<AiAssistant />} />
            <Route
              path="users"
              element={(
                <RequireRole allowedRoles={['admin']} redirectTo="/404">
                  <Users />
                </RequireRole>
              )}
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
