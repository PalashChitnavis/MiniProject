// navigation/AppNavigator.js
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {AuthProvider} from '../contexts/AuthContext';
import AuthLoadingScreen from '../screens/AuthLoadingScreen';
import LoginScreen from '../screens/LoginScreen';
import StudentScreen from '../screens/StudentScreen';
import TeacherScreen from '../screens/TeacherScreen';
import TeacherAttendanceSetup from '../screens/TeacherAttendanceSetup';
import TeacherBluetoothScanScreen from '../screens/TeacherBluetoothScanScreen';
import ClassManagementTeacher from '../screens/ClassManagementTeacher';
import ClassManagementStudent from '../screens/ClassManagementStudent';
import StudentBluetoothScanScreen from '../screens/StudentBluetoothScanScreen';
import StudentAttendanceReport from '../screens/StudentAttendanceReport';
import StudentViewReportScreen from '../screens/StudentViewReportScreen';
import TeacherViewReportScreen from '../screens/TeacherViewReportScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="AuthLoading">
          <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Student" component={StudentScreen} />
          <Stack.Screen
            name="StudentAttendanceReport"
            component={StudentAttendanceReport}
          />
          <Stack.Screen name="Teacher" component={TeacherScreen} />
          <Stack.Screen
            name="ClassManagementStudent"
            component={ClassManagementStudent}
          />
          <Stack.Screen
            name="TeacherAttendanceSetup"
            component={TeacherAttendanceSetup}
          />
          <Stack.Screen
            name="TeacherBluetoothScanScreen"
            component={TeacherBluetoothScanScreen}
          />
          <Stack.Screen
            name="StudentBluetoothScanScreen"
            component={StudentBluetoothScanScreen}
          />
          <Stack.Screen
            name="ClassManagementTeacher"
            component={ClassManagementTeacher}
          />
          <Stack.Screen
            name="StudentViewReportScreen"
            component={StudentViewReportScreen}
          />
          <Stack.Screen
            name="TeacherViewReportScreen"
            component={TeacherViewReportScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

export default AppNavigator;
