import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Choice from '../components/Choice';
import DatePicker, { formatDate } from '../components/DatePicker';
import Dropdown from '../components/Dropdown';
import Tooltip from '../components/Tooltip';

const TIME_SLOTS = ['Morning (8-12)', 'Afternoon (12-17)', 'Evening (17-21)'];

// 2026-10-15 style, built from the date's own year, month and day (no time zone shift)
function toIsoDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function Checkout() {
  const [discountCode, setDiscountCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
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
    api.post('/api/orders/checkout', {
      discount_code: discountCode || undefined,
      delivery_method: deliveryMethod,
      delivery_date: deliveryDate ? toIsoDate(deliveryDate) : undefined,
      delivery_slot: timeSlot,
    })
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
        <p>
          Delivery: {result.delivery_method === 'express' ? 'Express' : 'Standard'}
          {result.delivery_date ? `, ${formatDate(new Date(result.delivery_date + 'T00:00:00'))}` : ''}
          {result.delivery_slot ? `, ${result.delivery_slot}` : ''}
        </p>
        <button onClick={() => navigate('/orders')}>View order history</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 520 }}>
      <h1>Checkout</h1>
      <form onSubmit={handleCheckout}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <label>Discount code (optional)</label>
          <Tooltip label="Discount code help" text="Codes are case-sensitive" />
        </div>
        <input
          type="text"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          placeholder="e.g. SAVE10"
          style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }}
        />

        <fieldset style={{ border: 0, padding: 0, margin: '0 0 14px' }}>
          <legend style={{ fontWeight: 600, marginBottom: 6, padding: 0 }}>Delivery method</legend>
          <Choice
            type="radio"
            name="delivery"
            value="standard"
            label="Standard (5 days)"
            checked={deliveryMethod === 'standard'}
            onChange={() => setDeliveryMethod('standard')}
          />
          <Choice
            type="radio"
            name="delivery"
            value="express"
            label="Express (2 days)"
            checked={deliveryMethod === 'express'}
            onChange={() => setDeliveryMethod('express')}
          />
          <Choice type="radio" name="delivery" value="pickup" label="Store pickup (unavailable)" disabled />
        </fieldset>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <label htmlFor="delivery-date">Delivery date (optional)</label>
          <Tooltip label="Delivery date help" text="The earliest delivery date is tomorrow" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <DatePicker id="delivery-date" value={deliveryDate} onChange={setDeliveryDate} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <Dropdown label="Delivery time" options={TIME_SLOTS} value={timeSlot} onChange={setTimeSlot} />
        </div>

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
