import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import signalRService from '../services/signalr';

const AuthContext = createContext(null);

export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    
    // Extract standard .NET claim types or simple claims
    const id = parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || parsed.sub || parsed.nameid || parsed.id;
    const username = parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || parsed.unique_name || parsed.name || parsed.username;
    const role = parsed['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || parsed.role || 'User';

    return { id: Number(id), username, role };
  } catch (e) {
    console.error('Failed to parse JWT token', e);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initAuth = useCallback(() => {
    const accessToken = localStorage.getItem('cpms_access_token');
    const savedUser = localStorage.getItem('cpms_user');
    
    if (accessToken) {
      const parsedUser = parseJwt(accessToken);
      if (parsedUser) {
        // Merge with saved full name if available
        const parsedSaved = savedUser ? JSON.parse(savedUser) : {};
        setUser({ ...parsedUser, ...parsedSaved });
      } else {
        localStorage.removeItem('cpms_access_token');
        localStorage.removeItem('cpms_refresh_token');
        localStorage.removeItem('cpms_user');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      signalRService.stopConnection();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [initAuth]);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { username, password });
      const { accessToken, refreshToken } = response.data;

      localStorage.setItem('cpms_access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('cpms_refresh_token', refreshToken);
      }

      const parsedUser = parseJwt(accessToken);
      const userData = { ...parsedUser, fullName: parsedUser.username };
      localStorage.setItem('cpms_user', JSON.stringify(userData));
      setUser(userData);
      
      return userData;
    } catch (err) {
      const msg = err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tên đăng nhập hoặc mật khẩu.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const bootstrapAdmin = async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/bootstrap-admin', { username, email, password });
      // Now login using those credentials right away
      return await login(username, password);
    } catch (err) {
      const msg = err.response?.data?.error || 'Khởi tạo tài khoản Quản trị viên Gốc thất bại.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signalRService.stopConnection();
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('cpms_access_token');
    localStorage.removeItem('cpms_refresh_token');
    localStorage.removeItem('cpms_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, bootstrapAdmin, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
