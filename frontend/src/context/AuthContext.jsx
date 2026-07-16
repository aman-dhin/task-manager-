import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('taskrail_token');
    const storedUser = localStorage.getItem('taskrail_user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/login', { email, password });
    localStorage.setItem('taskrail_token', data.token);
    localStorage.setItem('taskrail_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/register', { name, email, password });
    localStorage.setItem('taskrail_token', data.token);
    localStorage.setItem('taskrail_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/logout');
    } catch {
      // Stateless JWT — ignore network errors on logout, still clear locally
    }
    localStorage.removeItem('taskrail_token');
    localStorage.removeItem('taskrail_user');
    setUser(null);
  }, []);

  const value = { user, loading, login, register, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
