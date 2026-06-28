import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('test@peakandpack.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    api.post('/api/auth/login', { email, password })
      .then((res) => {
        login(res.data.user, res.data.token);
        navigate('/');
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Login failed');
      });
  }

  return (
    <div style={{ padding: 20, maxWidth: 360 }}>
      <h1>Log in</h1>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }}
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: 10 }}>Log in</button>
      </form>
      <p style={{ fontSize: 13, color: '#666', marginTop: 12 }}>
        Test credentials are pre-filled: test@peakandpack.com / password123
      </p>
    </div>
  );
}
