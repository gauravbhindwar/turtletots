import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ShopLayout from './layouts/ShopLayout';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ShopLayout />}>
          <Route index element={<Home />} />
          <Route path="cart" element={<Cart />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
