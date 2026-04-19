import React, { lazy, Suspense } from 'react';
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

// Admin pages are lazy-loaded so a parse error in one file cannot break the
// entire bundle, and so they only mount (and fire their data-fetch effects)
// when the user actually navigates to that route.
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Products = lazy(() => import('./pages/admin/Products'));
const EditProduct = lazy(() => import('./pages/admin/EditProduct'));
const Categories = lazy(() => import('./pages/admin/Categories'));
const Login = lazy(() => import('./pages/admin/Login'));
const Orders = lazy(() => import('./pages/admin/Orders'));
const Support = lazy(() => import('./pages/admin/Support'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const AiAssistant = lazy(() => import('./pages/admin/AiAssistant'));
const Users = lazy(() => import('./pages/admin/Users'));
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

          <Route path="/login" element={<Suspense fallback={null}><Login /></Suspense>} />
          <Route path="/admin/login" element={<Suspense fallback={null}><Login /></Suspense>} />
          <Route path="/404" element={<NotFound />} />

          <Route
            path="/admin"
            element={(
              <RequireRole allowedRoles={['admin', 'manager']} redirectTo="/404">
                <AdminLayout />
              </RequireRole>
            )}
          >
            <Route index element={<Suspense fallback={null}><Dashboard /></Suspense>} />
            <Route path="products" element={<Suspense fallback={null}><Products /></Suspense>} />
            <Route path="inventory" element={<Suspense fallback={null}><Products /></Suspense>} />
            <Route path="product/:id" element={<Suspense fallback={null}><EditProduct /></Suspense>} />
            <Route path="categories" element={<Suspense fallback={null}><Categories /></Suspense>} />
            <Route path="orders" element={<Suspense fallback={null}><Orders /></Suspense>} />
            <Route path="support" element={<Suspense fallback={null}><Support /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={null}><Settings /></Suspense>} />
            <Route path="ai" element={<Suspense fallback={null}><AiAssistant /></Suspense>} />
            <Route
              path="users"
              element={(
                <RequireRole allowedRoles={['admin']} redirectTo="/404">
                  <Suspense fallback={null}><Users /></Suspense>
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
