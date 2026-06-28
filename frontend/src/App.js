import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './api';

import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';

function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav style={{
      display: 'flex',
      gap: 16,
      padding: 16,
      borderBottom: '1px solid #ddd',
      alignItems: 'center',
    }}>
      <Link to="/" style={{ fontWeight: 'bold' }}>🏔️ PeakAndPack</Link>
      <Link to="/">Products</Link>
      <Link to="/cart">Cart</Link>
      <Link to="/orders">Orders</Link>
      <div style={{ marginLeft: 'auto' }}>
        {user ? (
          <>
            <span style={{ marginRight: 12 }}>Hi, {user.name || user.email}</span>
            <button onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ marginRight: 12 }}>Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function AppRoutes() {
  function handleAddToCart(product) {
    api.post('/api/cart', { product_id: product.id, quantity: 1 })
      .then(() => alert(`Added "${product.name || '(no name)'}" to cart`))
      .catch((err) => alert('Could not add to cart: ' + (err.response?.data?.error || err.message)));
  }

  return (
    <Routes>
      <Route path="/" element={<Products onAddToCart={handleAddToCart} />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/orders" element={<Orders />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
