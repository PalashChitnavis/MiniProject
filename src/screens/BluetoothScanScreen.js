/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Alert, Animated, Easing} from 'react-native';
import ButtonComponent from '../components/ButtonComponent';
// import FingerprintScanner from 'react-native-fingerprint-scanner';
import {
  isBluetoothEnabled,
  startBluetoothScanning,
  stopBluetoothScanning,
} from '../services/BluetoothService';
import { useAuth } from '../contexts/AuthContext';

const BluetoothScanScreen = ({navigation}) => {
  const {user} = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [deviceFound, setDeviceFound] = useState(false);
  const [scanAnimation] = useState(new Animated.Value(0));

  // Animation for scanning effect
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      scanAnimation.setValue(0);
    }
  }, [isScanning]);

  const handleStartScan = async () => {
    const btEnabled = await isBluetoothEnabled();
    if (!btEnabled) {
      Alert.alert(
        'Bluetooth Required',
        'Please turn on Bluetooth to give attendance.',
      );
      return;
    }

    setIsScanning(true);
    const classes = user.classes || [];
    startBluetoothScanning(classes , classData => {
      setIsScanning(false);
      setDeviceFound(true);
      handleDeviceFound(classData);
    });
  };

  const handleStopScan = () => {
    stopBluetoothScanning();
    setIsScanning(false);
  };

  const handleDeviceFound = classData => {
    Alert.alert(
      'Device Found',
      ` 
      Class : ${classData.className} 
      Teacher : ${classData.teacher}
      Authenticate to mark attendance.
      `,
      [
        {
          text: 'Authenticate',
          //onPress: () => authenticateWithFingerprint(classData),
        },
        {
          text: 'Rescan',
          onPress: () => {
            setDeviceFound(false);
            handleStartScan();
          },
        },
      ],
    );
  };

  // const authenticateWithFingerprint = async classData => {
  //   try {
  //     const result = await FingerprintScanner.authenticate({
  //       description: 'Scan your fingerprint to mark attendance',
  //     });

  //     if (result) {
  //       Alert.alert('Success', 'Attendance marked successfully!');
  //       console.log('Authentication success:', result);
  //       console.log('Class data:', classData);
  //       // Here you would typically send the attendance data to your backend
  //       navigation.goBack();
  //     }
  //   } catch (error) {
  //     console.log('Fingerprint error:', error);
  //     Alert.alert(
  //       'Authentication Failed',
  //       error.message || 'Could not verify fingerprint',
  //       [
  //         {
  //           text: 'Try Again',
  //           onPress: () => authenticateWithFingerprint(classData),
  //         },
  //         {
  //           text: 'Rescan Device',
  //           onPress: () => {
  //             setDeviceFound(false);
  //             handleStartScan();
  //           },
  //         },
  //       ],
  //     );
  //   } finally {
  //     FingerprintScanner.release();
  //   }
  // };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Scanning</Text>

      <View style={styles.animationContainer}>
        <Animated.Image
          source={require('../assets/images/abv.png')}
          style={[
            styles.bluetoothIcon,
            {
              transform: [
                {
                  rotate: scanAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
        <Text style={styles.statusText}>
          {isScanning
            ? 'Scanning for devices...'
            : deviceFound
            ? 'Device found!'
            : 'Ready to scan'}
        </Text>
      </View>

      <ButtonComponent
        title={isScanning ? 'Stop Scanning' : 'Start Scanning'}
        onPress={isScanning ? handleStopScan : handleStartScan}
        color={isScanning ? 'red' : 'green'}
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
    marginBottom: 40,
  },
  bluetoothIcon: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
});

export default BluetoothScanScreen;
