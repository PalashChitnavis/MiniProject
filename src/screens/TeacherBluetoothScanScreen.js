import React, {useState} from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import ButtonComponent from '../components/ButtonComponent';
import {
  isBluetoothEnabled,
  startBluetoothAdvertising,
  stopBluetoothAdvertising,
} from '../services/BluetoothService';

const TeacherBluetoothScanScreen = ({route, navigation}) => {
  const {data} = route.params;
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const {className, teacher, classSize} = data;

  const handleAttendancePress = async () => {
    const btEnabled = await isBluetoothEnabled();
    if (!btEnabled) {
      Alert.alert(
        'Bluetooth Required',
        'Please turn on Bluetooth to take attendance.',
      );
      return;
    }

    if (!isBroadcasting) {
      const classData = {
        className: className,
        teacher: teacher,
        classSize: classSize,
      };

      const started = await startBluetoothAdvertising(classData);

      if (started) {
        setIsBroadcasting(true);
        Alert.alert(
          'Broadcasting Started',
          'Your class is now visible to students for attendance',
        );
      } else {
        Alert.alert('Error', 'Failed to start Bluetooth broadcasting.');
      }
    } else {
      await stopBluetoothAdvertising();
      setIsBroadcasting(false);
      Alert.alert('Broadcasting Stopped', 'Attendance session ended');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Class Information</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Class : {className}</Text>
        <Text style={styles.infoText}>Teacher: {teacher}</Text>
        <Text style={styles.infoText}>Class Size: {classSize}</Text>
      </View>

      <ButtonComponent
        title={isBroadcasting ? 'Stop Attendance' : 'Start Attendance'}
        onPress={handleAttendancePress}
        color={isBroadcasting ? 'red' : 'green'}
      />

      <Text style={styles.statusText}>
        {isBroadcasting ? 'Broadcasting to students...' : 'Ready to broadcast'}
      </Text>
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    marginBottom: 30,
    elevation: 3,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default TeacherBluetoothScanScreen;
