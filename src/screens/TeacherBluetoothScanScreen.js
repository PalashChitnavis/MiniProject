import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Alert, Animated, Easing} from 'react-native';
import ButtonComponent from '../components/ButtonComponent';
import {
  isBluetoothEnabled,
  startBluetoothAdvertising,
  stopBluetoothAdvertising,
} from '../services/BluetoothService';

const TeacherBluetoothScanScreen = ({route, navigation}) => {
  const {data} = route.params;
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [circles] = useState([
    new Animated.Value(0),
    new Animated.Value(0.2),
    new Animated.Value(0.4),
  ]);

  const {className, teacher, classSize} = data;

  useEffect(() => {
    if (isBroadcasting) {
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
  }, [isBroadcasting]);

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
        className,
        teacher,
        classSize,
      };

      const started = await startBluetoothAdvertising(classData);

      if (started) {
        setIsBroadcasting(true);
        // Alert.alert(
        //   'Broadcasting Started',
        //   'Your class is now visible to students for attendance.',
        // );
      } else {
        // Alert.alert('Error', 'Failed to start Bluetooth broadcasting.');
      }
    } else {
      await stopBluetoothAdvertising();
      setIsBroadcasting(false);
      // Alert.alert('Broadcasting Stopped', 'Attendance session ended.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Class Information</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Class: {className}</Text>
        <Text style={styles.infoText}>Teacher: {teacher}</Text>
        <Text style={styles.infoText}>Class Size: {classSize}</Text>
      </View>

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
          {isBroadcasting
            ? 'Broadcasting to students...'
            : 'Ready to broadcast'}
        </Text>
      </View>

      <ButtonComponent
        title={isBroadcasting ? 'Stop Attendance' : 'Start Attendance'}
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
    zIndex: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 100,
    marginTop: 100,
    width: 50,
    height: 50,
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
    width: 100,
    height: 100,
    borderRadius: 75,
    zIndex: 0,
    backgroundColor: '#009EFF',
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default TeacherBluetoothScanScreen;
