import React, { createContext, useContext, useState } from 'react';

interface UserProfile {
  username: string;
  userType: 'admin' | 'user';
  healthCondition: string;
  age: number;
  weight: number;
  height: number;
  allergies: string[];
  surgicalHistory: string[];
  medicinePrescribed: string[];
  bloodGroup: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  login: (userData: UserProfile) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const login = (userData: UserProfile) => {
    setIsAuthenticated(true);
    setUserProfile(userData);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserProfile(null);
  };

  const isAdmin = () => {
    return userProfile?.userType === 'admin';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userProfile, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
