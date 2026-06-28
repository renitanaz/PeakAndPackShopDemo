import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    loadCart();
  }, [user]);

  function loadCart() {
    setLoading(true);
    api.get('/api/cart')
      .then((res) => setCart(res.data))
      .catch((err) => setError('Could not load cart: ' + err.message))
      .finally(() => setLoading(false));
  }

  function removeItem(productId) {
    api.delete(`/api/cart/${productId}`)
      .then(() => loadCart())
      .catch((err) => setError('Could not remove item: ' + err.message));
  }

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <p>You need to log in to view your cart.</p>
      </div>
    );
  }

  if (loading) return <p style={{ padding: 20 }}>Loading cart...</p>;
  if (error) return <p style={{ padding: 20, color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Your Cart</h1>
      {cart.items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {cart.items.map((item) => (
            <div key={item.product_id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: '1px solid #eee',
            }}>
              <span>{item.name || '(no name)'}</span>
              <span>Qty: {item.quantity}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
              <button onClick={() => removeItem(item.product_id)}>Remove</button>
            </div>
          ))}
          <h2 style={{ marginTop: 20 }}>Total: ${cart.total.toFixed(2)}</h2>
          <button onClick={() => navigate('/checkout')} style={{ padding: 10, marginTop: 10 }}>
            Proceed to checkout
          </button>
        </>
      )}
    </div>
  );
}
