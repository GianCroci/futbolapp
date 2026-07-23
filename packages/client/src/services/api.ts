import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: handle errors (no hard redirect - let ProtectedRoute handle auth state)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Just reject the promise - don't redirect here
    // ProtectedRoute and useAuth handle unauthenticated state
    return Promise.reject(error);
  }
);

export default api;
