/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import ButtonComponent from '../components/ButtonComponent';
import { TouchableOpacity, Image } from 'react-native';

import {
  isBluetoothEnabled,
  startBluetoothAdvertising,
  stopBluetoothAdvertising,
} from '../services/BluetoothService';
import {
  createTeacherAttendance,
  getAttendanceTeacher,
} from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';
import AttendanceSection from '../components/AttendanceSection';

const TeacherBluetoothScanScreen = ({ route, navigation }) => {
  const { data } = route.params;
  const { user } = useAuth();
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [circles] = useState([
    new Animated.Value(0),
    new Animated.Value(0.2),
    new Animated.Value(0.4),
  ]);
  const [random3DigitNumber, setRandom3DigitNumber] = useState(0);

  const [attendanceData, setAttendanceData] = useState(['imt_2022001@iiitm.ac.in','imt_2022002@iiitm.ac.in','imt_2022003@iiitm.ac.in','imt_2022004@iiitm.ac.in','imt_2022005@iiitm.ac.in','imt_2022006@iiitm.ac.in','imt_2022007@iiitm.ac.in','imt_2022008@iiitm.ac.in','imt_2022009@iiitm.ac.in','imt_2022010@iiitm.ac.in','imt_2022011@iiitm.ac.in','imt_2022012@iiitm.ac.in','imt_2022013@iiitm.ac.in']);

  const classData = ['imt_2022001@iiitm.ac.in','imt_2022002@iiitm.ac.in','imt_2022003@iiitm.ac.in','imt_2022004@iiitm.ac.in','imt_2022005@iiitm.ac.in','imt_2022006@iiitm.ac.in','imt_2022007@iiitm.ac.in','imt_2022008@iiitm.ac.in','imt_2022009@iiitm.ac.in','imt_2022010@iiitm.ac.in','imt_2022011@iiitm.ac.in','imt_2022012@iiitm.ac.in','imt_2022013@iiitm.ac.in','imt_2022014@iiitm.ac.in','imt_2022016@iiitm.ac.in','imt_2022015@iiitm.ac.in'];

  const { classCode, teacher, classSize } = data;

  const handleRefresh = async () => {
    console.log('Refresh button clicked');
    await getAttendanceTeacher(teacher, classCode, random3DigitNumber).then(
      (d) => {
        setAttendanceData(d.present);
      },
    );
    //console.log(attendanceData);
  };

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
      circles.forEach((circle) => circle.setValue(0));
    }
  }, [isBroadcasting]);

  useEffect(() => {
    setRandom3DigitNumber(Math.floor(Math.random() * 900) + 100);
  }, []);

  // useEffect(()=>{
  //   console.log(attendanceData);
  // },[attendanceData]);

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
      const bluetoothData = {
        classCode: classCode,
        teacher: teacher,
        classSize: classSize,
      };

      await createTeacherAttendance(
        user.email,
        classCode,
        user.facultyAbbreviation,
      );

      const started = await startBluetoothAdvertising(classData);

      if (started) {
        setAttendanceData(
          getAttendanceTeacher(teacher, classCode, random3DigitNumber),
        );
        setIsBroadcasting(true);
      }
    } else {
      await stopBluetoothAdvertising();
      setIsBroadcasting(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        {/* Bluetooth Animation Section */}
        <View style={styles.animationSection}>
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

          <Text style={styles.statusText}>
            {isBroadcasting
              ? 'Broadcasting to students...'
              : 'Ready to broadcast'}
          </Text>
        </View>

        {/* Class Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Class:</Text>
              <Text style={styles.infoValue}>{classCode}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teacher:</Text>
              <Text style={styles.infoValue}>{teacher}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Class Size:</Text>
              <Text style={styles.infoValue}>
                {classSize.charAt(0).toUpperCase() + classSize.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Attendance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Attendance Record</Text>
            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.refreshButton}
              activeOpacity={0.7}
            >
              <Image
                source={require('../assets/images/refresh.png')}
                style={styles.refreshIcon}
              />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          <AttendanceSection attendanceData={attendanceData} classData={classData}/>
        </View>
      </View>
      {/* Action Button - moved outside ScrollView */}
      <View style={styles.buttonContainer}>
        <ButtonComponent
          title={isBroadcasting ? 'Stop Attendance' : 'Start Attendance'}
          onPress={handleAttendancePress}
          color={isBroadcasting ? '#e74c3c' : '#2ecc71'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingBottom: 100, // Add padding to prevent button from covering content
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  section: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  infoSection: {
    width: '80%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    paddingLeft: 5,
  },
  animationSection: {
    alignItems: 'center',
    marginBottom: 20,
    height: 100,
    width: '100%',
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  bluetoothIconContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bluetoothIcon: {
    width: 60,
    height: 60,
  },
  circle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 60,
    backgroundColor: '#3498db',
  },
  statusText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  attendanceContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    width: '100%',
    minHeight: 200,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
    marginTop: 10,
  },
  presentList: {
    width: '100%',
  },
  presentListContent: {
    paddingBottom: 10,
  },
  studentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  studentText: {
    fontSize: 15,
    color: '#34495e',
  },
  noStudentsText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 15,
    paddingVertical: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between', // This ensures maximum space between items
    alignItems: 'center', // Vertically centers items
    width: '100%', // Takes full width
  },
  refreshButton: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2980b9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  refreshIcon: {
    width: 16,
    height: 16,
    tintColor: 'white',
    marginRight: 5,
  },
  refreshText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3498db',
  },
  tabText: {
    color: '#7f8c8d',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3498db',
    fontWeight: '600',
  },
});

export default TeacherBluetoothScanScreen;
