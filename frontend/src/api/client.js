import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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

  const host = resolveHostFromExpo();
  // Prefer common backend ports; allow override via EXPO_PUBLIC_API_PORT
  const port = process.env.EXPO_PUBLIC_API_PORT || '5000';
  if (host) {
    return `http://${host}:${port}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}`;
  }

  return `http://localhost:${port}`;
};

export let baseURL = resolveDefaultBaseUrl();

export const api = axios.create({
  baseURL,
  timeout: 10000,
});

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

  const host = resolveHostFromExpo();
  const envPort = process.env.EXPO_PUBLIC_API_PORT;
  const ports = [envPort, '3000', '5000'].filter(Boolean);

  if (host) {
    ports.forEach((p) => candidates.push(`http://${host}:${p}`));
  }

  // Emulator / localhost fallbacks
  ports.forEach((p) => {
    if (Platform.OS === 'android') {
      candidates.push(`http://10.0.2.2:${p}`);
    }
    candidates.push(`http://localhost:${p}`);
    candidates.push(`http://127.0.0.1:${p}`);
  });

  // Deduplicate while preserving order
  const seen = new Set();
  const uniq = candidates.filter((c) => (seen.has(c) ? false : seen.add(c)));

  for (const candidate of uniq) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      // try hit /health
      const url = `${candidate.replace(/\/$/, '')}/health`;
      const resp = await axios.get(url, { signal: controller.signal });
      clearTimeout(id);
      if (resp && resp.status >= 200 && resp.status < 300) {
        baseURL = candidate;
        api.defaults.baseURL = baseURL;
        // eslint-disable-next-line no-console
        console.log('[api:init] selected baseURL ->', baseURL);
        return baseURL;
      }
    } catch (e) {
      // ignore and try next
      // eslint-disable-next-line no-console
      console.log('[api:init] probe failed for', candidate, e?.message || e);
    }
  }

  // nothing found
  // eslint-disable-next-line no-console
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

export const endpoints = {
  sendOtp: (payload) => api.post('/api/auth/signup', payload),
  verifyOtp: (payload) => api.post('/api/auth/verifyotp', payload),
  scanWaste: (payload) => api.post('/api/waste/scan', payload),
  getPrices: () => api.get('/api/prices/current'),
  createPickup: (payload) => api.post('/api/pickup/create', payload),
  listUserPickups: () => api.get('/api/pickup/list'),
  nearbyRequests: () => api.get('/api/pickup/nearby'),
  acceptPickup: (payload) => api.post('/api/pickup/accept', payload),
  completePickup: (payload) => api.post('/api/pickup/complete', payload),
  getUserDashboard: () => api.get('/api/user/dashboard'),
  getUserProfile: () => api.get('/api/user/profile'),
  getUserPickups: () => api.get('/api/user/pickups'),
  getUserScrapPrices: () => api.get('/api/user/scrap-prices'),
  getRewards: () => api.get('/api/user/rewards'),
  getUserStats: () => api.get('/api/user/stats'),
};
