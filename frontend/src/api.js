import axios from 'axios';

// Your live PeakAndPack backend on Render
const API_BASE = 'https://peakandpackshopdemo.onrender.com';

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
