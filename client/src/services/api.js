import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle response errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = error.config?.url || '';
        const isLoginAttempt = requestUrl.includes('/auth/login');

        if (error.response?.status === 401 && !isLoginAttempt) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authService = {
    register: (data) => apiClient.post('/auth/register', data),
    login: (data) => apiClient.post('/auth/login', data),
    getCurrentUser: () => apiClient.get('/auth/me'),
    updateProfile: (data) => apiClient.put('/auth/me', data),
    changePassword: (data) => apiClient.post('/auth/change-password', data),
    logout: () => apiClient.post('/auth/logout'),
};

export const userService = {
    getUsers: () => apiClient.get('/users'),
    getUser: (id) => apiClient.get(`/users/${id}`),
    createUser: (data) => apiClient.post('/users', data),
    updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
    enableUser: (id) => apiClient.patch(`/users/${id}/enable`),
    deleteUser: (id) => apiClient.delete(`/users/${id}`),
};

export const categoryService = {
    getCategories: () => apiClient.get('/categories'),
    createCategory: (data) => apiClient.post('/categories', data),
    updateCategory: (id, data) => apiClient.put(`/categories/${id}`, data),
    deleteCategory: (id) => apiClient.delete(`/categories/${id}`),
};

export const productService = {
    getProducts: (params) => apiClient.get('/products', { params }),
    getProduct: (id) => apiClient.get(`/products/${id}`),
    createProduct: (data) => apiClient.post('/products', data),
    updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),
    deleteProduct: (id) => apiClient.delete(`/products/${id}`),
    uploadImage: (formData) => apiClient.post('/products/upload-image', formData),
};

export const posService = {
    getProducts: (params) => apiClient.get('/pos/products', { params }),
    createSale: (data) => apiClient.post('/pos/sales', data),
    getSale: (id) => apiClient.get(`/pos/sales/${id}`),
    getSales: (params) => apiClient.get('/pos/sales', { params }),
    voidSale: (id, data) => apiClient.post(`/pos/sales/${id}/void`, data),
};

export const analyticsService = {
    getDashboardStats: (params) => apiClient.get('/analytics/dashboard', { params }),
    getDailySalesTrend: (params) => apiClient.get('/analytics/sales-trend', { params }),
    getTopProducts: (params) => apiClient.get('/analytics/top-products', { params }),
    getRevenueByCategory: (params) => apiClient.get('/analytics/revenue-category', { params }),
    getCashierPerformance: (params) => apiClient.get('/analytics/cashier-performance', { params }),
    getSalesSummary: (params) => apiClient.get('/analytics/sales-summary', { params }),
};

export const activityLogService = {
    getActivityLogs: (params) => apiClient.get('/activity-logs', { params }),
    getLoginHistory: (params) => apiClient.get('/activity-logs/login-history', { params }),
};

export const storeService = {
    getStoreInfo: () => apiClient.get('/stores/info'),
    updateStoreInfo: (data) => apiClient.put('/stores/info', data),
};

export default apiClient;
