import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const [discountCode, setDiscountCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleCheckout(e) {
    e.preventDefault();
    setError(null);
    api.post('/api/orders/checkout', { discount_code: discountCode || undefined })
      .then((res) => setResult(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Checkout failed'));
  }

  if (!user) {
    return <div style={{ padding: 20 }}><p>You need to log in to check out.</p></div>;
  }

  if (result) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Order placed!</h1>
        <p>Order ID: {result.order_id}</p>
        <p>Total charged: ${result.total.toFixed(2)}</p>
        <button onClick={() => navigate('/orders')}>View order history</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 360 }}>
      <h1>Checkout</h1>
      <form onSubmit={handleCheckout}>
        <label>Discount code (optional)</label>
        <input
          type="text"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          placeholder="e.g. SAVE10"
          style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: 10 }}>Place order</button>
      </form>
    </div>
  );
}
