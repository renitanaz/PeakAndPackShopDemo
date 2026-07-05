import { useEffect, useState } from 'react';
import api from '../api';

export default function ProductDetail() {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const id = new URLSearchParams(window.location.search).get('id');

  useEffect(() => {
    if (!id) return;
    api.get(`/api/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => setError('Product not found.'));
  }, [id]);

  if (!id) return <p style={{ padding: 20 }}>No product specified.</p>;
  if (error) return <p style={{ padding: 20, color: 'red' }}>{error}</p>;
  if (!product) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1.5rem' }}>
      <a href="/" style={{ fontSize: '.85rem', color: '#6B5E52' }}>← Back to products</a>
      <h1 style={{ margin: '1rem 0 .5rem' }}>{product.name || '(no name)'}</h1>
      <img
        src={product.image_url}
        alt={product.name || '(no name)'}
        style={{ width: '100%', maxWidth: 400, borderRadius: 8, margin: '.8rem 0' }}
      />
      <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#E8650A' }}>
        ${Number(product.price).toFixed(2)}
      </p>
      <p style={{ color: '#3D3028', marginTop: '.8rem' }}>
        {product.description || 'Gear built for the trail.'}
      </p>
      <p style={{ marginTop: '.5rem', color: '#6B5E52', fontSize: '.9rem' }}>
        Category: {product.category} &middot; Stock: {product.stock}
      </p>
    </main>
  );
}
