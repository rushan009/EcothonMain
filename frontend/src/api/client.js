import axios from 'axios';
import Constants from 'expo-constants';
import * as Network from 'expo-network';
import { Platform } from 'react-native';
import { getAccessToken, getRefreshToken } from '../features/auth/authStorage';

const DEFAULT_PORT = process.env.EXPO_PUBLIC_API_PORT || '3000';

const resolveHostFromExpo = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (!hostUri) {
    return null;
  }

  return hostUri.split(':')[0];
};

const resolveDefaultBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (process.env.EXPO_PUBLIC_API_HOST) {
    return `http://${process.env.EXPO_PUBLIC_API_HOST}:${DEFAULT_PORT}`;
  }

  const host = resolveHostFromExpo();
  if (host) {
    return `http://${host}:${DEFAULT_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }

  return `http://localhost:${DEFAULT_PORT}`;
};

export let baseURL = resolveDefaultBaseUrl();

export const api = axios.create({
  baseURL,
  timeout: 10000,
});

let refreshInFlight = null;

/**
 * Attempt to find a working backend URL. Preference order:
 * 1. EXPO_PUBLIC_API_URL (if set)
 * 2. Host resolved from Expo/Constants with ports [EXPO_PUBLIC_API_PORT, 3000, 5000]
 * 3. Localhost variants
 * Returns the resolved base URL (string) or null if none found.
 */
export async function initApi({ timeout = 2000 } = {}) {
  const candidates = [];

  if (process.env.EXPO_PUBLIC_API_URL) {
    candidates.push(process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, ''));
  }

  if (process.env.EXPO_PUBLIC_API_HOST) {
    candidates.push(`http://${process.env.EXPO_PUBLIC_API_HOST}:${DEFAULT_PORT}`);
  }

  const host = resolveHostFromExpo();
  const ports = [process.env.EXPO_PUBLIC_API_PORT, '3000', '5000'].filter(Boolean);

  if (host) {
    ports.forEach((p) => candidates.push(`http://${host}:${p}`));
  }

  try {
    const networkHost = await Network.getIpAddressAsync();

    if (networkHost && networkHost !== 'localhost' && networkHost !== '127.0.0.1') {
      ports.forEach((p) => candidates.push(`http://${networkHost}:${p}`));
    }
  } catch (error) {
    console.log('[api:init] unable to resolve network host:', error?.message || error);
  }

  // Emulator / localhost fallbacks
  ports.forEach((p) => {
    if (Platform.OS === 'android') {
      candidates.push(`http://10.0.2.2:${p}`);
    }
    candidates.push(`http://localhost:${p}`);
    candidates.push(`http://127.0.0.1:${p}`);
  });

  const seen = new Set();
  const uniq = candidates.filter((c) => (seen.has(c) ? false : seen.add(c)));

  for (const candidate of uniq) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const url = `${candidate.replace(/\/$/, '')}/health`;
      const resp = await axios.get(url, { signal: controller.signal });
      clearTimeout(id);

      if (resp && resp.status >= 200 && resp.status < 300) {
        baseURL = candidate;
        api.defaults.baseURL = baseURL;
        console.log('[api:init] selected baseURL ->', baseURL);
        return baseURL;
      }
    } catch (error) {
      console.log('[api:init] probe failed for', candidate, error?.message || error);
    }
  }

  console.warn('[api:init] no backend reachable from candidates, using', baseURL);
  api.defaults.baseURL = baseURL;
  return null;
}

// Debug: log resolved base URL in Metro/Expo logs
try {
  // eslint-disable-next-line no-console
  console.log('[api] Resolved baseURL ->', baseURL);
} catch (e) {}

// Axios interceptors to log requests and responses (helps diagnose 403 from Expo)
api.interceptors.request.use((config) => {
  try {
    // eslint-disable-next-line no-console
    console.log('[api:req]', config.method?.toUpperCase(), config.baseURL + config.url, config.headers && { headers: config.headers }, config.data ? { data: config.data } : {});
  } catch (e) {}
  return config;
});

api.interceptors.response.use(
  (response) => {
    try {
      // eslint-disable-next-line no-console
      console.log('[api:res]', response.status, response.config.url, response.data);
    } catch (e) {}
    return response;
  },
  (error) => {
    try {
      // eslint-disable-next-line no-console
      console.log('[api:err]', error?.response?.status, error?.config?.url, error?.response?.data || error.message);
    } catch (e) {}
    return Promise.reject(error);
  }
);

export const setAccessToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export async function hydrateStoredAccessToken() {
  const token = await getAccessToken();

  if (token) {
    setAccessToken(token);
  }

  return token;
}

async function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        throw new Error('Missing refresh token');
      }

      const response = await axios.post(`${baseURL.replace(/\/$/, '')}/api/auth/refresh`, { refreshToken }, { timeout: 10000 });
      const accessToken = response?.data?.accessToken;

      if (!accessToken) {
        throw new Error('Missing access token');
      }

      setAccessToken(accessToken);
      return accessToken;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (String(originalRequest.url || '').includes('/api/auth/refresh')) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshAccessToken();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export const endpoints = {
  sendOtp: (payload) => api.post('/api/auth/signup', payload),
  verifyOtp: (payload) => api.post('/api/auth/verifyotp', payload),
  scanWaste: (payload) => api.post('/api/waste/classify', payload),
  classifyWaste: (payload) => api.post('/api/waste/classify', payload),
  uploadPickupImage: (formData) => api.post('/api/pickup/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getPrices: () => api.get('/api/prices/current'),
  createPickup: (payload) => api.post('/api/pickup/create', payload),
  getMyPickups: () => api.get('/api/pickup/my-pickups'),
  getPendingNearby: () => api.get('/api/pickup/pending-nearby'),
  acceptPickup: (requestId) => api.post(`/api/pickup/accept/${requestId}`),
  declinePickup: (requestId) => api.post(`/api/pickup/decline/${requestId}`),
  arrivedPickup: (requestId) => api.post(`/api/pickup/arrived/${requestId}`),
  setPickupWeight: (requestId, payload) => api.post(`/api/pickup/set-weight/${requestId}`, payload),
  completePayment: (requestId, payload) => api.post(`/api/pickup/payment-complete/${requestId}`, payload),
  completePickup: (requestId) => api.post(`/api/pickup/complete/${requestId}`),
  cancelPickup: (requestId) => api.post(`/api/pickup/cancel/${requestId}`),
  getUserDashboard: () => api.get('/api/user/dashboard'),
  getUserProfile: () => api.get('/api/user/profile'),
  getUserPickups: () => api.get('/api/user/pickups'),
  getUserScrapPrices: () => api.get('/api/user/scrap-prices'),
  getRewards: () => api.get('/api/user/rewards'),
  getUserStats: () => api.get('/api/user/stats'),
};
