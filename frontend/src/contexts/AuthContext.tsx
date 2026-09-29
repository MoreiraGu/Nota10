import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UserRole } from '../types';
import { api, setStoredToken } from '../services/api';

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  perfil: UserRole;
  professorId?: string;
  estudanteId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser, token?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const cached = localStorage.getItem('nota10_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem('nota10_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.getMe();
        const role = me.perfil.toLowerCase() as UserRole;
        const restored: AuthUser = {
          id: String(me.usuario_id),
          nome: me.nome,
          email: '',
          perfil: role,
        };
        setUser(restored);
        localStorage.setItem('nota10_user', JSON.stringify(restored));
      } catch {
        setStoredToken(null);
        localStorage.removeItem('nota10_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const handleLogin = (newUser: AuthUser, token?: string) => {
    if (token) setStoredToken(token);
    setUser(newUser);
    localStorage.setItem('nota10_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setStoredToken(null);
    localStorage.removeItem('nota10_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
