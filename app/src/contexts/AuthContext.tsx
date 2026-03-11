import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AuthState {
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (authId: string, authPassword: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadAuth(): AuthState {
  const authId = localStorage.getItem('waltz_auth_id') ?? '';
  const authPassword = localStorage.getItem('waltz_auth_password') ?? '';
  return {
    isAuthenticated: authId !== '' && authPassword !== '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadAuth);

  const login = useCallback((authId: string, authPassword: string) => {
    localStorage.setItem('waltz_auth_id', authId);
    localStorage.setItem('waltz_auth_password', authPassword);
    setAuth({ isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('waltz_auth_id');
    localStorage.removeItem('waltz_auth_password');
    setAuth({ isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
