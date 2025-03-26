/* eslint-disable react-hooks/exhaustive-deps */
// contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const storeUser = async (userData) => {
    try {
      await AsyncStorage.setItem('@user', JSON.stringify(userData));
      setUser(userData);
    } catch (e) {
      console.error('Error saving user', e);
    }
  };

  // Check for existing user on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('@user');
        if (userString) {
          setUser(JSON.parse(userString));
        }
      } catch (error) {
        console.error('Error loading user', error);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, storeUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
