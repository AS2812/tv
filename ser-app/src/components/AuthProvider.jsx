import React, { createContext, useContext, useEffect, useState } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on mount
    async function checkAuth() {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  // Provide a login function to update state after successful login
  const updateUserAfterLogin = async () => {
    try {
      const userData = await getMe();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to get user data after login:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, updateUserAfterLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
