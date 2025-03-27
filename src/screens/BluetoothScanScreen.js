/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Alert, Animated, Easing} from 'react-native';
import ButtonComponent from '../components/ButtonComponent';
import {
  isBluetoothEnabled,
  startBluetoothScanning,
  stopBluetoothScanning,
} from '../services/BluetoothService';
import {useAuth} from '../contexts/AuthContext';
import { putAttendance } from '../services/DatabaseService';

const BluetoothScanScreen = ({navigation}) => {
  const {user} = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [deviceFound, setDeviceFound] = useState(false);
  const [circles] = useState([
    new Animated.Value(0),
    new Animated.Value(0.2),
    new Animated.Value(0.4),
  ]);

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
      circles.forEach(circle => circle.setValue(0));
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
    startBluetoothScanning(classes, classData => {
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
      Mark attendance.
      `,
      [
        {
          text: 'Mark',
          onPress: async () => {
            const result = await putAttendance(classData.teacher,classData.className,user.email,classData.random3DigitNumber);
            if(!result){
              Alert.alert('Error','Error marking attendance',[{
                text: 'Rescan',
                onPress: () => {
                  setDeviceFound(false);
                  handleStartScan();
                },
              }]);
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
      <View>
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
    justifyContent: 'center',
    marginBottom: 40,
    width: 150,
    height: 150,
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
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#009EFF',
  },
  statusText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default BluetoothScanScreen;
