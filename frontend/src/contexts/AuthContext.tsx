import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth';
import type { User, LoginData, RegisterData } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário salvo no localStorage
    const storedUser = authService.getStoredUser();
    const storedToken = authService.getStoredToken();
    
    if (storedUser && storedToken) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (data: LoginData) => {
    const response = await authService.login(data);
    authService.saveAuth(response);
    setUser(response.user);
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    authService.saveAuth(response);
    setUser(response.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
