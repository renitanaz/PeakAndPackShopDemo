import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const [discountCode, setDiscountCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'PAYMENT_COMPLETE') {
        setPaymentDone(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

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
    <div style={{ padding: 20, maxWidth: 400 }}>
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

        {/* Payment iframe — Phase 8 iframe testing */}
        <div style={{ margin: '1.2rem 0', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
          <p style={{ padding: '.6rem 1rem', background: '#f4f7fb', fontSize: '.85rem', color: '#555', margin: 0 }}>
            🔒 Secure payment powered by PeakPay
          </p>
          <iframe
            id="payment-iframe"
            src="/admin/payment-sandbox.html"
            title="Payment form"
            width="100%"
            height="260"
            frameBorder="0"
            style={{ display: 'block' }}
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button
          type="submit"
          id="place-order-btn"
          disabled={!paymentDone}
          style={{
            width: '100%',
            padding: 10,
            opacity: paymentDone ? 1 : 0.5,
            cursor: paymentDone ? 'pointer' : 'not-allowed'
          }}
        >
          {paymentDone ? 'Confirm Order' : 'Complete payment above to continue'}
        </button>
      </form>
    </div>
  );
}
