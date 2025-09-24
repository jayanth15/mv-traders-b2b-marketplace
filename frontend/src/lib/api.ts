import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      Cookies.remove('token');
      Cookies.remove('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface User {
  user_id: number;
  full_name: string;
  phone_number: string;
  role: 'SuperAdmin' | 'Admin' | 'User' | 'AppAdmin';
  organization_id: number;
  organization_type: 'Vendor' | 'Company' | 'AppOwner';
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  phone_number: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Auth API functions
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    Cookies.remove('token');
    Cookies.remove('user');
  },
};

// Organization API functions
export const organizationAPI = {
  getOrganizations: async () => {
    const response = await api.get('/organizations/');
    return response.data;
  },

  getVendors: async () => {
    const response = await api.get('/organizations/vendors');
    return response.data;
  },

  createOrganization: async (data: any) => {
    const response = await api.post('/organizations/', data);
    return response.data;
  },

  updateOrganization: async (id: number, data: any) => {
    const response = await api.put(`/organizations/${id}`, data);
    return response.data;
  },

  deleteOrganization: async (id: number) => {
    const response = await api.delete(`/organizations/${id}`);
    return response.data;
  },

  getOrganization: async (id: number) => {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
  },
};

// Products API functions
export const productAPI = {
  getProducts: async () => {
    const response = await api.get('/products/');
    return response.data;
  },

  createProduct: async (data: any) => {
    const response = await api.post('/products/', data);
    return response.data;
  },

  updateProduct: async (id: number, data: any) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

// Orders API functions
export const orderAPI = {
  getOrders: async () => {
    const response = await api.get('/orders/');
    return response.data;
  },

  createOrder: async (data: any) => {
    const response = await api.post('/orders/', data);
    return response.data;
  },

  acceptOrder: async (orderId: number) => {
    const response = await api.put(`/orders/${orderId}/accept`);
    return response.data;
  },

  updateOrderStatus: async (orderId: number, status: string) => {
    const response = await api.put(`/orders/${orderId}/status`, null, { params: { status } });
    return response.data;
  },
};

// Users API functions
export const userAPI = {
  getUsers: async () => {
    const response = await api.get('/users/');
    return response.data;
  },

  createUser: async (data: any) => {
    const response = await api.post('/users/', data);
    return response.data;
  },

  updateUser: async (id: number, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Units API functions (used by vendors when creating products)
export const unitAPI = {
  getUnits: async () => {
    const response = await api.get('/units/');
    return response.data;
  },

  createUnit: async (data: any) => {
    const response = await api.post('/units/', data);
    return response.data;
  },

  updateUnit: async (id: number, data: any) => {
    const response = await api.put(`/units/${id}`, data);
    return response.data;
  },

  deleteUnit: async (id: number) => {
    const response = await api.delete(`/units/${id}`);
    return response.data;
  },
};

// Order Items API
export const orderItemAPI = {
  getItemsByOrder: async (orderId: number) => {
    const response = await api.get('/order-items/', { params: { order_id: orderId } });
    return response.data;
  },

  updateStatus: async (orderItemId: number, new_status: string) => {
    const response = await api.put(`/order-items/${orderItemId}/status`, null, { params: { new_status } });
    return response.data;
  },
  
  getHistory: async (orderItemId: number) => {
    const response = await api.get(`/order-items/${orderItemId}/history`);
    return response.data;
  },
  overridePrice: async (orderItemId: number, new_price: number, reason?: string) => {
    const response = await api.put(`/order-items/${orderItemId}/override-price`, null, { params: { new_price, reason } });
    return response.data;
  },
};

// Pricing API
export const pricingAPI = {
  preview: async (product_id: number, quantity: number, zone_code?: string) => {
    const response = await api.post('/pricing/preview', null, { params: { product_id, quantity, zone_code } });
    return response.data;
  },
  listZones: async (product_id: number) => {
    const response = await api.get(`/pricing/zones/${product_id}`);
    return response.data;
  },
  createZone: async (product_id: number, data: any) => {
    const response = await api.post(`/pricing/zones/${product_id}`, data);
    return response.data;
  },
  updateZone: async (zone_id: number, data: any) => {
    const response = await api.put(`/pricing/zones/${zone_id}`, data);
    return response.data;
  },
  deleteZone: async (zone_id: number) => {
    const response = await api.delete(`/pricing/zones/${zone_id}`);
    return response.data;
  },
  listTiers: async (product_id: number) => {
    const response = await api.get(`/pricing/tiers/${product_id}`);
    return response.data;
  },
  createTier: async (product_id: number, data: any) => {
    const response = await api.post(`/pricing/tiers/${product_id}`, data);
    return response.data;
  },
  updateTier: async (tier_id: number, data: any) => {
    const response = await api.put(`/pricing/tiers/${tier_id}`, data);
    return response.data;
  },
  deleteTier: async (tier_id: number) => {
    const response = await api.delete(`/pricing/tiers/${tier_id}`);
    return response.data;
  },
};
