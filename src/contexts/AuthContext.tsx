import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'NGO' | 'Panchayat' | 'Govt Officer' | 'Researcher' | 'Buyer' | 'Admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  organization?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'createdAt'> & { password: string }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize with sample data if localStorage is empty
    const users = localStorage.getItem('bluecarbon_users');
    if (!users) {
      const sampleUsers = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@nccr.gov.in',
          password: 'admin123',
          role: 'Admin' as UserRole,
          organization: 'NCCR',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          username: 'ngo_user',
          email: 'ngo@example.org',
          password: 'ngo123',
          role: 'NGO' as UserRole,
          organization: 'Green Earth Foundation',
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem('bluecarbon_users', JSON.stringify(sampleUsers));
    }

    // Check if user is logged in
    const currentUser = localStorage.getItem('bluecarbon_current_user');
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('bluecarbon_users') || '[]');
    const foundUser = users.find((u: any) => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('bluecarbon_current_user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('bluecarbon_users') || '[]');
    
    // Check if user already exists
    if (users.find((u: any) => u.email === userData.email)) {
      return false;
    }

    const newUser = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem('bluecarbon_users', JSON.stringify(users));

    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('bluecarbon_current_user', JSON.stringify(userWithoutPassword));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bluecarbon_current_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};