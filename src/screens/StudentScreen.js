/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, {useEffect} from 'react';
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
import { getUser } from '../services/DatabaseService';

const {width} = Dimensions.get('window');
const BUTTON_WIDTH = width * 0.42; // Adjusted for grid
const BUTTON_HEIGHT = 180; // Taller buttons for better proportions

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
    navigation.navigate('StudentBluetoothScanScreen');
  };
  const handleEditClasses = () => {
    navigation.navigate('ClassManagementStudent');
  };
  const handleViewAttendance = () => {
    navigation.navigate('StudentViewReportScreen');
  };
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

  const getUserData = async () => {
    try {
      const userData = await getUser(user.email);
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(async () => {
    const dbUser = await getUserData();
    if(!dbUser.photoUrl){
      Alert.alert(
                  'No Photo Found',
                  'Please upload your profile picture for attendance verification',
                  [
                    {
                      text: 'Logout',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await signOutUser();
                          navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                          });
                        } catch (error) {
                          handleAuthError('Logout', error);
                        }
                      },
                    },
                    {
                      text: 'OK',
                      onPress: () => navigation.replace('CameraScreen', { first: true }),
                    },
                  ],
                  { cancelable: false } // User must press OK
                );
    }
  },[]);

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
      <View style={styles.infoTable}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>
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
    elevation: 10,
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
    padding: 10,
  },
  buttonImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoTable: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 30,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    textAlign: 'left',
    width: '30%',
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  infoValue: {
    textAlign: 'center',
    width: '70%',
    fontSize: 16,
    color: '#333',
  },
});

export default StudentScreen;
