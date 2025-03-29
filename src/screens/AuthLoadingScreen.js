/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
// screens/AuthLoadingScreen.js
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const AuthLoadingScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
      navigation.replace(user ? (user.type === 'student' ? 'Student' : 'Teacher') : 'Login');
  }, [user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
};

export default AuthLoadingScreen;
