import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import ButtonComponent from '../components/ButtonComponent';
import TeacherAttendanceFormInput from '../components/TeacherAttendanceFormInput';
import { Picker } from '@react-native-picker/picker';
import { isBluetoothEnabled, startBluetoothAdvertising, stopBluetoothAdvertising } from '../services/BluetoothService';

const TeacherScreen = () => {
  const [courseBatchName, setCourseBatchName] = useState('');
  const [classSize, setClassSize] = useState('small');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [bluetoothWarning, setBluetoothWarning] = useState(false);

  const handleAttendancePress = async () => {
    if (!courseBatchName) {
      setBluetoothWarning(true);
      return;
    }
    setBluetoothWarning(false);

    const btEnabled = await isBluetoothEnabled();
    if (!btEnabled) {
      Alert.alert('Bluetooth Required', 'Please turn on Bluetooth to take attendance.');
      return;
    }

    if (!isBroadcasting) {
      // ✅ Prepare structured session data
      const sessionData = {
        courseBatchName: courseBatchName,
        teacher: 'AT', // Assume the teacher is always Dr. John Doe
        classSize: classSize.charAt(0).toUpperCase(), // "small" -> "S", "medium" -> "M", "large" -> "L"
      };

      console.log('Generated Session Data:', sessionData);
      const started = await startBluetoothAdvertising(sessionData);

      if (started) {
        setIsBroadcasting(true);
      } else {
        Alert.alert('Error', 'Failed to start Bluetooth broadcasting.');
      }
    } else {
      // Stop broadcasting
      stopBluetoothAdvertising();
      setIsBroadcasting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TeacherAttendanceFormInput
        label="Course and Batch Name"
        value={courseBatchName}
        onChangeText={setCourseBatchName}
        placeholder="Enter course and batch"
      />

      {/* 🔹 Class Size Picker */}
      <Text style={styles.label}>Class Size</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={classSize}
          onValueChange={(itemValue) => setClassSize(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Small (1-30)" value="small" />
          <Picker.Item label="Medium (31-60)" value="medium" />
          <Picker.Item label="Large (61+)" value="large" />
        </Picker>
      </View>

      {bluetoothWarning && <Text style={styles.warning}>Please enter all details.</Text>}

      <ButtonComponent
        title={isBroadcasting ? 'Stop Attendance' : 'Take Attendance'}
        onPress={handleAttendancePress}
        color={isBroadcasting ? 'red' : 'green'}
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    display: 'flex',
    alignSelf: 'flex-start',
    paddingLeft: 40,
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 8,
    width: '80%',
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  warning: {
    color: 'red',
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TeacherScreen;
