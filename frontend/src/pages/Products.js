import { useEffect, useRef, useState } from 'react';
import api from '../api';

export default function Products({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const sentinelRef = useRef(null);

  useEffect(() => {
    loadProducts();
  }, []);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + 8);
      }
    }, { threshold: 0.1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [products]);

  function loadProducts() {
    setLoading(true);
    setVisibleCount(8);
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
    setVisibleCount(8);
    api.get(`/api/search?q=${encodeURIComponent(search)}`)
      .then((res) => setProducts(res.data.results))
      .catch((err) => setError('Search failed: ' + err.message))
      .finally(() => setLoading(false));
  }

  if (loading) return <p style={{ padding: 20 }}>Loading gear...</p>;
  if (error) return <p style={{ padding: 20, color: 'red' }}>{error}</p>;

  const visible = products.slice(0, visibleCount);

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
        {visible.map((p) => (
          <div key={p.id} data-testid="product-card" style={{
            border: '1px solid #ccc',
            borderRadius: 8,
            padding: 12,
          }}>
            <img
              src={p.image_url}
              alt={p.name || '(no name)'}
              style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6 }}
            />
            <h3 style={{ minHeight: 24 }}>
              {p.name || '(no name)'}
              {/* Open in new tab — Phase 8 multiple tabs testing */}
              <a
                href={`/product?id=${p.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '.8rem', color: '#E8650A', textDecoration: 'none', marginLeft: '.4rem' }}
                title="Open in new tab"
              >&#8599;</a>
            </h3>
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

      {/* Infinite scroll sentinel — Phase 8 infinite scroll testing */}
      {visibleCount < products.length && (
        <div ref={sentinelRef} style={{ height: 20, marginTop: '1rem' }} />
      )}
    </div>
  );
}
