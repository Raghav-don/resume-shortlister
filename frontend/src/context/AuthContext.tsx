import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, setAuthToken } from '../lib/api';

interface User {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        setAuthToken(token);
        setUser(JSON.parse(userData));
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, recruiter } = response.data;
    setAuthToken(accessToken);
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('user', JSON.stringify(recruiter));
    setUser(recruiter);
  };

  const register = async (fullName: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { fullName, email, password });
    const { accessToken, recruiter } = response.data;
    setAuthToken(accessToken);
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('user', JSON.stringify(recruiter));
    setUser(recruiter);
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}