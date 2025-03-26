// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from '../contexts/AuthContext';
import AuthLoadingScreen from '../screens/AuthLoadingScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import StudentScreen from '../screens/StudentScreen';
import TeacherScreen from '../screens/TeacherScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="AuthLoading"
        >
          <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Student" component={StudentScreen} />
          <Stack.Screen name="Teacher" component={TeacherScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

export default AppNavigator;
