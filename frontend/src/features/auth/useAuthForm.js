import { useState } from 'react';
import { loginUser, registerUser } from './authApi';
import { isSignupFormComplete, toRegisterPayload } from './authMapper';
import { baseURL, setAccessToken } from '../../api/client';
import { saveAuthTokens } from './authStorage';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: '',
};

export function useAuthForm(startingValues = initialForm) {
  const [form, setForm] = useState({ ...initialForm, ...startingValues });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
  
  const bindField = (key) => ({
    value: form[key],
    onChangeText: (value) => setField(key, value),
  });

  const selectRole = (role) => {
    setField('role', role);
  };

  const submitRegistration = async () => {
    if (!isSignupFormComplete(form)) {
      const message = 'Please complete all fields before continuing';
      setServerError(message);
      throw new Error(message);
    }

    setLoading(true);
    setServerError('');

    try {
      const payload = toRegisterPayload(form);
      const response = await registerUser(payload);
      const { accessToken, refreshToken } = response.data || {};
      if (accessToken || refreshToken) {
        await saveAuthTokens({ accessToken, refreshToken });
        setAccessToken(accessToken);
      }
      return response.data;
    } catch (error) {
      // Axios emits plain 'Network Error' when it cannot reach the server.
      if (error?.message === 'Network Error') {
        const message = `Network Error: cannot reach API at ${baseURL}. If you're running the app on a device/emulator, set EXPO_PUBLIC_API_URL to your machine IP (e.g. http://192.168.1.10:5000) or set EXPO_PUBLIC_API_PORT=5000, or enable Expo tunnel.`;
        setServerError(message);
        throw new Error(message);
      }

      const message = error?.response?.data?.message || error?.message || 'Registration failed';
      setServerError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const submitLogin = async () => {
    setLoading(true);
    setServerError('');
    try {
      const response = await loginUser({ phone: form.phone, password: form.password });
      const { accessToken, refreshToken } = response.data || {};
      if (accessToken || refreshToken) {
        await saveAuthTokens({ accessToken, refreshToken });
        setAccessToken(accessToken);
      }
      return response.data;
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Login failed';
      setServerError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ ...initialForm, ...startingValues });
    setError('');
  };

  const setServerError = (message) => setError(message || '');

  return {
    form,
    loading,
    error,
    setForm,
    setField,
    bindField,
    selectRole,
    submitRegistration,
    submitLogin,
    setLoading,
    setServerError,
    resetForm,
  };
}
