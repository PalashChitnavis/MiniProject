import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import {cancelAttendance, putAttendance} from '../services/DatabaseService';

const AttendanceSection = ({
  attendanceData,
  classData,
  teacherCode,
  classCode,
}) => {
  const [activeTab, setActiveTab] = useState('present');

  const presentStudents = attendanceData || [];
  const absentStudents = classData?.filter(
    student => !attendanceData?.includes(student),
  );

  const handleCancelAttendance = async studentEmail => {
    try {
      await cancelAttendance(teacherCode, classCode, studentEmail);
      alert('Attendance cancelled successfully');
    } catch (error) {
      alert('Error cancelling attendance: ' + error.message);
    }
  };

  // You'll need to implement this function
  const handleMarkPresent = async studentEmail => {
    try {
      await putAttendance(teacherCode, classCode, studentEmail);
      alert('Attendance marked successfully');
    } catch (error) {
      alert('Error marking attendance: ' + error.message);
    }
  };

  return (
    <View style={styles.attendanceContainer}>
      {/* Toggle Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'present' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('present')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'present' && styles.activeTabText,
            ]}>
            Present ({presentStudents?.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'absent' && styles.activeTab]}
          onPress={() => setActiveTab('absent')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'absent' && styles.activeTabText,
            ]}>
            Absent ({absentStudents?.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {activeTab === 'present' ? (
        presentStudents.length > 0 ? (
          <ScrollView
            style={styles.studentsList}
            persistentScrollbar={true}
            showsVerticalScrollIndicator={true}>
            {presentStudents.map((student, index) => (
              <View key={index} style={styles.studentItem}>
                <Text style={styles.studentText}>
                  {student.split('@')[0].replace('_', ' ').toUpperCase()}
                </Text>
                <TouchableOpacity
                  onPress={() => handleCancelAttendance(student)}
                  style={styles.actionButton}>
                  <Image
                    source={require('../assets/images/clock.png')}
                    style={styles.actionImage}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noStudentsText}>
            No students marked present yet
          </Text>
        )
      ) : absentStudents.length > 0 ? (
        <ScrollView
          style={styles.studentsList}
          persistentScrollbar={true}
          showsVerticalScrollIndicator={true}>
          {absentStudents.map((student, index) => (
            <View key={index} style={styles.studentItem}>
              <Text style={styles.studentText}>
                {student.split('@')[0].replace('_', ' ').toUpperCase()}
              </Text>
              <TouchableOpacity
                onPress={() => handleMarkPresent(student)}
                style={styles.actionButton}>
                <Image
                  source={require('../assets/images/clock.png')}
                  style={styles.actionImage}
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noStudentsText}>All students are present</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  attendanceContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    width: '100%',
    minHeight: 200,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
    marginTop: 10,
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
  studentsList: {
    width: '100%',
  },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  studentText: {
    fontSize: 16,
    flex: 1,
  },
  actionButton: {
    padding: 8,
    marginLeft: 10,
  },
  actionImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  noStudentsText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 14,
    paddingVertical: 20,
  },
});

export default AttendanceSection;
