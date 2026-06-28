import { useEffect, useState } from 'react';
import api from '../api';

export default function Products({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  function loadProducts() {
    setLoading(true);
    api.get('/api/products')
      .then((res) => {
        setProducts(res.data.products);
        setError(null);
      })
      .catch((err) => setError('Could not load products: ' + err.message))
      .finally(() => setLoading(false));
  }

  function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    api.get(`/api/search?q=${encodeURIComponent(search)}`)
      .then((res) => setProducts(res.data.results))
      .catch((err) => setError('Search failed: ' + err.message))
      .finally(() => setLoading(false));
  }

  if (loading) return <p style={{ padding: 20 }}>Loading gear...</p>;
  if (error) return <p style={{ padding: 20, color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>PeakAndPack Gear</h1>

      <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search gear..."
          style={{ padding: 8, marginRight: 8 }}
        />
        <button type="submit">Search</button>
        <button type="button" onClick={loadProducts} style={{ marginLeft: 8 }}>
          Clear search
        </button>
      </form>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
      }}>
        {products.map((p) => (
          <div key={p.id} style={{
            border: '1px solid #ccc',
            borderRadius: 8,
            padding: 12,
          }}>
            <img
              src={p.image_url}
              alt={p.name || '(no name)'}
              style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6 }}
            />
            <h3 style={{ minHeight: 24 }}>{p.name || '(no name)'}</h3>
            <p style={{ fontSize: 13, color: '#666' }}>{p.description}</p>
            <p style={{
              fontWeight: 'bold',
              color: p.price < 0 ? 'red' : 'inherit',
            }}>
              ${p.price.toFixed(2)}
            </p>
            <p style={{ fontSize: 12, color: '#888' }}>{p.category} &middot; Stock: {p.stock}</p>
            <button onClick={() => onAddToCart(p)} style={{ width: '100%', padding: 8 }}>
              Add to cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
