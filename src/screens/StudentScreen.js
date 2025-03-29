/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import {signOutUser} from '../services/FirebaseService';
import {useAuth} from '../contexts/AuthContext';

const {width} = Dimensions.get('window');
const BUTTON_WIDTH = width * 0.44; // Adjusted for grid
const BUTTON_HEIGHT = 250; // Taller buttons for better proportions

// Placeholder image paths - replace with your actual image paths
const IMAGES = {
  attendance: require('../assets/images/attendance.png'),
  edit: require('../assets/images/teacher.png'),
  history: require('../assets/images/clock.png'),
  logout: require('../assets/images/logout.png'),
};

const StudentScreen = ({navigation}) => {
  const {user} = useAuth();
  // Placeholder functions
  const handleGiveAttendance = () => {
    navigation.navigate('BluetoothScanScreen');
  };
  const handleEditClasses = () => {
    navigation.navigate('ClassManagementStudent');
  };
  const handleViewAttendance = () => console.log('View Attendance pressed');
  const handleLogout = async () => {
    try {
      await signOutUser();
      navigation.replace('Login');
      handleLogoutSuccess();
    } catch (error) {
      handleAuthError('Logout', error);
    }
  };

  const handleLogoutSuccess = () => {
    Alert.alert('Logged out', 'You have been successfully logged out');
  };

  const handleAuthError = (operation, error) => {
    Alert.alert(`${operation} Error`, error.message);
    console.log(`${operation} error:`, error);
  };

  const SectionButton = ({image, title, onPress, color}) => (
    <TouchableOpacity
      style={[
        styles.button,
        {backgroundColor: 'white', borderColor: color, shadowColor: color},
      ]}
      onPress={onPress}>
      <View style={styles.buttonContent}>
        <Image source={image} style={styles.buttonImage} />
        <Text style={[styles.buttonText, {color: 'black'}]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Student Dashboard</Text>
      <Text style={styles.subheader}>{user.email}</Text>
      <View style={styles.gridContainer}>
        <View style={styles.row}>
          <SectionButton
            image={IMAGES.attendance}
            title="Give Attendance"
            onPress={handleGiveAttendance}
            color="#4CAF50" // Green
          />
          <SectionButton
            image={IMAGES.edit}
            title="Edit Classes"
            onPress={handleEditClasses}
            color="#2196F3" // Blue
          />
        </View>

        <View style={styles.row}>
          <SectionButton
            image={IMAGES.history}
            title="View Attendance"
            onPress={handleViewAttendance}
            color="#FF9800" // Orange
          />
          <SectionButton
            image={IMAGES.logout}
            title="Logout"
            onPress={handleLogout}
            color="#F44336" // Red
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    paddingTop: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 0,
    textAlign: 'center',
  },
  subheader: {
    fontSize: 20,
    fontWeight: 'normal',
    color: '#333',
    marginBottom: 0,
    textAlign: 'center',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonContent: {
    alignItems: 'center',
    display: 'flex',
    width: '100%',
    height: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
  },
  buttonImage: {
    width: 130,
    height: 130,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default StudentScreen;
