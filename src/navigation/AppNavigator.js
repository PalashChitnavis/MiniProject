import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import StudentScreen from '../screens/StudentScreen';
import TeacherScreen from '../screens/TeacherScreen';
import LoginScreen from '../screens/LoginScreen';
import BluetoothScanScreen from '../screens/BluetoothScanScreen';
import TeacherBluetoothScanScreen from '../screens/TeacherBluetoothScanScreen';
import TeacherAttendanceSetup from '../screens/TeacherAttendanceSetup';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="StudentScreen" component={StudentScreen} />
        <Stack.Screen name="TeacherScreen" component={TeacherScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen
          name="BluetoothScanScreen"
          component={BluetoothScanScreen}
        />
        <Stack.Screen
          name="TeacherBluetoothScanScreen"
          component={TeacherBluetoothScanScreen}
        />
        <Stack.Screen
          name="TeacherAttendanceSetup"
          component={TeacherAttendanceSetup}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
