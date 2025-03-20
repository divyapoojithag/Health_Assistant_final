import React, { createContext, useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

interface UserProfile {
  username: string;
  id: number;
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
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const login = (userData: UserProfile) => {
    setIsAuthenticated(true);
    setUserProfile(userData);
  };

  const logout = async () => {
    try {
      // First, check if we're already on the feedback page
      if (location.pathname.includes('/feedback')) {
        return; // Don't do anything if we're already on feedback
      }

      // Call backend logout endpoint
      const response = await axios.post('http://localhost:8080/health_assistant/logout', {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Clear frontend auth state
        setIsAuthenticated(false);
        setUserProfile(null);
        
        // Navigate to feedback page
        navigate('/feedback');
      } else {
        console.error('Logout failed:', response.data.message);
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if the backend call fails, we should still clear local state and redirect
      setIsAuthenticated(false);
      setUserProfile(null);
      navigate('/feedback');
    }
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
