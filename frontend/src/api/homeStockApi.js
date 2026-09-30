import axios from 'axios';

// In production (Vercel) this points to Railway. In development, falls back to localhost.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});


// Products
export const getProducts = (params = {}) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const consumeProduct = (id, data) => api.patch(`/products/${id}/consume`, data);
export const getLowStock = () => api.get('/products/low-stock');
export const getUnitTypes = () => api.get('/products/unit-types');

// Categories
export const getCategories = () => api.get('/categories');

// Tickets
export const scanQr = (qrContent) => api.post('/tickets/scan', { qrContent });
export const processTicket = (data) => api.post('/tickets/process', data);
export const getTickets = () => api.get('/tickets');

// Movements
export const getRecentMovements = () => api.get('/movements');
export const getProductMovements = (productId) => api.get(`/movements/product/${productId}`);

export default api;
