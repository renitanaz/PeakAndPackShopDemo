import axios from 'axios';

// The API address. A build can set REACT_APP_API_URL to point at another copy of the backend
// (the CI pipeline builds against a backend it starts itself). With nothing set, it is the live
// PeakAndPack backend on Render, so the deployed site behaves exactly as before.
const API_BASE = process.env.REACT_APP_API_URL || 'https://peakandpackshopdemo.onrender.com';

const api = axios.create({
  baseURL: API_BASE,
});

// Attach the auth token automatically if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
