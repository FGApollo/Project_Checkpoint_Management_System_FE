import axios from 'axios';
import { clearStoredAuthentication, hasUsableAccessToken } from './authSession.js';

const getBaseUrl = () => {
  if (import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5122/api';
  }
  return 'https://swd-capstone.onrender.com/api';
};

const API_BASE_URL = getBaseUrl();
export const API_REQUEST_TIMEOUT_MS = 60_000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

const isPublicAuthenticationRequest = (url = '') => (
  url.endsWith('/auth/login')
  || url.endsWith('/auth/google')
  || url.endsWith('/auth/refresh')
);

let refreshPromise = null;

export const refreshAuthentication = async () => {
  const refreshToken = localStorage.getItem('cpms_refresh_token');
  if (!refreshToken) throw new Error('No refresh token is available.');

  if (!refreshPromise) {
    refreshPromise = axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { timeout: API_REQUEST_TIMEOUT_MS },
    ).then(({ data }) => {
      if (!data?.accessToken) throw new Error('The refresh response did not contain an access token.');
      localStorage.setItem('cpms_access_token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('cpms_refresh_token', data.refreshToken);
      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
      window.dispatchEvent(new Event('auth:token-refreshed'));
      return data.accessToken;
    }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

const expireAuthentication = () => {
  clearStoredAuthentication();
  delete api.defaults.headers.common.Authorization;
  window.dispatchEvent(new Event('auth:unauthorized'));
};

api.interceptors.request.use(
  async (config) => {
    let accessToken = localStorage.getItem('cpms_access_token');
    if (accessToken && !hasUsableAccessToken(accessToken) && !isPublicAuthenticationRequest(config.url)) {
      try {
        accessToken = await refreshAuthentication();
      } catch (error) {
        expireAuthentication();
        throw error;
      }
    }
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401
      && originalRequest
      && !originalRequest._retry
      && !isPublicAuthenticationRequest(originalRequest.url)) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAuthentication();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        expireAuthentication();
        throw refreshError;
      }
    }

    throw error;
  }
);

export default api;
