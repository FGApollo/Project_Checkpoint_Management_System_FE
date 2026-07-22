import React, { useState, useEffect, useCallback } from 'react';
import api, { refreshAuthentication } from '../services/api';
import { clearStoredAuthentication, hasUsableAccessToken, parseJwt } from '../services/authSession.js';
import { AuthContext } from './authContextValue.js';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initAuth = useCallback(async () => {
    try {
      let accessToken = localStorage.getItem('cpms_access_token');
      if (accessToken && !hasUsableAccessToken(accessToken)) {
        accessToken = await refreshAuthentication();
      }

      if (!accessToken) return;
      const parsedUser = parseJwt(accessToken);
      if (!parsedUser) throw new Error('Stored access token is invalid.');

      let savedUser = {};
      try { savedUser = JSON.parse(localStorage.getItem('cpms_user') || '{}'); }
      catch { savedUser = {}; }
      // Security-sensitive claims always come from the current signed token.
      setUser({ ...savedUser, ...parsedUser });
    } catch {
      clearStoredAuthentication();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void initAuth();

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [initAuth]);

  const persistAuthentication = useCallback((tokenResponse) => {
    const { accessToken, refreshToken } = tokenResponse;
    if (!accessToken) {
      throw new Error('Máy chủ không trả về access token hợp lệ.');
    }

    localStorage.setItem('cpms_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('cpms_refresh_token', refreshToken);
    }

    const parsedUser = parseJwt(accessToken);
    if (!parsedUser) {
      throw new Error('Không thể đọc thông tin tài khoản từ access token.');
    }
    const userData = { ...parsedUser, fullName: parsedUser.username };
    localStorage.setItem('cpms_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { username, password });
      return persistAuthentication(response.data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tên đăng nhập hoặc mật khẩu.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [persistAuthentication]);

  const googleLogin = useCallback(async (idToken) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/google', { idToken });
      return persistAuthentication(response.data);
    } catch (err) {
      const msg = err.response?.status === 401
        ? 'Email Google chưa được liên kết với tài khoản CPMS đang hoạt động.'
        : (err.response?.data?.error || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [persistAuthentication]);

  const bootstrapAdmin = useCallback(async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/bootstrap-admin', { username, email, password });
      // Now login using those credentials right away
      return await login(username, password);
    } catch (err) {
      const msg = err.response?.data?.error || 'Khởi tạo tài khoản Quản trị viên Gốc thất bại.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [login]);

  const logout = useCallback(async () => {
    clearStoredAuthentication();
    setUser(null);
  }, []);

  const contextValue = React.useMemo(
    () => ({ user, loading, error, login, googleLogin, logout, bootstrapAdmin, setUser }),
    [user, loading, error, login, googleLogin, logout, bootstrapAdmin]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
