/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  AppState,
} from 'react-native';
import ButtonComponent from '../components/ButtonComponent';
import {
  isBluetoothEnabled,
  startBluetoothScanning,
  stopBluetoothScanning,
} from '../services/BluetoothService';
import {useAuth} from '../contexts/AuthContext';
import {studentPutsAttendance, getUser} from '../services/DatabaseService';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
// import deviceInfo from 'react-native-device-info';
import DeviceInfo from 'react-native-device-info';
import {firebase} from '@react-native-firebase/app';
import '@react-native-firebase/installations';
// import { PermissionsAndroid } from 'react-native';

const StudentBluetoothScanScreen = () => {
  const {user} = useAuth();
  const navigation = useNavigation();
  const [isScanning, setIsScanning] = useState(false);
  const [deviceFound, setDeviceFound] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [firebaseDeviceId, setFirebaseDeviceId] = useState(null);
  const [isDeviceValid, setIsDeviceValid] = useState(null);
  const [circles] = useState([
    new Animated.Value(0),
    new Animated.Value(0.2),
    new Animated.Value(0.4),
  ]);
  const [updatedUser, setUpdatedUser] = useState(user);

  // Fetch device IDs on mount
  useEffect(() => {
    const fetchDeviceIds = async () => {
      try {
        // await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);

        setIsProcessing(true);
        // const deviceId = await deviceInfo.getUniqueId();
        // const deviceId = await firebase.installations().getId();
        const deviceId = await DeviceInfo.getImei();

        setCurrentDeviceId(deviceId);

        if (!user?.email) {
          throw new Error('User email not available');
        }

        const dbUser = await getUser(user.email);
        setUpdatedUser(dbUser);
        setFirebaseDeviceId(dbUser.deviceId || null);
        setIsDeviceValid(dbUser.deviceId && deviceId === dbUser.deviceId);
      } catch (error) {
        console.error('Error fetching device IDs:', error);
        Alert.alert('Error', 'Failed to verify device. Please try again.');
        setIsDeviceValid(false);
      } finally {
        setIsProcessing(false);
      }
    };

    fetchDeviceIds();
  }, [user?.email]);

  // Stop scanning and animations
  const stopScanning = useCallback(() => {
    stopBluetoothScanning();
    setIsScanning(false);
    setDeviceFound(false);
    circles.forEach(circle => circle.stopAnimation());
    circles.forEach(circle => circle.setValue(0));
  }, [circles]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = nextAppState => {
      if (nextAppState === 'background' && isScanning) {
        stopScanning();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [isScanning, stopScanning]);

  // Stop scanning when screen loses focus or unmounts
  useFocusEffect(
    useCallback(() => {
      return () => {
        stopScanning();
      };
    }, [stopScanning]),
  );

  // Handle animations
  useEffect(() => {
    if (isScanning) {
      const animations = circles.map((circle, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(circle, {
              toValue: 1,
              duration: 2000,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
            Animated.timing(circle, {
              toValue: 0,
              duration: 0,
              useNativeDriver: false,
            }),
          ]),
        ),
      );
      Animated.stagger(600, animations).start();
    } else {
      circles.forEach(circle => circle.stopAnimation());
      circles.forEach(circle => circle.setValue(0));
    }

    return () => {
      circles.forEach(circle => circle.stopAnimation());
    };
  }, [isScanning, circles]);

  const handleStartScan = async () => {
    if (isProcessing || isScanning || !isDeviceValid) return;
    setIsProcessing(true);

    try {
      const btEnabled = await isBluetoothEnabled();
      if (!btEnabled) {
        Alert.alert(
          'Bluetooth Required',
          'Please turn on Bluetooth to give attendance.',
        );
        return;
      }

      const classes = Array.isArray(user.classes) ? user.classes : [];
      if (classes.length === 0) {
        Alert.alert('No Classes', 'You are not enrolled in any classes.');
        return;
      }

      setIsScanning(true);
      startBluetoothScanning(classes, bluetoothData => {
        if (!bluetoothData?.classCode || !bluetoothData?.teacherCode) {
          stopScanning();
          Alert.alert('Error', 'Invalid device data received.');
          return;
        }
        setIsScanning(false);
        setDeviceFound(true);
        handleDeviceFound(bluetoothData);
      }).catch(error => {
        stopScanning();
        Alert.alert(
          'Error',
          error.message || 'Failed to start Bluetooth scanning.',
        );
      });
    } catch (error) {
      stopScanning();
      Alert.alert('Error', 'Unable to check Bluetooth status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopScan = () => {
    stopScanning();
  };

  const handleDeviceFound = bluetoothData => {
    Alert.alert(
      'Device Found',
      `Class: ${bluetoothData.classCode}\nTeacher: ${bluetoothData.teacherCode}\nMark attendance.`,
      [
        {
          text: 'Mark',
          onPress: async () => {
            const proceed = await new Promise(resolve => {
              Alert.alert(
                'Photo Verification',
                'Please take a photo to verify your identity',
                [
                  {
                    text: 'Continue',
                    onPress: () => resolve(true),
                  },
                  {
                    text: 'Cancel',
                    onPress: () => resolve(false),
                    style: 'cancel',
                  },
                ],
                {cancelable: false},
              );
            });

            if (!proceed) {
              setDeviceFound(false);
              handleStartScan();
              return;
            }

            try {
              navigation.navigate('CameraScreen', {
                first: false,
                photoUrl: updatedUser.photoUrl,
                onPhotoVerified: async isVerified => {
                  if (isVerified) {
                    try {
                      const result = await studentPutsAttendance(
                        bluetoothData.teacherCode,
                        bluetoothData.classCode,
                        user.email,
                      );
                      if (result) {
                        Alert.alert(
                          'Success',
                          'Attendance marked successfully!',
                        );
                        navigation.replace('Student');
                      } else {
                        throw new Error('Attendance marking returned false');
                      }
                    } catch (error) {
                      Alert.alert(
                        'Error',
                        error.message || 'Failed to mark attendance.',
                      );
                      setDeviceFound(false);
                    }
                  } else {
                    setDeviceFound(false);
                  }
                },
              });
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to navigate to verification screen.',
              );
              setDeviceFound(false);
            }
          },
        },
        {
          text: 'Rescan',
          onPress: () => {
            setDeviceFound(false);
            handleStartScan();
          },
        },
      ],
      {cancelable: false},
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Scanning</Text>

      <View style={styles.animationContainer}>
        {circles.map((circle, index) => (
          <Animated.View
            key={index}
            style={[
              styles.circle,
              {
                opacity: circle.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 0],
                }),
                transform: [
                  {
                    scale: circle.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 3],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}

        <View style={styles.bluetoothIconContainer}>
          <Animated.Image
            source={require('../assets/images/bluetooth.png')}
            style={styles.bluetoothIcon}
          />
        </View>
      </View>

      <View style={styles.deviceIdContainer}>
        <Text style={styles.deviceIdText}>
          Current Device ID: {currentDeviceId || 'Loading...'}
        </Text>
        <Text style={styles.deviceIdText}>
          Registered Device ID: {firebaseDeviceId || 'Not set'}
        </Text>
      </View>

      <View>
        <Text style={styles.statusText}>
          {isScanning
            ? 'Scanning for devices...'
            : deviceFound
            ? 'Device found!'
            : isDeviceValid === null
            ? 'Verifying device...'
            : isDeviceValid
            ? 'Ready to scan'
            : 'This device isn’t your primary device'}
        </Text>
      </View>

      <ButtonComponent
        title={isScanning ? 'Stop Scanning' : 'Start Scanning'}
        onPress={isScanning ? handleStopScan : handleStartScan}
        color={isScanning ? 'red' : 'green'}
        disabled={isProcessing || !isDeviceValid}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    width: 200,
    height: 200,
  },
  bluetoothIconContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bluetoothIcon: {
    width: 80,
    height: 80,
  },
  circle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 75,
    backgroundColor: '#009EFF',
  },
  statusText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
  deviceIdContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deviceIdText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default StudentBluetoothScanScreen;
