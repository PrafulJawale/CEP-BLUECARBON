import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, type UserResponse, ApiError, UserResponseSchema, TokenSchema } from '@/lib/api';

export type FrontendUserRole = 'admin' | 'government_officer' | 'project_developer' | 'buyer' | 'researcher' | 'community_representative';

export type UserRole = FrontendUserRole;

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: FrontendUserRole;
  organization?: string;
  status: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role: FrontendUserRole;
  organization?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function mapBackendRoleToFrontend(role: string): FrontendUserRole {
  const roleMap: Record<string, FrontendUserRole> = {
    admin: 'admin',
    government_officer: 'government_officer',
    project_developer: 'project_developer',
    buyer: 'buyer',
    researcher: 'researcher',
    community_representative: 'community_representative',
  };
  return roleMap[role] || 'project_developer';
}

function mapBackendUserToFrontend(user: UserResponse): User {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: mapBackendRoleToFrontend(user.role),
    organization: user.organization || undefined,
    status: user.status,
    last_login_at: user.last_login_at || undefined,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api.get('/auth/me', UserResponseSchema);
      setUser(mapBackendUserToFrontend(response));
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        try {
          await api.post('/auth/refresh', {});
          const response = await api.get('/auth/me', UserResponseSchema);
          setUser(mapBackendUserToFrontend(response));
          return true;
        } catch {
          setUser(null);
          return false;
        }
      }
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await api.post('/auth/login', { email, password }, TokenSchema);
      const response = await api.get('/auth/me', UserResponseSchema);
      setUser(mapBackendUserToFrontend(response));
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await api.post('/auth/register', {
        email: userData.email,
        password: userData.password,
        full_name: userData.full_name,
        role: userData.role,
        organization: userData.organization,
        phone: userData.phone,
      });
      const response = await api.get('/auth/me', UserResponseSchema);
      setUser(mapBackendUserToFrontend(response));
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        refreshSession,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};