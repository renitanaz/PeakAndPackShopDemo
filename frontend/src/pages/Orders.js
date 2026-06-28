import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    api.get('/api/orders')
      .then((res) => setOrders(res.data.orders))
      .catch((err) => setError('Could not load orders: ' + err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return <div style={{ padding: 20 }}><p>You need to log in to view order history.</p></div>;
  }

  if (loading) return <p style={{ padding: 20 }}>Loading orders...</p>;
  if (error) return <p style={{ padding: 20, color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Order History</h1>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        orders.map((o) => (
          <div key={o.id} style={{
            border: '1px solid #ccc',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}>
            <p><strong>Order #{o.id}</strong> &middot; {o.status}</p>
            <p>Total: ${o.total.toFixed(2)}</p>
            <p style={{ fontSize: 12, color: '#888' }}>{o.created_at}</p>
          </div>
        ))
      )}
    </div>
  );
}
