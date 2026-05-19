// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Main from './Main/Main';     
import Login from './Login/Login';   
import Signup from './Signup/Signup'; 
import AdminRoute from './Login/AdminRoute'; 
import AdminMain from './Admin/AdminMain';
import ProductDetail from './ProductDetail/ProductDetail';
import Cart from './ProductDetail/Cart';
import MyPage from './ProductDetail/MyPage';
import Checkout from './ProductDetail/Checkout';
import GuestOrderLookup from './ProductDetail/GuestOrderLookup';
import PaymentComplete from './ProductDetail/PaymentComplete';

import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/guest-lookup" element={<GuestOrderLookup />} />
        <Route path="/payment-complete" element={<PaymentComplete />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminMain />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;