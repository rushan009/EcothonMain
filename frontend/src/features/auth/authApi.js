import { api } from '../../api/client';

export async function registerUser(payload) {
  return api.post('/api/auth/register', payload);
}

export async function loginUser(payload) {
  return api.post('/api/auth/login', payload);
}

export async function refreshToken(payload) {
  return api.post('/api/auth/refresh', payload);
}

export async function logoutUser(payload) {
  return api.post('/api/auth/logout', payload);
}
