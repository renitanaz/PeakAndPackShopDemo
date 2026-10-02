import { useEffect, useRef, useState } from 'react';
import api from '../api';
import Choice from '../components/Choice';
import Slider from '../components/Slider';

const PRICE_MAX = 500; // the slider's far right means "any price"

function applyFilters(products, { categories, inStockOnly, maxPrice, sortBy }) {
  let list = products.filter((p) =>
    (categories.length === 0 || categories.includes(p.category)) &&
    (!inStockOnly || p.stock > 0) &&
    (maxPrice >= PRICE_MAX || p.price <= maxPrice)
  );
  if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
  if (sortBy === 'name') list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return list;
}

export default function Products({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const sentinelRef = useRef(null);
  const filtered = applyFilters(products, { categories, inStockOnly, maxPrice, sortBy });

  useEffect(() => {
    loadProducts();
  }, []);

  // Start from the first page of results again whenever a filter changes
  useEffect(() => {
    setVisibleCount(8);
  }, [categories, inStockOnly, maxPrice, sortBy]);

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
  }, [products, filtered.length]);

  function toggleCategory(category) {
    setCategories((current) =>
      current.includes(category) ? current.filter((c) => c !== category) : [...current, category]
    );
  }

  function loadProducts() {
    setLoading(true);
    setVisibleCount(8);
    api.get('/api/products')
      .then((res) => {
        setProducts(res.data.products);
        setAllCategories([...new Set(res.data.products.map((p) => p.category))].sort());
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

  const visible = filtered.slice(0, visibleCount);

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

      <fieldset style={{ border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px', marginBottom: 16 }}>
        <legend>Filters</legend>
        <div style={{ marginBottom: 8 }}>
          <span style={{ marginRight: 12 }}>Category:</span>
          {allCategories.map((category) => (
            <Choice
              key={category}
              type="checkbox"
              name="category"
              value={category}
              label={category}
              checked={categories.includes(category)}
              onChange={() => toggleCategory(category)}
            />
          ))}
          <Choice
            type="checkbox"
            name="in-stock"
            value="in-stock"
            label="In stock only"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <label htmlFor="sort-by" style={{ marginRight: 8 }}>Sort by</label>
            <select id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: 6 }}>
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ display: 'inline-block', minWidth: 130 }}>
              Price: {maxPrice >= PRICE_MAX ? 'any price' : `up to $${maxPrice}`}
            </span>
            <Slider
              label="Maximum price"
              min={0}
              max={PRICE_MAX}
              step={10}
              value={maxPrice}
              valueText={maxPrice >= PRICE_MAX ? 'Any price' : `Up to $${maxPrice}`}
              onChange={setMaxPrice}
            />
          </div>
        </div>
      </fieldset>

      <p style={{ fontSize: 13, color: '#666' }} data-testid="result-count">
        Showing {filtered.length} of {products.length} products
      </p>
      {filtered.length === 0 && <p>No products match your filters.</p>}

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
      {visibleCount < filtered.length && (
        <div ref={sentinelRef} style={{ height: 20, marginTop: '1rem' }} />
      )}
    </div>
  );
}
