import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import ButtonComponent from '../components/ButtonComponent';
import { isBluetoothEnabled, startBluetoothScanning, stopBluetoothScanning } from '../services/BluetoothService';

const StudentScreen = () => {
  const [isScanning, setIsScanning] = useState(false);

  const handleGiveAttendance = async () => {
    const btEnabled = await isBluetoothEnabled();
    if (!btEnabled) {
      Alert.alert('Bluetooth Required', 'Please turn on Bluetooth to give attendance.');
      return;
    }

    if (!isScanning) {
      startBluetoothScanning((classData) => {
        Alert.alert('Data Found', JSON.stringify(classData, null, 2));
      });
      setIsScanning(true);
    } else {
      stopBluetoothScanning();
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Attendance</Text>
      <ButtonComponent
        title={isScanning ? 'Stop Scanning' : 'Give Attendance'}
        onPress={handleGiveAttendance}
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default StudentScreen;
