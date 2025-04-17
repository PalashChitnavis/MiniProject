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
import StudentViewReportScreen from '../screens/StudentViewReportScreen';
import TeacherViewReportScreen from '../screens/TeacherViewReportScreen';
import CameraScreen from '../screens/CameraScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="AuthLoading">
          <Stack.Screen
            name="AuthLoading"
            component={AuthLoadingScreen}
            options={{headerLeft: () => null}}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{headerLeft: () => null}}
          />
          <Stack.Screen
            name="Student"
            component={StudentScreen}
            options={{headerLeft: () => null}}
          />
          <Stack.Screen
            name="Teacher"
            component={TeacherScreen}
            options={{headerLeft: () => null}}
          />
          <Stack.Screen
            name="ClassManagementStudent"
            component={ClassManagementStudent}
            options={{title: 'Class Management'}}
          />
          <Stack.Screen
            name="TeacherAttendanceSetup"
            component={TeacherAttendanceSetup}
            options={{title: 'Attendance Setup'}}
          />
          <Stack.Screen
            name="TeacherBluetoothScanScreen"
            component={TeacherBluetoothScanScreen}
            options={{title: 'Bluetooth Screen'}}
          />
          <Stack.Screen
            name="StudentBluetoothScanScreen"
            component={StudentBluetoothScanScreen}
            options={{title: 'Bluetooth Screen'}}
          />
          <Stack.Screen
            name="ClassManagementTeacher"
            component={ClassManagementTeacher}
            options={{title: 'Class Management'}}
          />
          <Stack.Screen
            name="StudentViewReportScreen"
            component={StudentViewReportScreen}
            options={{title: 'Attendance Report'}}
          />
          <Stack.Screen
            name="TeacherViewReportScreen"
            component={TeacherViewReportScreen}
            options={{title: 'Attendance Report'}}
          />
          <Stack.Screen
            name="CameraScreen"
            component={CameraScreen}
            options={{title: 'Camera'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

export default AppNavigator;
