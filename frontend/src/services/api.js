import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('trading_user'));
    if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

export const authService = {
    login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        if (res.data) localStorage.setItem('trading_user', JSON.stringify(res.data));
        return res.data;
    },
    register: async (name, email, password) => {
        const res = await api.post('/auth/', { name, email, password });
        if (res.data) localStorage.setItem('trading_user', JSON.stringify(res.data));
        return res.data;
    },
    logout: () => {
        localStorage.removeItem('trading_user');
    },
    getCurrentUser: () => {
        const user = localStorage.getItem('trading_user');
        return user ? JSON.parse(user) : null;
    },
    getProfile: async () => {
        const res = await api.get('/user/me');
        return res.data;
    }
};

export const stockService = {
    getStocks: async () => {
        const res = await api.get('/stocks');
        return res.data;
    },
    getStockBySymbol: async (symbol) => {
        const res = await api.get(`/stocks/${symbol}`);
        return res.data;
    },
    getCandles: async (symbol, timeframe = '1m') => {
        const res = await api.get(`/candles?symbol=${symbol}&timeframe=${timeframe}`);
        return res.data;
    }
};

export const walletService = {
    getBalance: async () => {
        const res = await api.get('/wallet');
        return res.data;
    }
};

export const tradeService = {
    placeOrder: async (orderData) => {
        const endpoint = orderData.side === 'BUY' ? '/orders/buy' : '/orders/sell';
        const res = await api.post(endpoint, orderData);
        return res.data;
    },
    getHoldings: async () => {
        const res = await api.get('/holdings');
        return res.data;
    },
    getTransactions: async () => {
        const res = await api.get('/transactions');
        return res.data;
    },
    getMarketPulse: async () => {
        const res = await api.get('/transactions/pulse');
        return res.data;
    },
    getOrders: async () => {
        const res = await api.get('/orders');
        return res.data;
    }
};

export const adminService = {
    getUsers: async () => {
        const res = await api.get('/admin/users');
        return res.data;
    },
    blockUser: async (id) => {
        const res = await api.patch(`/admin/users/${id}`);
        return res.data;
    },
    addStock: async (stockData) => {
        const res = await api.post('/admin/stocks', stockData);
        return res.data;
    },
    getAllOrders: async () => {
        const res = await api.get('/admin/orders');
        return res.data;
    },
    deleteStock: async (id) => {
        const res = await api.delete(`/admin/stocks/${id}`);
        return res.data;
    }
};

export const ipoService = {
    getIPOs: async () => {
        const res = await api.get('/ipo');
        return res.data;
    },
    apply: async (data) => {
        const res = await api.post('/ipo/apply', data);
        return res.data;
    },
    // Admin IPO routes
    adminCreate: async (data) => {
        const res = await api.post('/ipo/admin', data);
        return res.data;
    },
    adminGetApplications: async (ipoId) => {
        const res = await api.get(`/ipo/admin/applications/${ipoId}`);
        return res.data;
    },
    adminAllot: async (data) => {
        const res = await api.post('/ipo/admin/allot', data);
        return res.data;
    },
    adminRunAllotment: async (ipoId) => {
        const res = await api.post('/ipo/admin/run-allotment', { ipoId });
        return res.data;
    },
    adminListOnMarket: async (ipoId) => {
        const res = await api.post('/ipo/admin/list', { ipoId });
        return res.data;
    }
};

export const notificationService = {
    getNotifications: async () => {
        const res = await api.get('/notifications');
        return res.data;
    },
    markRead: async () => {
        const res = await api.patch('/notifications/read');
        return res.data;
    }
};

export const paymentService = {
    createCheckoutSession: async (amount) => {
        const res = await api.post('/payments/create-checkout-session', { amount });
        return res.data;
    },
    verifyPayment: async (sessionId) => {
        const res = await api.get(`/payments/verify-session/${sessionId}`);
        return res.data;
    }
};

export const newsService = {
    getLatestNews: async () => {
        const res = await api.get('/news');
        return res.data;
    }
};

export default api;
